# @cursed/usage-tracker

Track token usage by model and agent, including subagent calls.

## Features

- **Per-session tracking**: Tokens, cost, and model distribution
- **Subagent aggregation**: Tracks Task tool spawned agents via parentID linking
- **Per-agent breakdown**: See which agents used which models
- **Real-time TUI sidebar**: Live usage stats in the OpenCode TUI sidebar
- **Multiple output channels**:
  - TUI sidebar with real-time stats
  - JSON export to `.opencode/usage-stats.json`
  - On-demand `/usage_report` tool

## Installation

```bash
cd plugins/usage-tracker
bun install
bun run build
```

Then link or copy `dist/index.js` to your `.opencode/plugin/` directory.

**Note**: The TUI sidebar integration requires a forked version of OpenCode that supports the `tui.sidebar.sections` hook. The plugin will still work with standard OpenCode but will only provide the JSON export and `usage_report` tool.

## Usage

The plugin runs automatically once installed. It provides:

1. **TUI Sidebar**: Real-time usage stats displayed in the OpenCode TUI sidebar
2. **JSON export**: Appends session stats to `.opencode/usage-stats.json` when sessions end
3. **On-demand reports**: Use the `usage_report` tool anytime during a session

### TUI Sidebar Integration

When using OpenCode TUI mode, the plugin automatically displays a "Usage Stats" section in the sidebar showing:

- Total tokens (input/output/reasoning)
- Session cost
- Top 3 models with token counts and call counts
- Number of active agents (if more than 1)

The sidebar section is collapsible and updates in real-time as you use OpenCode.

### On-demand Report

Use the `usage_report` tool to get stats during a session:

```
Show me my current usage stats
```

The tool supports three formats:
- `summary` (default): Formatted table view
- `detailed`: Full breakdown with all fields
- `json`: Raw JSON for programmatic use

## Example Output

```
═══════════════════════════════════════════════════════════════
                     SESSION USAGE REPORT
═══════════════════════════════════════════════════════════════

By Model                              Tokens (in/out)       Cost      %
───────────────────────────────────────────────────────────────────────
claude-sonnet-4                       45.2K / 12.4K         $0.32     52%
qwen2.5-coder:32b (local)             28.1K / 8.2K          $0.00     31%
deepseek-r1:32b (local)               15.6K / 4.1K          $0.00     17%
───────────────────────────────────────────────────────────────────────
TOTAL                                 88.9K / 24.7K         $0.32    100%

By Agent                              Tokens (in/out)    Model Used
───────────────────────────────────────────────────────────────────────
main                                  45.2K / 12.4K      claude-sonnet-4
└─ scout                              12.4K / 3.8K       qwen2.5-coder:32b
└─ explore                            8.1K / 2.2K        qwen2.5-coder:32b
└─ coder                              15.6K / 4.1K       deepseek-r1:32b

═══════════════════════════════════════════════════════════════
```

## Agent Detection

Agent names are detected in priority order:
1. `mode` field from message info (most accurate)
2. Session title pattern: `"Description (@agent agentname)"`
3. Default: `main` for parent sessions, `subagent` for children

## JSON Export Format

Stats are persisted to `.opencode/usage-stats.json`:

```json
{
  "sessions": [
    {
      "id": "ses_abc123",
      "timestamp": "2024-12-16T10:30:00Z",
      "totals": {
        "inputTokens": 88930,
        "outputTokens": 24700,
        "reasoningTokens": 0,
        "cost": 0.32
      },
      "byModel": {
        "anthropic/claude-sonnet-4": {
          "input": 45230,
          "output": 12400,
          "reasoning": 0,
          "cost": 0.32,
          "calls": 5
        }
      },
      "byAgent": {
        "main": {
          "model": "claude-sonnet-4",
          "provider": "anthropic",
          "input": 45230,
          "output": 12400,
          "cost": 0.32
        }
      }
    }
  ]
}
```

## Future Features

- **Rolling window stats**: Track usage over 24h, 7d, 30d periods
- **Full session tree**: Visualize nested subagent relationships (grandchildren)
- **Cost alerts**: Warn when session exceeds thresholds
- **Model distribution goals**: Set targets like "80% local, 20% cloud"
- **Session comparison**: Compare similar tasks across sessions

## Development

```bash
# Type checking
bun run typecheck

# Build
bun run build

# Watch mode for types
bun run dev
```

## License

MIT
