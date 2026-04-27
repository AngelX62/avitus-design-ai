import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { lead_id } = await req.json();
    if (!lead_id) throw new Error("lead_id required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const [{ data: lead }, { data: studio }] = await Promise.all([
      supabase.from("leads").select("*").eq("id", lead_id).maybeSingle(),
      supabase.from("studio_settings").select("*").limit(1).maybeSingle(),
    ]);
    if (!lead) throw new Error("Lead not found");

    const studioContext = studio
      ? `Studio: ${studio.studio_name}. Ideal client: ${studio.ideal_client || "n/a"}. Target budget: $${studio.target_budget_min || 0}–$${studio.target_budget_max || 0}. Signature styles: ${(studio.signature_styles || []).join(", ")}.`
      : "";

    const leadDescription = `Name: ${lead.full_name}
Email: ${lead.email}
Project type: ${lead.project_type || "n/a"}
Rooms: ${(lead.rooms || []).join(", ") || "n/a"}
Budget: ${lead.budget_range || "n/a"}
Timeline: ${lead.timeline || "n/a"}
Location: ${lead.location || "n/a"}
Brief: ${lead.brief || "n/a"}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a senior business development analyst at an interior design studio. ${studioContext}
Analyse incoming leads with calm, expert judgment. Be honest about fit. The reply draft should sound warm, considered, never salesy — like an editor's note, in 3–5 short paragraphs, signed "The studio".`,
          },
          { role: "user", content: `Analyse this lead:\n\n${leadDescription}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "submit_analysis",
            description: "Submit lead analysis",
            parameters: {
              type: "object",
              properties: {
                fit_score: { type: "integer", minimum: 0, maximum: 100, description: "0-100 fit score against studio profile" },
                summary: { type: "string", description: "One sentence, max 25 words." },
                next_action: { type: "string", description: "Concrete next step the designer should take." },
                reply_draft: { type: "string", description: "Personalised email reply, 3-5 short paragraphs." },
                red_flags: { type: "array", items: { type: "string" }, description: "Concerns. Empty array if none." },
              },
              required: ["fit_score", "summary", "next_action", "reply_draft", "red_flags"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "submit_analysis" } },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI error", aiRes.status, t);
      if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiRes.status === 402) return new Response(JSON.stringify({ error: "Add credits to your Lovable AI workspace" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error");
    }

    const data = await aiRes.json();
    const args = JSON.parse(data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments || "{}");

    await supabase.from("leads").update({
      fit_score: args.fit_score,
      ai_summary: args.summary,
      ai_next_action: args.next_action,
      ai_reply_draft: args.reply_draft,
      ai_red_flags: args.red_flags || [],
      ai_processed_at: new Date().toISOString(),
    }).eq("id", lead_id);

    return new Response(JSON.stringify({ ok: true, ...args }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("score-lead error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});