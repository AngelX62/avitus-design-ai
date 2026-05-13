import { useCallback, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStudio } from "@/contexts/StudioContext";
import { useAuth } from "@/contexts/AuthContext";
import { deleteProject } from "@/lib/projectApi";

const STATUSES = ["concept", "development", "final", "delivered"];

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeStudio } = useStudio();
  const { user } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [newRoom, setNewRoom] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const isOwner = activeStudio?.role === "owner";

  const load = useCallback(async () => {
    setLoading(true);
    setProject(null);
    setRooms([]);
    if (!id || !activeStudio) {
      setLoading(false);
      return;
    }
    const { data: p } = await supabase.from("projects").select("*").eq("studio_id", activeStudio.id).eq("id", id).maybeSingle();
    setProject(p);
    if (p) {
      const { data: r } = await supabase.from("rooms").select("*").eq("studio_id", activeStudio.id).eq("project_id", id).order("created_at");
      setRooms(r ?? []);
    }
    setLoading(false);
  }, [activeStudio, id]);

  useEffect(() => { void load(); }, [load]);

  const addRoom = async () => {
    if (!id || !activeStudio || !newRoom.trim()) return;
    await supabase.from("rooms").insert({ studio_id: activeStudio.id, project_id: id, name: newRoom, created_by: user?.id ?? null });
    setNewRoom("");
    void load();
  };

  const setStatus = async (s: any) => {
    if (!id || !activeStudio) return;
    await supabase.from("projects").update({ status: s }).eq("studio_id", activeStudio.id).eq("id", id);
    toast.success("Updated");
    void load();
  };

  const removeProject = async () => {
    if (!id || !activeStudio || !project) return;
    if (!isOwner) {
      toast.error("Only studio owners can delete projects");
      return;
    }

    const confirmed = window.confirm(`Delete "${project.name}"? Any associated records will also be removed.`);
    if (!confirmed) return;

    setDeleting(true);
    const { error } = await deleteProject(activeStudio.id, id);
    setDeleting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Project deleted");
    navigate("/projects");
  };

  if (loading) {
    return (
      <div className="px-12 py-12 max-w-5xl">
        <Link to="/projects" className="inline-flex items-center gap-2 micro-label text-stone hover:text-pine mb-6"><ArrowLeft size={12} /> ALL PROJECTS</Link>
        <div className="border border-border bg-card p-8">
          <div className="micro-label mb-2">LOADING PROJECT</div>
          <div className="text-sm text-stone">Checking this project inside your active studio workspace.</div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="px-12 py-12 max-w-5xl">
        <Link to="/projects" className="inline-flex items-center gap-2 micro-label text-stone hover:text-pine mb-6"><ArrowLeft size={12} /> ALL PROJECTS</Link>
        <div className="border border-border bg-card p-8">
          <div className="micro-label mb-2">PROJECT NOT AVAILABLE</div>
          <h1 className="font-serif text-3xl text-ink mb-3">This project is not in your active studio.</h1>
          <p className="text-sm text-stone leading-relaxed">
            It may have been removed, or the link may belong to a different studio workspace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-12 py-12 max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link to="/projects" className="inline-flex items-center gap-2 micro-label text-stone hover:text-pine"><ArrowLeft size={12} /> ALL PROJECTS</Link>
        {isOwner && (
          <button
            type="button"
            onClick={removeProject}
            disabled={deleting}
            className="inline-flex items-center gap-2 border border-border px-3 py-2 text-xs uppercase tracking-[0.18em] text-stone hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
          >
            <Trash2 size={13} /> {deleting ? "Deleting" : "Delete Project"}
          </button>
        )}
      </div>
      <PageHeader
        accent="projects"
        eyebrow={`PROJECT · ${project.status.toUpperCase()}`}
        title={project.name}
        subtitle={project.client_name}
      />

      <div className="mb-12">
        <div className="micro-label mb-3">STATUS</div>
        <div className="flex gap-2">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`px-4 py-2 text-xs uppercase tracking-[0.18em] border ${project.status === s ? "bg-ink text-ivory border-ink" : "border-border text-stone hover:border-pine/40"}`}>{s}</button>
          ))}
        </div>
      </div>

      {project.description && (
        <section className="mb-12">
          <div className="micro-label mb-3">BRIEF</div>
          <p className="text-ink text-[15px] leading-relaxed font-serif">{project.description}</p>
        </section>
      )}

      <section>
        <div className="micro-label mb-4">ROOMS</div>
        <div className="border border-border bg-card mb-4">
          {rooms.map((r) => (
            <div key={r.id} className="px-6 py-4 border-b border-border last:border-0">
              <div className="font-serif text-xl text-ink">{r.name}</div>
              {r.notes && <div className="text-sm text-stone mt-1">{r.notes}</div>}
            </div>
          ))}
          {rooms.length === 0 && <div className="px-6 py-8 text-stone text-sm text-center">No rooms yet.</div>}
        </div>
        <div className="flex gap-2">
          <input value={newRoom} onChange={(e) => setNewRoom(e.target.value)} placeholder="Room name (e.g. Primary Bedroom)" className="flex-1 bg-transparent border-b border-border focus:border-pine outline-none py-2 text-sm" />
          <button onClick={addRoom} className="flex items-center gap-1.5 px-3 micro-label text-stone hover:text-pine"><Plus size={12} /> ADD</button>
        </div>
      </section>
    </div>
  );
};

export default ProjectDetail;
