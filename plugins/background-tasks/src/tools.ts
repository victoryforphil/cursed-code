/**
 * Background task tools
 * 
 * Three tools for managing background tasks:
 * - background_task: Launch a new background task
 * - background_output: Get output from a background task
 * - background_cancel: Cancel running background task(s)
 */

import { tool, type PluginInput, type ToolDefinition } from "@opencode-ai/plugin"
import type { BackgroundManager } from "./manager"
import type { BackgroundTask, BackgroundTaskArgs, BackgroundOutputArgs, BackgroundCancelArgs } from "./types"

type OpencodeClient = PluginInput["client"]

// Tool descriptions
const BACKGROUND_TASK_DESCRIPTION = `Launch a background agent task that runs asynchronously.

The task runs in a separate session while you continue with other work. The system will notify you when the task completes.

Use this for:
- Long-running research tasks
- Complex analysis that doesn't need immediate results
- Parallel workloads to maximize throughput

Arguments:
- description: Short task description (shown in status)
- prompt: Full detailed prompt for the agent (MUST be in English for optimal LLM performance)
- agent: Agent type to use (any agent allowed)

IMPORTANT: Always write prompts in English regardless of user's language. LLMs perform significantly better with English prompts.

Returns immediately with task ID and session info. Use \`background_output\` to check progress or retrieve results.`

const BACKGROUND_OUTPUT_DESCRIPTION = `Get output from a background task.

Arguments:
- task_id: Required task ID to get output from
- block: If true, wait for task completion. If false (default), return current status immediately.
- timeout: Max wait time in ms when blocking (default: 60000, max: 600000)

The system automatically notifies when background tasks complete. You typically don't need block=true.`

const BACKGROUND_CANCEL_DESCRIPTION = `Cancel running background task(s).

Only works for tasks with status "running". Aborts the background session and marks the task as cancelled.

Arguments:
- taskId: Task ID to cancel (optional if all=true)
- all: Set to true to cancel ALL running background tasks at once (default: false)

**Cleanup Before Answer**: When you have gathered sufficient information and are ready to provide your final answer to the user, use \`all=true\` to cancel ALL running background tasks first, then deliver your response. This conserves resources and ensures clean workflow completion.`

