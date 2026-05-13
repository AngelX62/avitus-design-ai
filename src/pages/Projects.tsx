import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { OwnerStatePanel } from "@/components/OwnerStatePanel";
import { useStudio } from "@/contexts/StudioContext";
import { deleteProject } from "@/lib/projectApi";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

const Projects = () => {
  const { activeStudio } = useStudio();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const isOwner = activeStudio?.role === "owner";

  const loadProjects = useCallback(() => {
    if (!activeStudio) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from("projects")
      .select("*")
      .eq("studio_id", activeStudio.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems(data ?? []);
        setLoading(false);
      });
  }, [activeStudio]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const removeProject = async (project: any) => {
    if (!activeStudio || !isOwner) {
      toast.error("Only studio owners can delete projects");
      return;
    }

    const confirmed = window.confirm(`Delete "${project.name}"? Any associated records will also be removed.`);
    if (!confirmed) return;

    setDeletingId(project.id);
    const { error } = await deleteProject(activeStudio.id, project.id);
    setDeletingId(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Project deleted");
    loadProjects();
  };

  return (
    <div className="px-12 py-12">
      <PageHeader accent="projects" eyebrow="STUDIO · PROJECTS" title="Projects." subtitle="Won leads converted into lightweight project records for handoff and tracking." />
      {loading ? (
        <OwnerStatePanel eyebrow="LOADING PROJECTS" body="Gathering active engagements." />
      ) : items.length === 0 ? (
        <OwnerStatePanel
          eyebrow="NO PROJECTS YET"
          title="Projects start from won leads."
          body="Keep V1 focused on the lead loop. When a lead is ready, open the lead detail page and mark it Won to create the project."
          actions={
            <Link to="/leads" className="inline-flex items-center px-4 py-2.5 bg-ink text-ivory text-xs uppercase tracking-[0.18em] hover:bg-ink/90 transition-colors">
              Open Lead Inbox
            </Link>
          }
        />
      ) : (
        <div className="border border-border bg-card">
          {items.map((p) => (
            <div key={p.id} className="flex items-center gap-4 border-b border-border last:border-0 hover:bg-moss-soft/40 transition-colors">
              <Link to={`/projects/${p.id}`} className="block min-w-0 flex-1 px-6 py-5">
                <div className="flex items-baseline justify-between gap-4">
                  <div className="font-serif text-2xl text-ink truncate">{p.name}</div>
                  <div className="micro-label text-stone shrink-0">{p.status}</div>
                </div>
                {p.client_name && <div className="text-sm text-stone mt-1 truncate">{p.client_name}</div>}
              </Link>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => removeProject(p)}
                  disabled={deletingId === p.id}
                  className="mr-5 inline-flex h-9 w-9 shrink-0 items-center justify-center border border-border text-stone hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                  aria-label={`Delete ${p.name}`}
                  title="Delete project"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
