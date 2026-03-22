# Agent Skills 开放标准规范

> 来源：https://agentskills.io/specification
> 该标准由 Anthropic 发起，已被 Claude Code、Cursor、Gemini CLI、OpenAI Codex、VS Code Copilot 等 30+ 工具采纳。

## 目录结构

一个 skill 是一个目录，最少包含一个 `SKILL.md` 文件：

```
skill-name/
├── SKILL.md          # 必须：元数据 + 指令
├── scripts/          # 可选：可执行脚本（Python/Bash/JS）
├── references/       # 可选：参考文档（按需加载）
├── assets/           # 可选：模板、图片、数据文件等静态资源
└── ...               # 允许任意其他目录
```

## SKILL.md 格式

文件必须包含 YAML frontmatter + Markdown 正文。

### Frontmatter 字段

| 字段 | 必须 | 约束 |
|------|------|------|
| `name` | **是** | 最大 64 字符。只允许小写字母、数字、连字符。不能以连字符开头或结尾，不能连续连字符。**必须与父目录名一致。** |
| `description` | **是** | 最大 1024 字符。非空。必须同时描述技能做什么 + 什么时候使用。 |
| `license` | 否 | 许可证名称或引用的许可证文件。 |
| `compatibility` | 否 | 最大 500 字符。说明环境依赖（目标产品、系统包、网络访问等）。 |
| `metadata` | 否 | 任意 key-value 映射，用于存储规范之外的自定义属性。 |
| `allowed-tools` | 否 | 空格分隔的预授权工具列表（实验性）。 |

### `name` 字段规则（致命级）

- 1-64 字符
- 只允许 Unicode 小写字母（a-z）、数字和连字符（-）
- 不能以连字符开头或结尾
- 不能包含连续连字符（--）
- **必须与父目录名完全一致**

合法示例：
```yaml
name: pdf-processing
name: data-analysis
name: code-review
```

非法示例：
```yaml
name: PDF-Processing    # 大写不允许
name: -pdf              # 不能以连字符开头
name: pdf--processing   # 不能连续连字符
```

### `description` 字段规则

- 1-1024 字符
- 必须同时描述：做什么 + 什么时候触发
- 应包含关键词帮助 agent 识别相关任务

好的示例：
```yaml
description: Extracts text and tables from PDF files, fills PDF forms, and merges multiple PDFs. Use when working with PDF documents or when the user mentions PDFs, forms, or document extraction.
```

差的示例：
```yaml
description: Helps with PDFs.
```

### Markdown 正文

frontmatter 之后的 Markdown 正文包含技能指令。无格式限制，写出能帮助 agent 完成任务的内容即可。

推荐包含：
- 分步指令
- 输入/输出示例
- 常见边界情况

## 可选目录详解

### `scripts/`

存放 agent 可执行的代码。脚本应当：
- 自包含，或清晰标注依赖
- 包含有用的错误信息
- 处理边界情况

支持语言取决于 agent 实现，常见有 Python、Bash、JavaScript。

### `references/`

存放 agent 按需读取的参考文档：
- `REFERENCE.md` — 详细技术参考
- `FORMS.md` — 表单模板或结构化数据格式
- 领域文件（`finance.md`、`legal.md` 等）

保持单个文件聚焦。agent 按需加载，文件越小消耗 context 越少。

### `assets/`

存放静态资源：
- 模板（文档模板、配置模板）
- 图片（图表、示例）
- 数据文件（查找表、schema）

## 渐进式披露（Progressive Disclosure）

技能应按效率优化 context 使用：

1. **元数据**（~100 tokens）：`name` + `description` 在启动时加载
2. **指令**（建议 < 5000 tokens）：完整 `SKILL.md` 正文在技能激活时加载
3. **资源**（按需）：`scripts/`、`references/`、`assets/` 中的文件仅在需要时加载

**SKILL.md 主体建议控制在 500 行以内。** 详细参考材料应拆分到独立文件。

## 文件引用规则

在技能中引用其他文件时使用相对路径：

```markdown
详见 [参考指南](references/REFERENCE.md)。

运行提取脚本：
scripts/extract.py
```

文件引用保持一层深度，避免深层嵌套引用链。