// Helper functions
function formatDuration(start: Date, end?: Date): string {
  const duration = (end ?? new Date()).getTime() - start.getTime()
  const seconds = Math.floor(duration / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

function formatTaskStatus(task: BackgroundTask): string {
  const duration = formatDuration(task.startedAt, task.completedAt)
  const promptPreview = truncateText(task.prompt, 500)
  
  let progressSection = ""
  if (task.progress?.lastTool) {
    progressSection = `\n| Last tool | ${task.progress.lastTool} |`
  }

  let lastMessageSection = ""
  if (task.progress?.lastMessage) {
    const truncated = truncateText(task.progress.lastMessage, 500)
    const messageTime = task.progress.lastMessageAt 
      ? task.progress.lastMessageAt.toISOString()
      : "N/A"
    lastMessageSection = `

## Last Message (${messageTime})

\`\`\`
${truncated}
\`\`\``
  }

  let statusNote = ""
  if (task.status === "running") {
    statusNote = `

> **Note**: No need to wait explicitly - the system will notify you when this task completes.`
  } else if (task.status === "error") {
    statusNote = `

> **Failed**: The task encountered an error. Check the last message for details.`
  }

  return `# Task Status

| Field | Value |
|-------|-------|
| Task ID | \`${task.id}\` |
| Description | ${task.description} |
| Agent | ${task.agent} |
| Status | **${task.status}** |
| Duration | ${duration} |
| Session ID | \`${task.sessionID}\` |${progressSection}
${statusNote}
## Original Prompt

\`\`\`
${promptPreview}
\`\`\`${lastMessageSection}`
}

async function formatTaskResult(task: BackgroundTask, client: OpencodeClient): Promise<string> {
  const messagesResult = await client.session.messages({
    path: { id: task.sessionID },
  })

  if (messagesResult.error) {
    return `Error fetching messages: ${messagesResult.error}`
  }

  // Handle both SDK response structures
  const messages = (messagesResult.data ?? messagesResult) as Array<{
    info?: { role?: string }
    parts?: Array<{ type?: string; text?: string }>
  }>

  if (!Array.isArray(messages) || messages.length === 0) {
    return `Task Result

Task ID: ${task.id}
Description: ${task.description}
Duration: ${formatDuration(task.startedAt, task.completedAt)}
Session ID: ${task.sessionID}

---

(No messages found)`
  }

  const assistantMessages = messages.filter(
    (m) => m.info?.role === "assistant"
  )

  if (assistantMessages.length === 0) {
    return `Task Result

Task ID: ${task.id}
Description: ${task.description}
Duration: ${formatDuration(task.startedAt, task.completedAt)}
Session ID: ${task.sessionID}

---

(No assistant response found)`
  }

  const lastMessage = assistantMessages[assistantMessages.length - 1]
  const textParts = lastMessage?.parts?.filter(
    (p) => p.type === "text"
  ) ?? []
  const textContent = textParts
    .map((p) => p.text ?? "")
    .filter((text) => text.length > 0)
    .join("\n")

  const duration = formatDuration(task.startedAt, task.completedAt)

  return `Task Result

Task ID: ${task.id}
Description: ${task.description}
Duration: ${duration}
Session ID: ${task.sessionID}

---

${textContent || "(No text output)"}`
}

// Tool factories
export function createBackgroundTask(manager: BackgroundManager): ToolDefinition {
  return tool({
    description: BACKGROUND_TASK_DESCRIPTION,
    args: {
      description: tool.schema.string().describe("Short task description (shown in status)"),
      prompt: tool.schema.string().describe("Full detailed prompt for the agent"),
      agent: tool.schema.string().describe("Agent type to use (any registered agent)"),
    },
    async execute(args: BackgroundTaskArgs, toolContext) {
      if (!args.agent || args.agent.trim() === "") {
        return `❌ Agent parameter is required. Please specify which agent to use (e.g., "explore", "scout", "build", etc.)`
      }

      try {
        const task = await manager.launch({
          description: args.description,
          prompt: args.prompt,
          agent: args.agent.trim(),
          parentSessionID: toolContext.sessionID,
          parentMessageID: toolContext.messageID,
        })

        return `Background task launched successfully.

Task ID: ${task.id}
Session ID: ${task.sessionID}
Description: ${task.description}
Agent: ${task.agent}
Status: ${task.status}

The system will notify you when the task completes.
Use \`background_output\` tool with task_id="${task.id}" to check progress:
- block=false (default): Check status immediately - returns full status info
- block=true: Wait for completion (rarely needed since system notifies)`
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return `❌ Failed to launch background task: ${message}`
      }
    },
  })
}

export function createBackgroundOutput(manager: BackgroundManager, client: OpencodeClient): ToolDefinition {
  return tool({
    description: BACKGROUND_OUTPUT_DESCRIPTION,
    args: {
      task_id: tool.schema.string().describe("Task ID to get output from"),
      block: tool.schema.boolean().optional().describe("Wait for completion (default: false). System notifies when done, so blocking is rarely needed."),
      timeout: tool.schema.number().optional().describe("Max wait time in ms (default: 60000, max: 600000)"),
    },
    async execute(args: BackgroundOutputArgs) {
      try {
        const task = manager.getTask(args.task_id)
        if (!task) {
          return `Task not found: ${args.task_id}`
        }

        const shouldBlock = args.block === true
        const timeoutMs = Math.min(args.timeout ?? 60000, 600000)

        // Already completed: return result immediately
        if (task.status === "completed") {
          return await formatTaskResult(task, client)
        }

        // Error or cancelled: return status immediately
        if (task.status === "error" || task.status === "cancelled") {
          return formatTaskStatus(task)
        }

        // Non-blocking and still running: return status
        if (!shouldBlock) {
          return formatTaskStatus(task)
        }

        // Blocking: poll until completion or timeout
        const startTime = Date.now()

        while (Date.now() - startTime < timeoutMs) {
          await delay(1000)

          const currentTask = manager.getTask(args.task_id)
          if (!currentTask) {
            return `Task was deleted: ${args.task_id}`
          }

          if (currentTask.status === "completed") {
            return await formatTaskResult(currentTask, client)
          }

          if (currentTask.status === "error" || currentTask.status === "cancelled") {
            return formatTaskStatus(currentTask)
          }
        }

        // Timeout exceeded: return current status
        const finalTask = manager.getTask(args.task_id)
        if (!finalTask) {
          return `Task was deleted: ${args.task_id}`
        }
        return `Timeout exceeded (${timeoutMs}ms). Task still ${finalTask.status}.\n\n${formatTaskStatus(finalTask)}`
      } catch (error) {
        return `Error getting output: ${error instanceof Error ? error.message : String(error)}`
      }
    },
  })
}

export function createBackgroundCancel(manager: BackgroundManager, client: OpencodeClient): ToolDefinition {
  return tool({
    description: BACKGROUND_CANCEL_DESCRIPTION,
    args: {
      taskId: tool.schema.string().optional().describe("Task ID to cancel (required if all=false)"),
      all: tool.schema.boolean().optional().describe("Cancel all running background tasks (default: false)"),
    },
    async execute(args: BackgroundCancelArgs, toolContext) {
      try {
        const cancelAll = args.all === true

        if (!cancelAll && !args.taskId) {
          return `❌ Invalid arguments: Either provide a taskId or set all=true to cancel all running tasks.`
        }

        if (cancelAll) {
          const tasks = manager.getTasksByParentSession(toolContext.sessionID)
          const runningTasks = tasks.filter(t => t.status === "running")

          if (runningTasks.length === 0) {
            return `✅ No running background tasks to cancel.`
          }

          const results: string[] = []
          for (const task of runningTasks) {
            // Fire-and-forget: don't await to avoid blocking main session
            client.session.abort({
              path: { id: task.sessionID },
            }).catch(() => {})

            task.status = "cancelled"
            task.completedAt = new Date()
            results.push(`- ${task.id}: ${task.description}`)
          }

          return `✅ Cancelled ${runningTasks.length} background task(s):

${results.join("\n")}`
        }

        const task = manager.getTask(args.taskId!)
        if (!task) {
          return `❌ Task not found: ${args.taskId}`
        }

        if (task.status !== "running") {
          return `❌ Cannot cancel task: current status is "${task.status}".
Only running tasks can be cancelled.`
        }

        // Fire-and-forget
        client.session.abort({
          path: { id: task.sessionID },
        }).catch(() => {})

        task.status = "cancelled"
        task.completedAt = new Date()

        return `✅ Task cancelled successfully

Task ID: ${task.id}
Description: ${task.description}
Session ID: ${task.sessionID}
Status: ${task.status}`
      } catch (error) {
        return `❌ Error cancelling task: ${error instanceof Error ? error.message : String(error)}`
      }
    },
  })
}

// Factory to create all background tools
export function createBackgroundTools(manager: BackgroundManager, client: OpencodeClient): Record<string, ToolDefinition> {
  return {
    background_task: createBackgroundTask(manager),
    background_output: createBackgroundOutput(manager, client),
    background_cancel: createBackgroundCancel(manager, client),
  }
}
