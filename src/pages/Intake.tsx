import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

const Intake = () => {
  const [studio, setStudio] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", project_type: "Full home",
    rooms: "", budget_range: "$50k–$100k", timeline: "3–6 months", location: "", brief: "",
  });

  useEffect(() => {
    supabase.from("studio_settings").select("*").limit(1).maybeSingle().then(({ data }) => setStudio(data));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.from("leads").insert({
      ...form,
      rooms: form.rooms.split(",").map(s => s.trim()).filter(Boolean),
    }).select().single();
    if (error) { toast.error(error.message); setBusy(false); return; }
    // Fire-and-forget AI scoring
    supabase.functions.invoke("score-lead", { body: { lead_id: data.id } }).catch(() => {});
    setSubmitted(true);
    setBusy(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="max-w-md text-center">
          <Logo size={40} />
          <div className="micro-label mt-10 mb-4">RECEIVED</div>
          <h1 className="font-serif text-5xl text-ink leading-tight">Thank you.</h1>
          <p className="text-stone mt-6 text-[15px] leading-relaxed">
            Your enquiry is with our studio. We read every brief carefully and will be in touch within two business days.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-8 py-16">
        <div className="mb-12"><Logo withWordmark size={32} /></div>
        <div className="micro-label mb-4">{studio?.studio_name?.toUpperCase() || "STUDIO"} · NEW ENQUIRY</div>
        <h1 className="font-serif text-5xl text-ink leading-tight mb-6">Tell us about your space.</h1>
        <p className="text-stone text-[15px] leading-relaxed mb-12 max-w-lg">
          {studio?.intake_intro || "Share a few details and we'll be in touch."}
        </p>

        <form onSubmit={submit} className="space-y-7">
          <div className="grid grid-cols-2 gap-6">
            <Field label="Full name" value={form.full_name} onChange={(v: string) => setForm({ ...form, full_name: v })} required />
            <Field label="Email" type="email" value={form.email} onChange={(v: string) => setForm({ ...form, email: v })} required />
            <Field label="Phone (optional)" value={form.phone} onChange={(v: string) => setForm({ ...form, phone: v })} />
            <Field label="Location" value={form.location} onChange={(v: string) => setForm({ ...form, location: v })} placeholder="City" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <Select label="Project type" value={form.project_type} onChange={(v: string) => setForm({ ...form, project_type: v })}
              options={["Full home", "Single room", "Renovation", "New build", "Furnishing only"]} />
            <Select label="Timeline" value={form.timeline} onChange={(v: string) => setForm({ ...form, timeline: v })}
              options={["ASAP", "1–3 months", "3–6 months", "6–12 months", "Exploring"]} />
            <Select label="Budget" value={form.budget_range} onChange={(v: string) => setForm({ ...form, budget_range: v })}
              options={["Under $25k", "$25k–$50k", "$50k–$100k", "$100k–$250k", "$250k+"]} />
            <Field label="Rooms (comma separated)" value={form.rooms} onChange={(v: string) => setForm({ ...form, rooms: v })} placeholder="Living, Kitchen…" />
          </div>

          <label className="block">
            <div className="micro-label mb-3">Tell us about the project</div>
            <textarea required value={form.brief} onChange={(e) => setForm({ ...form, brief: e.target.value })}
              rows={5} className="w-full bg-transparent border border-border focus:border-ink outline-none p-4 text-ink text-[15px] leading-relaxed transition-colors"
              placeholder="Style preferences, household, what you'd like to feel when you walk in…" />
          </label>

          <button type="submit" disabled={busy} className="px-10 py-4 bg-ink text-ivory text-xs uppercase tracking-[0.22em] hover:bg-ink/90 transition-colors disabled:opacity-60">
            {busy ? "Sending…" : "Submit enquiry"}
          </button>
        </form>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, ...rest }: any) => (
  <label className="block">
    <div className="micro-label mb-2">{label}</div>
    <input {...rest} value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent border-b border-border focus:border-ink outline-none py-2 text-ink transition-colors" />
  </label>
);

const Select = ({ label, value, onChange, options }: any) => (
  <label className="block">
    <div className="micro-label mb-2">{label}</div>
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent border-b border-border focus:border-ink outline-none py-2 text-ink transition-colors">
      {options.map((o: string) => <option key={o}>{o}</option>)}
    </select>
  </label>
);

export default Intake;