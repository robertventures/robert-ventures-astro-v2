import { describe, it, expect } from "vitest";
import { isInstantCallWindow } from "../callWindow";

// All dates below are constructed as explicit UTC instants (the "Z" suffix)
// so the tests are independent of the machine's local timezone. The comment
// on each line gives the equivalent America/New_York wall-clock time that
// the UTC instant maps to, verified against the EDT/EST offset in effect
// on that date.

describe("isInstantCallWindow", () => {
  describe("weekday boundaries (Wednesday, July 1 2026, EDT = UTC-4)", () => {
    it("is false at 9:59am ET (one minute before opening)", () => {
      expect(isInstantCallWindow(new Date("2026-07-01T13:59:00Z"))).toBe(false);
    });

    it("is true at 10:00am ET (opening)", () => {
      expect(isInstantCallWindow(new Date("2026-07-01T14:00:00Z"))).toBe(true);
    });

    it("is true at 4:59pm ET (one minute before closing)", () => {
      expect(isInstantCallWindow(new Date("2026-07-01T20:59:00Z"))).toBe(true);
    });

    it("is false at 5:00pm ET (closing)", () => {
      expect(isInstantCallWindow(new Date("2026-07-01T21:00:00Z"))).toBe(false);
    });
  });

  describe("weekends", () => {
    it("is false on Saturday at midday ET", () => {
      // 2026-07-04 is a Saturday; noon ET = 16:00 UTC during EDT.
      expect(isInstantCallWindow(new Date("2026-07-04T16:00:00Z"))).toBe(false);
    });

    it("is false on Sunday at midday ET", () => {
      // 2026-07-05 is a Sunday; noon ET = 16:00 UTC during EDT.
      expect(isInstantCallWindow(new Date("2026-07-05T16:00:00Z"))).toBe(false);
    });
  });

  describe("DST safety", () => {
    it("is true at 10:00am ET during EDT (July, UTC-4)", () => {
      // Wednesday, July 1 2026, 10:00am EDT = 14:00 UTC.
      expect(isInstantCallWindow(new Date("2026-07-01T14:00:00Z"))).toBe(true);
    });

    it("is true at 10:00am ET during EST (January, UTC-5)", () => {
      // Wednesday, January 7 2026, 10:00am EST = 15:00 UTC.
      expect(isInstantCallWindow(new Date("2026-01-07T15:00:00Z"))).toBe(true);
    });
  });
});
