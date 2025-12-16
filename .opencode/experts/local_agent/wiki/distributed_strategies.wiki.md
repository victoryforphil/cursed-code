# Distributed vs Local Strategies

**Last Updated:** 2025-12-16

## Decision Framework

Use this guide to decide between **Ollama** (local single-device) vs **exo** (distributed multi-device).

## Quick Decision Tree

```
Is model size > device memory?
├─ YES → Use exo
└─ NO
   ├─ Need high throughput (many concurrent requests)?
   │  ├─ YES → Consider exo (more devices = more throughput)
   │  └─ NO → Use Ollama (simpler, faster individual latency)
   └─ Only one device available?
      └─ Use Ollama
```

## When to Use Ollama

### ✅ Best For:
- **Models that fit in single device memory**
  - 8B models on 16GB+ RAM
  - 14B models on 32GB RAM
  - 32B models on 64GB+ RAM

- **Low latency critical**
  - Interactive chat applications
  - Real-time code completion
  - Quick prototyping

- **Single device deployment**
  - No cluster available
  - Simplicity preferred
  - Development/testing

- **Stable, well-tested models**
  - Ollama has curated model library
  - Quantization presets
  - Known performance characteristics

### Examples:
```bash
# Fast local inference
ollama run llama3.2:3b

# Code completion
ollama run qwen2.5-coder:7b

# Chat assistant
ollama run llama3.1:8b
```

## When to Use exo

### ✅ Best For:
- **Large models that don't fit single device**
  - 70B models across 2-3 devices
  - 405B models across 4-8 devices
  - 671B models (DeepSeek R1) across 10+ devices

- **High concurrent throughput**
  - Multiple simultaneous users
  - Batch processing
  - API services with many requests

- **Heterogeneous hardware clusters**
  - Mix of Mac, Linux, NVIDIA, Raspberry Pi
  - Utilize all available compute
  - Home lab setups

- **Experimental/cutting-edge models**
  - Latest research models
  - Custom fine-tuned models
  - Models not in Ollama library

### Examples:
```bash
# Massive model across cluster
exo run llama-3.1-405b

# Latest research model
exo run deepseek-r1

# Cluster utilization
exo run mistral-large
```

## Hybrid Strategy

### Use Both!
Run Ollama AND exo for different use cases:

**Ollama for:**
- Fast 8B/14B models (coding, chat)
- Low-latency requests
- Development

**exo for:**
- Large 70B+ models
- High-throughput workloads
- Experimentation

### Example Setup
```bash
# M1 Max 32GB Mac

# Ollama for fast local models
ollama run qwen2.5-coder:14b  # Fast code completion

# exo cluster (Mac + Linux workstation + 2x Raspberry Pi)
exo run llama-3.1-405b  # Large model research
```

## Performance Comparison

### Ollama (Single Device)
| Metric | Value |
|--------|-------|
| Latency | ⭐⭐⭐⭐⭐ Lowest (single device hop) |
| Throughput | ⭐⭐⭐ Limited by single device |
| Setup | ⭐⭐⭐⭐⭐ Simple (one command) |
| Max Model | Limited by device memory |
| Reliability | ⭐⭐⭐⭐⭐ Very stable |

### exo (Distributed)
| Metric | Value |
|--------|-------|
| Latency | ⭐⭐⭐ Higher (network overhead) |
| Throughput | ⭐⭐⭐⭐⭐ Scales with devices |
| Setup | ⭐⭐⭐ More complex (cluster) |
| Max Model | Sum of cluster memory |
| Reliability | ⭐⭐⭐ P2P resilient, but more complexity |

## Memory Calculations

### Ollama Model Sizes (fp16)
- 3B model: ~6GB
- 7B model: ~14GB
- 8B model: ~16GB
- 14B model: ~28GB
- 32B model: ~64GB

**Rule of thumb:** Model size (GB) ≈ Parameters (B) × 2

### exo Cluster Sizing
Total cluster memory should be > model size + overhead.

**Examples:**

**llama-3.1-8b (fp16):**
- Size: ~16GB
- Minimum cluster: 20GB total (16GB + 4GB overhead)
- Options:
  - 1 x 32GB device (use Ollama instead)
  - 2 x 16GB devices
  - 1 x 16GB + 2 x 4GB

**llama-3.1-70b (fp16):**
- Size: ~140GB
- Minimum cluster: 150GB total
- Options:
  - 3 x 64GB devices
  - 5 x 32GB devices
  - 1 x 64GB + 4 x 24GB

**llama-3.1-405b (fp16):**
- Size: ~810GB
- Minimum cluster: 850GB total
- Options:
  - 13 x 64GB devices
  - 27 x 32GB devices
  - Mix: 4 x 64GB + 20 x 32GB

## Cost Considerations

### Ollama
- **Hardware:** Single device (Mac, Linux, Windows)
- **Network:** None required
- **Complexity:** Minimal
- **Electricity:** Single device power draw

### exo
- **Hardware:** Multiple devices
- **Network:** LAN or Tailscale mesh
- **Complexity:** Higher (multiple machines, discovery, monitoring)
- **Electricity:** Multiple devices running

**Tradeoff:** exo enables models impossible on single device, but at cost of complexity and power.

## Use Case Matrix

| Use Case | Recommended | Reasoning |
|----------|-------------|-----------|
| Code completion | Ollama | Low latency critical |
| Chat assistant (8B) | Ollama | Fits on most devices |
| Chat assistant (70B) | exo | Requires cluster |
| Research experiments | exo | Latest/experimental models |
| Production API (8B) | Ollama | Simpler deployment |
| Production API (405B) | exo | Only option for size |
| Batch processing | exo | Throughput matters more |
| Interactive demo | Ollama | Latency matters more |
| Home lab utilization | exo | Use all devices |
| Single laptop setup | Ollama | No cluster available |

## Migration Path

### Start Small (Ollama)
1. Install Ollama
2. Test with 3B/7B models
3. Identify if you need larger models

### Scale Up (exo)
1. Hit memory limits with Ollama
2. Install exo on multiple devices
3. Test with distributed inference
4. Keep Ollama for fast small models

### Optimize
- Ollama for < 32GB models
- exo for > 32GB models
- Both running simultaneously for different use cases

## Network Requirements

### Ollama
- **None** (local only)
- Can expose API over network if desired

### exo
- **LAN:** 1Gbps+ recommended for low latency
- **WiFi:** Works, but slower than wired
- **Tailscale:** Adds latency, but enables cross-network
- **Internet:** Not required (except model downloads)

**Bottleneck:** Network bandwidth affects inference speed in exo.

## Future Considerations

### Ollama Roadmap
- Continued model curation
- Better quantization
- macOS/Linux optimization

### exo Roadmap
- More inference engines (PyTorch, llama.cpp)
- Better fault tolerance
- Advanced scheduling
- iOS support (in progress)

---

# Log
- 2025-12-16: Created distributed vs local decision guide
