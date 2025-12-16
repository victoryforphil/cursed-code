/**
 * Todo Continuation Enforcer Plugin
 * 
 * THE most requested feature. Prevents agents from stopping when incomplete
 * todos remain. Listens for session.idle events and injects a continuation
 * prompt if pending tasks exist.
 * 
 * Features:
 * - 200ms debounce to avoid rapid-fire reminders
 * - Bypasses on user interrupt or errors
 * - Only reminds once per idle cycle
 * - Clears state when assistant responds (allows re-reminder)
 * 
 * Ported from: oh-my-opencode/src/hooks/todo-continuation-enforcer.ts
 * Simplified: Removed hook-message-injector dependency
 * 
 * Usage: Copy to .opencode/plugin/ directory
 */

import type { Plugin } from "@opencode-ai/plugin"

// Configuration - modify as needed
const DEBOUNCE_MS = 200

const CONTINUATION_PROMPT = `[SYSTEM REMINDER - TODO CONTINUATION]

Incomplete tasks remain in your todo list. Continue working on the next pending task.

- Proceed without asking for permission
- Mark each task complete when finished
- Do not stop until all tasks are done`

interface Todo {
  content: string
  status: string
  priority: string
  id: string
}

function detectInterrupt(error: unknown): boolean {
  if (!error) return false
  if (typeof error === "object") {
    const errObj = error as Record<string, unknown>
    const name = errObj.name as string | undefined
    const message = (errObj.message as string | undefined)?.toLowerCase() ?? ""
    if (name === "MessageAbortedError" || name === "AbortError") return true
    if (name === "DOMException" && message.includes("abort")) return true
    if (message.includes("aborted") || message.includes("cancelled") || message.includes("interrupted")) return true
  }
  if (typeof error === "string") {
    const lower = error.toLowerCase()
    return lower.includes("abort") || lower.includes("cancel") || lower.includes("interrupt")
  }
  return false
}

export const TodoContinuationEnforcer: Plugin = async (ctx) => {
  const remindedSessions = new Set<string>()
  const interruptedSessions = new Set<string>()
  const errorSessions = new Set<string>()
  const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>()

  return {
    event: async ({ event }: { event: { type: string; properties?: unknown } }) => {
      const props = event.properties as Record<string, unknown> | undefined

      // Handle session errors - mark as interrupted/errored
      if (event.type === "session.error") {
        const sessionID = props?.sessionID as string | undefined
        if (sessionID) {
          const isInterrupt = detectInterrupt(props?.error)
          errorSessions.add(sessionID)
          if (isInterrupt) {
            interruptedSessions.add(sessionID)
          }
          
          // Cancel pending continuation if error occurs
          const timer = pendingTimers.get(sessionID)
          if (timer) {
            clearTimeout(timer)
            pendingTimers.delete(sessionID)
          }
        }
        return
      }

      // Main logic: session went idle, check for incomplete todos
      if (event.type === "session.idle") {
        const sessionID = props?.sessionID as string | undefined
        if (!sessionID) return

        // Cancel any existing timer to debounce
        const existingTimer = pendingTimers.get(sessionID)
        if (existingTimer) {
          clearTimeout(existingTimer)
        }

        // Schedule continuation check with debounce
        const timer = setTimeout(async () => {
          pendingTimers.delete(sessionID)

          // Check bypass conditions
          const shouldBypass = interruptedSessions.has(sessionID) || errorSessions.has(sessionID)
          
          interruptedSessions.delete(sessionID)
          errorSessions.delete(sessionID)

          if (shouldBypass) return

          if (remindedSessions.has(sessionID)) return

          // Fetch todos for this session
          let todos: Todo[] = []
          try {
            const response = await ctx.client.session.todo({
              path: { id: sessionID },
            })
            todos = (response.data ?? response) as Todo[]
          } catch {
            return
          }

          if (!todos || todos.length === 0) return

          const incomplete = todos.filter(
            (t) => t.status !== "completed" && t.status !== "cancelled"
          )

          if (incomplete.length === 0) return

          remindedSessions.add(sessionID)

          // Re-check if abort occurred during the delay/fetch
          if (interruptedSessions.has(sessionID) || errorSessions.has(sessionID)) {
            remindedSessions.delete(sessionID)
            return
          }

          try {
            await ctx.client.session.prompt({
              path: { id: sessionID },
              body: {
                parts: [
                  {
                    type: "text",
                    text: `${CONTINUATION_PROMPT}\n\n[Status: ${todos.length - incomplete.length}/${todos.length} completed, ${incomplete.length} remaining]`,
                  },
                ],
              },
              query: { directory: ctx.directory },
            })
          } catch {
            remindedSessions.delete(sessionID)
          }
        }, DEBOUNCE_MS)

        pendingTimers.set(sessionID, timer)
      }

      // Handle message updates
      if (event.type === "message.updated") {
        const info = props?.info as Record<string, unknown> | undefined
        const sessionID = info?.sessionID as string | undefined
        
        if (sessionID && info?.role === "user") {
          // Cancel pending continuation on user interaction
          const timer = pendingTimers.get(sessionID)
          if (timer) {
            clearTimeout(timer)
            pendingTimers.delete(sessionID)
          }
        }
        
        // Clear reminded state when assistant responds (allows re-remind on next idle)
        if (sessionID && info?.role === "assistant" && remindedSessions.has(sessionID)) {
          remindedSessions.delete(sessionID)
        }
      }

      // Cleanup when session is deleted
      if (event.type === "session.deleted") {
        const sessionInfo = props?.info as { id?: string } | undefined
        if (sessionInfo?.id) {
          remindedSessions.delete(sessionInfo.id)
          interruptedSessions.delete(sessionInfo.id)
          errorSessions.delete(sessionInfo.id)
          
          const timer = pendingTimers.get(sessionInfo.id)
          if (timer) {
            clearTimeout(timer)
            pendingTimers.delete(sessionInfo.id)
          }
        }
      }
    },
  }
}

export default TodoContinuationEnforcer
