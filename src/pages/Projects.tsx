import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";

const Projects = () => {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("projects").select("*").order("created_at", { ascending: false }).then(({ data }) => setItems(data ?? []));
  }, []);

  return (
    <div className="px-12 py-12">
      <PageHeader eyebrow="STUDIO · PROJECTS" title="Projects." subtitle="Live engagements with rooms, versions, and notes." />
      {items.length === 0 ? (
        <div className="border border-border bg-card p-16 text-center text-stone text-sm">No projects yet. Convert a lead into a project from any lead detail page.</div>
      ) : (
        <div className="border border-border bg-card">
          {items.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`} className="block px-6 py-5 border-b border-border last:border-0 hover:bg-secondary/40 transition-colors">
              <div className="flex items-baseline justify-between">
                <div className="font-serif text-2xl text-ink">{p.name}</div>
                <div className="micro-label text-stone">{p.status}</div>
              </div>
              {p.client_name && <div className="text-sm text-stone mt-1">{p.client_name}</div>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;