import { useEffect, useRef, type ReactNode } from "react";
import { ChevronDown, Copy, Edit3, FileText, MessageSquareQuote, Sparkles } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SOURCE_LABELS } from "@/lib/format";
import {
  AnalysisPlaceholder,
  ScoreRubric,
  SCORE_ROWS,
  type DisplayCriterion,
} from "./lead-detail-utils";

type AnalysisState = { title: string; body: string };

type LeadContextStackProps = {
  lead: any;
  analysisState: AnalysisState;
  analysisComplete: boolean;
  aiUnavailable: boolean;
  followupDraft: string;
  setFollowupDraft: (value: string) => void;
  editingFollowup: boolean;
  setEditingFollowup: (value: boolean) => void;
  followupOpen: boolean;
  setFollowupOpen: (value: boolean) => void;
  onSaveFollowup: () => void;
  onCopyFollowup: () => void;
  scoreCriteria: DisplayCriterion[];
  reviewReasons: string[];
};

const SectionTrigger = ({ title, icon }: { title: string; icon?: ReactNode }) => (
  <CollapsibleTrigger className="group flex w-full items-center justify-between py-5 text-left transition-colors hover:text-pine">
    <span className="micro-label flex items-center gap-2">
      {icon}
      {title}
    </span>
    <ChevronDown
      size={14}
      strokeWidth={1.5}
      className="text-stone transition-transform duration-200 group-data-[state=open]:rotate-180 group-hover:text-pine"
    />
  </CollapsibleTrigger>
);

const CollapsibleBody = ({ children }: { children: ReactNode }) => (
  <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
    <div className="pb-7 pt-1">{children}</div>
  </CollapsibleContent>
);

