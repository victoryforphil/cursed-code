# Feature: Think Mode Hook

**Source:** `/repos/oh-my-opencode/src/hooks/think-mode/`
**Files:** `index.ts`, `detector.ts`, `switcher.ts`, `types.ts`
**Lines:** ~260 | **Dependencies:** chat.params hook, shared logger | **Complexity:** Medium

## What It Does

Auto-switches to high-reasoning model variants when user prompts contain "think" keywords. Intercepts chat parameters before the message is sent, detects multilingual thinking keywords, upgrades the model to its high-thinking variant, and injects provider-specific thinking configurations (budget tokens, reasoning levels, etc.).

## How It Works

1. **Hook Registration:** Creates `chat.params` hook that runs before every message send
2. **Keyword Detection:** Extracts text from prompt parts and searches for thinking keywords (multilingual support)
3. **Code Filtering:** Strips code blocks and inline code to avoid false positives
4. **Model Check:** Verifies current model supports high-reasoning variants
5. **Model Switching:** Maps current model ID to high-variant (e.g., `claude-sonnet-4-5` → `claude-sonnet-4-5-high`)
6. **Config Injection:** Adds provider-specific thinking config (e.g., budget tokens for Anthropic, thinking level for Google)
7. **State Tracking:** Maintains per-session state to track what was triggered
8. **Cleanup:** Clears state when session is deleted

## Code Analysis

### Hook Factory & Main Entry Point
```typescript
// src/hooks/think-mode/index.ts:16-78
export function createThinkModeHook() {
  return {
    "chat.params": async (output: ThinkModeInput, sessionID: string) => {
      // Extract text from message parts (handles multiple text segments)
      const promptText = extractPromptText(output.parts)

      // Initialize per-session state tracking
      const state: ThinkModeState = {
        requested: false,
        modelSwitched: false,
        thinkingConfigInjected: false,
      }

      // Early exit if no think keywords detected
      if (!detectThinkKeyword(promptText)) {
        thinkModeState.set(sessionID, state)
        return
      }

      state.requested = true
      const currentModel = output.message.model
      
      // Skip if no model info available
      if (!currentModel) {
        thinkModeState.set(sessionID, state)
        return
      }

      // Record original model for state tracking
      state.providerID = currentModel.providerID
      state.modelID = currentModel.modelID

      // Skip if already using high variant
      if (isAlreadyHighVariant(currentModel.modelID)) {
        thinkModeState.set(sessionID, state)
        return
      }

      // Get high variant mapping and provider config
      const highVariant = getHighVariant(currentModel.modelID)
      const thinkingConfig = getThinkingConfig(currentModel.providerID, currentModel.modelID)

      // Switch model if mapping exists
      if (highVariant) {
        output.message.model = {
          providerID: currentModel.providerID,
          modelID: highVariant,
        }
        state.modelSwitched = true
        log("Think mode: model switched to high variant", { sessionID, from: currentModel.modelID, to: highVariant })
      }

      // Inject thinking config if available for provider/model
      if (thinkingConfig) {
        Object.assign(output.message, thinkingConfig)
        state.thinkingConfigInjected = true
        log("Think mode: thinking config injected", { sessionID, provider: currentModel.providerID, config: thinkingConfig })
      }

      // Store state for session
      thinkModeState.set(sessionID, state)
    },

    // Cleanup handler: removes state when session is deleted
    event: async ({ event }) => {
      if (event.type === "session.deleted") {
        const props = event.properties as { info?: { id?: string } } | undefined
        if (props?.info?.id) {
          thinkModeState.delete(props.info.id)
        }
      }
    },
  }
}
```

### Multilingual Keyword Detection
```typescript
// src/hooks/think-mode/detector.ts:1-48
const ENGLISH_PATTERNS = [/\bultrathink\b/i, /\bthink\b/i]

const MULTILINGUAL_KEYWORDS = [
  // Korean: 생각, 고민, 검토, 제대로
  // Chinese: 思考, 考虑, 考慮
  // Japanese: 思考, 考え, 熟考
  // Hindi: सोच, विचार
  // Arabic: تفكير, تأمل
  // Bengali: চিন্তা, ভাবনা
  // Russian: думать, думай, размышлять, размышляй
  // Portuguese, Spanish, French, German, Vietnamese, Turkish, Italian, Thai, Polish, Dutch, Indonesian, Ukrainian, Greek, Czech, Romanian, Swedish, Hungarian, Finnish, Danish, Norwegian, Hebrew, Malay
  // ... 30+ languages supported
]

const THINK_PATTERNS = [...ENGLISH_PATTERNS, ...MULTILINGUAL_PATTERNS]

// Prevent false positives in code snippets
function removeCodeBlocks(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "")  // Remove markdown code blocks
    .replace(/`[^`]+`/g, "")          // Remove inline code
}

