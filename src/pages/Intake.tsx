import { ReactNode, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import {
  buildBudgetOptions,
  getIntakeHeroTitle,
  getIntakeThankYouMessage,
  normalizeIntakeOptions,
} from "@/lib/intakeCustomization";

const REVEAL_EASE = [0.22, 1, 0.36, 1] as const;
const REVEAL_DURATION = 0.48;

const TIMELINE_OPTIONS = [
  "ASAP",
  "1–3 months",
  "3–6 months",
  "6–12 months",
  "Exploring",
];

type StudioPublic = {
  studio_id: string;
  studio_name: string;
  slug: string;
  intake_intro: string | null;
  intake_thank_you_message: string | null;
  currency: string | null;
  preferred_project_types: string[] | null;
  preferred_locations: string[] | null;
  target_budget_min: number | null;
  target_budget_max: number | null;
  business_type: string | null;
};

const Intake = () => {
  const { studioSlug } = useParams();
  const reducedMotion = useReducedMotion();
  const [studio, setStudio] = useState<StudioPublic | null>(null);
  const [loadingStudio, setLoadingStudio] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    project_type: "Full home",
    rooms: "",
    budget_range: "$50k-$100k",
    timeline: "3–6 months",
    location: "",
    brief: "",
    website: "",
  });

  useEffect(() => {
    if (!studioSlug) {
      setLoadingStudio(false);
      return;
    }

    supabase
      .rpc("get_public_studio", { _slug: studioSlug })
      .maybeSingle()
      .then(
        ({ data }) => {
          setStudio(data as StudioPublic | null);
          setLoadingStudio(false);
        },
        () => setLoadingStudio(false),
      );
  }, [studioSlug]);

  const projectTypeOptions = useMemo(
    () => normalizeIntakeOptions(studio?.preferred_project_types),
    [studio?.preferred_project_types],
  );
  const budgetOptions = useMemo(
    () =>
      buildBudgetOptions({
        currency: studio?.currency,
        target_budget_min: studio?.target_budget_min,
        target_budget_max: studio?.target_budget_max,
      }),
    [studio?.currency, studio?.target_budget_min, studio?.target_budget_max],
  );
  const isRealEstate = studio?.business_type?.toLowerCase().includes("real estate") ?? false;

  useEffect(() => {
    if (!studio) return;
    setForm((current) => ({
      ...current,
      project_type: projectTypeOptions.includes(current.project_type)
        ? current.project_type
        : projectTypeOptions[0],
      budget_range: budgetOptions.includes(current.budget_range)
        ? current.budget_range
        : budgetOptions[0],
    }));
  }, [studio, projectTypeOptions, budgetOptions]);

  const reveal = (delay: number) =>
    reducedMotion
      ? undefined
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: REVEAL_DURATION, delay, ease: REVEAL_EASE },
        };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!studioSlug || !studio?.studio_id) {
      toast.error("This intake link is not connected to a studio");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("create-intake-lead", {
      body: {
        studio_slug: studioSlug,
        ...form,
        rooms: form.rooms.split(",").map((s) => s.trim()).filter(Boolean),
      },
    });
    if (error) {
      toast.error(error.message);
      setBusy(false);
      return;
    }
    if (!data?.ok) {
      toast.error(data?.error || "Could not submit enquiry");
      setBusy(false);
      return;
    }
    setSubmitted(true);
    setBusy(false);
  };

  if (loadingStudio) {
    return (
      <PublicShell>
        <div
          role="status"
          aria-live="polite"
          className="min-h-[60vh] flex flex-col items-center justify-center gap-6"
        >
          <Logo withWordmark size={32} />
          <div className="micro-label text-stone">Loading intake form</div>
        </div>
      </PublicShell>
    );
  }

  if (!studioSlug || !studio) {
    return (
      <PublicShell>
        <div
          role="status"
          className="min-h-[60vh] flex flex-col items-center justify-center text-center max-w-md mx-auto"
        >
          <Logo withWordmark size={32} />
          <div className="micro-label mt-12 mb-4 text-stone">INTAKE LINK REQUIRED</div>
          <h1 className="font-serif text-4xl text-pine leading-tight">
            This form needs a studio link.
          </h1>
          <p className="text-stone mt-5 text-sm leading-relaxed">
            Ask the studio for their Avitus intake URL.
          </p>
        </div>
      </PublicShell>
    );
  }

  const firstName = form.full_name.trim().split(/\s+/)[0];
  const introCopy = studio.intake_intro?.trim() || "Share a few details and we'll be in touch.";
  const thankYouCopy = getIntakeThankYouMessage(studio.intake_thank_you_message);
  const subtitleCopy = submitted
    ? firstName
      ? `Thank you, ${firstName}.`
      : "Thank you."
    : getIntakeHeroTitle(studio.business_type);
  const eyebrowSuffix = submitted ? "RECEIVED" : "NEW ENQUIRY";
  const footnoteCopy = submitted
    ? "A copy of your enquiry has been sent to the studio's queue."
    : "Your enquiry goes straight to the studio's review queue.";
  const introOrThankYou = submitted ? thankYouCopy : introCopy;

  return (
    <PublicShell>
      <div
        className={`grid grid-cols-1 gap-12 lg:gap-20 ${
          submitted
            ? "lg:max-w-2xl lg:mx-auto"
            : "lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]"
        }`}
      >
        <motion.div
          key={submitted ? "received" : "enquiry"}
          className="lg:sticky lg:top-20 self-start flex flex-col"
        >
          <motion.div {...reveal(0)}>
            <Logo withWordmark size={32} />
          </motion.div>

          <motion.div
            {...reveal(0.04)}
            aria-hidden
            className="h-px w-6 bg-sage mt-12"
          />

          <motion.div {...reveal(0.08)} className="micro-label mt-5 text-stone">
            {studio.studio_name?.toUpperCase() || "STUDIO"} · {eyebrowSuffix}
          </motion.div>

          <motion.h1
            {...reveal(0.16)}
            className="font-serif text-6xl lg:text-7xl text-pine leading-[0.95] tracking-tight mt-6 break-words"
          >
            {studio.studio_name || "Studio"}
          </motion.h1>

          <motion.p
            {...reveal(0.24)}
            className="font-serif italic text-2xl lg:text-3xl text-ink mt-5 leading-tight"
          >
            {subtitleCopy}
          </motion.p>

          <motion.p
            {...reveal(0.32)}
            className="text-stone text-[15px] leading-relaxed max-w-md mt-7"
          >
            {introOrThankYou}
          </motion.p>

          <motion.div
            {...reveal(0.4)}
            aria-hidden
            className="rule-ornament mt-10 mb-6 max-w-[6rem]"
          />

          <motion.p
            {...reveal(0.44)}
            className="font-serif italic text-[15px] text-stone/90 leading-relaxed max-w-md"
          >
            {footnoteCopy}
          </motion.p>

          {!submitted && studio.preferred_locations && studio.preferred_locations.length > 0 && (
            <motion.p
              {...reveal(0.5)}
              className="text-xs text-stone/80 italic mt-10 max-w-md leading-relaxed"
            >
              Preferred areas: {studio.preferred_locations.join(", ")}
            </motion.p>
          )}

          <motion.div
            {...reveal(0.56)}
            className="micro-label text-stone/50 mt-14"
          >
            DELIVERED BY AVITUS
          </motion.div>
        </motion.div>

        {!submitted && (
          <motion.form
            {...reveal(0.32)}
            onSubmit={submit}
            className="lg:pt-14 space-y-12"
            noValidate
          >
            <label className="absolute left-[-10000px]" aria-hidden="true">
              Website
              <input
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(event) => setForm({ ...form, website: event.target.value })}
              />
            </label>

            <FormSection eyebrow="01 · ABOUT YOU">
              <FormField
                label="Full name"
                value={form.full_name}
                onChange={(value) => setForm({ ...form, full_name: value })}
                required
                autoComplete="name"
              />
              <FormField
                label="Email"
                type="email"
                value={form.email}
                onChange={(value) => setForm({ ...form, email: value })}
                required
                autoComplete="email"
              />
              <FormField
                label="Phone (optional)"
                type="tel"
                value={form.phone}
                onChange={(value) => setForm({ ...form, phone: value })}
                autoComplete="tel"
              />
              <FormField
                label="Location"
                value={form.location}
                onChange={(value) => setForm({ ...form, location: value })}
                placeholder="City"
                autoComplete="address-level2"
              />
            </FormSection>

            <FormSection eyebrow="02 · THE PROJECT">
              <FormSelect
                label={isRealEstate ? "Property / client type" : "Project type"}
                value={form.project_type}
                onChange={(value) => setForm({ ...form, project_type: value })}
                options={projectTypeOptions}
              />
              <FormSelect
                label="Timeline"
                value={form.timeline}
                onChange={(value) => setForm({ ...form, timeline: value })}
                options={TIMELINE_OPTIONS}
              />
              <FormSelect
                label="Budget"
                value={form.budget_range}
                onChange={(value) => setForm({ ...form, budget_range: value })}
                options={budgetOptions}
              />
              <FormField
                label="Rooms (comma separated)"
                value={form.rooms}
                onChange={(value) => setForm({ ...form, rooms: value })}
                placeholder="Living, Kitchen…"
              />
            </FormSection>

            <FormSection eyebrow="03 · IN YOUR WORDS" cols={1}>
              <label className="block">
                <div className="micro-label mb-3">Tell us about the project</div>
                <textarea
                  required
                  value={form.brief}
                  onChange={(event) => setForm({ ...form, brief: event.target.value })}
                  rows={6}
                  className="w-full bg-transparent border border-border focus:border-pine focus-visible:bg-sage-soft/20 outline-none p-4 text-ink text-[15px] leading-relaxed min-h-[160px] transition-colors duration-200"
                  placeholder="Style preferences, household, what you'd like to feel when you walk in…"
                />
              </label>
            </FormSection>

            <div>
              <div className="rule-ornament mb-8 max-w-[6rem]" aria-hidden />
              <button
                type="submit"
                disabled={busy}
                aria-busy={busy}
                className="bg-ink text-ivory text-xs uppercase tracking-[0.22em] px-12 py-4 hover:bg-ink/90 disabled:opacity-60 transition-colors w-full sm:w-auto"
              >
                {busy ? "Sending…" : "Submit enquiry"}
              </button>
              <p className="font-serif italic text-[13px] text-stone/80 leading-relaxed mt-5 max-w-md">
                By submitting you agree the studio may reply by email or phone.
              </p>
            </div>
          </motion.form>
        )}
      </div>
    </PublicShell>
  );
};

