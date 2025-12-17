# Model Favorites - Quick Reference

Curated list of preferred models for different use cases. For comprehensive details, see [`.opencode/experts/meta/wiki/opencode_models.wiki.md`](../.opencode/experts/meta/wiki/opencode_models.wiki.md).

## Quick Selection Guide

| Use Case | Cloud (GitHub Copilot) | Local (Ollama) |
|----------|------------------------|----------------|
| **Fast & Cheap** | `github-copilot/claude-haiku-4.5` | `ollama/qwen3:8b` |
| **Balanced** | `github-copilot/claude-sonnet-4.5` | `ollama/qwen2.5-coder:32b` |
| **Maximum Power** | `github-copilot/claude-opus-4.5` | `ollama/deepseek-r1:32b` |
| **Coding** | `opencode/grok-code` (free!) | `ollama/qwen2.5-coder:32b` |
| **Reasoning** | `github-copilot/o3` | `ollama/deepseek-r1:32b` |
| **Tool Calling** | `github-copilot/claude-haiku-4.5` | `ollama/llama3-groq-tool-use:8b` |

## Cloud Models (GitHub Copilot)

### OpenCode Free Models
- **`opencode/grok-code`** - Fast code model, **FREE**, simple tasks
- **`opencode/gpt-5-nano`** - Fast small model, **FREE**

### Claude Family (Anthropic)
- **`github-copilot/claude-haiku-4.5`** ⭐ - Fast, cheap, great for subagents
- **`github-copilot/claude-sonnet-4.5`** ⭐ - Balanced quality/speed, daily driver
- **`github-copilot/claude-opus-4.5`** - Most capable, use sparingly

### GPT Family (OpenAI)
- **`github-copilot/gpt-5-mini`** - Fast small
- **`github-copilot/gpt-5.2`** - Latest GPT-5
- **`github-copilot/gpt-5.1-codex-max`** - Maximum coding capability
- **`github-copilot/gpt-5.1-codex-mini`** - Fast coding

### Reasoning Models
- **`github-copilot/o3`** - Deep reasoning
- **`github-copilot/o4-mini`** - Fast reasoning

## Local Models (Ollama)

### Installed on M1 Max 32GB

#### Coding (Primary: Qwen 2.5 Coder)
- **`ollama/qwen2.5-coder:32b`** ⭐ (19 GB) - Best local coding, detailed in [`models/qwen2.5-coder-32b.md`](./qwen2.5-coder-32b.md)
- **`ollama/qwen3-coder:30b`** (18 GB) - Latest Qwen coder
- `ollama/qwen2.5-coder:1.5b` (986 MB) - Fast coding

#### Reasoning (Primary: DeepSeek R1)
- **`ollama/deepseek-r1:32b`** ⭐ (19 GB) - Best local reasoning, detailed in [`models/deepseek-r1-32b.md`](./deepseek-r1-32b.md)
- `ollama/deepseek-r1:14b` (9.0 GB) - Medium reasoning
- `ollama/deepseek-r1:8b` (5.2 GB) - Fast reasoning
- `ollama/deepseek-r1:1.5b` (1.1 GB) - Tiny reasoning

#### Tool Calling
- **`ollama/llama3-groq-tool-use:8b`** ⭐ (4.7 GB) - Best local tool calling, detailed in [`models/llama3-groq-tool-use-8b.md`](./llama3-groq-tool-use-8b.md)

#### General Purpose
- **`ollama/qwen3:8b`** ⭐ (5.2 GB) - Fast general tasks
- `ollama/qwen3:14b` (9.3 GB) - Balanced general
- `ollama/qwen3:0.6b` (522 MB) - Tiny general

#### Specialized
- `ollama/mistral-small:22b` (12 GB) - Mistral medium
- `ollama/neural-chat:7b` (4.1 GB) - Chat optimized
- `ollama/llama2-uncensored:7b` (3.8 GB) - Uncensored responses
- `ollama/gpt-oss:20b` (13 GB) - Open source GPT
- `ollama/gemma3:4b` (3.3 GB) - Google small
- `ollama/gemma3:1b` (815 MB) - Google tiny

## Agent Configuration Examples

### Fast Subagent (Cloud)
```json
{
  "model": "github-copilot/claude-haiku-4.5",
  "temperature": 0.2
}
```

### Fast Subagent (Local)
```json
{
  "provider": "ollama",
  "model": "qwen3:8b",
  "temperature": 0.2
}
```

### Coding Agent (Local)
```json
{
  "provider": "ollama",
  "model": "qwen2.5-coder:32b",
  "temperature": 0.1
}
```

### Reasoning Agent (Local)
```json
{
  "provider": "ollama",
  "model": "deepseek-r1:32b",
  "temperature": 0.3
}
```

### Tool-Heavy Agent (Local)
```json
{
  "provider": "ollama",
  "model": "llama3-groq-tool-use:8b",
  "temperature": 0.2
}
```

## Cost/Speed/Quality Tradeoffs

### Cloud Models
- **Free tier** (`opencode/*`) - Use for simple, frequent tasks
- **Haiku** - ~$0.003/1K tokens, 10x faster than Opus, 80% quality
- **Sonnet** - ~$0.015/1K tokens, balanced, daily driver
- **Opus** - ~$0.075/1K tokens, slowest, best quality

### Local Models (M1 Max 32GB)
- **Tiny (<2GB)** - Ultra fast, limited capability, multi-instance capable
- **Small (4-10GB)** - Fast, good for subagents and quick tasks
- **Large (18-19GB)** - Best quality, slower, use 1-2 at a time
- **Tool calling** - llama3-groq-tool-use best, others struggle with complex tools

### Memory Constraints
- Can run 1-2 large models (32B) simultaneously
- Or 3-4 small models (8B) simultaneously
- Mix and match based on workload

## When to Use What

### Use Cloud (GitHub Copilot)
- ✅ Need absolute best quality (Opus)
- ✅ Simple frequent tasks (OpenCode free models)
- ✅ Multimodal tasks (Gemini, GPT-4o)
- ✅ Need latest features

### Use Local (Ollama)
- ✅ Cost-sensitive workloads
- ✅ Privacy-sensitive data
- ✅ High-volume tasks
- ✅ Offline work
- ✅ Experimentation

## Model Updates

To sync Ollama models to OpenCode config:
```bash
.opencode/scripts/sync-models
```

To see installed models:
```bash
ollama list
```

# Log
- 2025-12-16: Created curated favorites list with practical selection guide
