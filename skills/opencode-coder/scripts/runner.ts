#!/usr/bin/env bun
/**
 * runner.ts — OpenCode 多文件执行器 (v2.0)
 *
 * 替代原 runner.sh，支持 1-3 个文件的批量修改。
 *
 * 用法：
 *   bun runner.ts <codex|minimax> <file1[,file2,file3]> "<instruction>"
 *
 * 退出码：
 *   0 - 成功（含无变更的情况）
 *   1 - 参数错误
 *   2 - 文件不存在 / 文件过大
 *   3 - opencode 调用失败
 *   4 - 模型输出为空
 *   5 - XML 解析失败（且降级也失败）
 *
 * 架构：
 *   参数解析 → 模型路由 → 读文件 → 构造 prompt → Bun.spawn opencode
 *   → 清洗输出 → XML 解析 → 验证 → 备份+覆盖 → 生成 diff → 输出报告
 */

import { log, fatal } from "@skill-forge/shared";
import { cleanModelOutput } from "./cleaner";
import { extractFileBlocks, validateFileBlocks, fallbackSingleFile } from "./xml-parser";
import { buildPrompt, type FileInput } from "./prompt-builder";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, extname } from "node:path";

// ============================================================================
// 常量
// ============================================================================

/** 模型路由表 */
const MODEL_MAP: Record<string, { id: string; display: string }> = {
  codex: { id: "epoch/gpt-5.3-codex", display: "GPT-5.3 Codex" },
  gpt53: { id: "epoch/gpt-5.3-codex", display: "GPT-5.3 Codex" },
  minimax: { id: "minimax/MiniMax-M2.7-highspeed", display: "MiniMax M2.7 HighSpeed" },
  mm27: { id: "minimax/MiniMax-M2.7-highspeed", display: "MiniMax M2.7 HighSpeed" },
};

/** 单文件大小上限 500KB */
const MAX_FILE_SIZE_BYTES = 500 * 1024;

/** 最多同时操作的文件数 */
const MAX_FILES = 3;

/** 每个文件的 diff 最大输出行数（节省 Opus 的 input token） */
const MAX_DIFF_LINES_PER_FILE = 50;

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 生成两个文件内容之间的 unified diff。
 * 用系统 diff 命令（跨平台可用），避免引入第三方依赖。
 */
