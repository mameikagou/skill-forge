# Claude Code 扩展字段

> 来源：https://code.claude.com/docs/en/skills
> Claude Code 在 Agent Skills 开放标准之上的扩展能力。

## 扩展 Frontmatter 字段

以下字段为 Claude Code 独有，不在 Agent Skills 标准中：

| 字段 | 必须 | 说明 |
|------|------|------|
| `argument-hint` | 否 | 自动补全时显示的参数提示。例：`[issue-number]`、`[filename] [format]` |
| `disable-model-invocation` | 否 | 设为 `true` 阻止 Claude 自动触发此技能，只允许用户手动 `/name` 调用。默认 `false` |
| `user-invocable` | 否 | 设为 `false` 从 `/` 菜单隐藏。用于 Claude 自动加载的背景知识。默认 `true` |
| `allowed-tools` | 否 | 技能激活时 Claude 可无需确认使用的工具列表（Claude Code 格式，支持通配符） |
| `model` | 否 | 技能激活时使用的模型 |
| `effort` | 否 | 推理努力级别：`low`、`medium`、`high`、`max`（仅 Opus） |
| `context` | 否 | 设为 `fork` 在隔离的子 agent 中运行 |
| `agent` | 否 | 当 `context: fork` 时使用的子 agent 类型（`Explore`、`Plan`、`general-purpose` 或自定义） |
| `hooks` | 否 | 技能生命周期内的 hooks 配置 |

## 调用控制矩阵

| Frontmatter 组合 | 用户可调用 | Claude 可调用 | 何时加载 |
|-------------------|-----------|--------------|---------|
| 默认 | 是 | 是 | description 始终在 context 中，完整内容在调用时加载 |
| `disable-model-invocation: true` | 是 | 否 | description 不在 context 中，用户手动调用时加载 |
| `user-invocable: false` | 否 | 是 | description 始终在 context 中，Claude 调用时加载 |

## 字符串替换变量

| 变量 | 说明 |
|------|------|
| `$ARGUMENTS` | 调用技能时传入的全部参数。若 SKILL.md 中未使用，参数以 `ARGUMENTS: <value>` 追加到末尾 |
| `$ARGUMENTS[N]` | 按 0-based 索引访问特定参数，如 `$ARGUMENTS[0]` |
| `$N` | `$ARGUMENTS[N]` 的简写，如 `$0`、`$1` |
| `${CLAUDE_SESSION_ID}` | 当前会话 ID |
| `${CLAUDE_SKILL_DIR}` | 技能 `SKILL.md` 所在目录的绝对路径。用于在 Bash 中引用技能捆绑的脚本 |

示例：
```yaml
---
name: fix-issue
description: Fix a GitHub issue
disable-model-invocation: true
---

Fix GitHub issue $ARGUMENTS following our coding standards.
```

位置参数示例：
```yaml
---
name: migrate-component
description: Migrate a component from one framework to another
---

Migrate the $0 component from $1 to $2.
```

## 动态上下文注入

`` !`<command>` `` 语法在技能内容发送给 Claude 前执行 shell 命令，输出替换占位符：

```yaml
---
name: pr-summary
description: Summarize changes in a pull request
context: fork
agent: Explore
---

## Pull request context
- PR diff: !`gh pr diff`
- Changed files: !`gh pr diff --name-only`
```

这是预处理，不是 Claude 执行。Claude 只看到最终渲染结果。

## 技能存放位置层级

优先级从高到低：

| 层级 | 路径 | 适用范围 |
|------|------|---------|
| Enterprise | 通过 managed settings 配置 | 组织所有用户 |
| Personal | `~/.claude/skills/<skill-name>/SKILL.md` | 用户所有项目 |
| Project | `.claude/skills/<skill-name>/SKILL.md` | 仅当前项目 |
| Plugin | `<plugin>/skills/<skill-name>/SKILL.md` | 插件启用处 |

同名技能按优先级覆盖：enterprise > personal > project。Plugin 技能使用 `plugin-name:skill-name` 命名空间，不冲突。

## 技能内容类型指引

**Reference content（参考型）**：添加知识，Claude 在当前对话中应用。适合规范、模式、风格指南。
```yaml
---
name: api-conventions
description: API design patterns for this codebase
---

When writing API endpoints:
- Use RESTful naming conventions
- Return consistent error formats
```

**Task content（任务型）**：分步指令，执行具体动作。通常搭配 `disable-model-invocation: true`。
```yaml
---
name: deploy
description: Deploy the application to production
context: fork
disable-model-invocation: true
---

Deploy the application:
1. Run the test suite
2. Build the application
3. Push to the deployment target
```

## 支持文件最佳实践

```
my-skill/
├── SKILL.md           # 主指令（必须）
├── template.md        # Claude 填充的模板
├── examples/
│   └── sample.md      # 示例输出
└── scripts/
    └── validate.sh    # Claude 可执行的脚本
```

在 SKILL.md 中引用支持文件，让 Claude 知道何时加载：
```markdown
## Additional resources
- For complete API details, see [reference.md](reference.md)
- For usage examples, see [examples.md](examples.md)
```
