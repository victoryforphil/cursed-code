# exo: Run your own AI cluster at home with everyday devices

**Source:** https://github.com/exo-explore/exo
**License:** GPL-3.0
**Stars:** 32.8k

## Overview

exo enables running distributed inference across heterogeneous devices - iPhones, iPads, Android, Mac, NVIDIA, Raspberry Pi, and more. Started as a desire to run research experiments on large language models using existing hardware.

## Key Features

### Wide Model Support
- LLaMA (MLX and tinygrad implementations)
- Mistral
- LlaVA
- Qwen
- Deepseek

### Dynamic Model Partitioning
Optimally splits models based on current network topology and device resources. Enables running larger models than possible on a single device.

### Automatic Device Discovery
Automatically discovers other devices using the best method available:
- UDP Discovery
- Tailscale Discovery
- Manual Discovery

Zero manual configuration required.

### ChatGPT-compatible API
Provides ChatGPT-compatible API for running models. One-line change to run models on your own hardware.

API endpoint: `http://localhost:52415/v1/chat/completions`

### Device Equality
Unlike master-worker architectures, exo uses peer-to-peer connections. Any device in the network can be used to run models.

### Partitioning Strategies
- **Ring Memory Weighted Partitioning** (default): Runs inference in a ring where each device runs layers proportional to its memory

## Installation

### Prerequisites
- Python >= 3.12.0 (required for asyncio fixes)
- For NVIDIA GPU support (Linux only):
  - NVIDIA driver (verify: `nvidia-smi`)
  - CUDA toolkit (verify: `nvcc --version`)
  - cuDNN library

### Hardware Requirements
Only requirement: enough total memory across all devices to fit the entire model.

Examples for llama 3.1 8B (fp16) requiring 16GB:
- 2 x 8GB M3 MacBook Airs
- 1 x 16GB NVIDIA RTX 4070 Ti Laptop
- 2 x Raspberry Pi 400 (4GB each) + 1 x 8GB Mac Mini

Heterogeneous capabilities supported - less capable devices slow individual latency but increase overall throughput.

### From Source
```bash
git clone https://github.com/exo-explore/exo.git
cd exo
pip install -e .
# alternatively, with venv
source install.sh
```

### Performance Tips (macOS)
1. Upgrade to latest macOS Sequoia
2. Run `./configure_mlx.sh` for GPU memory optimization on Apple Silicon

## Usage

### Basic Multi-Device Setup

**Device 1:**
```bash
exo
```

**Device 2:**
```bash
exo
```

Automatic discovery - no configuration needed.

Web UI available at: `http://localhost:52415`

### API Examples

**Llama 3.2 3B:**
```bash
curl http://localhost:52415/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
     "model": "llama-3.2-3b",
     "messages": [{"role": "user", "content": "What is the meaning of exo?"}],
     "temperature": 0.7
   }'
```

**Llama 3.1 405B:**
```bash
curl http://localhost:52415/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
     "model": "llama-3.1-405b",
     "messages": [{"role": "user", "content": "What is the meaning of exo?"}],
     "temperature": 0.7
   }'
```

**DeepSeek R1 (671B):**
```bash
curl http://localhost:52415/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
     "model": "deepseek-r1",
     "messages": [{"role": "user", "content": "What is the meaning of exo?"}],
     "temperature": 0.7
   }'
```

**LLaVA 1.5 7B (Vision):**
```bash
curl http://localhost:52415/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
     "model": "llava-1.5-7b-hf",
     "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "What are these?"
          },
          {
            "type": "image_url",
            "image_url": {
              "url": "http://images.cocodataset.org/val2017/000000039769.jpg"
            }
          }
        ]
      }
    ],
     "temperature": 0.0
   }'
```

### Heterogeneous Devices (macOS + Linux)

**Device 1 (macOS):**
```bash
exo
```
Uses MLX inference engine by default. MLX and tinygrad are interoperable!

**Device 2 (Linux):**
```bash
exo
```
Linux defaults to tinygrad inference engine.

Configure tinygrad with env vars (see [tinygrad docs](https://docs.tinygrad.org/env_vars/)).
Example: Use CPU with `CLANG=1`

### Single Device with CLI

```bash
exo run llama-3.2-3b
```

With custom prompt:
```bash
exo run llama-3.2-3b --prompt "What is the meaning of exo?"
```

## Model Management

### Storage
Default: `~/.cache/exo/downloads`

Custom location via `EXO_HOME` environment variable.

### Downloading
Models downloaded from Hugging Face.

For countries with internet censorship, manually download to `~/.cache/exo/downloads`.

Use proxy with `HF_ENDPOINT`:
```bash
HF_ENDPOINT=https://hf-mirror.com exo
```

## Debugging

Enable debug logs (0-9):
```bash
DEBUG=9 exo
```

For tinygrad specifically (1-6):
```bash
TINYGRAD_DEBUG=2 exo
```

## Architecture Components

### Inference Engines
- ✅ MLX (Apple Silicon optimized)
- ✅ tinygrad (cross-platform)
- 🚧 PyTorch
- 🚧 llama.cpp

### Discovery Modules
- ✅ UDP
- ✅ Manual
- ✅ Tailscale
- 🚧 Radio
- 🚧 Bluetooth

### Peer Networking
- ✅ GRPC
- 🚧 NCCL

## Code Structure

Key modules:
- `exo/orchestration/node.py` - Core Node class for distributed orchestration
- `exo/inference/inference_engine.py` - Inference engine abstraction
- `exo/inference/mlx/` - MLX implementation
- `exo/inference/tinygrad/` - tinygrad implementation
- `exo/networking/` - Discovery and peer networking
- `exo/topology/` - Partitioning strategies
- `exo/api/chatgpt_api.py` - ChatGPT-compatible API
- `exo/download/` - Model downloading and shard management

## Known Issues

1. **macOS SSL Certificates:** Run `Install Certificates` command:
   ```bash
   /Applications/Python 3.x/Install Certificates.command
   ```

2. **iOS Implementation:** Currently outdated, being reworked. Contact alex@exolabs.net for access.

## Contributing

exo is experimental software. Bug reports and contributions welcome.

Bounty list: [Google Sheet](https://docs.google.com/spreadsheets/d/1cTCpTIp48UnnIvHeLEUNg1iMy_Q6lRybgECSFCoVJpE/edit?usp=sharing)

Community:
- [Discord](https://discord.gg/EUnjGpsmWw)
- [Telegram](https://t.me/+Kh-KqHTzFYg3MGNk)
- [X (Twitter)](https://x.com/exolabs)

## Hiring
exo is hiring - see [exolabs.net](https://exolabs.net)

---

# Log
- 2025-12-16: Created from exo GitHub README
