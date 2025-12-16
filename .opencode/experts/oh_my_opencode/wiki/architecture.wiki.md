# oh-my-opencode Architecture

## Overview
Monolithic "oh-my-zsh for OpenCode" - single npm package bundling all features with config-driven toggles.

## Structure
```
oh-my-opencode/
├── src/
│   ├── index.ts              # Main orchestrator (~567 lines)
│   ├── agents/               # 7 specialized agents
│   ├── hooks/                # 21 lifecycle hooks
│   ├── tools/                # 10 tool categories
│   ├── mcp/                  # 3 built-in MCP servers
│   ├── features/             # Background agent, Claude Code loaders
│   ├── config/               # Zod schemas
│   ├── auth/                 # Google Antigravity OAuth
│   └── shared/               # Utilities
└── dist/                     # ESM + .d.ts output
```

## Plugin Entry Point Pattern
```typescript
const OhMyOpenCodePlugin: Plugin = async (ctx) => {
  const pluginConfig = loadPluginConfig(ctx.directory)
  
  // Create hooks conditionally
  const hook1 = isHookEnabled("hook-name") ? createHook(ctx) : null
  
  return {
    tool: { ...tools },
    config: async (config) => { /* merge configs */ },
    event: async (input) => { /* dispatch to hooks */ },
    "tool.execute.before": async (input, output) => { /* ... */ },
    "tool.execute.after": async (input, output) => { /* ... */ }
  }
}
```

## Config System

### Two-Tier Merging
1. User: `~/.config/opencode/oh-my-opencode.json`
2. Project: `.opencode/oh-my-opencode.json`

Project overrides user via deep merge.

### Zod Schema
```typescript
export const OhMyOpenCodeConfigSchema = z.object({
  $schema: z.string().optional(),
  disabled_mcps: z.array(McpNameSchema).optional(),
  disabled_agents: z.array(BuiltinAgentNameSchema).optional(),
  disabled_hooks: z.array(HookNameSchema).optional(),
  agents: AgentOverridesSchema.optional(),
  claude_code: ClaudeCodeConfigSchema.optional(),
  google_auth: z.boolean().optional(),
  omo_agent: OmoAgentConfigSchema.optional(),
})
```

Benefits:
- Runtime validation
- Type-safe config
- IDE autocomplete via JSON schema
- Helpful error messages

### Config Features
- Array toggles: `disabled_hooks`, `disabled_agents`, `disabled_mcps`
- Per-agent overrides: `agents.oracle.model`, `agents.oracle.temperature`
- Namespace toggles: `claude_code.mcp`, `claude_code.commands`

## Hook Pattern

Every hook follows:
```typescript
export function createXXXHook(ctx: PluginInput) {
  return {
    event: async (input) => { /* ... */ },
    "tool.execute.before": async (input, output) => { /* ... */ },
    "tool.execute.after": async (input, output) => { /* ... */ },
    // Optional: other lifecycle hooks
  }
}
```

Benefits:
- Consistent interface
- Easy to enable/disable
- Clean separation of concerns
- Composable

## Tool Pattern

Each tool category has:
```
tools/{name}/
├── index.ts        # Exports
├── types.ts        # TypeScript types
├── constants.ts    # Config values
├── tools.ts        # Tool implementations
└── utils.ts        # Helpers
```

## Pros of This Architecture

1. **Single install** - `npm i oh-my-opencode`
2. **Centralized config** - One JSON file
3. **Consistent patterns** - Hooks, tools, agents all follow conventions
4. **Type safety** - Zod validation everywhere
5. **Progressive enhancement** - Disable what you don't want

## Cons of This Architecture

1. **Vendor lock-in** - All or nothing (can disable, but still ships)
2. **Tight coupling** - Hooks depend on each other (session-recovery → todo-enforcer)
3. **Large bundle** - 21 hooks + 7 agents even if you use 1
4. **Hard to fork** - Must fork entire package to customize one hook
5. **Opinionated** - Forces specific models, orchestration patterns

## Comparison to cursed-code Philosophy

| Aspect | oh-my-opencode | cursed-code |
|--------|----------------|-------------|
| Distribution | Single package | À la carte plugins |
| Philosophy | oh-my-zsh | shadcn/neovim |
| Customization | Config toggles | Fork & modify |
| Coupling | Tight (hooks call each other) | Loose (independent) |
| Bundle size | Large (all features) | Small (only what you use) |

## Key Takeaways

**Adopt:**
- Hook creation pattern (`createXXXHook`)
- Zod schemas for config validation
- Tool directory structure
- Two-tier config system (user + project)

**Avoid:**
- Monolithic bundling
- Tight hook coupling
- Opinionated agent orchestration
- Can't cherry-pick features

# Log
- 2025-12-16: Initial architecture documentation
