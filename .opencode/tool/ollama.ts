import { tool } from "@opencode-ai/plugin";
import { z } from "zod";

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";

/**
 * Helper to execute ollama CLI commands
 */
async function ollamaCmd(args: string[]): Promise<string> {
  const proc = Bun.spawn(["ollama", ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  await proc.exited;
  
  if (proc.exitCode !== 0) {
    throw new Error(stderr || `Command failed with exit code ${proc.exitCode}`);
  }
  return stdout.trim();
}

/**
 * Helper to call Ollama REST API
 */
async function ollamaApi(endpoint: string, options?: RequestInit): Promise<any> {
  const response = await fetch(`${OLLAMA_HOST}${endpoint}`, options);
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * List all installed models
 */
export const list = tool({
  description: "List all installed Ollama models with size and modification date",
  schema: z.object({}),
  execute: async () => {
    try {
      const data = await ollamaApi("/api/tags");
      if (!data.models || data.models.length === 0) {
        return "No models installed. Use ollama_pull to download models.";
      }
      
      const models = data.models.map((m: any) => {
        const sizeGB = (m.size / 1e9).toFixed(1);
        const modified = new Date(m.modified_at).toLocaleDateString();
        return `${m.name} (${sizeGB}GB, ${modified})`;
      });
      
      return `Installed models:\n${models.join("\n")}`;
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});

/**
 * Show running models
 */
export const ps = tool({
  description: "Show currently running/loaded Ollama models with memory usage",
  schema: z.object({}),
  execute: async () => {
    try {
      const data = await ollamaApi("/api/ps");
      if (!data.models || data.models.length === 0) {
        return "No models currently loaded.";
      }
      
      const models = data.models.map((m: any) => {
        const sizeGB = (m.size / 1e9).toFixed(1);
        const vramGB = m.size_vram ? (m.size_vram / 1e9).toFixed(1) : "0";
        return `${m.name} - ${sizeGB}GB total, ${vramGB}GB VRAM`;
      });
      
      return `Running models:\n${models.join("\n")}`;
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});

/**
 * Pull/download a model
 */
export const pull = tool({
  description: "Download an Ollama model. Example: qwen2.5-coder:32b, deepseek-r1:32b",
  schema: z.object({
    model: z.string().describe("Model name with optional tag (e.g., qwen2.5-coder:32b)"),
  }),
  execute: async ({ model }) => {
    try {
      // Use CLI for pull since it shows progress
      const result = await ollamaCmd(["pull", model]);
      return `✓ Pulled ${model}\n${result}`;
    } catch (error) {
      return `✗ Failed to pull ${model}: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});

/**
 * Stop a running model
 */
export const stop = tool({
  description: "Stop/unload a running Ollama model to free memory",
  schema: z.object({
    model: z.string().describe("Model name to stop (e.g., qwen2.5-coder:32b)"),
  }),
  execute: async ({ model }) => {
    try {
      await ollamaCmd(["stop", model]);
      return `✓ Stopped ${model}`;
    } catch (error) {
      return `✗ Failed to stop ${model}: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});

/**
 * Delete a model
 */
export const rm = tool({
  description: "Delete an Ollama model from disk",
  schema: z.object({
    model: z.string().describe("Model name to delete (e.g., qwen2.5-coder:32b)"),
  }),
  execute: async ({ model }) => {
    try {
      await ollamaCmd(["rm", model]);
      return `✓ Deleted ${model}`;
    } catch (error) {
      return `✗ Failed to delete ${model}: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});

/**
 * Show model info
 */
export const show = tool({
  description: "Show detailed information about an Ollama model (parameters, template, license)",
  schema: z.object({
    model: z.string().describe("Model name to inspect (e.g., qwen2.5-coder:32b)"),
  }),
  execute: async ({ model }) => {
    try {
      const data = await ollamaApi("/api/show", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: model }),
      });
      
      const info = [
        `Model: ${model}`,
        `Parameters: ${data.details?.parameter_size || "unknown"}`,
        `Quantization: ${data.details?.quantization_level || "unknown"}`,
        `Family: ${data.details?.family || "unknown"}`,
        `Format: ${data.details?.format || "unknown"}`,
      ];
      
      if (data.modelfile) {
        info.push(`\nModelfile:\n${data.modelfile.slice(0, 500)}${data.modelfile.length > 500 ? "..." : ""}`);
      }
      
      return info.join("\n");
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});

/**
 * Check Ollama server status
 */
export const status = tool({
  description: "Check if Ollama server is running and responsive",
  schema: z.object({}),
  execute: async () => {
    try {
      const response = await fetch(`${OLLAMA_HOST}/api/tags`);
      if (response.ok) {
        const data = await response.json();
        const modelCount = data.models?.length || 0;
        return `✓ Ollama is running at ${OLLAMA_HOST}\n  ${modelCount} model(s) installed`;
      }
      return `✗ Ollama returned status ${response.status}`;
    } catch (error) {
      return `✗ Ollama is not running at ${OLLAMA_HOST}\n  Start with: ollama serve`;
    }
  },
});

/**
 * Quick generate (one-shot prompt)
 */
export const generate = tool({
  description: "Send a quick one-shot prompt to an Ollama model and get a response",
  schema: z.object({
    model: z.string().describe("Model name (e.g., qwen2.5-coder:32b)"),
    prompt: z.string().describe("The prompt to send"),
    system: z.string().optional().describe("Optional system prompt"),
  }),
  execute: async ({ model, prompt, system }) => {
    try {
      const body: any = {
        model,
        prompt,
        stream: false,
      };
      if (system) {
        body.system = system;
      }
      
      const data = await ollamaApi("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      const stats = `[${(data.eval_count / (data.eval_duration / 1e9)).toFixed(1)} tokens/sec]`;
      return `${data.response}\n\n${stats}`;
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});

/**
 * Copy/create model alias
 */
export const copy = tool({
  description: "Create a copy/alias of an existing model with a new name",
  schema: z.object({
    source: z.string().describe("Source model name"),
    destination: z.string().describe("New model name"),
  }),
  execute: async ({ source, destination }) => {
    try {
      await ollamaApi("/api/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, destination }),
      });
      return `✓ Copied ${source} → ${destination}`;
    } catch (error) {
      return `✗ Failed to copy: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});
