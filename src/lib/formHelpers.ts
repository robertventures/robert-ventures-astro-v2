/**
 * Pure helper functions for processing form input.
 *
 * Extracted from the API routes so they can be unit tested independently.
 * None of these functions have side effects — they take input and return output,
 * which makes them very easy to test and reason about.
 */

/**
 * Auto-corrects common email typos to improve user experience.
 * Fixes domain typos without requiring user intervention.
 */
export function autoCorrectEmail(email: string): {
  correctedEmail: string;
  wasCorrected: boolean;
  originalDomain?: string;
  correctedDomain?: string;
} {
  if (!email || typeof email !== "string") {
    return { correctedEmail: email, wasCorrected: false };
  }

  const trimmedEmail = email.trim().toLowerCase();
  const [localPart, domain] = trimmedEmail.split("@");

  if (!domain) {
    return { correctedEmail: email, wasCorrected: false };
  }

  // Common email domain typos and their corrections
  const domainCorrections: Record<string, string> = {
    // Gmail typos
    "gmail.con": "gmail.com",
    "gmail.co": "gmail.com",
    "gmail.cm": "gmail.com",
    "gmail.coom": "gmail.com",
    "gmial.com": "gmail.com",
    "gmai.com": "gmail.com",
    "gmail.om": "gmail.com",
    // Yahoo typos
    "yahoo.co": "yahoo.com",
    "yahoo.cm": "yahoo.com",
    "yahoo.con": "yahoo.com",
    "hahoo.com": "yahoo.com",
    "yahoo.om": "yahoo.com",
    "yaho.com": "yahoo.com",

    // Hotmail typos
    "hotmail.co": "hotmail.com",
    "hotmail.con": "hotmail.com",
    "hotmail.cm": "hotmail.com",
    "hotmai.com": "hotmail.com",
    "hotmail.om": "hotmail.com",

    // Outlook typos
    "outlook.co": "outlook.com",
    "outlook.con": "outlook.com",
    "outlook.cm": "outlook.com",
    "outloo.com": "outlook.com",
    "outlook.om": "outlook.com",

    // Other common domains
    "icloud.co": "icloud.com",
    "icloud.con": "icloud.com",
    "aol.co": "aol.com",
    "aol.con": "aol.com",
    "live.co": "live.com",
    "live.con": "live.com",
  };

  const correctedDomain = domainCorrections[domain];
  if (correctedDomain) {
    const correctedEmail = `${localPart}@${correctedDomain}`;
    return {
      correctedEmail,
      wasCorrected: true,
      originalDomain: domain,
      correctedDomain: correctedDomain,
    };
  }

  // Always return the normalised (trimmed + lowercased) version even when no
  // domain correction is needed. Mixed-case addresses like "Jane@Gmail.COM"
  // should still be normalised before reaching downstream services.
  return { correctedEmail: trimmedEmail, wasCorrected: false };
}

/**
 * Normalizes ALL CAPS names to Title Case for better readability.
 * Only transforms if the entire name is uppercase — leaves mixed case names untouched.
 * Handles special cases: O'Brien, McDonald, hyphenated names (Mary-Jane).
 */
export function normalizeNameCase(name: string): {
  normalizedName: string;
  wasNormalized: boolean;
} {
  if (!name || typeof name !== "string") {
    return { normalizedName: name, wasNormalized: false };
  }

  const trimmedName = name.trim();

  // Only normalize if the name is ALL CAPS (letters only, ignoring spaces/punctuation)
  const lettersOnly = trimmedName.replace(/[^a-zA-Z]/g, "");
  if (lettersOnly.length === 0 || lettersOnly !== lettersOnly.toUpperCase()) {
    return { normalizedName: trimmedName, wasNormalized: false };
  }

  // Convert to Title Case, handling special characters
  const normalized = trimmedName
    .toLowerCase()
    .split(/(\s+)/) // Split by spaces but keep the spaces
    .map((part) => {
      if (part.trim() === "") return part; // Preserve spaces

      // Handle hyphenated names (e.g., MARY-JANE → Mary-Jane)
      if (part.includes("-")) {
        return part
          .split("-")
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join("-");
      }

      // Handle apostrophes (e.g., O'BRIEN → O'Brien)
      if (part.includes("'")) {
        return part
          .split("'")
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join("'");
      }

      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");

  return { normalizedName: normalized, wasNormalized: true };
}

/**
 * Splits a full name into first and last name components.
 * Handles various name formats gracefully.
 */
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  if (!fullName || typeof fullName !== "string") {
    return { firstName: "", lastName: "" };
  }

  const trimmedName = fullName.trim();
  if (!trimmedName) {
    return { firstName: "", lastName: "" };
  }

  const nameParts = trimmedName.split(/\s+/).filter((part) => part.length > 0);

  if (nameParts.length === 0) {
    return { firstName: "", lastName: "" };
  } else if (nameParts.length === 1) {
    return { firstName: nameParts[0], lastName: "" };
  } else if (nameParts.length === 2) {
    return { firstName: nameParts[0], lastName: nameParts[1] };
  } else {
    // More than two names: first is first name, rest is last name
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ");
    return { firstName, lastName };
  }
}
