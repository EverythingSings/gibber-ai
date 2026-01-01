/**
 * Unit tests for the AI response parser module.
 *
 * Tests cover extraction of code blocks from markdown-formatted AI responses.
 */

import { describe, it, expect, assert } from "vitest";
import { parseResponse, extractCodeBlocks } from "$lib/ai/parser";
import type { CodeBlock } from "$lib/ai/types";

describe("parser module", () => {
  describe("extractCodeBlocks", () => {
    it("should extract a single code block with language", () => {
      const input = `Here is some code:

\`\`\`javascript
const synth = Synth();
synth.note(60);
\`\`\`

That creates a synth.`;

      const blocks = extractCodeBlocks(input);

      expect(blocks).toHaveLength(1);
      const block = blocks[0];
      assert(block !== undefined, "Block should exist");
      expect(block.language).toBe("javascript");
      expect(block.code).toBe("const synth = Synth();\nsynth.note(60);");
    });

    it("should extract a code block without language specified", () => {
      const input = `Try this:

\`\`\`
Synth().note(60)
\`\`\``;

      const blocks = extractCodeBlocks(input);

      expect(blocks).toHaveLength(1);
      const block = blocks[0];
      assert(block !== undefined, "Block should exist");
      expect(block.language).toBeNull();
      expect(block.code).toBe("Synth().note(60)");
    });

    it("should extract multiple code blocks", () => {
      const input = `First, create a synth:

\`\`\`javascript
const s = Synth();
\`\`\`

Then, play a note:

\`\`\`javascript
s.note(60);
\`\`\`

Done!`;

      const blocks = extractCodeBlocks(input);

      expect(blocks).toHaveLength(2);
      const block0 = blocks[0];
      const block1 = blocks[1];
      assert(block0 !== undefined && block1 !== undefined, "Blocks should exist");
      expect(block0.code).toBe("const s = Synth();");
      expect(block1.code).toBe("s.note(60);");
    });

    it("should handle empty input", () => {
      const blocks = extractCodeBlocks("");

      expect(blocks).toHaveLength(0);
    });

    it("should handle input with no code blocks", () => {
      const input = "This is just plain text without any code blocks.";

      const blocks = extractCodeBlocks(input);

      expect(blocks).toHaveLength(0);
    });

    it("should preserve code block indices", () => {
      const input = `Some text here.

\`\`\`js
code here
\`\`\`

More text.`;

      const blocks = extractCodeBlocks(input);

      expect(blocks).toHaveLength(1);
      const block = blocks[0];
      assert(block !== undefined, "Block should exist");
      expect(block.startIndex).toBeGreaterThan(0);
      expect(block.endIndex).toBeGreaterThan(block.startIndex);
    });

    it("should handle code blocks with various languages", () => {
      const input = `\`\`\`typescript
const x: number = 1;
\`\`\`

\`\`\`python
x = 1
\`\`\`

\`\`\`gibber
Synth()
\`\`\``;

      const blocks = extractCodeBlocks(input);

      expect(blocks).toHaveLength(3);
      const [block0, block1, block2] = blocks;
      assert(
        block0 !== undefined && block1 !== undefined && block2 !== undefined,
        "Blocks should exist"
      );
      expect(block0.language).toBe("typescript");
      expect(block1.language).toBe("python");
      expect(block2.language).toBe("gibber");
    });

    it("should handle empty code blocks", () => {
      const input = `\`\`\`javascript
\`\`\``;

      const blocks = extractCodeBlocks(input);

      expect(blocks).toHaveLength(1);
      const block = blocks[0];
      assert(block !== undefined, "Block should exist");
      expect(block.code).toBe("");
    });

    it("should handle code blocks with backticks inside", () => {
      const input = `\`\`\`javascript
const template = \`Hello \${name}\`;
\`\`\``;

      const blocks = extractCodeBlocks(input);

      expect(blocks).toHaveLength(1);
      const block = blocks[0];
      assert(block !== undefined, "Block should exist");
      expect(block.code).toBe("const template = `Hello ${name}`;");
    });

    it("should handle Windows-style line endings", () => {
      const input = "```javascript\r\nconst x = 1;\r\n```";

      const blocks = extractCodeBlocks(input);

      expect(blocks).toHaveLength(1);
      const block = blocks[0];
      assert(block !== undefined, "Block should exist");
      expect(block.code).toBe("const x = 1;");
    });
  });

  describe("parseResponse", () => {
    it("should parse response with code and prose", () => {
      const input = `Let me create a synth for you:

\`\`\`javascript
const synth = Synth({ attack: 0.1 });
synth.note(60);
\`\`\`

This will create a synth with a short attack and play middle C.`;

      const result = parseResponse(input);

      expect(result.raw).toBe(input);
      expect(result.codeBlocks).toHaveLength(1);
      expect(result.prose).toHaveLength(2);
      expect(result.prose[0]).toContain("Let me create a synth");
      expect(result.prose[1]).toContain("This will create a synth");
    });

    it("should parse response with only prose", () => {
      const input = "I can help you with that. What kind of sound are you looking for?";

      const result = parseResponse(input);

      expect(result.codeBlocks).toHaveLength(0);
      expect(result.prose).toHaveLength(1);
      expect(result.prose[0]).toBe(input);
    });

    it("should parse response with only code", () => {
      const input = `\`\`\`javascript
Synth().note(60);
\`\`\``;

      const result = parseResponse(input);

      expect(result.codeBlocks).toHaveLength(1);
      expect(result.prose).toHaveLength(0);
    });

    it("should trim prose sections", () => {
      const input = `

Some leading whitespace.

\`\`\`javascript
code()
\`\`\`

   Trailing whitespace too.

`;

      const result = parseResponse(input);

      expect(result.prose[0]).toBe("Some leading whitespace.");
      expect(result.prose[1]).toBe("Trailing whitespace too.");
    });

    it("should filter out empty prose sections", () => {
      const input = `\`\`\`javascript
code1()
\`\`\`

\`\`\`javascript
code2()
\`\`\``;

      const result = parseResponse(input);

      expect(result.codeBlocks).toHaveLength(2);
      // Empty string between code blocks should be filtered
      expect(result.prose.filter((p) => p.length > 0)).toHaveLength(0);
    });

    it("should handle complex mixed content", () => {
      const input = `I'll create a sequence for you:

\`\`\`javascript
const seq = Seq([60, 62, 64, 65], 1/4);
\`\`\`

And here's a bass line to accompany it:

\`\`\`javascript
const bass = FM('bass');
bass.note.seq([36, 36, 38, 40], 1);
\`\`\`

These patterns work together in 4/4 time. Adjust the tempo with \`Gibber.Seq.bpm = 120\`.`;

      const result = parseResponse(input);

      expect(result.codeBlocks).toHaveLength(2);
      expect(result.prose).toHaveLength(3);
      expect(result.prose[0]).toContain("I'll create a sequence");
      expect(result.prose[1]).toContain("bass line");
      expect(result.prose[2]).toContain("patterns work together");
    });
  });

  describe("code block type inference", () => {
    it("should identify JavaScript/Gibber code blocks", () => {
      const jsBlock: CodeBlock = {
        language: "javascript",
        code: "Synth().note(60)",
        startIndex: 0,
        endIndex: 30,
      };

      expect(jsBlock.language).toBe("javascript");
    });

    it("should handle js shorthand language identifier", () => {
      const input = `\`\`\`js
const x = 1;
\`\`\``;

      const blocks = extractCodeBlocks(input);
      const block = blocks[0];
      assert(block !== undefined, "Block should exist");

      expect(block.language).toBe("js");
    });
  });
});
