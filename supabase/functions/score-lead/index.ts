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

    const cur = studio?.currency || "USD";
    const studioContext = studio
      ? `Studio: ${studio.studio_name}.
Currency: ${cur}.
Ideal client: ${studio.ideal_client || "n/a"}.
Target budget: ${cur} ${studio.target_budget_min || 0}–${studio.target_budget_max || 0}.
Preferred project types: ${(studio.preferred_project_types || []).join(", ") || "any"}.
Preferred locations: ${(studio.preferred_locations || []).join(", ") || "any"}.
Signature styles: ${(studio.signature_styles || []).join(", ") || "n/a"}.
Low-fit warning signs: ${studio.low_fit_signs || "n/a"}.
Follow-up tone: ${studio.followup_tone || "warm"}.`
      : "";

    const leadDescription = `Name: ${lead.full_name}
Email: ${lead.email}
Phone: ${lead.phone || "n/a"}
Project type: ${lead.project_type || "n/a"}
Property type: ${lead.property_type || "n/a"}
Rooms: ${(lead.rooms || []).join(", ") || "n/a"}
Budget: ${lead.budget_range || "n/a"}
Timeline: ${lead.timeline || "n/a"}
Location: ${lead.location || "n/a"}
Style preference: ${lead.style_preference || "n/a"}
Source: ${lead.source || "n/a"}
Brief / raw inquiry: ${lead.raw_inquiry || lead.brief || "n/a"}`;

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

Analyse incoming leads with calm, expert judgment. Be honest about fit. Score each lead and break the score down into clear sub-scores. Identify what information is missing so the studio knows what to ask next. Draft a short, considered follow-up message in the studio's tone — never salesy, never sending pricing or commitments. The follow-up will be reviewed and sent manually by the studio owner.`,
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
                temperature: { type: "string", enum: ["hot", "warm", "cold"], description: "Overall temperature." },
                urgency: { type: "string", enum: ["low", "medium", "high"], description: "How time-sensitive the project is." },
                summary: { type: "string", description: "One sentence, max 25 words." },
                next_action: { type: "string", description: "One concrete next step the designer should take, max 18 words." },
                suggested_followup: { type: "string", description: "A short follow-up message (3–6 sentences) the studio can copy. Match the studio's follow-up tone. Do not include pricing or firm commitments." },
                missing_info: { type: "array", items: { type: "string" }, description: "Specific questions or pieces of information the studio still needs from this lead." },
                score_breakdown: {
                  type: "object",
                  properties: {
                    budget_fit: { type: "integer", minimum: 0, maximum: 100 },
                    timeline_fit: { type: "integer", minimum: 0, maximum: 100 },
                    location_fit: { type: "integer", minimum: 0, maximum: 100 },
                    project_type_fit: { type: "integer", minimum: 0, maximum: 100 },
                    decision_maker: { type: "integer", minimum: 0, maximum: 100 },
                    clarity: { type: "integer", minimum: 0, maximum: 100 },
                  },
                  required: ["budget_fit", "timeline_fit", "location_fit", "project_type_fit", "decision_maker", "clarity"],
                  additionalProperties: false,
                },
                red_flags: { type: "array", items: { type: "string" }, description: "Concerns. Empty array if none." },
              },
              required: ["fit_score", "temperature", "urgency", "summary", "next_action", "suggested_followup", "missing_info", "score_breakdown", "red_flags"],
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
      temperature: args.temperature,
      urgency: args.urgency,
      ai_summary: args.summary,
      ai_next_action: args.next_action,
      suggested_followup: args.suggested_followup,
      ai_reply_draft: args.suggested_followup,
      missing_info: args.missing_info || [],
      score_breakdown: args.score_breakdown || {},
      ai_red_flags: args.red_flags || [],
      ai_processed_at: new Date().toISOString(),
    }).eq("id", lead_id);

    return new Response(JSON.stringify({ ok: true, ...args }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("score-lead error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});