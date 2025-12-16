# Ollama Tool Reference

Guide to using the ollama tool (`ollama_list`, `ollama_ps`, `ollama_pull`, `ollama_stop`, `ollama_rm`, `ollama_show`, `ollama_status`, `ollama_generate`, `ollama_copy`) for model management in the local_models agent.

## Tool Functions Overview

### ollama_list
**Purpose**: List all installed models with size and modification date

**Parameters**: None

**Example Usage**:
```
User: "What models do I have installed?"
Agent: Uses ollama_list to get current models
```

**Output Format**:
```
Installed models:
qwen2.5-coder:32b (19.3GB, 12/15/2025)
deepseek-r1:32b (20.1GB, 12/14/2025)
llama3-groq-tool-use:8b (4.7GB, 12/16/2025)
```

**When to use**:
- User asks about installed models
- Need to check available models before recommending
- Assessing storage/memory before pulling new models

---

### ollama_ps
**Purpose**: Show currently running/loaded models with memory usage

**Parameters**: None

**Example Usage**:
```
User: "Which models are running right now?"
Agent: Uses ollama_ps to check
```

**Output Format**:
```
Running models:
qwen2.5-coder:32b - 19.3GB total, 18.2GB VRAM
```

**When to use**:
- User asks what's currently loaded
- Need to check memory pressure
- Deciding if safe to load another model
- Troubleshooting performance issues

---

### ollama_pull
**Purpose**: Download/install a model from Ollama registry

**Parameters**:
- `model` (string): Model name with optional tag (e.g., "qwen2.5-coder:32b")

**Example Usage**:
```
User: "Pull the qwen2.5-coder 32B model"
Agent: Uses ollama_pull with model="qwen2.5-coder:32b"
```

**Output**: Shows pull progress and completion status

**When to use**:
- User requests to download a specific model
- First time setup for recommended model
- Testing new models

**Tips**:
- Use exact model name from Ollama library
- For untagged requests, defaults to `:latest`
- Shows progress during download
- Can be slow for 32B models (10-20 minutes)

---

### ollama_ps
**Purpose**: Show currently running/loaded models with memory usage

**Parameters**: None

**When to use**:
- User asks about running models
- Need to assess memory usage before operations
- Checking what's consuming resources

---

### ollama_stop
**Purpose**: Stop/unload a running model to free memory

**Parameters**:
- `model` (string): Model name to stop (e.g., "qwen2.5-coder:32b")

**Example Usage**:
```
User: "Stop the 32B model to free memory"
Agent: Uses ollama_stop with model="qwen2.5-coder:32b"
```

**Output**: Confirmation that model was stopped

**When to use**:
- User wants to manually unload a model
- Need to free memory for another task
- Performance optimization

**Note**: By default, models auto-unload after 5 minutes of inactivity. Manual stop is for immediate resource freeing.

---

### ollama_rm
**Purpose**: Delete an Ollama model from disk

**Parameters**:
- `model` (string): Model name to delete (e.g., "qwen2.5-coder:32b")

**Example Usage**:
```
User: "Delete the old model to save disk space"
Agent: Uses ollama_rm with model="old-model:tag"
```

**Output**: Confirmation that model was deleted

**When to use**:
- User wants to free disk space
- Removing old or unused models
- Storage management
- Testing different quantization versions

**Warning**: Deletion is permanent. Ensure correct model name before confirming.

---

### ollama_show
**Purpose**: Show detailed information about a model (parameters, quantization, template)

**Parameters**:
- `model` (string): Model name to inspect (e.g., "qwen2.5-coder:32b")

**Example Usage**:
```
User: "Tell me about the qwen2.5-coder:32b model"
Agent: Uses ollama_show with model="qwen2.5-coder:32b"
```

**Output Format**:
```
Model: qwen2.5-coder:32b
Parameters: 32B
Quantization: Q4_K_M
Family: qwen
Format: gguf
Modelfile: [first 500 chars...]
```

**When to use**:
- User asks details about a model
- Checking quantization level
- Understanding model capabilities
- Verifying model configuration

---

### ollama_status
**Purpose**: Check if Ollama server is running and responsive

