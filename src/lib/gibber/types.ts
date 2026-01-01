/**
 * TypeScript type definitions for the Gibber audio library.
 *
 * These types provide type safety for working with Gibber's audio synthesis,
 * sequencing, and effects system. Since gibber.audio.lib doesn't ship with
 * TypeScript definitions, we define them here based on the library's API.
 *
 * @module gibber/types
 */

/**
 * Waveform types supported by oscillators.
 */
export type Waveform = "saw" | "sine" | "triangle" | "square" | "pwm";

/**
 * Filter types available in instruments.
 *
 * 0 = no filter
 * 1 = Moog Ladder Filter
 * 2 = TB303-style diode filter
 * 3 = State variable filter
 * 4 = Biquad filter
 */
export type FilterType = 0 | 1 | 2 | 3 | 4;

/**
 * Filter modes.
 *
 * 0 = lowpass
 * 1 = highpass
 * 2 = bandpass
 */
export type FilterMode = 0 | 1 | 2;

/**
 * Envelope shape types.
 */
export type EnvelopeShape = "linear" | "exponential";

/**
 * Tremolo oscillator shape types.
 */
export type TremoloShape = "sine" | "square" | "saw";

/**
 * A sequencable property that supports .seq(), .tidal(), .fade(), etc.
 */
export interface SequencableProperty<T = number> {
  /** Current value of the property */
  readonly value: T;

  /**
   * Sequence values at specified timings.
   * @param values - Value(s) to sequence
   * @param timings - Duration(s) in beats (1 = quarter note, 1/4 = sixteenth)
   * @param seqId - Optional sequence ID for managing multiple sequences
   */
  seq(values: T | readonly T[], timings?: number | readonly number[], seqId?: number): void;

  /**
   * Use TidalCycles mini-notation for sequencing.
   * @param pattern - TidalCycles pattern string
   * @param tidalId - Optional tidal ID for managing multiple patterns
   */
  tidal(pattern: string, tidalId?: number): void;

  /**
   * Fade property between values over time.
   * @param start - Starting value (null = current value)
   * @param end - Ending value (null = current value)
   * @param time - Duration in measures
   */
  fade(start: T | null, end: T | null, time: number): void;

  /** Start all sequences controlling this property */
  start(): void;

  /** Stop all sequences controlling this property */
  stop(): void;

  /** All sequencer instances for this property */
  readonly sequencers: readonly unknown[];

  /** All tidal instances for this property */
  readonly tidals: readonly unknown[];
}

/**
 * A sequencable method (like note() or trigger()).
 */
export interface SequencableMethod<TArgs extends readonly unknown[] = readonly [number]> {
  /**
   * Invoke the method.
   */
  (...args: TArgs): void;

  /**
   * Sequence method calls at specified timings.
   * @param values - Value(s) to pass to the method
   * @param timings - Duration(s) in beats
   * @param seqId - Optional sequence ID
   */
  seq(
    values: TArgs[0] | readonly TArgs[0][],
    timings?: number | readonly number[],
    seqId?: number
  ): void;

  /**
   * Use TidalCycles mini-notation for sequencing method calls.
   * @param pattern - TidalCycles pattern string
   * @param tidalId - Optional tidal ID
   */
  tidal(pattern: string, tidalId?: number): void;

  /** Start all sequences controlling this method */
  start(): void;

  /** Stop all sequences controlling this method */
  stop(): void;

  /** All sequencer instances for this method */
  readonly sequencers: readonly unknown[];

  /** All tidal instances for this method */
  readonly tidals: readonly unknown[];
}

/**
 * Base unit generator that can connect to other audio nodes.
 */
export interface UGen {
  /**
   * Connect to another synthesis object.
   * If no target is provided, connects to main output.
   */
  connect(target?: UGen): void;

  /**
   * Disconnect from other synthesis objects.
   * If no target is provided, disconnects from all.
   */
  disconnect(target?: UGen): void;
}

/**
 * Effects chain manager for instruments.
 */
export interface EffectsChain {
  /**
   * Add one or more effects to the chain.
   */
  add(...effects: readonly Effect[]): void;

  /**
   * Remove an effect from the chain.
   */
  remove(effect: Effect): void;

  /**
   * Clear all effects from the chain.
   */
  clear(): void;
}

/**
 * Base properties shared by all instruments.
 */
export interface InstrumentBase extends UGen {
  /** Effects chain for this instrument */
  readonly fx: EffectsChain;

  /** Trigger a note using scale index */
  readonly note: SequencableMethod<readonly [number, number?]>;