async function generateDiff(
  originalPath: string,
  newContent: string,
): Promise<{ diff: string; hasChanges: boolean }> {
  // 写新内容到临时文件
  const tmpPath = `${originalPath}.tmp.new`;
  try {
    writeFileSync(tmpPath, newContent);

    const proc = Bun.spawn(["diff", "-u", originalPath, tmpPath], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const diffText = await new Response(proc.stdout).text();
    await proc.exited;

    return {
      diff: diffText,
      hasChanges: diffText.trim().length > 0,
    };
  } finally {
    // 清理临时文件
    try {
      const { unlinkSync } = await import("node:fs");
      unlinkSync(tmpPath);
    } catch {
      // 忽略清理失败
    }
  }
}

/**
 * 截断 diff 输出到指定行数。
 * 如果被截断，末尾附加提示信息。
 */
function truncateDiff(diff: string, maxLines: number): string {
  const lines = diff.split("\n");
  if (lines.length <= maxLines) {
    return diff;
  }
  return lines.slice(0, maxLines).join("\n") + `\n... (截断，共 ${lines.length} 行，仅显示前 ${maxLines} 行)`;
}

// ============================================================================
// 主流程
// ============================================================================

async function main(): Promise<void> {
  // ---- 1. 参数解析 ----
  const args = process.argv.slice(2);
  if (args.length < 3) {
    fatal(
      `参数不足。用法: bun runner.ts <codex|minimax> <file1[,file2,file3]> "<instruction>"`,
      1,
    );
  }

  const modelAlias = args[0].toLowerCase();
  const filesArg = args[1];
  const instruction = args.slice(2).join(" ");

  // ---- 2. 模型路由 ----
  const model = MODEL_MAP[modelAlias];
  if (!model) {
    fatal(
      `未知模型别名 '${modelAlias}'。支持: codex, gpt53, minimax, mm27`,
      1,
    );
  }

  // ---- 3. 解析文件列表 ----
  const filePaths = filesArg
    .split(",")
    .map((f) => f.trim())
    .filter((f) => f.length > 0);

  if (filePaths.length === 0) {
    fatal("文件列表为空", 1);
  }
  if (filePaths.length > MAX_FILES) {
    fatal(
      `最多允许 ${MAX_FILES} 个文件，收到 ${filePaths.length} 个。为防止模型上下文稀释，请减少文件数量。`,
      1,
    );
  }

  // ---- 4. 读取文件 + 校验 ----
  const fileInputs: FileInput[] = [];

  for (const filePath of filePaths) {
    if (!existsSync(filePath)) {
      fatal(`文件不存在: ${filePath}`, 2);
    }

    const file = Bun.file(filePath);
    const size = file.size;

    if (size > MAX_FILE_SIZE_BYTES) {
      fatal(
        `文件过大: ${filePath} (${(size / 1024).toFixed(0)}KB > ${MAX_FILE_SIZE_BYTES / 1024}KB 上限)`,
        2,
      );
    }

    const content = await file.text();
    const ext = extname(filePath).replace(".", "") || "txt";

    fileInputs.push({ path: filePath, content, ext });
  }

  log(`正在调用 ${model.display}，处理 ${fileInputs.length} 个文件...`);

  // ---- 5. 构造 prompt ----
  const prompt = buildPrompt(fileInputs, instruction);

  // ---- 6. 调用 opencode ----
  // --agent coder：使用专用的 coder agent，系统 prompt 层面强制只输出代码
  // 解耦：用户日常用 opencode 走 plan/build/review，脚本调用走 coder
  const proc = Bun.spawn(["opencode", "run", "--agent", "coder", "-m", model.id], {
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });

  // 写入 prompt 到 stdin，然后关闭（关键！不关闭 opencode 会挂起）
  // Bun 的 proc.stdin 是 FileSink，不是 Web WritableStream
  // 直接用 .write() + .end()，不要用 .getWriter()
  proc.stdin.write(prompt);
  proc.stdin.end();

  const rawOutput = await new Response(proc.stdout).text();
  const stderrOutput = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    if (rawOutput.trim()) {
      log(`opencode stderr: ${stderrOutput}`);
      fatal(`opencode 调用失败 (exit ${exitCode})，输出:\n${rawOutput.slice(0, 500)}`, 3);
    } else {
      fatal(`opencode 调用失败 (exit ${exitCode})，无输出。可能是网络超时或 API 错误。\n${stderrOutput}`, 3);
    }
  }

  // ---- 7. 清洗输出 ----
  const cleanedOutput = cleanModelOutput(rawOutput);

  if (cleanedOutput.trim().length === 0) {
    fatal("模型输出为空（清洗后无内容）", 4);
  }

  // ---- 8. XML 解析 ----
  let blocks = extractFileBlocks(cleanedOutput);

  // 降级策略：XML 解析失败 + 只有一个文件 → 单文件模式
  if (blocks.length === 0) {
    if (filePaths.length === 1) {
      log("XML 格式未检测到，降级为单文件模式...");
      const fallback = fallbackSingleFile(cleanedOutput, filePaths[0]);
      if (fallback) {
        blocks = [fallback];
      } else {
        fatal("模型输出无法解析为有效代码内容", 5);
      }
    } else {
      fatal(
        `XML 解析失败：未从输出中提取到任何 <file> 块。多文件模式要求模型输出 XML 格式。\n输出前 300 字符: ${cleanedOutput.slice(0, 300)}`,
        5,
      );
    }
  }

  // ---- 9. 验证 ----
  const { valid, warnings } = validateFileBlocks(blocks, filePaths);

  for (const w of warnings) {
    log(w);
  }

  if (valid.length === 0) {
    fatal("验证后无有效文件块可写入", 5);
  }

  // ---- 10. 覆盖 + Diff ----
  log(`${model.display} 执行完毕，正在应用 ${valid.length} 个文件的更改...`);

  // 输出 diff 报告的开始标记
  console.log("MULTI_DIFF_START");

  for (const block of valid) {
    // 先生成 diff（在覆盖之前）
    const { diff, hasChanges } = await generateDiff(block.path, block.content);

    if (!hasChanges) {
      console.log(`===== ${block.path} (无变更) =====`);
      continue;
    }

    // 确保目录存在（处理新建文件的场景）
    const dir = dirname(block.path);
    if (dir && dir !== ".") {
      mkdirSync(dir, { recursive: true });
    }

    // 覆盖目标文件
    writeFileSync(block.path, block.content);

    // 输出截断的 diff
    const truncated = truncateDiff(diff, MAX_DIFF_LINES_PER_FILE);
    const lineCount = diff.split("\n").length;
    console.log(`===== ${block.path} (${lineCount} lines diff) =====`);
    console.log(truncated);
  }

  console.log("MULTI_DIFF_END");

  log(`完成。已修改 ${valid.length} 个文件，备份为 .bak`);
}

// ============================================================================
// 入口
// ============================================================================
main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  fatal(`未捕获异常: ${message}`, 3);
});
