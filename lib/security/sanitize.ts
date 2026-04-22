// ════════════════════════════════════════════════════════════════
// Input Sanitization — Strip dangerous content from user text
// ────────────────────────────────────────────────────────────────
// Use at system boundaries: form submissions, API request bodies.
// Prisma prevents SQL injection; this handles XSS in stored text.
// ════════════════════════════════════════════════════════════════

/** Strip HTML tags from a string */
function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/** Collapse multiple whitespace/newlines into single spaces, then trim */
function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

interface SanitizeOptions {
  /** Max character length (truncates if exceeded). Default: 1000 */
  maxLength?: number;
  /** Allow newlines (for multiline fields like reason/note). Default: false */
  allowNewlines?: boolean;
}

/**
 * Sanitize a single-line or multi-line text input.
 *
 * - Strips all HTML tags
 * - Trims leading/trailing whitespace
 * - Enforces max length
 * - Optionally preserves newlines (for textarea fields)
 *
 * @example
 *   sanitizeText("<script>alert('xss')</script>Hello")  // "alert('xss')Hello"
 *   sanitizeText("  too long  ", { maxLength: 5 })      // "too l"
 */
export function sanitizeText(
  input: string,
  options: SanitizeOptions = {},
): string {
  const { maxLength = 1000, allowNewlines = false } = options;

  let result = stripHtml(input);

  if (allowNewlines) {
    // Normalize each line individually, preserve single newlines
    result = result
      .split("\n")
      .map((line) => line.replace(/[ \t]+/g, " ").trim())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n") // max 2 consecutive newlines
      .trim();
  } else {
    result = normalizeWhitespace(result);
  }

  if (result.length > maxLength) {
    result = result.slice(0, maxLength);
  }

  return result;
}

/**
 * Sanitize an object's string fields in-place.
 * Non-string fields are left untouched.
 *
 * @example
 *   sanitizeFields({ reason: "<b>sick</b>", days: 3 }, {
 *     reason: { maxLength: 500, allowNewlines: true },
 *   })
 *   // { reason: "sick", days: 3 }
 */
export function sanitizeFields<T extends Record<string, unknown>>(
  obj: T,
  fieldOptions: Partial<Record<keyof T, SanitizeOptions>>,
): T {
  const result = { ...obj };
  for (const [key, opts] of Object.entries(fieldOptions)) {
    const value = result[key as keyof T];
    if (typeof value === "string") {
      (result as Record<string, unknown>)[key] = sanitizeText(
        value,
        opts as SanitizeOptions,
      );
    }
  }
  return result;
}
