/**
 * Context Window Monitor Plugin
 * 
 * Prevents "context window anxiety" pattern where agents rush work when
 * they perceive context is running low. At 70%+ actual usage, reminds
 * the agent that plenty of headroom remains with 1M context window.
 * 
 * Based on: Agentic Patterns blog research on LLM behavior
 * Ported from: oh-my-opencode/src/hooks/context-window-monitor.ts
 * 
 * Usage: Copy to .opencode/plugin/ directory
 * 
 * Configuration (modify constants below):
 * - ANTHROPIC_DISPLAY_LIMIT: What Claude "thinks" the limit is (1M)
 * - ANTHROPIC_ACTUAL_LIMIT: Actual working limit (200k)
 * - CONTEXT_WARNING_THRESHOLD: When to remind (0.70 = 70%)
 */

import type { Plugin } from "@opencode-ai/plugin"

// Configuration - modify these for your needs
const ANTHROPIC_DISPLAY_LIMIT = 1_000_000
const ANTHROPIC_ACTUAL_LIMIT = 200_000
const CONTEXT_WARNING_THRESHOLD = 0.70

const CONTEXT_REMINDER = `[SYSTEM REMINDER - 1M Context Window]

You are using Anthropic Claude with 1M context window.
You have plenty of context remaining - do NOT rush or skip tasks.
Complete your work thoroughly and methodically.`

interface AssistantMessageInfo {
  role: "assistant"
  providerID: string
  tokens: {
    input: number
    output: number
    reasoning: number
    cache: { read: number; write: number }
  }
}

interface MessageWrapper {
  info: { role: string } & Partial<AssistantMessageInfo>
}

export const ContextWindowMonitor: Plugin = async (ctx) => {
  const remindedSessions = new Set<string>()

  return {
    "tool.execute.after": async (
      input: { tool: string; sessionID: string; callID: string },
      output: { title: string; output: string; metadata: unknown }
    ) => {
      const { sessionID } = input

      // Only remind once per session
      if (remindedSessions.has(sessionID)) return

      try {
        const response = await ctx.client.session.messages({
          path: { id: sessionID },
        })

        const messages = (response.data ?? response) as MessageWrapper[]

        const assistantMessages = messages
          .filter((m) => m.info.role === "assistant")
          .map((m) => m.info as AssistantMessageInfo)

        if (assistantMessages.length === 0) return

        const lastAssistant = assistantMessages[assistantMessages.length - 1]
        
        // Only apply to Anthropic models
        if (lastAssistant.providerID !== "anthropic") return

        // Use only the last assistant message's input tokens
        // This reflects the ACTUAL current context window usage (post-compaction)
        const lastTokens = lastAssistant.tokens
        const totalInputTokens = (lastTokens?.input ?? 0) + (lastTokens?.cache?.read ?? 0)

        const actualUsagePercentage = totalInputTokens / ANTHROPIC_ACTUAL_LIMIT

        if (actualUsagePercentage < CONTEXT_WARNING_THRESHOLD) return

        remindedSessions.add(sessionID)

        const displayUsagePercentage = totalInputTokens / ANTHROPIC_DISPLAY_LIMIT
        const usedPct = (displayUsagePercentage * 100).toFixed(1)
        const remainingPct = ((1 - displayUsagePercentage) * 100).toFixed(1)
        const usedTokens = totalInputTokens.toLocaleString()
        const limitTokens = ANTHROPIC_DISPLAY_LIMIT.toLocaleString()

        output.output += `\n\n${CONTEXT_REMINDER}
[Context Status: ${usedPct}% used (${usedTokens}/${limitTokens} tokens), ${remainingPct}% remaining]`
      } catch {
        // Graceful degradation - do not disrupt tool execution
      }
    },

    event: async ({ event }: { event: { type: string; properties?: unknown } }) => {
      const props = event.properties as Record<string, unknown> | undefined

      // Clean up when session is deleted
      if (event.type === "session.deleted") {
        const sessionInfo = props?.info as { id?: string } | undefined
        if (sessionInfo?.id) {
          remindedSessions.delete(sessionInfo.id)
        }
      }
    },
  }
}

export default ContextWindowMonitor
