import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260505090000_v29_foundation_spine.sql"),
  "utf8",
);
const promptPackMigrationSql = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260507120000_prompt_pack_scaffolding.sql"),
  "utf8",
);
const multiStudioMigrationSql = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260428090000_multi_studio_v1_foundation.sql"),
  "utf8",
);

describe("v2.9 foundation spine migration", () => {
  it("creates tenant-scoped agent_runs with RLS", () => {
    expect(migrationSql).toContain("CREATE TABLE IF NOT EXISTS public.agent_runs");
    expect(migrationSql).toContain("studio_id uuid NOT NULL");
    expect(migrationSql).toContain("ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY");
    expect(migrationSql).toContain("public.is_studio_member(studio_id)");
  });

  it("bounds run status and action tier values", () => {
    expect(migrationSql).toContain("status IN ('success', 'partial', 'failed')");
    expect(migrationSql).toContain("tier IN (0, 1, 2, 3, 4)");
  });

  it("keeps direct writes reserved for trusted backend paths", () => {
    expect(migrationSql).toContain("No direct authenticated INSERT/UPDATE/DELETE policies are created in V1.0.");
    expect(migrationSql).not.toMatch(/FOR INSERT TO authenticated/i);
  });
});

describe("prompt pack scaffolding migration", () => {
  it("creates versioned prompt pack storage by service, vertical, and language", () => {
    expect(promptPackMigrationSql).toContain("CREATE TABLE IF NOT EXISTS public.prompt_packs");
    expect(promptPackMigrationSql).toContain("service_name text NOT NULL");
    expect(promptPackMigrationSql).toContain("vertical text NOT NULL");
    expect(promptPackMigrationSql).toContain("language text NOT NULL");
    expect(promptPackMigrationSql).toContain("version text NOT NULL");
    expect(promptPackMigrationSql).toContain("release_channel text NOT NULL DEFAULT 'stable'");
    expect(promptPackMigrationSql).toContain("is_active boolean NOT NULL DEFAULT true");
    expect(promptPackMigrationSql).toContain("is_default boolean NOT NULL DEFAULT false");
    expect(promptPackMigrationSql).toContain("system_prompt text NOT NULL");
    expect(promptPackMigrationSql).toContain("output_schema_jsonb jsonb NOT NULL");
    expect(promptPackMigrationSql).toMatch(
      /CONSTRAINT prompt_packs_service_vertical_language_version_key UNIQUE \(\s*service_name,\s*vertical,\s*language,\s*version\s*\)/,
    );
  });

  it("keeps prompt text backend-only while exposing studio pin metadata through RLS", () => {
    expect(promptPackMigrationSql).toContain("ALTER TABLE public.prompt_packs ENABLE ROW LEVEL SECURITY");
    expect(promptPackMigrationSql).toContain("No direct client SELECT/INSERT/UPDATE/DELETE policies are created for prompt_packs");
    expect(promptPackMigrationSql).not.toMatch(/CREATE POLICY "[^"]+" ON public\.prompt_packs\s+FOR SELECT/i);

    expect(promptPackMigrationSql).toContain("CREATE TABLE IF NOT EXISTS public.studio_prompt_pack_pins");
    expect(promptPackMigrationSql).toContain("studio_id uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE");
    expect(promptPackMigrationSql).toContain("ALTER TABLE public.studio_prompt_pack_pins ENABLE ROW LEVEL SECURITY");
    expect(promptPackMigrationSql).toContain("public.is_studio_member(studio_id)");
    expect(promptPackMigrationSql).toContain("public.has_studio_role(studio_id, 'owner')");
    expect(promptPackMigrationSql).toContain("CONSTRAINT studio_prompt_pack_pins_unique_scope UNIQUE");
  });

  it("seeds stable defaults for lead intelligence and communication drafting", () => {
    expect(promptPackMigrationSql).toContain("'lead_intelligence'");
    expect(promptPackMigrationSql).toContain("'communication_drafting'");
    expect(promptPackMigrationSql).toContain("'interior_design'");
    expect(promptPackMigrationSql).toContain("'real_estate'");
    expect(promptPackMigrationSql).toContain("'v1.1-ai-qualification'");
    expect(promptPackMigrationSql).toContain("'v1.1-communication-drafting'");
    expect(promptPackMigrationSql).toContain("ON CONFLICT ON CONSTRAINT prompt_packs_service_vertical_language_version_key DO UPDATE");
  });
});

describe("no-key pilot workflow persistence", () => {
  it("records status history and creates projects only through tenant-scoped lead status changes", () => {
    expect(multiStudioMigrationSql).toContain("CREATE OR REPLACE FUNCTION public.handle_lead_status_change()");
    expect(multiStudioMigrationSql).toContain("INSERT INTO public.lead_status_history (studio_id, lead_id, from_status, to_status, changed_by)");
    expect(multiStudioMigrationSql).toContain("NEW.status::text = 'won'");
    expect(multiStudioMigrationSql).toContain("INSERT INTO public.projects (studio_id, name, client_name, lead_id, status, description, created_by)");
    expect(multiStudioMigrationSql).toContain("CREATE POLICY \"Studio reads projects\" ON public.projects FOR SELECT USING (public.is_studio_member(studio_id))");
  });
});