  /** Trigger a note using loudness */
  readonly trigger: SequencableMethod<readonly [number]>;

  /** Frequency in Hz */
  readonly frequency: SequencableProperty<number>;

  /** Volume level (0-1) */
  readonly loudness: SequencableProperty<number>;

  /** Overall output gain (0-1) */
  readonly gain: SequencableProperty<number>;

  /** Pan position (0=left, 0.5=center, 1=right) */
  readonly pan: SequencableProperty<number>;

  /** Whether panning is enabled */
  panVoices: boolean;
}

/**
 * Envelope properties for synths.
 */
export interface EnvelopeProperties {
  /** Attack duration in measures */
  attack: number;

  /** Decay duration in measures */
  decay: number;

  /** Sustain duration in measures */
  sustain: number;

  /** Release duration in measures */
  release: number;

  /** Envelope shape */
  shape: EnvelopeShape;

  /** Use 4-stage ADSR (true) or 2-stage AD (false) */
  useADSR: boolean;
}

/**
 * Filter properties for synths.
 */
export interface FilterProperties {
  /** Filter cutoff (0-1) */
  readonly cutoff: SequencableProperty<number>;

  /** Filter resonance/Q */
  readonly Q: SequencableProperty<number>;

  /** Envelope to cutoff multiplier */
  readonly filterMult: SequencableProperty<number>;

  /** Filter type (0-4) */
  filterType: FilterType;

  /** Filter mode (lowpass/highpass/bandpass) */
  filterMode: FilterMode;

  /** Saturation amount for TB303 filter */
  readonly saturation: SequencableProperty<number>;
}

/**
 * Glide/portamento property.
 */
export interface GlideProperty {
  /** Glide amount (1 = no glide, higher = more glide) */
  readonly glide: SequencableProperty<number>;
}

/**
 * Synth instrument options.
 */
export interface SynthOptions {
  antialias?: boolean;
  waveform?: Waveform;
  attack?: number;
  decay?: number;
  sustain?: number;
  release?: number;
  shape?: EnvelopeShape;
  useADSR?: boolean;
  cutoff?: number;
  Q?: number;
  filterMult?: number;
  filterType?: FilterType;
  filterMode?: FilterMode;
  saturation?: number;
  gain?: number;
  pan?: number;
  panVoices?: boolean;
  glide?: number;
}

/**
 * Basic subtractive synthesizer.
 */
export interface Synth extends InstrumentBase, EnvelopeProperties, FilterProperties, GlideProperty {
  /** Enable anti-aliasing for oscillators */
  antialias: boolean;

  /** Oscillator waveform */
  waveform: Waveform;
}

/**
 * FM synthesis options.
 */
export interface FMOptions extends SynthOptions {
  cmRatio?: number;
  index?: number;
  feedback?: number;
  carrierWaveform?: Waveform;
  modulatorWaveform?: Waveform;
}

/**
 * FM synthesis instrument.
 */
export interface FM extends InstrumentBase, EnvelopeProperties, FilterProperties, GlideProperty {
  /** Enable anti-aliasing */
  antialias: boolean;

  /** Carrier to modulator frequency ratio */
  readonly cmRatio: SequencableProperty<number>;

  /** Modulation index */
  readonly index: SequencableProperty<number>;

  /** Feedback amount for modulator */
  readonly feedback: SequencableProperty<number>;

  /** Carrier oscillator waveform */
  carrierWaveform: Waveform;

  /** Modulator oscillator waveform */
  modulatorWaveform: Waveform;
}

/**
 * Monosynth options.
 */
export interface MonosynthOptions extends SynthOptions {
  detune2?: number;
  detune3?: number;
}

/**
 * Monophonic synthesizer with three detuned oscillators.
 */
export interface Monosynth
  extends InstrumentBase, EnvelopeProperties, FilterProperties, GlideProperty {
  /** Enable anti-aliasing */
  antialias: boolean;

  /** Oscillator waveform */
  waveform: Waveform;

  /** Detune amount for oscillator 2 */
  readonly detune2: SequencableProperty<number>;

  /** Detune amount for oscillator 3 */
  readonly detune3: SequencableProperty<number>;
}

/**
 * Pluck (Karplus-Strong) options.
 */
export interface PluckOptions {
  blend?: number;
  decay?: number;
  damping?: number;
  gain?: number;
  pan?: number;
  panVoices?: boolean;
  glide?: number;
}

/**
 * Physically modeled string (Karplus-Strong).
 */
