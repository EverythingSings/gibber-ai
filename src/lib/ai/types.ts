/**
 * Type definitions for AI chat integration.
 *
 * These types support the OpenRouter API integration for AI-assisted
 * composition in Gibber.
 *
 * @module ai/types
 */

/**
 * Available AI model tiers for different use cases.
 *
 * - quick: Fast responses for simple queries
 * - standard: Balanced performance for most tasks
 * - complex: High-quality output for complex compositions
 */
export type ModelTier = "quick" | "standard" | "complex";

/**
 * OpenRouter model identifiers mapped to tiers.
 */
export const MODEL_IDS: Record<ModelTier, string> = {
  quick: "anthropic/claude-3-haiku",
  standard: "anthropic/claude-sonnet-4",
  complex: "anthropic/claude-opus-4",
} as const;

/**
 * Role of a message in the conversation.
 */
export type MessageRole = "system" | "user" | "assistant";

/**
 * A single message in the conversation.
 */
export interface Message {
  /** The role of the message sender */
  readonly role: MessageRole;
  /** The content of the message */
  readonly content: string;
  /** Unique identifier for the message */
  readonly id: string;
  /** Timestamp when the message was created */
  readonly timestamp: number;
}

/**
 * Configuration for the AI client.
 */
export interface AIClientConfig {
  /** OpenRouter API key */
  readonly apiKey: string;
  /** Model tier to use (defaults to "standard") */
  readonly modelTier?: ModelTier;
  /** Maximum tokens in the response */
  readonly maxTokens?: number;
  /** Temperature for response randomness (0-1) */
  readonly temperature?: number;
}

/**
 * Request body for chat completion.
 */
export interface ChatCompletionRequest {
  /** The model ID to use */
  readonly model: string;
  /** The conversation messages */
  readonly messages: readonly { role: MessageRole; content: string }[];
  /** Maximum tokens to generate */
  readonly max_tokens?: number;
  /** Temperature for randomness */
  readonly temperature?: number;
  /** Whether to stream the response */
  readonly stream?: boolean;
}

/**
 * A single choice in the chat completion response.
 */
export interface ChatCompletionChoice {
  /** Index of this choice */
  readonly index: number;
  /** The generated message */
  readonly message: {
    readonly role: "assistant";
    readonly content: string;
  };
  /** Reason the generation stopped */
  readonly finish_reason: string | null;
}

/**
 * Token usage statistics.
 */
export interface TokenUsage {
  /** Tokens in the prompt */
  readonly prompt_tokens: number;
  /** Tokens in the completion */
  readonly completion_tokens: number;
  /** Total tokens used */
  readonly total_tokens: number;
}

/**
 * Response from the chat completion API.
 */
export interface ChatCompletionResponse {
  /** Unique identifier for this completion */
  readonly id: string;
  /** Object type (always "chat.completion") */
  readonly object: "chat.completion";
  /** Unix timestamp of creation */
  readonly created: number;
  /** Model used for generation */
  readonly model: string;
  /** Generated choices */
  readonly choices: readonly ChatCompletionChoice[];
  /** Token usage statistics */
  readonly usage?: TokenUsage;
}

/**
 * A code block extracted from an AI response.
 */
export interface CodeBlock {
  /** The programming language (if specified) */
  readonly language: string | null;
  /** The code content */
  readonly code: string;
  /** Start index in the original response */
  readonly startIndex: number;
  /** End index in the original response */
  readonly endIndex: number;
}

/**
 * Result of parsing an AI response.
 */
export interface ParsedResponse {
  /** The original raw response */
  readonly raw: string;
  /** Extracted code blocks */
  readonly codeBlocks: readonly CodeBlock[];
  /** Prose sections (non-code content) */
  readonly prose: readonly string[];
}

/**
 * Error returned from AI operations.
 */
export interface AIError {
  /** Human-readable error message */
  readonly message: string;
  /** Error code for programmatic handling */
  readonly code: AIErrorCode;
  /** Optional additional details */
  readonly details?: unknown;
}

/**
 * Error codes for AI operations.
 */
export type AIErrorCode =
  | "INVALID_API_KEY"
  | "RATE_LIMITED"
  | "MODEL_UNAVAILABLE"
  | "CONTEXT_TOO_LONG"
  | "NETWORK_ERROR"
  | "PARSE_ERROR"
  | "UNKNOWN";

/**
 * Type guard to check if an error is an AIError.
 *
 * @param error - The value to check
 * @returns True if the value is an AIError
 */
export const isAIError = (error: unknown): error is AIError => {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const obj = error as Record<string, unknown>;
  return typeof obj["message"] === "string" && typeof obj["code"] === "string";
};

/**
 * State of an AI chat session.
 */
export interface ChatSession {
  /** Unique identifier for the session */
  readonly id: string;
  /** Conversation messages */
  readonly messages: readonly Message[];
  /** Current model tier */
  readonly modelTier: ModelTier;
  /** System prompt for this session */
  readonly systemPrompt: string;
  /** Timestamp when the session was created */
  readonly createdAt: number;
  /** Timestamp of the last update */
  readonly updatedAt: number;
}

/**
 * Options for creating a new session.
 */
export interface CreateSessionOptions {
  /** Initial system prompt */
  readonly systemPrompt?: string;
  /** Model tier to use */
  readonly modelTier?: ModelTier;
}

/**
 * Streaming chunk from the AI response.
 */
export interface StreamChunk {
  /** The content delta */
  readonly content: string;
  /** Whether this is the final chunk */
  readonly done: boolean;
}

/**
 * Callback for handling streaming responses.
 */
export type StreamCallback = (chunk: StreamChunk) => void;
