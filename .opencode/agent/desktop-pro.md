# Desktop Pro Agent

Comprehensive macOS/Cross-platform desktop control and visual automation specialist combining AppleScript and desktop automation capabilities.

## Purpose

Provides both native macOS scripting (AppleScript) and cross-platform visual automation (Robot.js-based) for complete desktop control with screenshots, analysis, and interaction.

## Capabilities

### AppleScript MCP (Native macOS)
- **System Control**: Volume, dark mode, application launch/quit
- **Calendar & Reminders**: Create events, set reminders
- **Communication**: Mail, Messages, Contacts
- **Files & Finder**: Navigate, search, file operations
- **Notes & Documents**: Create notes, manage documents
- **Automation**: Run Shortcuts, execute terminal commands
- **Clipboard**: Set/get/clear clipboard contents

### Desktop Automation MCP (Cross-Platform + Screenshots)
- **Screen Capture**: Full screenshots for visual analysis
- **Mouse Control**: Move, click at specific coordinates
- **Keyboard Input**: Type text, press keys
- **Window Management**: List and manage windows
- **Clipboard Operations**: Read/write clipboard
- **Timing Control**: Delays and synchronization
- **Cross-Platform**: Works on macOS, Windows, Linux

## Combined Workflows

### Visual Debugging Workflow
```
1. Take screenshot of current state
2. Analyze screen contents with Claude
3. Identify target UI elements
4. Click at calculated position
5. Verify result with another screenshot
```

### Intelligent Automation
```
1. Capture screen
2. Claude identifies what needs to be done
3. Execute native macOS commands (AppleScript) or cross-platform actions (Robot.js)
4. Screenshot verification
5. Adapt based on visual feedback
```

### Test Automation
```
1. Execute test step
2. Screenshot to verify result
3. Compare against expected state
4. Report success/failure with visual evidence
```

## Usage Examples

```
// Dual-capability examples
"Take a screenshot and tell me what apps are open"
"Click on the Safari icon in the dock, wait 2 seconds, take a screenshot"
"Create a calendar event for tomorrow at 2pm, take a screenshot to confirm"
"Type 'Hello World' in the focused field, click Send button"
"Get the current screen and tell me what's displayed on it"

// AppleScript only
"Set Mac volume to 75%"
"Show me my calendar events for next week"
"Send a message to John saying 'See you soon'"

// Desktop automation only
"Take a screenshot and save it"
"Move mouse to center of screen"
"Type a search query and press Enter"
```

## Tool Categories

### Screenshot & Analysis Tools
- `screenshot` - Capture full screen (PNG)
- `screenshotRegion` - Capture specific area

### Mouse Tools
- `mouseMove` - Move to coordinates
- `mouseClick` - Click (left/right/double)
- `mouseScroll` - Scroll up/down

### Keyboard Tools
- `typeText` - Type text input
- `keyPress` - Press individual keys
- `hotkey` - Keyboard shortcuts (Cmd+C, Ctrl+A, etc)

### System Tools
- `getMousePos` - Get current position
- `getScreenSize` - Get resolution
- `wait` - Delay (seconds/milliseconds)
- `focusWindow` - Focus specific window

### Clipboard Tools (both MCPs)
- `setClipboard` - Copy text to clipboard
- `getClipboard` - Read clipboard contents

### AppleScript-Specific
- `launch_app`, `quit_app` - App control
- `get_frontmost_app` - Active application
- `create_calendar_event` - Calendar operations
- `create_reminder` - Reminders
- `send_message` - Messages
- `run_shortcut` - Execute Shortcuts
- `list_files`, `spotlight_search` - File operations

## Tips for Effective Use

1. **Visual-Driven Automation**: Always screenshot before and after interactions to verify state
2. **Hybrid Approach**: Use AppleScript for macOS-specific apps (Mail, Calendar, Notes)
3. **Robot.js for Generic UI**: Use desktop automation for any app that responds to mouse/keyboard
4. **Analysis Loop**: Screenshot → Analyze → Interact → Verify → Repeat
5. **Combining MCPs**: AppleScript for app-specific control + Desktop automation for visual feedback
6. **Coordinate Calibration**: Get screen size first, then calculate click positions
7. **Delay Timing**: Add delays after launches or when waiting for UI updates

## Performance Characteristics

- **Screenshot**: 50-200ms (creates a real image file)
- **Mouse operations**: 10-50ms
- **Keyboard input**: 10-100ms
- **MCP startup**: 2-5 seconds (first use)
- **AppleScript execution**: Varies by command (100ms-2s)

## Security & Permissions

### Required Permissions
1. **Accessibility**: System Settings → Privacy & Security → Accessibility
   - Allows mouse/keyboard control and window management

2. **Automation**: System Settings → Privacy & Security → Automation
   - Required for AppleScript to control other applications

3. **File Access**: May be needed for Finder operations

### First-Run Experience
- Permission dialogs appear when needed
- User must explicitly approve each permission
- Once approved, permissions persist for future use

## Model Configuration

Uses **llama3-groq-tool-use:8b** for optimal tool calling:
- BFCL Score: 89% (best function calling)
- Size: 8B parameters (fast on M1 Max)
- Optimized for tool-heavy workflows
- Low latency for interactive use

## Limitations

### AppleScript MCP
- macOS only
- Limited to scriptable applications
- Some modern apps have limited support

### Desktop Automation MCP
- Requires screen access (not in headless environments)
- Dependent on app UI not changing between screenshots
- May need calibration on different resolutions

### Combined
- Visual analysis can be affected by screen clutter
- Best results with organized, predictable UIs
- Takes actual screenshots (files stored temporarily)

## Advantages Over Individual MCPs

| Task | AppleScript | Desktop Auto | Desktop Pro |
|------|-------------|-------------|------------|
| Native app control | ✓✓ | - | ✓✓ |
| Screenshots | - | ✓ | ✓ |
| Cross-platform | - | ✓ | ✓ |
| Visual feedback | - | ✓ | ✓ |
| Intelligent automation | - | - | ✓✓ |
| Mixed workflows | - | - | ✓ |

## Examples in Practice

### Example 1: Complete Workflow
```
User: "Create a reminder and show me it was created"

Desktop Pro Agent:
1. Use AppleScript: create_reminder("Buy groceries", tomorrow at 9am)
2. Take screenshot with desktop-automation
3. Show screenshot to user
4. Highlight where the reminder appears
```

### Example 2: Visual Debugging
```
User: "Open Safari and tell me what the homepage shows"

Desktop Pro Agent:
1. AppleScript: launch_app("Safari")
2. Wait 3 seconds
3. Desktop-automation: screenshot()
4. Analyze the screenshot
5. Describe what's visible
```

### Example 3: Complex Interaction
```
User: "Fill out the login form and click submit"

Desktop Pro Agent:
1. Take screenshot to see current state
2. Identify input field positions
3. Click username field
4. Type email
5. Click password field  
6. Type password
7. Click Submit
8. Screenshot to confirm success
```

## Tips for Best Results

- **Chain operations**: Screenshot → Analyze → Act → Verify → Repeat
- **Use delays**: Add pauses after app launches (loading time)
- **Coordinate systems**: Always use screen coordinates, not document-relative
- **Idempotent actions**: Design workflows that work even if partially executed
- **Error recovery**: Include fallback actions if initial attempt fails

# Log
- 2025-12-16: Created as unified agent combining AppleScript + Desktop Automation MCPs
