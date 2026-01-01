/**
 * Session management for AI conversations.
 *
 * Provides immutable operations for managing chat session state,
 * including message history and context tracking.
 *
 * @module ai/session
 */

import type { ChatSession, CreateSessionOptions, Message, MessageRole, ModelTier } from "./types";

/**
 * Generates a unique session ID.
 *
 * @returns A unique identifier string
 */
const generateId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
};

/**
 * Creates a new chat session.
 *
 * @param options - Optional configuration for the session
 * @returns A new chat session with default values
 *
 * @example
 * ```typescript
 * const session = createSession({
 *   systemPrompt: "You are a music composition assistant.",
 *   modelTier: "standard"
 * });
 * ```
 */
export const createSession = (options: CreateSessionOptions = {}): ChatSession => {
  const now = Date.now();
  return {
    id: generateId(),
    messages: [],
    modelTier: options.modelTier ?? "standard",
    systemPrompt: options.systemPrompt ?? "",
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Adds a message to the session.
 *
 * Returns a new session with the message appended; does not mutate
 * the original session.
 *
 * @param session - The current session
 * @param role - The role of the message sender
 * @param content - The message content
 * @returns A new session with the message added
 *
 * @example
 * ```typescript
 * const updated = addMessage(session, "user", "Create a bassline");
 * ```
 */
export const addMessage = (
  session: ChatSession,
  role: MessageRole,
  content: string
): ChatSession => {
  const message: Message = {
    id: generateId(),
    role,
    content,
    timestamp: Date.now(),
  };

  return {
    ...session,
    messages: [...session.messages, message],
    updatedAt: Date.now(),
  };
};

/**
 * Updates the system prompt for the session.
 *
 * @param session - The current session
 * @param systemPrompt - The new system prompt
 * @returns A new session with the updated prompt
 */
export const updateSystemPrompt = (session: ChatSession, systemPrompt: string): ChatSession => ({
  ...session,
  systemPrompt,
  updatedAt: Date.now(),
});

/**
 * Clears all messages from the session.
 *
 * Preserves the session ID, system prompt, and other metadata.
 *
 * @param session - The current session
 * @returns A new session with no messages
 */
export const clearMessages = (session: ChatSession): ChatSession => ({
  ...session,
  messages: [],
  updatedAt: Date.now(),
});

/**
 * Updates the model tier for the session.
 *
 * @param session - The current session
 * @param modelTier - The new model tier
 * @returns A new session with the updated model tier
 */
export const updateModelTier = (session: ChatSession, modelTier: ModelTier): ChatSession => ({
  ...session,
  modelTier,
  updatedAt: Date.now(),
});

/**
 * Converts session messages to the format expected by the API.
 *
 * Prepends the system message if a system prompt is set, and strips
 * internal metadata (id, timestamp) from messages.
 *
 * @param session - The current session
 * @returns Messages formatted for the OpenRouter API
 */
export const getMessagesForAPI = (
  session: ChatSession
): readonly { role: MessageRole; content: string }[] => {
  const messages: { role: MessageRole; content: string }[] = [];

  // Add system message if prompt exists
  if (session.systemPrompt.length > 0) {
    messages.push({
      role: "system",
      content: session.systemPrompt,
    });
  }

  // Add conversation messages (strip id and timestamp)
  for (const msg of session.messages) {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  return messages;
};

/**
 * Counts the total number of characters in all messages.
 *
 * Useful for estimating token usage and context length.
 *
 * @param session - The current session
 * @returns Total character count including system prompt
 */
export const getContextLength = (session: ChatSession): number => {
  let length = session.systemPrompt.length;
  for (const msg of session.messages) {
    length += msg.content.length;
  }
  return length;
};
