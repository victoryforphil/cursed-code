/**
 * @cursed/usage-tracker
 *
 * Track token usage by model and agent, including subagent calls.
 * Exposes data via usage_report tool and TUI sidebar display.
 */

import type { Plugin } from '@opencode-ai/plugin'
import { tool } from '@opencode-ai/plugin'
import { UsageTracker } from './tracker'
import { formatSummary, formatDetailed, formatJSON } from './formatter'
import type { SessionInfo } from './types'

const UsageTrackerPlugin: Plugin = async (ctx) => {
  const tracker = new UsageTracker(ctx.directory)
  let currentSessionID: string | undefined

  return {
    /**
     * Handle session lifecycle events only - no undocumented hooks
     */
    event: async ({ event }) => {
      const props = event.properties as Record<string, unknown> | undefined

      // Session created - initialize tracking
      if (event.type === 'session.created' && props?.info) {
        const info = props.info as SessionInfo
        tracker.initSession(info.id, info.parentID, info.title)
        currentSessionID = info.id
      }

      // Session updated - update stats
      if (event.type === 'session.updated' && props?.info) {
        const info = props.info as SessionInfo
        tracker.updateSessionFromInfo(info)
        currentSessionID = info.id
      }

      // Session idle - just persist, no display
      if (event.type === 'session.idle') {
        const sessionID = currentSessionID
        if (!sessionID) return

        const stats = tracker.getAggregatedStats(sessionID)
        if (!stats) return
        if (stats.totals.input === 0 && stats.totals.output === 0) return

        tracker.completeSession(sessionID)
        await tracker.persistStats(sessionID)
      }

      // Session deleted - cleanup
      if (event.type === 'session.deleted' && props?.info) {
        const info = props.info as { id?: string }
        if (info?.id) {
          tracker.cleanupSession(info.id)
        }
      }
    },

    /**
     * Custom tool to display usage on demand
     */
    tool: {
      usage_report: tool({
        description: 'Display token usage statistics for the current session',
        args: {
          format: tool.schema
            .enum(['summary', 'detailed', 'json'])
            .optional()
            .describe('Output format: summary (default), detailed, or json'),
        },
        async execute(args, toolCtx) {
          const stats = tracker.getAggregatedStats(toolCtx.sessionID)

          if (!stats) {
            return 'No usage data available for this session yet.'
          }

          switch (args.format) {
            case 'json':
              return formatJSON(stats)
            case 'detailed':
              return formatDetailed(stats)
            default:
              return formatSummary(stats)
          }
        },
      }),
    },

    /**
     * TUI sidebar integration - show real-time usage stats
     */
    'tui.sidebar.sections': async () => {
      // Always return a section, even if no data yet
      if (!currentSessionID) {
        return [
          {
            id: 'usage-tracker',
            title: 'Usage Stats',
            priority: 80,
            collapsible: true,
            defaultExpanded: true,
            items: [
              {
                type: 'text' as const,
                label: 'Status',
                value: 'Waiting for session...',
              },
            ],
          },
        ]
      }

      const stats = tracker.getAggregatedStats(currentSessionID)
      if (!stats || (stats.totals.input === 0 && stats.totals.output === 0)) {
        return [
          {
            id: 'usage-tracker',
            title: 'Usage Stats',
            priority: 80,
            collapsible: true,
            defaultExpanded: true,
            items: [
              {
                type: 'text' as const,
                label: 'Total Tokens',
                value: '0',
              },
              {
                type: 'text' as const,
                label: 'Total Cost',
                value: '$0.0000',
              },
            ],
          },
        ]
      }

      // Format cost for display
      const cost = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 4,
      }).format(stats.totals.cost)

      // Calculate total tokens
      const totalTokens = stats.totals.input + stats.totals.output + stats.totals.reasoning

      // Get model breakdown (show top 3 models)
      const modelEntries = Array.from(stats.byModel.entries())
        .map(([key, model]) => ({
          name: key,
          totalTokens: model.tokens.input + model.tokens.output + model.tokens.reasoning,
          cost: model.cost,
          calls: model.callCount,
        }))
        .sort((a, b) => b.totalTokens - a.totalTokens)
        .slice(0, 3)

      const items = [
        {
          type: 'text' as const,
          label: 'Total Tokens',
          value: totalTokens.toLocaleString(),
        },
        {
          type: 'text' as const,
          label: 'Input Tokens',
          value: stats.totals.input.toLocaleString(),
        },
        {
          type: 'text' as const,
          label: 'Output Tokens',
          value: stats.totals.output.toLocaleString(),
        },
        ...(stats.totals.reasoning > 0
          ? [
              {
                type: 'text' as const,
                label: 'Reasoning Tokens',
                value: stats.totals.reasoning.toLocaleString(),
              },
            ]
          : []),
        {
          type: 'text' as const,
          label: 'Total Cost',
          value: cost,
        },
        ...modelEntries.map((model) => ({
          type: 'text' as const,
          label: model.name,
          value: `${model.totalTokens.toLocaleString()} tokens (${model.calls} calls)`,
        })),
        ...(stats.agents.size > 1
          ? [
              {
                type: 'text' as const,
                label: 'Agents',
                value: `${stats.agents.size} active`,
              },
            ]
          : []),
      ]

      return [
        {
          id: 'usage-tracker',
          title: 'Usage Stats',
          priority: 80, // Show after built-in sections but before other plugins
          collapsible: true,
          defaultExpanded: true,
          items,
        },
      ]
    },
  }
}

export default UsageTrackerPlugin