const PublicShell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-background relative overflow-hidden">
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden lg:block bg-[radial-gradient(circle_at_top_right,_hsl(var(--sand)/0.5)_0%,_transparent_55%)]"
    />
    <div className="relative mx-auto max-w-7xl px-6 md:px-12 lg:px-20 py-12 lg:py-20">
      {children}
    </div>
  </div>
);

const FormSection = ({
  eyebrow,
  cols = 2,
  children,
}: {
  eyebrow: string;
  cols?: 1 | 2;
  children: ReactNode;
}) => (
  <section>
    <div className="micro-label text-stone mb-6">{eyebrow}</div>
    <div
      className={
        cols === 2
          ? "grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-7"
          : "grid grid-cols-1 gap-y-7"
      }
    >
      {children}
    </div>
  </section>
);

type FormFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
};

const FormField = ({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
  autoComplete,
}: FormFieldProps) => (
  <label className="block">
    <div className="micro-label mb-2">{label}</div>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className="w-full bg-transparent border-b border-border focus:border-pine focus-visible:bg-sage-soft/20 outline-none py-2.5 text-ink transition-colors duration-200"
    />
  </label>
);

type FormSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
};

const FormSelect = ({ label, value, onChange, options }: FormSelectProps) => (
  <label className="block">
    <div className="micro-label mb-2">{label}</div>
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-transparent border-b border-border focus:border-pine focus-visible:bg-sage-soft/20 outline-none py-2.5 text-ink transition-colors duration-200 appearance-none pr-7 cursor-pointer"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 12 8"
        className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-2 text-stone pointer-events-none"
      >
        <path
          d="M1 1.5L6 6.5L11 1.5"
          stroke="currentColor"
          strokeWidth="1.25"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  </label>
);

export default Intake;
