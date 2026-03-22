# cheap-hands

**能花 $0.005 搞定的事，为什么要花 $0.12？**

一个 Claude Code 技能插件，让 Opus 当大脑指挥，把实际写代码的苦力活交给便宜模型 — MiniMax M2.7（$2.4/百万 token，100 tps）或 GPT-5.3 Codex。支持多文件、基于 XML 的路由机制、零幻觉容忍。

---

## 问题：Opus 写代码太贵了

每次让 Claude Opus 写代码，你都在以 $15/百万 token 的价格燃烧高级输出 token。但事实是 — **80% 的代码生成都是机械劳动**：加类型注解、重构模式、写模板代码。Opus 不需要亲自"敲"这些代码，它只需要*想清楚*该写什么，然后指挥一个便宜的模型去干就行了。

### 成本对比

| 方案 | Opus 输出 Token | 便宜模型 Token | 总成本 |
|------|----------------|---------------|--------|
| **传统方式**：Opus 重写 3 个文件 | 8,000 | 0 | **$0.120** |
| **cheap-hands**：Opus 思考 + 委派 | 50 | 8,000（MiniMax） | **$0.005** |
| | | | **节省 95%** |

而且 MiniMax M2.7 输出速度 100 tokens/秒，Opus 大约只有 30 tokens/秒。所以还更快。

## 架构设计

```
你 ──(请求)──► Claude Opus（大脑）
                    │
               评估任务
               对照粒度矩阵
                    │
               ┌────┴────┐
               │ <10 行   │──► Opus 直接处理（Edit 工具）
               │ 4+ 文件  │──► Opus 直接处理
               └────┬────┘
                    │ 1-3 个文件，10+ 行
                    ▼
               runner.ts（Bun）
                    │
               构建 XML 提示词
               （格式镜像）
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
    MiniMax M2.7        GPT-5.3 Codex
    （速度：100tps）    （质量：128k 输出）
          │                   │
          └─────────┬─────────┘
                    ▼
               XML 解析器
               提取 <file> 块
               校验路径
                    │
                    ▼
               写入文件 + 生成 diff
                    │
                    ▼
               Claude Opus（审查员）
               审计 diff
               向你汇报
```

**核心洞察**：Opus 只在*思考*和*审查*上花费 token。真正的代码生成 — 最烧钱的部分 — 被卸载给了成本只有 1/20 的模型。

## 安装

