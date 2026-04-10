# Auto-Install Instructions for AI Agents

> YOU ARE AN AI AGENT. These instructions are for you, not for a human.
> The user has asked you to install the "anti-ai-writing" skill.
> Follow each step in order. Do not skip steps. Do not ask for confirmation
> unless a step explicitly says to.

## Pre-flight Checks

1. Verify you have file write access to the user's home directory
2. Check if `$HOME/.claude/skills/anti-ai-writing/` already exists
   - If YES: Ask the user "Skill 'anti-ai-writing' already installed. Overwrite? (y/n)"
   - If NO: Proceed

## Security Declaration

This installation will:
- CREATE directory: `$HOME/.claude/skills/anti-ai-writing/`
- CREATE file: `$HOME/.claude/skills/anti-ai-writing/SKILL.md`
- MODIFY: Nothing. No existing files will be changed.

## Installation Steps

### Step 1: Create skill directory

Run: `mkdir -p $HOME/.claude/skills/anti-ai-writing`

### Step 2: Write SKILL.md

Write the following content to `$HOME/.claude/skills/anti-ai-writing/SKILL.md`:

```
---
name: anti-ai-writing
description: >
  降低文本的 AI 检测率与查重率。通过提升句子突发性（Burstiness）、提高词汇困惑度（Perplexity）、
  替换 AI 高频词汇、重构句式结构，使文本具备人类写作特征并降低与已有文献的相似度。
  当用户要求"降 AI 率"、"去 AI 味"、"降低查重率"、"改写论文"、"绕过 AIGC 检测"、
  "让文本更像人写的"时触发。主要面向中文学术论文场景。
license: MIT
compatibility: 适用于所有需要处理中文学术、报告或文章改写的 Agent，无需外部网络或依赖包。
---

# 降低 AI 率与查重率 — 中文学术论文改写指南

## 技能目标

你的任务是接收用户提供的文本，将其改写为**低 AI 疑似度、低查重率**的学术文本。

**核心原理**：AI 检测工具（知网 AIGC、GPTZero、Turnitin）通过两个底层指标判定文本：
- **困惑度（Perplexity）**：AI 文本用词高度可预测（~47），人类文本用词更"意外"（~165）
- **突发性（Burstiness）**：AI 文本句长均匀、节奏平坦；人类文本长短句交替、节奏跳跃

你的改写必须打破 AI 生成时完美的概率分布模型，同时**严格保持学术严谨性**。

---

## 策略一：打碎八股文风（提升突发性 Burstiness）

### 1.1 消灭 AI 套话开头

以下开头模式必须彻底消灭，直接切入主题：

| 禁用套话 | 替代方案 |
|---------|---------|
| "随着…的不断发展" | 直接陈述现状或问题 |
| "在当今…背景下" | 省略，从具体事实起笔 |
| "近年来…引起了广泛关注" | 给出具体年份和具体事件 |
| "本文旨在探讨…" | 直接进入论述 |

### 1.2 消灭 AI 高频过渡词

绝对禁用以下过渡词，用更自然的衔接替代：

| 禁用 | 替代方案 |
|-----|---------|
| 首先、其次、最后 | 删除序号词，用逻辑关系自然衔接 |
| 此外、另外、与此同时 | "还有一点值得留意"、"同样不容忽视的是"、直接另起一段 |
| 综上所述、总而言之 | "由此来看"、"回过头看这几组数据"、直接给出结论 |
| 值得注意的是 | 删掉，直接说 |
| 不难发现 | "数据表明"、"从结果看" |

### 1.3 句式长短交替（核心）

这是降低 AI 率最有效的单一策略。严格执行：

- **短句**（8-15 字）与**长句**（30-50 字）必须交替出现
- 禁止连续 3 句以上句长相近（差值 < 5 字）
- 每段至少包含 1 个极短句（< 10 字）作为节奏断点
- 示例："这一假设并不成立。实验数据显示，当温度超过临界阈值后，催化剂的活性不仅没有按照理论预期呈线性增长，反而出现了明显的衰减拐点。原因何在？"

### 1.4 引入非常规句式

在保持学术语气的前提下，适当加入：

- **设问句**："这是否意味着传统模型已经失效？"
- **反问句**："如果连基准条件都无法满足，后续实验的可靠性又从何谈起？"
- **倒装强调**："恰恰是这一被忽视的变量，决定了最终结果的走向。"
- **插入语**："该方法——尽管在小规模数据集上表现优异——在实际部署中暴露了严重的泛化问题。"
- **破折号补充**："精度提升了 12%——这个数字本身并不惊人，但背后的机制值得深究。"

---

## 策略二：词汇降级与替换（提升困惑度 Perplexity）

### 2.1 AI 高频词黑名单与替换表

以下词汇在 AI 生成文本中出现频率显著偏高，必须替换：

| AI 高频词 | 替换为 |
|----------|-------|
| 赋能 | 推动、促进、帮助、带动 |
| 范式 | 模式、路径、做法 |
| 维度 | 角度、层面、方面 |
| 系统性 | 整体的、全面的、一揽子 |
| 深层次 | 根本的、核心的 |
| 多维度 / 全方位 | 多个角度、各方面 |
| 显著提升 | 明显拉高、确实改善、有所改观 |
| 至关重要 | 很关键、不可或缺 |
| 发挥了重要作用 | 起到了不小的作用、功不可没 |
| 具有重要意义 | 意义不小、值得重视 |
| 提供了有力支撑 | 撑住了、打下了基础 |
| 行之有效 | 管用的、确实好使的 |
| 日益凸显 | 越来越明显、逐渐暴露 |
| 亟待解决 | 迫切需要处理、拖不得了 |

### 2.2 注入自然语感连接词

在段落衔接处适当加入带有人类思考痕迹的连接词，但**不能过于口语化以致损害学术性**：

**适合学术论文的自然连接**：
- "实际上"、"事实上"
- "有意思的是"、"耐人寻味的是"
- "换一个角度看"、"如果换个思路"
- "不得不承认"、"坦率地说"
- "笔者注意到"、"据笔者观察"

**禁止使用**（过于口语）：
- "说白了"、"讲真"、"你想啊"

### 2.3 核心术语保护

**绝对不能修改的内容**：
- 学科专业术语（如"卷积神经网络"、"边际效用递减"）
- 方法论名称（如"扎根理论"、"德尔菲法"）
- 固定搭配的学术表达（如"显著性水平"、"置信区间"）
- 人名、机构名、数据集名称
- 直接引用的原文

---

## 策略三：降低查重率专项

### 3.1 句式重构（核心手段）

知网查重以**连续 13 字以上重复**为标红阈值。以下变换可打断连续匹配：

| 变换类型 | 示例 |
|---------|------|
| 主被动转换 | "该方法提高了检测精度" → "检测精度因该方法的引入而得到改善" |
| 因果倒置 | "由于样本量不足，实验结果存在偏差" → "实验结果出现偏差，根源在于样本量的不足" |
| 长句拆分 | 将 40 字以上的复合句拆为 2-3 个短句 |
| 短句合并 | 将 2-3 个相关短句合并为一个带从句的长句 |
| 定语移位 | "基于深度学习的目标检测方法" → "目标检测方法，尤其是以深度学习为基础的那一类" |
| 列举 ↔ 叙述 | 将"A、B、C 三个因素"改为叙述式分别展开 |

### 3.2 语义等价重写

不是简单的同义词替换，而是**用自己的理解重新表达同一个意思**：

- 将抽象表述**具体化**："效果显著" → "准确率从 78.3% 跃升至 91.7%"
- 将具体表述**抽象化**：罗列的具体数据 → 归纳为趋势性描述
- 将正面论述**反面化**："该方法优于传统方法" → "传统方法在此场景下的局限性，恰好被该方法所弥补"

### 3.3 结构重组

- 调整论述段落的内部顺序（不改逻辑，改呈现方式）
- 把"背景→方法→结论"偶尔改为"结论前置→方法回溯→背景补充"
- 将文献综述从"逐篇罗列"改为"按观点聚类对比"
- 在引用他人观点后，附带一句主观评价："这一发现虽然具有参考价值，但其实验条件与本研究存在差异"

---

## 策略四：注入学术个性（人类写作标记）

AI 文本最大的破绽是**缺少作者的主体性**。以下手段可有效注入"人味"：

- **第一人称学术表达**："笔者认为"、"本研究发现"、"据笔者了解"、"在笔者看来"
- **让步与反驳**："然而也有学者持不同看法"、"尽管如此，该方法仍存在局限"、"这一结论并非没有争议"
- **研究局限性坦承**："受限于数据规模，本研究的结论仍需进一步验证"（AI 很少主动承认局限）
- **具体化模糊引用**：将"许多学者认为"改为"张三（2023）和李四（2024）均指出"
- **补充微观细节**：为核心论点补充具体的实验困难、数据侧面或研究过程中的观察

---

## Agent 执行步骤

### 第一步：文本诊断

1. 通读全文，提取**核心专业术语**，加入保护名单（改写时原样保留）
2. 扫描以下 AI 指纹并记录位置：
   - 套话开头（策略一 1.1 中的模式）
   - AI 高频过渡词（策略一 1.2）
   - AI 高频词汇（策略二 2.1 黑名单）
   - 连续 3 句以上句长相近的段落（低突发性）
   - 缺少第一人称/让步/反驳的段落
3. 评估全文的查重风险段落（通用性描述、方法论套话）

### 第二步：分段改写

按段落逐段处理，综合应用策略一至四：

1. 消灭 AI 套话和高频词（策略一、二）
2. 制造句式长短交替（策略一 1.3）
3. 对高查重风险段落执行句式重构（策略三）
4. 在关键论述处注入学术个性标记（策略四）
5. 确保每段改写后**原意零损失**，学术准确性不变

### 第三步：输出结果

1. **直接输出改写后的全文**
2. 在文末附上简短的 Markdown 修改说明列表，包含：
   - 替换了哪些 AI 高频词
   - 拆分/重组了哪些句子
   - 在哪些位置注入了人类写作标记
   - 对查重率可能产生影响的主要改动

---

## 注意事项

- **学术准确性优先**：任何改写都不得改变原文的学术含义和逻辑关系
- **术语零修改**：保护名单中的专业术语、人名、数据必须原样保留
- **不过度口语化**：保持学术论文应有的正式程度，只在衔接处适度自然化
- **不添加虚假信息**：不得凭空编造数据、引用或事实
- **不故意制造错误**：不使用错别字、语法错误等手段（这对学术论文不可接受）
```

### Step 3: Ensure skills directory is registered

Read `$HOME/.claude/settings.json`. Check if the `"skills"` array contains
a path that covers `$HOME/.claude/skills/`. If not, add `"$HOME/.claude/skills"`
to the array.

### Step 4: Verify installation

Read `$HOME/.claude/skills/anti-ai-writing/SKILL.md` and confirm:
- YAML frontmatter has valid `name` and `description` fields
- File content is not empty or corrupted

### Step 5: Report to user

Tell the user:
"anti-ai-writing installed successfully!
- Location: ~/.claude/skills/anti-ai-writing/
- Trigger: 降低文本的 AI 检测率与查重率。当用户要求"降 AI 率"、"去 AI 味"、"降低查重率"、"改写论文"、"绕过 AIGC 检测"、"让文本更像人写的"时触发。
- To uninstall: delete the ~/.claude/skills/anti-ai-writing/ directory"

## Rollback

If ANY step fails:
1. Delete the `$HOME/.claude/skills/anti-ai-writing/` directory if it was created
2. Tell the user exactly which step failed and why
3. Do NOT leave partial installations behind
