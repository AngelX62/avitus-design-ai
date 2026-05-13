import type { ReactNode } from "react";

type OwnerStatePanelProps = {
  eyebrow: string;
  title?: string;
  body: string;
  actions?: ReactNode;
};

export const OwnerStatePanel = ({ eyebrow, title, body, actions }: OwnerStatePanelProps) => (
  <div className="border border-border bg-card p-8 md:p-12">
    <div className="micro-label mb-3">{eyebrow}</div>
    {title && <h2 className="font-serif text-3xl text-ink mb-3 leading-tight">{title}</h2>}
    <p className="text-sm text-stone leading-relaxed max-w-2xl">{body}</p>
    {actions && <div className="mt-6 flex flex-wrap gap-2">{actions}</div>}
  </div>
);