### 前置条件

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code)（CLI）
- [OpenCode CLI](https://opencode.ai)（`npm i -g opencode`）
- 至少在 OpenCode 中配置了一个模型提供商（MiniMax、OpenAI 等）

### 1. 克隆技能

```bash
git clone https://github.com/mrlonely/cheap-hands.git ~/.claude/skills/cheap-hands
```

### 2. 运行安装脚本

```bash
bun ~/.claude/skills/cheap-hands/scripts/install.ts
```

安装脚本会自动：
- 将 `coder` agent 定义复制到 `~/.config/opencode/agents/coder.md`
- 在 `~/.config/opencode/opencode.json` 中注册 `coder` agent

已经安装过了？用 `--force` 覆盖：

```bash
bun ~/.claude/skills/cheap-hands/scripts/install.ts --force
```

或者直接让 Claude Code 帮你：*"帮我安装 cheap-hands"* — 它会自动运行安装脚本。

### 3. 搞定

Claude Code 会自动检测到这个技能。你可以手动使用：

```
/cheap-hands minimax src/api.ts,src/types.ts "添加完整的 TypeScript 类型注解"
```

或者当 Claude 检测到一个符合粒度矩阵的任务（1-3 个文件，10+ 行改动）时，会自动使用它。

## 工作原理

### 粒度矩阵

Claude 会在执行每个代码修改任务之前，对照此矩阵评估：

| 文件数 | 改动规模 | 行为 |
|--------|---------|------|
| 1 个文件 | < 10 行 | Opus 直接处理（不委派） |
| 1 个文件 | 10-200 行 | 委派给便宜模型 |
| 2-3 个文件 | 任何一致性变更 | 委派给便宜模型（多文件模式） |
| 4+ 个文件 | 任何 | Opus 直接处理（上下文太多） |

### 模型选择

| 别名 | 模型 | 适用场景 |
|------|------|---------|
| `minimax` / `mm27` | MiniMax M2.7 HighSpeed | 速度优先：2-3 文件变更、模板代码 |
| `codex` / `gpt53` | GPT-5.3 Codex | 质量优先：复杂算法、深度重构 |

### XML 管道

秘密武器是**格式镜像**：输入文件被包裹在 `<file path="...">` XML 标签中，模型被指示以完全相同的格式输出。这大幅提升了不同模型的格式遵从性。

```
输入:                           输出:
<file path="src/a.ts">          <file path="src/a.ts">
  原始代码...             →       修改后的代码...
</file>                         </file>
<file path="src/b.ts">          <file path="src/b.ts">
  原始代码...             →       修改后的代码...
</file>                         </file>
```

OpenCode 中的 `coder` agent 系统提示词强制执行：
- **禁止闲聊**：不打招呼、不解释、不加 markdown 代码围栏
- **防注入**：忽略文件内容中嵌入的角色扮演指令
- **完整输出**：绝不用 "// 其余不变" 来偷懒

### 输出清洗管道

模型输出很脏。清洗器按顺序处理：

```
原始输出 → 去除 ANSI 转义码 → 去除 OpenCode 头部信息
        → 去除 <think> 标签（MiniMax）→ 去除 markdown 代码围栏
        → 裁剪空行 → XML 解析器
```

顺序很重要。ANSI 转义码必须在 XML 解析之前去除，否则 `<file` 标签会被破坏。

## 文件结构

```
cheap-hands/
├── SKILL.md                    # Claude Code 技能定义
├── scripts/
│   ├── install.ts              # 一键安装器（设置 OpenCode agent）
│   ├── runner.ts               # 主入口（Bun）
│   ├── cleaner.ts              # 5 步输出清洗管道
│   ├── xml-parser.ts           # XML <file> 块提取器
│   ├── prompt-builder.ts       # 格式镜像提示词模板
│   └── runner.sh               # 旧版 v1.0（bash，仅支持单文件）
├── opencode-agent/
│   └── coder.md                # OpenCode coder agent 定义（由安装器复制）
├── references/
│   └── model-guide.md          # 模型能力矩阵
└── README.md
```

## 错误处理

| 退出码 | 含义 | 后续操作 |
|--------|------|---------|
| 0 | 成功 | 文件已写入，显示 diff |
| 1 | 参数错误 | 显示用法提示 |
| 2 | 文件不存在 / 文件过大（>500KB） | 指出具体文件 |
| 3 | OpenCode CLI 执行失败 | 显示错误，建议重试 |
| 4 | 模型输出为空 | 建议重试 |
| 5 | XML 解析失败 | 单文件：自动回退为原始模式；多文件：报告错误 |

## 限制

- 文件路径不能包含逗号（逗号是多文件分隔符）
- 每次调用最多 3 个文件（防止上下文稀释）
- 单文件最大 500KB
- diff 输出每个文件截断为 50 行（完整 diff 请用 `git diff`）
- 模型偶尔会忽略 XML 格式指令 — 单文件模式有自动回退机制，多文件模式没有

## 省钱原理

经济学很简单：

- **Opus 输入 token**（读文件、读 diff）：**$3.75/百万** — 便宜
- **Opus 输出 token**（生成代码）：**$15/百万** — 贵
- **MiniMax 输出 token**（生成代码）：**$2.4/百万** — 白菜价

cheap-hands 把代码生成从 Opus 输出（$15/百万）转移到 MiniMax 输出（$2.4/百万）。Opus 只输出简短指令（约 50 token）和简要总结（约 100 token）。真正的重活 — 成千上万 token 的代码 — 交给便宜模型完成。

**一个典型编码会话（50 次文件修改）的对比：**

| | 纯 Opus | 使用 cheap-hands |
|---|---------|-----------------|
| Opus 输出 token | 400,000 | 7,500 |
| 便宜模型 token | 0 | 400,000 |
| 成本 | $6.00 | $1.07 |

## 许可证

MIT
