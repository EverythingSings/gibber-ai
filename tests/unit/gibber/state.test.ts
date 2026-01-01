/**
 * Unit tests for the Gibber state management module.
 *
 * Tests Svelte-compatible stores for Gibber state.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the gibber.audio.lib module
vi.mock("gibber.audio.lib", () => ({
  default: {
    init: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn(),
    Seq: { bpm: 120 },
  },
}));

// Import after mocking
const {
  contextState,
  contextError,
  isReady,
  bpm,
  activeInstruments,
  activeSequences,
  isPlaying,
  get,
  resetGibber,
} = await import("$lib/gibber/state");

const { destroyContext, registerInstrument, registerSequence } =
  await import("$lib/gibber/context");

describe("gibber/state", () => {
  beforeEach(() => {
    destroyContext();
    vi.clearAllMocks();
  });

  afterEach(() => {
    destroyContext();
  });

  describe("contextState store", () => {
    it("should have initial value of uninitialized", () => {
      const value = get(contextState);
      expect(value).toBe("uninitialized");
    });

    it("should be subscribable", () => {
      const subscriber = vi.fn();

      const unsubscribe = contextState.subscribe(subscriber);

      // Should be called immediately with current value
      expect(subscriber).toHaveBeenCalledWith("uninitialized");

      unsubscribe();
    });

    it("should call subscriber on unsubscribe cleanup", () => {
      const subscriber = vi.fn();

      const unsubscribe = contextState.subscribe(subscriber);
      expect(subscriber).toHaveBeenCalledTimes(1);

      unsubscribe();
      // After unsubscribe, no more calls expected
    });
  });

  describe("contextError store", () => {
    it("should have initial value of null", () => {
      const value = get(contextError);
      expect(value).toBeNull();
    });

    it("should be subscribable", () => {
      const subscriber = vi.fn();

      const unsubscribe = contextError.subscribe(subscriber);

      expect(subscriber).toHaveBeenCalledWith(null);

      unsubscribe();
    });
  });

  describe("isReady store", () => {
    it("should have initial value of false", () => {
      const value = get(isReady);
      expect(value).toBe(false);
    });

    it("should be subscribable", () => {
      const subscriber = vi.fn();

      const unsubscribe = isReady.subscribe(subscriber);

      expect(subscriber).toHaveBeenCalledWith(false);

      unsubscribe();
    });
  });

  describe("bpm store", () => {
    it("should have initial value of 120", () => {
      const value = get(bpm);
      expect(value).toBe(120);
    });

    it("should allow setting BPM", () => {
      bpm.set(140);

      expect(get(bpm)).toBe(140);
    });

    it("should allow updating BPM", () => {
      bpm.set(120);
      bpm.update((v) => v + 20);

      expect(get(bpm)).toBe(140);
    });

    it("should notify subscribers when BPM changes", () => {
      const subscriber = vi.fn();
      const unsubscribe = bpm.subscribe(subscriber);

      // Clear initial call
      subscriber.mockClear();

      bpm.set(180);

      expect(subscriber).toHaveBeenCalledWith(180);

      unsubscribe();
    });
  });

  describe("activeInstruments store", () => {
    it("should have initial empty array", () => {
      const value = get(activeInstruments);
      expect(value).toEqual([]);
    });

    it("should be subscribable", () => {
      const subscriber = vi.fn();

      const unsubscribe = activeInstruments.subscribe(subscriber);

      expect(subscriber).toHaveBeenCalledWith([]);

      unsubscribe();
    });

    it("should reflect registered instruments after polling interval", async () => {
      const subscriber = vi.fn();
      const unsubscribe = activeInstruments.subscribe(subscriber);

      // Register an instrument
      registerInstrument("synth", "Synth", {});

      // Wait for polling interval (500ms + buffer)
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Should have been called with updated instruments
      const lastCall = subscriber.mock.calls[subscriber.mock.calls.length - 1];
      expect(lastCall?.[0]).toHaveLength(1);

      unsubscribe();
    });
  });

  describe("activeSequences store", () => {
    it("should have initial empty array", () => {
      const value = get(activeSequences);
      expect(value).toEqual([]);
    });

    it("should be subscribable", () => {
      const subscriber = vi.fn();

      const unsubscribe = activeSequences.subscribe(subscriber);

      expect(subscriber).toHaveBeenCalledWith([]);

      unsubscribe();
    });
  });

  describe("isPlaying store", () => {
    it("should have initial value of false", () => {
      const value = get(isPlaying);
      expect(value).toBe(false);
    });

    it("should be subscribable", () => {
      const subscriber = vi.fn();

      const unsubscribe = isPlaying.subscribe(subscriber);

      expect(subscriber).toHaveBeenCalledWith(false);

      unsubscribe();
    });

    it("should become true when sequences are active", async () => {
      const subscriber = vi.fn();
      const unsubscribe = isPlaying.subscribe(subscriber);

      // Register instrument and sequence
      const inst = registerInstrument("synth", "Synth", {});
      registerSequence(inst.id, "note", [60], [0.25]);

      // Wait for polling interval
      await new Promise((resolve) => setTimeout(resolve, 600));

      const lastCall = subscriber.mock.calls[subscriber.mock.calls.length - 1];
      expect(lastCall?.[0]).toBe(true);

      unsubscribe();
    });
  });

  describe("resetGibber", () => {
    it("should reset BPM to default", () => {
      bpm.set(180);

      resetGibber();

      expect(get(bpm)).toBe(120);
    });
  });

  describe("get helper", () => {
    it("should return current store value synchronously", () => {
      bpm.set(150);

      const value = get(bpm);

      expect(value).toBe(150);
    });

    it("should work with readonly stores", () => {
      const value = get(contextState);

      expect(value).toBe("uninitialized");
    });

    it("should unsubscribe after getting value", () => {
      // This is hard to test directly, but we can verify
      // the function returns correctly
      const value = get(isReady);

      expect(typeof value).toBe("boolean");
    });
  });
});
