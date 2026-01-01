/**
 * Vitest global test setup.
 *
 * This file runs before each test file and sets up:
 * - Global test utilities
 * - Mock implementations
 * - Test environment configuration
 */

import { vi, afterEach } from "vitest";

// Mock Tauri API for unit tests
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

// Mock window.matchMedia for components that use it
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});
