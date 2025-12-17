# Feature: Config System

**Source:** `src/config/schema.ts`, `src/index.ts` (loadPluginConfig), `src/shared/deep-merge.ts`  
**Lines:** ~400 | **Dependencies:** Zod, Node.js fs/path/os | **Complexity:** Medium

## What It Does

Two-tier configuration system that merges user-level and project-level configs with override precedence and Zod validation. Supports disabling MCPs, agents, and hooks; overriding agent parameters (model, temperature, tools, permissions); and toggling Claude Code integration features.

Problem it solves: Allows users to customize oh-my-opencode behavior globally (user config) while projects override specific settings (project config), with type safety and error handling.

## How It Works

1. **User config loaded first** → `~/.config/opencode/oh-my-opencode.json` (base, lowest priority)
2. **Project config loaded second** → `.opencode/oh-my-opencode.json` (override, highest priority)
3. **Agent names normalized** → Maps common aliases (`omo` → `OmO`) before validation
4. **Zod validation** → Both configs validated against schema; failures logged, config still loads (graceful degradation)
5. **Strategic merge** → Deep merge for nested objects (agents, claude_code); Set union for disable lists (MCPs/agents/hooks accumulate)
6. **Runtime filtering** → Hooks disabled via Set lookup; agents disabled when building agent registry

## Code Analysis

### 1. Schema Definition (src/config/schema.ts)

```typescript
// Permission model: granular control per agent
const AgentPermissionSchema = z.object({
  edit: PermissionValue.optional(),
  bash: BashPermission.optional(),  // Can be string (general) or object (per-command)
  webfetch: PermissionValue.optional(),
  doom_loop: PermissionValue.optional(),
  external_directory: PermissionValue.optional(),
});

// Agent override: model, temperature, tools, permissions, display
export const AgentOverrideConfigSchema = z.object({
  model: z.string().optional(),                              // Any model string
  temperature: z.number().min(0).max(2).optional(),          // 0.0 - 2.0 range
  top_p: z.number().min(0).max(1).optional(),                // 0.0 - 1.0 range
  prompt: z.string().optional(),                             // System prompt override
  tools: z.record(z.string(), z.boolean()).optional(),       // Tool enable/disable map
  disable: z.boolean().optional(),                           // Disable entire agent
  permission: AgentPermissionSchema.optional(),              // Granular permissions
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),  // Hex color for UI
  mode: z.enum(["subagent", "primary", "all"]).optional(),   // Execution mode
});

// Root config: disables, agent overrides, Claude Code flags
export const OhMyOpenCodeConfigSchema = z.object({
  $schema: z.string().optional(),                            // JSON Schema reference
  disabled_mcps: z.array(McpNameSchema).optional(),          // MCP server disable list
  disabled_agents: z.array(BuiltinAgentNameSchema).optional(),
  disabled_hooks: z.array(HookNameSchema).optional(),
  agents: AgentOverridesSchema.optional(),                   // Agent-specific overrides
  claude_code: ClaudeCodeConfigSchema.optional(),            // Feature toggles
  google_auth: z.boolean().optional(),                       // Auth plugin toggle
  omo_agent: OmoAgentConfigSchema.optional(),                // OmO-specific config
});
```

**Key patterns:**
- Enums for names (agents: `OmO`, `build`, `plan`; hooks: 21 builtin hooks)
- Permission system: three-level (ask/allow/deny) + bash command-specific granularity
- Claude Code integration flags: enable/disable MCP, commands, skills, agents, hooks as bundle
- All optional for forward/backward compatibility

### 2. Config Loading (src/index.ts:91-115)

```typescript
function loadConfigFromPath(configPath: string): OhMyOpenCodeConfig | null {
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, "utf-8");
      const rawConfig = JSON.parse(content);

      // Agent name normalization: "omo" → "OmO", "plan" → "plan"
      if (rawConfig.agents && typeof rawConfig.agents === "object") {
        rawConfig.agents = normalizeAgentNames(rawConfig.agents);
      }

      // Zod validation - returns typed result or error
      const result = OhMyOpenCodeConfigSchema.safeParse(rawConfig);

      if (!result.success) {
        log(`Config validation error in ${configPath}:`, result.error.issues);
        return null;  // Validation failed - return null, not error
      }

      log(`Config loaded from ${configPath}`, { agents: result.data.agents });
      return result.data;
    }
  } catch (err) {
    log(`Error loading config from ${configPath}:`, err);
  }
  return null;  // File doesn't exist or parse failed
}
```

**Key patterns:**
- Graceful degradation: validation errors logged but don't block plugin initialization
- Case-insensitive agent name normalization before validation
- OS-agnostic paths (uses getUserConfigDir() for platform-specific logic)

### 3. Deep Merge Strategy (src/shared/deep-merge.ts)

