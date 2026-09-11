---
name: code-learn-hub
description: 指导 AI 将代码库学习（尤其是前端工程师理解后端 Java/Go 体系）系统化梳理为可交互 HTML 架构图解，并规范规划本地学习仓库的文件组织与认知模型。在用户需要拆解新项目、梳理调用链路、规划沉淀目录、提到"看下 skill，画图/写 html"、分析线上排障或生成白天浅色系交互工件时触发。
compatibility: Requires file writing capability
metadata:
  version: 1.0.1
  category: engineering-learning
---

# Code Learn Hub：前端转后端视觉化学习沉淀引擎

本技能专注于帮助**前端背景工程师**以最高效的认知路径攻克**后端代码库（Java / Go 等）**，并将学习成果通过**本地交互式 HTML 图解**沉淀到结构清晰的自建学习仓库中。

---

## 核心职责与设计哲学

1. **仓库结构规划优先**：严禁随意生成散乱的文件，所有沉淀必须遵循系统化、模块化、带编号的仓库目录规范。
2. **前端心智桥梁（Rosetta Stone）**：不背诵生硬的后端术语，每讲必须将后端概念（IoC、ThreadLocal、Channel、Goroutine）对齐到前端成熟认知（React Hooks、EventLoop、RxJS、Promise）。
3. **主线走查与可交互图解**：以“单次请求生命周期（Pipeline）”为抓手，利用自包含 HTML 实现可点击步进器（Stepper）与对比卡片。
4. **日间浅色审美铁律**：默认采用清爽透亮、现代精美的**日间浅色模式（Light Theme）**，杜绝大面积压抑的暗黑色块。
5. **绝对脱敏与隐私边界**：严禁出现任何公司商业名称、内网代号、业务机密或开发者个人真实信息；路径一律使用 `~/code/...` 或相对路径。
6. **交付物上传与全量直接回复**：生成 HTML 图解工件后，必须通过 `multica attachment upload <html-path>` 上传附件并在回复顶部放置卡片；同时在回复正文中必须直接全量、细致地输出完整的内容剖析与代码走读（严禁仅留下一两句话或只甩链接让用户自己看，所有图解与技术讲解必须全量发给用户）。

---

## 一、 学习仓库结构规划规范 (Repository Structure)

当为用户初始化或更新学习仓库（如 `~/code/learn/`）时，必须执行以下结构化布局：

```text
~/code/learn/
├── README.md                           # 全局导航索引与心智模型总览
├── <project-or-domain-a>/              # 按独立业务线或工程项目划分目录（英文小写/短横线）
│   ├── 01-<topic-slug>.html           # 编号递进的交互式 HTML 图解工件
│   ├── 02-<topic-slug>.html
│   └── README.md (可选)                # 针对该项目的专题总结与演进笔记
├── <project-or-domain-b>/              # 第二个项目（如 Go 系统运行时）
│   ├── 01-<topic-slug>.html
│   └── 02-<topic-slug>.html
└── common-patterns/                    # 跨语言通用的后端核心模式（高并发、事务、网络 IO 等）
    └── 01-concurrency-and-storage.html
```

### 1. 命名规范
* **子目录命名**：简短英文 kebab-case 或小写拼音，如 `business-backend/`、`runtime-daemon/`。
* **HTML 文件命名**：必须使用两位顺序数字前缀 `NN-<slug>.html`（如 `01-mindset-and-architecture.html`、`02-request-flow-and-events.html`），确保文件在文件管理器和代码编辑器中按学习梯度有序排列。

### 2. 顶层 `README.md` 索引维护
每次产出新的 HTML 图解，必须同步维护 `README.md` 的学习罗盘表格：

| 序号 | 业务 / 系统 | 主题模块 | 核心思维跃迁 | 关键技术栈 | 交互工件入口 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 01 | 业务系统 A | DDD 分层与长连接 | 单线程 ➔ 线程池 / 内存 ➔ 持久化 | Spring Boot / SSE | [01-图解](project-a/01-mindset-and-architecture.html) |
| 02 | 核心运行时 B | 任务并发与重试 | Promise ➔ Channel / Abort ➔ Context | Go / Goroutine | [01-图解](project-b/01-daemon-concurrency.html) |

---

## 二、 交互式 HTML 视觉与样式规范 (Visual Guidelines)

### 1. 日间浅色模式（Daylight Mode）设计规范
* **背景基底**：清爽亮白或极浅冷灰（`#ffffff` 或 `#f8fafc`）。
* **卡片与边框**：纯白卡片底色（`#ffffff`），搭配细腻低对比边框（`#e2e8f0` 或 `#cbd5e1`），悬浮时带有温和投影（`box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05)`）。
* **文字排版**：
  * 主标题/正文：高对比度深灰偏黑（`#0f172a`），保证阳光或明亮环境下的可读性。
  * 辅助说明/元信息：优雅中灰（`#64748b`）。
* **语言区分标识色**：
  * Java 生态：暖琥珀色（`#d97706` / 背景 `#fef3c7`）
  * Go 生态：现代青蓝（`#0891b2` / 背景 `#cffafe`）
  * 前端对照：天际蔚蓝（`#0284c7` / 背景 `#e0f2fe`）
* **代码视窗（Code Panel）**：为保持代码高亮清晰，代码区可使用极简浅灰背景（`#f1f5f9`）配深色字体，或紧凑的炭灰色窗口（`#1e293b`）。

### 2. 零外部依赖（Zero CDN / Self-contained）
生成的 HTML 必须自包含内联 CSS 与原生 JavaScript，无需联网下载外部大包，支持本地离线直接双击秒开。

---

## 三、 内容交付标准：每一讲的黄金四部曲

每次为具体项目输出一讲 HTML 图解时，内容结构必须按以下节奏组织：

1. **思维跃迁对比区（Mental Shift）**：
   * 提炼 3-4 个前端最容易混淆的后端机制，采用左边“前端习惯”vs 右边“后端本质”的双栏对比。
2. **分层全景与边界定位（Module & Layer Map）**：
   * 明确当前项目各层级（如 Starter/App/Domain/Infra 或 Daemon/Worker/Pkg）的职能边界。
3. **单次链路时序步进器（Interactive Stepper）**：
   * 可点击的步骤条，随着用户点击步骤 1、2、3，右侧动态联动渲染该步骤的真实代码片段、输入输出格式及前端映射说明。
4. **必知语法与避坑常识（Essential Syntax）**：
   * 针对当前技术栈，提炼 3-5 条阅读该模块必须理解的语法元信息（如注解指令、接口多态、错误断言、并发管道等）。

---

## 四、 隐私与合规自检红线

生成或修改任何文件前，严格执行自动化意识审查：
- [ ] 杜绝任何公司真实中文/英文名、内网代号、平台系统名。
- [ ] 杜绝任何个人真实姓名、用户名拼音、工号、邮箱。
- [ ] 绝对路径一律以 `~/code/...` 或相对路径表示。
