/**
 * Credential management module for secure API key storage.
 *
 * This module provides functions for storing and retrieving API keys
 * using the operating system's secure keyring (Keychain on macOS,
 * Credential Manager on Windows, Secret Service on Linux).
 *
 * @module credentials
 *
 * @example
 * ```typescript
 * import { getApiKey, setApiKey, hasApiKey } from '$lib/credentials';
 *
 * // Check if API key exists
 * if (!await hasApiKey("openrouter")) {
 *   // Store a new key
 *   await setApiKey("openrouter", "sk-...");
 * }
 *
 * // Retrieve the key
 * const apiKey = await getApiKey("openrouter");
 * ```
 */

// Re-export all API functions
export { getApiKey, setApiKey, deleteApiKey, hasApiKey } from "./api";

// Re-export types
export type { ServiceId, CredentialError, CredentialErrorCode } from "./types";
export { isCredentialError } from "./types";
