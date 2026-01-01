/**
 * Reactive state management for Gibber context.
 *
 * Provides Svelte-compatible stores for tracking the Gibber runtime state,
 * including initialization status, active instruments, and composition state.
 *
 * @module gibber/state
 */

import type {
  GibberContextState,
  GibberError,
  ActiveInstrument,
  ActiveSequence,
  CompositionSnapshot,
} from "./types";
import {
  getContextState,
  getContextError,
  getBpm,
  setBpm as setContextBpm,
  getActiveInstruments,
  getActiveSequences,
  subscribeToStateChanges,
  initializeContext as initContext,
  resetContext as resetCtx,
  getCompositionSnapshot,
} from "./context";

/**
 * Subscriber function type for stores.
 */
type Subscriber<T> = (value: T) => void;

/**
 * Unsubscribe function returned by subscribe.
 */
type Unsubscriber = () => void;

/**
 * Standard Svelte store interface.
 */
export interface Readable<T> {
  subscribe(subscriber: Subscriber<T>): Unsubscriber;
}

/**
 * Writable store interface with set and update.
 */
export interface Writable<T> extends Readable<T> {
  set(value: T): void;
  update(updater: (value: T) => T): void;
}

/**
 * Creates a simple readable store.
 */
const createReadable = <T>(
  initialValue: T,
  start?: (set: (value: T) => void) => Unsubscriber | undefined
): Readable<T> => {
  let value = initialValue;
  const subscribers = new Set<Subscriber<T>>();

  const set = (newValue: T): void => {
    value = newValue;
    for (const subscriber of subscribers) {
      subscriber(value);
    }
  };

  return {
    subscribe(subscriber: Subscriber<T>): Unsubscriber {
      subscribers.add(subscriber);
      subscriber(value);

      // Start the store if this is the first subscriber
      let stopFn: Unsubscriber | undefined;
      if (subscribers.size === 1 && start) {
        stopFn = start(set);
      }

      return () => {
        subscribers.delete(subscriber);
        // Stop the store if no more subscribers
        if (subscribers.size === 0 && stopFn) {
          stopFn();
        }
      };
    },
  };
};

/**
 * Creates a simple writable store.
 */
const createWritable = <T>(initialValue: T): Writable<T> => {
  let value = initialValue;
  const subscribers = new Set<Subscriber<T>>();

  const set = (newValue: T): void => {
    value = newValue;
    for (const subscriber of subscribers) {
      subscriber(value);
    }
  };

  return {
    subscribe(subscriber: Subscriber<T>): Unsubscriber {
      subscribers.add(subscriber);
      subscriber(value);

      return () => {
        subscribers.delete(subscriber);
      };
    },

    set,

    update(updater: (value: T) => T): void {
      set(updater(value));
    },
  };
};

/**
 * Store for the Gibber context state.
 *
 * Tracks whether Gibber is uninitialized, initializing, ready, or in error state.
 *
 * @example
 * ```svelte
 * <script>
 *   import { contextState } from '$lib/gibber/state';
 * </script>
 *
 * {#if $contextState === 'ready'}
 *   <p>Gibber is ready!</p>
 * {:else if $contextState === 'initializing'}
 *   <p>Loading...</p>
 * {/if}
 * ```
 */
export const contextState: Readable<GibberContextState> = createReadable(
  getContextState(),
  (set) => {
    // Subscribe to context state changes
    const unsubscribe = subscribeToStateChanges((state) => {
      set(state);
    });

    return unsubscribe;
  }
);

/**
 * Store for the last context error, if any.
 */
export const contextError: Readable<GibberError | null> = createReadable(
  getContextError(),
  (set) => {
    // Update when context state changes
    const unsubscribe = subscribeToStateChanges(() => {
      set(getContextError());
    });

    return unsubscribe;
  }
);

/**
 * Store for whether the context is ready.
 *
 * A derived convenience store.
 */
export const isReady: Readable<boolean> = createReadable(getContextState() === "ready", (set) => {
  const unsubscribe = subscribeToStateChanges((state) => {
    set(state === "ready");
  });

  return unsubscribe;
});

/**
 * Writable store for the current BPM.
 *
 * Setting this store also updates the Gibber context.
 */
const bpmStore = createWritable(getBpm());

export const bpm: Writable<number> = {
  subscribe: bpmStore.subscribe,

  set(value: number): void {
    setContextBpm(value);
    bpmStore.set(value);
  },

  update(updater: (value: number) => number): void {
    const newValue = updater(getBpm());
    setContextBpm(newValue);
    bpmStore.set(newValue);
  },
};

/**
 * Store for the list of active instruments.
 */
export const activeInstruments: Readable<readonly ActiveInstrument[]> = createReadable(
  getActiveInstruments(),
  (set) => {
    // Poll for changes (instruments don't have event-based updates)
    const interval = setInterval(() => {
      set(getActiveInstruments());
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }
);

/**
 * Store for the list of active sequences.
 */
export const activeSequences: Readable<readonly ActiveSequence[]> = createReadable(
  getActiveSequences(),
  (set) => {
    // Poll for changes
    const interval = setInterval(() => {
      set(getActiveSequences());
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }
);

/**
 * Store for the complete composition snapshot.
 */
export const compositionSnapshot: Readable<CompositionSnapshot> = createReadable(
  getCompositionSnapshot(),
  (set) => {
    // Poll for changes
    const interval = setInterval(() => {
      set(getCompositionSnapshot());
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }
);

/**
 * Store for whether any audio is currently playing.
 */
export const isPlaying: Readable<boolean> = createReadable(false, (set) => {
  // Poll for changes based on active sequences
  const interval = setInterval(() => {
    const sequences = getActiveSequences();
    const playing = sequences.some((seq) => seq.isPlaying);
    set(playing);
  }, 500);

  return () => {
    clearInterval(interval);
  };
});

/**
 * Initializes the Gibber context (convenience wrapper).
 *
 * This must be called after a user gesture.
 *
 * @returns Promise that resolves when Gibber is ready
 */
export const initializeGibber = async (): Promise<void> => {
  await initContext();
};

/**
 * Resets the Gibber context (convenience wrapper).
 *
 * Stops all sounds and clears composition state.
 */
export const resetGibber = (): void => {
  resetCtx();
  bpmStore.set(getBpm());
};

/**
 * Gets the current value of a store synchronously.
 *
 * Useful for one-off reads without subscribing.
 *
 * @param store - The store to read
 * @returns Current value of the store
 */
export const get = <T>(store: Readable<T>): T => {
  let value: T;
  const unsubscribe = store.subscribe((v) => {
    value = v;
  });
  unsubscribe();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return value!;
};
