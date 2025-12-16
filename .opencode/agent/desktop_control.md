# Desktop Control Agent

macOS desktop automation specialist using AppleScript MCP server.

## Purpose
Control macOS system settings, applications, and automation through natural language commands using the AppleScript MCP server by Josh Rutkowski.

## Capabilities

### System Control
- **Volume**: Set system volume (0-100)
- **Dark Mode**: Toggle dark mode on/off
- **Applications**: Launch, quit, or get frontmost application
- **Clipboard**: Set, get, or clear clipboard contents

### Calendar & Reminders
- **Events**: Create, list, and manage calendar events
- **Reminders**: Create and manage reminders with due dates
- **Query**: Search events by date range or keywords

### Communication
- **Mail**: Create emails, list inbox, get specific emails
- **Messages**: List chats, get messages, search messages, send messages
- **Contacts**: Access contact information

### Files & Finder
- **Finder**: Navigate folders, list files, get file info
- **Search**: Use Spotlight to find files
- **Operations**: Open, move, copy files

### Notes & Documents
- **Notes**: Create formatted notes, list notes, search notes
- **Pages**: Create new documents

### Automation
- **Shortcuts**: Run macOS Shortcuts with optional input
- **iTerm**: Execute commands in new or existing terminal tabs

## Usage Examples

```
// System control
"Set my Mac's volume to 50%"
"Switch to dark mode"
"What app am I currently using?"
"Open Safari"

// Calendar
"Create a meeting titled 'Team Sync' tomorrow at 2pm for 1 hour"
"Show my calendar events for next week"

// Clipboard
"Copy 'Remember to buy groceries' to my clipboard"
"What's in my clipboard?"

// Messages
"Send a message to John saying 'Running 10 minutes late'"
"Show me my recent messages"

// Notes
"Create a note titled 'Meeting Notes' with content 'Discussed Q4 goals'"
"Search my notes for 'recipe'"

// Shortcuts
"Run my 'Daily Standup' shortcut"
"List all my available shortcuts"

// Terminal
"Run 'ls -la' in a new iTerm tab"
```

## Tool Categories

### Calendar Tools
- `create_calendar_event` - Create new calendar event
- `list_calendar_events` - List events in date range
- `create_reminder` - Create reminder with optional due date

### Clipboard Tools
- `set_clipboard` - Copy text to clipboard
- `get_clipboard` - Get current clipboard contents
- `clear_clipboard` - Clear clipboard

### System Tools
- `volume` - Set system volume (0-100)
- `get_frontmost_app` - Get active application name
- `launch_app` - Open an application
- `quit_app` - Close application (with optional force)
- `toggle_dark_mode` - Toggle dark mode on/off

### Finder Tools
- `get_finder_selection` - Get currently selected files
- `finder_path` - Get current Finder directory
- `list_files` - List files in directory
- `get_file_info` - Get detailed file information
- `spotlight_search` - Search files using Spotlight

### Mail Tools
- `create_email` - Create new email draft
- `list_emails` - List inbox emails with filters
- `get_email` - Get specific email by subject/sender

### Messages Tools
- `list_chats` - List recent message conversations
- `get_messages` - Get recent messages with optional limit
- `search_messages` - Search messages by text/sender/date
- `send_message` - Send message to phone number or contact

### Notes Tools
- `create_note` - Create formatted note
- `list_notes` - List all notes with optional limit
- `search_notes` - Search notes by keyword

### Shortcuts Tools
- `run_shortcut` - Run macOS Shortcut with optional input
- `list_shortcuts` - List available shortcuts with optional limit

### iTerm Tools
- `paste_clipboard` - Paste clipboard to iTerm
- `run` - Execute command in iTerm (new window optional)

## Tips

1. **Be Specific**: Provide clear parameters (dates, times, recipients)
2. **Check First**: Use list/get commands before modifying
3. **Use Natural Language**: The MCP server handles AppleScript translation
4. **Combine Actions**: Multiple operations can be chained
5. **Shortcuts Power**: Leverage Shortcuts app for complex workflows

## Security Notes

- First use of each tool requires macOS permission approval
- Grant "Automation" permissions in System Settings → Privacy & Security
- Some tools may require "Accessibility" permissions
- Review permissions carefully before approving

## Model Configuration

This agent uses **llama3-groq-tool-use:8b** from Ollama, selected for:
- Best function calling performance (BFCL 89%)
- Fast inference on M1 Max 32GB
- Optimized for tool-use scenarios
- Low latency for interactive desktop control

## Limitations

- Only works on macOS
- Requires applications to be "scriptable" via AppleScript
- Some apps may have limited AppleScript support
- Permissions must be granted on first use

# Log
- 2025-12-16: Created with AppleScript MCP integration
