# Quick Start Guide: Local Models on M1 Max 32GB

**Last Updated:** December 16, 2025

---

## TL;DR

**Best Model:** Qwen2.5-Coder-32B at Q4_K_M  
**Best Optimization:** Flash Attention + KV cache quantization (Q8)  
**Safe Memory Limit:** 20-22GB total usage  

```bash
# Install Ollama (natively, not Docker!)
# Download from https://ollama.com

# Essential optimizations
export OLLAMA_FLASH_ATTENTION=1
export OLLAMA_KV_CACHE_TYPE=q8_0

# Pull recommended model
ollama pull qwen2.5-coder:32b

# Run it
ollama run qwen2.5-coder:32b
```

---

## Top 3 Models by Use Case

### Coding
```bash
ollama pull qwen2.5-coder:32b
# 18-20GB, 8-12 t/s, 82% HumanEval
```

### Reasoning
```bash
ollama pull deepseek-r1-distill-qwen:32b
# 18-20GB, 6-8 t/s, 93% GSM8K
```

### Tool Use
```bash
ollama pull llama3-groq-tool-use:8b
# 4.7GB, 20-28 t/s, 89% BFCL
```

---

## Quantization Guide

| Quantization | When to Use |
|--------------|-------------|
| **Q4_K_M** ⭐ | Default - 97% quality, fast |
| **Q5_K_M** | Quality-focused, 20% slower |
| **Q6_K/Q8_0** | Production/critical accuracy |

**Rule of Thumb:** Larger model at Q4 > Smaller model at Q8

---

## Memory Limits

| Model Size | Q4_K_M Memory | Max Context (with Q8 KV cache) |
|------------|---------------|--------------------------------|
| 7B | 4-5GB | 64K |
| 13B | 7-8GB | 32K |
| 32B | 18-20GB | 16K |
| 70B | 36-40GB ⚠️ | 4K (tight!) |

**Safe rule:** Keep total usage under 22GB

---

## Essential Optimizations

### 1. Flash Attention (Always Enable)
```bash
export OLLAMA_FLASH_ATTENTION=1
# 20-30% KV cache reduction, 10-30% speed boost
```

### 2. KV Cache Quantization (Recommended)
```bash
export OLLAMA_KV_CACHE_TYPE=q8_0
# 50% KV cache reduction, minimal quality loss
```

### 3. Extended Context (Optional)
```bash
export OLLAMA_CONTEXT_LENGTH=32000
# Only if you need it - quadratic memory scaling!
```

---

## Common Mistakes

❌ **Using Docker** - No GPU support on macOS  
❌ **Ignoring KV cache** - Can exceed model weights at high context  
❌ **Q4_0 instead of Q4_K_M** - Legacy method, worse quality  
❌ **Assuming 128K context works** - Not feasible on 32GB  
❌ **Not monitoring memory** - Swap kills performance  

---

## Performance Expectations

| Model | Size | Quant | Speed | Use Case |
|-------|------|-------|-------|----------|
| Mistral | 7B | Q4 | 25-32 t/s | Fast general |
| Qwen2.5-Coder | 32B | Q4 | 8-12 t/s | Professional coding |
| DeepSeek-R1 | 32B | Q4 | 6-8 t/s | Deep reasoning |
| Llama 3.3 | 70B | Q4 | 3-5 t/s | Max capability |

---

## Troubleshooting

**Model won't load?**
- Close other apps
- Use Q4_K_M instead of Q5_K_M
- Enable KV cache quantization
- Smaller model (13B instead of 32B)

**Slow performance?**
```bash
# Check GPU acceleration
OLLAMA_DEBUG=1 ollama run <model>
# Look for: "offloading N layers to GPU"
```

**Out of memory?**
- Monitor: Activity Monitor → Memory tab
- Keep 4-8GB free
- Reduce context length
- Enable optimizations

---

## Model Selection Decision Tree

```
What's your priority?
├─ Speed → Mistral 7B Q4_K_M
├─ Coding → Qwen2.5-Coder 32B Q4_K_M
├─ Reasoning → DeepSeek-R1-Distill 32B Q4_K_M
├─ Tool Use → Llama-3.1-Groq-8B Q4_K_M
└─ Max Quality → Llama 3.3 70B Q4_K_M (tight fit!)
```

---

## Next Steps

1. ✅ Install Ollama natively
2. ✅ Set environment variables
3. ✅ Pull Qwen2.5-Coder-32B
4. ✅ Test on real workload
5. ✅ Adjust quantization if needed
6. ✅ Add specialized models as required

---

## Resources

- **Full Model Guide:** `docs/best_models_for_m1_max_32gb.md`
- **Quantization Deep Dive:** `docs/quantization_optimization_guide.md`
- **Research Notes:** `notes/initial_research_findings.md`
- **Ollama Docs:** https://ollama.com

---

**Quick Stats:**
- Research Sources: 60+ citations
- Models Evaluated: 450+ community tests
- Recommended Default: Q4_K_M (97% quality, optimal speed)
- M1 Max GPU Memory: ~24GB available (75% of 32GB)

