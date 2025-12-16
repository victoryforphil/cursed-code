/**
 * @cursed/background-tasks
 * 
 * Background task orchestration plugin for OpenCode.
 * Launch agents in parallel, monitor progress, get notified on completion.
 * 
 * Based on oh-my-opencode's background-agent feature, adapted as a standalone plugin.
 */

import type { Plugin } from "@opencode-ai/plugin"
import { BackgroundManager } from "./manager"
import { createBackgroundTools } from "./tools"

interface Event {
  type: string
  properties?: Record<string, unknown>
}

const BackgroundTasksPlugin: Plugin = async (ctx) => {
  console.log("[BackgroundTasks] Plugin loaded")

  // Create the background manager singleton
  const manager = new BackgroundManager(ctx)

  // Create the three background task tools
  const backgroundTools = createBackgroundTools(manager, ctx.client)

  return {
    // Register tools
    tool: backgroundTools,

    // Handle events for background task lifecycle
    event: async ({ event }: { event: Event }) => {
      manager.handleEvent(event)
    },
  }
}

export default BackgroundTasksPlugin

// Re-export types for consumers
export type { BackgroundTask, BackgroundTaskStatus, TaskProgress } from "./types"
export { BackgroundManager } from "./manager"
