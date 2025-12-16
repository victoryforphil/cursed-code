# Local Models Research List

Models discovered and synced from Ollama on 2025-12-16. Each model should be evaluated and documented in the wiki.

## Priority: High (Primary Task Tools)

These models are currently used for primary tasks. Understand their strengths, weaknesses, and optimal use cases.

- [ ] **qwen2.5-coder:32b** (19 GB) - Coding model
  - Task: Document benchmarks, coding capabilities, context limits
  - Reference: `wiki/model_evaluation.wiki.md`

- [ ] **deepseek-r1:32b** (19 GB) - Reasoning model
  - Task: Document reasoning capabilities, GSM8K performance, context handling
  - Reference: `wiki/model_evaluation.wiki.md`

- [ ] **llama3-groq-tool-use:8b** (4.7 GB) - Function calling model
  - Task: Document tool use capabilities, BFCL scores, reliability
  - Reference: `wiki/model_evaluation.wiki.md`

## Priority: Medium (Alternative/Specialized)

Smaller or specialized models worth understanding for edge cases or optimization.

- [ ] **qwen3-coder:30b** (18 GB) - Latest Qwen coding iteration
  - Task: Compare to qwen2.5-coder, benchmark improvements, trade-offs

- [ ] **mistral-small:22b** (12 GB) - Compact reasoning alternative
  - Task: Compare to deepseek-r1:32b, speed vs quality trade-off

- [ ] **qwen3:14b** (9.3 GB) - Medium Qwen model
  - Task: Benchmark for multi-task capability

- [ ] **deepseek-r1:14b** (9.0 GB) - Medium reasoning model
  - Task: Compare speed/quality to 32b variant

- [ ] **qwen3:8b** (5.2 GB) - Compact Qwen model
  - Task: Benchmark for lightweight use cases

- [ ] **deepseek-r1:8b** (5.2 GB) - Compact reasoning model
  - Task: Compare to llama3-groq-tool-use for tool calling

- [ ] **gemma3:4b** (3.3 GB) - Compact model
  - Task: Benchmark for minimal resource scenarios

## Priority: Low (Archive/Research)

Older or niche models worth documenting but not primary focus.

- [ ] **llama2-uncensored:7b** (3.8 GB) - Older generation
  - Task: Archive note on deprecation status

- [ ] **neural-chat:7b** (4.1 GB) - Specialized chat model
  - Task: Research specialized use cases

- [ ] **gpt-oss:20b** (13 GB) - Open-source GPT variant
  - Task: Research architecture and capabilities

- [ ] **qwen2.5-coder:1.5b** (986 MB) - Tiny coding model
  - Task: Benchmark for resource-constrained scenarios

- [ ] **gemma3:1b** (815 MB) - Minimal model
  - Task: Benchmark for absolute minimum resource usage

- [ ] **deepseek-r1:1.5b** (1.1 GB) - Minimal reasoning model
  - Task: Benchmark for resource constraints

- [ ] **qwen3:0.6b** (522 MB) - Ultra-minimal model
  - Task: Research feasibility for edge scenarios

## Evaluation Template

For each model, create or update `wiki/model_evaluation.wiki.md`:

```markdown
## {Model Name}

**Size:** {size} | **Task:** {task}

### Benchmarks
- {benchmark}: {score}

### Strengths
- {strength 1}

### Weaknesses
- {weakness 1}

### Use Cases
- {use case 1}

### Notes
{observations}
```

## Research Workflow

1. Use `ollama show {model}` to get detailed info
2. Test on sample tasks (coding, reasoning, tool use)
3. Compare against baselines in Priority: High
4. Document findings in wiki
5. Update `models/{model-name}.md` with comprehensive evaluation

## Follow-up Tasks

- [ ] Create comprehensive model evaluation matrix
- [ ] Document optimization strategies per model class
- [ ] Benchmark memory/speed trade-offs at different quantizations
- [ ] Build decision tree for model selection by use case
- [ ] Archive findings in `docs/model_benchmarks/`

---

**Last Updated:** 2025-12-16  
**Total Models:** 17  
**Status:** Ready for research phase
