# Lessons Learned

What worked, what didn't, and how to apply it to cursed-code.

## ✅ What Worked Well

### Hook Pattern Consistency
Every hook: `createXXXHook(ctx) → { event, "tool.execute.before", ... }`

**Why it works:**
- Consistent interface
- Easy to enable/disable
- Clean separation of concerns
- Composable

**Apply to cursed-code:**
- Document this pattern in meta/wiki
- Use it for all future hooks
- Create template in script_maker

---

### Zod Schema for Config
Runtime validation + type safety + IDE autocomplete.

**Example:**
```typescript
export const ConfigSchema = z.object({
  disabled_hooks: z.array(HookNameSchema).optional(),
  agents: AgentOverridesSchema.optional(),
})
```

**Benefits:**
- Catches config errors early
- Self-documenting via schema
- JSON schema generation for autocomplete
- Better DX than raw JSON

**Apply to cursed-code:**
- Use Zod for plugin configs
- Generate JSON schemas
- Document in meta/wiki

---

### Two-Tier Config System
User (`~/.config/`) + Project (`.opencode/`) with deep merge.

**Why it works:**
- User = global defaults
- Project = per-repo overrides
- Predictable merge strategy

**Apply to cursed-code:**
- Already using this pattern
- Document merge behavior
- Consider three-tier: user + project + local (git-ignored)

---

### Lazy Resource Loading
Download binaries on first use, not install time.

**Examples:**
- Comment checker CLI
- AST-grep binary
- Grep binary fallback

**Why it works:**
- Faster install
- Smaller package
- Only download what you use

**Apply to cursed-code:**
- Any heavy dependencies (LSP servers, formatters)
- Document pattern in meta/wiki

---

### Background Agent Architecture
Parent/child session + polling + event-driven hybrid.

**Key insights:**
- Use OpenCode's native session API
- Don't reinvent session management
- Check for incomplete todos before marking complete
- Notify parent via prompt injection (respects agent mode)

**Why it works:**
- Leverages platform primitives
- Clean parent/child relationship
- Graceful error handling

**Apply to cursed-code:**
- If implementing background tasks, use this pattern
- Don't try to build session manager from scratch

---

### Claude Code Compatibility Layer
Load from `~/.claude/` and `./.claude/` with toggle-able features.

**Why it works:**
- Migration path for Claude Code users
- Each feature type independently toggleable
- Respects existing conventions

**Apply to cursed-code:**
- Consider compat layer for popular tools
- Make it opt-in, not default
- Document in meta/wiki

---

## ❌ What Didn't Work

### Monolithic Plugin
All 21 hooks in one package = vendor lock-in.

**Problems:**
- Can't cherry-pick one hook
- Large bundle even if you use 1 feature
- Hard to fork/customize
- Forces users into ecosystem

**Avoid in cursed-code:**
- Create separate plugins
- Each hook = its own package
- À la carte, not bundle

---

### Tight Coupling
Hooks depend on each other directly.

**Example:**
```typescript
// session-recovery hooks into todo-enforcer
sessionRecovery.setOnAbortCallback(todoContinuationEnforcer.markRecovering)
```

**Problems:**
- Can't use one without the other
- Complex initialization order
- Hard to extract

**Avoid in cursed-code:**
- Use events, not direct coupling
- Let hooks communicate via OpenCode's event system
- Keep dependencies minimal

---

### No Tests
Zero test coverage, manual verification only.

**Problems:**
- Hard to refactor
- Regressions happen
- Complex logic (background manager) untested

**README admission:**
> "I don't really know TypeScript, but I personally reviewed this doc"

**Avoid in cursed-code:**
- Test critical plugins (background-task, todo-enforcer)
- Use Bun's built-in test runner
- Document test patterns in meta/wiki

---

### Opinionated Defaults
Forces specific models (GPT-5.2, Gemini 3 Pro, etc.).

**Problems:**
- Not everyone has access to these models
- Expensive defaults
- Breaks if model doesn't exist

**Example:**
```typescript
// OmO agent MUST use Claude Opus 4.5
model: "anthropic/claude-opus-4-5"
```

**Avoid in cursed-code:**
- Let users choose models
- Provide templates, not implementations
- Sensible defaults, but easy to override

---

### Deployment Complexity
GitHub Actions workflow_dispatch only, OIDC provenance requirements.

**Problems:**
- Can't publish locally
- Must use GitHub Actions
- Complex setup

**Why it exists:**
- npm provenance requirements
- Security best practice

**Consider for cursed-code:**
- Simpler deployment for small plugins
- Document both approaches (local vs CI)

---

## Key Philosophical Differences

| Aspect | oh-my-opencode | cursed-code |
|--------|----------------|-------------|
| Philosophy | oh-my-zsh (bundle) | shadcn/neovim (à la carte) |
| Distribution | Single package | Separate plugins |
| Customization | Config toggles | Fork & modify |
| Defaults | Opinionated | Sensible but flexible |
| Testing | None | Critical paths tested |
| Coupling | Tight | Loose |

---

## Patterns to Document in cursed-code

1. **Hook Creation Pattern** → meta/wiki/opencode_hooks.wiki.md
2. **Zod Config Validation** → meta/wiki/opencode_config.wiki.md
3. **Plugin Structure** → meta/wiki/opencode_plugins.wiki.md
4. **Background Task Pattern** → (if implementing)
5. **Lazy Resource Loading** → meta/wiki/optimization.wiki.md

---

## Recommended Adaptations

### What to Copy Directly
- Hook creation pattern
- Tool directory structure
- Zod schema approach
- Two-tier config system

### What to Adapt
- Config toggles → separate plugins instead
- Claude Code compat → opt-in plugin, not built-in
- Background tasks → standalone plugin, well-tested

### What to Avoid
- Monolithic bundling
- Tight hook coupling
- Opinionated model selection
- Zero tests

---

## Implementation Checklist

When creating cursed-code plugins based on oh-my-opencode patterns:

- [ ] Each plugin = separate package
- [ ] Use Zod for config validation
- [ ] Follow hook creation pattern
- [ ] Zero dependencies on other cursed plugins
- [ ] Test critical functionality
- [ ] Provide sensible defaults, not opinionated ones
- [ ] Document in expert wiki
- [ ] Fork-friendly (not config-driven toggles)

# Log
- 2025-12-16: Initial lessons documentation
