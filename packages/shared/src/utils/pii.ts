/**
 * PII (Personally Identifiable Information) sanitization
 * Safe handling of sensitive data for logging, LLM inputs, etc.
 */

export interface PiiSanitizationOptions {
  maskEmail?: boolean;
  maskPhone?: boolean;
  maskName?: boolean;
  maskAddress?: boolean;
  maskFileContent?: boolean;
  preserveLength?: boolean; // Use asterisks same length as original
}

const DEFAULT_OPTIONS: PiiSanitizationOptions = {
  maskEmail: true,
  maskPhone: true,
  maskName: true,
  maskAddress: true,
  maskFileContent: true,
  preserveLength: true,
};

/**
 * Mask email address
 * user@example.com -> u***@example.com
 */
export function maskEmail(email: string, preserveLength = true): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;

  const masked =
    local.charAt(0) + (preserveLength ? "*".repeat(local.length - 2) : "***") + local.charAt(local.length - 1);
  return `${masked}@${domain}`;
}

/**
 * Mask phone number
 * +1-234-567-8900 -> +1-***-***-8900
 */
export function maskPhone(phone: string, preserveLength = true): string {
  // Extract only digits
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return phone;

  const lastFour = digits.slice(-4);
  const masked = preserveLength ? "*".repeat(digits.length - 4) + lastFour : "***" + lastFour;

  // Restore original format as much as possible
  return `+1-${masked.slice(0, 3)}-${masked.slice(3, 6)}-${masked.slice(6)}`;
}

/**
 * Mask name
 * John Doe -> J*** D***
 */
export function maskName(name: string, preserveLength = true): string {
  const parts = name.split(" ");
  return parts
    .map((part) => {
      if (!part) return part;
      return (
        part.charAt(0) +
        (preserveLength ? "*".repeat(part.length - 1) : "***")
      );
    })
    .join(" ");
}

/**
 * Mask address
 * 123 Main St, New York, NY 10001 -> 123 Main St, ******, ** *****
 */
export function maskAddress(address: string): string {
  const parts = address.split(",");
  if (parts.length === 1) {
    return address; // Can't determine structure
  }

  // Keep first part (street), mask city and zip
  return parts
    .map((part, index) => {
      if (index === 0) return part; // Keep street
      return "***";
    })
    .join(", ");
}

/**
 * Sanitize object for safe logging
 * Recursively masks PII fields
 */
export function sanitizeForLogging(
  data: unknown,
  options: PiiSanitizationOptions = DEFAULT_OPTIONS
): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === "string") {
    // Check if looks like email
    if (options.maskEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) {
      return maskEmail(data, options.preserveLength);
    }

    // Check if looks like phone
    if (options.maskPhone && /^[\+\d\-\s()]{7,}$/.test(data) && /\d{3,}/.test(data)) {
      return maskPhone(data, options.preserveLength);
    }

    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForLogging(item, options));
  }

  if (typeof data === "object") {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();

      // Check key names for PII indicators
      if (options.maskEmail && (lowerKey.includes("email") || lowerKey.includes("mail"))) {
        sanitized[key] =
          typeof value === "string" ? maskEmail(value, options.preserveLength) : value;
        continue;
      }

      if (
        options.maskPhone &&
        (lowerKey.includes("phone") ||
          lowerKey.includes("mobile") ||
          lowerKey.includes("telephone"))
      ) {
        sanitized[key] =
          typeof value === "string" ? maskPhone(value, options.preserveLength) : value;
        continue;
      }

      if (
        options.maskName &&
        (lowerKey.includes("name") ||
          lowerKey.includes("fullname") ||
          lowerKey.includes("firstname") ||
          lowerKey.includes("lastname"))
      ) {
        sanitized[key] =
          typeof value === "string" ? maskName(value, options.preserveLength) : value;
        continue;
      }

      if (
        options.maskAddress &&
        (lowerKey.includes("address") || lowerKey.includes("location"))
      ) {
        sanitized[key] =
          typeof value === "string" ? maskAddress(value) : value;
        continue;
      }

      // Recursively sanitize nested objects
      sanitized[key] = sanitizeForLogging(value, options);
    }

    return sanitized;
  }

  return data;
}

/**
 * Sanitize for LLM input
 * Remove/mask sensitive data before sending to Claude
 */
export function sanitizeForLLM(
  text: string,
  options: Partial<PiiSanitizationOptions> = {}
): string {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  let sanitized = text;

  if (mergedOptions.maskEmail) {
    sanitized = sanitized.replace(
      /[^\s@]+@[^\s@]+\.[^\s@]+/g,
      (match) => maskEmail(match, mergedOptions.preserveLength)
    );
  }

  if (mergedOptions.maskPhone) {
    sanitized = sanitized.replace(
      /(\+?\d{1,3}[-.\s]?)?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g,
      (match) => maskPhone(match, mergedOptions.preserveLength)
    );
  }

  if (mergedOptions.maskName) {
    // Mask typical name patterns (first last)
    // This is conservative to avoid false positives
    sanitized = sanitized.replace(
      /([A-Z][a-z]+)\s+([A-Z][a-z]+)(?:\s|$|\.)/g,
      (match) => maskName(match.trim(), mergedOptions.preserveLength) + " "
    );
  }

  return sanitized;
}

/**
 * Check if string contains PII
 */
export function containsPii(text: string): boolean {
  // Email pattern
  if (/[^\s@]+@[^\s@]+\.[^\s@]+/.test(text)) return true;

  // Phone pattern
  if (/(\+?\d{1,3}[-.\s]?)?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(text)) return true;

  // Credit card pattern (4-4-4-4 or 4444444444)
  if (/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/.test(text)) return true;

  // SSN pattern (XXX-XX-XXXX)
  if (/\d{3}-\d{2}-\d{4}/.test(text)) return true;

  return false;
}
