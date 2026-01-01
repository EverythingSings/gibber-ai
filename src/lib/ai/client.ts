/**
 * OpenRouter API client for AI chat completions.
 *
 * Provides a type-safe wrapper around the OpenRouter API for
 * sending chat completion requests.
 *
 * @module ai/client
 */

import type {
  AIClientConfig,
  AIError,
  AIErrorCode,
  ChatCompletionResponse,
  ChatSession,
  ModelTier,
} from "./types";
import { MODEL_IDS } from "./types";
import { getMessagesForAPI } from "./session";

/** OpenRouter API endpoint */
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

/** Application identifier for OpenRouter */
const APP_REFERER = "https://github.com/EverythingSings/gibber-ai";
const APP_TITLE = "Gibber AI";

/**
 * Default configuration values.
 */
const DEFAULT_CONFIG: Omit<Required<AIClientConfig>, "apiKey"> = {
  modelTier: "standard",
  maxTokens: 4096,
  temperature: 0.7,
};

/**
 * Gets the OpenRouter model ID for a given tier.
 *
 * @param tier - The model tier
 * @returns The OpenRouter model identifier
 */
export const getModelId = (tier: ModelTier): string => MODEL_IDS[tier];

/**
 * Creates an AIError from an HTTP response.
 *
 * @param status - HTTP status code
 * @param message - Error message from the API
 * @returns Formatted AIError
 */
const createErrorFromResponse = (status: number, message: string): AIError => {
  let code: AIErrorCode = "UNKNOWN";

  if (status === 401) {
    code = "INVALID_API_KEY";
  } else if (status === 429) {
    code = "RATE_LIMITED";
  } else if (status === 503) {
    code = "MODEL_UNAVAILABLE";
  } else if (status === 400 && message.includes("context_length")) {
    code = "CONTEXT_TOO_LONG";
  }

  return { message, code };
};

/**
 * Creates an AIError from a network error.
 *
 * @param error - The caught error
 * @returns Formatted AIError
 */
const createNetworkError = (error: unknown): AIError => ({
  message: error instanceof Error ? error.message : "Network request failed",
  code: "NETWORK_ERROR",
});

/**
 * Sends a chat completion request to OpenRouter.
 *
 * @param config - Client configuration
 * @param session - Chat session with messages
 * @returns The completion response
 * @throws AIError if the request fails
 *
 * @example
 * ```typescript
 * const response = await sendChatCompletion(config, session);
 * const content = response.choices[0].message.content;
 * ```
 */
export const sendChatCompletion = async (
  config: AIClientConfig,
  session: ChatSession
): Promise<ChatCompletionResponse> => {
  const modelTier = config.modelTier ?? DEFAULT_CONFIG.modelTier;
  const maxTokens = config.maxTokens ?? DEFAULT_CONFIG.maxTokens;
  const temperature = config.temperature ?? DEFAULT_CONFIG.temperature;

  const messages = getMessagesForAPI(session);

  const requestBody = {
    model: getModelId(modelTier),
    messages,
    max_tokens: maxTokens,
    temperature,
  };

  let response: Response;
  try {
    response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": APP_REFERER,
        "X-Title": APP_TITLE,
      },
      body: JSON.stringify(requestBody),
    });
  } catch (error) {
    throw createNetworkError(error);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      (errorData as { error?: { message?: string } }).error?.message ?? response.statusText;
    throw createErrorFromResponse(response.status, errorMessage);
  }

  return (await response.json()) as ChatCompletionResponse;
};

/**
 * AI client interface.
 */
export interface AIClient {
  /** Client configuration */
  readonly config: Required<AIClientConfig>;
  /** Send a chat completion request */
  readonly send: (session: ChatSession) => Promise<ChatCompletionResponse>;
}

/**
 * Creates a configured AI client.
 *
 * @param config - Client configuration
 * @returns Configured AI client
 *
 * @example
 * ```typescript
 * const client = createAIClient({
 *   apiKey: await getApiKey("openrouter"),
 *   modelTier: "standard"
 * });
 *
 * const response = await client.send(session);
 * ```
 */
export const createAIClient = (config: AIClientConfig): AIClient => {
  const fullConfig: Required<AIClientConfig> = {
    apiKey: config.apiKey,
    modelTier: config.modelTier ?? DEFAULT_CONFIG.modelTier,
    maxTokens: config.maxTokens ?? DEFAULT_CONFIG.maxTokens,
    temperature: config.temperature ?? DEFAULT_CONFIG.temperature,
  };

  return {
    config: fullConfig,
    send: (session: ChatSession) => sendChatCompletion(fullConfig, session),
  };
};
