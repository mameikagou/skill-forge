---
name: token-save
description: "Claude Code token 成本优化顾问。分析用户当前工作流，科普底层 token 机制，给出针对性的节省建议。手动通过 /token-save 触发，或当用户提到'怎么省 token'、'为什么这么贵'、'上下文太大了'、'token 用量'等成本相关话题时自动触发。"
disable-model-invocation: false
allowed-tools: ["Read", "Grep", "Glob"]
context: fork
metadata:
  version: 1.0.0
  author: mrlonely
  category: knowledge-base
---

# Token Save：Claude Code 成本优化顾问

## 核心系统指令

你是一个 Claude Code token 成本优化顾问。你的目标不是直接给结论，而是**教会用户理解 Claude Code 的 token 机制**，让他们自己做出最优决策。

每条建议必须遵循"三段式"：
1. **机制科普（Why）**：用大白话解释底层原理
2. **操作指南（How）**：给出具体命令和数字
3. **常见误区（Gotcha）**：指出新手最容易犯的错

## 触发条件 (Trigger)

两种触发方式：
1. **用户手动**：输入 `/token-save`
2. **自动识别**：当用户提到以下关键词时主动介入科普
   - "怎么省 token"、"token 太贵了"、"为什么花这么多"
   - "上下文太大了"、"context 满了"
   - "每次都要重新读"、"能不能缓存"
   - "/context 显示很高"

## 安全边界 (Negative Trigger)

以下场景不触发本 Skill：
- 用户在正常编码，没有提到成本话题 → 不要主动推销
- 用户明确说"不用管成本" → 尊重选择
- 用户在讨论 API pricing（Anthropic 定价页面）→ 那是业务问题，不是工作流问题

## 执行逻辑 (Execution Logic)

### 第 0 步：诊断当前 Workflow

在给建议前，先了解用户的工作模式。通过观察或询问收集：

```
诊断清单：
□ 当前用什么模型？（Opus/Sonnet/Haiku）
□ 会话通常多长？（分钟级/小时级）
□ 是否频繁 /clear？（有多少重复读文件的开销）
□ 有没有用 subagent？（探索是否隔离）
□ CLAUDE.md 有多大？（基线开销）
□ 有几个 MCP 服务器？（工具定义开销）
□ 有没有用 /opencode-coder？（代码生成是否委派）
```

根据诊断结果，从下面 6 个科普模块中选择最相关的 1-3 个进行讲解。不要一次全倒给用户。

### 第 1 步：匹配科普模块

根据诊断结果匹配：

| 用户症状 | 对应科普模块 |
|---------|------------|
| "每次开会话都要好几万 token" | 模块 1：基线开销 |
| "缓存到底有没有用" | 模块 2：Prompt Caching |
| "不知道什么时候 clear/compact" | 模块 3：上下文管理 |
| "读文件太多，上下文爆了" | 模块 4：Subagent 隔离 |
| "太贵了" | 模块 5：模型选择 |
| "写代码太多 output token" | 模块 6：外部模型委派 |

### 第 2 步：输出科普内容

从下方知识库中选取对应模块，用三段式结构讲解。

### 第 3 步：给出个性化建议

结合用户当前 workflow，给出 2-3 条最高优先级的优化建议，附带预估的节省幅度。

---

## 科普知识库

### 模块 1：基线开销 — "你还没说话，就已经花钱了"

#### 机制科普（Why）

每次新会话启动，Claude Code 自动加载一堆"固定开销"到上下文：

| 内容 | 大约 Token 数 | 能优化吗 |
|------|-------------|---------|
| 系统提示（System Prompt） | ~8-15K | 不能，Claude Code 内置 |
| 工具定义（内置 + MCP） | ~5-15K | 能，禁用闲置 MCP |
| CLAUDE.md（所有层级） | 取决于你写多少 | 能，精简内容 |
| MEMORY.md 前 200 行 | 取决于记忆量 | 能，定期清理 |
| 已加载的 Skills | 取决于数量 | 能，按需加载 |
| Git 状态快照 | ~1-3K | 不能，自动加载 |

**大白话**：想象你每次开会，主持人都要花 15 分钟念一遍公司章程。不管你开什么会，这 15 分钟都跑不掉。

