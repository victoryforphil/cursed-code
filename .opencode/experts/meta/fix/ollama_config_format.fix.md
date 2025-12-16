# Fix: Ollama Provider Configuration Format

## Problem
Initially configured Ollama models using an incorrect `modelProviders` key:

```json
{
  "modelProviders": {
    "qwen-coder": {
      "provider": "ollama",
      "model": "qwen2.5-coder:32b"
    }
  }
}
```

This caused OpenCode configuration validation errors because `modelProviders` is not a valid top-level key.

## Root Cause
Misunderstanding of OpenCode's config schema. Local model providers like Ollama are configured within the `provider` object, not in a separate `modelProviders` key.

## Solution
Use the correct schema format with `provider.ollama.models`:

```json
{
  "provider": {
    "ollama": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Ollama (local)",
      "options": {
        "baseURL": "http://localhost:11434/v1"
      },
      "models": {
        "qwen2.5-coder:32b": {
          "name": "Qwen 2.5 Coder 32B",
          "description": "Best coding model (HumanEval 79-82%)"
        },
        "deepseek-r1:32b": {
          "name": "DeepSeek R1 32B",
          "description": "Best reasoning model (GSM8K 93.2%)"
        },
        "llama3-groq-tool-use:8b": {
          "name": "Llama 3 Groq Tool Use 8B",
          "description": "Best function calling (BFCL 89%)"
        }
      }
    }
  },
  "model": "ollama/qwen2.5-coder:32b"
}
```

## Files Updated
1. `.opencode/opencode.json` - Migrated to correct format
2. `.opencode/scripts/sync-models` - Updated to write to `provider.ollama.models`
3. `.opencode/experts/meta/wiki/opencode_config.wiki.md` - Added Ollama example
4. `.opencode/experts/local_models/wiki/ollama_usage.wiki.md` - Documented correct format

## Key Learnings
- **Always use `provider.<provider-name>`** for provider configurations
- **Models go in `provider.<name>.models`** as a map of `model-id` → `{name, description}`
- **Never create custom top-level keys** - stick to the schema
- **Reference the official docs** at `.opencode/experts/meta/docs/opencode_providers_full.md`

## Prevention
- Updated wiki files with correct examples
- Added warning in local_models wiki about NOT using `modelProviders`
- sync-models script now uses correct format

## Related
- Commit: c340bb0 (Config // Fix OpenCode provider.ollama format)
- See: `.opencode/experts/meta/wiki/opencode_config.wiki.md`
- See: `.opencode/experts/local_models/wiki/ollama_usage.wiki.md`

# Log
- 2024-12-16: Documented fix for incorrect provider configuration format
