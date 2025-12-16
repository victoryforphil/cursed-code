# Local Models Agent - Ollama Tool Integration Update

**Date**: 2025-12-16  
**Commit Reference**: a6530e7  
**Tool**: New ollama.ts (9 functions)

## Summary of Changes

The local_models agent has been fully integrated with the new Ollama tool to enable practical model management capabilities. Users can now:

- ✅ List installed models with storage details
- ✅ Check running models and memory usage
- ✅ Pull/download new models from registry
- ✅ Stop/unload models to free memory
- ✅ Delete models to save disk space
- ✅ Inspect detailed model information
- ✅ Verify Ollama server is running
- ✅ Generate quick test responses from models
- ✅ Create model aliases for easy access

---

## Files Updated

### 1. `.opencode/agent/local_models.md`
**Changes**:
- Added "Tools" section documenting ollama tool access
- Updated rules with guidelines for using tools vs. expert knowledge
- Added reference to `ollama_tool.wiki.md`
- Enhanced resources section with tool documentation link

**Purpose**: Defines agent behavior and ensures users know about tool capabilities

### 2. `.opencode/experts/local_models/PROMPT.md`
**Changes**:
- Added "Ollama Tool Integration" section listing all 9 functions
- Added explicit rule: "Use ollama tool when providing information about..."
- Added "Combine tool + expert knowledge" guidance
- Updated resources section to highlight tool wiki as primary reference
- Updated log to track change

**Purpose**: Ensures the expert consistently uses the tool and knows when to apply it

### 3. `.opencode/opencode.json`
**Changes**:
- Added all 9 ollama tool functions to `agent.local_models.tools`:
  - `ollama_list: true`
  - `ollama_ps: true`
  - `ollama_pull: true`
  - `ollama_stop: true`
  - `ollama_rm: true`
  - `ollama_show: true`
  - `ollama_status: true`
  - `ollama_generate: true`
  - `ollama_copy: true`

**Purpose**: Enables the tools in OpenCode so agent can actually call them

### 4. `.opencode/experts/local_models/wiki/ollama_tool.wiki.md` (NEW)
**Content**:
- Overview of all 9 functions with parameters and descriptions
- Example usage patterns for each function
- Output formats showing what users will see
- When to use each tool
- Workflow patterns (system health check, download & test, memory management, model comparison)
- Error handling with fixes
- Integration notes
- Best practices
- 2000+ lines of comprehensive reference material

**Purpose**: Single source of truth for tool usage, enabling agent to respond effectively

---

## How It Works

### Agent-Tool Integration Flow

```
User Query
    ↓
Local Models Agent receives request
    ↓
Agent evaluates if tool needed:
    • Factual questions about models? → Use tool
    • Recommendations based on benchmarks? → Use expert knowledge
    • Need to check current state? → Use tool
    • Explaining concepts? → Use expert knowledge
    ↓
Tool executes (if applicable)
    ↓
Agent combines:
    • Tool output (current state)
    • Expert knowledge (interpretation, recommendations)
    ↓
Comprehensive response to user
```

### Example Scenarios

**Scenario 1: "What models do I have?"**
1. Agent calls `ollama_list`
2. Tool returns formatted list with sizes and dates
3. Agent presents results to user
4. Expert context not needed

**Scenario 2: "Should I use qwen2.5-coder or deepseek-r1 for coding?"**
1. Agent calls `ollama_show` for both models to get specs
2. Agent applies expert knowledge about model capabilities
3. Agent calls `ollama_generate` with test prompt on both (optional)
4. Agent recommends based on use case

**Scenario 3: "My model is slow"**
1. Agent calls `ollama_status` to verify server
2. Agent calls `ollama_ps` to check memory/what's running
3. Agent calls `ollama_show` on running models
4. Agent applies expert knowledge about optimization
5. Provides recommendations (free memory, use smaller model, adjust settings, etc.)

---

## Tool Reference Quick Summary

| Function | Purpose | Parameters | Use Case |
|----------|---------|-----------|----------|
| `ollama_list` | List models | None | Inventory check |
| `ollama_ps` | Running models | None | Memory check |
| `ollama_pull` | Download model | model_name | Get new model |
| `ollama_stop` | Unload model | model_name | Free memory |
| `ollama_rm` | Delete model | model_name | Cleanup storage |
| `ollama_show` | Model details | model_name | Understand specs |
| `ollama_status` | Server health | None | Troubleshoot |
| `ollama_generate` | Quick test | model, prompt, system | Quality check |
| `ollama_copy` | Create alias | source, destination | Setup variants |

---

## Recommendations for Future Enhancements

### 1. **Add Ollama Shell Commands to Agent**
Currently: Tools only, no bash
Recommendation: Enable limited bash access for advanced users:
- Check Ollama logs: `tail -f ~/.ollama/logs`
- Monitor real-time performance: `watch ollama ps`
- Debug GPU offloading: `OLLAMA_DEBUG=1 ollama run model`

**Implementation**: Update `.opencode/opencode.json` to conditionally enable bash with restricted permissions

### 2. **Create Model Benchmark Flows**
Documentation to guide users through:
- Speed testing workflow (ollama_generate with timings)
- Memory usage profiling workflow (ollama_ps monitoring)
- Quality assessment workflow (test prompts, compare outputs)
- Create benchmark comparison templates

