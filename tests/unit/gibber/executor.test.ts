/**
 * Unit tests for the Gibber code executor module.
 *
 * Tests code validation and safety checks.
 */

import { describe, it, expect } from "vitest";
import { validateCode, isCodeSafe } from "$lib/gibber/executor";

describe("gibber/executor", () => {
  describe("validateCode", () => {
    describe("empty code handling", () => {
      it("should reject empty string", () => {
        const result = validateCode("");

        expect(result.isValid).toBe(false);
        expect(result.issues).toHaveLength(1);
        expect(result.issues[0]?.severity).toBe("error");
        expect(result.issues[0]?.message).toContain("empty");
      });

      it("should reject whitespace-only string", () => {
        const result = validateCode("   \n\t  ");

        expect(result.isValid).toBe(false);
        expect(result.issues.some((i) => i.message.includes("empty"))).toBe(true);
      });
    });

    describe("dangerous pattern detection", () => {
      it("should reject infinite while loops", () => {
        const result = validateCode("while(true) { console.log('x'); }");

        expect(result.isValid).toBe(false);
        expect(result.issues.some((i) => i.message.includes("dangerous"))).toBe(true);
      });

      it("should reject infinite for loops", () => {
        const result = validateCode("for(;;) { break; }");

        expect(result.isValid).toBe(false);
        expect(result.issues.some((i) => i.message.includes("dangerous"))).toBe(true);
      });

      it("should reject eval usage", () => {
        const result = validateCode('eval("malicious code")');

        expect(result.isValid).toBe(false);
        expect(result.issues.some((i) => i.message.includes("dangerous"))).toBe(true);
      });

      it("should reject Function constructor", () => {
        const result = validateCode('new Function("return 1")');

        expect(result.isValid).toBe(false);
        expect(result.issues.some((i) => i.message.includes("dangerous"))).toBe(true);
      });

      it("should reject very high gain values", () => {
        const result = validateCode("synth.gain = 50");

        expect(result.isValid).toBe(false);
        expect(result.issues.some((i) => i.message.includes("dangerous"))).toBe(true);
      });

      it("should reject dynamic imports", () => {
        const result = validateCode('import("./malicious")');

        expect(result.isValid).toBe(false);
        expect(result.issues.some((i) => i.message.includes("dangerous"))).toBe(true);
      });

      it("should reject require calls", () => {
        const result = validateCode('require("fs")');

        expect(result.isValid).toBe(false);
        expect(result.issues.some((i) => i.message.includes("dangerous"))).toBe(true);
      });

      it("should reject process access", () => {
        const result = validateCode("process.exit(1)");

        expect(result.isValid).toBe(false);
        expect(result.issues.some((i) => i.message.includes("dangerous"))).toBe(true);
      });

      it("should reject window.location manipulation", () => {
        const result = validateCode('window.location = "http://evil.com"');

        expect(result.isValid).toBe(false);
        expect(result.issues.some((i) => i.message.includes("dangerous"))).toBe(true);
      });

      it("should reject cookie access", () => {
        const result = validateCode("document.cookie");

        expect(result.isValid).toBe(false);
        expect(result.issues.some((i) => i.message.includes("dangerous"))).toBe(true);
      });

      it("should reject localStorage access", () => {
        const result = validateCode('localStorage.setItem("key", "value")');

        expect(result.isValid).toBe(false);
        expect(result.issues.some((i) => i.message.includes("dangerous"))).toBe(true);
      });

      it("should reject fetch calls", () => {
        const result = validateCode('fetch("http://api.example.com")');

        expect(result.isValid).toBe(false);
        expect(result.issues.some((i) => i.message.includes("dangerous"))).toBe(true);
      });

      it("should reject XMLHttpRequest", () => {
        const result = validateCode("new XMLHttpRequest()");

        expect(result.isValid).toBe(false);
        expect(result.issues.some((i) => i.message.includes("dangerous"))).toBe(true);
      });
    });

    describe("syntax error detection", () => {
      it("should detect missing closing brace", () => {
        const result = validateCode("function foo() {");

        expect(result.isValid).toBe(false);
        expect(result.issues.some((i) => i.message.includes("Syntax error"))).toBe(true);
      });

      it("should detect invalid token", () => {
        const result = validateCode("const = 5;");

        expect(result.isValid).toBe(false);
        expect(result.issues.some((i) => i.message.includes("Syntax error"))).toBe(true);
      });

      it("should detect unterminated string", () => {
        const result = validateCode('const x = "unterminated');

        expect(result.isValid).toBe(false);
        expect(result.issues.some((i) => i.message.includes("Syntax error"))).toBe(true);
      });
    });

    describe("Gibber pattern detection", () => {
      it("should accept code with Synth", () => {
        const result = validateCode("const s = Synth();");

        expect(result.isValid).toBe(true);
        expect(result.issues.every((i) => i.severity === "warning")).toBe(true);
      });

      it("should accept code with FM synth", () => {
        const result = validateCode('const fm = FM("bass");');

        expect(result.isValid).toBe(true);
      });

      it("should accept code with Monosynth", () => {
        const result = validateCode("const m = Monosynth({ glide: 100 });");

        expect(result.isValid).toBe(true);
      });

      it("should accept code with Pluck", () => {
        const result = validateCode("const p = Pluck();");

        expect(result.isValid).toBe(true);
      });

      it("should accept code with drum instruments", () => {
        const result = validateCode(`
          const k = Kick();
          const s = Snare();
          const h = Hat();
        `);

        expect(result.isValid).toBe(true);
      });

      it("should accept code with effects", () => {
        const result = validateCode(`
          const d = Delay(1/4, 0.5);
          const r = Reverb(0.8);
        `);

        expect(result.isValid).toBe(true);
      });

      it("should accept code with sequencing", () => {
        const result = validateCode("synth.note.seq([60, 62, 64], 1/4);");

        expect(result.isValid).toBe(true);
      });

      it("should accept code with tidal patterns", () => {
        const result = validateCode('synth.note.tidal("60 62 64 65");');

        expect(result.isValid).toBe(true);
      });

      it("should accept code with note calls", () => {
        const result = validateCode("synth.note(60);");

        expect(result.isValid).toBe(true);
      });

      it("should accept code with trigger calls", () => {
        const result = validateCode("kick.trigger(1);");

        expect(result.isValid).toBe(true);
      });

      it("should accept code with chord calls", () => {
        const result = validateCode("synth.chord([60, 64, 67]);");

        expect(result.isValid).toBe(true);
      });

      it("should accept code with Gibber namespace", () => {
        const result = validateCode("Gibber.Seq.bpm = 120;");

        expect(result.isValid).toBe(true);
      });

      it("should warn for code without Gibber patterns", () => {
        const result = validateCode("const x = 1 + 2;");

        expect(result.isValid).toBe(true);
        expect(result.issues.some((i) => i.severity === "warning")).toBe(true);
        expect(result.issues.some((i) => i.message.includes("Gibber-specific"))).toBe(true);
      });
    });

    describe("valid Gibber code", () => {
      it("should validate simple synth creation", () => {
        const result = validateCode(`
          const synth = Synth({ attack: 0.1, decay: 0.2 });
          synth.note(60);
        `);

        expect(result.isValid).toBe(true);
      });

      it("should validate synth with effects", () => {
        const result = validateCode(`
          const s = Synth();
          s.fx.add(Reverb(0.8), Delay(1/4, 0.5));
        `);

        expect(result.isValid).toBe(true);
      });

      it("should validate sequenced patterns", () => {
        const result = validateCode(`
          const synth = Synth();
          synth.note.seq([60, 62, 64, 65], 1/8);
          synth.cutoff.seq([0.2, 0.5, 0.8], 1);
        `);

        expect(result.isValid).toBe(true);
      });

      it("should validate drum patterns", () => {
        const result = validateCode(`
          const kick = Kick();
          const snare = Snare();
          kick.trigger.seq([1, 0, 0, 0], 1/4);
          snare.trigger.seq([0, 0, 1, 0], 1/4);
        `);

        expect(result.isValid).toBe(true);
      });

      it("should validate complex composition", () => {
        const result = validateCode(`
          // Set tempo
          Gibber.Seq.bpm = 120;

          // Create instruments
          const pad = Synth({ attack: 0.5, release: 2 });
          pad.fx.add(Reverb(0.7));

          // Chord progression
          pad.chord.seq([[60, 64, 67], [62, 65, 69]], 2);

          // Bass line
          const bass = FM('bass');
          bass.note.seq([36, 36, 38, 40], 1);
        `);

        expect(result.isValid).toBe(true);
      });
    });

    describe("edge cases", () => {
      it("should handle code with safe gain values", () => {
        const result = validateCode("synth.gain = 0.5;");

        expect(result.isValid).toBe(true);
      });

      it("should handle code with gain value 1", () => {
        const result = validateCode("synth.gain = 1;");

        expect(result.isValid).toBe(true);
      });

      it("should handle single-line code", () => {
        const result = validateCode("Synth().note(60)");

        expect(result.isValid).toBe(true);
      });

      it("should handle code with comments", () => {
        const result = validateCode(`
          // Create a synth
          const s = Synth();
          /* Play a note */
          s.note(60);
        `);

        expect(result.isValid).toBe(true);
      });
    });
  });

  describe("isCodeSafe", () => {
    it("should return true for safe Gibber code", () => {
      expect(isCodeSafe("const s = Synth(); s.note(60);")).toBe(true);
    });

    it("should return false for dangerous code", () => {
      expect(isCodeSafe("while(true) {}")).toBe(false);
    });

    it("should return false for empty code", () => {
      expect(isCodeSafe("")).toBe(false);
    });

    it("should return false for syntax errors", () => {
      expect(isCodeSafe("const = ")).toBe(false);
    });

    it("should return true for code without Gibber patterns (with warning)", () => {
      // isCodeSafe only checks for errors, not warnings
      expect(isCodeSafe("const x = 1;")).toBe(true);
    });
  });
});
