/**
 * Shared TypeScript type definitions for Gibber AI.
 *
 * This module exports all shared types used across the application.
 * Types are organized by domain and should be imported from here
 * rather than from individual modules.
 *
 * @module types
 */

/**
 * Result type for operations that can fail.
 * Follows the functional programming pattern of explicit error handling.
 */
export type Result<T, E = Error> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly error: E };

/**
 * Creates a successful result.
 *
 * @param value - The success value
 * @returns A success Result
 */
export const ok = <T>(value: T): Result<T, never> => ({
  success: true,
  value,
});

/**
 * Creates a failed result.
 *
 * @param error - The error value
 * @returns A failure Result
 */
export const err = <E>(error: E): Result<never, E> => ({
  success: false,
  error,
});

/**
 * Application-wide error types.
 */
export interface AppError {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
}
