/**
 * Safe code executor for AI-generated Gibber code.
 *
 * This module provides a sandboxed execution environment for running
 * Gibber code with timeout protection, error handling, and validation.
 * It's designed to safely execute code from AI responses.
 *
 * @module gibber/executor
 */

import type { ExecutionResult, GibberError, GibberNamespace } from "./types";
import { createGibberError, isGibberError } from "./types";
import { getGibber, isContextReady, registerInstrument, registerSequence } from "./context";

/**
 * Default execution timeout in milliseconds.
 */
const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Maximum allowed execution timeout.
 */
const MAX_TIMEOUT_MS = 30000;

/**
 * Patterns that may indicate dangerous code.
 */
const DANGEROUS_PATTERNS: readonly RegExp[] = [
  /while\s*\(\s*true\s*\)/, // Infinite while loops
  /for\s*\(\s*;\s*;\s*\)/, // Infinite for loops
  /eval\s*\(/, // eval usage
  /Function\s*\(/, // Function constructor
  /\.gain\s*=\s*(\d{2,}|[2-9]\d*)/, // Very high gain values (>= 10)
  /\.gain\.value\s*=\s*(\d{2,}|[2-9]\d*)/, // Very high gain values
  /import\s*\(/, // Dynamic imports
  /require\s*\(/, // CommonJS require
  /process\./, // Node.js process
  /window\.location/, // Location manipulation
  /document\.cookie/, // Cookie access
  /localStorage/, // Storage access
  /sessionStorage/, // Storage access
  /XMLHttpRequest/, // Network requests
  /fetch\s*\(/, // Fetch API
];

/**
 * Patterns that suggest the code is meant for Gibber.
 */
const GIBBER_PATTERNS: readonly RegExp[] = [
  /Synth\s*\(/, // Synth creation
  /FM\s*\(/, // FM synth creation
  /Monosynth\s*\(/, // Monosynth creation
  /Pluck\s*\(/, // Pluck instrument
  /Kick\s*\(/, // Kick drum
  /Snare\s*\(/, // Snare drum
  /Hat\s*\(/, // Hi-hat
  /Drums\s*\(/, // Drum kit
  /EDrums\s*\(/, // Electronic drums
  /Delay\s*\(/, // Delay effect
  /Reverb\s*\(/, // Reverb effect
  /\.seq\s*\(/, // Sequencing
  /\.tidal\s*\(/, // Tidal sequencing
  /\.note\s*\(/, // Note playing
  /\.trigger\s*\(/, // Triggering
  /\.chord\s*\(/, // Chord playing
  /Gibber\./, // Direct Gibber access
];

/**
 * Options for code execution.
 */
export interface ExecutionOptions {
  /** Timeout in milliseconds (default: 5000) */
  readonly timeout?: number;

  /** Whether to validate code before execution (default: true) */
  readonly validate?: boolean;

  /** Whether to track created instruments (default: true) */
  readonly trackInstruments?: boolean;
}

/**
 * Result of code validation.
 */
export interface ValidationResult {
  /** Whether the code is valid */
  readonly isValid: boolean;

  /** Validation errors/warnings */
  readonly issues: readonly ValidationIssue[];
}

/**
 * A single validation issue.
 */
export interface ValidationIssue {
  /** Severity of the issue */
  readonly severity: "error" | "warning";

  /** Description of the issue */
  readonly message: string;

  /** Line number where the issue was found, if applicable */
  readonly line?: number;
}

/**
 * Validates Gibber code for potential issues.
 *
 * Checks for dangerous patterns, syntax errors, and ensures the code
 * appears to be valid Gibber code.
 *
 * @param code - The code to validate
 * @returns Validation result with any issues found
 *
 * @example
 * ```typescript
 * const result = validateCode("const s = Synth(); s.note(60);");
 * if (!result.isValid) {
 *   console.error("Invalid code:", result.issues);
 * }
 * ```
 */
export const validateCode = (code: string): ValidationResult => {
  const issues: ValidationIssue[] = [];

  // Check for empty code
  if (code.trim().length === 0) {
    issues.push({
      severity: "error",
      message: "Code is empty",
    });
    return { isValid: false, issues };
  }

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(code)) {
      issues.push({
        severity: "error",
        message: `Code contains potentially dangerous pattern: ${pattern.source}`,
      });
    }
  }

  // Check if code looks like Gibber code (warning only)
  const hasGibberPattern = GIBBER_PATTERNS.some((pattern) => pattern.test(code));
  if (!hasGibberPattern) {
    issues.push({
      severity: "warning",
      message: "Code does not appear to contain Gibber-specific constructs",
    });
  }

  // Try to detect basic syntax errors
  try {
    // Use Function constructor to check syntax without executing
    new Function(code);
  } catch (err) {
    if (err instanceof SyntaxError) {
      issues.push({
        severity: "error",
        message: `Syntax error: ${err.message}`,
      });
    }
  }

  // Code is invalid if there are any errors
  const hasErrors = issues.some((issue) => issue.severity === "error");

  return {
    isValid: !hasErrors,
    issues,
  };
};

/**
 * Extracts variable declarations from code to track created instruments.
 *
 * @param code - The code to analyze
 * @returns Map of variable names to their instrument types
 */
const extractInstrumentDeclarations = (code: string): Map<string, string> => {
  const declarations = new Map<string, string>();

  // Match patterns like: const synth = Synth(...)
  const patterns = [
    /(?:const|let|var)\s+(\w+)\s*=\s*(Synth|FM|Monosynth|Pluck|Kick|Snare|Hat|Clap|Cowbell|Drums|EDrums)\s*\(/g,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(code)) !== null) {
      const varName = match[1];
      const instType = match[2];
      if (varName !== undefined && instType !== undefined) {
        declarations.set(varName, instType);
      }
    }
  }

  return declarations;
};

/**
 * Extracts sequence declarations from code for tracking.
 *
 * @param code - The code to analyze
 * @returns Array of sequence info (variable name, target property)
 */
const extractSequenceDeclarations = (
  code: string
): readonly { varName: string; target: string }[] => {
  const sequences: { varName: string; target: string }[] = [];

  // Match patterns like: synth.note.seq([...], ...) or synth.cutoff.seq(...)
  const pattern = /(\w+)\.(\w+)\.seq\s*\(/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(code)) !== null) {
    const varName = match[1];
    const target = match[2];
    if (varName !== undefined && target !== undefined) {
      sequences.push({ varName, target });
    }
  }

  return sequences;
};

/**
 * Creates the execution context with Gibber globals exposed.
 *
 * @param gibber - The Gibber namespace
 * @returns Object containing all Gibber constructors and utilities
 */
const createExecutionContext = (gibber: GibberNamespace): Record<string, unknown> => ({
  // Instruments
  Synth: gibber.Synth.bind(gibber),
  FM: gibber.FM.bind(gibber),
  Monosynth: gibber.Monosynth.bind(gibber),
  Pluck: gibber.Pluck.bind(gibber),
  Kick: gibber.Kick.bind(gibber),
  Snare: gibber.Snare.bind(gibber),
  Hat: gibber.Hat.bind(gibber),
  Clap: gibber.Clap.bind(gibber),
  Cowbell: gibber.Cowbell.bind(gibber),
  Drums: gibber.Drums.bind(gibber),
  EDrums: gibber.EDrums.bind(gibber),

  // Effects
  Delay: gibber.Delay.bind(gibber),
  Reverb: gibber.Reverb.bind(gibber),
  BitCrusher: gibber.BitCrusher.bind(gibber),
  Distortion: gibber.Distortion.bind(gibber),
  Flanger: gibber.Flanger.bind(gibber),
  Vibrato: gibber.Vibrato.bind(gibber),
  Tremolo: gibber.Tremolo.bind(gibber),
  Wavefolder: gibber.Wavefolder.bind(gibber),

  // Utilities
  Gibber: gibber,
});

/**
 * Executes Gibber code with timeout protection.
 *
 * @param code - The code to execute
 * @param context - Execution context with Gibber globals
 * @param timeoutMs - Maximum execution time
 * @returns Promise resolving to the execution result
 */
const executeWithTimeout = async (
  code: string,
  context: Record<string, unknown>,
  timeoutMs: number
): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(createGibberError("TIMEOUT", `Code execution timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    try {
      // Create function with context variables as parameters
      const contextKeys = Object.keys(context);
      const contextValues = Object.values(context);

      // Build the function that will execute the code
      const executor = new Function(...contextKeys, `"use strict";\n${code}`);

      // Execute and capture result
      const result = executor(...contextValues);

      clearTimeout(timeoutId);
      resolve(result);
    } catch (err) {
      clearTimeout(timeoutId);
      reject(err);
    }
  });
};

/**
 * Executes Gibber code safely with validation, timeout, and error handling.
 *
 * This is the main entry point for running AI-generated code. It validates
 * the code, executes it with timeout protection, and handles any errors.
 *
 * @param code - The Gibber code to execute
 * @param options - Execution options
 * @returns Promise resolving to the execution result
 *
 * @example
 * ```typescript
 * const result = await executeCode(`
 *   const synth = Synth({ attack: 0.1 });
 *   synth.note.seq([60, 62, 64], 1/4);
 * `);
 *
 * if (result.success) {
 *   console.log("Code executed successfully");
 * } else {
 *   console.error("Execution failed:", result.error);
 * }
 * ```
 */
export const executeCode = async (
  code: string,
  options: ExecutionOptions = {}
): Promise<ExecutionResult> => {
  const startTime = Date.now();
  const timeout = Math.min(options.timeout ?? DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS);
  const shouldValidate = options.validate ?? true;
  const shouldTrack = options.trackInstruments ?? true;

  // Check if Gibber is initialized
  if (!isContextReady()) {
    return {
      success: false,
      error: createGibberError(
        "EXECUTION_ERROR",
        "Gibber context is not initialized. Call initializeContext() first."
      ),
      duration: Date.now() - startTime,
    };
  }

  const gibber = getGibber();
  if (gibber === null) {
    return {
      success: false,
      error: createGibberError("EXECUTION_ERROR", "Gibber instance not available"),
      duration: Date.now() - startTime,
    };
  }

  // Validate code if requested
  if (shouldValidate) {
    const validation = validateCode(code);
    if (!validation.isValid) {
      const errorMessages = validation.issues
        .filter((i) => i.severity === "error")
        .map((i) => i.message)
        .join("; ");

      return {
        success: false,
        error: createGibberError("INVALID_CODE", errorMessages),
        duration: Date.now() - startTime,
      };
    }
  }

  // Extract declarations for tracking (before execution)
  const instrumentDeclarations = shouldTrack ? extractInstrumentDeclarations(code) : new Map();
  const sequenceDeclarations = shouldTrack ? extractSequenceDeclarations(code) : [];

  // Create execution context
  const context = createExecutionContext(gibber);

  try {
    // Execute with timeout
    const value = await executeWithTimeout(code, context, timeout);

    // Register tracked instruments
    if (shouldTrack) {
      for (const [name, type] of instrumentDeclarations) {
        registerInstrument(name, type, null); // Instance tracking happens separately
      }

      for (const seq of sequenceDeclarations) {
        // Find the instrument ID by name
        registerSequence(seq.varName, seq.target, [], []);
      }
    }

    return {
      success: true,
      value,
      duration: Date.now() - startTime,
    };
  } catch (err) {
    // Convert error to GibberError
    let error: GibberError;

    if (isGibberError(err)) {
      error = err;
    } else if (err instanceof Error) {
      error = createGibberError("EXECUTION_ERROR", err.message, err);
    } else {
      error = createGibberError("EXECUTION_ERROR", String(err));
    }

    return {
      success: false,
      error,
      duration: Date.now() - startTime,
    };
  }
};

/**
 * Executes multiple code snippets in sequence.
 *
 * Useful for executing multi-step compositions where later snippets
 * depend on earlier ones.
 *
 * @param codeSnippets - Array of code strings to execute in order
 * @param options - Execution options (applied to each snippet)
 * @returns Promise resolving to array of execution results
 */
export const executeCodeSequence = async (
  codeSnippets: readonly string[],
  options: ExecutionOptions = {}
): Promise<readonly ExecutionResult[]> => {
  const results: ExecutionResult[] = [];

  for (const code of codeSnippets) {
    const result = await executeCode(code, options);
    results.push(result);

    // Stop on first error
    if (!result.success) {
      break;
    }
  }

  return results;
};

/**
 * Checks if code is safe to execute (validation only, no execution).
 *
 * @param code - The code to check
 * @returns True if code passes validation
 */
export const isCodeSafe = (code: string): boolean => {
  const result = validateCode(code);
  return result.isValid;
};
