# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gibber AI is a Tauri 2.0 desktop application that integrates the [gibber.cc](https://gibber.cc/) audiovisual live coding libraries with AI capabilities via OpenRouter. Users can create music and visuals conversationally, then publish finished compositions (as code) to decentralized social platforms using [Plurcast](https://github.com/sovereign-composable-tools/plurcast) (integrated behind the scenes).

## Architecture

```
gibber/
├── src/                          # Frontend (TypeScript)
│   ├── lib/
│   │   ├── gibber/              # Gibber library integration
│   │   │   ├── audio.ts         # Audio synthesis wrapper
│   │   │   ├── graphics.ts      # Visual/shader wrapper
│   │   │   ├── patterns.ts      # Sequencing patterns
│   │   │   └── context.ts       # Gibber runtime context
│   │   ├── ai/                  # AI conversation layer
│   │   │   ├── client.ts        # OpenRouter SDK client
│   │   │   ├── prompts.ts       # System prompts for composition
│   │   │   ├── parser.ts        # Parse AI responses to Gibber code
│   │   │   └── session.ts       # Conversation state management
│   │   ├── composition/         # Composition management
│   │   │   ├── project.ts       # Project file handling
│   │   │   └── history.ts       # Edit history/undo
│   │   └── publish/             # Publishing integration
│   │       ├── plurcast.ts      # Plurcast library integration
│   │       └── formats.ts       # Code formatting for posts
│   ├── components/              # UI components
│   │   ├── Editor/              # Code editor with Gibber syntax
│   │   ├── Chat/                # AI conversation interface
│   │   ├── Visualizer/          # Real-time graphics display
│   │   ├── Transport/           # Play/stop controls
│   │   └── Publisher/           # Social publishing UI
│   └── stores/                  # State management
├── src-tauri/                   # Backend (Rust)
│   ├── src/
│   │   ├── main.rs              # Tauri entry point
│   │   └── commands/
│   │       ├── mod.rs
│   │       ├── project.rs       # Project save/load
│   │       ├── plurcast.rs      # Plurcast publishing commands
│   │       └── credentials.rs   # Secure key storage
│   ├── Cargo.toml
│   └── tauri.conf.json
├── tests/
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── e2e/                     # End-to-end tests
└── package.json
```

## Core Integration Points

### Gibber Libraries

Gibber provides three interconnected libraries:

1. **gibber.audio.lib** - Synthesizers, samplers, effects, sequencers
2. **gibber.graphics.lib** - Ray-marching 3D, shaders, 2D canvas
3. **gibber.core.lib** - Pattern system, timing, modulation

Key integration considerations:

- Audio context requires user gesture to start (Web Audio API security)
- Graphics run on requestAnimationFrame loop
- Both share a unified sequencing/timing system
- Patterns support transformations: `.reverse()`, `.rotate()`, `.scale()`

### AI Composition Flow

```
User Message → OpenRouter API → AI Response → Parser → Gibber Code → Execution
                    ↑                                        ↓
              System Prompt                            Audio/Visual Output
              (composition context)
```

The AI layer translates natural language into executable Gibber code:

1. **System prompt** provides Gibber API knowledge and composition context
2. **Parser** extracts code blocks from AI responses
3. **Executor** runs code in Gibber runtime with error recovery
4. **Feedback loop** sends results back for refinement

### Tauri IPC Boundary

Frontend ↔ Backend communication via Tauri commands:

| Command        | Direction | Purpose                               |
| -------------- | --------- | ------------------------------------- |
| `save_project` | FE→BE     | Persist composition to disk           |
| `load_project` | FE→BE     | Load composition from disk            |
| `get_api_key`  | FE→BE     | Retrieve from secure storage          |
| `set_api_key`  | FE→BE     | Store in secure storage               |
| `publish`      | FE→BE     | Publish composition code via Plurcast |

### Publishing Pipeline

Plurcast is integrated as a Rust library in the Tauri backend. Compositions are published as code:

```
Gibber Code → Format → Plurcast Library → Decentralized Networks
      ↓                                   (Nostr, Mastodon/ActivityPub, SSB)
 Title + Description +
 Code snippet
```

