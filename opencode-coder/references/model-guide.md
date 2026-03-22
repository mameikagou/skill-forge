# 模型能力参考 (v2.0)

## GPT-5.3 Codex (`codex` / `gpt53`)

- **Provider**: epoch
- **Model ID**: `epoch/gpt-5.3-codex`
- **定位**: "The most capable agentic coding model to date" — 重型推理
- **擅长**: 复杂算法实现、深层逻辑重构、类型推断、核心架构代码
- **输出窗口**: 128k tokens
- **特点**: 代码质量稳定，遵循指令能力强，适合"烧脑的重型体力活"
- **注意**: 输出通常干净（无 think 标签），偶尔会加 markdown 围栏

## MiniMax M2.7 HighSpeed (`minimax` / `mm27`)

- **Provider**: minimax
- **Model ID**: `minimax/MiniMax-M2.7-highspeed`
- **定位**: SWE-Bench Pro 56.22%（接近 Opus），100 tps 极速输出
- **擅长**: 跨文件联动中型开发、模板代码生成、快速修改
- **价格**: ~$2.4/M Output Tokens（极度便宜）
- **特点**: 极快的响应速度，中文理解能力强
- **注意**: 输出包含 `<think>...</think>` 思考标签，runner.ts 会自动清洗

## 适用场景矩阵

| 场景 | 推荐模型 | 原因 |
|------|---------|------|
| 添加类型注解 | codex | 类型推断准确 |
| 重构函数 | codex | 代码质量稳定 |
| 添加注释/文档 | minimax | 中文能力强，速度快 |
| 简单 bug 修复 | minimax | 速度快 |
| 复杂逻辑重写 | codex | 推理能力更强 |
| 2-3 文件联动开发 | minimax | 速度优先，性价比高 |
| 核心算法重构 | codex | 质量优先 |
| 大段模板代码 | minimax | 100 tps 极速 |

## 多文件能力评估

| 模型 | 1 文件 | 2 文件 | 3 文件 | 备注 |
|------|--------|--------|--------|------|
| codex | Excellent | Good | Acceptable | 128k 输出窗口够大，质量随文件数缓慢下降 |
| minimax | Excellent | Acceptable | 慎用 | 速度极快但上下文管理能力弱于 codex |

**建议**：3 文件场景优先用 codex（质量更稳），2 文件以内用 minimax（速度更快）。

## 不适用场景（应直接用 Claude）

- 4 个及以上文件的修改
- 需要理解项目全局架构的修改
- 涉及 API 设计决策
- 安全相关代码修改
- < 10 行的微小修改（用 Claude 的 Edit 工具）
