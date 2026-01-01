/**
 * AI chat integration module for Gibber.
 *
 * This module provides the AI conversation layer using OpenRouter
 * for AI-assisted music composition.
 *
 * @module ai
 *
 * @example
 * ```typescript
 * import {
 *   createAIClient,
 *   createSession,
 *   addMessage,
 *   parseResponse
 * } from '$lib/ai';
 *
 * // Create client and session
 * const client = createAIClient({ apiKey });
 * let session = createSession({
 *   systemPrompt: createSystemPrompt(compositionState)
 * });
 *
 * // Add user message
 * session = addMessage(session, "user", "Create a synth pad");
 *
 * // Get AI response
 * const response = await client.send(session);
 * const content = response.choices[0].message.content;
 *
 * // Add assistant response to session
 * session = addMessage(session, "assistant", content);
 *
 * // Parse code blocks from response
 * const parsed = parseResponse(content);
 * for (const block of parsed.codeBlocks) {
 *   // Execute block.code in Gibber
 * }
 * ```
 */

// Re-export types
export type {
  ModelTier,
  MessageRole,
  Message,
  AIClientConfig,
  ChatCompletionRequest,
  ChatCompletionChoice,
  ChatCompletionResponse,
  TokenUsage,
  CodeBlock,
  ParsedResponse,
  AIError,
  AIErrorCode,
  ChatSession,
  CreateSessionOptions,
  StreamChunk,
  StreamCallback,
} from "./types";

export { MODEL_IDS, isAIError } from "./types";

// Re-export client functions
export type { AIClient } from "./client";
export { createAIClient, sendChatCompletion, getModelId } from "./client";

// Re-export parser functions
export { parseResponse, extractCodeBlocks } from "./parser";

// Re-export session functions
export {
  createSession,
  addMessage,
  updateSystemPrompt,
  clearMessages,
  updateModelTier,
  getMessagesForAPI,
  getContextLength,
} from "./session";

// Re-export prompts
export type { CompositionState } from "./prompts";
export { GIBBER_API_REFERENCE, createCompositionContext, createSystemPrompt } from "./prompts";
