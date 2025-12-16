# Agentic SWE Models for M1 Max 32GB

Quick reference for selecting local models optimized for **agentic software engineering and IT tasks** on M1 Max 32GB with Ollama.

**Research Date:** December 2025  
**Focus:** Tool calling, instruction following, code generation, reasoning

---

## Selection Matrix by Tier

### Small Tier (1-3B) - Fast & Lightweight

| Model | Ollama Tag | Size | Context | Tool Use | Code | Speed | Notes |
|-------|------------|------|---------|----------|------|-------|-------|
| **Qwen3 0.6B** | `qwen3:0.6b` | 523MB | 40K | Yes | Fair | 50+ t/s | Ultra-light, thinking mode |
| **Qwen2.5-Coder 1.5B** | `qwen2.5-coder:1.5b` | 1.0GB | 32K | Yes | Good | 40+ t/s | Best tiny coder |
| Phi4-Mini | `phi4-mini:3.8b` | 2.5GB | 128K | Yes | Good | 30+ t/s | MS, strong reasoning |
| SmolLM2 1.7B | `smollm2:1.7b` | 1.8GB | 8K | Yes | Fair | 40+ t/s | Edge deployment |
| Granite 2B | `granite3.3:2b` | 1.5GB | 128K | Yes | Good | 35+ t/s | IBM, FIM support |

**Best Pick:** `qwen2.5-coder:1.5b` for coding, `qwen3:0.6b` for general

---

### Medium Tier (7-8B) - Balanced

| Model | Ollama Tag | Size | Context | Tool Use | Code | Speed | Notes |
|-------|------------|------|---------|----------|------|-------|-------|
| **Llama3-Groq-Tool-Use** | `llama3-groq-tool-use:8b` | 4.7GB | 8K | **Best** | Good | 20-28 t/s | BFCL 89%, tool specialist |
| **Qwen3 8B** | `qwen3:8b` | 5.2GB | 40K | Excellent | Good | 18-25 t/s | Ollama's recommended tool model |
| Qwen2.5-Coder 7B | `qwen2.5-coder:7b` | 4.7GB | 32K | Yes | Excellent | 18-25 t/s | Code specialist |
| Granite 8B | `granite3.3:8b` | 4.9GB | 128K | Good | Good | 15-22 t/s | IBM, thinking mode |
| Ministral 8B | `ministral-3:8b` | 6.0GB | 256K | Excellent | Good | 15-20 t/s | Vision + tools, edge-optimized |
| DeepSeek-R1 8B | `deepseek-r1:8b` | 5.2GB | 128K | Fair | Good | 15-20 t/s | Reasoning focus |

**Best Picks:** 
- **Tool Calling:** `llama3-groq-tool-use:8b` (specialist)
- **General Agentic:** `qwen3:8b` (balanced, Ollama recommended)
- **Coding:** `qwen2.5-coder:7b` (code specialist)

---

### Large Tier (14-15B) - More Capable

| Model | Ollama Tag | Size | Context | Tool Use | Code | Speed | Notes |
|-------|------------|------|---------|----------|------|-------|-------|
| **Qwen3 14B** | `qwen3:14b` | 9.3GB | 40K | Excellent | Good | 12-18 t/s | Dense, thinking mode |
| **Qwen2.5-Coder 14B** | `qwen2.5-coder:14b` | 9.0GB | 32K | Yes | Excellent | 12-18 t/s | Strong coder |
| Ministral 14B | `ministral-3:14b` | 9.1GB | 256K | Excellent | Good | 10-15 t/s | Vision + tools |
| DeepSeek-R1 14B | `deepseek-r1:14b` | 9.0GB | 128K | Fair | Good | 10-15 t/s | Reasoning traces |
| Phi4 14B | `phi4:14b` | 8.5GB | 16K | Fair | Excellent | 10-15 t/s | MS, reasoning dense |

**Best Picks:**
- **General Agentic:** `qwen3:14b` (balanced, tool use + reasoning)
- **Coding:** `qwen2.5-coder:14b` (code specialist)
- **Vision + Tools:** `ministral-3:14b` (new, multimodal)

