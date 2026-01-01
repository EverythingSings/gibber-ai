/**
 * Gibber runtime context manager.
 *
 * Manages the lifecycle of the Gibber audio library, including initialization,
 * state tracking, and cleanup. Gibber requires a user gesture to initialize
 * the Web Audio API, so this module provides utilities to handle that requirement.
 *
 * @module gibber/context
 */

import type {
  GibberContextState,
  GibberError,
  GibberInitOptions,
  GibberNamespace,
  ActiveInstrument,
  ActiveSequence,
  CompositionSnapshot,
} from "./types";
import { createGibberError } from "./types";

/**
 * Default worklet path relative to node_modules.
 */
const DEFAULT_WORKLET_PATH = "node_modules/gibber.audio.lib/dist/gibberish_worklet.js";

/**
 * Default BPM for new compositions.
 */
const DEFAULT_BPM = 120;

/**
 * Internal state of the Gibber context.
 */
interface ContextState {
  /** Current initialization state */
  state: GibberContextState;

  /** Reference to the Gibber namespace once loaded */
  gibber: GibberNamespace | null;

  /** Error if initialization failed */
  error: GibberError | null;

  /** Current BPM */
  bpm: number;

  /** Active instruments tracked by ID */
  instruments: Map<string, ActiveInstrument>;

  /** Active sequences tracked by ID */
  sequences: Map<string, ActiveSequence>;

  /** Listeners for state changes */
  listeners: Set<(state: GibberContextState) => void>;
}

/**
 * Creates the initial context state.
 */
const createInitialState = (): ContextState => ({
  state: "uninitialized",
  gibber: null,
  error: null,
  bpm: DEFAULT_BPM,
  instruments: new Map(),
  sequences: new Map(),
  listeners: new Set(),
});

/**
 * Global context state (singleton pattern for audio context management).
 */
let contextState: ContextState = createInitialState();

/**
 * Generates a unique ID for tracking instruments and sequences.
 */
const generateId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
};

/**
 * Notifies all listeners of a state change.
 */
const notifyListeners = (newState: GibberContextState): void => {
  for (const listener of contextState.listeners) {
    try {
      listener(newState);
    } catch {
      // Ignore listener errors to prevent cascade failures
    }
  }
};

/**
 * Sets the context state and notifies listeners.
 */
const setState = (newState: GibberContextState): void => {
  contextState.state = newState;
  notifyListeners(newState);
};

/**
 * Gets the current state of the Gibber context.
 *
 * @returns Current initialization state
 */
export const getContextState = (): GibberContextState => contextState.state;

/**
 * Gets the last error that occurred, if any.
 *
 * @returns The error, or null if no error
 */
export const getContextError = (): GibberError | null => contextState.error;

/**
 * Checks if Gibber is ready for use.
 *
 * @returns True if Gibber is initialized and ready
 */
export const isContextReady = (): boolean => contextState.state === "ready";

/**
 * Gets the Gibber namespace if initialized.
 *
 * @returns The Gibber namespace, or null if not ready
 */
export const getGibber = (): GibberNamespace | null => contextState.gibber;

/**
 * Loads the Gibber library dynamically.
 *
 * This function handles the dynamic import of gibber.audio.lib,
 * which doesn't have TypeScript definitions.
 */
const loadGibberLibrary = async (): Promise<GibberNamespace> => {
  // Dynamic import of the Gibber library
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const module = (await import("gibber.audio.lib")) as any;

  // gibber.audio.lib exports the Gibber object as default
  const Gibber = module.default || module;

  return Gibber as GibberNamespace;
};

/**
 * Initializes the Gibber audio context.
 *
 * This must be called after a user gesture (click, tap, keypress) due to
 * Web Audio API security restrictions. The function is idempotent - calling
 * it multiple times will return the same result once initialized.
 *
 * @param options - Initialization options
 * @returns Promise that resolves when Gibber is ready
 * @throws GibberError if initialization fails
 *
 * @example
 * ```typescript
 * button.onclick = async () => {
 *   try {
 *     await initializeContext();
 *     console.log("Gibber is ready!");
 *   } catch (error) {
 *     console.error("Failed to initialize:", error);
 *   }
 * };
 * ```
 */
export const initializeContext = async (options: GibberInitOptions = {}): Promise<void> => {
  // Already initialized
  if (contextState.state === "ready" && contextState.gibber !== null) {
    return;
  }

  // Already initializing - wait for result
  if (contextState.state === "initializing") {
    return new Promise((resolve, reject) => {
      const unsubscribe = subscribeToStateChanges((state) => {
        if (state === "ready") {
          unsubscribe();
          resolve();
        } else if (state === "error") {
          unsubscribe();
          reject(contextState.error);
        }
      });
    });
  }

  setState("initializing");
  contextState.error = null;

  try {
    // Load the Gibber library
    const Gibber = await loadGibberLibrary();

    // Initialize with worklet path
    const workletPath = options.workletPath ?? DEFAULT_WORKLET_PATH;
    await Gibber.init({ workletPath });

    // Set default BPM
    Gibber.Seq.bpm = contextState.bpm;

    // Store reference
    contextState.gibber = Gibber;
    setState("ready");
  } catch (err) {
    const error = createGibberError(
      "INIT_FAILED",
      err instanceof Error ? err.message : "Failed to initialize Gibber",
      err instanceof Error ? err : undefined
    );
    contextState.error = error;
    setState("error");
    throw error;
  }
};

