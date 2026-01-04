/**
 * Check if a name appears to be redacted.
 * Redacted names typically start with "(" or "*" in olympiad data.
 */
export function isRedactedName(name: string): boolean {
  return name.startsWith("(") || name.startsWith("*");
}
