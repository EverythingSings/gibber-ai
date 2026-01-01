/**
 * Gibber audio library integration.
 *
 * This module provides a TypeScript wrapper around gibber.audio.lib,
 * including context management, safe code execution, and reactive state.
 *
 * @module gibber
 *
 * @example
 * ```typescript
 * import {
 *   initializeContext,
 *   executeCode,
 *   contextState,
 *   bpm
 * } from '$lib/gibber';
 *
 * // Initialize on user gesture
 * button.onclick = async () => {
 *   await initializeContext();
 *
 *   // Execute AI-generated code
 *   const result = await executeCode(`
 *     const synth = Synth();
 *     synth.note.seq([60, 62, 64], 1/4);
 *   `);
 *
 *   if (result.success) {
 *     console.log('Playing!');
 *   }
 * };
 * ```
 */

// Re-export types
export type {
  // Waveforms and enums
  Waveform,
  FilterType,
  FilterMode,
  EnvelopeShape,
  TremoloShape,

  // Sequencable interfaces
  SequencableProperty,
  SequencableMethod,

  // Base interfaces
  UGen,
  EffectsChain,
  InstrumentBase,
  EnvelopeProperties,
  FilterProperties,
  GlideProperty,

  // Instrument options
  SynthOptions,
  FMOptions,
  MonosynthOptions,
  PluckOptions,
  KickOptions,
  SnareOptions,
  HatOptions,
  ClapOptions,
  CowbellOptions,
  SamplerOptions,

  // Instruments
  Synth,
  FM,
  Monosynth,
  Pluck,
  Kick,
  Snare,
  Hat,
  Clap,
  Cowbell,
  Sampler,
  Drums,
  EDrums,

  // Effect options
  DelayOptions,
  ReverbOptions,
  BitCrusherOptions,
  DistortionOptions,
  FlangerOptions,
  VibratoOptions,
  TremoloOptions,
  WavefolderOptions,

  // Effects
  Effect,
  Delay,
  Reverb,
  BitCrusher,
  Distortion,
  Flanger,
  Vibrato,
  Tremolo,
  Wavefolder,

  // Configuration
  SeqConfig,
  GibberInitOptions,
  GibberNamespace,

  // State types
  GibberContextState,
  GibberError,
  GibberErrorCode,
  ExecutionResult,
  ActiveInstrument,
  ActiveSequence,
  CompositionSnapshot,
} from "./types";

// Re-export type guards and factories
export { isGibberError, createGibberError } from "./types";

// Re-export context management functions
export {
  initializeContext,
  resetContext,
  destroyContext,
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
  stopAllSounds,
} from "./context";

// Re-export executor functions
export type { ExecutionOptions, ValidationResult, ValidationIssue } from "./executor";

export { executeCode, executeCodeSequence, validateCode, isCodeSafe } from "./executor";

// Re-export stores and store utilities
export type { Readable, Writable } from "./state";

export {
  contextState,
  contextError,
  isReady,
  bpm,
  activeInstruments,
  activeSequences,
  compositionSnapshot,
  isPlaying,
  initializeGibber,
  resetGibber,
  get,
} from "./state";
