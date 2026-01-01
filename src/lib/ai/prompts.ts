/**
 * System prompt construction for AI composition assistance.
 *
 * This module builds context-aware system prompts that provide the AI
 * with knowledge about Gibber's API and the current composition state.
 *
 * @module ai/prompts
 */

/**
 * Reference documentation for Gibber's audio API.
 *
 * This is included in the system prompt to give the AI knowledge
 * of available instruments, effects, and patterns.
 */
export const GIBBER_API_REFERENCE = `
# Gibber Audio API Reference

## Synthesizers

### Synth(options?)
Basic subtractive synthesizer.
- Properties: attack, decay, sustain, release, cutoff, resonance, gain
- Methods: note(pitch, velocity?), chord(pitches), stop()

\`\`\`javascript
const s = Synth({ attack: 0.1, decay: 0.2 });
s.note(60); // Play middle C
\`\`\`

### FM(preset?)
FM synthesis with presets: 'bass', 'brass', 'glockenspiel', 'noise'.
- Properties: cmRatio, index, attack, decay, sustain, release
- Methods: note(pitch), chord(pitches), stop()

\`\`\`javascript
const bass = FM('bass');
bass.note(36);
\`\`\`

### Monosynth(options?)
Monophonic synthesizer with glide.
- Properties: glide, cutoff, resonance, filterType
- Methods: note(pitch), stop()

### Sampler(file, options?)
Sample playback.
- Properties: rate, start, end, loop
- Methods: trigger(), note(pitch)

## Effects

### Reverb(roomSize?)
Room reverb effect.
- Properties: roomSize, damping, wet

### Delay(time?, feedback?)
Delay effect.
- Properties: time, feedback, wet

### Filter(options?)
Multimode filter.
- Properties: cutoff, resonance, type ('lowpass', 'highpass', 'bandpass')

### Distortion(amount?)
Distortion effect.
- Properties: amount, wet

### Chain: instrument.fx.add(effect1, effect2, ...)

\`\`\`javascript
const s = Synth();
s.fx.add(Reverb(0.8), Delay(1/4, 0.5));
\`\`\`

## Sequencing

### Seq(values, timing, options?)
Creates a sequence that repeatedly outputs values.
- values: Array of values to sequence
- timing: Duration in beats (1 = quarter note, 1/4 = sixteenth)

\`\`\`javascript
// Sequence notes every eighth note
const melody = Seq([60, 62, 64, 65], 1/8);
synth.note.seq(melody);
\`\`\`

### Property Sequencing
Any property can be sequenced using .seq():

\`\`\`javascript
synth.note.seq([60, 64, 67], 1/4);
synth.cutoff.seq([0.2, 0.5, 0.8], 1);
\`\`\`

### Pattern Transformations
- .reverse() - Reverse the pattern
- .rotate(n) - Rotate by n positions
- .scale(factor) - Scale values by factor
- .shuffle() - Randomize order

\`\`\`javascript
synth.note.seq([60, 62, 64].reverse(), 1/4);
\`\`\`

## Global Controls

### Gibber.Seq.bpm
Set the global tempo in beats per minute.

\`\`\`javascript
Gibber.Seq.bpm = 120;
\`\`\`

### Gibber.clear()
Stop all sounds and clear all sequences.

## Common Patterns

### Chord Progressions
\`\`\`javascript
synth.chord.seq([[60, 64, 67], [62, 65, 69]], 2);
\`\`\`

### Drum Pattern
\`\`\`javascript
kick.trigger.seq([1, 0, 0, 0, 1, 0, 0, 0], 1/8);
snare.trigger.seq([0, 0, 1, 0, 0, 0, 1, 0], 1/8);
\`\`\`

### Arpeggio
\`\`\`javascript
synth.note.seq([60, 64, 67, 72].rotate(0), 1/16);
\`\`\`
`.trim();

/**
 * State of the current composition for context.
 */
export interface CompositionState {
  /** Current tempo in BPM */
  readonly bpm: number;
  /** Musical key */
  readonly key: string;
  /** Musical scale */
  readonly scale: string;
  /** Names of currently active instruments */
  readonly activeInstruments: readonly string[];
  /** Names of currently active patterns */
  readonly activePatterns: readonly string[];
  /** Optional genre hint */
  readonly genre?: string;
  /** Optional mood hint */
  readonly mood?: string;
}

/**
 * Creates a human-readable description of the current composition state.
 *
 * @param state - Current composition state
 * @returns Formatted string describing the composition context
 */
export const createCompositionContext = (state: CompositionState): string => {
  const lines: string[] = [
    "## Current Composition State",
    "",
    `- BPM: ${state.bpm}`,
    `- Key: ${state.key}`,
    `- Scale: ${state.scale}`,
  ];

  if (state.genre) {
    lines.push(`- Genre: ${state.genre}`);
  }

  if (state.mood) {
    lines.push(`- Mood: ${state.mood}`);
  }

  lines.push("");

  if (state.activeInstruments.length > 0) {
    lines.push(`### Active Instruments`);
    lines.push(state.activeInstruments.map((i) => `- ${i}`).join("\n"));
  } else {
    lines.push("### Active Instruments");
    lines.push("None currently active.");
  }

  lines.push("");

  if (state.activePatterns.length > 0) {
    lines.push(`### Active Patterns`);
    lines.push(state.activePatterns.map((p) => `- ${p}`).join("\n"));
  } else {
    lines.push("### Active Patterns");
    lines.push("None currently active.");
  }

  return lines.join("\n");
};

/**
 * Creates a complete system prompt for AI composition assistance.
 *
 * Combines role instructions, API reference, and current state
 * into a comprehensive prompt.
 *
 * @param state - Current composition state for context
 * @returns Complete system prompt string
 *
 * @example
 * ```typescript
 * const prompt = createSystemPrompt({
 *   bpm: 120,
 *   key: "C",
 *   scale: "minor",
 *   activeInstruments: ["synth1"],
 *   activePatterns: ["melody"]
 * });
 * ```
 */
export const createSystemPrompt = (state: CompositionState): string => {
  const roleInstructions = `
# Role

You are a creative music composition assistant specializing in Gibber, a live coding environment for audiovisual performance. You help users create electronic music by generating executable Gibber code.

## Guidelines

1. **Always use code blocks** for executable Gibber code. Use \`\`\`javascript or \`\`\`gibber fencing.

2. **Explain your code** briefly before or after the code block so users understand what's happening.

3. **Build incrementally** - start simple and add complexity based on user requests.

4. **Consider the current state** - check what instruments and patterns are already active to avoid conflicts.

5. **Be musical** - suggest musically interesting patterns, chord progressions, and sound designs.

6. **Stay safe** - avoid infinite loops, extremely high gain values, or code that could crash the audio context.

7. **Use variables** for instruments so users can reference them later.

## Code Structure

Good code structure example:
\`\`\`javascript
// Create a synth with reverb
const pad = Synth({ attack: 0.5, release: 2 });
pad.fx.add(Reverb(0.7));

// Play a chord progression
pad.chord.seq([[60, 64, 67], [62, 65, 69], [64, 67, 71], [65, 69, 72]], 2);
\`\`\`
`.trim();

  return [roleInstructions, "", GIBBER_API_REFERENCE, "", createCompositionContext(state)].join(
    "\n"
  );
};
