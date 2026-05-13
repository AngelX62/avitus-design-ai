-- Studio Qualification Profile · advanced preferences
-- Adds three nullable columns spec'd in PRODUCT_BRIEF.md "Studio Qualification Profile"
-- (lines 732-775). Foundation-safe: orchestrator reads these only when AI is enabled.

ALTER TABLE public.studio_settings
  ADD COLUMN IF NOT EXISTS budget_conversation_style text
    DEFAULT 'soft_discovery',
  ADD COLUMN IF NOT EXISTS prompt_pack_version text
    DEFAULT 'stable',
  ADD COLUMN IF NOT EXISTS monthly_cost_ceiling numeric;

ALTER TABLE public.studio_settings
  ADD CONSTRAINT studio_settings_budget_conversation_style_check
    CHECK (
      budget_conversation_style IS NULL
      OR budget_conversation_style IN (
        'direct',
        'soft_discovery',
        'consultation_first',
        'education_first'
      )
    );

ALTER TABLE public.studio_settings
  ADD CONSTRAINT studio_settings_monthly_cost_ceiling_check
    CHECK (monthly_cost_ceiling IS NULL OR monthly_cost_ceiling >= 0);