export function detectThinkKeyword(text: string): boolean {
  // Strip code first to avoid false positives
  const textWithoutCode = removeCodeBlocks(text)
  // Check if any pattern matches (case-insensitive)
  return THINK_PATTERNS.some((pattern) => pattern.test(textWithoutCode))
}

export function extractPromptText(parts: Array<{ type: string; text?: string }>): string {
  // Combine all text parts into single string
  return parts
    .filter((p) => p.type === "text")
    .map((p) => p.text || "")
    .join("")
}
```

### Model Variant Mapping & Config Injection
```typescript
// src/hooks/think-mode/switcher.ts:1-126
// Maps standard models to high-reasoning variants
const HIGH_VARIANT_MAP: Record<string, string> = {
  "claude-sonnet-4-5": "claude-sonnet-4-5-high",
  "claude-opus-4-5": "claude-opus-4-5-high",
  "gemini-3-pro": "gemini-3-pro-high",
  "gpt-5": "gpt-5-high",
  "gpt-5-mini": "gpt-5-mini-high",
  // ... more GPT-5.x variants
}

// Pre-computed set of models already at high variant
const ALREADY_HIGH: Set<string> = new Set([
  "claude-sonnet-4-5-high",
  "claude-opus-4-5-high",
  // ... matching entries above
])

// Provider-specific thinking configurations
export const THINKING_CONFIGS: Record<string, Record<string, unknown>> = {
  // Anthropic: Extended thinking with budget
  anthropic: {
    thinking: {
      type: "enabled",
      budgetTokens: 64000,
    },
    maxTokens: 128000,
  },
  // Amazon Bedrock: Reasoning config
  "amazon-bedrock": {
    reasoningConfig: {
      type: "enabled",
      budgetTokens: 32000,
    },
    maxTokens: 64000,
  },
  // Google: Thinking level enum
  google: {
    providerOptions: {
      google: {
        thinkingConfig: {
          thinkingLevel: "HIGH",
        },
      },
    },
  },
  // Google Vertex: Same as google but for Vertex
  "google-vertex": {
    providerOptions: {
      "google-vertex": {
        thinkingConfig: {
          thinkingLevel: "HIGH",
        },
      },
    },
  },
}

// Which models support extended thinking per provider
const THINKING_CAPABLE_MODELS: Record<string, string[]> = {
  anthropic: ["claude-sonnet-4", "claude-opus-4", "claude-3"],
  "amazon-bedrock": ["claude", "anthropic"],
  google: ["gemini-2", "gemini-3"],
  "google-vertex": ["gemini-2", "gemini-3"],
}

export function getHighVariant(modelID: string): string | null {
  // Returns null if already high variant (avoid double-switching)
  if (ALREADY_HIGH.has(modelID)) return null
  return HIGH_VARIANT_MAP[modelID] ?? null
}

export function isAlreadyHighVariant(modelID: string): boolean {
  // Checks both set and generic "-high" suffix (handles unknown models)
  return ALREADY_HIGH.has(modelID) || modelID.endsWith("-high")
}

export function getThinkingConfig(
  providerID: string,
  modelID: string
): Record<string, unknown> | null {
  // Skip config if already high variant
  if (isAlreadyHighVariant(modelID)) return null

  const config = THINKING_CONFIGS[providerID]
  const capablePatterns = THINKING_CAPABLE_MODELS[providerID]

  // Return null if provider not supported
  if (!config || !capablePatterns) return null

  // Check if model name contains capable model pattern
  const modelLower = modelID.toLowerCase()
  const isCapable = capablePatterns.some((pattern) =>
    modelLower.includes(pattern.toLowerCase())
  )

  return isCapable ? config : null
}
```

### Type Definitions
```typescript
// src/hooks/think-mode/types.ts:1-22
export interface ThinkModeState {
  requested: boolean                    // Was think mode requested?
  modelSwitched: boolean                // Did we switch model?
  thinkingConfigInjected: boolean       // Did we inject config?
  providerID?: string                   // Original provider (for tracking)
  modelID?: string                      // Original model (for tracking)
}

export interface ModelRef {
  providerID: string                    // e.g., "anthropic", "google"
  modelID: string                       // e.g., "claude-sonnet-4-5"
}

export interface MessageWithModel {
  model?: ModelRef
}

