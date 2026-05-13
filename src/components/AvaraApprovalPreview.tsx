import { Check, Pencil, X } from "lucide-react";

export const AvaraApprovalPreview = () => (
  <section
    className="avara-action-card avara-preview-card pointer-events-auto"
    aria-label="Avara approval preview example"
  >
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-2">
        <span className="avara-preview-badge">Ready for approval</span>
        <h3 className="avara-title font-serif text-xl leading-tight md:text-2xl">
          3 leads need your attention
        </h3>
      </div>
      <span className="avara-faint text-[10px] uppercase tracking-[0.18em]">
        Example
      </span>
    </div>

    <div className="avara-preview-divider mt-4" />

    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="avara-title text-sm font-medium">Amanda Lee</span>
      <span className="avara-preview-tag">High intent</span>
    </div>

    <p className="avara-muted mt-3 text-sm leading-6">
      Asked about timeline, budget, and consultation availability.
    </p>

    <div className="avara-quote mt-4 pl-3">
      <p className="avara-faint text-[10px] uppercase tracking-[0.16em]">
        Suggested action
      </p>
      <p className="avara-soft mt-1 text-sm leading-6">
        Send a follow-up and offer two consultation slots.
      </p>
    </div>

    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="avara-action-button avara-action-primary"
          aria-label="Approve (preview only)"
        >
          <Check size={13} strokeWidth={1.7} />
          Approve
        </button>
        <button
          type="button"
          className="avara-action-button avara-action-secondary"
          aria-label="Edit (preview only)"
        >
          <Pencil size={13} strokeWidth={1.7} />
          Edit
        </button>
        <button
          type="button"
          className="avara-action-button avara-action-ghost"
          aria-label="Dismiss (preview only)"
        >
          <X size={13} strokeWidth={1.7} />
          Dismiss
        </button>
      </div>
      <p className="avara-faint text-[10px] uppercase tracking-[0.18em]">
        Preview only · nothing is sent
      </p>
    </div>
  </section>
);