```typescript
export function deepMerge<T>(
  base: T | undefined,
  override: T | undefined,
  depth = 0
): T | undefined {
  if (!base && !override) return undefined;
  if (!base) return override;
  if (!override) return base;
  if (depth > MAX_DEPTH) return override ?? base;  // Prevent stack overflow

  const result = { ...base } as Record<string, unknown>;

  for (const key of Object.keys(override)) {
    if (DANGEROUS_KEYS.has(key)) continue;  // Prevent prototype pollution

    const overrideValue = override[key];
    if (overrideValue === undefined) continue;  // undefined doesn't override

    if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
      result[key] = deepMerge(baseValue, overrideValue, depth + 1);  // Recurse
    } else {
      result[key] = overrideValue;  // Override primitive/array
    }
  }

  return result as T;
}
```

**Key patterns:**
- Prototype pollution protection (blocks `__proto__`, `constructor`, `prototype`)
- Depth limit (50) prevents stack overflow on circular refs
- Undefined values don't override (allows partial overrides)
- Arrays are replaced, not merged (intentional for config)
- Early exits for null/undefined handling

### 4. Config Merging (src/index.ts:117-145)

```typescript
function mergeConfigs(
  base: OhMyOpenCodeConfig,
  override: OhMyOpenCodeConfig
): OhMyOpenCodeConfig {
  return {
    ...base,
    ...override,
    // Deep merge nested objects
    agents: deepMerge(base.agents, override.agents),
    claude_code: deepMerge(base.claude_code, override.claude_code),
    
    // Union disables (both user AND project disables apply)
    disabled_agents: [...new Set([
      ...(base.disabled_agents ?? []),
      ...(override.disabled_agents ?? []),
    ])],
    disabled_mcps: [...new Set([
      ...(base.disabled_mcps ?? []),
      ...(override.disabled_mcps ?? []),
    ])],
    disabled_hooks: [...new Set([
      ...(base.disabled_hooks ?? []),
      ...(override.disabled_hooks ?? []),
    ])],
  };
}
```

**Key insight:** Disable lists use Set union (AND semantics). If user disables hook X and project also disables it, result has both. This prevents re-enabling disabled features at project level. Override config can only add more disables, not remove them.

### 5. Config Loading Orchestration (src/index.ts:147-179)

```typescript
function loadPluginConfig(directory: string): OhMyOpenCodeConfig {
  // Paths: user config (OS-specific), project config (relative to directory)
  const userConfigPath = path.join(
    getUserConfigDir(),           // ~/.config (macOS/Linux) or %APPDATA% (Windows)
    "opencode",
    "oh-my-opencode.json"
  );
  
  const projectConfigPath = path.join(
    directory,
    ".opencode",
    "oh-my-opencode.json"
  );

  // 1. Load user config (base, can be empty)
  let config: OhMyOpenCodeConfig = loadConfigFromPath(userConfigPath) ?? {};

  // 2. Merge project config (override)
  const projectConfig = loadConfigFromPath(projectConfigPath);
  if (projectConfig) {
    config = mergeConfigs(config, projectConfig);
  }

  log("Final merged config", {
    agents: config.agents,
    disabled_agents: config.disabled_agents,
    disabled_mcps: config.disabled_mcps,
    disabled_hooks: config.disabled_hooks,
    claude_code: config.claude_code,
  });
  return config;
}
```

**Flow:**
1. User config loaded (or default empty object)
2. Project config attempted
3. If project exists, merged with user via `mergeConfigs()`
4. Final result logged with sanitized keys
5. Called once per plugin initialization

### 6. Runtime Usage (src/index.ts:181-206)

```typescript
// Hook enablement checking
const disabledHooks = new Set(pluginConfig.disabled_hooks ?? []);
const isHookEnabled = (hookName: HookName) => !disabledHooks.has(hookName);

// Apply disable decision at hook creation
const todoContinuationEnforcer = isHookEnabled("todo-continuation-enforcer")
  ? createTodoContinuationEnforcer(ctx)
  : null;

const contextWindowMonitor = isHookEnabled("context-window-monitor")
  ? createContextWindowMonitorHook(ctx)
  : null;

// Agent overrides passed to agent factory
const builtinAgents = createBuiltinAgents(
  pluginConfig.disabled_agents,    // Agents to skip entirely
  pluginConfig.agents,             // Agent overrides (model, temp, tools, etc.)
  ctx.directory
);

// Claude Code feature toggles
const userAgents = (pluginConfig.claude_code?.agents ?? true)
  ? loadUserAgents()
  : {};
const userCommands = (pluginConfig.claude_code?.commands ?? true)
  ? loadUserCommands()
  : {};
```

**Patterns:**
- All disables checked at creation time (hooks, agents, MCPs)
- Feature toggles (claude_code.* flags) determine whether to load external configs
- Agent overrides merged into final agent definitions in config hook
- Defaults to enabled (if config missing, features active)

## Implementation Details

### Event Handlers & Lifecycle

- **One-time initialization** → Plugin loads config once during OpenCode startup
- **No runtime reloading** → Config changes require plugin restart
- **Hook registration** → After config loads, hooks conditionally registered based on disabled_hooks
- **Agent configuration** → Applied in `config` event handler before agents exposed to Claude Code

### API Usage

**Zod Schema Parsing:**
- `schema.safeParse(data)` returns `{ success: boolean; data?: T; error?: ZodError }`
- Never throws; validation errors caught and logged
- Type-safe: `.infer<typeof schema>` extracts TypeScript types