---

### XL Tier (30-32B) - Maximum Capability

| Model | Ollama Tag | Size | Context | Tool Use | Code | Speed | Notes |
|-------|------------|------|---------|----------|------|-------|-------|
| **Qwen3-Coder 30B** | `qwen3-coder:30b` | 19GB | 256K | Excellent | **Best** | 8-12 t/s | MoE 3.3B active, SWE-Bench optimized |
| **Devstral 24B** | `devstral:24b` | 14GB | 128K | **Best** | Excellent | 10-14 t/s | #1 open SWE-Bench (46.8%) |
| Qwen2.5-Coder 32B | `qwen2.5-coder:32b` | 20GB | 32K | Yes | Excellent | 8-12 t/s | Dense, proven |
| Qwen3 32B | `qwen3:32b` | 20GB | 40K | Excellent | Good | 8-10 t/s | Dense, thinking mode |
| DeepSeek-R1 32B | `deepseek-r1:32b` | 20GB | 128K | Fair | Good | 6-8 t/s | Best reasoning |
| Mistral-Small 22B | `mistral-small:22b` | 12.6GB | 32K | Good | Good | 10-14 t/s | Balanced |
| Nemotron-3-Nano 30B | `nemotron-3-nano:30b` | 24GB | 1M | Excellent | Good | 6-10 t/s | NEW: NVIDIA, hybrid MoE, BFCL 53.8% |

