import { useState } from "react";
import { Notebook, ArrowRight } from "lucide-react";
import { STATUS_LABELS } from "@/lib/format";

type LeadActivityRailProps = {
  activities: any[];
  history: any[];
  note: string;
  setNote: (value: string) => void;
  onAddNote: () => void;
};

type Row =
  | { _kind: "note"; _at: string; body?: string }
  | { _kind: "status"; _at: string; from_status?: string | null; to_status?: string | null };

const railFor = (kind: Row["_kind"]) => (kind === "status" ? "border-l-sage/70" : "border-l-stone/40");

export const LeadActivityRail = ({ activities, history, note, setNote, onAddNote }: LeadActivityRailProps) => {
  const [submitting, setSubmitting] = useState(false);

  const rows: Row[] = [
    ...activities.map((a) => ({ ...a, _kind: "note" as const, _at: a.created_at })),
    ...history.map((h) => ({ ...h, _kind: "status" as const, _at: h.changed_at })),
  ].sort((a, b) => new Date(b._at).getTime() - new Date(a._at).getTime());

  const handleSubmit = async () => {
    if (!note.trim() || submitting) return;
    setSubmitting(true);
    try {
      await Promise.resolve(onAddNote());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="border-t border-border pt-7 mb-8">
      <div className="micro-label mb-5 flex items-center gap-2">
        <Notebook size={11} strokeWidth={1.5} /> Notes &amp; history
      </div>

      <div className="flex items-center gap-2 mb-6">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSubmit();
            }
          }}
          placeholder="Leave an internal note…"
          className="min-w-0 flex-1 bg-transparent border-b border-border focus:border-pine outline-none py-2 text-sm placeholder:text-stone/70"
        />
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!note.trim() || submitting}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-stone hover:text-pine disabled:opacity-40 disabled:hover:text-stone transition-colors"
        >
          {submitting ? "Adding" : "Add"}
          <ArrowRight size={11} strokeWidth={1.5} />
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="text-sm text-stone">No activity yet.</div>
      ) : (
        <ol className="space-y-3.5">
          {rows.map((row, i) => (
            <li key={`${row._kind}-${row._at}-${i}`} className={`border-l-[2px] ${railFor(row._kind)} pl-4 py-1`}>
              {row._kind === "note" ? (
                <div className="text-sm text-ink whitespace-pre-wrap">{row.body}</div>
              ) : (
                <div className="text-sm text-ink">
                  Status:{" "}
                  <span className="text-stone">{STATUS_LABELS[row.from_status ?? ""] || row.from_status || "—"}</span>
                  {" → "}
                  <span className="text-pine">{STATUS_LABELS[row.to_status ?? ""] || row.to_status}</span>
                </div>
              )}
              <div className="text-xs text-stone mt-1">{new Date(row._at).toLocaleString()}</div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};
