/**
 * API functions for secure credential storage.
 *
 * These functions wrap Tauri IPC commands for storing and retrieving
 * API keys using the operating system's secure keyring.
 *
 * @module credentials/api
 */

import { invoke } from "@tauri-apps/api/core";
import type { ServiceId } from "./types";

/**
 * Retrieves an API key from the system keyring.
 *
 * @param service - The service identifier (e.g., "openrouter")
 * @returns The API key if found, or null if not set
 * @throws CredentialError if the keyring operation fails
 *
 * @example
 * ```typescript
 * const apiKey = await getApiKey("openrouter");
 * if (apiKey) {
 *   console.log(`API key length: ${apiKey.length}`);
 * }
 * ```
 */
export const getApiKey = async (service: ServiceId): Promise<string | null> => {
  const result = await invoke<string | null>("get_api_key", { service });
  return result;
};

/**
 * Stores an API key in the system keyring.
 *
 * If a key already exists for the given service, it will be overwritten.
 *
 * @param service - The service identifier (e.g., "openrouter")
 * @param key - The API key to store
 * @throws CredentialError if the keyring operation fails
 *
 * @example
 * ```typescript
 * await setApiKey("openrouter", "sk-...");
 * ```
 */
export const setApiKey = async (service: ServiceId, key: string): Promise<void> => {
  await invoke("set_api_key", { service, key });
};

/**
 * Deletes an API key from the system keyring.
 *
 * @param service - The service identifier (e.g., "openrouter")
 * @returns True if the key was deleted, false if it didn't exist
 * @throws CredentialError if the keyring operation fails
 *
 * @example
 * ```typescript
 * const deleted = await deleteApiKey("openrouter");
 * console.log(deleted ? "Key deleted" : "Key not found");
 * ```
 */
export const deleteApiKey = async (service: ServiceId): Promise<boolean> => {
  return invoke<boolean>("delete_api_key", { service });
};

/**
 * Checks if an API key is stored for a service.
 *
 * This is a convenience function that wraps getApiKey.
 *
 * @param service - The service identifier
 * @returns True if a key exists for the service
 * @throws CredentialError if the keyring operation fails
 *
 * @example
 * ```typescript
 * if (await hasApiKey("openrouter")) {
 *   // Ready to make API calls
 * } else {
 *   // Prompt user to enter API key
 * }
 * ```
 */
export const hasApiKey = async (service: ServiceId): Promise<boolean> => {
  const key = await getApiKey(service);
  return key !== null;
};
