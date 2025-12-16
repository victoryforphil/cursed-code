import { tool } from "@opencode-ai/plugin";
import { z } from "zod";

/**
 * Download a web page and save as markdown
 * Efficiently fetches pages without using LLM context for transfer
 */
export default tool({
  description: "Download a web page and save as markdown. Use this instead of webfetch + write for large documentation pages to avoid using LLM context for transfer.",
  schema: z.object({
    url: z.string().describe("The URL to download"),
    outputPath: z.string().describe("Absolute path where to save the markdown file"),
  }),
  execute: async ({ url, outputPath }) => {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        return `Error: HTTP ${response.status}: ${response.statusText}`;
      }
      
      const html = await response.text();
      
      // Simple HTML to markdown conversion
      let markdown = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
      
      markdown = markdown
        // Headers
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n')
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n')
        .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n')
        .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '\n##### $1\n')
        .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '\n###### $1\n')
        // Code blocks
        .replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```\n')
        .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
        // Lists
        .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
        // Links
        .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
        // Bold/italic
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
        .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
        .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
        // Paragraphs
        .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
        // Line breaks
        .replace(/<br\s*\/?>/gi, '\n')
        // Remove remaining HTML tags
        .replace(/<[^>]+>/g, '')
        // Decode HTML entities
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        // Clean up excessive whitespace
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      
      // Add metadata header
      const output = `# Source: ${url}
# Downloaded: ${new Date().toISOString()}

${markdown}
`;
      
      // Write to file
      await Bun.write(outputPath, output);
      
      return `✓ Downloaded ${url} to ${outputPath} (${output.length} bytes)`;
      
    } catch (error) {
      return `✗ Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});
