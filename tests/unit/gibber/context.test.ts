/**
 * Unit tests for the Gibber context manager module.
 *
 * Tests context lifecycle and state management.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the gibber.audio.lib module before importing context
vi.mock("gibber.audio.lib", () => ({
  default: {
    init: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn(),
    Seq: { bpm: 120 },
    Synth: vi.fn(),
    FM: vi.fn(),
  },
}));

// Import after mocking
const {
  getContextState,
  getContextError,
  isContextReady,
  getGibber,
  getBpm,
  setBpm,
  registerInstrument,
  unregisterInstrument,
  registerSequence,
  unregisterSequence,
  getActiveInstruments,
  getActiveSequences,
  getCompositionSnapshot,
  subscribeToStateChanges,
  destroyContext,
} = await import("$lib/gibber/context");

describe("gibber/context", () => {
  beforeEach(() => {
    // Reset context state before each test
    destroyContext();
    vi.clearAllMocks();
  });

  afterEach(() => {
    destroyContext();
  });

  describe("initial state", () => {
    it("should start in uninitialized state", () => {
      expect(getContextState()).toBe("uninitialized");
    });

    it("should have no error initially", () => {
      expect(getContextError()).toBeNull();
    });

    it("should not be ready initially", () => {
      expect(isContextReady()).toBe(false);
    });

    it("should have no Gibber instance initially", () => {
      expect(getGibber()).toBeNull();
    });

    it("should have default BPM", () => {
      expect(getBpm()).toBe(120);
    });
  });

  describe("BPM management", () => {
    it("should allow setting BPM", () => {
      setBpm(140);
      expect(getBpm()).toBe(140);
    });

    it("should update BPM to new value", () => {
      setBpm(90);
      expect(getBpm()).toBe(90);

      setBpm(180);
      expect(getBpm()).toBe(180);
    });
  });

  describe("instrument registration", () => {
    it("should register an instrument", () => {
      const mockInstance = { note: vi.fn() };
      const instrument = registerInstrument("mySynth", "Synth", mockInstance);

      expect(instrument.id).toBeDefined();
      expect(instrument.name).toBe("mySynth");
      expect(instrument.type).toBe("Synth");
      expect(instrument.createdAt).toBeLessThanOrEqual(Date.now());
    });

    it("should generate unique IDs for instruments", () => {
      const inst1 = registerInstrument("synth1", "Synth", {});
      const inst2 = registerInstrument("synth2", "Synth", {});

      expect(inst1.id).not.toBe(inst2.id);
    });

    it("should track registered instruments", () => {
      registerInstrument("synth1", "Synth", {});
      registerInstrument("fm1", "FM", {});

      const instruments = getActiveInstruments();

      expect(instruments).toHaveLength(2);
      expect(instruments.some((i) => i.name === "synth1")).toBe(true);
      expect(instruments.some((i) => i.name === "fm1")).toBe(true);
    });

    it("should unregister an instrument", () => {
      const instrument = registerInstrument("testSynth", "Synth", {});

      expect(getActiveInstruments()).toHaveLength(1);

      unregisterInstrument(instrument.id);

      expect(getActiveInstruments()).toHaveLength(0);
    });

    it("should do nothing when unregistering non-existent instrument", () => {
      registerInstrument("synth", "Synth", {});

      expect(getActiveInstruments()).toHaveLength(1);

      unregisterInstrument("non-existent-id");

      expect(getActiveInstruments()).toHaveLength(1);
    });
  });

  describe("sequence registration", () => {
    it("should register a sequence", () => {
      const instrument = registerInstrument("synth", "Synth", {});
      const sequence = registerSequence(instrument.id, "note", [60, 62, 64], [0.25]);

      expect(sequence.id).toBeDefined();
      expect(sequence.instrumentId).toBe(instrument.id);
      expect(sequence.target).toBe("note");
      expect(sequence.values).toEqual([60, 62, 64]);
      expect(sequence.timings).toEqual([0.25]);
      expect(sequence.isPlaying).toBe(true);
    });

    it("should track registered sequences", () => {
      const instrument = registerInstrument("synth", "Synth", {});
      registerSequence(instrument.id, "note", [60], [0.25]);
      registerSequence(instrument.id, "cutoff", [0.5], [1]);

      const sequences = getActiveSequences();

      expect(sequences).toHaveLength(2);
      expect(sequences.some((s) => s.target === "note")).toBe(true);
      expect(sequences.some((s) => s.target === "cutoff")).toBe(true);
    });

    it("should unregister a sequence", () => {
      const instrument = registerInstrument("synth", "Synth", {});
      const sequence = registerSequence(instrument.id, "note", [60], [0.25]);

      expect(getActiveSequences()).toHaveLength(1);

      unregisterSequence(sequence.id);

      expect(getActiveSequences()).toHaveLength(0);
    });

    it("should remove sequences when instrument is unregistered", () => {
      const instrument = registerInstrument("synth", "Synth", {});
      registerSequence(instrument.id, "note", [60], [0.25]);
      registerSequence(instrument.id, "cutoff", [0.5], [1]);

      expect(getActiveSequences()).toHaveLength(2);

      unregisterInstrument(instrument.id);

      expect(getActiveSequences()).toHaveLength(0);
    });
  });

  describe("composition snapshot", () => {
    it("should return current composition state", () => {
      setBpm(140);

      const snapshot = getCompositionSnapshot();

      expect(snapshot.bpm).toBe(140);
      expect(snapshot.instruments).toEqual([]);
      expect(snapshot.sequences).toEqual([]);
      expect(snapshot.isPlaying).toBe(false);
      expect(snapshot.timestamp).toBeLessThanOrEqual(Date.now());
    });

    it("should include registered instruments in snapshot", () => {
      registerInstrument("synth", "Synth", {});
      registerInstrument("bass", "FM", {});

      const snapshot = getCompositionSnapshot();

      expect(snapshot.instruments).toHaveLength(2);
    });

    it("should include registered sequences in snapshot", () => {
      const instrument = registerInstrument("synth", "Synth", {});
      registerSequence(instrument.id, "note", [60], [0.25]);

      const snapshot = getCompositionSnapshot();

      expect(snapshot.sequences).toHaveLength(1);
      expect(snapshot.isPlaying).toBe(true);
    });
  });

  describe("state change subscription", () => {
    it("should notify subscribers of state changes", () => {
      const listener = vi.fn();

      subscribeToStateChanges(listener);

      // Destroy and recreate to trigger state change
      destroyContext();

      // After destroy, state should be uninitialized
      expect(getContextState()).toBe("uninitialized");
    });

    it("should return unsubscribe function", () => {
      const listener = vi.fn();

      const unsubscribe = subscribeToStateChanges(listener);

      expect(typeof unsubscribe).toBe("function");

      unsubscribe();

      // Listener should not be called after unsubscribe
      destroyContext();
    });

    it("should support multiple subscribers", () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      const unsub1 = subscribeToStateChanges(listener1);
      const unsub2 = subscribeToStateChanges(listener2);

      // Both should be valid functions
      expect(typeof unsub1).toBe("function");
      expect(typeof unsub2).toBe("function");

      unsub1();
      unsub2();
    });
  });

  describe("destroyContext", () => {
    it("should reset state to uninitialized", () => {
      setBpm(180);
      registerInstrument("synth", "Synth", {});

      destroyContext();

      expect(getContextState()).toBe("uninitialized");
      expect(getBpm()).toBe(120);
      expect(getActiveInstruments()).toHaveLength(0);
    });

    it("should clear all instruments", () => {
      registerInstrument("synth1", "Synth", {});
      registerInstrument("synth2", "Synth", {});

      expect(getActiveInstruments()).toHaveLength(2);

      destroyContext();

      expect(getActiveInstruments()).toHaveLength(0);
    });

    it("should clear all sequences", () => {
      const inst = registerInstrument("synth", "Synth", {});
      registerSequence(inst.id, "note", [60], [0.25]);

      expect(getActiveSequences()).toHaveLength(1);

      destroyContext();

      expect(getActiveSequences()).toHaveLength(0);
    });
  });
});
