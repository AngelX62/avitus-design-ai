import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import { Copy, ExternalLink } from "lucide-react";

const CURRENCIES = ["USD", "IDR", "SGD", "AUD", "EUR", "GBP", "Other"];
const TONES = ["warm", "direct", "playful", "formal"];

const Settings = () => {
  const [s, setS] = useState<any>(null);

  useEffect(() => {
    supabase.from("studio_settings").select("*").limit(1).maybeSingle().then(({ data }) => setS(data));
  }, []);

  const save = async () => {
    const { error } = await supabase.from("studio_settings").update({
      studio_name: s.studio_name,
      currency: s.currency || "USD",
      target_budget_min: Number(s.target_budget_min) || null,
      target_budget_max: Number(s.target_budget_max) || null,
      preferred_project_types: s.preferred_project_types || [],
      preferred_locations: s.preferred_locations || [],
      ideal_client: s.ideal_client,
      low_fit_signs: s.low_fit_signs,
      signature_styles: s.signature_styles || [],
      followup_tone: s.followup_tone || "warm",
      intake_intro: s.intake_intro,
    }).eq("id", s.id);
    if (error) toast.error(error.message); else toast.success("Profile saved");
  };

  if (!s) return <div className="p-12 micro-label">Loading…</div>;

  const intakeUrl = `${window.location.origin}/intake`;

  return (
    <div className="px-6 md:px-12 py-10 max-w-3xl">
      <PageHeader
        eyebrow="Settings"
        sectionNumber={6}
        title="Studio profile."
        subtitle="This profile shapes how Avitus scores incoming leads and drafts your follow-ups. Update it as your studio evolves."
      />

      <section className="mb-12">
        <div className="micro-label mb-3">PUBLIC INTAKE FORM</div>
        <div className="flex flex-wrap gap-2 items-center bg-secondary/40 border border-border p-4">
          <code className="flex-1 text-sm text-ink truncate min-w-0">{intakeUrl}</code>
          <a href={intakeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 micro-label text-stone hover:text-ink"><ExternalLink size={12} /> OPEN</a>
          <button onClick={() => { navigator.clipboard.writeText(intakeUrl); toast.success("Copied"); }} className="flex items-center gap-2 px-3 py-1.5 micro-label text-stone hover:text-ink"><Copy size={12} /> COPY</button>
        </div>
      </section>

      <div className="space-y-8">
        <Field label="Studio name" value={s.studio_name} onChange={(v: string) => setS({ ...s, studio_name: v })} />

        <Select label="Currency" value={s.currency || "USD"} options={CURRENCIES} onChange={(v: string) => setS({ ...s, currency: v })} />

        <div className="grid grid-cols-2 gap-6">
          <Field label="Target budget min" value={s.target_budget_min || ""} onChange={(v: string) => setS({ ...s, target_budget_min: v })} />
          <Field label="Target budget max" value={s.target_budget_max || ""} onChange={(v: string) => setS({ ...s, target_budget_max: v })} />
        </div>

        <Field label="Preferred project types (comma separated)" value={(s.preferred_project_types || []).join(", ")}
          onChange={(v: string) => setS({ ...s, preferred_project_types: v.split(",").map((x: string) => x.trim()).filter(Boolean) })} />

        <Field label="Preferred locations (comma separated)" value={(s.preferred_locations || []).join(", ")}
          onChange={(v: string) => setS({ ...s, preferred_locations: v.split(",").map((x: string) => x.trim()).filter(Boolean) })} />

        <Textarea label="Ideal client" value={s.ideal_client || ""} onChange={(v: string) => setS({ ...s, ideal_client: v })}
          placeholder="Describe the kind of project and client your studio is built for." />

        <Textarea label="Low-fit warning signs" value={s.low_fit_signs || ""} onChange={(v: string) => setS({ ...s, low_fit_signs: v })}
          placeholder="What should make Avitus mark a lead as low fit? (e.g. 'budget under 50M IDR', 'wants AutoCAD only')" />

        <Field label="Signature styles (comma separated)" value={(s.signature_styles || []).join(", ")}
          onChange={(v: string) => setS({ ...s, signature_styles: v.split(",").map((x: string) => x.trim()).filter(Boolean) })} />

        <Select label="Follow-up tone" value={s.followup_tone || "warm"} options={TONES} onChange={(v: string) => setS({ ...s, followup_tone: v })} />

        <Textarea label="Intake form intro" value={s.intake_intro || ""} onChange={(v: string) => setS({ ...s, intake_intro: v })}
          placeholder="Shown at the top of your public intake form." />

        <button onClick={save} className="px-10 py-3.5 bg-ink text-ivory text-xs uppercase tracking-[0.22em] hover:bg-ink/90">Save profile</button>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange }: any) => (
  <label className="block">
    <div className="micro-label mb-2">{label}</div>
    <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent border-b border-border focus:border-ink outline-none py-2 text-ink" />
  </label>
);

const Textarea = ({ label, value, onChange, placeholder }: any) => (
  <label className="block">
    <div className="micro-label mb-2">{label}</div>
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
      className="w-full bg-transparent border border-border focus:border-ink outline-none p-3 text-ink text-[15px] leading-relaxed" />
  </label>
);

const Select = ({ label, value, options, onChange }: any) => (
  <label className="block">
    <div className="micro-label mb-2">{label}</div>
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent border-b border-border focus:border-ink outline-none py-2 text-ink capitalize">
      {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
    </select>
  </label>
);

export default Settings;
