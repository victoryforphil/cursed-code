/**
 * Empty Task Response Detector Plugin
 * 
 * Warns agents when the Task tool returns an empty response, indicating
 * the subagent either failed, didn't terminate correctly, or returned nothing.
 * 
 * Ported from: oh-my-opencode/src/hooks/empty-task-response-detector.ts
 * 
 * Usage: Copy to .opencode/plugin/ directory
 */

import type { Plugin } from "@opencode-ai/plugin"

const EMPTY_RESPONSE_WARNING = `[Task Empty Response Warning]

Task invocation completed but returned no response. This indicates the agent either:
- Failed to execute properly
- Did not terminate correctly
- Returned an empty result

Note: The call has already completed - you are NOT waiting for a response. Proceed accordingly.`

export const EmptyTaskResponseDetector: Plugin = async (_ctx) => {
  return {
    "tool.execute.after": async (
      input: { tool: string; sessionID: string; callID: string },
      output: { title: string; output: string; metadata: unknown }
    ) => {
      if (input.tool !== "Task") return

      const responseText = output.output?.trim() ?? ""

      if (responseText === "") {
        output.output = EMPTY_RESPONSE_WARNING
      }
    },
  }
}

export default EmptyTaskResponseDetector
