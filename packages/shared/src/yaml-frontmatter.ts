/**
 * yaml-frontmatter.ts — 从 SKILL.md 提取 YAML frontmatter
 *
 * 为什么不用第三方库（gray-matter 等）：
 *   1. SKILL.md 的 frontmatter 结构非常简单，key: value 平铺 + 一层 metadata
 *   2. 零依赖 = 零供应链风险，对分发基建来说很重要
 *   3. Bun 原生就能跑，不需要额外 install
 *
 * 只做两件事：
 *   1. 提取 --- 之间的原始 YAML 文本
 *   2. 解析为 SkillManifest 对象（宽松模式：缺字段给默认值，不炸）
 */

import type { SkillManifest } from "./types";

/** 从 Markdown 文件内容中提取 --- 之间的 frontmatter 原始文本 */
export function extractRawFrontmatter(content: string): string | null {
  // frontmatter 必须以文件开头的 --- 开始
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match ? match[1] : null;
}

/**
 * 简易 YAML 解析器 —— 只支持 SKILL.md 用到的子集：
 *   - 顶层 key: value（字符串、布尔、数组）
 *   - 一层嵌套对象（metadata:）
 *   - 数组用 JSON 内联格式 ["a", "b"]
 *
 * 不支持多行字符串、锚点、复杂嵌套 —— 那些不该出现在 SKILL.md 里。
 */
function parseSimpleYaml(raw: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = raw.split("\n");

  let currentObject: Record<string, unknown> | null = null;
  let currentKey: string | null = null;

  for (const line of lines) {
    // 跳过空行和纯注释
    if (line.trim() === "" || line.trim().startsWith("#")) continue;

    // 检测缩进：有缩进 = 嵌套在 currentObject 下
    const indent = line.match(/^(\s*)/)?.[1].length ?? 0;

    if (indent >= 2 && currentObject !== null && currentKey !== null) {
      // 嵌套的 key: value
      const nested = line.trim().match(/^([^:]+):\s*(.*)/);
      if (nested) {
        currentObject[nested[1].trim()] = parseValue(nested[2].trim());
      }
      continue;
    }

    // 顶层 key: value
    const topMatch = line.match(/^([^:]+):\s*(.*)/);
    if (!topMatch) continue;

    const key = topMatch[1].trim();
    const rawValue = topMatch[2].trim();

    // 如果 value 为空 → 下一个缩进块是嵌套对象
    if (rawValue === "") {
      currentKey = key;
      currentObject = {};
      result[key] = currentObject;
    } else {
      currentKey = null;
      currentObject = null;
      result[key] = parseValue(rawValue);
    }
  }

  return result;
}

/** 解析单个 YAML value：布尔、JSON 数组、或字符串 */
function parseValue(raw: string): unknown {
  if (raw === "true") return true;
  if (raw === "false") return false;

  // JSON 内联数组：["Read", "Grep", ...]
  if (raw.startsWith("[")) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  // 去掉首尾引号
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1);
  }

  return raw;
}

/**
 * 从 SKILL.md 文件内容解析出 SkillManifest。
 *
 * 宽松模式：缺失字段给合理默认值，只有 name 是必须的。
 * 返回 null 表示完全无法解析（没有 frontmatter 或没有 name）。
 */
export function parseSkillManifest(fileContent: string): SkillManifest | null {
  const raw = extractRawFrontmatter(fileContent);
  if (!raw) return null;

  const data = parseSimpleYaml(raw);
  if (!data.name || typeof data.name !== "string") return null;

  const meta = (data.metadata ?? {}) as Record<string, string>;

  return {
    name: data.name as string,
    description: (data.description as string) ?? "",
    argumentHint: data["argument-hint"] as string | undefined,
    disableModelInvocation: (data["disable-model-invocation"] as boolean) ?? true,
    allowedTools: (data["allowed-tools"] as readonly string[]) ?? [],
    context: (data.context as "fork" | "inline") ?? "fork",
    metadata: {
      version: meta.version ?? "0.1.0",
      author: meta.author ?? "unknown",
      category: meta.category ?? "general",
    },
  };
}