Publishing happens transparently from the UI - users select platforms and click publish.

## Development Commands

```bash
# Install dependencies
npm install

# Development with hot reload
npm run tauri dev

# Build production release
npm run tauri build

# Run frontend only (no Tauri window)
npm run dev

# Type checking
npm run check

# Linting
npm run lint

# Format code
npm run format

# Run all tests
npm test

# Run single test file
npm test -- path/to/test.ts

# Run tests matching pattern
npm test -- --grep "pattern"

# Run tests in watch mode
npm test -- --watch
```

## Tauri CLI Commands

```bash
# Development
cargo tauri dev

# Production build
cargo tauri build

# Add plugin (e.g., secure storage)
cargo tauri add keyring

# Generate app icons
cargo tauri icon path/to/icon.png

# Update Rust dependencies
cd src-tauri && cargo update
```

## AI Integration Details

### OpenRouter Configuration

```typescript
import OpenRouter from "@openrouter/sdk";

const client = new OpenRouter({
  apiKey: await invoke("get_api_key", { service: "openrouter" }),
});

// Model selection based on task complexity
const MODELS = {
  quick: "anthropic/claude-3-haiku", // Fast responses
  standard: "anthropic/claude-sonnet-4", // Balanced
  complex: "anthropic/claude-opus-4", // Complex compositions
};
```

### System Prompt Strategy

The AI needs context about:

1. Current composition state (instruments, patterns, tempo)
2. Gibber API surface (available synths, effects, pattern methods)
3. User's intent (genre, mood, complexity level)
4. Constraints (performance limits)

### Response Parsing

AI responses contain mixed prose and code. Parser extracts:

- Code blocks (`javascript ... `)
- Inline code modifications
- Verbal explanations (for user display)
- Error recovery suggestions

## Gibber Runtime Integration

### Initialization Sequence

```typescript
// 1. Wait for user gesture
button.onclick = async () => {
  // 2. Initialize Gibber
  await Gibber.init();

  // 3. Set global tempo/key
  Gibber.Seq.bpm = 120;

  // 4. Ready for composition
};
```

### Code Execution Safety

Gibber code from AI must be sandboxed:

- Wrap in try/catch for graceful error handling
- Timeout long-running operations
- Validate object references before execution
- Provide rollback capability

### State Synchronization

Keep frontend state in sync with Gibber runtime:

- Active instruments and their parameters
- Running sequences and patterns
- Current tempo, key, scale
- Visual shader state

## Project File Format

```json
{
  "version": "1.0.0",
  "metadata": {
    "title": "Composition Name",
    "created": "2025-01-01T00:00:00Z",
    "modified": "2025-01-01T00:00:00Z"
  },
  "composition": {
    "bpm": 120,
    "key": "C",
    "scale": "minor",
    "code": "// Gibber code here",
    "history": []
  },
  "conversation": {
    "messages": [],
    "model": "anthropic/claude-sonnet-4"
  },
  "publish": {
    "platforms": ["nostr", "mastodon"],
    "scheduled": null
  }
}
```

## Testing Strategy

### Unit Tests

- AI prompt construction
- Response parsing
- Pattern transformations
- State management

### Integration Tests

- Gibber library loading
- Tauri command roundtrips
- Plurcast integration

### E2E Tests

- Full composition workflow
- AI conversation flow
- Publish flow

### Testing Gibber Code

```typescript
// Mock Gibber for unit tests
const mockGibber = {
  Synth: vi.fn(() => ({ note: vi.fn() })),
  Seq: { bpm: 120 },
};
```

## Build Requirements

- **Node.js** 18+
- **Rust** 1.70+

### Platform-Specific

**Windows:**

- Microsoft C++ Build Tools
- WebView2 Runtime

**macOS:**

- Xcode Command Line Tools

**Linux:**

- webkit2gtk-4.1
- libayatana-appindicator3-1

## Security Considerations

- API keys stored via Tauri's secure storage (OS keyring)
- Never log or expose keys in debug output (only output key length if needed)
- Sanitize AI-generated code before execution
- Validate all IPC command parameters
