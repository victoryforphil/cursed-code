/**
 * @cursed/usage-tracker
 *
 * Track token usage by model and agent, including subagent calls.
 * Exposes data via usage_report tool only - no auto-display.
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
  }
}

export default UsageTrackerPlugin
