import { FormEvent, KeyboardEvent, ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";
import { ArrowUp, Copy, Pencil, SendHorizontal, X } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion, useIsPresent, useReducedMotion } from "motion/react";
import { AvaraLauncher, type AvaraLauncherState } from "@/components/AvaraLauncher";
import { AvaraApprovalPreview } from "@/components/AvaraApprovalPreview";
import { AvaraOrb, type AvaraOrbState } from "@/components/AvaraOrb";
import { Button } from "@/components/ui/button";
import { useStudio } from "@/contexts/StudioContext";
import { runAvaraTool } from "@/lib/avaraTools";

export type CommandThreadState = "active" | "thinking" | "splitting" | "streaming" | "ready";
export type AvaraShellVariant = "compact" | "workspace";

const orbStateFor = (state: CommandThreadState): AvaraOrbState => {
  if (state === "splitting") return "preparing";
  return state;
};

const thinkingStatuses = [
  "Checking lead context...",
  "Preparing recommended action...",
  "Composing draft...",
  "Draft ready for approval...",
] as const;

const workspaceSuggestions = [
  "What needs attention today?",
  "Which leads need follow-up?",
  "Show my Action Queue",
] as const;

const compactSuggestions = [
  "What needs attention today?",
  "Show leads going cold",
  "Show missing info",
] as const;

const revealTransition = {
  duration: 0.34,
  ease: [0.22, 1, 0.36, 1],
} as const;

interface CompactPanelProps {
  children: ReactNode;
  shouldReduceMotion: boolean | null;
}

const CompactPanel = ({ children, shouldReduceMotion }: CompactPanelProps) => {
  const isPresent = useIsPresent();
  const panelTransition = shouldReduceMotion
    ? ({ duration: 0 } as const)
    : ({ duration: 0.3, ease: [0.22, 1, 0.36, 1] } as const);

  return (
    <motion.div
      key="avara-panel"
      className="w-[min(calc(100vw-1.5rem),22rem)] overflow-hidden rounded-[14px] border border-border/80 bg-card text-card-foreground shadow-rest-lit transition-shadow duration-200 focus-within:shadow-attention-lit"
      data-present={isPresent ? "true" : "false"}
      aria-hidden={!isPresent}
      initial={
        shouldReduceMotion
          ? false
          : {
              opacity: 0,
              y: 12,
              scale: 0.98,
              clipPath: "circle(20% at 93% 90%)",
              filter: "blur(5px)",
            }
      }
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        clipPath: "circle(150% at 93% 90%)",
        filter: "blur(0px)",
      }}
      exit={
        shouldReduceMotion
          ? { opacity: 0 }
          : {
              opacity: 0,
              y: 10,
              scale: 0.985,
              clipPath: "circle(18% at 94% 92%)",
              filter: "blur(3px)",
            }
      }
      transition={panelTransition}
    >
      {children}
    </motion.div>
  );
};

const visuallyHiddenStyle = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
} as const;

interface AvaraShellProps {
  variant?: AvaraShellVariant;
  actionCount?: number;
  thinkingMessage?: string;
  isThinking?: boolean;
}

