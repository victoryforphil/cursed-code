# qwen2.5-coder:32b

## Overview
Best coding model for M1 Max 32GB. Approaches GPT-4o on coding tasks.

## Stats
- **Size**: 19 GB (Q4_K_M quantization)
- **Parameters**: 32B
- **Context**: 32K (128K capable with optimizations)
- **Quantization**: Q4_K_M (default)
- **Architecture**: Qwen2.5

## Performance on M1 Max 32GB
- **Speed**: 8-12 tokens/sec
- **Memory Usage**: 18-20 GB (with optimizations)
- **Quality vs FP16**: 97%

## Benchmarks
- **HumanEval**: 79-82%
- **Languages**: 92+ (Python, JS, TS, Go, Rust expert)
- **Code Quality**: 9.5/10

## Use Cases
- ✅ Professional development
- ✅ Complex refactoring
- ✅ Multi-file changes
- ✅ Code review and debugging
- ✅ Documentation generation
- ✅ Test writing

## Strengths
- Exceptional instruction following
- Strong multi-language support
- Good at understanding context
- Produces idiomatic code
- Great at explaining code

## Example Prompts
```
Write a Python function to parse JSON logs and extract error messages
```

```
Refactor this React component to use hooks and improve performance
```

```
Review this code and suggest optimizations for readability
```

## Usage Notes
- Enable Flash Attention for 20-30% memory savings
- Use Q4_K_M for best speed/quality balance
- Upgrade to Q5_K_M if you need extra quality (20% slower)
- Keep context under 32K for best performance
- Excellent for pair programming workflows

## Performance Tips
- Close other apps when using for maximum speed
- Use temperature 0.2-0.7 for code generation
- Higher temps (0.8-1.0) for creative solutions
- Works great with 8K-16K context for most tasks

## Installed
- **Date**: 2024-12-16
- **ID**: b92d6a0bd47e
- **Active Use**: Primary coding assistant

# Log
- 2024-12-16: Downloaded and configured