export interface ThinkModeInput {
  parts: Array<{ type: string; text?: string }>  // Message parts (text, images, etc)
  message: MessageWithModel                        // Message with model ref
}
```

## Implementation Details

### Event Handlers & Lifecycle
- **`chat.params` hook:** Runs before every message, intercepts and modifies message parameters (model, config)
- **`event` listener:** Catches `session.deleted` events to clean up per-session state map

### State Management
- **Per-session storage:** Map<sessionID, ThinkModeState> tracks activation per session
- **State lifecycle:** Created on each message, persists until session deletion
- **No cleanup on disable:** State removed only when session ends (could persist across multiple messages)

### API Usage
- **Message model mutation:** Directly modifies `output.message.model` to swap model ID
- **Config injection:** Uses `Object.assign()` to merge thinking config into message object
- **Provider-specific:** Each provider (Anthropic, Google, Amazon Bedrock) has different config structure

### Key Configuration
```typescript
// Thinking budget allocation per provider
{
  anthropic: {
    budgetTokens: 64000,      // 64K for extended thinking
    maxTokens: 128000,        // 128K total output
  },
  "amazon-bedrock": {
    budgetTokens: 32000,      // 32K for reasoning
    maxTokens: 64000,         // 64K total
  },
  google: {
    thinkingLevel: "HIGH",    // Enum: HIGH, MEDIUM, etc
  },
}
```

## Key Patterns

### Pattern 1: Pre-hook Message Mutation
- Hook receives message object before sending
- Modifies nested properties (model ID, thinking config) in-place
- Changes applied transparently to downstream API calls

### Pattern 2: Multi-step Detection
- Extract → Filter → Detect → Act (each step can exit early)
- Code filtering prevents false positives in code snippets
- Case-insensitive matching supports all languages uniformly

### Pattern 3: Provider Abstraction
- Single keyword triggers different actions per provider
- Provider config maps are separate from model mappings
- Capability check prevents invalid config injection

### Pattern 4: State Tracking with Cleanup
- Session-scoped state map (not message-scoped)
- Cleanup on session.deleted event (not on individual message end)
- Allows tracking behavior across multiple messages in session

**Problem: Tight coupling to provider config structures**
- Config objects must match exact provider API expectations (Anthropic vs Google differ)
- Adding new provider requires manual config entry + capability list
- No validation that injected config is valid

**Problem: Keyword dictionary maintenance**
- 30+ languages hardcoded in detector, difficult to update globally
- No mechanism to add custom keywords per instance
- Regex patterns compiled on every import (minor performance impact)

## Adaptation Strategy

### What to Keep
- **Keyword detection pattern:** Multi-language regex approach is solid
- **Code filtering:** Prevents false positives in code-heavy conversations
- **Provider abstraction:** Separate configs for different providers (Anthropic, Google, etc)
- **Session-scoped state:** Tracks activations per conversation session
- **Hook entry point:** `chat.params` intercepts at right moment before API call

### What to Simplify
- **Model mapping:** Hard-coded map works but doesn't scale; consider config-driven approach
- **Provider configs:** Could use JSON config files instead of TypeScript objects
- **Multilingual keywords:** Could be externalized or crowdsourced for easier updates
- **Capability checking:** Simple string pattern matching; could be more robust validation

### Configuration
```typescript
{
  enabled: true,
  
  // Keywords to trigger think mode
  keywords: {
    english: ["think", "reason", "analyze", "ultrathink"],
    multilingual: true,  // Enable 30+ language support
  },
  
  // Model switching behavior
  modelSwitching: {
    enabled: true,
    // Model variant mapping (standard → high-reasoning)
    variantMap: {
      "claude-sonnet-4-5": "claude-sonnet-4-5-high",
      // ... add more or load from external config
    },
  },
  
  // Provider-specific thinking configs
  thinkingConfigs: {
    anthropic: {
      budgetTokens: 64000,
      maxTokens: 128000,
    },
    google: {
      thinkingLevel: "HIGH",
    },
    // ... more providers
  },
  
  // Minimum thinking capability patterns per provider
  thinkingCapableModels: {
    anthropic: ["claude-sonnet-4", "claude-opus-4"],
    google: ["gemini-2", "gemini-3"],
  },
  
  // Session cleanup
  cleanup: {
    enabled: true,
    onSessionDeleted: true,
  },
}
```

## Implementation Checklist

- [ ] Copy `/repos/oh-my-opencode/src/hooks/think-mode/` to your hooks directory
- [ ] Register hook in hook factory (`createThinkModeHook()` returns hook object)
- [ ] Verify `chat.params` hook is supported in your framework (OpenCode requirement)
- [ ] Externalize `HIGH_VARIANT_MAP` to config file or env (don't hardcode model mappings)
- [ ] Externalize `THINKING_CONFIGS` to provider config (each provider different structure)
- [ ] Update `THINKING_CAPABLE_MODELS` patterns for your supported model versions
- [ ] Add logging integration (replace `log()` calls with your logger)
- [ ] Test multilingual keyword detection with non-English prompts
- [ ] Test state cleanup: verify `session.deleted` event handler fires correctly
- [ ] Add tests for code-block filtering (should NOT trigger on `code with think in it`)
- [ ] Monitor token usage: verify `budgetTokens` settings don't exceed provider limits

# Log
- 2025-12-16: Created comprehensive implementation guide from oh-my-opencode think-mode hook
- 2025-12-16: Analyzed 4 source files, documented patterns, provided adaptation strategy