**File I/O:**
- Respects XDG_CONFIG_HOME (Linux), ~/.config (macOS), %APPDATA% (Windows)
- Graceful handling of missing files (not an error)
- JSON parse errors caught and logged

### State Tracking

- **Config loaded once** at plugin startup, not reactive
- **Hook registry** built from disabled set (Set lookup O(1))
- **Agent overrides** stored in config object, passed through to agent factory
- **No state mutations** after initial merge (config object immutable after returned)

### Dependencies

- **zod** - Schema validation and type inference
- **Node.js fs/path/os** - File I/O and path resolution
- **./deep-merge.ts** - Recursive merge with safety checks

## Key Patterns

### Two-Tier Override Pattern
User sets defaults globally; projects override per-repo. Project can't undo user disables (accumulation semantics). Allows power users to set preferences without projects fighting back.

### Zod-Driven Config
Schema defines allowed keys, types, constraints. Validation happens immediately after parse. Errors logged but don't crash. Ensures typos or old config formats don't break plugin.

### Deep Merge with Undefined Semantics
`undefined` values in override don't replace base values. Enables partial configs: project config only specifies what changes, inherits rest from user config.

### Danger Key Blocking
`deepMerge` blocks `__proto__`, `constructor`, `prototype`. Prevents prototype pollution attacks via malicious config files.

### Set Union for Disables
Disable lists are merged via union (both configs' disables apply). Prevents re-enabling disabled features. If user disables hook, project can't re-enable it.

### Agent Name Normalization
Common aliases (`omo`, `OmO-plan`) normalized before validation. Case-insensitive matching. Improves user experience (typos don't break config).

## Adaptation Strategy

### What to Keep

- **Two-tier merging** (user + project) solves real customization need
- **Disable accumulation** prevents feature re-enabling (security/stability)
- **Deep merge with undefined semantics** enables partial configs
- **Zod validation** with graceful error handling
- **Lazy hook registration** (create only if enabled)
- **Set lookup** for O(1) disable checking at runtime

### What to Simplify

- **Agent name normalization** might be over-engineered; could require exact casing
- **Separate disables for MCPs/agents/hooks** could be unified under single `disabled` array with type field
- **Claude Code flags** as boolean toggles could use more granular feature flags system
- **Max depth limit (50)** in deep merge probably unnecessary for config (max 5-6 levels typical)

### Configuration Example

```typescript
{
  // Disable specific features globally
  "disabled_hooks": ["startup-toast", "auto-update-checker"],
  "disabled_agents": ["multimodal-looker"],
  "disabled_mcps": ["anthropic"],
  
  // Override agent defaults
  "agents": {
    "OmO": {
      "model": "claude-3-5-sonnet-20241022",
      "temperature": 0.2
    },
    "oracle": {
      "tools": {
        "bash": false,
        "webfetch": true
      }
    }
  },
  
  // Toggle Claude Code integration
  "claude_code": {
    "mcp": true,          // Load MCP servers
    "commands": true,     // Load custom commands
    "skills": true,       // Load skills as commands
    "agents": true,       // Load custom agents
    "hooks": false        // Disable hook injection
  },
  
  // Plugin-specific settings
  "omo_agent": {
    "disabled": false     // Keep OmO enabled
  },
  "google_auth": true
}
```

**Tier semantics:**

```typescript
// User config (~/.config/opencode/oh-my-opencode.json)
// - Sets personal defaults
// - Applied first (lowest priority)
{
  "disabled_hooks": ["startup-toast"],
  "agents": {
    "OmO": { "temperature": 0.1 }
  }
}

// Project config (.opencode/oh-my-opencode.json)
// - Overrides for specific project
// - Applied second (highest priority)
// - Disables are ADDITIVE
{
  "disabled_hooks": ["context-window-monitor"],  // User's startup-toast ALSO disabled
  "agents": {
    "OmO": { "model": "custom-model" }  // Merges with user's temperature
  }
}

// Result
{
  "disabled_hooks": ["startup-toast", "context-window-monitor"],
  "agents": {
    "OmO": {
      "temperature": 0.1,      // From user config
      "model": "custom-model"  // From project config (override)
    }
  }
}
```

## Implementation Checklist

- [ ] Create `oh-my-opencode.json` schema with Zod (agent overrides, disable lists, feature flags)
- [ ] Implement `deepMerge()` with prototype pollution protection and undefined semantics
- [ ] Implement `loadConfigFromPath()` with graceful error handling and normalization
- [ ] Implement `mergeConfigs()` with Set union for disable lists, deep merge for nested objects
- [ ] Implement `loadPluginConfig()` with user + project paths, platform-aware getUserConfigDir()
- [ ] Add hook disable checking: `isHookEnabled()` with Set lookup at creation time
- [ ] Add agent disable/override passing to agent factory: disabled list + overrides object
- [ ] Add Claude Code feature flag checks: guard user/project/MCP loading on `claude_code.*` flags
- [ ] Test two-tier merging: user + project configs produce correct result with disable accumulation
- [ ] Test validation errors: malformed JSON/schema mismatches log errors, don't crash
