import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const STYLES = ["Editorial Minimal", "Japandi", "Scandi", "Modern", "Mid-century", "Coastal", "Industrial", "Wabi-sabi"];
const BUDGETS = ["Essential", "Considered", "Bespoke"];

const DesignNew = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ brief: "", style: "Editorial Minimal", budget_tier: "Considered", variation_count: 2 });
  const [roomPhoto, setRoomPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File, bucket: string) => {
    const path = `${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw error;
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      let room_photo_url = null;
      if (roomPhoto) room_photo_url = await upload(roomPhoto, "design-inputs");
      const { data: { user } } = await supabase.auth.getUser();
      const { data: gen, error } = await supabase.from("design_generations").insert({
        ...form, room_photo_url, created_by: user?.id, status: "pending",
      }).select().single();
      if (error) throw error;

      // Fire generation
      supabase.functions.invoke("generate-design", { body: { generation_id: gen.id } }).catch(() => {});
      toast.success("Generating concepts — this takes ~30s");
      navigate(`/designs/${gen.id}`);
    } catch (e: any) {
      toast.error(e.message || "Failed");
      setBusy(false);
    }
  };

  return (
    <div className="px-12 py-12 max-w-3xl">
      <Link to="/designs" className="inline-flex items-center gap-2 micro-label text-stone hover:text-ink mb-6"><ArrowLeft size={12} /> ALL DESIGNS</Link>
      <PageHeader eyebrow="DESIGNS · NEW" title="New generation." subtitle="Compose a brief. The AI will return concept renders, a rationale, and a materials list." />

      <form onSubmit={submit} className="space-y-10">
        <label className="block">
          <div className="micro-label mb-3">Brief</div>
          <textarea required value={form.brief} onChange={(e) => setForm({ ...form, brief: e.target.value })}
            rows={5} placeholder="A calm Japandi living room for a young family. Lots of natural light, oak flooring, a low linen sofa…"
            className="w-full bg-transparent border border-border focus:border-ink outline-none p-4 text-ink text-[15px] leading-relaxed" />
        </label>

        <div>
          <div className="micro-label mb-3">Style</div>
          <div className="flex flex-wrap gap-2">
            {STYLES.map((s) => (
              <button type="button" key={s} onClick={() => setForm({ ...form, style: s })}
                className={`px-4 py-2 text-xs uppercase tracking-[0.18em] border transition-colors ${form.style === s ? "bg-ink text-ivory border-ink" : "border-border text-stone hover:border-ink hover:text-ink"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="micro-label mb-3">Budget tier</div>
            <div className="flex gap-2">
              {BUDGETS.map((b) => (
                <button type="button" key={b} onClick={() => setForm({ ...form, budget_tier: b })}
                  className={`px-4 py-2 text-xs uppercase tracking-[0.18em] border ${form.budget_tier === b ? "bg-ink text-ivory border-ink" : "border-border text-stone hover:border-ink"}`}>
                  {b}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="micro-label mb-3">Variations</div>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((n) => (
                <button type="button" key={n} onClick={() => setForm({ ...form, variation_count: n })}
                  className={`w-10 h-10 text-sm border ${form.variation_count === n ? "bg-ink text-ivory border-ink" : "border-border text-stone hover:border-ink"}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <label className="block">
          <div className="micro-label mb-3">Room photo (optional)</div>
          <input type="file" accept="image/*" onChange={(e) => setRoomPhoto(e.target.files?.[0] ?? null)}
            className="text-sm text-stone file:mr-4 file:py-2 file:px-4 file:border file:border-border file:bg-transparent file:text-xs file:uppercase file:tracking-[0.18em] file:text-ink hover:file:bg-secondary" />
        </label>

        <button type="submit" disabled={busy} className="px-10 py-4 bg-ink text-ivory text-xs uppercase tracking-[0.22em] hover:bg-ink/90 disabled:opacity-60">
          {busy ? "Starting…" : "Generate concepts"}
        </button>
      </form>
    </div>
  );
};

export default DesignNew;