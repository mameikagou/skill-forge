/**
 * @skill-forge/shared — 共享工具包统一导出
 *
 * 原则：只放真正被 2+ 个 skill 复用的纯工具函数和类型。
 * 业务逻辑（cleaner、xml-parser 等）留在各自 skill 内部。
 */

export { log, fatal } from "./logger";
export type { SkillManifest } from "./types";
