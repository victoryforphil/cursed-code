/**
 * Output Formatters for Usage Reports
 */

import type { SessionStats } from './types'

/**
 * Format tokens with K/M suffix
 */
function formatTokens(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`
  }
  return count.toString()
}

/**
 * Format cost as dollars
 */
function formatCost(cost: number): string {
  if (cost === 0) return '$0.00'
  if (cost < 0.01) return `$${cost.toFixed(4)}`
  return `$${cost.toFixed(2)}`
}

/**
 * Calculate percentage
 */
function calcPercent(part: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((part / total) * 100)}%`
}

/**
 * Format summary report for console output
 */
export function formatSummary(stats: SessionStats): string {
  const totalTokens = stats.totals.input + stats.totals.output
  const lines: string[] = []

  lines.push('═══════════════════════════════════════════════════════════════')
  lines.push('                     SESSION USAGE REPORT')
  lines.push('═══════════════════════════════════════════════════════════════')
  lines.push('')

  // By Model section
  lines.push('By Model                              Tokens (in/out)       Cost      %')
  lines.push('───────────────────────────────────────────────────────────────────────')

  const modelEntries = Array.from(stats.byModel.entries())
    .sort((a, b) => (b[1].tokens.input + b[1].tokens.output) - (a[1].tokens.input + a[1].tokens.output))

  for (const [key, model] of modelEntries) {
    const modelTokens = model.tokens.input + model.tokens.output
    const isLocal = model.providerID === 'ollama'
    const name = isLocal ? `${model.modelID} (local)` : model.modelID
    const displayName = name.length > 35 ? name.slice(0, 32) + '...' : name.padEnd(35)
    const tokensStr = `${formatTokens(model.tokens.input)} / ${formatTokens(model.tokens.output)}`.padEnd(18)
    const costStr = formatCost(model.cost).padEnd(10)
    const pctStr = calcPercent(modelTokens, totalTokens)

    lines.push(`${displayName} ${tokensStr} ${costStr} ${pctStr}`)
  }

  lines.push('───────────────────────────────────────────────────────────────────────')
  
  const totalTokensStr = `${formatTokens(stats.totals.input)} / ${formatTokens(stats.totals.output)}`.padEnd(18)
  lines.push(`${'TOTAL'.padEnd(35)} ${totalTokensStr} ${formatCost(stats.totals.cost).padEnd(10)} 100%`)
  lines.push('')

  // By Agent section
  lines.push('By Agent                              Tokens (in/out)    Model Used')
  lines.push('───────────────────────────────────────────────────────────────────────')

  const agentEntries = Array.from(stats.agents.entries())
    .sort((a, b) => {
      // Main first, then by tokens
      if (a[1].agentName === 'main') return -1
      if (b[1].agentName === 'main') return 1
      return (b[1].tokens.input + b[1].tokens.output) - (a[1].tokens.input + a[1].tokens.output)
    })

  for (const [key, agent] of agentEntries) {
    const isSubagent = agent.parentID !== undefined
    const prefix = isSubagent ? '└─ ' : ''
    const name = `${prefix}${agent.agentName}`
    const displayName = name.length > 35 ? name.slice(0, 32) + '...' : name.padEnd(35)
    const tokensStr = `${formatTokens(agent.tokens.input)} / ${formatTokens(agent.tokens.output)}`.padEnd(18)
    const modelStr = agent.modelID || 'unknown'

    lines.push(`${displayName} ${tokensStr} ${modelStr}`)
  }

  lines.push('')
  lines.push('═══════════════════════════════════════════════════════════════')

  return lines.join('\n')
}

/**
 * Format detailed report with more info
 */