export const AvaraShell = ({
  variant = "compact",
  actionCount = 0,
  thinkingMessage,
  isThinking = false,
}: AvaraShellProps = {}) => {
  const { activeStudio } = useStudio();
  const isWorkspace = variant === "workspace";
  const shouldReduceMotion = useReducedMotion();
  const contentTransition = shouldReduceMotion ? { duration: 0 } : revealTransition;
  const generatedId = useId().replace(/:/g, "");
  const inputId = `avara-command-input-${generatedId}`;
  const descriptionId = `avara-command-description-${generatedId}`;
  const compactLensLayoutId = `avara-compact-lens-${generatedId}`;
  const [isOpen, setIsOpen] = useState(isWorkspace);
  const [prompt, setPrompt] = useState("");
  const [threadState, setThreadState] = useState<CommandThreadState>("active");
  const [statusIndex, setStatusIndex] = useState(0);
  const [submittedPrompt, setSubmittedPrompt] = useState("");
  const [draftText, setDraftText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [approvalNotice, setApprovalNotice] = useState("");
  const timerRefs = useRef<number[]>([]);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const chatLogRef = useRef<HTMLDivElement | null>(null);

  const closeCompactShell = useCallback(() => {
    if (!isWorkspace) {
      setIsOpen(false);
    }
  }, [isWorkspace]);

  const clearTimers = () => {
    timerRefs.current.forEach((timerId) => window.clearTimeout(timerId));
    timerRefs.current = [];
  };

  useEffect(() => clearTimers, []);

  useEffect(() => {
    if (isWorkspace) setIsOpen(true);
  }, [isWorkspace]);

  useEffect(() => {
    if (!isOpen) return;
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(focusTimer);
  }, [isOpen]);

  useEffect(() => {
    if (isWorkspace || !isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!shellRef.current?.contains(event.target as Node)) {
        closeCompactShell();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [closeCompactShell, isOpen, isWorkspace]);

  const visualState: CommandThreadState = isThinking ? "thinking" : threadState;
  const orbVisualState: AvaraOrbState =
    visualState === "active" && actionCount > 0 ? "ready" : orbStateFor(visualState);
  const launcherVisualState: AvaraLauncherState =
    orbVisualState === "ready" || orbVisualState === "active" ? orbVisualState : "thinking";
  const statusCopy = isThinking
    ? thinkingMessage ?? "Checking lead context..."
    : visualState === "active" && actionCount > 0
      ? `${actionCount} owner signal${actionCount === 1 ? "" : "s"} waiting`
      : visualState === "active"
        ? "Avara is live"
        : thinkingStatuses[statusIndex];

  useEffect(() => {
    if (!isWorkspace) return;
    const chatLog = chatLogRef.current;
    if (!chatLog) return;
    if (typeof chatLog.scrollTo === "function") {
      chatLog.scrollTo({ top: chatLog.scrollHeight, left: 0, behavior: "auto" });
      return;
    }
    chatLog.scrollTop = chatLog.scrollHeight;
  }, [draftText, isWorkspace, submittedPrompt, visualState]);

  const buildDraft = useCallback((request: string): string | Promise<string> => {
    if (!activeStudio?.id) {
      return `Local preview for: "${request}"\n\nRecommended owner action: review the relevant lead context, confirm the next step, and keep any client-facing message owner-approved.`;
    }

    return runAvaraTool(activeStudio.id, request).catch((error) => {
      const message = error instanceof Error ? error.message : "Avara could not load the studio context.";
      return `Avara could not complete the read-only tool check.\n\n${message}\n\nNo message was sent, no record was changed, and no external action was taken.`;
    });
  }, [activeStudio?.id]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || visualState !== "active") return;

    clearTimers();
    setSubmittedPrompt(cleanPrompt);
    setDraftText("");
    setIsEditing(false);
    setApprovalNotice("");
    setStatusIndex(0);
    setThreadState("thinking");

    timerRefs.current = [
      window.setTimeout(() => {
        setStatusIndex(1);
        setThreadState("splitting");
      }, 720),
      window.setTimeout(() => {
        setStatusIndex(2);
        setThreadState("streaming");
      }, 1280),
      window.setTimeout(() => {
        setStatusIndex(3);
        setThreadState("ready");
      }, 1820),
      window.setTimeout(() => {
        const result = buildDraft(cleanPrompt);
        if (typeof result === "string") setDraftText(result);
        else void result.then(setDraftText);
      }, 2160),
    ];
  };

  const handleInputKeys = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === "Escape" && !isWorkspace) {
      closeCompactShell();
    }
  };

  const rejectDraft = () => {
    clearTimers();
    setDraftText("");
    setSubmittedPrompt("");
    setApprovalNotice("");
    setIsEditing(false);
    setThreadState("active");
    setStatusIndex(0);
  };

  const copyDraft = async () => {
    if (!draftText.trim()) return;
    try {
      await navigator.clipboard.writeText(draftText);
      setApprovalNotice("Copied. No external action was taken.");
    } catch {
      setApprovalNotice("Copy is unavailable in this browser. No external action was taken.");
    }
  };

  const applySuggestion = (suggestion: string) => {
    if (isProcessing) return;
    setPrompt(suggestion);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const isProcessing = visualState !== "active" && draftText.length === 0;

  const compactActionCard = draftText ? (
    <motion.section
      key="avara-action-card"
      layout
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12, scale: 0.97, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98, filter: "blur(3px)" }}
      transition={contentTransition}
      className="pointer-events-auto mt-2 w-[min(calc(100vw-1.5rem),22rem)] overflow-hidden rounded-[14px] border border-border/80 bg-card text-card-foreground shadow-rest-lit p-5"
      aria-label="Avara read-only result"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="micro-label text-stone">READ-ONLY TOOLBELT</div>
          <h2 className="mt-1.5 text-sm font-medium text-ink leading-snug">Pipeline result ready</h2>
        </div>
        <button
          type="button"
          onClick={rejectDraft}
          className="shrink-0 -mr-1 -mt-1 rounded-full p-1 text-stone transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          aria-label="Dismiss Avara preview"
        >
          <X size={15} strokeWidth={1.5} />
        </button>
      </div>

      <div className="mt-4 border-l-2 border-sage/50 pl-3">
        <div className="micro-label text-stone">OWNER REQUEST</div>
        <p className="mt-1 text-sm leading-relaxed text-stone">{submittedPrompt}</p>
      </div>

      {isEditing ? (
        <textarea
          value={draftText}
          onChange={(event) => setDraftText(event.target.value)}
          className="mt-4 min-h-28 w-full resize-none rounded-md border border-border bg-background px-3 py-2.5 text-sm leading-6 text-ink outline-none transition-[border-color,box-shadow,background-color] duration-200 focus-visible:border-sage focus-visible:bg-sage-soft/30 focus-visible:ring-2 focus-visible:ring-sage/30"
          aria-label="Edit local Avara action draft"
          onKeyDown={handleInputKeys}
        />
      ) : (
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink">{draftText}</p>
      )}

      {approvalNotice && (
        <p className="mt-3 text-[11px] text-stone">{approvalNotice}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button type="button" onClick={copyDraft} size="sm" variant="default">
          <Copy size={13} strokeWidth={1.7} />
          Copy
        </Button>
        <Button type="button" onClick={() => setIsEditing(true)} size="sm" variant="outline">
          <Pencil size={13} strokeWidth={1.7} />
          Edit
        </Button>
        <Button type="button" onClick={rejectDraft} size="sm" variant="ghost">
          Clear
        </Button>
      </div>
    </motion.section>
  ) : null;

  const workspaceActionCard = draftText ? (
    <motion.section
      key="avara-action-card"
      layout
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12, scale: 0.97, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98, filter: "blur(3px)" }}
      transition={contentTransition}
      className="avara-action-card pointer-events-auto"
      aria-label="Avara read-only result"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="avara-kicker text-[10px] uppercase tracking-[0.2em]">
            Read-only toolbelt
          </div>
          <h2 className="avara-title mt-1 text-sm font-medium">Pipeline result ready</h2>
        </div>
        <button
          type="button"
          onClick={rejectDraft}
          className="avara-icon-button rounded-full p-1 transition-colors"
          aria-label="Dismiss Avara preview"
        >
          <X size={15} strokeWidth={1.5} />
        </button>
      </div>

      <div className="avara-quote mt-3 pl-3">
        <p className="avara-faint text-xs uppercase tracking-[0.16em]">Owner request</p>
        <p className="avara-muted mt-1 text-sm leading-6">{submittedPrompt}</p>
      </div>

      {isEditing ? (
        <textarea
          value={draftText}
          onChange={(event) => setDraftText(event.target.value)}
          className="avara-draft-editor mt-4 min-h-28 w-full resize-none px-3 py-3 text-sm leading-6 outline-none transition-colors"
          aria-label="Edit local Avara action draft"
          onKeyDown={handleInputKeys}
        />
      ) : (
        <p className="avara-soft mt-4 whitespace-pre-line text-sm leading-6">{draftText}</p>
      )}

      {approvalNotice && (
        <p className="avara-kicker mt-3 text-xs">{approvalNotice}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copyDraft}
          className="avara-action-button avara-action-primary"
        >
          <Copy size={13} strokeWidth={1.7} />
          Copy
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="avara-action-button avara-action-secondary"
        >
          <Pencil size={13} strokeWidth={1.7} />
          Edit
        </button>
        <button
          type="button"
          onClick={rejectDraft}
          className="avara-action-button avara-action-ghost"
        >
          Clear
        </button>
      </div>
    </motion.section>
  ) : null;

  const showCompactStatus =
    visualState !== "active" || (visualState === "active" && actionCount > 0);
  const showCompactSuggestions =
    !submittedPrompt && !isProcessing && prompt.length === 0 && !draftText;
  const compactSendEnabled = Boolean(prompt.trim()) && visualState === "active";

  const compactCommandForm = (
    <motion.form
      layout
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={contentTransition}
      data-state={visualState}
      data-testid="avara-command-bar"
      aria-label="Avara command input"
      onSubmit={handleSubmit}
      className="px-5 py-4"
    >
      {showCompactSuggestions && (
        <div className="mb-3 flex flex-wrap gap-1.5" aria-label="Suggested Avara prompts">
          {compactSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => applySuggestion(suggestion)}
              className="rounded-full border border-border/80 bg-secondary/40 px-2.5 py-1 text-[11px] text-stone transition-colors hover:border-sage/50 hover:bg-sage-soft/40 hover:text-sage-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <label className="min-w-0 flex-1" htmlFor={inputId}>
          <span style={visuallyHiddenStyle}>Avara prompt</span>
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={handleInputKeys}
            className="w-full bg-transparent text-sm text-ink caret-sage outline-none placeholder:text-stone/70 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="Ask Avara about leads, follow-ups, or opportunities..."
            autoComplete="off"
            disabled={isProcessing}
            aria-describedby={descriptionId}
          />
        </label>
        <button
          type="submit"
          disabled={!compactSendEnabled}
          aria-label="Preview Avara response"
          className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:opacity-30 ${
            compactSendEnabled
              ? "bg-sage-soft text-sage-deep hover:bg-sage hover:text-ivory"
              : "text-stone"
          }`}
        >
          <ArrowUp size={14} strokeWidth={2} />
        </button>
      </div>

      {showCompactStatus && (
        <div className="mt-2 min-h-[14px]">
          <AnimatePresence initial={false}>
            <motion.p
              key={statusCopy}
              className="truncate text-[11px] leading-snug text-stone"
              aria-live="polite"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -3 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
            >
              {statusCopy}
            </motion.p>
          </AnimatePresence>
        </div>
      )}

      <p id={descriptionId} style={visuallyHiddenStyle}>
        Avara uses fixed read-only tools when a studio is active. It does not call a model,
        save messages, mutate records, or send client-facing actions.
      </p>
    </motion.form>
  );

  const workspaceCommandForm = (
    <motion.form
      layout
      initial={shouldReduceMotion || isWorkspace ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={contentTransition}
      className="avara-command-surface pointer-events-auto avara-workspace-command"
      data-state={visualState}
      data-testid="avara-command-bar"
      aria-label="Avara command input"
      onSubmit={handleSubmit}
    >
      <span className="avara-thread" aria-hidden="true" />
      <span className="avara-thread-split avara-thread-context" aria-hidden="true" />
      <span className="avara-thread-split avara-thread-rules" aria-hidden="true" />
      <span className="avara-thread-split avara-thread-action" aria-hidden="true" />
      <span className="avara-thread-merge" aria-hidden="true" />

      <motion.div
        className="relative flex min-h-16 items-center gap-3 px-3 sm:px-4"
        initial={shouldReduceMotion || isWorkspace ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...contentTransition, delay: shouldReduceMotion ? 0 : 0.06 }}
      >
        <AvaraOrb state={orbVisualState} size={42} className="avara-command-orb" />

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-3">
            <div className="avara-kicker text-[10px] uppercase tracking-[0.2em]">Avara</div>
            <div className="avara-dim hidden text-[10px] uppercase tracking-[0.16em] sm:block">
              Approval-first
            </div>
          </div>

          <label className="block min-w-0" htmlFor={inputId}>
            <span style={visuallyHiddenStyle}>Avara</span>
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={handleInputKeys}
              className="avara-command-input"
              placeholder="Ask Avara what needs attention today..."
              autoComplete="off"
              disabled={isProcessing}
              aria-describedby={descriptionId}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={!prompt.trim() || visualState !== "active"}
          className="avara-command-submit"
          aria-label="Preview Avara response"
        >
          <ArrowUp size={15} strokeWidth={1.8} />
        </button>
      </motion.div>

      <div className="relative flex items-center justify-between gap-3 px-3 pb-2.5 sm:px-4">
        <AnimatePresence initial={false}>
          <motion.p
            key={statusCopy}
            className="avara-faint truncate text-[11px]"
            aria-live="polite"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
          >
            {statusCopy}
          </motion.p>
        </AnimatePresence>
      </div>

      <p id={descriptionId} style={visuallyHiddenStyle}>
        Avara uses fixed read-only tools when a studio is active. It does not call a model,
        save messages, mutate records, or send client-facing actions.
      </p>
    </motion.form>
  );

  if (isWorkspace) {
    return (
      <section className="avara-workspace-shell avara-chat-workspace" aria-label="Avara chat workspace">
        <header className="avara-chat-header">
          <div className="avara-chat-identity">
            <div className="avara-chat-orb-frame">
              <AvaraOrb state={orbVisualState} size={52} className="avara-chat-orb" />
            </div>
            <div className="min-w-0">
              <div className="avara-kicker text-[10px] uppercase tracking-[0.2em]">Approval-first assistant</div>
              <h1 className="font-serif text-4xl leading-none text-[var(--ask-text)]">Avara</h1>
            </div>
          </div>
          <div className="avara-chat-status" data-state={visualState}>
            {statusCopy}
          </div>
        </header>

        <div ref={chatLogRef} className="avara-chat-log" role="log" aria-live="polite">
          <article className="avara-message avara-message-assistant">
            <div className="avara-message-mark">
              <AvaraOrb state={orbVisualState} size={28} />
            </div>
            <div className="avara-message-bubble">
              <div className="avara-message-name">Avara</div>
              <p>
                I can review your lead pipeline through fixed read-only tools, summarize attention points,
                and keep every client-facing action outside this Foundation flow.
              </p>
            </div>
          </article>

          {submittedPrompt && (
            <article className="avara-message avara-message-user">
              <div className="avara-message-bubble">
                <div className="avara-message-name">You</div>
                <p>{submittedPrompt}</p>
              </div>
            </article>
          )}

          {submittedPrompt && isProcessing && (
            <article className="avara-message avara-message-assistant">
              <div className="avara-message-mark">
                <AvaraOrb state={orbVisualState} size={28} />
              </div>
              <div className="avara-message-bubble">
                <div className="avara-message-name">Avara</div>
                <p>{statusCopy}</p>
              </div>
            </article>
          )}

          {draftText ? (
            <div className="avara-chat-result">
              {workspaceActionCard}
            </div>
          ) : (
            !submittedPrompt && <AvaraApprovalPreview />
          )}
        </div>

        <div className="avara-chat-composer-wrap">
          <div className="avara-chat-suggestions" aria-label="Suggested Avara prompts">
            {workspaceSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="avara-suggestion-chip"
                onClick={() => applySuggestion(suggestion)}
                disabled={isProcessing}
              >
                {suggestion}
              </button>
            ))}
          </div>
          <form className="avara-chat-composer" onSubmit={handleSubmit} aria-label="Avara chat input">
            <label className="min-w-0 flex-1" htmlFor={inputId}>
              <span style={visuallyHiddenStyle}>Avara chat prompt</span>
              <input
                ref={inputRef}
                id={inputId}
                type="text"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={handleInputKeys}
                className="avara-chat-input"
                placeholder="Ask Avara about leads, follow-ups, or today's priorities..."
                autoComplete="off"
                disabled={isProcessing}
                aria-describedby={descriptionId}
              />
            </label>
            <button
              type="submit"
              disabled={!prompt.trim() || visualState !== "active"}
              className="avara-chat-send"
              aria-label="Send Avara prompt"
            >
              <SendHorizontal size={16} strokeWidth={1.8} />
            </button>
          </form>
          <p id={descriptionId} style={visuallyHiddenStyle}>
            Avara uses fixed read-only tools when a studio is active. It does not call a model,
            save messages, mutate records, or send client-facing actions.
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="pointer-events-none fixed bottom-5 right-4 z-[80] flex w-auto flex-col items-end gap-2 md:bottom-7 md:right-6">
      <div ref={shellRef} className="avara-compact-stage pointer-events-auto flex flex-col items-end gap-2">
        <LayoutGroup id={`avara-compact-${generatedId}`}>
          {!isOpen && (
            <div className="avara-launcher-frame">
              <AvaraLauncher
                state={launcherVisualState}
                actionCount={actionCount}
                onOpen={() => setIsOpen(true)}
                lensLayoutId={compactLensLayoutId}
              />
            </div>
          )}
          <AnimatePresence initial={false}>
            {isOpen && (
              <CompactPanel shouldReduceMotion={shouldReduceMotion}>
                <motion.div
                  className="flex items-start justify-between gap-3 px-5 pt-5 pb-4"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...contentTransition, delay: shouldReduceMotion ? 0 : 0.08 }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <AvaraOrb
                      state={orbVisualState}
                      size={32}
                      className="avara-panel-orb"
                      layoutId={compactLensLayoutId}
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium leading-tight text-ink">Avara</div>
                      <div className="mt-0.5 text-[11px] leading-snug text-stone">
                        Approval-first lead intelligence
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeCompactShell}
                    className="-mr-1 -mt-1 shrink-0 rounded-full p-1 text-stone transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                    aria-label="Close Avara"
                  >
                    <X size={14} strokeWidth={1.5} />
                  </button>
                </motion.div>
                <div className="mx-5 h-px bg-border/80" aria-hidden="true" />
                {compactCommandForm}
              </CompactPanel>
            )}
          </AnimatePresence>
          {isOpen && compactActionCard}
        </LayoutGroup>
      </div>
    </div>
  );
};
