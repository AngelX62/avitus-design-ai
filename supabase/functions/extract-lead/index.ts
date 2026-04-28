import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { raw_text, source } = await req.json();
    if (!raw_text || typeof raw_text !== "string" || raw_text.trim().length < 5) {
      return new Response(JSON.stringify({ error: "raw_text required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: studio } = await supabase.from("studio_settings").select("*").limit(1).maybeSingle();
    const cur = studio?.currency || "USD";

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You extract structured lead data from messy inbound messages (WhatsApp, Instagram DM, email, SMS) for an interior design studio. Studio currency is ${cur}. If the lead does not include a name, use a sensible label like "Instagram lead" or "WhatsApp lead". Never invent details — leave fields empty if the message does not say. List specific questions the studio still needs to ask in missing_info.`,
          },
          { role: "user", content: `Source: ${source || "unknown"}\n\nMessage:\n${raw_text}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_lead",
            description: "Extract structured lead data",
            parameters: {
              type: "object",
              properties: {
                full_name: { type: "string" },
                email: { type: "string" },
                phone: { type: "string" },
                project_type: { type: "string" },
                property_type: { type: "string" },
                location: { type: "string" },
                budget_range: { type: "string" },
                timeline: { type: "string" },
                style_preference: { type: "string" },
                urgency: { type: "string", enum: ["low", "medium", "high"] },
                missing_info: { type: "array", items: { type: "string" } },
              },
              required: ["full_name", "missing_info"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_lead" } },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("extract-lead AI error", aiRes.status, t);
      if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiRes.status === 402) return new Response(JSON.stringify({ error: "Add credits to your Lovable AI workspace" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error");
    }

    const data = await aiRes.json();
    const args = JSON.parse(data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments || "{}");
    return new Response(JSON.stringify({ ok: true, extracted: args }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("extract-lead error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});