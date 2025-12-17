# OpenCode Model Keys Reference

## OpenCode Models (opencode/*)
- `opencode/big-pickle` - Large context model
- `opencode/gpt-5-nano` - Fast small model
- `opencode/grok-code` - Code-specialized model

## GitHub Copilot Models (github-copilot/*)

### Claude Family
- `github-copilot/claude-haiku-4.5` - Fast, cheap
- `github-copilot/claude-sonnet-4` - Balanced
- `github-copilot/claude-sonnet-4.5` - Enhanced balanced
- `github-copilot/claude-3.5-sonnet` - Previous gen balanced
- `github-copilot/claude-3.7-sonnet` - Enhanced previous gen
- `github-copilot/claude-3.7-sonnet-thought` - With extended thinking
- `github-copilot/claude-opus-4` - Most capable
- `github-copilot/claude-opus-4.5` - Enhanced most capable
- `github-copilot/claude-opus-41` - Latest opus

### GPT Family
- `github-copilot/gpt-5-mini` - Fast small
- `github-copilot/gpt-4o` - Omni model
- `github-copilot/gpt-4.1` - GPT-4 enhanced
- `github-copilot/gpt-5` - GPT-5 base
- `github-copilot/gpt-5.1` - GPT-5 enhanced
- `github-copilot/gpt-5.2` - GPT-5 latest
- `github-copilot/gpt-5-codex` - Code-specialized
- `github-copilot/gpt-5.1-codex` - Enhanced code
- `github-copilot/gpt-5.1-codex-max` - Maximum code capability
- `github-copilot/gpt-5.1-codex-mini` - Fast code

### Gemini Family
- `github-copilot/gemini-2.0-flash-001` - Fast multimodal
- `github-copilot/gemini-2.5-pro` - Pro model
- `github-copilot/gemini-3-pro-preview` - Latest preview

### Reasoning Models
- `github-copilot/o3` - Reasoning model
- `github-copilot/o3-mini` - Fast reasoning
- `github-copilot/o4-mini` - Latest fast reasoning

### Other
- `github-copilot/grok-code-fast-1` - Fast code model
- `github-copilot/oswe-vscode-prime` - VS Code optimized

## Ollama Models (ollama/*)

### DeepSeek R1 (Reasoning)
- `ollama/deepseek-r1:1.5b` - Tiny (1.1 GB)
- `ollama/deepseek-r1:8b` - Small (5.2 GB)
- `ollama/deepseek-r1:14b` - Medium (9.0 GB)
- `ollama/deepseek-r1:32b` - Large (19 GB) **[Recommended for reasoning]**

### Qwen 3 (General)
- `ollama/qwen3:0.6b` - Tiny (522 MB)
- `ollama/qwen3:8b` - Small (5.2 GB)
- `ollama/qwen3:14b` - Medium (9.3 GB)

### Qwen 2.5 Coder (Coding)
- `ollama/qwen2.5-coder:1.5b` - Tiny (986 MB)
- `ollama/qwen2.5-coder:32b` - Large (19 GB) **[Recommended for coding]**

### Qwen 3 Coder (Latest Coding)
- `ollama/qwen3-coder:30b` - Large (18 GB)

### Gemma 3 (Google)
- `ollama/gemma3:1b` - Tiny (815 MB)
- `ollama/gemma3:4b` - Small (3.3 GB)

### Llama
- `ollama/llama3-groq-tool-use:8b` - Tool calling (4.7 GB) **[Recommended for tools]**
- `ollama/llama2-uncensored:7b` - Uncensored (3.8 GB)

### Other
- `ollama/mistral-small:22b` - Mistral medium (12 GB)
- `ollama/neural-chat:7b` - Chat optimized (4.1 GB)
- `ollama/gpt-oss:20b` - Open source GPT (13 GB)

## Recommended Models by Use Case

### Fast & Cheap
- `claude-haiku-4.5` - GitHub Copilot fast
- `ollama/qwen3:8b` - Local fast general
- `ollama/qwen2.5-coder:1.5b` - Local fast coding

### Balanced
- `claude-sonnet-4.5` - GitHub Copilot balanced
- `ollama/qwen2.5-coder:32b` - Local balanced coding

### Maximum Capability
- `claude-opus-4.5` - GitHub Copilot most capable
- `gpt-5.2` - Latest GPT
- `ollama/deepseek-r1:32b` - Local reasoning

### Coding Specialized
- `grok-code` - OpenCode code model
- `gpt-5.1-codex-max` - GitHub Copilot max code
- `ollama/qwen2.5-coder:32b` - Local coding

### Tool Calling
- `ollama/llama3-groq-tool-use:8b` - Best local tool calling

### Reasoning
- `o3` - GitHub Copilot reasoning
- `ollama/deepseek-r1:32b` - Local reasoning

## Model Selection Guide

1. **For subagents (cheap/fast):** Use `claude-haiku-4.5` or `ollama/qwen3:8b`
2. **For coding tasks:** Use `grok-code` or `ollama/qwen2.5-coder:32b`
3. **For reasoning/planning:** Use `ollama/deepseek-r1:32b`
4. **For tool calling:** Use `ollama/llama3-groq-tool-use:8b`
5. **For maximum capability:** Use `claude-opus-4.5` or `gpt-5.2`

## Model Key Format

Models use the format: `provider/model`

- **opencode/*** - OpenCode-provided models (via GitHub Copilot)
- **github-copilot/*** - GitHub Copilot models (cloud API)
- **ollama/*** - Local Ollama models

## Common Errors

### ProviderModelNotFoundError

This means the model key is invalid. Check:
1. Model exists in list above
2. Format is correct (`provider/model`)
3. For ollama models, check they're installed: `ollama list`

### Example Fixes
- ❌ `anthropic/claude-sonnet-4-5` → ✅ `claude-sonnet-4.5`
- ❌ `claude-sonnet-4.5` (without provider when required) → ✅ `github-copilot/claude-sonnet-4.5`
- ❌ `qwen2.5-coder:32b` → ✅ `ollama/qwen2.5-coder:32b`

# Log
- 2024-12-16: Created model reference from `opencode models` output
