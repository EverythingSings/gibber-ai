/**
 * Unit tests for the credentials module.
 *
 * Tests cover the TypeScript API functions that wrap Tauri IPC commands.
 * Tauri's invoke is mocked in setup.ts.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { getApiKey, setApiKey, deleteApiKey, hasApiKey } from "$lib/credentials";
import { isCredentialError } from "$lib/credentials/types";

// Type the mock for better intellisense
const mockInvoke = vi.mocked(invoke);

describe("credentials module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getApiKey", () => {
    it("should call invoke with correct command and service", async () => {
      mockInvoke.mockResolvedValueOnce("test-api-key");

      const result = await getApiKey("openrouter");

      expect(mockInvoke).toHaveBeenCalledWith("get_api_key", {
        service: "openrouter",
      });
      expect(result).toBe("test-api-key");
    });

    it("should return null when no key exists", async () => {
      mockInvoke.mockResolvedValueOnce(null);

      const result = await getApiKey("openrouter");

      expect(result).toBeNull();
    });

    it("should propagate errors from invoke", async () => {
      const error = { message: "Storage error", code: "PLATFORM_FAILURE" };
      mockInvoke.mockRejectedValueOnce(error);

      await expect(getApiKey("openrouter")).rejects.toEqual(error);
    });
  });

  describe("setApiKey", () => {
    it("should call invoke with correct command, service, and key", async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      await setApiKey("openrouter", "sk-test-key");

      expect(mockInvoke).toHaveBeenCalledWith("set_api_key", {
        service: "openrouter",
        key: "sk-test-key",
      });
    });

    it("should propagate errors from invoke", async () => {
      const error = { message: "Write failed", code: "NO_STORAGE_ACCESS" };
      mockInvoke.mockRejectedValueOnce(error);

      await expect(setApiKey("openrouter", "sk-key")).rejects.toEqual(error);
    });
  });

  describe("deleteApiKey", () => {
    it("should return true when key was deleted", async () => {
      mockInvoke.mockResolvedValueOnce(true);

      const result = await deleteApiKey("openrouter");

      expect(mockInvoke).toHaveBeenCalledWith("delete_api_key", {
        service: "openrouter",
      });
      expect(result).toBe(true);
    });

    it("should return false when key did not exist", async () => {
      mockInvoke.mockResolvedValueOnce(false);

      const result = await deleteApiKey("openrouter");

      expect(result).toBe(false);
    });
  });

  describe("hasApiKey", () => {
    it("should return true when key exists", async () => {
      mockInvoke.mockResolvedValueOnce("some-key");

      const result = await hasApiKey("openrouter");

      expect(result).toBe(true);
    });

    it("should return false when key does not exist", async () => {
      mockInvoke.mockResolvedValueOnce(null);

      const result = await hasApiKey("openrouter");

      expect(result).toBe(false);
    });
  });

  describe("isCredentialError", () => {
    it("should return true for valid CredentialError", () => {
      const error = { message: "Test error", code: "NO_ENTRY" };

      expect(isCredentialError(error)).toBe(true);
    });

    it("should return false for null", () => {
      expect(isCredentialError(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isCredentialError(undefined)).toBe(false);
    });

    it("should return false for non-object", () => {
      expect(isCredentialError("error")).toBe(false);
      expect(isCredentialError(123)).toBe(false);
    });

    it("should return false for object missing message", () => {
      expect(isCredentialError({ code: "TEST" })).toBe(false);
    });

    it("should return false for object missing code", () => {
      expect(isCredentialError({ message: "Test" })).toBe(false);
    });

    it("should return false for object with wrong types", () => {
      expect(isCredentialError({ message: 123, code: "TEST" })).toBe(false);
      expect(isCredentialError({ message: "Test", code: 123 })).toBe(false);
    });
  });

  describe("service type safety", () => {
    it("should only accept valid service identifiers", async () => {
      mockInvoke.mockResolvedValue(null);

      // These should compile without errors
      await getApiKey("openrouter");
      await getApiKey("nostr");
      await getApiKey("mastodon");

      // @ts-expect-error - "invalid" is not a valid ServiceId
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      () => getApiKey("invalid");
    });
  });
});
