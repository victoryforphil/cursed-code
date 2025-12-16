# Quantization Optimization Guide for M1 Max 32GB

**Research Date:** December 16, 2025  
**Source:** Perplexity Deep Research

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Quantization Fundamentals](#quantization-fundamentals)
3. [Quantization Methods Comparison](#quantization-methods-comparison)
4. [Memory Usage Analysis](#memory-usage-analysis)
5. [Performance Benchmarks](#performance-benchmarks)
6. [M1 Max Specific Optimizations](#m1-max-specific-optimizations)
7. [Advanced Techniques](#advanced-techniques)
8. [Practical Implementation](#practical-implementation)

---

## Executive Summary

### Key Findings

**Default Recommendation: Q4_K_M**
- 97.1% quality retention vs FP16
- 3.6x compression ratio
- Optimal speed-quality balance for M1 Max
- Enables 32B models at 8-12 tokens/sec

**Quality Upgrade: Q5_K_M**
- 98.2% quality retention
- 20-25% speed reduction vs Q4_K_M
- Noticeable improvements in complex reasoning
- Worth the tradeoff for specialized tasks

**Conservative Choice: Q6_K / Q8_0**
- 99%+ quality retention
- 50-70% speed reduction vs Q4_K_M
- Diminishing returns for most applications
- Reserve for production systems requiring maximum accuracy

### Memory Budget Guidelines

On M1 Max 32GB:
- **GPU-accessible memory:** ~24GB (75% of total)
- **Safe operational limit:** ~20-22GB (after OS overhead)
- **Maximum model weights:** 16-18GB recommended
- **Context considerations:** KV cache scales quadratically

---

## Quantization Fundamentals

### What is Quantization?

Quantization reduces the numerical precision of model weights from high-precision floating-point (FP32/FP16) to lower-bit representations (8-bit, 4-bit, etc.).

**Analogy:** Like compressing a high-resolution photo to a lower resolution - the image remains recognizable while consuming less storage.

### How It Works

1. **Identify value ranges** within weight blocks/groups
2. **Map values** to lower-bit integer representations
3. **Calculate scaling factors** for each block
4. **Compress** by storing scaled integers instead of floats

### Key Insight

> Most neural network parameters contribute modestly to predictions. Information lost through precision reduction is negligible compared to gains in memory efficiency and speed.

---

## Quantization Methods Comparison

### Quantization Nomenclature

Format: `Q{bits}_{method}`

- **Q4, Q5, Q6, Q8:** Bits per parameter
- **_0:** Legacy uniform quantization
- **_K:** K-means group-wise quantization (modern, superior)
- **_S:** Symmetric scaling
- **_M:** Mixed/medium block sizes
- **_L:** Large block sizes

### Method Comparison

| Method | Algorithm | Quality | Speed | Recommendation |
|--------|-----------|---------|-------|----------------|
| **Q4_0** | Uniform 4-bit | Baseline | Fast | ❌ Obsolete |
| **Q4_K_M** ⭐ | K-means 4-bit | Better | Fast | ✅ Default |
| **Q5_K_M** ⭐ | K-means 5-bit | Best | Good | ✅ Quality focus |
| **Q6_K** | K-means 6-bit | Excellent | Moderate | ⚠️ Specialized |
| **Q8_0** | Uniform 8-bit | Near-perfect | Slow | ⚠️ Conservative |

### Legacy vs K-Quantization

**Legacy (_0 methods):**
- Uniform scaling across entire blocks
- Treats all weights identically
- Lower quality for same bit-width

**K-Quantization (_K methods):**
- Groups weights by importance
- Different scaling per group
- Superior accuracy preservation
- **Always prefer K-methods**

### Detailed Method Breakdown

#### Q4_K_M (Recommended Default)

**Specifications:**
- 4 bits per parameter
- Medium block sizes
- K-means clustering

**Performance:**
- **Compression:** 3.6x vs FP32, 2x vs FP16
- **Quality:** 97.1% retention
- **Speed:** 25-32 tokens/sec (7B models on M1 Max)
- **Memory:** 7B model = 3.5-4.5GB

**Best For:**
- General-purpose deployment
- Interactive applications
- Development workflows
- Fast iteration

**Example:**
```bash
ollama pull qwen2.5-coder:32b  # Defaults to Q4_K_M
```

#### Q5_K_M (Quality Upgrade)

**Specifications:**
- 5 bits per parameter
- Medium block sizes
- K-means clustering

**Performance:**
- **Compression:** 2.9x vs FP32
- **Quality:** 98.2% retention
- **Speed:** 20-25 tokens/sec (7B models)
- **Memory:** 7B model = 4.5-5.8GB

**Quality Improvements Over Q4_K_M:**
- Better instruction-following precision
- Improved numerical accuracy
- Enhanced reasoning stability
- Reduced factual errors

**Best For:**
- Complex reasoning tasks
- Production applications
- Specialized domains
- When quality > speed

**Trade-off:**
- 20-25% slower than Q4_K_M
- 25-30% more memory
- Marginal but noticeable quality gains

#### Q6_K (Specialist Choice)

**Specifications:**
- 6 bits per parameter
- K-means clustering

**Performance:**
- **Compression:** 2.4x vs FP32
- **Quality:** 99%+ retention
- **Speed:** 18-22 tokens/sec (7B models)
- **Memory:** 7B model = 5.5-6.5GB

**Best For:**
- Critical accuracy requirements
- Numerical computation
- Production systems with quality SLAs
- When you've exhausted Q5_K_M optimization

**Diminishing Returns:**
Quality improvement over Q5_K_M often imperceptible for most tasks while speed penalty remains significant.

#### Q8_0 (Maximum Quality)

**Specifications:**
- 8 bits per parameter
- Legacy uniform quantization

**Performance:**
- **Compression:** 2x vs FP32
- **Quality:** 99.9% retention
- **Speed:** 12-18 tokens/sec (7B models)
- **Memory:** 7B model = 7-9GB

**Best For:**
- Maximum quality requirements
- Baseline comparisons
- Conservative production deployments
- Framework compatibility needs

**Note:** Despite legacy method, 8-bit precision compensates for uniform scaling limitations.

---

## Memory Usage Analysis

### Total Memory Formula

```
Total Memory = Model Weights + KV Cache + Compute Buffers + Overhead
```

### Component Breakdown

#### 1. Model Weights

**Calculation:** `(Parameters × Bits) ÷ 8 bits/byte`

**Examples (7B model):**
- FP32: 28GB
- FP16: 14GB
- Q8_0: 7GB
- Q6_K: 5.5GB
- Q5_K_M: 4.5-5.8GB
- Q4_K_M: 3.5-4.5GB

**Examples (32B model):**
- FP16: 64GB ⚠️ Too large for M1 Max
- Q8_0: 32GB ⚠️ Marginal
- Q5_K_M: 19-23GB ✅ Comfortable
- Q4_K_M: 18-20GB ✅ Recommended

#### 2. KV Cache (Key-Value Cache)

**Purpose:** Stores attention keys/values for all tokens in context

**Calculation:**
```
KV Cache = 2 × Batch × SeqLen × Layers × Heads × HeadDim ÷ 8
```

**Simplified approximations:**

| Context Length | 7B Model (FP16) | 13B Model (FP16) | 32B Model (FP16) |
|----------------|-----------------|------------------|------------------|
| 2K | 0.3-0.5 GB | 0.5-0.8 GB | 1-1.5 GB |
| 4K | 0.5-1 GB | 0.8-1.5 GB | 2-3 GB |
| 8K | 1-2 GB | 1.5-3 GB | 4-6 GB |
| 16K | 2-4 GB | 3-6 GB | 8-12 GB |
| 32K | 5-8 GB | 8-12 GB | 16-24 GB |
| 64K | 10-16 GB | 16-24 GB | 32+ GB ⚠️ |
| 128K | 20+ GB ⚠️ | 32+ GB ⚠️ | Infeasible |

**Key Insight:** KV cache has **quadratic scaling** with context length!

#### 3. Compute Buffers

**Typical overhead:** 0.5-2GB depending on model architecture

Includes:
- Activation buffers
- Temporary computation space
- Metal API overhead

#### 4. System Overhead

**Typical overhead:** 1-2GB

Includes:
- Operating system
- Background processes
- Safety margin

### Practical Memory Examples

#### Example 1: Qwen2.5 8B, Q4_K_M, 4K context

```
Model weights:      4.8 GB
KV cache (4K):      1.2 GB
Compute buffers:    0.8 GB
Overhead:           1.2 GB
─────────────────────────
Total:              8.0 GB  ✅ Comfortable
```

**Performance:** 20-25 tokens/sec

#### Example 2: Qwen2.5-Coder 32B, Q4_K_M, 8K context

```
Model weights:     18.5 GB
KV cache (8K):      3.5 GB
Compute buffers:    1.0 GB
Overhead:           1.5 GB
─────────────────────────
Total:             24.5 GB  ⚠️ Tight (use KV cache quantization)
```

**With Q8 KV cache quantization:**
```
Model weights:     18.5 GB
KV cache (8K, Q8):  1.8 GB  (50% reduction)
Compute buffers:    1.0 GB
Overhead:           1.5 GB
─────────────────────────
Total:             22.8 GB  ✅ Safe
```

**Performance:** 8-12 tokens/sec

#### Example 3: Llama 3.3 70B, Q4_K_M, 4K context

```
Model weights:     38.0 GB  ⚠️ Exceeds GPU limit
After optimization: 30.0 GB  (Flash Attention + aggressive settings)
KV cache (4K, Q8):  1.5 GB
Compute buffers:    0.8 GB
Overhead:           1.5 GB
─────────────────────────
Total:             33.8 GB  ⚠️ Pushes limits
```

**Requires:**
- Closing all other applications
- Reduced context (4K max)
- Flash Attention enabled
- KV cache quantization
- Accepting CPU fallback risk

**Performance:** 3-5 tokens/sec

---

## Performance Benchmarks

### Speed Benchmarks (M1 Max)

#### 7B Models

| Quantization | Speed (t/s) | Quality vs FP16 | Memory |
|--------------|-------------|-----------------|--------|
| Q4_K_M | 25-32 | 97% | 3.5-4.5 GB |
| Q5_K_M | 20-25 | 98.2% | 4.5-5.8 GB |
| Q6_K | 18-22 | 99% | 5.5-6.5 GB |
| Q8_0 | 12-18 | 99.9% | 7-9 GB |

#### 13B Models

| Quantization | Speed (t/s) | Quality vs FP16 | Memory |
|--------------|-------------|-----------------|--------|
| Q4_K_M | 15-18 | 97% | 7-8 GB |
| Q5_K_M | 12-14 | 98.2% | 8.5-10 GB |
| Q6_K | 10-12 | 99% | 10-12 GB |
| Q8_0 | 7-10 | 99.9% | 13-15 GB |

#### 32B Models

| Quantization | Speed (t/s) | Quality vs FP16 | Memory |
|--------------|-------------|-----------------|--------|
| Q4_K_M | 4-8 | 97% | 18-20 GB |
| Q5_K_M | 3-6 | 98.2% | 21-24 GB |
| Q6_K | Marginal | 99% | 25+ GB ⚠️ |

### Quality Benchmarks

#### Perplexity Scores (Lower = Better)

Measures prediction accuracy on held-out text:

| Method | Perplexity Error vs FP16 |
|--------|--------------------------|
| Q4_K_M | ~0.9% |
| Q4_0 (legacy) | ~1.3-1.8% |
| Q5_K_M | ~0.4% |
| Q6_K | ~0.2% |
| Q8_0 | <0.1% |

#### Subjective Quality Assessment

Based on 450+ model evaluations:

**Q8_0 vs Q6_K:**
- Differences perceptible only in edge cases
- Deep reasoning tasks show minimal gaps
- Numerical precision slightly better in Q8_0

**Q6_K vs Q5_K_M:**
- Modest differences for most tasks
- General knowledge: Nearly identical
- Complex reasoning: Small Q6_K advantage

**Q5_K_M vs Q4_K_M:**
- **Most pronounced quality gap**
- Instruction-following precision improves
- Numerical accuracy better
- Reasoning stability enhanced
- 13B+ models show clearer differences

**Q4_K_M vs Q4_0 (legacy):**
- Q4_K_M clearly superior despite same bit-width
- Better reasoning stability
- Fewer factual errors
- **Never use Q4_0 - obsolete**

### Task-Specific Sensitivity

| Task Category | Optimal Quantization | Notes |
|---------------|---------------------|-------|
| Creative writing | Q4_K_M | Minimal sensitivity |
| Chat/conversation | Q4_K_M | Q4-Q8 nearly identical |
| Brainstorming | Q4_K_M | Speed matters more |
| Code generation | Q5_K_M | Precision helps |
| Mathematical reasoning | Q5_K_M - Q6_K | Accuracy critical |
| Factual knowledge | Q5_K_M | Reduces hallucinations |
| Multi-step reasoning | Q5_K_M | Clear improvements |
| Numerical computation | Q6_K - Q8_0 | Highest sensitivity |
| Precise formatting | Q6_K - Q8_0 | Edge case handling |

---

## M1 Max Specific Optimizations

### Understanding Apple Silicon Architecture

**Unified Memory Design:**
- 32GB shared between CPU and GPU
- 400GB/s memory bandwidth
- No discrete VRAM bottleneck

**Metal Performance Shaders:**
- GPU acceleration through Metal API
- ~24GB GPU-accessible (75% of total)
- Different optimization patterns than CUDA

### Key Differences from NVIDIA

| Aspect | M1 Max | NVIDIA GPU |
|--------|---------|------------|
| Quantization Support | GGML only | GPTQ + GGML |
| Memory Access | Unified | Discrete VRAM |
| Performance Pattern | Bandwidth-limited | Compute-limited |
| IQ Quantization | Poor | Good |
| K-Quantization | Good | Good |
| Multi-model Flexibility | Excellent | Limited |

### Apple Silicon Specific Findings

#### 1. Quantization Method Performance

**On M1 Max specifically:**
- Q4_0 and Q4_K_M achieve near-identical speeds (55-65 t/s on 7B)
- This differs from NVIDIA where newer methods carry speed penalties
- Cause: Memory bandwidth saturation at 4-bit quantization

**Recommendation:** Always use Q4_K_M over Q4_0 for superior quality at same speed.

#### 2. IQ Quantization Avoid

**IQ (Information Quantization) methods:**
- Use lookup table-based codebooks
- Excellent on NVIDIA hardware
- **Poor performance on Apple Silicon**
- Cause: Lookup operations don't map well to Metal API

**Recommendation:** Stick to K-quantization methods on M1 Max.

#### 3. GPU Memory Limits

**Metal API enforces:**
- ~75% GPU-accessible memory
- M1 Max 32GB → ~24GB available
- OS + overhead → ~20-22GB practical limit

**Recommendation:** Target 16-18GB max model weights for comfortable operation.

### Flash Attention (Critical Optimization)

**What it does:**
- Reformulates attention computation
- Processes smaller chunks sequentially
- Reduces memory bandwidth requirements

**Benefits on M1 Max:**
- 20-30% KV cache memory reduction
- 10-30% speed improvement
- Especially valuable for extended context

**Enable:**
```bash
export OLLAMA_FLASH_ATTENTION=1
```

**Example impact:**
```
Qwen2.5 7B, 32K context:
Without Flash Attention: 8.9GB KV cache
With Flash Attention:    6.8GB KV cache
Savings:                 2.1GB (24%)
```

### KV Cache Quantization (Critical Optimization)

**What it does:**
- Quantizes attention key-value vectors separately
- Typically to Q8_0 or Q4_0
- Lower sensitivity to quantization than model weights

**Benefits on M1 Max:**
- ~50% KV cache memory reduction (Q8)
- ~75% KV cache memory reduction (Q4)
- Minimal quality loss
- Doubles effective context length

**Enable:**
```bash
export OLLAMA_KV_CACHE_TYPE=q8_0  # Recommended
# or
export OLLAMA_KV_CACHE_TYPE=q4_0  # Aggressive
```

**Example impact:**
```
Qwen2.5 7B, 32K context:
FP16 KV cache:     8.9GB
Q8 KV cache:       4.5GB  (50% reduction)
Q4 KV cache:       2.2GB  (75% reduction)
```

**Quality considerations:**
- Q8 KV cache: Imperceptible quality loss
- Q4 KV cache: Acceptable for most tasks
- Model-dependent sensitivity (test on your use case)

### Combined Optimization Example

**Scenario:** Run Qwen2.5-Coder 32B with 32K context on M1 Max

**Baseline (no optimization):**
```
Model weights:     18.5 GB
KV cache (32K):    11.0 GB
Overhead:           2.5 GB
─────────────────────────
Total:             32.0 GB  ❌ Exceeds GPU limit
```

**With Flash Attention:**
```
Model weights:     18.5 GB
KV cache (32K):     8.8 GB  (20% reduction)
Overhead:           2.5 GB
─────────────────────────
Total:             29.8 GB  ⚠️ Still tight
```

**With Flash Attention + Q8 KV Cache:**
```
Model weights:     18.5 GB
KV cache (32K):     4.4 GB  (60% reduction from baseline)
Overhead:           2.5 GB
─────────────────────────
Total:             25.4 GB  ⚠️ Workable but close
```

**With Flash Attention + Q8 KV Cache + Reduced Context (16K):**
```
Model weights:     18.5 GB
KV cache (16K):     2.2 GB
Overhead:           2.5 GB
─────────────────────────
Total:             23.2 GB  ✅ Comfortable
```

**Performance:** 8-12 tokens/sec, excellent quality

---

## Advanced Techniques

### 1. Custom Context Lengths

**Set extended context:**
```bash
export OLLAMA_CONTEXT_LENGTH=32000
```

**Benefits:**
- Better long-document handling
- Multi-turn conversation memory
- Code understanding across files

**Trade-offs:**
- Quadratic memory scaling
- Requires KV cache management
- May need KV cache quantization

### 2. Layer Offloading Control

**Manual GPU layer control:**
```bash
# In Modelfile
PARAMETER num_gpu 30  # Offload 30 layers to GPU
```

**When to use:**
- Fine-tuning GPU vs CPU split
- Output layer sometimes faster on CPU
- Marginal performance optimization

**Typical strategy:**
- Offload `num_layers - 1` (all except output)
- Test specific to each model

### 3. Multi-Model Deployment

**Strategy:** Run complementary models simultaneously

**Example setup:**
```bash
# Fast general model (4GB)
ollama run mistral:7b &

# Specialized coding (18GB)
ollama run qwen2.5-coder:32b &

# Total: ~22GB
```

**Route requests:**
- Simple queries → Mistral (30+ t/s)
- Complex/coding → Qwen2.5-Coder (10+ t/s)

**Benefits:**
- Optimized for diverse workloads
- Better throughput distribution
- Cost-effective resource usage

### 4. Async/Batch Processing

**For latency-tolerant workloads:**

1. Queue requests through task system (Redis, RabbitMQ)
2. Ollama processes sequentially
3. Return results asynchronously

**Benefits:**
- Supports many concurrent users
- Maximizes hardware utilization
- Acceptable for batch jobs, overnight processing

### 5. Model Swapping Strategy

**Active switching:**
```bash
# Load model 1
ollama run qwen2.5-coder:32b

# When done, stop and switch
ollama stop qwen2.5-coder:32b
ollama run deepseek-r1-distill-qwen:32b
```

**Benefits:**
- Access multiple large models
- Manage memory constraints
- Flexible workflow adaptation

---

## Practical Implementation

### Installation & Setup

#### 1. Install Ollama

```bash
# Download from https://ollama.com
# Native macOS installation (NOT Docker)
```

**Important:** Don't use Docker on macOS - no GPU passthrough!

#### 2. Verify Metal Acceleration

```bash
# Run debug mode
OLLAMA_DEBUG=1 ollama run llama3:8b

# Look for: "offloading N layers to GPU"
# Good: "offloading 30 layers to GPU"
# Bad: "offloading 0 layers to GPU" (CPU-only)
```

### Model Management

#### Pull Specific Quantizations

```bash
# Default (usually Q4_K_M)
ollama pull qwen2.5:7b

# Explicit quantization
ollama pull qwen2.5:7b-q5  # Q5_K_M variant
ollama pull llama3.1:13b-q8  # Q8_0 variant
```

#### List Downloaded Models

```bash
ollama list
```

#### Check Running Models

```bash
ollama ps  # Shows loaded models + memory usage
```

#### Unload Model

```bash
ollama stop qwen2.5:7b
```

### Creating Custom Modelfiles

**Example: Optimized 32B coding model**

```dockerfile
# Modelfile
FROM qwen2.5-coder:32b

# Extended context
PARAMETER num_ctx 32000

# GPU offloading (adjust based on testing)
PARAMETER num_gpu 30

# Generation parameters
PARAMETER temperature 0.7
PARAMETER top_k 40
PARAMETER top_p 0.9

# System prompt
SYSTEM You are an expert coding assistant specializing in Python, TypeScript, and Go.
```

**Create model:**
```bash
ollama create my-coder-32b -f Modelfile
```

**Use model:**
```bash
ollama run my-coder-32b
```

### Environment Configuration

**Persistent optimization settings:**

```bash
# Edit shell profile (~/.zshrc or ~/.bash_profile)
export OLLAMA_FLASH_ATTENTION=1
export OLLAMA_KV_CACHE_TYPE=q8_0
export OLLAMA_CONTEXT_LENGTH=32000

# Restart terminal or source profile
source ~/.zshrc
```

**Launch agent configuration (macOS):**

```bash
# Set systemwide
launchctl setenv OLLAMA_FLASH_ATTENTION 1
launchctl setenv OLLAMA_KV_CACHE_TYPE q8_0

# Restart Ollama app for changes to take effect
```

### Monitoring & Troubleshooting

#### Memory Monitoring

```bash
# Terminal - watch memory usage
watch -n 1 "ollama ps"

# macOS Activity Monitor
# Look for "ollama" process
# Check "Memory" tab for pressure
```

#### Performance Testing

```bash
# Enable detailed logging
export OLLAMA_DEBUG=1

# Run model and observe:
# - Layer offloading count
# - Tokens/sec during generation
# - Memory allocation details

ollama run qwen2.5:7b "Write a Python function"
```

#### Common Issues

**Issue: "Not enough memory"**

Solutions:
1. Use lower quantization (Q4_K_M vs Q5_K_M)
2. Smaller model (13B vs 32B)
3. Enable KV cache quantization
4. Reduce context length
5. Close other apps

**Issue: Slow performance (<5 t/s expected 20+)**

Solutions:
1. Check GPU offloading (OLLAMA_DEBUG=1)
2. Verify not using Docker
3. Close GPU-intensive apps
4. Check for CPU fallback
5. Enable Flash Attention

**Issue: Model won't load**

Solutions:
1. Check disk space (models are large)
2. Verify model name/tag
3. Re-pull: `ollama pull <model>`
4. Check Ollama logs for errors

---

## Decision Flowcharts

### Quantization Selection

```
Start → Need speed?
  ├─ Yes → Q4_K_M ✅
  └─ No → Need quality?
      ├─ Yes → Complex reasoning needed?
      │   ├─ Yes → Q5_K_M ✅
      │   └─ No → Q4_K_M ✅
      └─ No → Production with SLA?
          ├─ Yes → Q6_K or Q8_0 ✅
          └─ No → Q4_K_M ✅
```

### Memory Optimization

```
Model won't fit?
  ├─ Try lower quantization (Q5→Q4)
  ├─ Enable KV cache quantization
  ├─ Reduce context length
  ├─ Enable Flash Attention
  └─ Choose smaller model
```

### Context Length Selection

```
How much context needed?
  ├─ 2-4K (chat, quick tasks) → Default ✅
  ├─ 8-16K (documents, code files) → +KV cache Q8 ✅
  ├─ 32K+ (large docs, long sessions) → +Flash Attention +KV Q8 ✅
  └─ 64K+ (extreme cases) → Consider if feasible ⚠️
```

---

## Quick Reference

### Quantization Cheat Sheet

| Need | Quantization | Example Use Case |
|------|--------------|------------------|
| **Speed** | Q4_K_M | Interactive coding, chat |
| **Quality** | Q5_K_M | Complex reasoning, production |
| **Balance** | Q4_K_M | 90% of use cases |
| **Maximum** | Q6_K/Q8_0 | Critical accuracy, conservative |

### Memory Quick Calculator

**7B Model:**
- Q4_K_M: 4GB + 1GB/8K context
- Q5_K_M: 5GB + 1GB/8K context

**13B Model:**
- Q4_K_M: 8GB + 2GB/8K context
- Q5_K_M: 10GB + 2GB/8K context

**32B Model:**
- Q4_K_M: 18GB + 4GB/8K context
- Q5_K_M: 22GB + 4GB/8K context

### Optimization Commands

```bash
# Essential optimizations
export OLLAMA_FLASH_ATTENTION=1
export OLLAMA_KV_CACHE_TYPE=q8_0

# Extended context
export OLLAMA_CONTEXT_LENGTH=32000

# Debug mode
export OLLAMA_DEBUG=1
```

---

## Citations

Primary research sources:
- 60+ sources from Perplexity deep research
- GitHub discussions (llama.cpp, ollama, ggml)
- Apple Silicon benchmarking data
- Community testing (450+ model evaluations)
- Ollama official documentation

Key technical references:
1. GGML quantization structure
2. K-quantization methods analysis
3. M1 Max architecture studies
4. KV cache optimization papers (NQKV)
5. Flash Attention implementation

---

**Last Updated:** December 16, 2025  
**Maintained by:** Scout Expert - Local Models Division
