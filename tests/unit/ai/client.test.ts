/**
 * Unit tests for the AI client module.
 *
 * Tests cover OpenRouter API wrapper functionality.
 */

import { describe, it, expect, vi, beforeEach, assert } from "vitest";
import { MODEL_IDS } from "$lib/ai/types";
import type { AIClientConfig } from "$lib/ai/types";
import { createSession, addMessage } from "$lib/ai/session";

// Create the mock before importing client
const mockFetch = vi.fn();

// Mock global fetch
vi.stubGlobal("fetch", mockFetch);

// Now import the client (it will use our mocked fetch)
const { createAIClient, sendChatCompletion, getModelId } = await import("$lib/ai/client");

describe("client module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementation
    mockFetch.mockReset();
  });

  describe("getModelId", () => {
    it("should return correct model ID for quick tier", () => {
      expect(getModelId("quick")).toBe(MODEL_IDS.quick);
    });

    it("should return correct model ID for standard tier", () => {
      expect(getModelId("standard")).toBe(MODEL_IDS.standard);
    });

    it("should return correct model ID for complex tier", () => {
      expect(getModelId("complex")).toBe(MODEL_IDS.complex);
    });
  });

  describe("createAIClient", () => {
    it("should create a client with required config", () => {
      const client = createAIClient({ apiKey: "sk-test-key" });

      expect(client).toBeDefined();
      expect(client.config.apiKey).toBe("sk-test-key");
    });

    it("should apply default values", () => {
      const client = createAIClient({ apiKey: "sk-test-key" });

      expect(client.config.modelTier).toBe("standard");
      expect(client.config.maxTokens).toBe(4096);
      expect(client.config.temperature).toBe(0.7);
    });

    it("should allow overriding defaults", () => {
      const client = createAIClient({
        apiKey: "sk-test-key",
        modelTier: "complex",
        maxTokens: 8192,
        temperature: 0.5,
      });

      expect(client.config.modelTier).toBe("complex");
      expect(client.config.maxTokens).toBe(8192);
      expect(client.config.temperature).toBe(0.5);
    });

    it("should expose send method", () => {
      const client = createAIClient({ apiKey: "sk-test-key" });

      expect(typeof client.send).toBe("function");
    });
  });

  describe("sendChatCompletion", () => {
    const config: AIClientConfig = {
      apiKey: "sk-test-key",
      modelTier: "standard",
      maxTokens: 4096,
      temperature: 0.7,
    };

    it("should send request to OpenRouter API", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "gen-123",
          object: "chat.completion",
          created: 1234567890,
          model: "anthropic/claude-sonnet-4",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: "Here is a synth!",
              },
              finish_reason: "stop",
            },
          ],
          usage: {
            prompt_tokens: 100,
            completion_tokens: 50,
            total_tokens: 150,
          },
        }),
      });

      let session = createSession({ systemPrompt: "You are helpful." });
      session = addMessage(session, "user", "Create a synth");

      const response = await sendChatCompletion(config, session);

      expect(mockFetch).toHaveBeenCalledOnce();
      const choice = response.choices[0];
      assert(choice !== undefined, "Choice should exist");
      expect(choice.message.content).toBe("Here is a synth!");
    });

    it("should include correct headers", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "gen-123",
          object: "chat.completion",
          created: 1234567890,
          model: "anthropic/claude-sonnet-4",
          choices: [
            { index: 0, message: { role: "assistant", content: "" }, finish_reason: "stop" },
          ],
        }),
      });

      const session = createSession();

      await sendChatCompletion(config, session);

      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = options.headers as Record<string, string>;
      expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
      expect(headers["Authorization"]).toBe("Bearer sk-test-key");
      expect(headers["Content-Type"]).toBe("application/json");
      expect(headers["HTTP-Referer"]).toBeDefined();
    });

    it("should include correct request body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "gen-123",
          object: "chat.completion",
          created: 1234567890,
          model: "anthropic/claude-sonnet-4",
          choices: [
            { index: 0, message: { role: "assistant", content: "" }, finish_reason: "stop" },
          ],
        }),
      });

      let session = createSession({ systemPrompt: "System prompt" });
      session = addMessage(session, "user", "Hello");

      await sendChatCompletion(config, session);

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);

      expect(body.model).toBe(MODEL_IDS.standard);
      expect(body.messages).toHaveLength(2);
      expect(body.messages[0]).toEqual({ role: "system", content: "System prompt" });
      expect(body.messages[1]).toEqual({ role: "user", content: "Hello" });
      expect(body.max_tokens).toBe(4096);
      expect(body.temperature).toBe(0.7);
    });

    it("should throw AIError on HTTP error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({
          error: { message: "Invalid API key" },
        }),
      });

      const session = createSession();

      await expect(sendChatCompletion(config, session)).rejects.toMatchObject({
        code: "INVALID_API_KEY",
        message: expect.stringContaining("Invalid API key"),
      });
    });

    it("should handle rate limiting", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        json: async () => ({
          error: { message: "Rate limit exceeded" },
        }),
      });

      const session = createSession();

      await expect(sendChatCompletion(config, session)).rejects.toMatchObject({
        code: "RATE_LIMITED",
      });
    });

    it("should handle context too long error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({
          error: { message: "context_length_exceeded" },
        }),
      });

      const session = createSession();

      await expect(sendChatCompletion(config, session)).rejects.toMatchObject({
        code: "CONTEXT_TOO_LONG",
      });
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const session = createSession();

      await expect(sendChatCompletion(config, session)).rejects.toMatchObject({
        code: "NETWORK_ERROR",
      });
    });

    it("should handle model unavailable error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
        json: async () => ({
          error: { message: "Model is currently unavailable" },
        }),
      });

      const session = createSession();

      await expect(sendChatCompletion(config, session)).rejects.toMatchObject({
        code: "MODEL_UNAVAILABLE",
      });
    });
  });
});
