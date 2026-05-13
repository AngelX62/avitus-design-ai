import { describe, expect, it } from "vitest";
import { getTimeGreeting } from "@/lib/timeGreeting";

describe("time-zone greeting", () => {
  it("uses morning, afternoon, and evening boundaries", () => {
    expect(getTimeGreeting(new Date("2026-01-01T11:59:00.000Z"), "UTC")).toBe("Good morning");
    expect(getTimeGreeting(new Date("2026-01-01T12:00:00.000Z"), "UTC")).toBe("Good afternoon");
    expect(getTimeGreeting(new Date("2026-01-01T17:59:00.000Z"), "UTC")).toBe("Good afternoon");
    expect(getTimeGreeting(new Date("2026-01-01T18:00:00.000Z"), "UTC")).toBe("Good evening");
  });

  it("uses California local time, including daylight saving time", () => {
    expect(getTimeGreeting(new Date("2026-07-01T15:30:00.000Z"), "America/Los_Angeles")).toBe("Good morning");
    expect(getTimeGreeting(new Date("2026-07-01T21:30:00.000Z"), "America/Los_Angeles")).toBe("Good afternoon");
    expect(getTimeGreeting(new Date("2026-07-02T03:30:00.000Z"), "America/Los_Angeles")).toBe("Good evening");
  });

  it("uses Indonesia local time", () => {
    expect(getTimeGreeting(new Date("2026-07-01T00:30:00.000Z"), "Asia/Jakarta")).toBe("Good morning");
    expect(getTimeGreeting(new Date("2026-07-01T06:30:00.000Z"), "Asia/Jakarta")).toBe("Good afternoon");
    expect(getTimeGreeting(new Date("2026-07-01T13:30:00.000Z"), "Asia/Jakarta")).toBe("Good evening");
  });
});