export interface Pluck extends InstrumentBase, GlideProperty {
  /** Noise blend (0-1) */
  readonly blend: SequencableProperty<number>;

  /** Decay time (0-1) */
  readonly decay: SequencableProperty<number>;

  /** High frequency damping (0-1) */
  readonly damping: SequencableProperty<number>;
}

/**
 * Kick drum options.
 */
export interface KickOptions {
  decay?: number;
  frequency?: number;
  loudness?: number;
  tone?: number;
  gain?: number;
}

/**
 * TR-808 style kick drum.
 */
export interface Kick extends InstrumentBase {
  /** Decay time (0-1) */
  readonly decay: SequencableProperty<number>;

  /** High-frequency click amount (0-1) */
  readonly tone: SequencableProperty<number>;
}

/**
 * Snare drum options.
 */
export interface SnareOptions {
  tune?: number;
  decay?: number;
  snappy?: number;
  loudness?: number;
  gain?: number;
}

/**
 * TR-808 style snare drum.
 */
export interface Snare extends InstrumentBase {
  /** Pitch tuning (-4 to 4) */
  readonly tune: SequencableProperty<number>;

  /** Decay time (0-1) */
  readonly decay: SequencableProperty<number>;

  /** Noise amount (0-1) */
  readonly snappy: SequencableProperty<number>;
}

/**
 * Hi-hat options.
 */
export interface HatOptions {
  tune?: number;
  decay?: number;
  loudness?: number;
  gain?: number;
}

/**
 * TR-808 style hi-hat.
 */
export interface Hat extends InstrumentBase {
  /** Tuning (0-0.8) */
  readonly tune: SequencableProperty<number>;

  /** Decay time (0-1) */
  readonly decay: SequencableProperty<number>;
}

/**
 * Clap options.
 */
export interface ClapOptions {
  decay?: number;
  loudness?: number;
  spacing?: number;
  gain?: number;
}

/**
 * TR-808 style clap.
 */
export interface Clap extends InstrumentBase {
  /** Decay time (0-1) */
  readonly decay: SequencableProperty<number>;

  /** Spacing between noise bursts in Hz */
  readonly spacing: SequencableProperty<number>;
}

/**
 * Cowbell options.
 */
export interface CowbellOptions {
  decay?: number;
  loudness?: number;
  gain?: number;
}

/**
 * TR-808 style cowbell.
 */
export interface Cowbell extends InstrumentBase {
  /** Decay time (0-1) */
  readonly decay: SequencableProperty<number>;
}

/**
 * Sampler options.
 */
export interface SamplerOptions {
  rate?: number;
  start?: number;
  end?: number;
  loop?: boolean;
  gain?: number;
  pan?: number;
}

/**
 * Sample playback instrument.
 */
export interface Sampler extends InstrumentBase {
  /** Playback rate */
  readonly rate: SequencableProperty<number>;

  /** Sample start position (0-1) */
  readonly start: SequencableProperty<number>;

  /** Sample end position (0-1) */
  readonly end: SequencableProperty<number>;

  /** Whether to loop playback */
  loop: boolean;
}

/**
 * Sample-based drum kit.
 */
export interface Drums extends InstrumentBase {
  /** Global playback rate */
  readonly rate: SequencableProperty<number>;

  /** Global start position */
  readonly start: SequencableProperty<number>;

  /** Global end position */
  readonly end: SequencableProperty<number>;

  /** Kick drum sampler */
  readonly kick: Sampler;

  /** Snare drum sampler */
  readonly snare: Sampler;

  /** Closed hi-hat sampler */
  readonly closedHat: Sampler;

  /** Open hi-hat sampler */
  readonly openHat: Sampler;
}

/**
 * Electronic drum kit with synthesis.
 */
export interface EDrums extends InstrumentBase {
  /** Kick instrument */
  readonly kick: Kick;

  /** Snare instrument */
  readonly snare: Snare;

  /** Closed hi-hat */
  readonly closedHat: Hat;

  /** Open hi-hat */
  readonly openHat: Hat;

  /** Clap instrument */
  readonly clap: Clap;

  /** Cowbell instrument */
  readonly cowbell: Cowbell;
}

/**
 * Base effect interface.
 */
export interface Effect extends UGen {
  /** Input signal source */
  readonly input: UGen;
}

/**
 * Delay effect options.
 */
export interface DelayOptions {
  time?: number;
  feedback?: number;
  wet?: number;
}

/**
 * Feedback delay effect.
 */
export interface Delay extends Effect {
  /** Delay time in beats (e.g., 1/8) */
  readonly time: SequencableProperty<number>;