**Best Picks:**
- **Agentic SWE:** `devstral:24b` (purpose-built for agents, SWE-Bench #1)
- **Coding:** `qwen3-coder:30b` (MoE, long context, SWE-optimized)
- **Reasoning:** `deepseek-r1:32b` (thinking traces, chain-of-thought)
- **General:** `qwen2.5-coder:32b` (proven, dense model)

---

## Tool Calling Assessment

### Tier 1: Excellent Tool Use
Models with native, reliable function calling:

| Model | BFCL Score | Notes |
|-------|------------|-------|
| `llama3-groq-tool-use:8b` | 89.06% | #3 globally, specialist training |
| `qwen3:8b/14b/32b` | ~85-90%* | Ollama recommended, think mode |
| `devstral:24b` | Excellent | SWE-agent optimized |
| `nemotron-3-nano:30b` | 53.8%** | BFCL v4, hybrid MoE |
| `ministral-3` | Excellent | Native function calling + JSON |

*Estimated from Ollama docs showcasing Qwen3 for tools  
**BFCL v4 is harder than v3

### Tier 2: Good Tool Use
Can use tools but not specialized:

- `qwen2.5-coder` series - Tools work, not primary focus
- `granite3.3` series - Function calling supported
- `hermes3` series - Tool capable
- `command-r` series - Tools enabled

### Tier 3: Limited Tool Use
Reasoning models with tool support as secondary:

- `deepseek-r1` series - Reasoning first, tools second
- `phi4` series - Can do tools, not optimized

---

## Specific Recommendations

### For OpenCode / Agentic Coding Assistants

**Primary Model (execution):**
```bash
ollama pull devstral:24b  # Best open SWE model, 14GB
# OR
ollama pull qwen3-coder:30b  # Best long-context coder, 19GB
```

**Tool Specialist (fast function calls):**
```bash
ollama pull llama3-groq-tool-use:8b  # 4.7GB, can run alongside 30B
```

**Reasoning (planning, debugging):**
```bash
ollama pull deepseek-r1:32b  # Or qwen3:14b for faster
```

### Multi-Model Strategy (Recommended)

| Role | Model | Memory | Purpose |
|------|-------|--------|---------|
| Planner | `deepseek-r1:14b` | 9GB | Break down tasks, reasoning |
| Coder | `qwen3-coder:30b` | 19GB | Implementation, code gen |
| Tool Executor | `llama3-groq-tool-use:8b` | 4.7GB | Function calls, fast actions |

**Note:** Run one at a time, swap as needed. Ollama auto-unloads after 5min.

### Single-Model Strategy (Simpler)

If you want one model that does everything reasonably well:

```bash
# Best all-around agentic SWE model
ollama pull devstral:24b

# OR for longer context (256K)
ollama pull qwen3-coder:30b

# OR for proven reliability
ollama pull qwen2.5-coder:32b
```

---

## New Models to Watch (Dec 2025)

### Just Released
- **Nemotron-3-Nano 30B** - NVIDIA, hybrid MoE, 1M context, strong agentic
- **Ministral-3** family - Vision + tools, 256K context, edge-optimized
- **Qwen3-Coder 30B** - MoE with SWE-Bench optimization, 256K context
- **Devstral 2 (123B)** - Cloud only, even better SWE performance

### Coming Soon
- Llama 4 improvements (vision + tools)
- DeepSeek-V3.2 local versions
- Qwen3.5 series

---

## Memory Budget Quick Reference

| Model Size | Memory (Q4_K_M) | Context Budget | Fits with |
|------------|-----------------|----------------|-----------|
| 8B | 4-5GB | 32K+ | Can run 2-3 models |
| 14B | 9GB | 16-32K | Can run with 8B |
| 24B (Devstral) | 14GB | 128K | Best XL efficiency |
| 30B (MoE) | 18-19GB | 32K | Solo use |
| 32B (Dense) | 19-20GB | 16K | Solo use |

**Total budget:** ~22-24GB safe for M1 Max 32GB with system overhead.

---

## Performance Tips for Agentic Use

### Enable Optimizations
```bash
export OLLAMA_FLASH_ATTENTION=1        # 20-30% memory savings
export OLLAMA_KV_CACHE_TYPE=q8_0      # 50% KV cache reduction
```

### For Tool Calling
- Use temperature 0.1-0.3 for reliable JSON output
- Prefer models with native tool training (Groq, Qwen3, Devstral)
- Test tool schemas before production use

### For Code Generation
- Use temperature 0.2-0.5 for predictable code
- Prefer code-specialized models over general
- qwen2.5-coder and qwen3-coder have best multi-language support

### For Reasoning/Planning
- Enable thinking mode where available (`think=True`)
- DeepSeek-R1 shows reasoning traces
- Qwen3 supports toggling thinking on/off

---

## Ollama Tags to Pull

### Essential Kit (Recommended Starting Point)
```bash
# Agentic coder - best SWE-Bench
ollama pull devstral:24b

# Tool specialist - fast, reliable
ollama pull llama3-groq-tool-use:8b

# Reasoning - planning, debugging
ollama pull deepseek-r1:14b
```

### Alternative: All-In-One
```bash
# Single model that does it all
ollama pull qwen3-coder:30b
```

### Alternative: Memory-Constrained
```bash
# If 32B is too heavy
ollama pull qwen3:14b
ollama pull qwen2.5-coder:7b
```

---

## Benchmark Comparison

### SWE-Bench Verified (Agentic Coding)

| Model | Score | Scaffold |
|-------|-------|----------|
| Devstral 24B | **46.8%** | OpenHands |
| Claude 3.5 Haiku | 40.6% | Anthropic |
| SWE-smith-LM 32B | 40.2% | SWE-agent |
| Nemotron-3-Nano 30B | 38.8% | OpenHands |
| GPT-4.1-mini | 23.6% | OpenAI |
| Qwen3-30B | 22.0% | OpenHands |

### LiveCodeBench (Code Execution)

| Model | Score |
|-------|-------|
| Nemotron-3-Nano 30B | 68.3% |
| Qwen3-30B | 66.0% |
| GPT-OSS-20B | 61.0% |

### BFCL (Function Calling)

| Model | v3 Score | v4 Score |
|-------|----------|----------|
| Llama3-Groq-Tool-Use 8B | 89.06% | - |
| Nemotron-3-Nano 30B | - | 53.8% |
| Qwen3-30B | - | 46.4% |

---

# Log
- 2025-12-16: Created comprehensive agentic SWE models guide
- 2025-12-16: Added new models: Nemotron-3-Nano, Ministral-3, Qwen3-Coder
- 2025-12-16: Organized by tier with specific recommendations