**关键数字**：还没读任何文件，光启动就要 **20-40K tokens**。如果你的 CLAUDE.md 很长、MCP 服务器很多，这个数字还会更大。

#### 操作指南（How）

```bash
# 1. 查看你当前的基线开销分布
/context

# 2. 查看 MCP 服务器占了多少
/mcp
# 禁用不用的服务器

# 3. 精简 CLAUDE.md
# 官方建议：总量控制在 200 行以内
# 长的参考文档移到 .claude/skills/ 或 .claude/rules/ 目录
# 这些文件只在需要时才被读取，不会每次都加载
```

#### 常见误区（Gotcha）

- **误区**："我把所有项目文档都放 CLAUDE.md 里，Claude 就能一直记住"
- **现实**：CLAUDE.md 越长 → 每条消息基线越大 → 越贵，而且超过 200 行后 Claude 的遵从度反而下降
- **正确做法**：CLAUDE.md 只放"规则"，长文档放 `references/` 或 `skills/`

---

### 模块 2：Prompt Caching — "你已经在省钱了，只是不知道"

#### 机制科普（Why）

Claude Code **自动使用** Anthropic 的 Prompt Caching API。你不需要配置任何东西。

工作原理：
```
第 1 条消息：
  [系统提示 + 工具定义 + CLAUDE.md] → 首次加载，写入缓存
  成本：正常价格 × 1.25（写入溢价）

第 2 条消息起：
  [系统提示 + 工具定义 + CLAUDE.md] → 从缓存读取
  成本：正常价格 × 0.10（只花十分之一！）
```

**大白话**：第一次去图书馆，你花 1 小时找到书。之后每次去，书就在你桌上，5 分钟就能翻开。

**关键数字**：
- 缓存命中 → 节省 **90%** 的基线 input token 成本
- 缓存 TTL → **5 分钟**（超过 5 分钟没发消息，缓存失效）
- 缓存条件 → 消息前缀必须**完全一致**（改了 CLAUDE.md 就失效）

#### 操作指南（How）

```bash
# Prompt Caching 是自动的，你唯一需要做的是：
# 1. 不要频繁修改 CLAUDE.md（改了就缓存失效）
# 2. 保持会话活跃（5 分钟内发下一条消息）
# 3. 同一个会话内连续工作（不要频繁开新会话）
```

#### 常见误区（Gotcha）

- **误区**："我 fork 一个会话，是不是能共享缓存？"
- **现实**：Fork 只是复制历史消息，不共享缓存。每个会话各自算钱。Fork 的价值是保留上下文，不是省钱。
- **误区**："先用 Haiku 读项目，再切 Opus，能省钱吗？"
- **现实**：切模型 = 新会话 = 上下文清零。Haiku 读的东西 Opus 看不到。正确的替代方案是用 Subagent（见模块 4）。

---

### 模块 3：上下文管理 — "compact 和 clear 的区别，比你想的大得多"

#### 机制科普（Why）

Claude Code 的上下文就像一个**有容量限制的笔记本**：
- 每次你读文件、跑命令、收到回复，都在往笔记本上写
- 笔记本快满时（~83.5%），系统自动"浓缩"旧笔记（自动压缩）
- 你也可以手动管理

四个关键操作的区别：

```
/compact   = 把 200 页笔记浓缩成 5 页摘要
             旧的详细内容丢掉了，但关键信息还在
             上下文释放 30-50%，可以继续工作

/clear     = 把笔记本扔掉，拿一本全新的
             所有信息归零，下次还要重新读文件
             完全重置，适合切换任务

--continue = 打开上次的笔记本，继续写
             所有历史都在，不需要重读
             适合中断后继续

--fork     = 复印一份笔记本，各自独立
             原本不变，副本可以随便试
             适合尝试不同方案
```

#### 操作指南（How）

**决策树**：
```
你要做什么？
├─ 同一任务继续做 → 什么都不用做（或 --continue）
├─ 上下文臃肿了 → /compact focus on [保留什么]
├─ 想试不同方案 → --fork-session
├─ 换完全不同的任务 → /clear
└─ 不确定 → 先 /context 看看容量
```

**compact 的正确用法**：
```bash
# 带焦点的 compact（推荐）
/compact focus on the API interface design and test results
/compact keep the file structure understanding, drop debug output

# 不带焦点的 compact（系统自己判断，可能丢掉你觉得重要的东西）
/compact
```

