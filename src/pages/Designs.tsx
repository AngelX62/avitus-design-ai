import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Plus } from "lucide-react";

const Designs = () => {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("design_generations")
      .select("*, design_variations(*)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setItems(data ?? []));
  }, []);

  return (
    <div className="px-12 py-12">
      <PageHeader
        eyebrow="Designs"
        sectionNumber={5}
        title="Designs."
        subtitle="Generated concepts, mood boards, and renders."
        actions={
          <Link to="/designs/new" className="flex items-center gap-2 px-5 py-2.5 bg-ink text-ivory text-xs uppercase tracking-[0.22em] hover:bg-ink/90">
            <Plus size={14} /> New generation
          </Link>
        }
      />

      {items.length === 0 ? (
        <div className="border border-border bg-card p-16 text-center">
          <div className="micro-label mb-4">EMPTY</div>
          <p className="text-stone text-sm max-w-sm mx-auto">No designs yet. Begin your first generation — a brief and a few preferences are all you need.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
          {items.map((g) => {
            const cover = g.design_variations?.[0]?.image_url;
            return (
              <Link key={g.id} to={`/designs/${g.id}`} className="bg-background block group">
                <div className="aspect-[4/5] bg-secondary overflow-hidden">
                  {cover ? (
                    <img src={cover} alt={g.brief?.slice(0, 80)} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center micro-label text-stone">
                      {g.status === "pending" ? "GENERATING…" : g.status === "failed" ? "FAILED" : "NO IMAGE"}
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="micro-label mb-2">{g.style || "—"}</div>
                  <div className="font-serif text-xl text-ink leading-tight line-clamp-2">{g.brief || "Untitled"}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Designs;