/**
 * Usage Tracker Types
 */

export interface TokenCounts {
  input: number
  output: number
  reasoning: number
  cache: {
    read: number
    write: number
  }
}

export interface ModelUsage {
  modelID: string
  providerID: string
  tokens: TokenCounts
  cost: number
  callCount: number
}

export interface AgentUsage {
  agentName: string
  sessionID: string
  parentID?: string
  modelID?: string
  providerID?: string
  tokens: TokenCounts
  cost: number
}

export interface SessionStats {
  sessionID: string
  startTime: Date
  endTime?: Date
  agents: Map<string, AgentUsage>
  byModel: Map<string, ModelUsage>
  totals: {
    input: number
    output: number
    reasoning: number
    cost: number
  }
}

export interface SessionInfo {
  id: string
  parentID?: string
  title?: string
  cost: number
  tokens: TokenCounts
}

export interface MessageInfo {
  role: string
  modelID?: string
  providerID?: string
  mode?: string
  cost?: number
  tokens?: TokenCounts
}

export interface ChatParamsInput {
  sessionID: string
  agent: string
  model: {
    modelID: string
    providerID: string
  }
  provider: unknown
  message: unknown
}

export interface SessionEvent {
  type: string
  properties?: {
    info?: SessionInfo
    [key: string]: unknown
  }
}

export interface UsageReportOptions {
  format?: 'summary' | 'detailed' | 'json'
}

export interface PersistedStats {
  sessions: Array<{
    id: string
    timestamp: string
    totals: {
      inputTokens: number
      outputTokens: number
      reasoningTokens: number
      cost: number
    }
    byModel: Record<string, {
      input: number
      output: number
      reasoning: number
      cost: number
      calls: number
    }>
    byAgent: Record<string, {
      model: string
      provider: string
      input: number
      output: number
      cost: number
    }>
  }>
}
