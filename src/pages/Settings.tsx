import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import { Copy, ExternalLink, UserPlus } from "lucide-react";
import { useStudio } from "@/contexts/StudioContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagInput } from "@/components/ui/tag-input";
import { ToneCard } from "@/components/ui/tone-card";
import { formatRelative } from "@/lib/format";

const CURRENCIES = ["USD", "IDR", "SGD", "AUD", "EUR", "GBP", "Other"];
const BUSINESS_TYPES = [
  "Interior Design Studio",
  "Real Estate Agency",
  "Other",
];

type ToneKey = "warm" | "direct" | "playful" | "formal";

const TONE_COPY: Record<ToneKey, { label: string; description: string; example: string }> = {
  warm: {
    label: "Warm",
    description: "Conversational, relationship-first.",
    example:
      "Lovely to hear from you — I'd love to understand the home you're building.",
  },
  direct: {
    label: "Direct",
    description: "Efficient, gets to the point.",
    example:
      "Thanks for reaching out. To send a proposal, I'll need the project address, timeline, and budget range.",
  },
  playful: {
    label: "Playful",
    description: "Lighter, more personality.",
    example: "Oh, a 1930s terrace with original tile? You've made my morning.",
  },
  formal: {
    label: "Formal",
    description: "Refined, measured, polite.",
    example:
      "Thank you for considering our studio. We would be glad to discuss your project further.",
  },
};

type BudgetStyleKey =
  | "direct"
  | "soft_discovery"
  | "consultation_first"
  | "education_first";

const BUDGET_STYLE_COPY: Record<
  BudgetStyleKey,
  { label: string; description: string; example: string }
> = {
  direct: {
    label: "Direct",
    description: "Ask for budget range early. You qualify on numbers first.",
    example:
      "To send a tailored proposal I'll need to know the investment range you're working with.",
  },
  soft_discovery: {
    label: "Soft discovery",
    description: "Ask gently, framed in scope context.",
    example:
      "To shape this proposal well, it would help to know roughly the range you're considering.",
  },
  consultation_first: {
    label: "Consultation first",
    description:
      "Don't ask in the first reply. Flag budget missing for your own follow-up planning.",
    example:
      "Let's start with the rooms and timeline — we can map the investment together once the scope is clearer.",
  },
  education_first: {
    label: "Education first",
    description:
      "Walk the client toward realistic expectations before asking for a number.",
    example:
      "A full renovation in this neighborhood typically lands between X and Y — does that match what you had in mind?",
  },
};

const PROMPT_PACK_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "stable", label: "Stable — current released prompt pack" },
  { value: "beta", label: "Beta — opt into next-version testing" },
];

type SettingsState = {
  id?: string;
  studio_id: string;
  studio_name: string;
  business_type: string;
  currency: string;
  target_budget_min: string | number | null;
  target_budget_max: string | number | null;
  preferred_project_types: string[];
  preferred_locations: string[];
  signature_styles: string[];
  ideal_client: string | null;
  low_fit_signs: string | null;
  followup_tone: string;
  budget_conversation_style: string;
  intake_intro: string | null;
  intake_thank_you_message: string | null;
  prompt_pack_version: string;
  monthly_cost_ceiling: string | number | null;
};

const normalizeSettings = (
  raw: Record<string, unknown> | null,
  fallback: { studio_id: string; studio_name: string },
): SettingsState => {
  const r = raw ?? {};
  return {
    id: (r.id as string) ?? undefined,
    studio_id: (r.studio_id as string) ?? fallback.studio_id,
    studio_name: (r.studio_name as string) ?? fallback.studio_name,
    business_type: (r.business_type as string) ?? "Interior Design Studio",
    currency: (r.currency as string) ?? "USD",
    target_budget_min: (r.target_budget_min as number | null) ?? null,
    target_budget_max: (r.target_budget_max as number | null) ?? null,
    preferred_project_types: (r.preferred_project_types as string[]) ?? [],
    preferred_locations: (r.preferred_locations as string[]) ?? [],
    signature_styles: (r.signature_styles as string[]) ?? [],
    ideal_client: (r.ideal_client as string | null) ?? null,
    low_fit_signs: (r.low_fit_signs as string | null) ?? null,
    followup_tone: (r.followup_tone as string) ?? "warm",
    budget_conversation_style:
      (r.budget_conversation_style as string) ?? "soft_discovery",
    intake_intro: (r.intake_intro as string | null) ?? null,
    intake_thank_you_message: (r.intake_thank_you_message as string | null) ?? null,
    prompt_pack_version: (r.prompt_pack_version as string) ?? "stable",
    monthly_cost_ceiling: (r.monthly_cost_ceiling as number | null) ?? null,
  };
};

