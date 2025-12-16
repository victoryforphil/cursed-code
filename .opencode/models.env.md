# OpenCode Model Definitions

This file defines environment variables for OpenCode model aliases.

## Setup

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
# Source OpenCode model definitions from cursed-code
[ -f ~/cursed-code/.opencode/models.env ] && source ~/cursed-code/.opencode/models.env
```

Or if your cursed-code is in a different location:

```bash
# Source OpenCode model definitions
[ -f /path/to/cursed-code/.opencode/models.env ] && source /path/to/cursed-code/.opencode/models.env
```

## Usage

After sourcing, you can reference models in `.opencode/opencode.json`:

```json
{
  "agent": {
    "git": {
      "model": "{env:OPENCODE_SUMMARY_FAST}"
    }
  }
}
```

## Available Aliases

See `.opencode/models.env` for current model definitions:

- `OPENCODE_SUMMARY_FAST` - Fast summarization (llama3-groq-tool-use:8b)
- `OPENCODE_TOOL_FAST` - Fast tool use (llama3-groq-tool-use:8b)
- `OPENCODE_CODE_FAST` - Fast coding (qwen2.5-coder:7b)
- `OPENCODE_CODE_SLOW` - Quality coding (qwen2.5-coder:32b)
- `OPENCODE_REASON_SLOW` - Deep reasoning (deepseek-r1:32b)
- `OPENCODE_PLAN_SLOW` - Planning (deepseek-r1:32b)

## Updating Models

Edit `.opencode/models.env` and reload your shell:

```bash
source ~/.zshrc  # or source ~/.bashrc
```

# Log
- 2025-12-16: Created documentation for model environment variables