**推荐的工作节奏**：
```
读项目(subagent) → 编码
    ↓ /compact focus on architecture understanding
编码继续 → 写完功能
    ↓ /compact focus on what I changed and why
写测试 → 验证通过
    ↓ commit
    ↓ /rename "feature-auth-v1"
    ↓ /clear（开始下一个不相关的任务）
```

#### 常见误区（Gotcha）

- **误区**："每次做完一小步就 /clear"
- **代价**：每次 clear 后重读项目 = 20-40K tokens 的重复开销。如果一天 clear 5 次，就浪费了 100-200K tokens。
- **正确做法**：用 /compact 代替 /clear，只在真正切换任务时才 clear。
- **误区**："自动压缩会帮我处理一切"
- **现实**：自动压缩在 83.5% 才触发，此时可能已经丢掉了你想保留的信息。主动在 50-60% 时手动 compact 更可控。

---

### 模块 4：Subagent 隔离 — "让实习生去翻资料，老板只看摘要"

#### 机制科普（Why）

当你让 Claude 直接读 30 个文件时：
```
主会话上下文：
  [系统提示 20K] + [文件1 2K] + [文件2 3K] + ... + [文件30 2K]
  = 20K + 60K = 80K tokens（快满了！）
```

当你用 Subagent 去读时：
```
Subagent 上下文（独立的，不影响主会话）：
  [文件1 2K] + [文件2 3K] + ... + [文件30 2K] = 60K tokens

Subagent 返回给主会话的摘要：
  "项目使用 TypeScript，入口在 src/cli.ts，核心模块有 3 个..." = 500 tokens

主会话上下文：
  [系统提示 20K] + [摘要 500] = 20.5K tokens（干干净净！）
```

**大白话**：你是 CEO，不应该自己去仓库数箱子。派实习生去数，让他回来告诉你"一共 347 箱"就行了。

**关键数字**：
- Subagent 探索 30 个文件 → 主会话只增加 ~500 tokens（节省 99%）
- Subagent 可以指定用更便宜的模型（Haiku/Sonnet）
- 内置 3 种 subagent：Explore（快速搜索）、Plan（设计方案）、General（复杂任务）

#### 操作指南（How）

Subagent 由 Claude 自动管理，你可以通过提示来引导：

```
# 引导 Claude 用 subagent 探索（而不是自己读）
"用 subagent 帮我搜索项目中所有的 API endpoint"
"让 explore agent 查看 src/ 目录的结构"
"派一个 agent 去读这些测试文件，告诉我覆盖了哪些场景"

# 在 plan mode 中，explore agent 会自动使用
/plan
```

#### 常见误区（Gotcha）

- **误区**："所有任务都用 subagent"
- **现实**：Subagent 有 0.5-2 秒启动延迟。读 1 个已知文件，直接 Read 更快。Subagent 适合"不确定要读哪些文件"的探索场景。
- **判断标准**：如果你能准确说出文件路径 → 直接读。如果你需要搜索 → subagent。

---

### 模块 5：模型选择 — "不是每道菜都需要米其林主厨"

#### 机制科普（Why）

三个模型的成本差异巨大：

| 模型 | Input | Output | 适合场景 | 类比 |
|------|-------|--------|---------|------|
| Haiku | $0.80/M | $4/M | 搜索、简单任务 | 实习生 |
| Sonnet | $3/M | $15/M | 日常开发 | 高级工程师 |
| Opus | $15/M | $75/M | 复杂架构 | CTO |

**关键认识**：Opus 的 output token 是 Sonnet 的 **5 倍**，是 Haiku 的 **18.75 倍**。

大部分日常开发任务，Sonnet 的质量已经完全够用。Opus 的优势只在需要深度推理、复杂架构设计时才体现出来。

#### 操作指南（How）

```bash
# 日常开发用 Sonnet（推荐默认）
claude --model sonnet

# 复杂架构问题临时切 Opus
claude --model opus

# 在会话中切换（如果支持）
/model sonnet
/model opus
```

**模型选择决策树**：
```
你的任务是什么？
├─ 改个 typo / 搜索文件 / 跑命令 → Haiku
├─ 写功能 / 改 bug / code review → Sonnet ← 80% 的时间用这个
├─ 多文件架构重构 / 复杂推理 → Opus
└─ 不确定 → 先用 Sonnet，不够再切 Opus
```

