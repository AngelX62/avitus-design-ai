import { ReactNode } from "react";

export const PageHeader = ({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) => (
  <div className="flex items-end justify-between gap-6 pb-10 mb-10 border-b border-border">
    <div>
      {eyebrow && <div className="micro-label mb-4">{eyebrow}</div>}
      <h1 className="font-serif text-5xl text-ink leading-none">{title}</h1>
      {subtitle && <p className="mt-4 text-stone max-w-xl text-[15px] leading-relaxed">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-3">{actions}</div>}
  </div>
);