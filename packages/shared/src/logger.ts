/**
 * logger.ts — 跨 skill 共享的日志工具
 *
 * 所有 skill 的 runner/installer 脚本都需要向 stderr 输出状态信息，
 * 向 stderr 写是因为 stdout 留给结构化数据（diff、JSON 等），
 * 不能让日志信息污染 Claude 的解析管道。
 */

/** 向 stderr 输出带前缀的状态信息 */
export function log(msg: string): void {
  process.stderr.write(`>>> ${msg}\n`);
}

/** 致命错误：输出到 stderr 并以指定退出码终止进程 */
export function fatal(msg: string, exitCode: number): never {
  process.stderr.write(`ERROR: ${msg}\n`);
  process.exit(exitCode);
}