const StaticSection = ({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) => (
  <section className="border-t border-border pt-7 pb-2 mb-1">
    <div className="micro-label mb-4 flex items-center gap-2">
      {icon}
      {title}
    </div>
    {children}
  </section>
);

export const LeadContextStack = ({
  lead,
  analysisState,
  analysisComplete,
  aiUnavailable,
  followupDraft,
  setFollowupDraft,
  editingFollowup,
  setEditingFollowup,
  followupOpen,
  setFollowupOpen,
  onSaveFollowup,
  onCopyFollowup,
  scoreCriteria,
  reviewReasons,
}: LeadContextStackProps) => {
  const suggestedFollowup = lead.suggested_followup || lead.ai_reply_draft || "";
  const customEntries = Object.entries(lead.custom_fields || {});
  const followupRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (followupOpen && followupRef.current) {
      followupRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [followupOpen]);

  return (
    <div>
      <section ref={followupRef} className="border-t border-border">
        <Collapsible open={followupOpen} onOpenChange={setFollowupOpen}>
          <SectionTrigger title="Follow-up draft" icon={<FileText size={11} strokeWidth={1.5} />} />
          <CollapsibleBody>
            {editingFollowup ? (
              <textarea
                value={followupDraft}
                onChange={(e) => setFollowupDraft(e.target.value)}
                rows={6}
                className="w-full bg-transparent border border-border focus:border-pine outline-none p-3 text-ink text-sm leading-relaxed"
              />
            ) : (
              <div className="min-h-[112px] border border-border bg-card p-3 text-sm text-ink leading-relaxed whitespace-pre-wrap">
                {suggestedFollowup || (
                  <span className="text-stone">
                    {aiUnavailable
                      ? "Analysis not enabled yet. Add a manual follow-up draft when you are ready."
                      : "No follow-up drafted yet. This space is ready for a future AI suggestion or a manual draft."}
                  </span>
                )}
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {editingFollowup ? (
                <>
                  <button
                    type="button"
                    onClick={onSaveFollowup}
                    className="px-3.5 py-2 bg-ink text-ivory text-[10px] uppercase tracking-[0.16em] hover:bg-ink/90 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFollowup(false);
                      setFollowupDraft(suggestedFollowup);
                    }}
                    className="px-3.5 py-2 border border-border bg-card text-[10px] uppercase tracking-[0.16em] text-stone hover:text-ink hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onCopyFollowup}
                    className="flex items-center gap-2 px-3.5 py-2 border border-border bg-card text-[10px] uppercase tracking-[0.16em] hover:bg-secondary transition-colors"
                  >
                    <Copy size={12} strokeWidth={1.5} /> Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingFollowup(true)}
                    className="flex items-center gap-2 px-3.5 py-2 border border-border bg-card text-[10px] uppercase tracking-[0.16em] hover:bg-secondary transition-colors"
                  >
                    <Edit3 size={12} strokeWidth={1.5} /> Edit
                  </button>
                </>
              )}
            </div>
          </CollapsibleBody>
        </Collapsible>
      </section>

      <section className="border-t border-border">
        <Collapsible defaultOpen={false}>
          <SectionTrigger title="Raw inquiry" icon={<MessageSquareQuote size={11} strokeWidth={1.5} />} />
          <CollapsibleBody>
            <pre className="bg-secondary/40 border border-border p-5 text-sm text-ink whitespace-pre-wrap font-sans leading-relaxed">
              {lead.raw_inquiry || lead.brief || <span className="text-stone">No original message captured.</span>}
            </pre>
          </CollapsibleBody>
        </Collapsible>
      </section>

      <section className="border-t border-border">
        <Collapsible defaultOpen={Boolean(lead.ai_summary)}>
          <SectionTrigger title="AI summary" icon={<Sparkles size={11} strokeWidth={1.5} />} />
          <CollapsibleBody>
            {lead.ai_summary ? (
              <p className="text-ink text-[15px] leading-relaxed">{lead.ai_summary}</p>
            ) : (
              <AnalysisPlaceholder
                title={analysisState.title}
                body="A concise lead summary will appear here after server-side analysis is enabled and completed."
              />
            )}
          </CollapsibleBody>
        </Collapsible>
      </section>

      <StaticSection title="Extracted fields">
        {!analysisComplete && (
          <div className="border border-border bg-secondary/35 px-4 py-3 mb-4">
            <div className="micro-label mb-1.5">{analysisState.title}</div>
            <div className="text-sm text-stone leading-relaxed">
              Saved lead fields are shown now. Future AI extraction can help fill gaps without changing the no-key workflow.
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border">
          {[
            ["Project type", lead.project_type],
            ["Property type", lead.property_type],
            ["Location", lead.location],
            ["Budget", lead.budget_range],
            ["Timeline", lead.timeline],
            ["Style", lead.style_preference],
            ["Urgency", lead.urgency],
            ["Source", SOURCE_LABELS[lead.source] || lead.source],
          ].map(([label, value]) => (
            <div key={label as string} className="bg-background p-4">
              <div className="micro-label mb-1.5">{label}</div>
              <div className="text-sm text-ink">{value || <span className="text-stone">—</span>}</div>
            </div>
          ))}
        </div>
      </StaticSection>

      <StaticSection title="Score breakdown">
        {scoreCriteria.length > 0 || reviewReasons.length > 0 ? (
          <div className="space-y-4">
            {scoreCriteria.map((criterion) => {
              const awarded = criterion.awarded_points;
              return (
                <div key={criterion.key}>
                  <div className="flex items-baseline justify-between mb-2">
                    <div className="text-sm text-ink">{criterion.label}</div>
                    <div className="text-xs text-stone tabular-nums">
                      {awarded == null ? "—" : `${awarded} / ${criterion.max_points}`}
                    </div>
                  </div>
                  <ScoreRubric awarded={awarded} max={criterion.max_points} />
                  {criterion.reason && <div className="text-xs text-stone mt-2">{criterion.reason}</div>}
                  {criterion.evidence && <div className="text-xs text-ink mt-1">Evidence: {criterion.evidence}</div>}
                </div>
              );
            })}
            {reviewReasons.length > 0 && (
              <div className="border border-attn-rule/40 bg-attn-soft px-4 py-3">
                <div className="micro-label text-attn mb-2">NEEDS REVIEW</div>
                <ul className="space-y-1 text-xs text-ink">
                  {reviewReasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border border-border bg-card divide-y divide-border">
              {SCORE_ROWS.map((row) => (
                <div key={row.key} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="text-sm text-ink">{row.label}</div>
                  <div className="text-xs text-stone">Pending / {row.max_points}</div>
                </div>
              ))}
            </div>
            <AnalysisPlaceholder
              title={analysisState.title}
              body="No weighted rubric has been saved. Avitus will not show a fit score until real analysis produces scoring signals."
            />
          </div>
        )}
      </StaticSection>

      {customEntries.length > 0 && (
        <StaticSection title="Custom fields">
          <div className="border border-border bg-card divide-y divide-border">
            {customEntries.map(([k, v]) => (
              <div key={k} className="grid grid-cols-3 gap-4 px-5 py-3">
                <div className="micro-label col-span-1">{k}</div>
                <div className="col-span-2 text-sm text-ink">{String(v)}</div>
              </div>
            ))}
          </div>
        </StaticSection>
      )}
    </div>
  );
};
