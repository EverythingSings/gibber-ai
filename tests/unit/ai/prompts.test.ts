/**
 * Unit tests for the AI prompts module.
 *
 * Tests cover system prompt generation for Gibber composition context.
 */

import { describe, it, expect } from "vitest";
import {
  createSystemPrompt,
  createCompositionContext,
  GIBBER_API_REFERENCE,
} from "$lib/ai/prompts";
import type { CompositionState } from "$lib/ai/prompts";

describe("prompts module", () => {
  describe("GIBBER_API_REFERENCE", () => {
    it("should be a non-empty string", () => {
      expect(typeof GIBBER_API_REFERENCE).toBe("string");
      expect(GIBBER_API_REFERENCE.length).toBeGreaterThan(0);
    });

    it("should contain key Gibber concepts", () => {
      expect(GIBBER_API_REFERENCE).toContain("Synth");
      expect(GIBBER_API_REFERENCE).toContain("Seq");
      expect(GIBBER_API_REFERENCE).toContain("FM");
    });
  });

  describe("createCompositionContext", () => {
    it("should create context with default values", () => {
      const state: CompositionState = {
        bpm: 120,
        key: "C",
        scale: "minor",
        activeInstruments: [],
        activePatterns: [],
      };

      const context = createCompositionContext(state);

      expect(context).toContain("BPM: 120");
      expect(context).toContain("Key: C");
      expect(context).toContain("Scale: minor");
    });

    it("should list active instruments", () => {
      const state: CompositionState = {
        bpm: 140,
        key: "G",
        scale: "major",
        activeInstruments: ["synth1", "bass", "drums"],
        activePatterns: [],
      };

      const context = createCompositionContext(state);

      expect(context).toContain("synth1");
      expect(context).toContain("bass");
      expect(context).toContain("drums");
    });

    it("should list active patterns", () => {
      const state: CompositionState = {
        bpm: 120,
        key: "C",
        scale: "minor",
        activeInstruments: [],
        activePatterns: ["melody", "bassline"],
      };

      const context = createCompositionContext(state);

      expect(context).toContain("melody");
      expect(context).toContain("bassline");
    });

    it("should indicate when no instruments are active", () => {
      const state: CompositionState = {
        bpm: 120,
        key: "C",
        scale: "minor",
        activeInstruments: [],
        activePatterns: [],
      };

      const context = createCompositionContext(state);

      expect(context).toMatch(/no.*instruments|none/i);
    });
  });

  describe("createSystemPrompt", () => {
    it("should include API reference", () => {
      const state: CompositionState = {
        bpm: 120,
        key: "C",
        scale: "minor",
        activeInstruments: [],
        activePatterns: [],
      };

      const prompt = createSystemPrompt(state);

      expect(prompt).toContain(GIBBER_API_REFERENCE);
    });

    it("should include composition context", () => {
      const state: CompositionState = {
        bpm: 90,
        key: "Bb",
        scale: "dorian",
        activeInstruments: ["lead"],
        activePatterns: [],
      };

      const prompt = createSystemPrompt(state);

      expect(prompt).toContain("BPM: 90");
      expect(prompt).toContain("Key: Bb");
      expect(prompt).toContain("Scale: dorian");
    });

    it("should include role instructions", () => {
      const state: CompositionState = {
        bpm: 120,
        key: "C",
        scale: "minor",
        activeInstruments: [],
        activePatterns: [],
      };

      const prompt = createSystemPrompt(state);

      // Should contain instructions about being a composition assistant
      expect(prompt).toMatch(/gibber|composition|code/i);
    });

    it("should include safety guidelines", () => {
      const state: CompositionState = {
        bpm: 120,
        key: "C",
        scale: "minor",
        activeInstruments: [],
        activePatterns: [],
      };

      const prompt = createSystemPrompt(state);

      // Should mention code blocks for executable code
      expect(prompt).toMatch(/```|code block/i);
    });

    it("should handle custom genres", () => {
      const state: CompositionState = {
        bpm: 140,
        key: "D",
        scale: "minor",
        activeInstruments: [],
        activePatterns: [],
        genre: "techno",
      };

      const prompt = createSystemPrompt(state);

      expect(prompt).toContain("techno");
    });

    it("should handle custom mood", () => {
      const state: CompositionState = {
        bpm: 60,
        key: "A",
        scale: "minor",
        activeInstruments: [],
        activePatterns: [],
        mood: "melancholic",
      };

      const prompt = createSystemPrompt(state);

      expect(prompt).toContain("melancholic");
    });
  });
});
