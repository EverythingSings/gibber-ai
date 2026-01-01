/**
 * ESLint configuration for Gibber AI.
 *
 * Enforces strict code quality standards:
 * - TypeScript strict type checking
 * - Svelte best practices
 * - Functional programming patterns
 * - Zero warnings policy (warnings are errors)
 */

import js from "@eslint/js";
import ts from "typescript-eslint";
import svelte from "eslint-plugin-svelte";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default ts.config(
  js.configs.recommended,
  ...ts.configs.strict,
  ...ts.configs.stylistic,
  ...svelte.configs["flat/recommended"],
  prettier,
  ...svelte.configs["flat/prettier"],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.svelte"],
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
      },
    },
  },
  {
    rules: {
      // Treat warnings as errors - zero tolerance
      "no-console": "error",
      "no-debugger": "error",
      "no-unused-vars": "off", // Use TypeScript's version

      // TypeScript strict rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/strict-boolean-expressions": "off", // Too strict for Svelte
      "@typescript-eslint/no-non-null-assertion": "error",

      // Functional programming encouragement
      "prefer-const": "error",
      "no-var": "error",
      "no-param-reassign": "error",
      "no-sequences": "error",

      // Code quality
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-throw-literal": "error",
    },
  },
  {
    ignores: [
      "build/",
      ".svelte-kit/",
      "dist/",
      "node_modules/",
      "src-tauri/target/",
      "*.config.js",
      "*.config.ts",
    ],
  }
);