  /** Feedback amount (0-1, careful above 1) */
  readonly feedback: SequencableProperty<number>;

  /** Wet/dry mix */
  readonly wet: SequencableProperty<number>;
}

/**
 * Reverb effect options.
 */
export interface ReverbOptions {
  roomSize?: number;
  damping?: number;
  wet?: number;
  dry?: number;
  wet1?: number;
  wet2?: number;
}

/**
 * Freeverb reverb effect.
 */
export interface Reverb extends Effect {
  /** Room size (0-0.999) */
  readonly roomSize: SequencableProperty<number>;

  /** High frequency damping (0-1) */
  readonly damping: SequencableProperty<number>;

  /** Dry signal amount */
  readonly dry: SequencableProperty<number>;

  /** Left channel wet amount */
  readonly wet1: SequencableProperty<number>;

  /** Right channel wet amount */
  readonly wet2: SequencableProperty<number>;
}

/**
 * BitCrusher effect options.
 */
export interface BitCrusherOptions {
  bitDepth?: number;
  sampleRate?: number;
}

/**
 * Bit/sample rate reduction effect.
 */
export interface BitCrusher extends Effect {
  /** Bit depth (0.01-1, 1 = 16-bit) */
  readonly bitDepth: SequencableProperty<number>;

  /** Sample rate reduction (0-1) */
  readonly sampleRate: SequencableProperty<number>;
}

/**
 * Distortion effect options.
 */
export interface DistortionOptions {
  pregain?: number;
  postgain?: number;
}

/**
 * Waveshaping distortion effect.
 */
export interface Distortion extends Effect {
  /** Input gain/boost */
  readonly pregain: SequencableProperty<number>;

  /** Output gain */
  readonly postgain: SequencableProperty<number>;
}

/**
 * Flanger effect options.
 */
export interface FlangerOptions {
  feedback?: number;
  frequency?: number;
  offset?: number;
}

/**
 * Classic flanging effect.
 */
export interface Flanger extends Effect {
  /** Feedback amount (0-1) */
  readonly feedback: SequencableProperty<number>;

  /** LFO frequency */
  readonly frequency: SequencableProperty<number>;

  /** Delay offset */
  readonly offset: SequencableProperty<number>;
}

/**
 * Vibrato effect options.
 */
export interface VibratoOptions {
  feedback?: number;
  frequency?: number;
  amount?: number;
}

/**
 * Pitch modulation effect.
 */
export interface Vibrato extends Effect {
  /** Feedback amount */
  readonly feedback: SequencableProperty<number>;

  /** Modulation frequency */
  readonly frequency: SequencableProperty<number>;

  /** Vibrato depth */
  readonly amount: SequencableProperty<number>;
}

/**
 * Tremolo effect options.
 */
export interface TremoloOptions {
  frequency?: number;
  amount?: number;
  shape?: TremoloShape;
}

/**
 * Volume modulation effect.
 */
export interface Tremolo extends Effect {
  /** Modulation frequency */
  readonly frequency: SequencableProperty<number>;

  /** Tremolo depth */
  readonly amount: SequencableProperty<number>;

  /** LFO shape */
  shape: TremoloShape;
}

/**
 * Wavefolder effect options.
 */
export interface WavefolderOptions {
  gain?: number;
  postgain?: number;
}

/**
 * Wavefolding distortion effect.
 */
export interface Wavefolder extends Effect {
  /** Input gain */
  readonly gain: SequencableProperty<number>;

  /** Output gain */
  readonly postgain: SequencableProperty<number>;
}

/**
 * Gibber sequencer configuration.
 */
export interface SeqConfig {
  /** Tempo in beats per minute */
  bpm: number;
}

/**
 * Gibber initialization options.
 */
export interface GibberInitOptions {
  /** Path to the AudioWorklet processor file */
  workletPath?: string;
}

/**
 * Main Gibber namespace interface.
 */
export interface GibberNamespace {
  /** Initialize the audio context (requires user gesture) */
  init(options?: GibberInitOptions): Promise<void>;

  /** Clear all sounds and sequences */
  clear(): void;

  /** Sequencer configuration */
  Seq: SeqConfig;

  /** Create a Synth instrument */
  Synth(options?: SynthOptions | string): Synth;

  /** Create an FM instrument */
  FM(options?: FMOptions | string): FM;

  /** Create a Monosynth instrument */
  Monosynth(options?: MonosynthOptions | string): Monosynth;

