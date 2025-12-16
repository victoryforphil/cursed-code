# Bootstrap Flow

Post-installation setup and verification for cursed-code.

## Context
User has just run `./bootstrap.sh` which added `OPENCODE_CONFIG_DIR` to their shell RC file. This flow completes the setup.

## Steps

1. **Verify Configuration**
   - Check that OPENCODE_CONFIG_DIR points to this repo's .opencode directory
   - Confirm the opencode.json is valid

2. **Display Available Features**
   List what cursed-code provides:
   - Agents: scout, scribe, wikify, git
   - Commands: /research, /scribe, /wikify, /commit
   - Experts: scout, meta, git, prompt_pro, script_maker

3. **User Instructions**
   - Remind user to reload shell: `source ~/.bashrc` or `source ~/.zshrc`
   - Or start a new terminal session
   - Explain cursed-code is now available in all OpenCode sessions

## Success Message
```
cursed-code bootstrap complete!

Available commands:
  /research <topic>  - Research using MCPs
  /scribe <url>      - Convert to markdown
  /wikify <file>     - Distill to wiki format
  /commit [msg]      - Smart git commits

Reload your shell to activate:
  source ~/.bashrc  (or ~/.zshrc)
```