import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CORE_FIELDS = new Set([
  "full_name", "phone", "email", "source", "project_type", "property_type",
  "location", "budget_range", "timeline", "style_preference", "raw_inquiry", "brief",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { rows, mapping } = await req.json();
    if (!Array.isArray(rows) || !mapping || typeof mapping !== "object") {
      return new Response(JSON.stringify({ error: "rows[] and mapping{} required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (rows.length > 1000) {
      return new Response(JSON.stringify({ error: "Max 1000 rows per import" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const inserted: string[] = [];
    const skipped: string[] = [];

    for (const row of rows) {
      const lead: Record<string, unknown> = { source: "imported", custom_fields: {} as Record<string, unknown> };
      const custom: Record<string, unknown> = {};

      for (const [csvCol, target] of Object.entries(mapping as Record<string, string>)) {
        const value = row[csvCol];
        if (value === undefined || value === null || value === "") continue;
        if (target === "skip") continue;
        if (target === "custom") {
          custom[csvCol] = value;
        } else if (CORE_FIELDS.has(target)) {
          lead[target] = value;
        } else {
          custom[csvCol] = value;
        }
      }

      // Preserve any unmapped CSV columns as custom fields
      for (const [csvCol, value] of Object.entries(row)) {
        if (mapping[csvCol]) continue;
        if (value === undefined || value === null || value === "") continue;
        custom[csvCol] = value;
      }

      lead.custom_fields = custom;

      if (!lead.full_name) {
        skipped.push(JSON.stringify(row).slice(0, 100));
        continue;
      }
      if (!lead.email) lead.email = `unknown+${crypto.randomUUID().slice(0, 8)}@import.avitus`;
      lead.raw_inquiry = lead.raw_inquiry || lead.brief || null;

      const { data, error } = await supabase.from("leads").insert(lead).select("id").single();
      if (error) {
        console.error("import row error", error.message);
        skipped.push(error.message);
        continue;
      }
      inserted.push(data.id);
    }

    // Fire score-lead in background, capped concurrency (best-effort)
    const concurrency = 3;
    let i = 0;
    const runNext = async (): Promise<void> => {
      while (i < inserted.length) {
        const id = inserted[i++];
        try {
          await supabase.functions.invoke("score-lead", { body: { lead_id: id } });
        } catch (e) {
          console.error("score-lead invoke fail", id, e);
        }
      }
    };
    // Don't await — return immediately so the UI is responsive
    void Promise.all(Array.from({ length: concurrency }, runNext));

    return new Response(JSON.stringify({ ok: true, inserted: inserted.length, skipped: skipped.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("import-leads error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});