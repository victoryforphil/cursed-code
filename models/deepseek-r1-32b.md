# deepseek-r1:32b

## Overview
Best reasoning model for M1 Max 32GB. Features visible chain-of-thought reasoning.

## Stats
- **Size**: 19 GB (Q4_K_M quantization)
- **Parameters**: 32B
- **Context**: 128K capable
- **Quantization**: Q4_K_M (default)
- **Architecture**: DeepSeek-R1 (distilled to Qwen)

## Performance on M1 Max 32GB
- **Speed**: 6-8 tokens/sec
- **Memory Usage**: 18-20 GB (with optimizations)
- **Quality**: 9.5/10 reasoning

## Benchmarks
- **GSM8K** (Math): 93.2%
- **Reasoning Quality**: Exceptional
- **Chain-of-Thought**: Visible, detailed

## Use Cases
- ✅ Complex reasoning tasks
- ✅ Mathematical problem solving
- ✅ Logic puzzles
- ✅ Multi-step analysis
- ✅ Debugging complex issues
- ✅ Algorithm design

## Strengths
- Shows its reasoning process
- Excellent at breaking down problems
- Strong mathematical capabilities
- Good at catching edge cases
- Explains why, not just what

## Example Prompts
```
Solve this algorithm problem step-by-step: [problem]
```

```
Debug this complex state management issue and explain the root cause
```

```
Design an algorithm for [task] considering time/space complexity
```

## Usage Notes
- Slower than other models due to reasoning overhead
- Shows thinking process explicitly (valuable for debugging)
- Best for problems requiring deep analysis
- May be overkill for simple tasks
- Excellent teaching tool

## Performance Tips
- Give it complex problems where reasoning matters
- Use for code reviews of tricky logic
- Great for explaining "why" something works/doesn't work
- Combine with qwen2.5-coder for implementation
- Patience pays off - reasoning takes time

## Workflow Integration
**Ideal pattern**:
1. Use deepseek-r1:32b for analysis and design
2. Use qwen2.5-coder:32b for implementation
3. Use deepseek-r1:32b for verification

## Installed
- **Date**: 2024-12-16
- **ID**: edba8017331d
- **Active Use**: Complex reasoning, debugging

# Log
- 2024-12-16: Downloaded and configured