export function formatDetailed(stats: SessionStats): string {
  const lines: string[] = []
  const totalTokens = stats.totals.input + stats.totals.output

  lines.push('═══════════════════════════════════════════════════════════════')
  lines.push('                  DETAILED USAGE REPORT')
  lines.push('═══════════════════════════════════════════════════════════════')
  lines.push('')
  lines.push(`Session ID: ${stats.sessionID}`)
  lines.push(`Started: ${stats.startTime.toISOString()}`)
  if (stats.endTime) {
    lines.push(`Ended: ${stats.endTime.toISOString()}`)
    const duration = (stats.endTime.getTime() - stats.startTime.getTime()) / 1000
    lines.push(`Duration: ${Math.round(duration)}s`)
  }
  lines.push('')

  // Totals
  lines.push('─── TOTALS ───')
  lines.push(`Input tokens:     ${stats.totals.input.toLocaleString()}`)
  lines.push(`Output tokens:    ${stats.totals.output.toLocaleString()}`)
  lines.push(`Reasoning tokens: ${stats.totals.reasoning.toLocaleString()}`)
  lines.push(`Total tokens:     ${totalTokens.toLocaleString()}`)
  lines.push(`Total cost:       ${formatCost(stats.totals.cost)}`)
  lines.push('')

  // By Model
  lines.push('─── BY MODEL ───')
  for (const [key, model] of stats.byModel) {
    const isLocal = model.providerID === 'ollama'
    lines.push(`${model.providerID}/${model.modelID}${isLocal ? ' (local)' : ''}`)
    lines.push(`  Input:     ${model.tokens.input.toLocaleString()}`)
    lines.push(`  Output:    ${model.tokens.output.toLocaleString()}`)
    lines.push(`  Reasoning: ${model.tokens.reasoning.toLocaleString()}`)
    lines.push(`  Cache:     ${model.tokens.cache.read.toLocaleString()} read / ${model.tokens.cache.write.toLocaleString()} write`)
    lines.push(`  Cost:      ${formatCost(model.cost)}`)
    lines.push(`  Calls:     ${model.callCount}`)
    lines.push(`  Share:     ${calcPercent(model.tokens.input + model.tokens.output, totalTokens)}`)
    lines.push('')
  }

  // By Agent
  lines.push('─── BY AGENT ───')
  for (const [key, agent] of stats.agents) {
    const isSubagent = agent.parentID !== undefined
    lines.push(`${isSubagent ? '└─ ' : ''}${agent.agentName}`)
    lines.push(`  Session:  ${agent.sessionID}`)
    if (agent.parentID) lines.push(`  Parent:   ${agent.parentID}`)
    lines.push(`  Model:    ${agent.providerID || 'unknown'}/${agent.modelID || 'unknown'}`)
    lines.push(`  Input:    ${agent.tokens.input.toLocaleString()}`)
    lines.push(`  Output:   ${agent.tokens.output.toLocaleString()}`)
    lines.push(`  Cost:     ${formatCost(agent.cost)}`)
    lines.push('')
  }

  lines.push('═══════════════════════════════════════════════════════════════')

  return lines.join('\n')
}

/**
 * Format as JSON
 */
export function formatJSON(stats: SessionStats): string {
  return JSON.stringify({
    sessionID: stats.sessionID,
    startTime: stats.startTime.toISOString(),
    endTime: stats.endTime?.toISOString(),
    totals: stats.totals,
    byModel: Object.fromEntries(
      Array.from(stats.byModel.entries()).map(([key, m]) => [key, {
        modelID: m.modelID,
        providerID: m.providerID,
        tokens: m.tokens,
        cost: m.cost,
        callCount: m.callCount,
      }])
    ),
    byAgent: Object.fromEntries(
      Array.from(stats.agents.entries()).map(([key, a]) => [key, {
        agentName: a.agentName,
        sessionID: a.sessionID,
        parentID: a.parentID,
        modelID: a.modelID,
        providerID: a.providerID,
        tokens: a.tokens,
        cost: a.cost,
      }])
    ),
  }, null, 2)
}

/**
 * Format brief toast message
 */
export function formatToast(stats: SessionStats): string {
  const totalTokens = stats.totals.input + stats.totals.output
  const cost = formatCost(stats.totals.cost)
  
  // Calculate local vs cloud percentage
  let localTokens = 0
  let cloudTokens = 0
  for (const model of stats.byModel.values()) {
    const tokens = model.tokens.input + model.tokens.output
    if (model.providerID === 'ollama') {
      localTokens += tokens
    } else {
      cloudTokens += tokens
    }
  }

  const localPct = totalTokens > 0 ? Math.round((localTokens / totalTokens) * 100) : 0
  const cloudPct = 100 - localPct

  return `${formatTokens(totalTokens)} tokens | ${cost} | ${cloudPct}% cloud, ${localPct}% local`
}
