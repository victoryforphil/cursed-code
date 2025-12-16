# exo Architecture

**Source:** exo-explore/exo
**Last Updated:** 2025-12-16

## Core Concepts

### Peer-to-Peer Design
Unlike master-worker architectures, exo uses **peer-to-peer** connections:
- No single controller node
- Any device can coordinate inference
- Devices connect directly via GRPC
- Resilient to node failures

### Dynamic Model Partitioning
Models are split across devices based on:
- Available memory per device
- Network topology
- Device capabilities

**Default Strategy:** Ring Memory Weighted Partitioning
- Runs inference in a ring topology
- Each device processes layers proportional to its memory
- Example: 32GB Mac gets 2x layers of 16GB device

### Heterogeneous Device Support
Designed for mixed hardware:
- Apple Silicon (M1/M2/M3) via MLX
- NVIDIA GPUs via tinygrad/CUDA
- AMD GPUs via tinygrad
- CPU-only devices (Raspberry Pi)

**Key Insight:** Adding slower devices increases overall throughput, not individual request latency.

## Architecture Components

### Node Orchestration
**Module:** `exo/orchestration/node.py`

The `Node` class handles:
- Peer discovery and connection
- Shard assignment and coordination
- Inference request routing
- State synchronization

Key responsibilities:
```python
class Node:
  def __init__(
    self,
    _id: str,
    server: Server,
    inference_engine: InferenceEngine,
    discovery: Discovery,
    partitioning_strategy: PartitioningStrategy,
    shard_downloader: ShardDownloader
  )
```

### Inference Engines
**Module:** `exo/inference/inference_engine.py`

Abstract interface with two implementations:

**MLX Engine** (`exo/inference/mlx/`)
- Apple Silicon optimized
- Uses Metal GPU acceleration
- Automatic on macOS
- Best for M1/M2/M3 chips

**tinygrad Engine** (`exo/inference/tinygrad/`)
- Cross-platform (CUDA, Metal, OpenCL, CPU)
- Automatic on Linux
- Configurable via `TINYGRAD_*` env vars
- Interoperable with MLX!

**Key Feature:** MLX and tinygrad nodes can work together in same cluster.

### Discovery Mechanisms
**Module:** `exo/networking/`

Three working implementations:

**1. UDP Discovery** (`udp/udp_discovery.py`)
- Broadcast/multicast on local network
- Zero configuration
- Fast local discovery
- Automatic peer detection

**2. Tailscale Discovery** (`tailscale/tailscale_discovery.py`)
- Works across networks via Tailscale mesh VPN
- Discovers peers on Tailscale network
- Useful for distributed home setups
- Requires Tailscale installed

**3. Manual Discovery** (`manual/manual_discovery.py`)
- Explicit peer configuration
- JSON config file
- Full control over topology
- For fixed cluster setups

All implement `Discovery` ABC:
```python
async def discover_peers(self, wait_for_peers: int = 0) -> List[PeerHandle]
```

### Peer Networking
**Module:** `exo/networking/grpc/`

Uses GRPC for peer communication:
- `GRPCServer` - Serves requests from other nodes
- `GRPCPeerHandle` - Client to communicate with peers
- Protocol buffers for serialization

### Partitioning Strategy
**Module:** `exo/topology/ring_memory_weighted_partitioning_strategy.py`

Default: Ring Memory Weighted Partitioning
- Assigns model layers to devices based on memory
- Creates a ring topology for inference
- Balances load across heterogeneous devices

### Model Downloading
**Module:** `exo/download/`

Handles downloading and caching:
- `ShardDownloader` - Downloads model shards from Hugging Face
- `new_shard_downloader` - New implementation with progress tracking
- Storage: `~/.cache/exo/downloads` (or `$EXO_HOME/downloads`)

### ChatGPT API
**Module:** `exo/api/chatgpt_api.py`

Provides OpenAI-compatible API:
- Endpoint: `http://localhost:52415/v1/chat/completions`
- Supports streaming
- Model selection
- Temperature, top_p, etc.

Also serves Web UI at same port.

## Data Flow

### Inference Request Flow
1. Client sends request to ChatGPT API endpoint
2. API routes to Node orchestrator
3. Node determines which device(s) hold model shards
4. Distributes computation across nodes
5. Results aggregated and streamed back
6. Client receives ChatGPT-compatible response

### Shard Distribution
1. Model identified (e.g., "llama-3.2-3b")
2. Partitioning strategy calculates shard assignments
3. Each node downloads assigned shards
4. Nodes coordinate to run inference across shards

## Key Design Decisions

### Why P2P?
- No single point of failure
- Simpler deployment (no master setup)
- More flexible topology
- Better for home/edge clusters

### Why Multiple Inference Engines?
- MLX: Best for Apple Silicon
- tinygrad: Universal, works everywhere
- Interoperability allows mixed hardware
- Future: PyTorch, llama.cpp support

### Why Ring Topology?
- Predictable communication pattern
- Memory-weighted ensures balanced load
- Easy to reason about
- Works well for transformer architectures

---

# Log
- 2025-12-16: Created from exo research session
