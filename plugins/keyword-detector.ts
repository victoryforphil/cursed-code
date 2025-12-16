/**
 * Keyword Detector Plugin (Simplified)
 * 
 * Auto-detects keywords in user prompts and appends specialized context.
 * Supports multiple languages (EN/KO/JP/CN/VN).
 * 
 * Keywords:
 * - ultrawork/ulw: Maximum performance mode with agent orchestration
 * - search/find/locate: Maximized search effort mode
 * - analyze/investigate: Deep analysis mode with multi-phase approach
 * 
 * Ported from: oh-my-opencode/src/hooks/keyword-detector/
 * Simplified: Removed hook-message-injector dependency, directly modifies parts
 * 
 * Usage: Copy to .opencode/plugin/ directory
 * 
 * Customization: Modify KEYWORD_DETECTORS array to add/remove/customize keywords
 */

import type { Plugin } from "@opencode-ai/plugin"

// Configuration - add your own keywords and messages here
const CODE_BLOCK_PATTERN = /```[\s\S]*?```/g
const INLINE_CODE_PATTERN = /`[^`]+`/g

interface KeywordDetector {
  pattern: RegExp
  message: string
}

const KEYWORD_DETECTORS: KeywordDetector[] = [
  // ULTRAWORK: ulw, ultrawork - Maximum orchestration mode
  {
    pattern: /\b(ultrawork|ulw)\b/i,
    message: `<ultrawork-mode>
[CODE RED] Maximum precision required. Think deeply before acting.

YOU MUST LEVERAGE ALL AVAILABLE AGENTS TO THEIR FULLEST POTENTIAL.

## AGENT UTILIZATION PRINCIPLES
- **Codebase Exploration**: Spawn exploration agents using Task tool for file patterns, implementations
- **Documentation**: Use research agents for API references, examples, external library docs
- **Planning**: NEVER plan yourself - spawn a planning agent for work breakdown

## EXECUTION RULES
- **TODO**: Track EVERY step. Mark complete IMMEDIATELY after each.
- **PARALLEL**: Fire independent agent calls simultaneously - NEVER wait sequentially.
- **VERIFY**: Re-read request after completion. Check ALL requirements met.
- **DELEGATE**: Orchestrate specialized agents for their strengths.

</ultrawork-mode>`,
  },
  
  // SEARCH: EN/KO/JP/CN/VN - Multi-language search keywords
  {
    pattern:
      /\b(search|find|locate|lookup|look\s*up|explore|discover|scan|grep|query|browse|detect|trace|seek|track|pinpoint|hunt)\b|where\s+is|show\s+me|list\s+all|검색|찾아|탐색|조회|스캔|서치|뒤져|찾기|어디|추적|탐지|찾아봐|찾아내|보여줘|목록|検索|探して|見つけて|サーチ|探索|スキャン|どこ|発見|捜索|見つけ出す|一覧|搜索|查找|寻找|查询|检索|定位|扫描|发现|在哪里|找出来|列出|tìm kiếm|tra cứu|định vị|quét|phát hiện|truy tìm|tìm ra|ở đâu|liệt kê/i,
    message: `[search-mode]
MAXIMIZE SEARCH EFFORT. Consider launching multiple approaches IN PARALLEL:
- Explore agents for codebase patterns, file structures
- Research agents for docs, GitHub examples
- Direct tools: Grep, Glob, ripgrep
NEVER stop at first result - be exhaustive.`,
  },
  
  // ANALYZE: EN/KO/JP/CN/VN - Deep analysis mode
  {
    pattern:
      /\b(analyze|analyse|investigate|examine|research|study|deep[\s-]?dive|inspect|audit|evaluate|assess|review|diagnose|scrutinize|dissect|debug|comprehend|interpret|breakdown|understand)\b|why\s+is|how\s+does|how\s+to|분석|조사|파악|연구|검토|진단|이해|설명|원인|이유|뜯어봐|따져봐|평가|해석|디버깅|디버그|어떻게|왜|살펴|分析|調査|解析|検討|研究|診断|理解|説明|検証|精査|究明|デバッグ|なぜ|どう|仕組み|调查|检查|剖析|深入|诊断|解释|调试|为什么|原理|搞清楚|弄明白|phân tích|điều tra|nghiên cứu|kiểm tra|xem xét|chẩn đoán|giải thích|tìm hiểu|gỡ lỗi|tại sao/i,
    message: `[analyze-mode]
DEEP ANALYSIS MODE. Execute in phases:

PHASE 1 - GATHER CONTEXT:
- Explore codebase structure, patterns, implementations
- Research official docs, best practices, examples
- Consider multiple analytical perspectives

PHASE 2 - SYNTHESIZE:
- Cross-reference findings
- Identify patterns and contradictions
- Form comprehensive understanding before acting`,
  },
]

function removeCodeBlocks(text: string): string {
  return text.replace(CODE_BLOCK_PATTERN, "").replace(INLINE_CODE_PATTERN, "")
}

function detectKeywords(text: string): string[] {
  const textWithoutCode = removeCodeBlocks(text)
  return KEYWORD_DETECTORS.filter(({ pattern }) =>
    pattern.test(textWithoutCode)
  ).map(({ message }) => message)
}

function extractPromptText(parts: Array<{ type: string; text?: string }>): string {
  return parts
    .filter((p) => p.type === "text")
    .map((p) => p.text || "")
    .join(" ")
}

export const KeywordDetector: Plugin = async (_ctx) => {
  const injectedSessions = new Set<string>()

  return {
    "chat.message": async (
      input: {
        sessionID: string
        agent?: string
        model?: { providerID: string; modelID: string }
        messageID?: string
      },
      output: {
        message: Record<string, unknown>
        parts: Array<{ type: string; text?: string; [key: string]: unknown }>
      }
    ): Promise<void> => {
      // Only inject once per session
      if (injectedSessions.has(input.sessionID)) {
        return
      }

      const promptText = extractPromptText(output.parts)
      const messages = detectKeywords(promptText)

      if (messages.length === 0) {
        return
      }

      // Append context to the message parts
      const context = messages.join("\n\n---\n\n")
      output.parts.push({
        type: "text",
        text: `\n\n---\n[Auto-detected keywords - injecting context]\n${context}`,
      })

      injectedSessions.add(input.sessionID)
    },

    event: async ({
      event,
    }: {
      event: { type: string; properties?: unknown }
    }) => {
      // Cleanup when session is deleted
      if (event.type === "session.deleted") {
        const props = event.properties as { info?: { id?: string } } | undefined
        if (props?.info?.id) {
          injectedSessions.delete(props.info.id)
        }
      }
    },
  }
}

export default KeywordDetector