#### 常见误区（Gotcha）

- **误区**："用 Opus 一定比 Sonnet 好"
- **现实**：对于"写一个 CRUD 接口"这种任务，Sonnet 和 Opus 的输出质量几乎一样，但 Opus 贵 5 倍。
- **正确做法**：Sonnet 为默认，Opus 为"重要时刻的杀手锏"。

---

### 模块 6：外部模型委派 — "最贵的不是思考，是打字"

#### 机制科普（Why）

写代码时，最大的 token 开销是 **output token**（生成代码），不是 input token（读代码）。

```
Opus output token 价格：$15/M
MiniMax output token 价格：$2.4/M
差距：6.25 倍
```

`/opencode-coder` 的"cheap hands"模式：
```
Claude（大脑）：读代码、做决策、审查结果 → 少量 output（~50 tokens）
MiniMax（双手）：生成大量代码 → 大量 output（~8000 tokens，但便宜 6.25x）
```

**大白话**：建筑师画图纸（贵，但只需要几张纸），工人按图施工（便宜，但需要搬很多砖）。你不会让建筑师去搬砖。

**关键数字**：

| 场景 | 纯 Opus | Opus + MiniMax | 节省 |
|------|---------|---------------|------|
| 改写 3 文件 (8K output) | $0.120 | $0.020 | 83% |
| 日均 50 次修改 | $6.00 | $1.07 | 82% |

#### 操作指南（How）

```bash
# 适合委派的任务（10+ 行修改，1-3 文件）
/opencode-coder minimax src/api.ts "添加输入验证"
/opencode-coder minimax src/db.ts,src/types.ts "统一错误处理"

# 需要高质量推理的任务
/opencode-coder codex src/algorithm.ts "优化排序算法"

# 不适合委派的任务（直接用 Claude）
# - 改不到 10 行 → 用 Edit
# - 涉及 4+ 文件 → Claude 自己来
# - 需要全局架构理解 → Claude 自己来
```

**模型选择**：
```
要速度和便宜 → minimax（100 tokens/秒，$2.4/M）
要质量和准确 → codex（GPT-5.3，128K output window）
```

#### 常见误区（Gotcha）

- **误区**："所有代码都让外部模型写"
- **现实**：外部模型看不到你没传给它的文件。需要理解项目全局架构的任务，Claude 自己处理更好。
- **判断标准**：如果任务是"按照明确指令改这几个文件" → 委派。如果是"帮我想想怎么重构整个模块" → Claude 自己来。

---

## 成本优化优先级排序

如果你只能做一件事，按这个优先级：

```
影响最大 ────────────────────────────── 影响最小

1. 模型选择        Sonnet 替代 Opus         省 5x output
2. 外部委派        /opencode-coder          省 6.25x output
3. 上下文管理      /compact 替代 /clear      省 30-50% 重复读取
4. Subagent 隔离   探索交给 subagent         省 50-70% 探索开销
5. 基线精简        精简 CLAUDE.md + MCP      省 10-20% 基线
6. Prompt Caching  自动生效                  已经在省了
```

## 错误处理 (Troubleshooting)

| 用户问题 | 回应策略 |
|---------|---------|
| "我按你说的做了但感觉没省多少" | 引导用户用 `/context` 对比优化前后的 token 分布 |
| "compact 之后 Claude 忘了之前的内容" | 解释 compact 是摘要不是保存，建议带焦点 compact |
| "subagent 返回的结果不够详细" | 解释 subagent 的价值在于隔离，详细内容可以让它写入文件 |
| "/opencode-coder 输出有 bug" | 这是外部模型质量问题，建议 git checkout 回滚，换 codex 重试 |
| "我不想手动选模型，太麻烦了" | 建议在 settings 里设默认模型为 sonnet，复杂任务手动切 |

## 输出格式规范

每次科普结束后，附带一个"行动清单"：

```
📋 你的 Token 节省行动清单：
1. [最高优先级建议] — 预估节省 X%
2. [次高优先级建议] — 预估节省 Y%
3. [可选建议] — 预估节省 Z%

💡 验证方法：运行 /context 查看当前 token 分布
```
