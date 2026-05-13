import { z } from "https://esm.sh/zod@3.25.76";
import { MAX_IMPORT_ROWS } from "./importHelpers.ts";

const optionalText = (max: number) =>
  z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? null : value,
    z.string().trim().max(max).optional().nullable(),
  );

const optionalEmail = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? null : value,
  z.string().trim().email().max(320).optional().nullable(),
);

const criterionSignalSchema = z.object({
  signal: z.enum(["strong", "partial", "weak", "unknown"]).default("unknown"),
  reason: z.string().trim().max(300).optional().nullable(),
  evidence: z.string().trim().max(300).optional().nullable(),
});

export const leadInterpretationSchema = z.object({
  urgency: z.enum(["low", "medium", "high"]),
  summary: z.string().trim().min(1).max(500),
  next_action: z.string().trim().min(1).max(300),
  suggested_followup: z.string().trim().min(1).max(2000),
  missing_info: z.array(z.string().trim().max(300)).max(12).default([]),
  scoring_signals: z
    .object({
      budget_fit: criterionSignalSchema.default({ signal: "unknown" }),
      timeline_fit: criterionSignalSchema.default({ signal: "unknown" }),
      location_fit: criterionSignalSchema.default({ signal: "unknown" }),
      project_type_fit: criterionSignalSchema.default({ signal: "unknown" }),
      decision_maker: criterionSignalSchema.default({ signal: "unknown" }),
      clarity: criterionSignalSchema.default({ signal: "unknown" }),
    })
    .default({}),
  red_flags: z.array(z.string().trim().max(300)).max(10).default([]),
});

export const extractedLeadSchema = z.object({
  full_name: z.string().trim().min(1).max(200),
  email: z.string().trim().max(320).optional().nullable(),
  phone: z.string().trim().max(80).optional().nullable(),
  project_type: z.string().trim().max(200).optional().nullable(),
  property_type: z.string().trim().max(200).optional().nullable(),
  location: z.string().trim().max(300).optional().nullable(),
  budget_range: z.string().trim().max(200).optional().nullable(),
  timeline: z.string().trim().max(200).optional().nullable(),
  style_preference: z.string().trim().max(300).optional().nullable(),
  urgency: z.enum(["low", "medium", "high"]).optional().nullable(),
  missing_info: z.array(z.string().trim().max(300)).max(12).default([]),
});

export const intakeLeadSchema = z.object({
  studio_id: z.string().uuid().optional(),
  studio_slug: z.string().trim().min(1).max(120).optional(),
  website: z.string().trim().max(200).optional().nullable(),
  full_name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320).optional().nullable(),
  phone: z.string().trim().max(80).optional().nullable(),
  project_type: z.string().trim().max(200).optional().nullable(),
  rooms: z.array(z.string().trim().max(80)).max(20).default([]),
  budget_range: z.string().trim().max(200).optional().nullable(),
  timeline: z.string().trim().max(200).optional().nullable(),
  location: z.string().trim().max(300).optional().nullable(),
  brief: z.string().trim().min(1).max(8000),
});

export const extractRequestSchema = z.object({
  studio_id: z.string().uuid(),
  raw_text: z.string().trim().min(10).max(10000),
  source: z.string().trim().max(40).optional().default("other"),
});

export const pastedLeadSchema = z.object({
  studio_id: z.string().uuid(),
  raw_text: z.string().trim().min(10).max(10000),
  source: z.string().trim().max(40).optional().default("other"),
  extracted: extractedLeadSchema,
});

export const manualLeadSchema = z.object({
  studio_id: z.string().uuid(),
  full_name: z.string().trim().min(1).max(200),
  email: optionalEmail,
  phone: optionalText(80),
  project_type: optionalText(200),
  location: optionalText(300),
  budget_range: optionalText(200),
  brief: optionalText(8000),
});

export const scoreLeadRequestSchema = z.object({
  studio_id: z.string().uuid(),
  lead_id: z.string().uuid(),
});

export const importLeadRequestSchema = z.object({
  studio_id: z.string().uuid(),
  rows: z.array(z.record(z.unknown())).min(1).max(MAX_IMPORT_ROWS),
  mapping: z.record(z.string().trim().max(80)),
});
