import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useStudio } from "@/contexts/StudioContext";

const SOURCES = [
  { key: "whatsapp", label: "WhatsApp" },
  { key: "instagram", label: "Instagram" },
  { key: "email", label: "Email" },
  { key: "sms", label: "SMS" },
  { key: "other", label: "Other" },
];

const PasteMessage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { activeStudio, loading: studioLoading } = useStudio();
  const [step, setStep] = useState<"paste" | "review">("paste");
  const [raw, setRaw] = useState("");
  const [source, setSource] = useState("whatsapp");
  const [busy, setBusy] = useState(false);
  const [extracted, setExtracted] = useState<any>(null);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, navigate, user]);

  const extract = async () => {
    if (!activeStudio) { toast.error("Choose a studio first"); return; }
    if (raw.trim().length < 10) { toast.error("Paste a longer message"); return; }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("extract-lead", { body: { studio_id: activeStudio.id, raw_text: raw, source } });
    setBusy(false);
    if (error || !data?.ok) {
      toast.error(data?.error || error?.message || "Could not extract");
      return;
    }
    setAiAvailable(data.ai_available ?? true);
    if (data.ai_available === false) toast.info("Analysis is not enabled yet. Review the lead manually.");
    setExtracted({ ...data.extracted });
    setStep("review");
  };

  const save = async () => {
    if (!activeStudio) { toast.error("Choose a studio first"); return; }
    if (!extracted?.full_name) { toast.error("Name required"); return; }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("create-pasted-lead", {
      body: { studio_id: activeStudio.id, raw_text: raw, source, extracted },
    });
    setBusy(false);
    if (error || !data?.ok) { toast.error(data?.error || error?.message || "Could not save lead"); return; }
    toast.success(data.ai_available === false ? "Lead created for manual review" : "Lead created");
    navigate(`/leads/${data.lead_id}`);
  };

  if (authLoading || studioLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="micro-label">Loading studio</div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <header className="border-b border-border px-5 py-4 flex items-center justify-between">
        <button onClick={() => step === "review" ? setStep("paste") : navigate(-1)} className="flex items-center gap-2 text-stone hover:text-pine text-sm">
          <ArrowLeft size={16} /> {step === "review" ? "Edit message" : "Back"}
        </button>
        <Logo size={22} />
      </header>

      {step === "paste" ? (
        <div className="flex-1 flex flex-col max-w-xl mx-auto w-full px-5 pt-8 pb-32">
          <div className="micro-label mb-3">PASTE MESSAGE</div>
          <h1 className="font-serif text-3xl md:text-4xl text-ink leading-tight mb-3">
            Paste a messy inquiry.
          </h1>
          <p className="text-stone text-sm leading-relaxed mb-6">
            WhatsApp, Instagram DM, SMS, email — paste the message here and create a clean lead record.
          </p>

          <div className="micro-label mb-2">SOURCE</div>
          <div className="flex flex-wrap gap-2 mb-5">
            {SOURCES.map((s) => (
              <button key={s.key} onClick={() => setSource(s.key)}
                className={`px-3 py-2 text-xs border min-h-[40px] ${source === s.key ? "bg-ink text-ivory border-ink" : "border-border text-stone hover:text-pine hover:border-pine/40"}`}>
                {s.label}
              </button>
            ))}
          </div>

          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={10}
            placeholder="Paste the full message here…"
            className="w-full bg-transparent border border-border focus:border-pine outline-none p-4 text-ink text-[15px] leading-relaxed min-h-[200px] flex-1"
          />
        </div>
      ) : (
        <div className="flex-1 max-w-xl mx-auto w-full px-5 pt-8 pb-32 space-y-5">
          <div className="micro-label">REVIEW EXTRACTED DETAILS</div>
          <h1 className="font-serif text-3xl text-ink leading-tight">Confirm and save.</h1>
          <p className="text-stone text-sm">
            {aiAvailable === false
              ? "Analysis is not enabled yet, so Avitus started a manual review draft from the pasted message."
              : "Edit anything Avitus got wrong. Analysis can run after you save when it is enabled."}
          </p>

          <Field label="Name" value={extracted.full_name} onChange={(v: string) => setExtracted({ ...extracted, full_name: v })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Email" value={extracted.email || ""} onChange={(v: string) => setExtracted({ ...extracted, email: v })} />
            <Field label="Phone" value={extracted.phone || ""} onChange={(v: string) => setExtracted({ ...extracted, phone: v })} />
          </div>
          <Field label="Project type" value={extracted.project_type || ""} onChange={(v: string) => setExtracted({ ...extracted, project_type: v })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Property type" value={extracted.property_type || ""} onChange={(v: string) => setExtracted({ ...extracted, property_type: v })} />
            <Field label="Location" value={extracted.location || ""} onChange={(v: string) => setExtracted({ ...extracted, location: v })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Budget" value={extracted.budget_range || ""} onChange={(v: string) => setExtracted({ ...extracted, budget_range: v })} />
            <Field label="Timeline" value={extracted.timeline || ""} onChange={(v: string) => setExtracted({ ...extracted, timeline: v })} />
          </div>
          <Field label="Style preference" value={extracted.style_preference || ""} onChange={(v: string) => setExtracted({ ...extracted, style_preference: v })} />

          {extracted.missing_info?.length > 0 && (
            <div className="border-l-2 border-pine/20 pl-4 py-2">
              <div className="micro-label mb-2">QUESTIONS TO ASK</div>
              <ul className="space-y-1.5 text-sm text-stone">
                {extracted.missing_info.map((q: string, i: number) => <li key={i}>· {q}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="fixed bottom-0 inset-x-0 bg-background border-t border-border px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="max-w-xl mx-auto">
          {step === "paste" ? (
            <button onClick={extract} disabled={busy || raw.trim().length < 10}
              className="w-full bg-ink text-ivory text-xs uppercase tracking-[0.22em] py-4 min-h-[52px] disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-ink/90">
              <Sparkles size={14} /> {busy ? "Preparing…" : "Create Lead"}
            </button>
          ) : (
            <button onClick={save} disabled={busy}
              className="w-full bg-ink text-ivory text-xs uppercase tracking-[0.22em] py-4 min-h-[52px] disabled:opacity-50 hover:bg-ink/90">
              {busy ? "Saving…" : "Save Lead"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange }: any) => (
  <label className="block">
    <div className="micro-label mb-1.5">{label}</div>
    <input value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent border-b border-border focus:border-pine outline-none py-2.5 text-ink text-[15px] min-h-[44px]" />
  </label>
);

export default PasteMessage;
