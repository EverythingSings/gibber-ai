/**
 * Unit tests for the AI types module.
 *
 * Tests cover type guards and constants.
 */

import { describe, it, expect } from "vitest";
import { isAIError, MODEL_IDS } from "$lib/ai/types";
import type { AIError, ModelTier } from "$lib/ai/types";

describe("ai/types module", () => {
  describe("MODEL_IDS", () => {
    it("should have IDs for all model tiers", () => {
      const tiers: ModelTier[] = ["quick", "standard", "complex"];

      for (const tier of tiers) {
        expect(MODEL_IDS[tier]).toBeDefined();
        expect(typeof MODEL_IDS[tier]).toBe("string");
        expect(MODEL_IDS[tier].length).toBeGreaterThan(0);
      }
    });

    it("should use Claude models", () => {
      expect(MODEL_IDS.quick).toContain("claude");
      expect(MODEL_IDS.standard).toContain("claude");
      expect(MODEL_IDS.complex).toContain("claude");
    });
  });

  describe("isAIError", () => {
    it("should return true for valid AIError", () => {
      const error: AIError = {
        message: "Test error",
        code: "NETWORK_ERROR",
      };

      expect(isAIError(error)).toBe(true);
    });

    it("should return true for AIError with details", () => {
      const error = {
        message: "Test error",
        code: "UNKNOWN",
        details: { extra: "info" },
      };

      expect(isAIError(error)).toBe(true);
    });

    it("should return false for null", () => {
      expect(isAIError(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isAIError(undefined)).toBe(false);
    });

    it("should return false for non-object", () => {
      expect(isAIError("error")).toBe(false);
      expect(isAIError(123)).toBe(false);
      expect(isAIError(true)).toBe(false);
    });

    it("should return false for object missing message", () => {
      expect(isAIError({ code: "TEST" })).toBe(false);
    });

    it("should return false for object missing code", () => {
      expect(isAIError({ message: "Test" })).toBe(false);
    });

    it("should return false for object with wrong types", () => {
      expect(isAIError({ message: 123, code: "TEST" })).toBe(false);
      expect(isAIError({ message: "Test", code: 123 })).toBe(false);
    });

    it("should return false for array", () => {
      expect(isAIError(["message", "code"])).toBe(false);
    });
  });
});
