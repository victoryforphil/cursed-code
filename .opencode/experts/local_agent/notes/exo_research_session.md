# exo Research Notes

**Date:** 2025-12-16
**Researcher:** Scout

## Key Findings

### Architecture Philosophy
- **P2P vs Master-Worker:** exo explicitly avoids master-worker architecture in favor of peer-to-peer. This means any device can coordinate inference, not just a central node.
- **Heterogeneous by Design:** Built to handle mixed device capabilities (M1 Mac + Raspberry Pi + NVIDIA GPU)
- **Memory-Based Partitioning:** Default strategy splits model layers proportionally to device memory

### Inference Engines
Two production-ready engines:
1. **MLX** - Apple Silicon optimized, automatic on macOS
2. **tinygrad** - Cross-platform, automatic on Linux

**Interoperability:** MLX and tinygrad can work together in the same cluster! This is powerful for mixed macOS/Linux setups.

### Discovery Mechanisms
Three working discovery methods:
- **UDP:** Automatic local network discovery
- **Tailscale:** For devices across networks via mesh VPN
- **Manual:** Explicit peer configuration

### API Compatibility
- ChatGPT-compatible API at `localhost:52415/v1/chat/completions`
- This means existing OpenAI client code can switch to local distributed inference with minimal changes
- Web UI also provided at same port

### Model Support
Wide range:
- LLaMA (3.2, 3.1, including 405B!)
- Mistral
- Qwen
- Deepseek R1 (671B!)
- LLaVA (vision)

**Note:** Can run models FAR larger than any single device. Example: 405B model across consumer devices.

### Hardware Requirements
- Only need total memory > model size across all devices
- Example: 2x 8GB M3 MacBook Airs = 16GB total → can run llama 3.1 8B (fp16)
- Heterogeneous devices increase throughput, not individual request speed

### Tool Integration Opportunity
Similar to Ollama tools we created, we should create:
- `exo_status` - Check if exo cluster is running
- `exo_list_nodes` - Show connected devices in cluster
- `exo_list_models` - Available models
- `exo_run_model` - Start inference with a model
- `exo_cluster_info` - Show topology and partitioning
- `exo_download_model` - Pre-download model shards

### Code Structure Insights
From grep.app search:

**Core Classes:**
- `Node` class in `exo/orchestration/node.py` - Main orchestration
- `InferenceEngine` ABC in `exo/inference/inference_engine.py` - Engine interface
- `ShardDownloader` - Handles model downloading/caching
- `ChatGPTAPI` in `exo/api/chatgpt_api.py` - API server

**Key Patterns:**
```python
from exo.orchestration.node import Node
from exo.networking.grpc.grpc_server import GRPCServer
from exo.networking.udp.udp_discovery import UDPDiscovery
from exo.inference.inference_engine import get_inference_engine
from exo.topology.ring_memory_weighted_partitioning_strategy import RingMemoryWeightedPartitioningStrategy
```

### Integration with Ollama
**Complementary Use Cases:**
- **Ollama:** Fast single-device inference, well-tested models, simple API
- **exo:** Multi-device for models too large for one device, experimental, P2P cluster

**Potential Workflow:**
1. Use Ollama for models that fit on one device (8B, 14B on 32GB Mac)
2. Use exo cluster for larger models (70B, 405B, 671B across devices)
3. Both expose compatible APIs - easy to switch based on model size

### Debugging
- `DEBUG=9 exo` - General debug logs (0-9 scale)
- `TINYGRAD_DEBUG=2 exo` - tinygrad-specific (1-6 scale)

### Performance Optimization (macOS)
- Requires macOS Sequoia for best performance
- `configure_mlx.sh` script optimizes GPU memory allocation
- MLX-specific optimizations for Apple Silicon

### Development Status
- **Experimental:** Expect bugs, active development
- **Hiring:** exo labs is growing the team
- **Bounties:** Open bounty program for contributions
- **Community:** Active Discord, Telegram, Twitter

## Questions for Further Research
1. How does ring memory weighted partitioning work exactly?
2. What's the latency overhead of distributed inference vs single device?
3. How does model shard downloading work? Can we pre-download?
4. Can exo and Ollama run simultaneously on the same device?
5. What's the actual networking protocol between nodes?
6. How does fault tolerance work if a node disconnects?

## Tool Implementation Notes
Should follow similar pattern to ollama tools:
- Use subprocess to interact with `exo` CLI
- Parse JSON output where available
- Provide status checking, node discovery, model management
- Integration with OpenCode agent workflows

## Next Steps
1. Install exo and test basic functionality
2. Test multi-device setup (Mac + another device)
3. Benchmark latency vs Ollama for same model
4. Document tool creation patterns
5. Create wiki pages for exo_architecture and exo_usage

---

# Log
- 2025-12-16: Initial research session on exo distributed inference
