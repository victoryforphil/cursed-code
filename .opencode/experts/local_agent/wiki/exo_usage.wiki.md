# exo Usage Guide

**Last Updated:** 2025-12-16

## Installation

### Prerequisites
- **Python >= 3.12.0** (required for asyncio fixes)
- For **NVIDIA GPU** (Linux only):
  - NVIDIA driver (check: `nvidia-smi`)
  - CUDA toolkit (check: `nvcc --version`)
  - cuDNN library

### From Source
```bash
git clone https://github.com/exo-explore/exo.git
cd exo
pip install -e .
# OR with venv:
source install.sh
```

### macOS Performance Tips
1. Update to latest macOS Sequoia
2. Run GPU memory optimization:
   ```bash
   ./configure_mlx.sh
   ```

## Basic Usage

### Multi-Device Setup

**Device 1 (any device):**
```bash
exo
```

**Device 2 (any other device on same network):**
```bash
exo
```

**That's it!** Zero configuration - automatic discovery via UDP.

Web UI: `http://localhost:52415`

### Single Device Mode
```bash
exo run llama-3.2-3b
```

With custom prompt:
```bash
exo run llama-3.2-3b --prompt "What is the meaning of exo?"
```

## CLI Options

```bash
exo [command] [model_name] [options]
```

### Commands
- `run` - Run a specific model
- `eval` - Evaluate model performance
- `train` - Train/fine-tune a model

### Common Options
- `--default-model MODEL` - Set default model
- `--iters N` - Training iterations (default: 100)
- `--save-every N` - Save model every N iterations (default: 5)
- `--node-id ID` - Specify node ID
- `--node-port PORT` - Specify GRPC port
- `--listen-port PORT` - API server port (default: 52415)
- `--broadcast-port PORT` - UDP discovery port
- `--discovery DISCOVERY` - Discovery method: udp, tailscale, manual
- `--wait-for-peers N` - Wait for N peers before starting

### Inference Engine Selection
- macOS: Defaults to **MLX**
- Linux: Defaults to **tinygrad**
- Manual: Set via code (no CLI flag)

## API Usage

### ChatGPT-Compatible Endpoint
`http://localhost:52415/v1/chat/completions`

**Example - Llama 3.2 3B:**
```bash
curl http://localhost:52415/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
     "model": "llama-3.2-3b",
     "messages": [{"role": "user", "content": "What is exo?"}],
     "temperature": 0.7
   }'
```

**Example - Llama 3.1 405B:**
```bash
curl http://localhost:52415/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
     "model": "llama-3.1-405b",
     "messages": [{"role": "user", "content": "What is exo?"}],
     "temperature": 0.7
   }'
```

**Example - DeepSeek R1 (671B):**
```bash
curl http://localhost:52415/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
     "model": "deepseek-r1",
     "messages": [{"role": "user", "content": "What is exo?"}],
     "temperature": 0.7
   }'
```

**Example - LLaVA Vision (7B):**
```bash
curl http://localhost:52415/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
     "model": "llava-1.5-7b-hf",
     "messages": [
      {
        "role": "user",
        "content": [
          {"type": "text", "text": "What are these?"},
          {"type": "image_url", "image_url": {"url": "http://images.cocodataset.org/val2017/000000039769.jpg"}}
        ]
      }
    ],
     "temperature": 0.0
   }'
```

### Supported Models
- LLaMA 3.2 (1B, 3B)
- LLaMA 3.1 (8B, 70B, 405B)
- Mistral 7B
- Qwen 2.5
- DeepSeek R1 (671B)
- LLaVA 1.5 (vision)

Check full list: [exo supported models](https://github.com/exo-explore/exo)

## Discovery Methods

### UDP Discovery (Default)
Automatic local network discovery.

```bash
exo --discovery udp
```

No configuration needed. Works on same LAN/WiFi.

### Tailscale Discovery
For devices across networks.

**Prerequisites:**
- Tailscale installed and running on all devices
- All devices on same Tailscale network

```bash
exo --discovery tailscale
```

### Manual Discovery
Explicit peer configuration via JSON file.

**Config example:**
```json
{
  "peers": [
    {"id": "node1", "address": "192.168.1.10", "port": 50051},
    {"id": "node2", "address": "192.168.1.11", "port": 50051}
  ]
}
```

```bash
exo --discovery manual --manual-config config.json
```

## Model Management

### Storage Location
Default: `~/.cache/exo/downloads`

Custom via environment variable:
```bash
export EXO_HOME=/path/to/models
exo
```

### Downloading Models
Models auto-download from Hugging Face on first use.

**For restricted regions:**
```bash
HF_ENDPOINT=https://hf-mirror.com exo
```

**Manual download:**
1. Download model from Hugging Face
2. Place in `~/.cache/exo/downloads/{model_name}/`
3. Ensure proper directory structure

### Pre-downloading
Start exo with desired model to trigger download:
```bash
exo run llama-3.1-405b --prompt "test"
```

Model downloads once, cached for future use.

## Debugging

### General Debug Logs
```bash
DEBUG=9 exo
```
Levels: 0-9 (0=off, 9=verbose)

### tinygrad Debug Logs
```bash
TINYGRAD_DEBUG=2 exo
```
Levels: 1-6

### Combined
```bash
DEBUG=9 TINYGRAD_DEBUG=2 exo
```

### Discovery Debug
```bash
DEBUG_DISCOVERY=2 exo
```

## Heterogeneous Clusters

### macOS + Linux Example

**Device 1 (Mac):**
```bash
exo
# Uses MLX inference engine
```

**Device 2 (Linux):**
```bash
exo
# Uses tinygrad inference engine
```

**Interoperability:** MLX and tinygrad nodes work together seamlessly!

### Mixed Hardware
- M1 Mac (32GB) + NVIDIA RTX 4070 (16GB) + Raspberry Pi 400 (4GB)
- Total: 52GB memory
- Can run models up to ~50GB (llama-3.1-70b fp16)

## Performance Considerations

### Hardware Requirements
**Only requirement:** Total memory > model size

Examples for llama-3.1-8b (fp16, ~16GB):
- 2 x 8GB devices
- 1 x 16GB device
- 1 x 12GB + 1 x 4GB
- 4 x 4GB devices

### Latency vs Throughput
- **Adding devices:** Increases throughput, may increase latency
- **Single device:** Lowest latency
- **Distributed:** Higher throughput for concurrent requests

### Optimal Configurations
- **Speed critical:** Use single powerful device
- **Model too large:** Distribute across multiple devices
- **High concurrency:** Distribute for better throughput

## Environment Variables

### exo-Specific
- `EXO_HOME` - Model storage directory
- `DEBUG` - Debug log level (0-9)
- `DEBUG_DISCOVERY` - Discovery debug level
- `HF_ENDPOINT` - Hugging Face mirror endpoint

### tinygrad-Specific
- `TINYGRAD_DEBUG` - Debug level (1-6)
- `CLANG=1` - Force CPU backend
- See [tinygrad docs](https://docs.tinygrad.org/env_vars/) for full list

---

# Log
- 2025-12-16: Created comprehensive usage guide
