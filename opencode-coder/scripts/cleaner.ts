/**
 * cleaner.ts — 模型输出清洗管道
 *
 * 为什么需要这个模块？
 * opencode CLI 调用外部模型后，返回的 stdout 会混入各种"污染物"：
 *   - ANSI 颜色转义码（终端着色用的 \033[...m）
 *   - opencode 自身的 header 行（"> agent · model-name" 格式）
 *   - MiniMax 特有的 <think>...</think> 思考标签
 *   - 模型不听话时包裹的 markdown ``` 围栏
 *   - 首尾空行
 *
 * 清洗顺序是 load-bearing 的：ANSI → headers → think → fences → trim
 * 改顺序会导致下游 XML 解析器匹配失败（比如 ANSI 码插在 <file 标签中间）。
 *
 * 每个函数都是纯函数 (string -> string)，方便单独测试。
 */

// ============================================================================
// Step 1: 去除 ANSI 转义码
// ============================================================================
// 匹配所有 SGR (Select Graphic Rendition) 序列，如 \033[0m, \033[1;31m 等
// 同时匹配 OSC 序列（某些终端的标题设置）
const ANSI_RE = /\x1b\[[0-9;]*[a-zA-Z]|\x1b\].*?\x07/g;

export function stripAnsiCodes(input: string): string {
  return input.replace(ANSI_RE, "");
}

// ============================================================================
// Step 2: 去除 opencode header 行
// ============================================================================
// opencode 的默认输出格式会在开头加一行 "> agent · model-name" 或类似格式
// 匹配规则：行首 > 后跟空格，中间包含 · 字符
const HEADER_LINE_RE = /^>[ \t].*·.*$/gm;

export function stripOpenCodeHeaders(input: string): string {
  return input.replace(HEADER_LINE_RE, "");
}

// ============================================================================
// Step 3: 去除 <think>...</think> 标签
// ============================================================================
// MiniMax M2.7 的 highspeed 模式会输出思考过程，可能跨多行
// 用非贪婪匹配 [\s\S]*? 确保不会吞掉多个 think 块之间的内容
const THINK_TAG_RE = /<think>[\s\S]*?<\/think>\s*/g;

export function stripThinkTags(input: string): string {
  return input.replace(THINK_TAG_RE, "");
}

// ============================================================================
// Step 4: 去除首尾 markdown 围栏
// ============================================================================
// 只删最外层的围栏（首行 ```xxx 和末行 ```），保留代码中间合法的围栏
// 设计决策：逐行检查首尾，不用全局正则，避免误删中间内容
export function stripMarkdownFences(input: string): string {
  const lines = input.split("\n");

  if (lines.length < 3) {
    return input;
  }

  // 找到第一个非空行
  let firstNonEmptyIdx = 0;
  while (firstNonEmptyIdx < lines.length && lines[firstNonEmptyIdx].trim() === "") {
    firstNonEmptyIdx++;
  }

  // 找到最后一个非空行
  let lastNonEmptyIdx = lines.length - 1;
  while (lastNonEmptyIdx >= 0 && lines[lastNonEmptyIdx].trim() === "") {
    lastNonEmptyIdx--;
  }

  if (firstNonEmptyIdx >= lastNonEmptyIdx) {
    return input;
  }

  // 检查首行是否是 ```language 格式
  const firstLine = lines[firstNonEmptyIdx].trim();
  const lastLine = lines[lastNonEmptyIdx].trim();

  const startsWithFence = /^```\w*$/.test(firstLine);
  const endsWithFence = lastLine === "```";

  if (startsWithFence && endsWithFence) {
    // 两头都有围栏才删（配对删除，防止只删一半导致内容错乱）
    lines.splice(lastNonEmptyIdx, 1);
    lines.splice(firstNonEmptyIdx, 1);
  }

  return lines.join("\n");
}

// ============================================================================
// Step 5: 去除首尾空行
// ============================================================================
// 保留内容中间的空行，只 trim 首尾。末尾保留一个换行符（POSIX 文件规范）。
export function trimEmptyLines(input: string): string {
  // 去除开头所有空行
  let result = input.replace(/^\s*\n/, "");
  // 去除结尾多余空行，保留最后一个换行
  result = result.replace(/\n\s*$/, "\n");
  return result;
}

// ============================================================================
// 组合管道：按固定顺序执行全部清洗步骤
// ============================================================================
export function cleanModelOutput(raw: string): string {
  let output = raw;
  output = stripAnsiCodes(output);
  output = stripOpenCodeHeaders(output);
  output = stripThinkTags(output);
  output = stripMarkdownFences(output);
  output = trimEmptyLines(output);
  return output;
}
