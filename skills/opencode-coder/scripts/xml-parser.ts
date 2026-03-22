/**
 * xml-parser.ts — XML <file> 块提取器
 *
 * 为什么用正则而不是真正的 XML 解析器？
 * 因为模型输出的是"XML 形状"的文本，但不是合法 XML：
 *   - 代码中可能有未转义的 <, &, > 等字符
 *   - 模型可能在标签外面加解释文字
 * 正则提取更宽容，适合这个"半结构化"的场景。
 *
 * 核心流程：
 *   cleanedOutput → extractFileBlocks (正则) → validateFileBlocks (路径匹配)
 *
 * 降级策略：如果 XML 解析完全失败（零块），且有实质性输出内容，
 * 降级为单文件模式——把整个输出当作第一个文件的内容。
 */

/** 解析出的单个文件块 */
export interface ParsedFileBlock {
  readonly path: string;
  readonly content: string;
}

/** 验证结果 */
export interface ValidationResult {
  /** 通过验证的文件块（路径在期望列表中） */
  readonly valid: ParsedFileBlock[];
  /** 警告信息（路径不匹配、缺失文件等） */
  readonly warnings: string[];
}

// ============================================================================
// 正则提取 <file path="...">content</file>
// ============================================================================
// 非贪婪 [\s\S]*? 确保不会跨文件块匹配
// path 属性值用 [^"]+ 匹配（不允许空路径）
const FILE_BLOCK_RE = /<file\s+path="([^"]+)">\n?([\s\S]*?)\n?<\/file>/g;

/**
 * 从清洗后的模型输出中提取所有 <file> 块。
 *
 * 如果同一个 path 出现多次，取最后一个（模型可能在第二次修正了错误）。
 */
export function extractFileBlocks(cleanedOutput: string): ParsedFileBlock[] {
  const blockMap = new Map<string, string>();

  let match: RegExpExecArray | null;
  // 每次调用需要 reset lastIndex（RegExp 带 g flag 有状态）
  FILE_BLOCK_RE.lastIndex = 0;

  while ((match = FILE_BLOCK_RE.exec(cleanedOutput)) !== null) {
    const path = match[1].trim();
    const content = match[2];
    // 重复路径？覆盖前一个（取最后一个）
    blockMap.set(path, content);
  }

  const blocks: ParsedFileBlock[] = [];
  for (const [path, content] of blockMap) {
    blocks.push({ path, content });
  }

  return blocks;
}

// ============================================================================
// 验证提取出的块与期望文件列表的一致性
// ============================================================================
/**
 * 对比提取出的块和用户期望的文件路径列表。
 *
 * 规则：
 *   1. 块的路径不在期望列表中 → 跳过 + 警告（绝不写用户没指定的文件）
 *   2. 期望的文件没有对应块 → 警告"该文件未被修改"
 *   3. 路径比较时做 normalize（去首尾空格，去 ./ 前缀）
 */
export function validateFileBlocks(
  blocks: ParsedFileBlock[],
  expectedPaths: string[],
): ValidationResult {
  const warnings: string[] = [];
  const valid: ParsedFileBlock[] = [];

  // 标准化路径：去掉 ./ 前缀和首尾空格
  const normalizePath = (p: string): string => p.trim().replace(/^\.\//, "");

  const expectedNormalized = new Set(expectedPaths.map(normalizePath));
  const foundPaths = new Set<string>();

  for (const block of blocks) {
    const normalizedBlockPath = normalizePath(block.path);

    // 在期望列表中找匹配（可能模型输出的路径格式略有不同）
    let matchedExpected: string | null = null;
    for (const exp of expectedNormalized) {
      if (normalizedBlockPath === exp || normalizedBlockPath.endsWith(exp) || exp.endsWith(normalizedBlockPath)) {
        matchedExpected = exp;
        break;
      }
    }

    if (matchedExpected !== null) {
      // 用原始期望路径（不是模型输出的路径），确保写入正确位置
      const originalPath = expectedPaths.find(
        (p) => normalizePath(p) === matchedExpected,
      );
      valid.push({
        path: originalPath ?? block.path,
        content: block.content,
      });
      foundPaths.add(matchedExpected);
    } else {
      warnings.push(
        `⚠️ 模型输出了未预期的文件 "${block.path}"，已跳过（不会写入）`,
      );
    }
  }

  // 检查哪些期望文件没有出现在输出中
  for (const exp of expectedNormalized) {
    if (!foundPaths.has(exp)) {
      warnings.push(`⚠️ 模型未输出文件 "${exp}" 的修改，该文件保持不变`);
    }
  }

  return { valid, warnings };
}

// ============================================================================
// 降级策略：XML 解析失败时，尝试单文件模式
// ============================================================================
/**
 * 当 extractFileBlocks 返回空数组但 cleanedOutput 有实质内容时调用。
 * 把整个输出当作第一个期望文件的内容，实现向后兼容。
 *
 * @param cleanedOutput 清洗后的模型输出
 * @param firstExpectedPath 第一个期望文件的路径
 * @returns 降级后的单文件块，如果输出确实为空则返回 null
 */
export function fallbackSingleFile(
  cleanedOutput: string,
  firstExpectedPath: string,
): ParsedFileBlock | null {
  const trimmed = cleanedOutput.trim();

  // 最低阈值：至少 10 个字符才认为有实质内容
  if (trimmed.length < 10) {
    return null;
  }

  return {
    path: firstExpectedPath,
    content: trimmed,
  };
}
