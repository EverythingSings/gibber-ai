/**
 * Unit tests for the AI session management module.
 *
 * Tests cover conversation state management and message handling.
 */

import { describe, it, expect, vi, beforeEach, assert } from "vitest";
import {
  createSession,
  addMessage,
  updateSystemPrompt,
  clearMessages,
  getMessagesForAPI,
} from "$lib/ai/session";

describe("session module", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T12:00:00.000Z"));
  });

  describe("createSession", () => {
    it("should create a new session with default values", () => {
      const session = createSession();

      expect(session.id).toBeDefined();
      expect(session.id.length).toBeGreaterThan(0);
      expect(session.messages).toHaveLength(0);
      expect(session.modelTier).toBe("standard");
      expect(session.systemPrompt).toBe("");
      expect(session.createdAt).toBe(Date.now());
      expect(session.updatedAt).toBe(Date.now());
    });

    it("should accept custom system prompt", () => {
      const session = createSession({
        systemPrompt: "You are a music assistant.",
      });

      expect(session.systemPrompt).toBe("You are a music assistant.");
    });

    it("should accept custom model tier", () => {
      const session = createSession({
        modelTier: "complex",
      });

      expect(session.modelTier).toBe("complex");
    });

    it("should generate unique session IDs", () => {
      const session1 = createSession();
      const session2 = createSession();

      expect(session1.id).not.toBe(session2.id);
    });
  });

  describe("addMessage", () => {
    it("should add a user message to the session", () => {
      const session = createSession();
      const content = "Create a synth for me";

      const updated = addMessage(session, "user", content);

      expect(updated.messages).toHaveLength(1);
      const msg = updated.messages[0];
      assert(msg !== undefined, "Message should exist");
      expect(msg.role).toBe("user");
      expect(msg.content).toBe(content);
      expect(msg.id).toBeDefined();
      expect(msg.timestamp).toBe(Date.now());
    });

    it("should add an assistant message to the session", () => {
      const session = createSession();
      const content = "Here's a synth:\n```javascript\nSynth()\n```";

      const updated = addMessage(session, "assistant", content);

      expect(updated.messages).toHaveLength(1);
      const msg = updated.messages[0];
      assert(msg !== undefined, "Message should exist");
      expect(msg.role).toBe("assistant");
      expect(msg.content).toBe(content);
    });

    it("should preserve existing messages", () => {
      let session = createSession();
      session = addMessage(session, "user", "Hello");

      vi.advanceTimersByTime(1000);

      session = addMessage(session, "assistant", "Hi there!");

      expect(session.messages).toHaveLength(2);
      const [msg0, msg1] = session.messages;
      assert(msg0 !== undefined && msg1 !== undefined, "Messages should exist");
      expect(msg0.content).toBe("Hello");
      expect(msg1.content).toBe("Hi there!");
    });

    it("should update the updatedAt timestamp", () => {
      const session = createSession();
      const originalUpdatedAt = session.updatedAt;

      vi.advanceTimersByTime(5000);

      const updated = addMessage(session, "user", "Test");

      expect(updated.updatedAt).toBeGreaterThan(originalUpdatedAt);
    });

    it("should not mutate the original session", () => {
      const session = createSession();
      const updated = addMessage(session, "user", "Test");

      expect(session.messages).toHaveLength(0);
      expect(updated.messages).toHaveLength(1);
    });
  });

  describe("updateSystemPrompt", () => {
    it("should update the system prompt", () => {
      const session = createSession({ systemPrompt: "Old prompt" });
      const updated = updateSystemPrompt(session, "New prompt");

      expect(updated.systemPrompt).toBe("New prompt");
    });

    it("should update the updatedAt timestamp", () => {
      const session = createSession();

      vi.advanceTimersByTime(1000);

      const updated = updateSystemPrompt(session, "New prompt");

      expect(updated.updatedAt).toBeGreaterThan(session.updatedAt);
    });

    it("should not mutate the original session", () => {
      const session = createSession({ systemPrompt: "Original" });
      const updated = updateSystemPrompt(session, "Modified");

      expect(session.systemPrompt).toBe("Original");
      expect(updated.systemPrompt).toBe("Modified");
    });
  });

  describe("clearMessages", () => {
    it("should remove all messages from session", () => {
      let session = createSession();
      session = addMessage(session, "user", "Hello");
      session = addMessage(session, "assistant", "Hi");

      const cleared = clearMessages(session);

      expect(cleared.messages).toHaveLength(0);
    });

    it("should preserve other session properties", () => {
      let session = createSession({
        systemPrompt: "Test prompt",
        modelTier: "complex",
      });
      session = addMessage(session, "user", "Hello");

      const cleared = clearMessages(session);

      expect(cleared.systemPrompt).toBe("Test prompt");
      expect(cleared.modelTier).toBe("complex");
      expect(cleared.id).toBe(session.id);
    });

    it("should update the updatedAt timestamp", () => {
      let session = createSession();
      session = addMessage(session, "user", "Hello");

      vi.advanceTimersByTime(1000);

      const cleared = clearMessages(session);

      expect(cleared.updatedAt).toBeGreaterThan(session.updatedAt);
    });
  });

  describe("getMessagesForAPI", () => {
    it("should include system message first if systemPrompt exists", () => {
      let session = createSession({ systemPrompt: "You are a helper." });
      session = addMessage(session, "user", "Hello");

      const messages = getMessagesForAPI(session);

      expect(messages).toHaveLength(2);
      const [msg0, msg1] = messages;
      assert(msg0 !== undefined && msg1 !== undefined, "Messages should exist");
      expect(msg0.role).toBe("system");
      expect(msg0.content).toBe("You are a helper.");
      expect(msg1.role).toBe("user");
    });

    it("should not include system message if systemPrompt is empty", () => {
      let session = createSession();
      session = addMessage(session, "user", "Hello");

      const messages = getMessagesForAPI(session);

      expect(messages).toHaveLength(1);
      const msg = messages[0];
      assert(msg !== undefined, "Message should exist");
      expect(msg.role).toBe("user");
    });

    it("should return messages in correct order", () => {
      let session = createSession({ systemPrompt: "System" });
      session = addMessage(session, "user", "First user");
      session = addMessage(session, "assistant", "First assistant");
      session = addMessage(session, "user", "Second user");

      const messages = getMessagesForAPI(session);

      expect(messages).toHaveLength(4);
      const [msg0, msg1, msg2, msg3] = messages;
      assert(
        msg0 !== undefined && msg1 !== undefined && msg2 !== undefined && msg3 !== undefined,
        "Messages should exist"
      );
      expect(msg0.content).toBe("System");
      expect(msg1.content).toBe("First user");
      expect(msg2.content).toBe("First assistant");
      expect(msg3.content).toBe("Second user");
    });

    it("should strip extra metadata from messages", () => {
      let session = createSession();
      session = addMessage(session, "user", "Hello");

      const messages = getMessagesForAPI(session);
      const firstMessage = messages[0];
      assert(firstMessage !== undefined, "Message should exist");

      // Should only have role and content, not id/timestamp
      expect(Object.keys(firstMessage)).toEqual(["role", "content"]);
    });
  });
});
