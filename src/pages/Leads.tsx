import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { OwnerStatePanel } from "@/components/OwnerStatePanel";
import { LeadSignals } from "@/components/LeadSignals";
import { FileText, Upload, MessageSquare, Plus } from "lucide-react";
import { toast } from "sonner";
import { CLASSIFICATION_LABELS, STATUS_LABELS, classificationClass } from "@/lib/format";
import { useStudio } from "@/contexts/StudioContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { LeadStatus } from "@/lib/leadTypes";
import { computeSignals } from "@/lib/leadSignals";
import {
  INBOX_SIGNALS,
  buildDuplicateKeySet,
  isInboxSignalKey,
  matchesInboxSignal,
  type InboxSignalKey,
} from "@/lib/inboxFilters";
import { duplicateKeyForLead } from "@/lib/leadSignals";

const STAGES: { key: LeadStatus; label: string }[] = [
  { key: "new", label: "New" },
  { key: "needs_review", label: "Needs Review" },
  { key: "high_fit", label: "High-Fit" },
  { key: "contacted", label: "Contacted" },
  { key: "consultation_booked", label: "Consultation Booked" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

const leadClassification = (lead: any) => lead.classification || lead.temperature;

const Leads = () => {
  const { activeStudio } = useStudio();
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);
  const [view, setView] = useState<"board" | "table">("board");
  const [showCreate, setShowCreate] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawSignal = searchParams.get("signal");
  const activeSignal: InboxSignalKey | null = isInboxSignalKey(rawSignal) ? rawSignal : null;
  const isMd = useMediaQuery("(min-width: 768px)");
  const effectiveView = isMd ? view : "table";
  const duplicateKeys = useMemo(() => buildDuplicateKeySet(leads), [leads]);

  const signalCounts = useMemo(() => {
    const counts: Record<InboxSignalKey, number> = {
      needs_review: 0,
      going_cold: 0,
      follow_ups_due: 0,
      missing_info: 0,
      duplicates: 0,
      status_health: 0,
      import_rows: 0,
    };
    for (const lead of leads) {
      for (const { key } of INBOX_SIGNALS) {
        if (matchesInboxSignal(lead, now, key, duplicateKeys)) counts[key] += 1;
      }
    }
    return counts;
  }, [duplicateKeys, leads, now]);

  const visibleLeads = useMemo(
    () =>
      (activeSignal
        ? leads.filter((lead) => matchesInboxSignal(lead, now, activeSignal, duplicateKeys))
        : leads
      ).map((lead) => {
        const duplicateKey = duplicateKeyForLead(lead);
        return {
          ...lead,
          possible_duplicate: Boolean(duplicateKey && duplicateKeys.has(duplicateKey)),
        };
      }),
    [activeSignal, duplicateKeys, leads, now],
  );

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!activeStudio) {
      setLeads([]);
      setLeadsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLeadsLoading(true);

    (async () => {
      const { data } = await supabase
        .from("leads")
        .select("*")
        .eq("studio_id", activeStudio.id)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      setLeads(data ?? []);
      setLeadsLoading(false);
    })().catch(() => {
      if (cancelled) return;
      setLeads([]);
      setLeadsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [activeStudio]);

  return (
    <div className="px-6 md:px-12 py-10">
      <PageHeader
        accent="leads"
        eyebrow="STUDIO · LEAD INBOX"
        title="Lead Inbox."
        subtitle="Every inbound lead, captured and organized for owner review. You stay in control of every reply."
        actions={
          <>
            <Link to="/import" className="flex items-center gap-2 px-4 py-2.5 border border-border text-xs uppercase tracking-[0.18em] text-ink hover:border-sage hover:bg-sage-soft/50 transition-colors">
              <Upload size={13} /> Import Sheet
            </Link>
            <Link to="/leads/paste" className="flex items-center gap-2 px-4 py-2.5 border border-border text-xs uppercase tracking-[0.18em] text-ink hover:border-sage hover:bg-sage-soft/50 transition-colors">
              <MessageSquare size={13} /> Paste Message
            </Link>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 bg-ink text-ivory text-xs uppercase tracking-[0.18em] hover:bg-ink/90 transition-colors">
              <Plus size={13} /> Create Lead
            </button>
            {isMd && (
              <div className="flex border border-border ml-2">
                {(["board", "table"] as const).map((v) => (
                  <button key={v} onClick={() => setView(v)} className={`px-4 py-2.5 text-xs uppercase tracking-[0.18em] ${view === v ? "bg-ink text-ivory" : "text-stone hover:text-pine"}`}>{v}</button>
                ))}
              </div>
            )}
          </>
        }
      />

      {leadsLoading ? (
        <LeadInboxLoading />
      ) : leads.length === 0 ? (
        <EmptyLeadInbox studioSlug={activeStudio?.slug} onCreate={() => setShowCreate(true)} />
      ) : (
        <>
          <SignalChipRow
            activeSignal={activeSignal}
            totalCount={leads.length}
            counts={signalCounts}
          />
          {visibleLeads.length === 0 ? (
            <div className="border border-border bg-card px-6 py-8 text-sm text-stone">
              No leads match this filter right now.
            </div>
          ) : effectiveView === "board" ? (
        <div className="overflow-x-auto -mx-6 md:-mx-12 px-6 md:px-12 pb-2">
          <div className="flex gap-px bg-border border border-border min-w-[1200px] h-[calc(100dvh-260px)] min-h-[520px]">
            {STAGES.map((s) => {
              const items = visibleLeads.filter((l) => l.status === s.key);
              return (
                <div key={s.key} className="bg-background w-[260px] flex-shrink-0 flex flex-col min-h-0">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
                    <span className="micro-label">{s.label}</span>
                    <span className="text-xs text-stone">{items.length}</span>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-2">
                    {items.map((l) => (
                      <Link key={l.id} to={`/leads/${l.id}`} className="block bg-card border border-border p-4 hover:border-sage/50 transition-colors duration-200">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-serif text-lg text-ink leading-tight">{l.full_name}</div>
                          {l.fit_score != null && (
                            <div className="text-xs font-medium text-sage-deep whitespace-nowrap tabular-nums">{l.fit_score}</div>
                          )}
                        </div>
                        <div className="text-xs text-stone mt-1.5">
                          {l.project_type || "—"}{l.location ? ` · ${l.location}` : ""}
                        </div>
                        {l.budget_range && <div className="text-xs text-ink mt-1.5">{l.budget_range}</div>}
                        {leadClassification(l) && (
                          <div className="mt-3">
                            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border ${classificationClass(leadClassification(l))}`}>
                              {CLASSIFICATION_LABELS[leadClassification(l)] || leadClassification(l)}
                            </span>
                          </div>
                        )}
                        <LeadSignals lead={l} now={now} className="mt-2" />
                        {l.ai_next_action && (
                          <div className="mt-3 pt-3 border-t border-border text-[11px] text-stone leading-snug line-clamp-2">
                            → {l.ai_next_action}
                          </div>
                        )}
                      </Link>
                    ))}
                    {items.length === 0 && <div className="text-xs text-stone/60 px-2 py-4">—</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
          ) : (
            <div className="border border-border bg-card overflow-x-auto">
              <div className="min-w-[900px]">
                {visibleLeads.map((l) => {
                  const topTone = computeSignals(l, now)[0]?.tone;
                  const edgeClass = topTone === "attn" ? "border-l-attn" : "border-l-transparent";
                  return (
                    <Link
                      key={l.id}
                      to={`/leads/${l.id}`}
                      className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-border last:border-0 hover:bg-sage-soft/30 items-center text-sm transition-colors border-l-[3px] ${edgeClass}`}
                    >
                      <div className="col-span-3 min-w-0 truncate font-serif text-lg text-ink">{l.full_name}</div>
                      <div className="col-span-2 text-stone truncate">{l.project_type || "—"}</div>
                      <div className="col-span-2 text-stone truncate">{l.location || "—"}</div>
                      <div className="col-span-1 text-stone text-xs truncate">{l.budget_range || "—"}</div>
                      <div className="col-span-2 flex flex-wrap items-center gap-1.5">
                        <span className="micro-label">{STATUS_LABELS[l.status] || l.status}</span>
                        {leadClassification(l) && (
                          <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 border ${classificationClass(leadClassification(l))}`}>
                            {CLASSIFICATION_LABELS[leadClassification(l)] || leadClassification(l)}
                          </span>
                        )}
                      </div>
                      <div className="col-span-1 min-w-0">
                        <LeadSignals lead={l} now={now} max={1} />
                      </div>
                      <div className="col-span-1 text-right text-sage-deep tabular-nums">{l.fit_score ?? "—"}</div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {activeStudio && (
        <CreateLeadModal
          studioId={activeStudio.id}
          open={showCreate}
          onOpenChange={setShowCreate}
          onCreated={(id) => { setShowCreate(false); navigate(`/leads/${id}`); }}
        />
      )}
    </div>
  );
};

const SIGNAL_CHIP_ACTIVE_TONE: Record<"attn" | "sage" | "stone", string> = {
  attn: "bg-attn text-ivory border-attn",
  sage: "bg-sage text-ivory border-sage",
  stone: "bg-ink text-ivory border-ink",
};

const SignalChipRow = ({
  activeSignal,
  totalCount,
  counts,
}: {
  activeSignal: InboxSignalKey | null;
  totalCount: number;
  counts: Record<InboxSignalKey, number>;
}) => (
  <div className="mb-5 flex flex-wrap items-center gap-2">
    <Link
      to="/leads"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] border no-underline transition-colors ${
        activeSignal === null
          ? "bg-ink text-ivory border-ink"
          : "text-stone border-border hover:border-pine hover:text-pine"
      }`}
    >
      <span>All</span>
      <span className="opacity-70 tabular-nums">{totalCount}</span>
    </Link>
    {INBOX_SIGNALS.map(({ key, label, tone }) => {
      const isActive = activeSignal === key;
      const count = counts[key];
      const className = isActive
        ? SIGNAL_CHIP_ACTIVE_TONE[tone]
        : "text-stone border-border hover:border-pine hover:text-pine";
      return (
        <Link
          key={key}
          to={`/leads?signal=${key}`}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] border no-underline transition-colors ${className}`}
        >
          <span>{label}</span>
          <span className="opacity-70 tabular-nums">{count}</span>
        </Link>
      );
    })}
  </div>
);

const LeadInboxLoading = () => (
  <OwnerStatePanel
    eyebrow="LOADING LEADS"
    body="Gathering the latest inbox records."
  />
);

const EmptyLeadInbox = ({ studioSlug, onCreate }: { studioSlug?: string; onCreate: () => void }) => (
  <OwnerStatePanel
    eyebrow="NO LEADS YET"
    title="Start with one real inquiry."
    body="Capture a public intake, paste a client message, or import a sheet. In no-key V1, new leads are saved for manual review without scores until analysis is enabled."
    actions={
      <>
      <a
        href={studioSlug ? `/intake/${studioSlug}` : "/settings"}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 px-4 py-2.5 border border-border text-xs uppercase tracking-[0.18em] text-ink hover:border-sage hover:bg-sage-soft/50 transition-colors"
      >
        <FileText size={13} /> Open Intake Form
      </a>
      <Link to="/leads/paste" className="flex items-center gap-2 px-4 py-2.5 border border-border text-xs uppercase tracking-[0.18em] text-ink hover:border-sage hover:bg-sage-soft/50 transition-colors">
        <MessageSquare size={13} /> Paste Message
      </Link>
      <Link to="/import" className="flex items-center gap-2 px-4 py-2.5 border border-border text-xs uppercase tracking-[0.18em] text-ink hover:border-sage hover:bg-sage-soft/50 transition-colors">
        <Upload size={13} /> Import Sheet
      </Link>
      <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2.5 bg-ink text-ivory text-xs uppercase tracking-[0.18em] hover:bg-ink/90 transition-colors">
        <Plus size={13} /> Create Lead
      </button>
      </>
    }
  />
);

const CreateLeadModal = ({
  studioId,
  open,
  onOpenChange,
  onCreated,
}: {
  studioId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: string) => void;
}) => {
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ full_name: "", email: "", phone: "", project_type: "", location: "", budget_range: "", brief: "" });

  useEffect(() => {
    if (!open) {
      setF({ full_name: "", email: "", phone: "", project_type: "", location: "", budget_range: "", brief: "" });
      setBusy(false);
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.full_name) { toast.error("Name required"); return; }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("create-manual-lead", {
      body: { studio_id: studioId, ...f },
    });
    if (error || !data?.ok) {
      toast.error(data?.error || error?.message || "Failed to create lead");
      setBusy(false);
      return;
    }
    toast.success(data.ai_available === false ? "Lead created for manual review" : "Lead created");
    onCreated(data.lead_id);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border max-w-lg p-8 gap-0 rounded-none sm:rounded-none">
        <DialogHeader className="text-left mb-6 space-y-0">
          <div className="micro-label mb-2">CREATE LEAD</div>
          <DialogTitle className="font-serif text-3xl text-ink font-normal tracking-normal leading-tight">New lead.</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <Inp label="Full name *" required value={f.full_name} onChange={(v: string) => setF({ ...f, full_name: v })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Inp label="Email" type="email" inputMode="email" value={f.email} onChange={(v: string) => setF({ ...f, email: v })} />
            <Inp label="Phone" type="tel" inputMode="tel" value={f.phone} onChange={(v: string) => setF({ ...f, phone: v })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Inp label="Project type" value={f.project_type} onChange={(v: string) => setF({ ...f, project_type: v })} />
            <Inp label="Location" value={f.location} onChange={(v: string) => setF({ ...f, location: v })} />
          </div>
          <Inp label="Budget" value={f.budget_range} onChange={(v: string) => setF({ ...f, budget_range: v })} />
          <label className="block">
            <div className="micro-label mb-2">Notes</div>
            <textarea value={f.brief} onChange={(e) => setF({ ...f, brief: e.target.value })} rows={3} className="w-full bg-transparent border border-border focus:border-pine outline-none p-3 text-ink text-sm" />
          </label>
          <button type="submit" disabled={busy} className="w-full px-6 py-3 bg-ink text-ivory text-xs uppercase tracking-[0.22em] hover:bg-ink/90 disabled:opacity-60">{busy ? "Creating…" : "Create lead"}</button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Inp = ({ label, value, onChange, ...rest }: any) => (
  <label className="block">
    <div className="micro-label mb-2">{label}</div>
    <input {...rest} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent border-b border-border focus:border-pine outline-none py-2 text-ink" />
  </label>
);

export default Leads;
