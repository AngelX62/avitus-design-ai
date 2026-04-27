import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { ArrowLeft, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

const STATUSES = ["concept", "development", "final", "delivered"];

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [newRoom, setNewRoom] = useState("");

  useEffect(() => { if (id) void load(); }, [id]);
  const load = async () => {
    const { data: p } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
    setProject(p);
    const { data: r } = await supabase.from("rooms").select("*").eq("project_id", id).order("created_at");
    setRooms(r ?? []);
  };

  const addRoom = async () => {
    if (!newRoom.trim()) return;
    await supabase.from("rooms").insert({ project_id: id, name: newRoom });
    setNewRoom("");
    void load();
  };

  const setStatus = async (s: any) => {
    await supabase.from("projects").update({ status: s }).eq("id", id);
    toast.success("Updated");
    void load();
  };

  if (!project) return <div className="p-12 micro-label">Loading…</div>;

  return (
    <div className="px-12 py-12 max-w-5xl">
      <Link to="/projects" className="inline-flex items-center gap-2 micro-label text-stone hover:text-ink mb-6"><ArrowLeft size={12} /> ALL PROJECTS</Link>
      <PageHeader
        eyebrow={`PROJECT · ${project.status.toUpperCase()}`}
        title={project.name}
        subtitle={project.client_name}
        actions={
          <Link to="/designs/new" className="flex items-center gap-2 px-4 py-2.5 bg-ink text-ivory text-xs uppercase tracking-[0.22em]"><Sparkles size={13} /> Generate concept</Link>
        }
      />

      <div className="mb-12">
        <div className="micro-label mb-3">STATUS</div>
        <div className="flex gap-2">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`px-4 py-2 text-xs uppercase tracking-[0.18em] border ${project.status === s ? "bg-ink text-ivory border-ink" : "border-border text-stone hover:border-ink"}`}>{s}</button>
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
          <input value={newRoom} onChange={(e) => setNewRoom(e.target.value)} placeholder="Room name (e.g. Primary Bedroom)" className="flex-1 bg-transparent border-b border-border focus:border-ink outline-none py-2 text-sm" />
          <button onClick={addRoom} className="flex items-center gap-1.5 px-3 micro-label text-stone hover:text-ink"><Plus size={12} /> ADD</button>
        </div>
      </section>
    </div>
  );
};

export default ProjectDetail;