const isDirty = (a: SettingsState | null, b: SettingsState | null) => {
  if (!a || !b) return false;
  return JSON.stringify(a) !== JSON.stringify(b);
};

const Settings = () => {
  const { activeStudio, loading: studioLoading } = useStudio();
  const [s, setS] = useState<SettingsState | null>(null);
  const loadedRef = useRef<SettingsState | null>(null);
  const [members, setMembers] = useState<Array<{ id: string; user_id: string; role: string; created_at: string }>>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"designer" | "owner">("designer");
  const [inviteUrl, setInviteUrl] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isOwner = activeStudio?.role === "owner";

  useEffect(() => {
    let active = true;
    setInviteUrl("");
    if (!activeStudio) {
      setS(null);
      loadedRef.current = null;
      setMembers([]);
      setSettingsLoading(false);
      return () => {
        active = false;
      };
    }

    setSettingsLoading(true);
    Promise.all([
      supabase
        .from("studio_settings")
        .select("*")
        .eq("studio_id", activeStudio.id)
        .maybeSingle(),
      supabase
        .from("studio_memberships")
        .select("id, user_id, role, created_at")
        .eq("studio_id", activeStudio.id)
        .order("created_at", { ascending: true }),
    ]).then(([settingsResult, membersResult]) => {
      if (!active) return;
      const normalized = normalizeSettings(settingsResult.data, {
        studio_id: activeStudio.id,
        studio_name: activeStudio.name,
      });
      setS(normalized);
      loadedRef.current = normalized;
      setMembers(membersResult.data ?? []);
      setSettingsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [activeStudio]);

  const dirty = useMemo(() => isDirty(s, loadedRef.current), [s]);

  const save = async () => {
    if (!s || !activeStudio || !isOwner) {
      toast.error("Only studio owners can edit settings");
      return;
    }

    setSaving(true);
    const payload = {
      studio_id: activeStudio.id,
      studio_name: s.studio_name,
      business_type: s.business_type || "Interior Design Studio",
      currency: s.currency || "USD",
      target_budget_min:
        s.target_budget_min === null || s.target_budget_min === ""
          ? null
          : Number(s.target_budget_min) || null,
      target_budget_max:
        s.target_budget_max === null || s.target_budget_max === ""
          ? null
          : Number(s.target_budget_max) || null,
      preferred_project_types: s.preferred_project_types,
      preferred_locations: s.preferred_locations,
      ideal_client: s.ideal_client,
      low_fit_signs: s.low_fit_signs,
      signature_styles: s.signature_styles,
      followup_tone: s.followup_tone || "warm",
      budget_conversation_style:
        s.budget_conversation_style || "soft_discovery",
      intake_intro: s.intake_intro,
      intake_thank_you_message: s.intake_thank_you_message,
      prompt_pack_version: s.prompt_pack_version || "stable",
      monthly_cost_ceiling:
        s.monthly_cost_ceiling === null || s.monthly_cost_ceiling === ""
          ? null
          : Number(s.monthly_cost_ceiling) || null,
    };

    const query = s.id
      ? supabase
          .from("studio_settings")
          .update(payload)
          .eq("studio_id", activeStudio.id)
          .eq("id", s.id)
      : supabase.from("studio_settings").insert(payload);
    const { error } = await query;
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    loadedRef.current = s;
    setLastSavedAt(new Date().toISOString());
    toast.success("Profile saved");
  };

  const discard = () => {
    if (loadedRef.current) setS(loadedRef.current);
  };

  const createInvite = async () => {
    if (!activeStudio || !inviteEmail) return;
    const { data, error } = await supabase.functions.invoke("create-invite", {
      body: { studio_id: activeStudio.id, email: inviteEmail, role: inviteRole },
    });
    if (error || !data?.ok) {
      toast.error(data?.error || error?.message || "Invite could not be created");
      return;
    }
    setInviteUrl(data.invite_url);
    setInviteEmail("");
    toast.success("Invite link created");
  };

  if (studioLoading || settingsLoading) {
    return (
      <StatusCard
        eyebrow="LOADING SETTINGS"
        body="Checking your active studio workspace and qualification profile."
      />
    );
  }

  if (!activeStudio) {
    return (
      <StatusCard
        eyebrow="NO STUDIO WORKSPACE"
        title="Settings are only available inside a studio."
        body="Create an owner account or accept a studio invite, then come back here to manage the qualification profile."
      />
    );
  }

  if (!s) {
    return (
      <StatusCard
        eyebrow="SETTINGS NOT AVAILABLE"
        title="The studio profile could not be loaded."
        body="Refresh the page or check that your account still has access to this studio workspace."
      />
    );
  }

  const intakeUrl = `${window.location.origin}/intake/${activeStudio.slug}`;
  const update = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) =>
    setS((prev) => (prev ? { ...prev, [key]: value } : prev));

  return (
    <div className="pb-32">
      <div className="px-6 md:px-12 py-10 max-w-3xl">
        <PageHeader
          accent="settings"
          eyebrow="STUDIO · QUALIFICATION PROFILE"
          title="Studio Qualification Profile."
          subtitle="The voice, taste, and operating frame Avitus uses when it qualifies, prioritizes, and drafts on your behalf."
          actions={
            !isOwner ? (
              <span className="micro-label text-stone bg-secondary px-2.5 py-1 border border-border">
                READ-ONLY · DESIGNER
              </span>
            ) : lastSavedAt ? (
              <span className="micro-label text-sage-deep">
                SAVED · {formatRelative(lastSavedAt).toUpperCase()}
              </span>
            ) : undefined
          }
        />
      </div>

      <div className="px-6 md:px-12 max-w-3xl space-y-10">
        <SectionCard
          eyebrow="01 · IDENTITY"
          title="The Studio."
          subtitle="The operating frame Avitus loads into every analysis: who you are, where you work, and how you sound."
        >
          <FieldStack>
            <Field label="Studio name">
              <Input
                value={s.studio_name}
                disabled={!isOwner}
                onChange={(event) => update("studio_name", event.target.value)}
              />
            </Field>

            <Field label="Business type">
              <Select
                value={s.business_type}
                disabled={!isOwner}
                onValueChange={(value) => update("business_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a business type" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Field label="Currency">
                <Select
                  value={s.currency}
                  disabled={!isOwner}
                  onValueChange={(value) => update("currency", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div aria-hidden />
            </div>

            <Field label="Follow-up tone" helper="The voice Avitus prepares drafts in, and the register Avara mirrors when it suggests next-message wording.">
              <div
                role="radiogroup"
                aria-label="Follow-up tone"
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1"
              >
                {(Object.keys(TONE_COPY) as ToneKey[]).map((key) => {
                  const copy = TONE_COPY[key];
                  return (
                    <ToneCard
                      key={key}
                      name="followup_tone"
                      label={copy.label.toUpperCase()}
                      description={copy.description}
                      example={copy.example}
                      selected={s.followup_tone === key}
                      onSelect={() => update("followup_tone", key)}
                      disabled={!isOwner}
                    />
                  );
                })}
              </div>
            </Field>

            <Field
              label="Budget conversation style"
              helper="How Avitus discusses budget with prospects, in follow-up drafts and when Avara explains why a lead is flagged 'missing budget'."
            >
              <div
                role="radiogroup"
                aria-label="Budget conversation style"
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1"
              >
                {(Object.keys(BUDGET_STYLE_COPY) as BudgetStyleKey[]).map(
                  (key) => {
                    const copy = BUDGET_STYLE_COPY[key];
                    return (
                      <ToneCard
                        key={key}
                        name="budget_conversation_style"
                        label={copy.label.toUpperCase()}
                        description={copy.description}
                        example={copy.example}
                        selected={s.budget_conversation_style === key}
                        onSelect={() =>
                          update("budget_conversation_style", key)
                        }
                        disabled={!isOwner}
                      />
                    );
                  },
                )}
              </div>
            </Field>
          </FieldStack>
        </SectionCard>

        <div className="rule-ornament" aria-hidden />

        <SectionCard
          eyebrow="02 · TASTE"
          title="The Ideal Project."
          subtitle="The kind of brief you want more of. These signals shape priority, flag low-fit leads, and inform how AI explains its scoring."
        >
          <FieldStack>
            <Field
              label="Budget expectation"
              helper="Leave blank if you'd rather not anchor the score on budget yet."
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CurrencyField
                  currency={s.currency}
                  value={s.target_budget_min ?? ""}
                  disabled={!isOwner}
                  onChange={(value) => update("target_budget_min", value)}
                  label="Minimum"
                />
                <CurrencyField
                  currency={s.currency}
                  value={s.target_budget_max ?? ""}
                  disabled={!isOwner}
                  onChange={(value) => update("target_budget_max", value)}
                  label="Maximum"
                />
              </div>
            </Field>

            <Field
              label="Preferred project types"
              helper="e.g. Full-home renovation · Heritage restoration · F&B fit-out"
            >
              <TagInput
                value={s.preferred_project_types}
                onChange={(value) => update("preferred_project_types", value)}
                placeholder="Add a project type and press Enter"
                disabled={!isOwner}
                ariaLabel="Preferred project types"
              />
            </Field>

            <Field
              label="Preferred locations"
              helper="Cities, neighborhoods, or regions you take projects in."
            >
              <TagInput
                value={s.preferred_locations}
                onChange={(value) => update("preferred_locations", value)}
                placeholder="Add a location and press Enter"
                disabled={!isOwner}
                ariaLabel="Preferred locations"
              />
            </Field>

            <Field
              label="Signature styles"
              helper="Three to five words that describe the work you're known for."
            >
              <TagInput
                value={s.signature_styles}
                onChange={(value) => update("signature_styles", value)}
                placeholder="Add a style and press Enter"
                disabled={!isOwner}
                ariaLabel="Signature styles"
              />
            </Field>

            <Field
              label="Ideal client"
              italicHelper="This text trains future AI summaries to recognize your ideal client in inbound inquiries."
            >
              <Textarea
                value={s.ideal_client ?? ""}
                onChange={(event) => update("ideal_client", event.target.value)}
                placeholder="Describe the person you most want to work with — their taste, decisiveness, what they care about, what makes a brief feel right."
                disabled={!isOwner}
                className="min-h-[140px] text-[15px] leading-relaxed"
              />
            </Field>

            <Field
              label="Low-fit warning signs"
              italicHelper="Used as a deterministic flag now; folded into AI scoring when analysis is enabled."
            >
              <Textarea
                value={s.low_fit_signs ?? ""}
                onChange={(event) => update("low_fit_signs", event.target.value)}
                placeholder="What patterns should make a lead feel wrong before you even read it? Be specific."
                disabled={!isOwner}
                className="min-h-[140px] text-[15px] leading-relaxed"
              />
            </Field>
          </FieldStack>
        </SectionCard>
      </div>

      <div className="px-6 md:px-12 max-w-5xl mt-10">
        <div className="rule-ornament mb-10" aria-hidden />

        <SectionCard
          eyebrow="03 · PUBLIC SURFACE"
          title="The Public Intake."
          subtitle="The intro your prospects read before submitting, and the thank-you that closes the form. This is the only Avitus copy a stranger ever sees."
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
            <FieldStack>
              <div>
                <div className="micro-label mb-2">PUBLIC INTAKE URL</div>
                <div className="flex flex-wrap gap-2 items-center bg-secondary/40 border border-border p-4">
                  <code className="flex-1 text-sm text-ink truncate min-w-0">
                    {intakeUrl}
                  </code>
                  <a
                    href={intakeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 micro-label text-stone hover:text-pine"
                  >
                    <ExternalLink size={12} /> OPEN
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(intakeUrl);
                      toast.success("Copied");
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 micro-label text-stone hover:text-pine"
                  >
                    <Copy size={12} /> COPY
                  </button>
                </div>
              </div>

              <Field
                label="Intake form intro"
                helper="Renders at the top of your intake form. Two to four sentences of warmth and clarity work best."
              >
                <Textarea
                  value={s.intake_intro ?? ""}
                  onChange={(event) => update("intake_intro", event.target.value)}
                  placeholder="A few sentences of welcome — what the studio cares about, what kind of brief you respond best to."
                  disabled={!isOwner}
                  className="min-h-[120px] text-[15px] leading-relaxed"
                />
              </Field>

              <Field
                label="Thank-you message"
                helper="Shown immediately after a prospect submits. Set expectations: how long until you reply, what happens next."
              >
                <Textarea
                  value={s.intake_thank_you_message ?? ""}
                  onChange={(event) =>
                    update("intake_thank_you_message", event.target.value)
                  }
                  placeholder="Thank you — we'll review your enquiry and reply within two working days."
                  disabled={!isOwner}
                  className="min-h-[100px] text-[15px] leading-relaxed"
                />
              </Field>
            </FieldStack>

            <IntakePreview
              studioName={s.studio_name}
              intro={s.intake_intro}
              thankYou={s.intake_thank_you_message}
            />
          </div>
        </SectionCard>
      </div>

      <div className="px-6 md:px-12 max-w-3xl mt-10">
        <div className="rule-ornament mb-10" aria-hidden />

        <SectionCard
          eyebrow="04 · ADVANCED"
          title="Analysis & Spend."
          subtitle="Settings that only apply once AI analysis is enabled for your studio. Safe to leave at their defaults."
        >
          <FieldStack>
            <Field
              label="Prompt pack version"
              helper="Controls which version of Avitus's analysis prompts your studio runs. Leave on Stable unless support has asked you to change it."
            >
              <Select
                value={s.prompt_pack_version}
                disabled={!isOwner}
                onValueChange={(value) => update("prompt_pack_version", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a prompt pack channel" />
                </SelectTrigger>
                <SelectContent>
                  {PROMPT_PACK_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                  {s.prompt_pack_version &&
                    !PROMPT_PACK_OPTIONS.some(
                      (option) => option.value === s.prompt_pack_version,
                    ) && (
                      <SelectItem
                        value={s.prompt_pack_version}
                        disabled
                      >
                        Pinned: {s.prompt_pack_version}
                      </SelectItem>
                    )}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="Monthly cost ceiling"
              italicHelper="Avitus stops running paid AI analyses for the rest of the month if your usage crosses this ceiling. Leave blank for no ceiling."
            >
              <div className="max-w-xs">
                <CurrencyField
                  currency={s.currency}
                  value={s.monthly_cost_ceiling ?? ""}
                  disabled={!isOwner}
                  onChange={(value) =>
                    update("monthly_cost_ceiling", value === "" ? null : value)
                  }
                  label="Cap"
                />
              </div>
            </Field>
          </FieldStack>
        </SectionCard>
      </div>

      <div className="px-6 md:px-12 max-w-3xl mt-10">
        <div className="rule-ornament mb-10" aria-hidden />

        <SectionCard
          eyebrow="05 · ACCESS"
          title="Studio Access."
          subtitle="Owners can edit settings and invite designers. Designers have full lead access but cannot change studio configuration."
        >
          <div className="border border-border bg-card divide-y divide-border mb-6">
            {members.length === 0 ? (
              <div className="px-5 py-6 text-sm text-stone italic">
                No members loaded.
              </div>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="px-5 py-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="text-sm text-ink truncate font-mono">
                      {member.user_id}
                    </div>
                    <div className="text-xs text-stone mt-1">
                      Joined {new Date(member.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="micro-label text-stone">{member.role}</div>
                </div>
              ))
            )}
          </div>

          {isOwner && (
            <div className="border border-border bg-secondary/30 p-5 space-y-4">
              <div className="flex items-center gap-2 micro-label">
                <UserPlus size={12} /> CREATE INVITE
              </div>
              <div className="grid md:grid-cols-[1fr_160px_auto] gap-3">
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="designer@example.com"
                />
                <Select
                  value={inviteRole}
                  onValueChange={(value) =>
                    setInviteRole(value as "designer" | "owner")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="designer">Designer</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={createInvite}
                  disabled={!inviteEmail}
                  className="uppercase tracking-[0.18em] text-xs"
                >
                  Invite
                </Button>
              </div>
              {inviteUrl && (
                <div className="flex flex-wrap gap-2 items-center bg-background border border-border p-3">
                  <code className="flex-1 text-xs text-ink truncate min-w-0">
                    {inviteUrl}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(inviteUrl);
                      toast.success("Copied");
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 micro-label text-stone hover:text-pine"
                  >
                    <Copy size={12} /> COPY
                  </button>
                </div>
              )}
            </div>
          )}
        </SectionCard>
      </div>

      {isOwner && dirty && (
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 bg-ivory/95 backdrop-blur border border-border shadow-rest-lit px-5 py-3 flex items-center gap-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2">
            <span aria-hidden className="h-2 w-2 rounded-full bg-attn" />
            <span className="micro-label text-ink">UNSAVED CHANGES</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={discard}
              disabled={saving}
              className="uppercase tracking-[0.18em] text-xs"
            >
              Discard
            </Button>
            <Button
              size="sm"
              onClick={save}
              disabled={saving}
              className="uppercase tracking-[0.18em] text-xs"
            >
              {saving ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const SectionCard = ({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) => (
  <section className="border border-border bg-card shadow-rest-lit p-8 md:p-10">
    <div className="mb-8 max-w-xl">
      <div className="micro-label text-stone mb-2">{eyebrow}</div>
      <h2 className="font-serif text-2xl text-ink mb-3 leading-tight">{title}</h2>
      <p className="text-sm text-stone leading-relaxed">{subtitle}</p>
    </div>
    {children}
  </section>
);

const FieldStack = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-7">{children}</div>
);

const Field = ({
  label,
  helper,
  italicHelper,
  children,
}: {
  label: string;
  helper?: string;
  italicHelper?: string;
  children: React.ReactNode;
}) => (
  <label className="block">
    <div className="micro-label mb-2">{label}</div>
    {children}
    {helper && (
      <div className="text-xs text-stone mt-2 leading-relaxed">{helper}</div>
    )}
    {italicHelper && (
      <div className="font-serif italic text-[13px] text-stone/90 mt-2 leading-relaxed">
        {italicHelper}
      </div>
    )}
  </label>
);

const CurrencyField = ({
  currency,
  value,
  onChange,
  disabled,
  label,
}: {
  currency: string;
  value: string | number;
  onChange: (value: string) => void;
  disabled?: boolean;
  label: string;
}) => (
  <div>
    <div className="micro-label mb-2 text-stone">{label}</div>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone text-xs uppercase tracking-wider pointer-events-none">
        {currency}
      </span>
      <Input
        type="text"
        inputMode="numeric"
        value={value === null ? "" : String(value)}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value.replace(/[^0-9]/g, ""))
        }
        className="pl-14"
        placeholder="—"
      />
    </div>
  </div>
);

const IntakePreview = ({
  studioName,
  intro,
  thankYou,
}: {
  studioName: string;
  intro: string | null;
  thankYou: string | null;
}) => (
  <aside className="lg:sticky lg:top-24 self-start">
    <div className="micro-label text-stone mb-2">PREVIEW</div>
    <div className="border border-border bg-secondary/30 p-6 shadow-rest-lit space-y-5">
      <div>
        <div className="font-serif text-xl text-ink leading-tight">
          {studioName || "Your studio"}
        </div>
        <div className="micro-label text-stone mt-1">Inquiry form</div>
      </div>

      <div className="text-[14px] leading-relaxed text-ink min-h-[3em]">
        {intro?.trim() ? (
          intro
        ) : (
          <span className="text-stone italic">
            Your intake intro will appear here.
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        <FauxInputLine label="Your name" />
        <FauxInputLine label="Email" />
        <FauxInputLine label="Message" tall />
      </div>

      <div className="bg-ink/40 text-ivory text-xs uppercase tracking-[0.22em] px-4 py-2.5 text-center cursor-not-allowed select-none">
        Submit
      </div>

      <div className="rule-ornament" aria-hidden />

      <div>
        <div className="micro-label text-stone mb-2">AFTER SUBMIT</div>
        <div className="text-[14px] leading-relaxed text-ink min-h-[2em]">
          {thankYou?.trim() ? (
            thankYou
          ) : (
            <span className="text-stone italic">
              Your thank-you message will appear here.
            </span>
          )}
        </div>
      </div>
    </div>
  </aside>
);

const FauxInputLine = ({ label, tall = false }: { label: string; tall?: boolean }) => (
  <div>
    <div className="text-[10px] uppercase tracking-wider text-stone/70 mb-1">
      {label}
    </div>
    <div
      className={`border-b border-border/70 bg-background/40 ${tall ? "h-10" : "h-6"}`}
      aria-hidden
    />
  </div>
);

const StatusCard = ({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title?: string;
  body: string;
}) => (
  <div className="px-6 md:px-12 py-10 max-w-3xl">
    <div className="border border-border bg-card p-8">
      <div className="micro-label mb-2">{eyebrow}</div>
      {title && <h1 className="font-serif text-3xl text-ink mb-3">{title}</h1>}
      <p className="text-sm text-stone leading-relaxed">{body}</p>
    </div>
  </div>
);

export default Settings;
