# exo Tool Integration Patterns

**Last Updated:** 2025-12-16

## Tool Design Philosophy

Following the Ollama tool pattern, create tools for:
1. **Status checking** - Is exo running? Cluster health?
2. **Node management** - List nodes, check topology
3. **Model operations** - List available models, download, run
4. **Monitoring** - Performance metrics, shard distribution

## Proposed exo Tools

### Status Tools

#### `exo_status`
Check if exo cluster is running.

**Implementation:**
```python
# Check for exo process
ps aux | grep "exo" | grep -v grep

# OR check API endpoint
curl -s http://localhost:52415/health
```

**Returns:**
- Running status (bool)
- API port
- Node ID
- Number of connected peers

#### `exo_cluster_info`
Show cluster topology and partitioning.

**Implementation:**
```python
# Query exo API for cluster status
# Parse topology information
```

**Returns:**
- Connected nodes (ID, address, capabilities)
- Current model shards and assignments
- Ring topology visualization
- Memory distribution

### Node Management Tools

#### `exo_list_nodes`
List all nodes in cluster.

**Implementation:**
```python
# Query discovery mechanism
# Get peer list from Node orchestrator
```

**Returns:**
```json
{
  "nodes": [
    {
      "id": "node1",
      "address": "192.168.1.10:50051",
      "device": "M1 Max",
      "memory": "32GB",
      "inference_engine": "mlx"
    },
    {
      "id": "node2", 
      "address": "192.168.1.11:50051",
      "device": "RTX 4070",
      "memory": "16GB",
      "inference_engine": "tinygrad"
    }
  ]
}
```

#### `exo_node_health`
Check health of specific node.

**Parameters:**
- `node_id` - Target node identifier

**Returns:**
- Status (healthy, degraded, down)
- Last seen timestamp
- Current shard assignments
- Resource usage

### Model Tools

#### `exo_list_models`
List available models (downloaded + supported).

**Implementation:**
```python
# Check ~/.cache/exo/downloads for downloaded models
# Query supported models from exo
```

**Returns:**
```json
{
  "downloaded": [
    {
      "name": "llama-3.2-3b",
      "size": "6GB",
      "path": "~/.cache/exo/downloads/llama-3.2-3b"
    }
  ],
  "supported": [
    "llama-3.1-405b",
    "deepseek-r1",
    "mistral-7b"
  ]
}
```

#### `exo_download_model`
Pre-download a model.

**Parameters:**
- `model_name` - Model identifier
- `--progress` - Show download progress

**Implementation:**
```bash
# Trigger exo model download
exo run $model_name --prompt "test" --max-tokens 1
```

#### `exo_run_model`
Run inference with a model.

**Parameters:**
- `model_name` - Model identifier
- `prompt` - Input prompt
- `--temperature` - Sampling temperature
- `--max-tokens` - Max generation length

**Implementation:**
```bash
curl http://localhost:52415/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
     "model": "'$model_name'",
     "messages": [{"role": "user", "content": "'$prompt'"}],
     "temperature": '$temperature'
   }'
```

### Monitoring Tools

#### `exo_shard_distribution`
Show how model shards are distributed across nodes.

**Returns:**
```json
{
  "model": "llama-3.1-405b",
  "total_layers": 80,
  "distribution": [
    {
      "node_id": "node1",
      "layers": "0-53",
      "memory_used": "28GB"
    },
    {
      "node_id": "node2",
      "layers": "54-80", 
      "memory_used": "14GB"
    }
  ]
}
```

#### `exo_performance_metrics`
Get cluster performance stats.

**Returns:**
- Requests per second
- Average latency
- Tokens per second
- Network bandwidth usage
- Memory usage per node

### Discovery Tools

#### `exo_discover`
Manually trigger peer discovery.

**Parameters:**
- `--method` - Discovery method (udp, tailscale, manual)
- `--wait-for-peers` - Number of peers to wait for

**Implementation:**
```bash
# Trigger discovery via exo API or CLI
```

#### `exo_add_peer`
Manually add a peer (for manual discovery).

**Parameters:**
- `peer_id` - Peer identifier
- `address` - IP:port
- `capabilities` - Device capabilities (optional)

## Tool Implementation Patterns

### CLI Wrapper Pattern
```python
import subprocess
import json

def exo_status():
    try:
        result = subprocess.run(
            ["ps", "aux"],
            capture_output=True,
            text=True,
            timeout=5
        )
        is_running = "exo" in result.stdout
        
        # Check API
        api_check = subprocess.run(
            ["curl", "-s", "http://localhost:52415/health"],
            capture_output=True,
            text=True,
            timeout=2
        )
        
        return {
            "running": is_running,
            "api_responsive": api_check.returncode == 0
        }
    except Exception as e:
        return {"error": str(e)}
```

### API Client Pattern
```python
import aiohttp

async def exo_cluster_info():
    async with aiohttp.ClientSession() as session:
        async with session.get("http://localhost:52415/cluster/info") as resp:
            if resp.status == 200:
                return await resp.json()
            else:
                return {"error": f"API returned {resp.status}"}
```

### File System Pattern
```python
import os
from pathlib import Path

def exo_list_models():
    exo_home = os.getenv("EXO_HOME", os.path.expanduser("~/.cache/exo"))
    downloads_dir = Path(exo_home) / "downloads"
    
    if not downloads_dir.exists():
        return {"downloaded": []}
    
    models = []
    for model_dir in downloads_dir.iterdir():
        if model_dir.is_dir():
            size = sum(f.stat().st_size for f in model_dir.rglob("*"))
            models.append({
                "name": model_dir.name,
                "size": f"{size / (1024**3):.2f}GB",
                "path": str(model_dir)
            })
    
    return {"downloaded": models}
```

## Integration with OpenCode

### Tool Registration
```typescript
// In OpenCode tool definition
{
  "name": "exo_status",
  "description": "Check if exo cluster is running",
  "parameters": {},
  "implementation": "scripts/exo-tools/status.sh"
}
```

### Agent Integration
Agents can use exo tools to:
- Check cluster status before running large models
- Select between Ollama (single-device) vs exo (distributed)
- Monitor resource usage
- Manage model downloads

### Workflow Example
```
User: "Run llama-3.1-405b"

Agent:
1. Check model size (800GB)
2. Run exo_cluster_info
3. If cluster has < 800GB total memory:
   - Error: "Not enough cluster memory"
4. Else:
   - Run exo_run_model("llama-3.1-405b", prompt)
```

## Future Tool Ideas

### Advanced Monitoring
- `exo_network_latency` - Measure inter-node latency
- `exo_throughput_benchmark` - Run throughput tests
- `exo_model_benchmark` - Compare model performance

### Management
- `exo_restart_node` - Restart specific node
- `exo_rebalance_shards` - Trigger shard rebalancing
- `exo_clear_cache` - Clear downloaded models

### Integration
- `exo_export_config` - Export cluster configuration
- `exo_import_config` - Import cluster setup
- `exo_sync_models` - Sync models across nodes

---

# Log
- 2025-12-16: Created exo tool integration patterns
