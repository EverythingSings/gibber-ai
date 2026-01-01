/**
 * Vitest configuration for Gibber AI.
 *
 * Configures unit and integration testing with:
 * - TypeScript support
 * - Svelte component testing
 * - Coverage reporting
 * - Path aliases matching SvelteKit
 */

import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    // Include patterns for test files
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],

    // Environment for DOM testing
    environment: "jsdom",

    // Global test utilities
    globals: true,

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts", "src/**/*.svelte"],
      exclude: ["src/**/*.d.ts", "src/**/*.test.ts", "src/app.html", "src/routes/+layout.ts"],
      // Minimum coverage thresholds
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },

    // Fail on console.log/warn/error in tests (strict mode)
    onConsoleLog: () => false,

    // Setup files to run before each test
    setupFiles: ["tests/setup.ts"],
  },
  resolve: {
    alias: {
      $lib: "/src/lib",
    },
  },
});
