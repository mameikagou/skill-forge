# skill-forge

Claude Code 技能工坊 — 让 Claude 自身变得更强的工具集。

## 技能列表

| 技能 | 状态 | 描述 |
|------|------|------|
| [opencode-coder]() | ✅ 可用 | 把代码生成委派给便宜模型（MiniMax、Codex），节省 95% 成本 |
| [write-skill](../write-skill) | 📦 占位 | 教 Claude 写出符合 Anthropic 规范的 skill |
| [skill-auto-installer](../skill-auto-installer) | 📦 占位 | 将任意 skill 打包为一键安装格式 |
| [code-graph](../code-graph) | 📦 占位 | 构建本地 LSP 代码图谱，高效阅读大型代码库 |

## 开始使用

```bash
# 安装依赖（链接 workspace）
bun install

# 运行全部测试
bun test

# 运行单个 skill 的测试
cd skills/opencode-coder && bun test
```

## 目录结构

```
skill-forge/
├── package.json              # Bun workspace 根配置
├── packages/
│   └── shared/               # 共享工具库 (@skill-forge/shared)
└── skills/
    ├── opencode-coder/       # 成本套利：Opus 思考，便宜模型干活
    ├── write-skill/          # 元技能：教 Claude 正确写 skill
    ├── skill-auto-installer/ # 把 skill 打包成可分发格式
    └── code-graph/           # 基于 LSP 的代码图谱
```

## 许可证

MIT
