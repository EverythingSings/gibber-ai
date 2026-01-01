/**
 * Type declarations for the gibber.audio.lib module.
 *
 * This module doesn't ship with TypeScript types, so we declare it here
 * to satisfy the TypeScript compiler. The actual types are defined in
 * our types.ts file and used at runtime.
 */

declare module "gibber.audio.lib" {
  /**
   * The main Gibber namespace exported by the library.
   */
  const Gibber: {
    /**
     * Initialize the audio context.
     * Must be called after a user gesture.
     */
    init(options?: { workletPath?: string }): Promise<void>;

    /** Clear all sounds and sequences. */
    clear(): void;

    /** Sequencer configuration. */
    Seq: {
      bpm: number;
    };

    /** Synth constructor. */
    Synth: (options?: unknown) => unknown;

    /** FM synth constructor. */
    FM: (options?: unknown) => unknown;

    /** Monosynth constructor. */
    Monosynth: (options?: unknown) => unknown;

    /** Pluck constructor. */
    Pluck: (options?: unknown) => unknown;

    /** Kick drum constructor. */
    Kick: (options?: unknown) => unknown;

    /** Snare drum constructor. */
    Snare: (options?: unknown) => unknown;

    /** Hi-hat constructor. */
    Hat: (options?: unknown) => unknown;

    /** Clap constructor. */
    Clap: (options?: unknown) => unknown;

    /** Cowbell constructor. */
    Cowbell: (options?: unknown) => unknown;

    /** Sample-based drums constructor. */
    Drums: (options?: unknown) => unknown;

    /** Electronic drums constructor. */
    EDrums: () => unknown;

    /** Delay effect constructor. */
    Delay: (time?: number | unknown, feedback?: number) => unknown;

    /** Reverb effect constructor. */
    Reverb: (roomSize?: number | unknown) => unknown;

    /** BitCrusher effect constructor. */
    BitCrusher: (options?: unknown) => unknown;

    /** Distortion effect constructor. */
    Distortion: (options?: unknown) => unknown;

    /** Flanger effect constructor. */
    Flanger: (options?: unknown) => unknown;

    /** Vibrato effect constructor. */
    Vibrato: (options?: unknown) => unknown;

    /** Tremolo effect constructor. */
    Tremolo: (options?: unknown) => unknown;

    /** Wavefolder effect constructor. */
    Wavefolder: (options?: unknown) => unknown;
  };

  export default Gibber;
}
