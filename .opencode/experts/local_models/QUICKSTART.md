# Quick Start: Using the Local Models Agent with Ollama Tool

**Updated**: 2025-12-16  
**Agent**: local_models  
**Tools**: 9 Ollama functions enabled

## What's New

The local_models agent now has direct access to 9 Ollama management functions:
- List, check, download, manage, and test models
- No need to use command line - ask the agent!
- Intelligent use of tools + expert recommendations

## Try It Now

### 1. Check Your System

**Ask**:
```
"Is Ollama running and what models do I have?"
```

**Agent will**:
1. Check if Ollama server is running (`ollama_status`)
2. List all installed models (`ollama_list`)
3. Show models with sizes and dates

---

### 2. Download a Model

**Ask**:
```
"Pull the deepseek-r1:32b model"
```

**Agent will**:
1. Download the model (`ollama_pull`)
2. Show progress
3. Confirm when complete

---

### 3. Check Memory Usage

**Ask**:
```
"What models are currently running?"
```

**Agent will**:
1. Check running models (`ollama_ps`)
2. Show memory usage
3. Suggest actions if needed

---

### 4. Get Model Details

**Ask**:
```
"Tell me about the qwen2.5-coder:32b model"
```

**Agent will**:
1. Inspect model (`ollama_show`)
2. Show parameters, quantization, family
3. Explain what it's good for

---

### 5. Test a Model

**Ask**:
```
"Test qwen2.5-coder with: Write a Python function for Fibonacci"
```

**Agent will**:
1. Generate response (`ollama_generate`)
2. Show the model's output
3. Display speed (tokens/sec)

---

### 6. Free Up Memory

**Ask**:
```
"Stop the 32B model to free memory"
```

**Agent will**:
1. Find the running model
2. Stop it (`ollama_stop`)
3. Show freed memory

---

### 7. Compare Models

**Ask**:
```
"Compare qwen2.5-coder and deepseek-r1 - test each with 'What is 2+2?'"
```

**Agent will**:
1. Test first model (`ollama_generate`)
2. Test second model (`ollama_generate`)
3. Compare responses and speeds

---

### 8. Create an Alias

**Ask**:
```
"Create an alias 'coder' for qwen2.5-coder:32b"
```

**Agent will**:
1. Create the alias (`ollama_copy`)
2. Confirm you can now use 'coder' as shorthand

---

### 9. Clean Up Storage

**Ask**:
```
"Delete the old-model:tag to save disk space"
```

**Agent will**:
1. Confirm the model exists
2. Delete it (`ollama_rm`)
3. Show freed disk space

---

## Function Reference

| Ask About | Function | Get |
|-----------|----------|-----|
| Installed models | `ollama_list` | List with sizes, dates |
| Running models | `ollama_ps` | Current models, memory |
| Download model | `ollama_pull` | Progress, confirmation |
| Stop model | `ollama_stop` | Memory freed |
| Delete model | `ollama_rm` | Storage freed |
| Model details | `ollama_show` | Specs, quantization, type |
| Server status | `ollama_status` | Running? How many models? |
| Quick test | `ollama_generate` | Response + tokens/sec |
| Create alias | `ollama_copy` | Alias confirmed |

---

## Expert Recommendations

The agent also combines tool results with expert knowledge:

**Example**:
```
You: "Should I use qwen2.5-coder or deepseek-r1 for code generation?"

Agent:
1. Checks details of both models
2. Considers your M1 Max 32GB memory
3. Explains differences:
   - Qwen 2.5 Coder: Optimized for coding tasks (79-82% HumanEval)
   - DeepSeek R1: Better reasoning but slower (93.2% GSM8K)
4. Recommends: "Use qwen2.5-coder for fast coding, deepseek-r1 for complex reasoning"
5. Suggests: "You can run both - they use ~40GB total"
```

---

## Common Workflows

### Setup New Model
```
1. Ask: "What's the best coding model for M1 Max?"
2. Ask: "Pull qwen2.5-coder:32b"
3. Ask: "Tell me about qwen2.5-coder:32b"
4. Ask: "Test it with: [your test prompt]"
5. Ask: "Is it running? How much memory?"
```

### Switch Between Models
```
1. Ask: "Stop qwen2.5-coder to free memory"
2. Ask: "Pull deepseek-r1:32b"  [if not installed]
3. Ask: "Show running models"
4. Ask: "Test deepseek-r1 with: [reasoning task]"
```

### Optimize for Your Workflow
```
1. Ask: "List my models"
2. Ask: "Which is fastest?"
3. Ask: "Create an alias 'fast' for the fastest model"
4. Ask: "Test the 'fast' alias"
5. Ask: "Check memory and speed benchmarks"
```

### Troubleshoot Issues
```
1. Ask: "Is Ollama running?"
2. Ask: "What models are loaded?"
3. Ask: "Show me the qwen model details"
4. Agent suggests fixes based on findings
```

---

## Tips & Tricks

✅ **Ask naturally** - Agent understands context
```
You: "I need fast inference. What should I use?"
Agent: Recommends based on benchmarks + your hardware
```

✅ **Combine with expert knowledge** - Tool data + recommendations
```
You: "Compare model X and Y"
Agent: Uses tools to get specs, applies expertise to recommend
```

✅ **Quick tests before committing** - Use ollama_generate
```
You: "Test this prompt on three different models"
Agent: Runs all three, shows results and speeds
```

✅ **Monitor resources** - Check memory before operations
```
You: "Before pulling new model, is there enough memory?"
Agent: Checks with ollama_ps, predicts if it'll fit
```

---

## Documentation

For deeper information:
- **Tool Details**: `.opencode/experts/local_models/wiki/ollama_tool.wiki.md` (2000+ lines)
- **Ollama Commands**: `.opencode/experts/local_models/wiki/ollama_usage.wiki.md`
- **M1 Max Setup**: `.opencode/experts/local_models/docs/best_models_for_m1_max_32gb.md`
- **Quantization**: `.opencode/experts/local_models/docs/quantization_optimization_guide.md`
- **Implementation**: `.opencode/experts/local_models/UPDATE_SUMMARY.md`

---

## Feedback & Issues

- Found a problem? Log it in `.opencode/experts/local_models/fix/`
- Discovered a workflow? Document in `.opencode/experts/local_models/flows/`
- New benchmark data? Add to `models/` in repo root

---

**Ready?** Ask the local_models agent anything about your models!

```
You: "What should I do with my models?"
Agent: [provides options and recommendations]
```

Happy model management! 🚀
