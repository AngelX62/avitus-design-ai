import { ReactNode } from "react";
import { SectionMarker } from "./SectionMarker";

export const PageHeader = ({
  eyebrow,
  sectionNumber,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  sectionNumber?: string | number;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) => (
  <div className="flex flex-wrap items-end justify-between gap-6 pb-8 mb-10 border-b border-foreground">
    <div className="max-w-2xl">
      {eyebrow && (
        <div className="mb-5">
          <SectionMarker number={sectionNumber} label={eyebrow} />
        </div>
      )}
      <h1 className="text-[40px] md:text-[52px] text-foreground leading-[1.02] tracking-[-0.035em] font-normal">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-4 text-[15px] md:text-[16px] text-graphite leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);
