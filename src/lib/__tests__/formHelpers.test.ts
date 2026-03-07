import { describe, it, expect } from "vitest";
import { autoCorrectEmail, normalizeNameCase, splitFullName } from "../formHelpers";

// ─────────────────────────────────────────────────────────────────────────────
// autoCorrectEmail
// ─────────────────────────────────────────────────────────────────────────────
// Each test asks: "given this input, does the function return what we expect?"
// Think of tests as example usage that also verifies correctness.

describe("autoCorrectEmail", () => {
  describe("Gmail typos", () => {
    it("corrects gmail.con to gmail.com", () => {
      const result = autoCorrectEmail("user@gmail.con");
      expect(result.correctedEmail).toBe("user@gmail.com");
      expect(result.wasCorrected).toBe(true);
    });

    it("corrects gmail.co to gmail.com", () => {
      const result = autoCorrectEmail("user@gmail.co");
      expect(result.correctedEmail).toBe("user@gmail.com");
      expect(result.wasCorrected).toBe(true);
    });

    it("corrects gmial.com to gmail.com", () => {
      const result = autoCorrectEmail("user@gmial.com");
      expect(result.correctedEmail).toBe("user@gmail.com");
      expect(result.wasCorrected).toBe(true);
    });
  });

  describe("Yahoo typos", () => {
    it("corrects yahoo.con to yahoo.com", () => {
      const result = autoCorrectEmail("user@yahoo.con");
      expect(result.correctedEmail).toBe("user@yahoo.com");
      expect(result.wasCorrected).toBe(true);
    });

    it("corrects hahoo.com to yahoo.com", () => {
      const result = autoCorrectEmail("user@hahoo.com");
      expect(result.correctedEmail).toBe("user@yahoo.com");
      expect(result.wasCorrected).toBe(true);
    });
  });

  describe("Hotmail / Outlook typos", () => {
    it("corrects hotmail.con to hotmail.com", () => {
      const result = autoCorrectEmail("user@hotmail.con");
      expect(result.correctedEmail).toBe("user@hotmail.com");
      expect(result.wasCorrected).toBe(true);
    });

    it("corrects outlook.co to outlook.com", () => {
      const result = autoCorrectEmail("user@outlook.co");
      expect(result.correctedEmail).toBe("user@outlook.com");
      expect(result.wasCorrected).toBe(true);
    });
  });

  describe("Correct emails pass through unchanged", () => {
    it("passes gmail.com through untouched", () => {
      const result = autoCorrectEmail("user@gmail.com");
      expect(result.correctedEmail).toBe("user@gmail.com");
      expect(result.wasCorrected).toBe(false);
    });

    it("passes a business email through untouched", () => {
      const result = autoCorrectEmail("jane@company.com");
      expect(result.correctedEmail).toBe("jane@company.com");
      expect(result.wasCorrected).toBe(false);
    });

    it("normalises case but does not flag as corrected for a clean address", () => {
      const result = autoCorrectEmail("Jane@Gmail.COM");
      expect(result.correctedEmail).toBe("jane@gmail.com");
      expect(result.wasCorrected).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("handles an email with no @ symbol gracefully", () => {
      const result = autoCorrectEmail("notanemail");
      expect(result.wasCorrected).toBe(false);
    });

    it("handles empty string gracefully", () => {
      // Empty string has no @ so domain is undefined — returns unchanged
      const result = autoCorrectEmail("");
      expect(result.wasCorrected).toBe(false);
    });

    it("records both original and corrected domain when a typo is fixed", () => {
      const result = autoCorrectEmail("user@gmail.con");
      expect(result.originalDomain).toBe("gmail.con");
      expect(result.correctedDomain).toBe("gmail.com");
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// normalizeNameCase
// ─────────────────────────────────────────────────────────────────────────────

describe("normalizeNameCase", () => {
  describe("ALL CAPS names get converted to Title Case", () => {
    it("converts a simple ALL CAPS name", () => {
      const result = normalizeNameCase("JOHN SMITH");
      expect(result.normalizedName).toBe("John Smith");
      expect(result.wasNormalized).toBe(true);
    });

    it("converts a single ALL CAPS word", () => {
      const result = normalizeNameCase("ALICE");
      expect(result.normalizedName).toBe("Alice");
      expect(result.wasNormalized).toBe(true);
    });

    it("handles hyphenated ALL CAPS names (e.g. MARY-JANE)", () => {
      const result = normalizeNameCase("MARY-JANE");
      expect(result.normalizedName).toBe("Mary-Jane");
      expect(result.wasNormalized).toBe(true);
    });

    it("handles ALL CAPS names with apostrophes (e.g. O'BRIEN)", () => {
      const result = normalizeNameCase("O'BRIEN");
      expect(result.normalizedName).toBe("O'Brien");
      expect(result.wasNormalized).toBe(true);
    });
  });

  describe("Mixed-case names are left alone", () => {
    it("does not touch an already-correct Title Case name", () => {
      const result = normalizeNameCase("John Smith");
      expect(result.normalizedName).toBe("John Smith");
      expect(result.wasNormalized).toBe(false);
    });

    it("does not touch a lowercase name", () => {
      const result = normalizeNameCase("john smith");
      expect(result.normalizedName).toBe("john smith");
      expect(result.wasNormalized).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("handles leading and trailing whitespace", () => {
      const result = normalizeNameCase("  ALICE  ");
      expect(result.normalizedName).toBe("Alice");
    });

    it("handles empty string gracefully", () => {
      const result = normalizeNameCase("");
      expect(result.wasNormalized).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// splitFullName
// ─────────────────────────────────────────────────────────────────────────────

describe("splitFullName", () => {
  it("splits a standard first + last name", () => {
    const result = splitFullName("John Smith");
    expect(result.firstName).toBe("John");
    expect(result.lastName).toBe("Smith");
  });

  it("puts a single name into firstName, lastName is empty", () => {
    const result = splitFullName("Madonna");
    expect(result.firstName).toBe("Madonna");
    expect(result.lastName).toBe("");
  });

  it("joins three-part names: first is firstName, rest is lastName", () => {
    const result = splitFullName("Mary Jane Watson");
    expect(result.firstName).toBe("Mary");
    expect(result.lastName).toBe("Jane Watson");
  });

  it("joins four-part names correctly", () => {
    const result = splitFullName("Robert James Earl Jones");
    expect(result.firstName).toBe("Robert");
    expect(result.lastName).toBe("James Earl Jones");
  });

  it("handles extra whitespace between words", () => {
    const result = splitFullName("  John   Smith  ");
    expect(result.firstName).toBe("John");
    expect(result.lastName).toBe("Smith");
  });

  it("returns empty strings for an empty input", () => {
    const result = splitFullName("");
    expect(result.firstName).toBe("");
    expect(result.lastName).toBe("");
  });

  it("returns empty strings for whitespace-only input", () => {
    const result = splitFullName("   ");
    expect(result.firstName).toBe("");
    expect(result.lastName).toBe("");
  });
});
