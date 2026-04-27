import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { decode as decodeBase64 } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let generation_id: string | null = null;

  try {
    const body = await req.json();
    generation_id = body.generation_id;
    if (!generation_id) throw new Error("generation_id required");

    const { data: gen } = await supabase.from("design_generations").select("*").eq("id", generation_id).maybeSingle();
    if (!gen) throw new Error("Generation not found");

    const prompt = buildPrompt(gen);

    // Generate N variations in parallel
    const variations = await Promise.all(
      Array.from({ length: gen.variation_count || 1 }, (_, i) => generateOne(prompt, i, gen.room_photo_url))
    );

    // Upload images and insert variations
    for (let i = 0; i < variations.length; i++) {
      const v = variations[i];
      if (!v.imageBase64) continue;
      const bytes = decodeBase64(v.imageBase64);
      const path = `${generation_id}/${i}-${crypto.randomUUID()}.png`;
      const { error: upErr } = await supabase.storage.from("design-outputs").upload(path, bytes, { contentType: "image/png" });
      if (upErr) { console.error(upErr); continue; }
      const { data: { publicUrl } } = supabase.storage.from("design-outputs").getPublicUrl(path);

      // Generate rationale + materials
      const meta = await generateMeta(prompt, i + 1);

      await supabase.from("design_variations").insert({
        generation_id, image_url: publicUrl, position: i,
        rationale: meta.rationale, materials: meta.materials,
      });
    }

    await supabase.from("design_generations").update({ status: "complete", completed_at: new Date().toISOString() }).eq("id", generation_id);

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-design error", e);
    if (generation_id) {
      await supabase.from("design_generations").update({ status: "failed", error_message: e instanceof Error ? e.message : "Unknown" }).eq("id", generation_id);
    }
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

function buildPrompt(g: any): string {
  return `Photorealistic interior design concept render. Style: ${g.style || "Editorial Minimal"}. Budget tier: ${g.budget_tier || "Considered"}.
Brief: ${g.brief}
Magazine-quality, natural light, considered composition, refined materials.`;
}

async function generateOne(prompt: string, idx: number, refImageUrl?: string | null) {
  const variantHint = ["primary composition", "alternate angle, warmer palette", "alternate styling, different focal point", "minimal variation"][idx] || "alternate";
  const fullPrompt = `${prompt}\nVariation: ${variantHint}.`;

  const userContent: any[] = [{ type: "text", text: fullPrompt }];
  if (refImageUrl) userContent.push({ type: "image_url", image_url: { url: refImageUrl } });

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: userContent }],
      modalities: ["image", "text"],
    }),
  });
  if (!res.ok) { console.error("img gen", res.status, await res.text()); return { imageBase64: null }; }
  const data = await res.json();
  const url = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  const base64 = url?.split(",")[1] || null;
  return { imageBase64: base64 };
}

async function generateMeta(prompt: string, n: number) {
  try {
    const res = await fetch(GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an interior designer writing concise, editorial design notes." },
          { role: "user", content: `For this concept, write a short rationale (2-3 sentences, calm editorial tone) and a materials & finishes list (5-8 items, each 2-5 words like "oak veneer", "boucle linen", "brushed brass").\n\nConcept ${n}: ${prompt}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "submit_meta",
            parameters: {
              type: "object",
              properties: {
                rationale: { type: "string" },
                materials: { type: "array", items: { type: "string" } },
              },
              required: ["rationale", "materials"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "submit_meta" } },
      }),
    });
    const data = await res.json();
    return JSON.parse(data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments || "{}");
  } catch (e) {
    console.error("meta error", e);
    return { rationale: "", materials: [] };
  }
}