/**
 * Resets the Gibber context, stopping all sounds and clearing state.
 *
 * This does not uninitialize Gibber - the audio context remains active.
 * Use this to start fresh without requiring another user gesture.
 */
export const resetContext = (): void => {
  if (contextState.gibber !== null) {
    contextState.gibber.clear();
  }

  // Clear tracked instruments and sequences
  contextState.instruments.clear();
  contextState.sequences.clear();

  // Reset BPM to default
  contextState.bpm = DEFAULT_BPM;
  if (contextState.gibber !== null) {
    contextState.gibber.Seq.bpm = DEFAULT_BPM;
  }
};

/**
 * Completely destroys the context, requiring re-initialization.
 *
 * Use this when you want to fully clean up, such as when unmounting
 * the application or switching to a different audio system.
 */
export const destroyContext = (): void => {
  if (contextState.gibber !== null) {
    contextState.gibber.clear();
  }

  // Reset to initial state
  contextState = createInitialState();
};

/**
 * Gets the current BPM.
 *
 * @returns Current tempo in beats per minute
 */
export const getBpm = (): number => contextState.bpm;

/**
 * Sets the BPM for the composition.
 *
 * @param bpm - Tempo in beats per minute (typically 60-200)
 */
export const setBpm = (bpm: number): void => {
  contextState.bpm = bpm;
  if (contextState.gibber !== null) {
    contextState.gibber.Seq.bpm = bpm;
  }
};

/**
 * Registers an instrument with the context for tracking.
 *
 * @param name - User-assigned name for the instrument
 * @param type - Type of instrument (e.g., "Synth", "FM")
 * @param instance - The actual Gibber instrument instance
 * @returns The registered instrument info
 */
export const registerInstrument = (
  name: string,
  type: string,
  instance: unknown
): ActiveInstrument => {
  const instrument: ActiveInstrument = {
    id: generateId(),
    name,
    type,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    instance: instance as any,
    createdAt: Date.now(),
  };

  contextState.instruments.set(instrument.id, instrument);
  return instrument;
};

/**
 * Unregisters an instrument from the context.
 *
 * @param id - The instrument ID to remove
 */
export const unregisterInstrument = (id: string): void => {
  contextState.instruments.delete(id);

  // Also remove any sequences attached to this instrument
  for (const [seqId, seq] of contextState.sequences) {
    if (seq.instrumentId === id) {
      contextState.sequences.delete(seqId);
    }
  }
};

/**
 * Registers a sequence with the context for tracking.
 *
 * @param instrumentId - ID of the instrument this sequence is attached to
 * @param target - Property or method being sequenced
 * @param values - Sequence values
 * @param timings - Sequence timings
 * @returns The registered sequence info
 */
export const registerSequence = (
  instrumentId: string,
  target: string,
  values: readonly unknown[],
  timings: readonly number[]
): ActiveSequence => {
  const sequence: ActiveSequence = {
    id: generateId(),
    instrumentId,
    target,
    values,
    timings,
    isPlaying: true,
  };

  contextState.sequences.set(sequence.id, sequence);
  return sequence;
};

/**
 * Unregisters a sequence from the context.
 *
 * @param id - The sequence ID to remove
 */
export const unregisterSequence = (id: string): void => {
  contextState.sequences.delete(id);
};

/**
 * Gets a list of all active instruments.
 *
 * @returns Array of active instrument info
 */
export const getActiveInstruments = (): readonly ActiveInstrument[] => {
  return Array.from(contextState.instruments.values());
};

/**
 * Gets a list of all active sequences.
 *
 * @returns Array of active sequence info
 */
export const getActiveSequences = (): readonly ActiveSequence[] => {
  return Array.from(contextState.sequences.values());
};

/**
 * Creates a snapshot of the current composition state.
 *
 * Useful for saving/restoring state or displaying in the UI.
 *
 * @returns Complete composition state snapshot
 */
export const getCompositionSnapshot = (): CompositionSnapshot => ({
  bpm: contextState.bpm,
  instruments: getActiveInstruments(),
  sequences: getActiveSequences(),
  isPlaying: contextState.sequences.size > 0,
  timestamp: Date.now(),
});

/**
 * Subscribes to context state changes.
 *
 * @param listener - Function called when state changes
 * @returns Unsubscribe function
 *
 * @example
 * ```typescript
 * const unsubscribe = subscribeToStateChanges((state) => {
 *   console.log("Gibber state:", state);
 * });
 *
 * // Later, to stop listening:
 * unsubscribe();
 * ```
 */
export const subscribeToStateChanges = (
  listener: (state: GibberContextState) => void
): (() => void) => {
  contextState.listeners.add(listener);
  return () => {
    contextState.listeners.delete(listener);
  };
};

/**
 * Stops all currently playing sounds without clearing the composition.
 */
export const stopAllSounds = (): void => {
  if (contextState.gibber !== null) {
    contextState.gibber.clear();
  }

  // Mark all sequences as not playing
  for (const [id, seq] of contextState.sequences) {
    contextState.sequences.set(id, { ...seq, isPlaying: false });
  }
};