**Location**: `.opencode/experts/local_models/flows/benchmark.flow.md`

### 3. **Add Environment Configuration Helper**
Create a flow or tool to help users:
- Check current OLLAMA settings
- Recommend M1 Max 32GB settings
- Guide through Flash Attention setup
- Create `.zshrc` or `.bashrc` additions

**Implementation**: Shell script in `.opencode/scripts/` + reference in expert

### 4. **Model Recommendation Decision Tree**
Add structured flow showing:
- Task → (coding/reasoning/tool-use/chat)
- Performance tier → (fast/balanced/quality)
- Memory constraints → (8GB/16GB/32GB)
- Recommended model(s)

**Location**: `.opencode/experts/local_models/flows/model_selection.flow.md`

### 5. **Quantization Comparison Data**
Track actual benchmarks for M1 Max:
- Model: qwen2.5-coder:32b
- Quantizations: Q4_K_M, Q5_K_M, Q6_K, Q8_0
- Metrics: Speed (t/s), Memory (GB), Quality score

**Location**: `.opencode/experts/local_models/models/` (sync with repo root models/)

### 6. **Custom Modelfile Wizard**
Help users create optimized variants:
- System prompts for specific tasks
- Temperature/top_p tuning
- Context window optimization
- Integration with agent workflows

**Reference**: Already documented in `ollama_usage.wiki.md`, can expand with interactive guide

### 7. **Integration with SWE Workflow**
Connect model selection to the planner → architect → coder pipeline:
- Planner: Use reasoning model (deepseek-r1)
- Architect: Use coding model (qwen2.5-coder)
- Coder: Use coding model or tool-use model
- Add model switching logic to workflow

**Requires**: Coordination with swe_workflow expert

### 8. **Performance Monitoring Dashboard**
Create a flow to:
- Track model load/unload frequency
- Log speed metrics from ollama_generate
- Alert on memory pressure
- Suggest optimizations based on patterns

**Tools Needed**: Logging infrastructure, metrics collection

### 9. **Automated Model Sync Script**
Enhance `.opencode/scripts/sync-models`:
- Auto-detect installed models
- Update `opencode.json` provider section
- Version tracking
- Backup original config

**Current State**: Referenced in wiki, might not exist yet

### 10. **Temperature/Parameter Tuning Guide**
Add wiki documenting:
- Temperature effects on different models
- Top_p vs Top_k trade-offs
- Context window sizing for M1 Max
- System prompt best practices per model

**Location**: `.opencode/experts/local_models/wiki/tuning.wiki.md`

---

## Usage Instructions for Users

### For Users Interacting with local_models Agent

**Basic Model Check:**
```
You: "What models do I have installed?"
Agent: [uses ollama_list, shows models with sizes and dates]
```

**Download a Model:**
```
You: "Pull the deepseek-r1:32b model"
Agent: [uses ollama_pull, shows progress, confirms]
```

**Quick Performance Test:**
```
You: "Test qwen2.5-coder with 'Write a Python function for factorial'"
Agent: [uses ollama_generate, shows response and tokens/sec]
```

**Check Memory:**
```
You: "What's using memory right now?"
Agent: [uses ollama_ps, shows running models and VRAM usage]
```

**Get Model Details:**
```
You: "Tell me about the qwen2.5-coder:32b model"
Agent: [uses ollama_show, displays parameters, quantization, family, etc.]
```

### For Developers Maintaining local_models Agent

1. **Refer to wiki for tool details**: `.opencode/experts/local_models/wiki/ollama_tool.wiki.md`
2. **Check tool source**: `.opencode/tool/ollama.ts` (9 exported functions)
3. **Update expert on new patterns**: Document in fix/ files
4. **Add workflows as discovered**: Store in flows/ directory
5. **Track benchmarks**: Update models/ directory with findings

---

## Validation Checklist

- ✅ Ollama tool (`.opencode/tool/ollama.ts`) exists with 9 functions
- ✅ All 9 functions added to local_models agent config in `opencode.json`
- ✅ Agent definition updated (`.opencode/agent/local_models.md`)
- ✅ Expert PROMPT updated (`.opencode/experts/local_models/PROMPT.md`)
- ✅ Tool wiki created (`.opencode/experts/local_models/wiki/ollama_tool.wiki.md`)
- ✅ Existing ollama_usage.wiki.md preserved and cross-referenced
- ✅ Clear documentation of when to use tool vs. expert knowledge
- ✅ Error handling patterns documented
- ✅ Workflow patterns provided for common scenarios

---

## Next Steps

1. **Test the integration**: Ask local_models agent to list models, check status, etc.
2. **Gather user feedback**: See which workflows are most useful
3. **Implement high-priority enhancements**: Start with #1 (bash commands) and #2 (benchmark flows)
4. **Document real-world usage**: Add solved problems to fix/ directory
5. **Expand model benchmarks**: Systematically test and document performance
6. **Integrate with other agents**: Consider model selection in planner/architect

---

# Log
- 2025-12-16: Created comprehensive update documentation
- 2025-12-16: Integrated ollama tool with local_models agent
- 2025-12-16: Created ollama_tool.wiki.md with complete reference
- 2025-12-16: Updated agent definition and expert PROMPT
- 2025-12-16: Provided 10 recommendations for future enhancements
