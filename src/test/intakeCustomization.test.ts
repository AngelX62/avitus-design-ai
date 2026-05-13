import { describe, expect, it } from "vitest";
import {
  DEFAULT_BUDGET_OPTIONS,
  DEFAULT_INTAKE_THANK_YOU,
  DEFAULT_PROJECT_TYPE_OPTIONS,
  buildBudgetOptions,
  getIntakeHeroTitle,
  getIntakeThankYouMessage,
  normalizeIntakeOptions,
} from "@/lib/intakeCustomization";

describe("intake customization helpers", () => {
  it("uses preferred project or property types when provided", () => {
    expect(normalizeIntakeOptions([" Villa buyer ", "Penthouse", "villa buyer"])).toEqual([
      "Villa buyer",
      "Penthouse",
    ]);
  });

  it("falls back to default project options when preferred types are empty", () => {
    expect(normalizeIntakeOptions([" ", ""])).toEqual(DEFAULT_PROJECT_TYPE_OPTIONS);
    expect(normalizeIntakeOptions(null)).toEqual(DEFAULT_PROJECT_TYPE_OPTIONS);
  });

  it("builds currency-aware budget options when min and max are available", () => {
    expect(buildBudgetOptions({ currency: "USD", target_budget_min: 50000, target_budget_max: 150000 })).toEqual([
      "Under $50,000",
      "$50,000-$150,000",
      "$150,000+",
    ]);
  });

  it("keeps budget options safe when budget expectations are missing", () => {
    expect(buildBudgetOptions({ currency: "IDR", target_budget_min: null, target_budget_max: null })).toEqual(
      DEFAULT_BUDGET_OPTIONS,
    );
  });

  it("uses a single anchor budget when only one budget expectation is available", () => {
    expect(buildBudgetOptions({ currency: "IDR", target_budget_min: 50000000, target_budget_max: null })).toEqual([
      "Under IDR 50,000,000",
      "IDR 50,000,000+",
    ]);
  });

  it("falls back to the default thank-you message", () => {
    expect(getIntakeThankYouMessage("  ")).toBe(DEFAULT_INTAKE_THANK_YOU);
    expect(getIntakeThankYouMessage("Thanks, we will reply soon.")).toBe("Thanks, we will reply soon.");
  });

  it("uses property wording for real estate studios", () => {
    expect(getIntakeHeroTitle("Real Estate Agency")).toBe("Tell us about your property.");
    expect(getIntakeHeroTitle("Interior Design Studio")).toBe("Tell us about your space.");
  });
});
