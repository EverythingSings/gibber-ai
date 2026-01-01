/**
 * Type definitions for credential management.
 *
 * @module credentials/types
 */

/**
 * Known service identifiers for API key storage.
 * Add new services here as they are integrated.
 */
export type ServiceId = "openrouter" | "nostr" | "mastodon";

/**
 * Error returned from credential operations.
 * Matches the Rust CredentialError struct.
 */
export interface CredentialError {
  /** Human-readable error message */
  readonly message: string;
  /** Error code for programmatic handling */
  readonly code: CredentialErrorCode;
}

/**
 * Error codes that can be returned from credential operations.
 */
export type CredentialErrorCode =
  | "NO_ENTRY"
  | "AMBIGUOUS"
  | "BAD_ENCODING"
  | "TOO_LONG"
  | "INVALID"
  | "NO_STORAGE_ACCESS"
  | "PLATFORM_FAILURE"
  | "UNKNOWN";

/**
 * Type guard to check if an error is a CredentialError.
 *
 * @param error - The value to check
 * @returns True if the value is a CredentialError
 */
export const isCredentialError = (error: unknown): error is CredentialError => {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const obj = error as Record<string, unknown>;
  return typeof obj["message"] === "string" && typeof obj["code"] === "string";
};
