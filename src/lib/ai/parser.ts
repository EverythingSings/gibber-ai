/**
 * Parser for extracting code blocks from AI responses.
 *
 * AI responses typically contain markdown-formatted content with code blocks
 * (triple backticks) interspersed with prose explanations. This module
 * extracts and separates these components for processing.
 *
 * @module ai/parser
 */

import type { CodeBlock, ParsedResponse } from "./types";

/**
 * Regular expression for matching fenced code blocks.
 *
 * Matches: ```language\ncode\n``` or ```\ncode\n```
 * Groups:
 * - 1: Optional language identifier
 * - 2: Code content
 */
const CODE_BLOCK_REGEX = /```(\w*)\r?\n([\s\S]*?)```/g;

/**
 * Normalizes line endings to Unix-style (LF).
 *
 * @param text - Text with potentially mixed line endings
 * @returns Text with consistent LF line endings
 */
const normalizeLineEndings = (text: string): string => text.replace(/\r\n/g, "\n");

/**
 * Extracts all fenced code blocks from markdown content.
 *
 * @param content - Markdown content potentially containing code blocks
 * @returns Array of extracted code blocks with metadata
 *
 * @example
 * ```typescript
 * const blocks = extractCodeBlocks(`
 * \`\`\`javascript
 * const synth = Synth();
 * \`\`\`
 * `);
 * // blocks[0].code === "const synth = Synth();"
 * // blocks[0].language === "javascript"
 * ```
 */
export const extractCodeBlocks = (content: string): readonly CodeBlock[] => {
  const normalizedContent = normalizeLineEndings(content);
  const blocks: CodeBlock[] = [];

  // Reset regex state for fresh matching
  CODE_BLOCK_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = CODE_BLOCK_REGEX.exec(normalizedContent)) !== null) {
    const languageMatch = match[1];
    const codeMatch = match[2];

    // These should always exist given the regex pattern, but TypeScript needs assurance
    if (codeMatch === undefined) {
      continue;
    }

    const language = languageMatch === undefined || languageMatch === "" ? null : languageMatch;
    const code = codeMatch.replace(/\n$/, ""); // Remove trailing newline

    blocks.push({
      language,
      code,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return blocks;
};

/**
 * Parses an AI response into structured components.
 *
 * Separates code blocks from prose explanations, preserving the
 * original response for reference.
 *
 * @param response - Raw markdown response from the AI
 * @returns Parsed response with code blocks and prose sections
 *
 * @example
 * ```typescript
 * const parsed = parseResponse(`
 * Here's a synth:
 * \`\`\`javascript
 * Synth().note(60)
 * \`\`\`
 * This plays middle C.
 * `);
 *
 * parsed.codeBlocks[0].code // "Synth().note(60)"
 * parsed.prose[0] // "Here's a synth:"
 * parsed.prose[1] // "This plays middle C."
 * ```
 */
export const parseResponse = (response: string): ParsedResponse => {
  const normalizedResponse = normalizeLineEndings(response);
  const codeBlocks = extractCodeBlocks(normalizedResponse);

  // Extract prose by removing code blocks and splitting
  const prose = extractProse(normalizedResponse, codeBlocks);

  return {
    raw: response,
    codeBlocks,
    prose,
  };
};

/**
 * Extracts prose sections from content by removing code blocks.
 *
 * @param content - Full content with code blocks
 * @param codeBlocks - Previously extracted code blocks with indices
 * @returns Array of non-empty prose sections
 */
const extractProse = (content: string, codeBlocks: readonly CodeBlock[]): readonly string[] => {
  if (codeBlocks.length === 0) {
    const trimmed = content.trim();
    return trimmed.length > 0 ? [trimmed] : [];
  }

  const proseSections: string[] = [];
  let lastEnd = 0;

  for (const block of codeBlocks) {
    // Get text before this code block
    const textBefore = content.slice(lastEnd, block.startIndex).trim();
    if (textBefore.length > 0) {
      proseSections.push(textBefore);
    }
    lastEnd = block.endIndex;
  }

  // Get text after the last code block
  const textAfter = content.slice(lastEnd).trim();
  if (textAfter.length > 0) {
    proseSections.push(textAfter);
  }

  return proseSections;
};
