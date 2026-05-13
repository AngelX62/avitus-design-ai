import { describe, expect, it } from "vitest";
import { canTransitionLeadStatus, LEAD_STATUSES } from "@/lib/leadTypes";

describe("lead status transitions", () => {
  it("lets owners correct a won lead back to any active inbox status", () => {
    expect(canTransitionLeadStatus("won", "new")).toBe(true);
    expect(canTransitionLeadStatus("won", "needs_review")).toBe(true);
    expect(canTransitionLeadStatus("won", "contacted")).toBe(true);
    expect(canTransitionLeadStatus("won", "consultation_booked")).toBe(true);
  });

  it("keeps every visible status option selectable from every other visible status", () => {
    for (const from of LEAD_STATUSES) {
      for (const to of LEAD_STATUSES) {
        expect(canTransitionLeadStatus(from, to)).toBe(true);
      }
    }
  });
});
