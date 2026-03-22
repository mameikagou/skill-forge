---
name: opencode-coder
description: "通过 OpenCode CLI 的 coder agent 调用 MiniMax-M2.7 或 GPT-5.3-Codex 执行 1-3 个代码文件的批量修改/重写。当修改量超过 10 行或涉及 2-3 个文件联动时自动触发，也可通过 /opencode-coder 手动触发。Claude 负责读码、派发、审查，外部模型负责代码生成。"
argument-hint: "codex|minimax file1[,file2,file3] instruction"
disable-model-invocation: false
allowed-tools: ["Read", "Grep", "Glob", "Bash(bun ${CLAUDE_SKILL_DIR}/scripts/runner.ts *)"]
context: fork
metadata:
  version: 2.1.0
  author: mrlonely
  category: ai-bridge
---

# OpenCode Coder v2.1

## 触发条件 (Trigger)

两种触发方式：
1. **用户手动**：输入 `/opencode-coder codex|minimax files instruction`
2. **Claude 自主判断**：当任务符合粒度调度矩阵（修改量超过 10 行，或涉及 2-3 文件联动），Claude 可以主动通过 Bash 调用 `bun ${CLAUDE_SKILL_DIR}/scripts/runner.ts` 来委派给外部模型，无需等待用户显式触发。

## 安全边界 (Negative Trigger) — 最优先检查

在执行任何操作前，必须逐条检查以下拒绝条件：

1. **修改量过小**：评估修改量不足 10 行且只涉及 1 个文件 → 拒绝，告知用户"改动太小，直接用 Edit 完成"。
2. **文件过多**：目标文件超过 3 个 → 拒绝，告知用户"超出外部模型上下文能力，Claude 直接处理"。
3. **敏感文件**：目标包含 .env、credentials、secret 等 → 拒绝，告知原因。
4. **需要全局上下文**：修改涉及项目架构级理解（外部模型看不到其他文件） → 拒绝。

命中任一条件，立即停止并告知用户替代方案。

## 粒度调度矩阵

| 文件数 | 修改量 | 推荐方案 |
|--------|--------|---------|
| 1 file | 不足 10 lines | Claude Edit（拒绝此 Skill） |
| 1 file | 10-200 lines | /opencode-coder 单文件 |
| 2-3 files | 联动修改 | /opencode-coder 多文件 |
| 4+ files | 任意 | Claude 直接处理 |

### 模型选择依据

| 别名 | 模型 ID | 场景 |
|------|---------|------|
| codex / gpt53 | epoch/gpt-5.3-codex | 重型算法、深层重构、复杂类型推断 |
| minimax / mm27 | minimax/MiniMax-M2.7-highspeed | 2-3 文件联动、模板代码、速度优先 |

选 minimax：联动中型开发、大段模板、速度优先（100 tps）。
选 codex：核心算法、深层重构、质量优先（128k output）。

## 执行逻辑 (Execution Logic)

### 第 1 步：解析参数

提取三个参数：
- model：codex / gpt53 / minimax / mm27
- files：文件路径，多个用逗号隔开（不能有空格）
- instruction：修改指令

参数不完整时立即停止，提示用法：
```
/opencode-coder codex src/api.ts "优化重试逻辑"
/opencode-coder minimax src/db.ts,src/parser.ts "统一错误处理"
```

### 第 2 步：读取目标文件

用 Read 工具读取所有目标文件。文件不存在则停止。执行安全边界检查。

### 第 3 步：调用外部模型

调用 runner.ts，文件路径用逗号隔开：

```bash
bun ${CLAUDE_SKILL_DIR}/scripts/runner.ts model_alias file1,file2 "详细施工指令"
```

runner.ts 内部流程：
1. 读取文件 → 构造 XML prompt（格式镜像）
2. 通过 `opencode run --agent coder -m MODEL` 调用
3. 清洗输出 → XML 解析 → 验证路径
4. 备份 .bak → 覆盖 → 输出 per-file diff（每文件最多 50 行）

### 第 4 步：审查结果

审查 MULTI_DIFF_START 到 MULTI_DIFF_END 之间的 diff：
- 退出码非 0 → 如实告知用户错误，不自己修复
- diff 为空 → 告知"外部模型认为无需修改"
- diff 有内容 → 逐文件审查：是否符合指令、是否引入 bug、是否误删、多文件是否一致

### 第 5 步：向用户汇报

```
[模型名] 完成了对 [N 个文件] 的修改：
- [文件1]: [概括]
- [文件2]: [概括]
- git diff 查看完整变更，git checkout -- file 回滚。
```

审查发现问题时明确告知并建议回滚。

## 错误处理 (Troubleshooting)

| 错误 | 退出码 | 处理方式 |
|------|--------|---------|
| 参数不足/模型别名错误 | 1 | 提示正确用法 |
| 文件不存在/文件过大(500KB) | 2 | 告知具体文件名 |
| opencode 未安装或调用失败 | 3 | 展示错误，建议 `npm i -g opencode` 或重试 |
| 模型输出为空 | 4 | 建议重试 |
| XML 解析失败 | 5 | 单文件自动降级为裸内容模式；多文件告知用户 |
| diff 显示大量删除 | - | 警告用户，建议 `git checkout -- file` 回滚后人工审查 |

## 引用与资产

- 模型能力参考：`references/model-guide.md`
- 底层脚本：`scripts/runner.ts`（主入口）、`scripts/cleaner.ts`（清洗）、`scripts/xml-parser.ts`（解析）、`scripts/prompt-builder.ts`（prompt 构造）

## 限制说明

- 文件路径不能包含逗号（逗号是分隔符）
- 单文件大小上限 500KB
- 每文件 diff 最多 50 行，完整 diff 用 git diff 查看