**Parameters**: None

**Example Usage**:
```
User: "Is Ollama running?"
Agent: Uses ollama_status
```

**Output Format**:
```
✓ Ollama is running at http://localhost:11434
  3 model(s) installed
```

Or on failure:
```
✗ Ollama is not running at http://localhost:11434
  Start with: ollama serve
```

**When to use**:
- User reports model errors
- Troubleshooting connectivity issues
- First check in any workflow
- Verifying setup

---

### ollama_generate
**Purpose**: Send a quick one-shot prompt to a model and get response

**Parameters**:
- `model` (string): Model name (e.g., "qwen2.5-coder:32b")
- `prompt` (string): The prompt to send
- `system` (string, optional): Custom system prompt

**Example Usage**:
```
User: "Test qwen2.5-coder with 'Write a hello world in Python'"
Agent: Uses ollama_generate with:
  - model: "qwen2.5-coder:32b"
  - prompt: "Write a hello world in Python"
```

**Output**:
```
print("Hello, World!")

[12.4 tokens/sec]
```

**When to use**:
- Quick model testing
- Comparing outputs from different models
- Benchmarking speed
- Quality checks before committing to a model

**Tips**:
- Great for quick experimentation
- Shows tokens/sec performance
- Optional system prompt for role-playing

---

### ollama_copy
**Purpose**: Create a copy/alias of an existing model with new name

**Parameters**:
- `source` (string): Source model name
- `destination` (string): New model name

**Example Usage**:
```
User: "Create an alias 'coder' for qwen2.5-coder:32b"
Agent: Uses ollama_copy with:
  - source: "qwen2.5-coder:32b"
  - destination: "coder"
```

**Output**: Confirmation of copy

**When to use**:
- Creating custom model aliases for easy access
- Setting up specialized model variants
- Creating named snapshots for different purposes

---

## Workflow Patterns

### Check System Health
```
1. ollama_status → Verify server is running
2. ollama_ps → See what's loaded
3. ollama_list → Verify models exist
```

### Download and Test New Model
```
1. ollama_pull model_name:tag → Download
2. ollama_show model_name:tag → Check config
3. ollama_generate model_name:tag "test prompt" → Quick test
```

### Memory Management
```
1. ollama_ps → Check current memory
2. ollama_stop model_name → Free memory if needed
3. Pull or run new model
```

### Model Comparison
```
1. ollama_generate model1 "Test question"
2. ollama_generate model2 "Test question"
3. Compare outputs and speeds
```

---

## Error Handling

### "Ollama is not running"
**Fix**: User must start Ollama with `ollama serve` in terminal

### "Model not found"
**Fix**: Check model name with `ollama_list`, use exact name with `ollama_pull`

### "Not enough memory"
**Fix**: 
1. Use `ollama_stop` to unload current model
2. Check `ollama_ps` for memory usage
3. Consider smaller quantization or model

### "Connection refused at localhost:11434"
**Fix**: Verify OLLAMA_HOST environment variable or restart Ollama

---

## Integration with Agent

The local_models agent has all 9 ollama functions enabled:
- `ollama_list`
- `ollama_ps`
- `ollama_pull`
- `ollama_stop`
- `ollama_rm`
- `ollama_show`
- `ollama_status`
- `ollama_generate`
- `ollama_copy`

**Usage Pattern**:
1. Agent receives user question about models
2. Agent evaluates which tool(s) needed
3. Tool executes and returns structured info
4. Agent combines tool output with expert knowledge
5. Provides comprehensive response with recommendations

---

## Best Practices

1. **Always check status first**: Call `ollama_status` before assuming Ollama is available
2. **Use list before operations**: Call `ollama_list` to verify model exists before pull/stop/rm
3. **Check memory before load**: Call `ollama_ps` to see available resources
4. **Test before commit**: Use `ollama_generate` for quick quality checks
5. **Show details for decisions**: Call `ollama_show` when user needs to understand a model

---

# Log
- 2025-12-16: Created comprehensive ollama tool reference
- 2025-12-16: Added all 9 functions with examples, workflows, and error handling
- 2025-12-16: Integrated with local_models agent configuration
