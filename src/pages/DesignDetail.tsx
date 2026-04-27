import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { ArrowLeft } from "lucide-react";

const DesignDetail = () => {
  const { id } = useParams();
  const [gen, setGen] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data } = await supabase.from("design_generations").select("*, design_variations(*)").eq("id", id).maybeSingle();
      setGen(data);
    };
    void load();
    const interval = setInterval(() => {
      setGen((g: any) => { if (g?.status === "pending") void load(); return g; });
    }, 4000);
    return () => clearInterval(interval);
  }, [id]);

  if (!gen) return <div className="p-12 micro-label">Loading…</div>;

  return (
    <div className="px-12 py-12 max-w-6xl">
      <Link to="/designs" className="inline-flex items-center gap-2 micro-label text-stone hover:text-ink mb-6"><ArrowLeft size={12} /> ALL DESIGNS</Link>
      <PageHeader eyebrow={`DESIGN · ${gen.style?.toUpperCase() || "GENERATION"}`} title={gen.brief?.slice(0, 60) || "Generation"} subtitle={`${gen.budget_tier || ""} · ${gen.variation_count} variations`} />

      {gen.status === "pending" && (
        <div className="border border-border bg-sand/20 p-10 text-center mb-10">
          <div className="micro-label mb-3">GENERATING</div>
          <div className="text-stone text-sm">Our AI is composing your concepts. This typically takes 30–60 seconds per variation.</div>
        </div>
      )}
      {gen.status === "failed" && (
        <div className="border border-destructive bg-destructive/5 p-6 text-sm text-ink mb-10">
          Generation failed. {gen.error_message}
        </div>
      )}

      <div className="space-y-12">
        {gen.design_variations?.sort((a: any, b: any) => a.position - b.position).map((v: any, i: number) => (
          <div key={v.id} className="grid grid-cols-5 gap-10 border-b border-border pb-12 last:border-0">
            <div className="col-span-3">
              <div className="micro-label mb-3">VARIATION {String(i + 1).padStart(2, "0")}</div>
              <img src={v.image_url} alt="" className="w-full border border-border" />
            </div>
            <div className="col-span-2 space-y-6">
              {v.rationale && (
                <div>
                  <div className="micro-label mb-2">RATIONALE</div>
                  <p className="text-ink text-[15px] leading-relaxed font-serif">{v.rationale}</p>
                </div>
              )}
              {v.materials?.length > 0 && (
                <div>
                  <div className="micro-label mb-3">MATERIALS & FINISHES</div>
                  <ul className="space-y-1.5">
                    {v.materials.map((m: string, j: number) => <li key={j} className="text-sm text-ink">· {m}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DesignDetail;