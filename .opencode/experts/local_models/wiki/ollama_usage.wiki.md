# Ollama Usage Guide

Quick reference for common Ollama commands and workflows.

## Installation
```bash
# macOS (native, DO NOT use Docker!)
brew install ollama
# OR download from https://ollama.com
```

## Essential Commands

### List Models
```bash
ollama list
```

### Download/Pull Model
```bash
ollama pull qwen2.5-coder:32b
ollama pull deepseek-r1:32b
ollama pull llama3-groq-tool-use:8b
```

### Run Model
```bash
# Interactive mode
ollama run qwen2.5-coder:32b

# One-shot
ollama run qwen2.5-coder:32b "Write a Python function for fibonacci"
```

### Delete Model
```bash
ollama rm model-name:tag
```

### Show Model Info
```bash
ollama show qwen2.5-coder:32b
ollama show qwen2.5-coder:32b --modelfile  # View Modelfile
```

### Stop Running Model
```bash
ollama stop qwen2.5-coder:32b
```

## Environment Variables

### Required for M1 Max 32GB
```bash
export OLLAMA_FLASH_ATTENTION=1        # 20-30% memory savings
export OLLAMA_KV_CACHE_TYPE=q8_0      # 50% KV cache reduction
export OLLAMA_CONTEXT_LENGTH=32000    # Extended context
```

### Optional
```bash
export OLLAMA_DEBUG=1                  # Debug mode
export OLLAMA_HOST=127.0.0.1:11434    # API host (default)
export OLLAMA_MODELS=/path/to/models  # Custom model directory
export OLLAMA_KEEP_ALIVE=5m           # Keep model loaded (default 5m)
export OLLAMA_NUM_PARALLEL=4          # Parallel requests
```

## API Usage

### REST API (localhost:11434)
```bash
# Generate completion
curl http://localhost:11434/api/generate -d '{
  "model": "qwen2.5-coder:32b",
  "prompt": "Write a function"
}'

# Chat API
curl http://localhost:11434/api/chat -d '{
  "model": "qwen2.5-coder:32b",
  "messages": [
    {"role": "user", "content": "Hello"}
  ]
}'

# List models
curl http://localhost:11434/api/tags
```

## Model Naming Convention
```
model-name:version-size-quantization

Examples:
- qwen2.5-coder:32b           # Default quantization (Q4_K_M)
- qwen2.5-coder:32b-q5        # Q5 quantization
- deepseek-r1:14b             # 14B parameter version
- llama3-groq-tool-use:8b     # 8B parameter version
```

## Quantization Levels
| Level | Quality | Speed | Use When |
|-------|---------|-------|----------|
| Q4_K_M | 97% | Fastest | Default (best balance) |
| Q5_K_M | 98.2% | 20% slower | Need extra quality |
| Q6_K | 99% | 40% slower | Critical accuracy |
| Q8_0 | 99.5% | 60% slower | Maximum quality |

## Creating Custom Modelfiles

### Basic Modelfile
```modelfile
FROM qwen2.5-coder:32b

# Set parameters
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER num_ctx 32000

# System prompt
SYSTEM You are a helpful coding assistant specialized in Python.
```

### Create from Modelfile
```bash
ollama create my-custom-model -f ./Modelfile
ollama run my-custom-model
```

## Common Workflows

### Test Model Performance
```bash
# Check speed
time ollama run qwen2.5-coder:32b "Count to 100"

# Check memory
ollama ps  # Shows running models and memory usage
```

### Switch Between Models
```bash
# Models auto-unload after 5 minutes
ollama run qwen2.5-coder:32b "code task"
ollama run deepseek-r1:32b "reasoning task"
ollama run llama3-groq-tool-use:8b "function call"
```

### Check GPU Offloading (M1)
```bash
OLLAMA_DEBUG=1 ollama run qwen2.5-coder:32b "test"
# Look for: "offloading X layers to GPU"
# Good: X = 30+, Bad: X = 0
```

## Troubleshooting

### Not Enough Memory
```bash
# Enable optimizations
export OLLAMA_FLASH_ATTENTION=1
export OLLAMA_KV_CACHE_TYPE=q8_0

# Use smaller quantization
ollama pull qwen2.5-coder:32b  # Q4_K_M instead of Q5_K_M
```

### Slow Performance
```bash
# Check if using GPU
OLLAMA_DEBUG=1 ollama run model:tag

# Close other apps
# Reduce context length
export OLLAMA_CONTEXT_LENGTH=8000
```

### Model Won't Load
```bash
# Stop all models
ollama ps  # List running
ollama stop model-name:tag

# Clear cache
rm -rf ~/.ollama/cache/*  # Careful!
```

## Best Practices

1. **Use Q4_K_M for default** - Best speed/quality trade-off
2. **Enable Flash Attention** - Always, 20-30% memory savings
3. **Close other apps** - For 32B models, free up memory
4. **Keep context reasonable** - 8K-32K is optimal for M1 Max
5. **Use native macOS** - Never Docker (no GPU support)
6. **Monitor memory** - `ollama ps` shows usage
7. **Swap models efficiently** - Let auto-unload handle it

## Integration with OpenCode

### Add Ollama provider to opencode.json

**Correct format** (models go in `provider.ollama.models`):
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
          "description": "Best coding model"
        },
        "deepseek-r1:32b": {
          "name": "DeepSeek R1 32B",
          "description": "Best reasoning model"
        },
        "llama3-groq-tool-use:8b": {
          "name": "Llama 3 Groq Tool Use 8B",
          "description": "Best function calling"
        }
      }
    }
  },
  "model": "ollama/qwen2.5-coder:32b"
}
```

**Important**: Do NOT use `modelProviders` - that's not valid. Models must be defined within `provider.ollama.models`.

### Auto-sync with script
```bash
./.opencode/scripts/sync-models
```

This automatically updates your config with installed Ollama models.

### Use in agents
Set the model in agent frontmatter:
```markdown
---
model: ollama/qwen2.5-coder:32b
---
```

Or in agent config:
```json
{
  "agent": {
    "my-agent": {
      "model": "ollama/deepseek-r1:32b"
    }
  }
}
```

## Performance Notes for M1 Max 32GB

| Model | Memory | Speed | Concurrent |
|-------|--------|-------|------------|
| 8B Q4_K_M | 4-5GB | 20-28 t/s | ✅ Can run with 32B |
| 14B Q4_K_M | 9-10GB | 12-18 t/s | ✅ Can run with 8B |
| 32B Q4_K_M | 18-20GB | 8-12 t/s | ⚠️ Close other apps |
| 70B Q4_K_M | 30GB | 3-5 t/s | ❌ Too tight |

# Log
- 2024-12-16: Created comprehensive Ollama usage guide
- 2024-12-16: Fixed OpenCode config format - use provider.ollama.models, NOT modelProviders
