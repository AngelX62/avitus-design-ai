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
  <div className="flex flex-wrap items-end justify-between gap-6 pb-10 mb-10 border-b border-hairline">
    <div className="max-w-2xl">
      {eyebrow && (
        <div className="mb-5">
          <SectionMarker number={sectionNumber} label={eyebrow} />
        </div>
      )}
      <h1 className="font-serif text-5xl md:text-6xl text-ink leading-[0.95]">
        {title}
      </h1>
      {subtitle && (
        <p className="italic-serif mt-5 text-[19px] md:text-[21px] leading-snug">
          {subtitle}
        </p>
      )}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);