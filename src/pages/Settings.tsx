import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import { Copy } from "lucide-react";

const Settings = () => {
  const [s, setS] = useState<any>(null);

  useEffect(() => {
    supabase.from("studio_settings").select("*").limit(1).maybeSingle().then(({ data }) => setS(data));
  }, []);

  const save = async () => {
    const { error } = await supabase.from("studio_settings").update({
      studio_name: s.studio_name, ideal_client: s.ideal_client,
      target_budget_min: Number(s.target_budget_min) || null, target_budget_max: Number(s.target_budget_max) || null,
      signature_styles: s.signature_styles, intake_intro: s.intake_intro,
    }).eq("id", s.id);
    if (error) toast.error(error.message); else toast.success("Settings saved");
  };

  if (!s) return <div className="p-12 micro-label">Loading…</div>;

  const intakeUrl = `${window.location.origin}/intake`;

  return (
    <div className="px-12 py-12 max-w-3xl">
      <PageHeader eyebrow="STUDIO · SETTINGS" title="Studio profile." subtitle="This profile shapes how the AI scores leads and tones the work it generates." />

      <section className="mb-12">
        <div className="micro-label mb-3">PUBLIC INTAKE LINK</div>
        <div className="flex gap-2 items-center bg-secondary/40 border border-border p-4">
          <code className="flex-1 text-sm text-ink truncate">{intakeUrl}</code>
          <button onClick={() => { navigator.clipboard.writeText(intakeUrl); toast.success("Copied"); }} className="flex items-center gap-2 px-3 py-1.5 micro-label text-stone hover:text-ink"><Copy size={12} /> COPY</button>
        </div>
      </section>

      <div className="space-y-8">
        <Field label="Studio name" value={s.studio_name} onChange={(v: string) => setS({ ...s, studio_name: v })} />
        <Textarea label="Ideal client" value={s.ideal_client || ""} onChange={(v: string) => setS({ ...s, ideal_client: v })} placeholder="Who is the studio's perfect client? Used by AI to score lead fit." />
        <div className="grid grid-cols-2 gap-6">
          <Field label="Target budget min ($)" value={s.target_budget_min || ""} onChange={(v: string) => setS({ ...s, target_budget_min: v })} />
          <Field label="Target budget max ($)" value={s.target_budget_max || ""} onChange={(v: string) => setS({ ...s, target_budget_max: v })} />
        </div>
        <Field label="Signature styles (comma separated)" value={(s.signature_styles || []).join(", ")}
          onChange={(v: string) => setS({ ...s, signature_styles: v.split(",").map((x: string) => x.trim()).filter(Boolean) })} />
        <Textarea label="Intake form intro" value={s.intake_intro || ""} onChange={(v: string) => setS({ ...s, intake_intro: v })} />

        <button onClick={save} className="px-10 py-3.5 bg-ink text-ivory text-xs uppercase tracking-[0.22em] hover:bg-ink/90">Save changes</button>
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

export default Settings;