export const MAX_IMPORT_ROWS = 500;
export const MAX_FIELD_LENGTH = 1000;
export const MAX_CUSTOM_FIELDS = 30;

export const CORE_IMPORT_FIELDS = new Set([
  "full_name",
  "phone",
  "email",
  "source",
  "project_type",
  "property_type",
  "location",
  "budget_range",
  "timeline",
  "style_preference",
  "raw_inquiry",
  "brief",
]);

export type ImportMapping = Record<string, string>;

export type NormalizedImportRow = {
  lead: Record<string, unknown>;
  customFieldCount: number;
  skippedReason: string | null;
};

export const clampImportText = (value: unknown, max = MAX_FIELD_LENGTH) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!text) return null;
  return text.slice(0, max);
};

export const normalizeImportRow = (row: Record<string, unknown>, mapping: ImportMapping): NormalizedImportRow => {
  const lead: Record<string, unknown> = { custom_fields: {} };
  const custom: Record<string, string> = {};

  for (const [csvCol, target] of Object.entries(mapping)) {
    const value = clampImportText(row[csvCol]);
    if (!value || target === "skip") continue;

    if (target === "custom") {
      if (Object.keys(custom).length < MAX_CUSTOM_FIELDS) custom[csvCol.slice(0, 80)] = value;
    } else if (CORE_IMPORT_FIELDS.has(target)) {
      lead[target] = value;
    } else if (Object.keys(custom).length < MAX_CUSTOM_FIELDS) {
      custom[csvCol.slice(0, 80)] = value;
    }
  }

  for (const [csvCol, value] of Object.entries(row)) {
    if (mapping[csvCol]) continue;
    const safeValue = clampImportText(value);
    if (!safeValue || Object.keys(custom).length >= MAX_CUSTOM_FIELDS) continue;
    custom[csvCol.slice(0, 80)] = safeValue;
  }

  lead.custom_fields = custom;
  lead.raw_inquiry = lead.raw_inquiry || lead.brief || null;

  return {
    lead,
    customFieldCount: Object.keys(custom).length,
    skippedReason: lead.full_name ? null : "Missing full name",
  };
};