  /** Create a Pluck instrument */
  Pluck(options?: PluckOptions | string): Pluck;

  /** Create a Kick drum */
  Kick(options?: KickOptions | string): Kick;

  /** Create a Snare drum */
  Snare(options?: SnareOptions | string): Snare;

  /** Create a Hi-hat */
  Hat(options?: HatOptions | string): Hat;

  /** Create a Clap */
  Clap(options?: ClapOptions | string): Clap;

  /** Create a Cowbell */
  Cowbell(options?: CowbellOptions | string): Cowbell;

  /** Create a sample-based drum kit */
  Drums(options?: SamplerOptions | string): Drums;

  /** Create an electronic drum kit */
  EDrums(): EDrums;

  /** Create a Delay effect */
  Delay(time?: number | DelayOptions, feedback?: number): Delay;

  /** Create a Reverb effect */
  Reverb(roomSize?: number | ReverbOptions): Reverb;

  /** Create a BitCrusher effect */
  BitCrusher(options?: BitCrusherOptions | string): BitCrusher;

  /** Create a Distortion effect */
  Distortion(options?: DistortionOptions | string): Distortion;

  /** Create a Flanger effect */
  Flanger(options?: FlangerOptions | string): Flanger;

  /** Create a Vibrato effect */
  Vibrato(options?: VibratoOptions | string): Vibrato;

  /** Create a Tremolo effect */
  Tremolo(options?: TremoloOptions | string): Tremolo;

  /** Create a Wavefolder effect */
  Wavefolder(options?: WavefolderOptions | string): Wavefolder;
}

/**
 * State of the Gibber runtime context.
 */
export type GibberContextState = "uninitialized" | "initializing" | "ready" | "error";

/**
 * Error that occurred during Gibber initialization or execution.
 */
export interface GibberError {
  /** Error code for programmatic handling */
  readonly code: GibberErrorCode;

  /** Human-readable error message */
  readonly message: string;

  /** Underlying error, if any */
  readonly cause?: Error;
}

/**
 * Error codes for Gibber operations.
 */
export type GibberErrorCode =
  | "INIT_FAILED"
  | "NO_USER_GESTURE"
  | "AUDIO_CONTEXT_ERROR"
  | "WORKLET_LOAD_ERROR"
  | "EXECUTION_ERROR"
  | "TIMEOUT"
  | "INVALID_CODE";

/**
 * Result of code execution.
 */
export interface ExecutionResult {
  /** Whether execution was successful */
  readonly success: boolean;

  /** Any value returned from the code */
  readonly value?: unknown;

  /** Error if execution failed */
  readonly error?: GibberError;

  /** Execution duration in milliseconds */
  readonly duration: number;
}

/**
 * Information about an active instrument in the composition.
 */
export interface ActiveInstrument {
  /** Unique identifier for this instrument instance */
  readonly id: string;

  /** User-assigned name (variable name from code) */
  readonly name: string;

  /** Type of instrument (e.g., "Synth", "FM", "Kick") */
  readonly type: string;

  /** Reference to the actual Gibber instrument */
  readonly instance: InstrumentBase;

  /** When this instrument was created */
  readonly createdAt: number;
}

/**
 * Information about an active sequence.
 */
export interface ActiveSequence {
  /** Unique identifier for this sequence */
  readonly id: string;

  /** Instrument this sequence is attached to */
  readonly instrumentId: string;

  /** Property or method being sequenced (e.g., "note", "cutoff") */
  readonly target: string;

  /** Sequence values */
  readonly values: readonly unknown[];

  /** Sequence timings */
  readonly timings: readonly number[];

  /** Whether the sequence is currently playing */
  readonly isPlaying: boolean;
}

/**
 * Complete state of the Gibber composition.
 */
export interface CompositionSnapshot {
  /** Current BPM */
  readonly bpm: number;

  /** All active instruments */
  readonly instruments: readonly ActiveInstrument[];

  /** All active sequences */
  readonly sequences: readonly ActiveSequence[];

  /** Whether any audio is currently playing */
  readonly isPlaying: boolean;

  /** Timestamp of this snapshot */
  readonly timestamp: number;
}

/**
 * Type guard to check if value is a GibberError.
 */
export const isGibberError = (value: unknown): value is GibberError => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return typeof obj["code"] === "string" && typeof obj["message"] === "string";
};

/**
 * Creates a GibberError with the given code and message.
 */
export const createGibberError = (
  code: GibberErrorCode,
  message: string,
  cause?: Error
): GibberError => ({
  code,
  message,
  cause,
});
