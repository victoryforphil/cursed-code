/**
 * Usage Tracker Core Logic
 * 
 * Tracks token usage by model and agent across sessions including subagents.
 */

import type {
  SessionStats,
  TokenCounts,
  SessionInfo,
  PersistedStats,
} from './types'

export class UsageTracker {
  private sessions: Map<string, SessionStats> = new Map()
  private parentChildMap: Map<string, Set<string>> = new Map()
  private directory: string

  constructor(directory: string) {
    this.directory = directory
  }

  /**
   * Initialize tracking for a new session
   */
  initSession(sessionID: string, parentID?: string, title?: string): void {
    if (this.sessions.has(sessionID)) return

    const agentName = this.extractAgentName(title, parentID)

    const stats: SessionStats = {
      sessionID,
      startTime: new Date(),
      agents: new Map(),
      byModel: new Map(),
      totals: { input: 0, output: 0, reasoning: 0, cost: 0 },
    }

    // Initialize agent entry
    stats.agents.set(agentName, {
      agentName,
      sessionID,
      parentID,
      tokens: this.emptyTokens(),
      cost: 0,
    })

    this.sessions.set(sessionID, stats)

    // Track parent-child relationship
    if (parentID) {
      if (!this.parentChildMap.has(parentID)) {
        this.parentChildMap.set(parentID, new Set())
      }
      this.parentChildMap.get(parentID)!.add(sessionID)
    }
  }

  /**
   * Update session stats from session.updated event info only (no client API)
   */
  updateSessionFromInfo(info: SessionInfo): void {
    const { id: sessionID, cost, tokens, parentID } = info

    // Ensure session is initialized
    if (!this.sessions.has(sessionID)) {
      this.initSession(sessionID, parentID, info.title)
    }

    const stats = this.sessions.get(sessionID)!

    // Update totals from session info
    stats.totals.input = tokens.input
    stats.totals.output = tokens.output
    stats.totals.reasoning = tokens.reasoning
    stats.totals.cost = cost

    // Update the first agent's tokens (simplified - no model breakdown without chat.params)
    const agent = stats.agents.values().next().value
    if (agent) {
      agent.tokens = {
        input: tokens.input,
        output: tokens.output,
        reasoning: tokens.reasoning,
        cache: tokens.cache || { read: 0, write: 0 },
      }
      agent.cost = cost
    }
  }

  /**
   * Get stats for a session including all subagent sessions
   */
  getAggregatedStats(sessionID: string): SessionStats | null {
    const mainStats = this.sessions.get(sessionID)
    if (!mainStats) return null

    // Clone main stats
    const aggregated: SessionStats = {
      ...mainStats,
      agents: new Map(mainStats.agents),
      byModel: new Map(mainStats.byModel),
      totals: { ...mainStats.totals },
    }

    // Add child session stats
    const children = this.parentChildMap.get(sessionID)
    if (children) {
      for (const childID of children) {
        const childStats = this.sessions.get(childID)
        if (!childStats) continue

        // Merge agents
        for (const [name, agent] of childStats.agents) {
          const key = `${name}:${childID}`
          aggregated.agents.set(key, agent)
        }

        // Merge model stats
        for (const [key, model] of childStats.byModel) {
          const existing = aggregated.byModel.get(key)
          if (existing) {
            existing.tokens.input += model.tokens.input
            existing.tokens.output += model.tokens.output
            existing.tokens.reasoning += model.tokens.reasoning
            existing.cost += model.cost
            existing.callCount += model.callCount
          } else {
            aggregated.byModel.set(key, { ...model, tokens: { ...model.tokens } })
          }
        }

        // Sum totals
        aggregated.totals.input += childStats.totals.input
        aggregated.totals.output += childStats.totals.output
        aggregated.totals.reasoning += childStats.totals.reasoning
        aggregated.totals.cost += childStats.totals.cost
      }
    }

    return aggregated
  }

  /**
   * Get child sessions for a parent
   */
  getChildSessions(parentID: string): string[] {
    return Array.from(this.parentChildMap.get(parentID) || [])
  }

  /**
   * Mark session as complete
   */
  completeSession(sessionID: string): void {
    const stats = this.sessions.get(sessionID)
    if (stats) {
      stats.endTime = new Date()
    }
  }

  /**
   * Persist stats to file
   */
  async persistStats(sessionID: string): Promise<void> {
    const stats = this.getAggregatedStats(sessionID)
    if (!stats) return

    const filePath = `${this.directory}/.opencode/usage-stats.json`

    try {
      let persisted: PersistedStats = { sessions: [] }

      // Try to read existing file
      try {
        const existing = await Bun.file(filePath).text()
        persisted = JSON.parse(existing)
      } catch {
        // File doesn't exist yet
      }

      // Add new session
      persisted.sessions.push({
        id: sessionID,
        timestamp: new Date().toISOString(),
        totals: {
          inputTokens: stats.totals.input,
          outputTokens: stats.totals.output,
          reasoningTokens: stats.totals.reasoning,
          cost: stats.totals.cost,
        },
        byModel: Object.fromEntries(
          Array.from(stats.byModel.entries()).map(([key, m]) => [
            key,
            {
              input: m.tokens.input,
              output: m.tokens.output,
              reasoning: m.tokens.reasoning,
              cost: m.cost,
              calls: m.callCount,
            },
          ])
        ),
        byAgent: Object.fromEntries(
          Array.from(stats.agents.entries()).map(([name, a]) => [
            name,
            {
              model: a.modelID || 'unknown',
              provider: a.providerID || 'unknown',
              input: a.tokens.input,
              output: a.tokens.output,
              cost: a.cost,
            },
          ])
        ),
      })

      // Keep only last 100 sessions
      if (persisted.sessions.length > 100) {
        persisted.sessions = persisted.sessions.slice(-100)
      }

      await Bun.write(filePath, JSON.stringify(persisted, null, 2))
    } catch {
      // Fail silently - no console output to avoid TUI corruption
    }
  }

  /**
   * Clean up session data
   */
  cleanupSession(sessionID: string): void {
    this.sessions.delete(sessionID)
    this.parentChildMap.delete(sessionID)
    
    // Remove from parent's children
    for (const [, children] of this.parentChildMap) {
      children.delete(sessionID)
    }
  }

  /**
   * Extract agent name from session title or use defaults
   * 
   * Priority:
   * 1. mode field from message (handled in updateModelInfo)
   * 2. Parse from title pattern: "Description (@agent agentname)"
   * 3. Default to "main" for parent sessions, "subagent" for children
   */
  private extractAgentName(title?: string, parentID?: string): string {
    if (title) {
      // Match pattern: "@agent agentname" or "(@agent agentname)"
      const match = title.match(/@agent\s+(\w+)/i)
      if (match) return match[1]

      // Match pattern: "(agentname)" at end
      const endMatch = title.match(/\((\w+)\)\s*$/)
      if (endMatch) return endMatch[1]
    }

    return parentID ? 'subagent' : 'main'
  }

  private emptyTokens(): TokenCounts {
    return {
      input: 0,
      output: 0,
      reasoning: 0,
      cache: { read: 0, write: 0 },
    }
  }
}
