# Installed Models

This directory tracks Ollama models installed on this machine (M1 Max 32GB).

## Quick Reference

| Model | Size | Use Case | Speed | Quality |
|-------|------|----------|-------|---------|
| [qwen2.5-coder:32b](./qwen2.5-coder-32b.md) | 19GB | Coding | 8-12 t/s | 9.5/10 |
| [deepseek-r1:32b](./deepseek-r1-32b.md) | 19GB | Reasoning | 6-8 t/s | 9.5/10 |
| [llama3-groq-tool-use:8b](./llama3-groq-tool-use-8b.md) | 4.7GB | Function calling | 20-28 t/s | 9.5/10 |

## Syncing Models

Use the model sync script to update model providers and this directory:

```bash
./.opencode/scripts/sync-models
```

This will:
- Scan installed Ollama models
- Update `.opencode/opencode.json` model providers
- Update/create model documentation files in this directory
- Track model stats and usage

## Adding New Models

1. Research recommended models using the local_models expert
2. Download via `ollama pull <model>:<tag>`
3. Run `sync-models` to update configs
4. Optionally: Add custom usage notes to the model's .md file

## Model Files

Each model has a markdown file with:
- Stats (size, quantization, context length)
- Benchmarks (HumanEval, MMLU, etc.)
- Use cases and strengths
- Example prompts
- Performance notes for M1 Max 32GB

# Log
- 2024-12-16: Created models tracking directory
