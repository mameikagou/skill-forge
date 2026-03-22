/**
 * prompt-builder.ts — 多文件 Prompt 模板构造器
 *
 * 核心设计：格式镜像（Format Mirroring）
 * 输入文件用和期望输出相同的 <file path="...">...</file> XML 格式包裹。
 * 模型看到输入的格式后，会自然地镜像输出同样格式，
 * 这比单纯在 Rules 里文字描述格式要求的遵从率高得多。
 *
 * 为什么 prompt 用英文？
 * 外部模型（Codex/MiniMax）对英文指令的遵从率更高，
 * 用户的业务指令（instruction）可以是中文，但框架指令用英文更稳。
 */

/** 单个文件的输入信息 */
export interface FileInput {
  /** 文件相对路径 */
  readonly path: string;
  /** 文件当前内容 */
  readonly content: string;
  /** 文件扩展名（用于提示模型语言上下文） */
  readonly ext: string;
}

/**
 * 构造发送给外部模型的完整 prompt。
 *
 * 单文件和多文件使用同一模板（单文件 = 一个 <file> 块），
 * 保证向后兼容，无需分支逻辑。
 *
 * @param files 目标文件列表（1-3 个）
 * @param instruction 用户的修改指令
 * @returns 构造好的 prompt 字符串
 */
export function buildPrompt(files: FileInput[], instruction: string): string {
  // ---- 文件内容区 ----
  // 每个文件用 <file> 标签包裹，和期望输出格式完全一致（格式镜像）
  const fileBlocks = files
    .map((f) => `<file path="${f.path}">\n${f.content}\n</file>`)
    .join("\n\n");

  // ---- 语言提示 ----
  // 收集所有涉及的语言，帮助模型理解上下文
  const languages = [...new Set(files.map((f) => f.ext))].join(", ");

  // v2.1: coder agent 的系统 prompt 已包含身份定义、格式规则、反注入指令。
  // prompt-builder 只需提供：文件内容（格式镜像）+ 用户指令 + 输出提示。
  // 这样既避免规则重复，又节省 ~300 input tokens/次。
  return `Languages: ${languages}

INPUT FILES:

${fileBlocks}

INSTRUCTION: ${instruction}

OUTPUT (${files.length} file${files.length > 1 ? "s" : ""}):`;
}
