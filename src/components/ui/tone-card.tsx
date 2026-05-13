import { cn } from "@/lib/utils";

type ToneCardProps = {
  label: string;
  description: string;
  example: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  name?: string;
};

export const ToneCard = ({
  label,
  description,
  example,
  selected,
  onSelect,
  disabled = false,
  name,
}: ToneCardProps) => {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${label}. ${description}`}
      name={name}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "text-left p-5 border transition-colors duration-150 flex flex-col gap-3",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/40 focus-visible:ring-offset-1",
        selected
          ? "border-pine bg-pine/5"
          : "border-border bg-card hover:border-pine/40",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className={cn(
            "h-3 w-3 rounded-full border transition-colors",
            selected ? "border-pine bg-pine" : "border-stone bg-background",
          )}
        />
        <span className="micro-label text-ink">{label}</span>
      </div>
      <p className="text-[13px] text-stone leading-relaxed">{description}</p>
      <p className="font-serif italic text-[15px] text-stone/90 leading-relaxed">
        &ldquo;{example}&rdquo;
      </p>
    </button>
  );
};
