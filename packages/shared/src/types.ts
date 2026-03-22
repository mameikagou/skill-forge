/**
 * types.ts — 跨 skill 共享的类型定义
 *
 * SkillManifest 对应 SKILL.md frontmatter 中的结构，
 * 主要供 skill-auto-installer 解析和打包时使用。
 */

/** SKILL.md frontmatter 解析后的结构 */
export interface SkillManifest {
  readonly name: string;
  readonly description: string;
  readonly argumentHint?: string;
  readonly disableModelInvocation: boolean;
  readonly allowedTools: readonly string[];
  readonly context: "fork" | "inline";
  readonly metadata: {
    readonly version: string;
    readonly author: string;
    readonly category: string;
  };
}
