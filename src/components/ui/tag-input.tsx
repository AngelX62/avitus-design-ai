import { KeyboardEvent, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type TagInputProps = {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
};

export const TagInput = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  ariaLabel,
  className,
}: TagInputProps) => {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const existsCaseInsensitive = value.some(
      (v) => v.toLowerCase() === trimmed.toLowerCase(),
    );
    if (!existsCaseInsensitive) onChange([...value, trimmed]);
    setDraft("");
  };

  const removeAt = (index: number) => {
    const next = value.slice();
    next.splice(index, 1);
    onChange(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit();
    } else if (event.key === "Tab" && draft.trim()) {
      event.preventDefault();
      commit();
    } else if (event.key === "Backspace" && draft === "" && value.length > 0) {
      event.preventDefault();
      removeAt(value.length - 1);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-wrap gap-1.5 items-center min-h-[42px] rounded-md border border-input bg-background px-3 py-2",
        "transition-[border-color,box-shadow,background-color] duration-200 ease-out",
        "hover:border-sage/60 focus-within:border-sage focus-within:bg-sage-soft/30 focus-within:ring-2 focus-within:ring-sage/30 focus-within:ring-offset-1",
        disabled && "cursor-not-allowed opacity-60 pointer-events-none",
        className,
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag, index) => (
        <span
          key={`${tag}-${index}`}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-secondary border border-border text-[11px] uppercase tracking-wider text-ink"
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={(event) => {
                event.stopPropagation();
                removeAt(index);
              }}
              className="flex items-center justify-center text-stone hover:text-attn"
            >
              <X size={11} />
            </button>
          )}
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => draft.trim() && commit()}
        disabled={disabled}
        placeholder={value.length === 0 ? placeholder : ""}
        aria-label={ariaLabel}
        className="bg-transparent outline-none flex-1 min-w-[140px] text-sm text-ink placeholder:text-muted-foreground"
      />
    </div>
  );
};
