/**
 * Unit tests for Gibber type definitions.
 *
 * Tests type guards and factory functions.
 */

import { describe, it, expect } from "vitest";
import { isGibberError, createGibberError } from "$lib/gibber/types";
import type { GibberError, GibberErrorCode } from "$lib/gibber/types";

describe("gibber/types", () => {
  describe("isGibberError", () => {
    it("should return true for valid GibberError objects", () => {
      const error: GibberError = {
        code: "INIT_FAILED",
        message: "Failed to initialize",
      };

      expect(isGibberError(error)).toBe(true);
    });

    it("should return true for GibberError with cause", () => {
      const error: GibberError = {
        code: "EXECUTION_ERROR",
        message: "Code failed",
        cause: new Error("Underlying error"),
      };

      expect(isGibberError(error)).toBe(true);
    });

    it("should return false for null", () => {
      expect(isGibberError(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isGibberError(undefined)).toBe(false);
    });

    it("should return false for strings", () => {
      expect(isGibberError("error")).toBe(false);
    });

    it("should return false for numbers", () => {
      expect(isGibberError(42)).toBe(false);
    });

    it("should return false for plain Error objects", () => {
      expect(isGibberError(new Error("test"))).toBe(false);
    });

    it("should return false for objects missing code", () => {
      const obj = { message: "test" };
      expect(isGibberError(obj)).toBe(false);
    });

    it("should return false for objects missing message", () => {
      const obj = { code: "INIT_FAILED" };
      expect(isGibberError(obj)).toBe(false);
    });

    it("should return false for objects with non-string code", () => {
      const obj = { code: 123, message: "test" };
      expect(isGibberError(obj)).toBe(false);
    });

    it("should return false for objects with non-string message", () => {
      const obj = { code: "INIT_FAILED", message: 123 };
      expect(isGibberError(obj)).toBe(false);
    });
  });

  describe("createGibberError", () => {
    it("should create error with code and message", () => {
      const error = createGibberError("INIT_FAILED", "Failed to init");

      expect(error.code).toBe("INIT_FAILED");
      expect(error.message).toBe("Failed to init");
      expect(error.cause).toBeUndefined();
    });

    it("should create error with cause", () => {
      const cause = new Error("Original error");
      const error = createGibberError("EXECUTION_ERROR", "Code failed", cause);

      expect(error.code).toBe("EXECUTION_ERROR");
      expect(error.message).toBe("Code failed");
      expect(error.cause).toBe(cause);
    });

    it("should create error for each error code", () => {
      const codes: GibberErrorCode[] = [
        "INIT_FAILED",
        "NO_USER_GESTURE",
        "AUDIO_CONTEXT_ERROR",
        "WORKLET_LOAD_ERROR",
        "EXECUTION_ERROR",
        "TIMEOUT",
        "INVALID_CODE",
      ];

      for (const code of codes) {
        const error = createGibberError(code, `Test ${code}`);
        expect(error.code).toBe(code);
        expect(isGibberError(error)).toBe(true);
      }
    });

    it("should create immutable error objects", () => {
      const error = createGibberError("TIMEOUT", "Timed out");

      // Error should pass type guard
      expect(isGibberError(error)).toBe(true);

      // Properties should be readonly
      expect(error.code).toBe("TIMEOUT");
      expect(error.message).toBe("Timed out");
    });
  });
});
