# Codex 工作规则（用户 2026-10-16 定）

下面每一条都来自这台机器上 Codex 实际犯过的错。读的时候先理解意图，再照着做。拿不准的地方，按"让代码更少、更好读、别人接手能看懂"去理解。

## 一、写回复和文档

- 默认用中文。给用户写回复、汇报、结果文件或 markdown 文档之前，先加载 `plain-talk` skill，按它的规则写，写完做一遍它的自检。
- 第一句写结论和关键数字，比如赚了多少、回撤多少、离目标还差多少、改好了没有。过程和细节放在后面。
- 只写改好之后的样子，不留改错痕迹。反例：用户让做番茄炒蛋，你加了东坡肉；用户问有必要加吗，你去掉了；结果 PR 标题写成「番茄炒蛋（无东坡肉）」，注释里还解释为什么不加东坡肉。代码注释、函数名、文档、卡片文案、PR 描述里都不要出现"已删除 X""不再使用旧 Y""无哈希""不引用六配方"这类话。
- 没人要你比较，就不要写"不是……而是……""要……而不是……"。
- 一个问题给一个方案。不要习惯性地分成"稳妥版"和"激进版"，也不要写"第一版先做个简单的，观察以后再说"。大改动可以分步执行，每一步写清楚做什么、做完怎么验证，每一步做完都能用。
- 用户让你找 A，找到的 B、C、D 不符合要求，就不要列出来。
- 不用黑话：落地、钉死、对齐、闭环、抓手、打通、颗粒度、兜底。用普通人能看懂的词。词语写完整，不写单个字的缩写（写"崩溃"，不写"崩"）。
- 不评价工作量，不写"这是个大改动""工作量很大"。
- 用户的话以问号结尾，就是在问问题：直接回答，给事实、数据和原因。不要顺手改代码、建分支、跑任务，不要反问，结尾不要写"要不要我现在开始做"。
- 用户指出你错了，直接按正确的做，不复述为什么错。
- 要画图用 mermaid，不画 ASCII 图。

## 二、动手之前先读上下文

- 先读当前仓库的 `AGENTS.md`，再读要改的模块全文，以及调用它的地方。
- 写任何辅助功能之前，先在仓库里搜有没有现成的：交易日历、读数据湖、均线和排名、板块归属、远程执行、飞书发送、卡片格式、日期解析、数字格式化。用 `rg "def 关键词"`、`rg "import 库名"` 搜。找到了就 import 来用；现成的不完全合适，就改它、给它加参数，不另写一份。`_number` 这种小函数在 analyze2quant 里有 11 份、36 个文件各自调交易日历，就是没先搜造成的。
- 回复的第一段写清楚：搜了什么，复用了哪些函数，还要写新代码的话为什么。
- 改一个共用函数，先用 `rg "函数名("` 列出全部调用方，所有调用方一起改、一起测。反例：只改了 stocks 卡，静水卡和主升浪卡调的是同一个函数，结果漏改。
- 协调者点名的问题是一个例子。动手前先想：同一个函数、同一个模块里还有没有一样的写法，有就一起改。
- 用户给了网页链接，先把整页读完再动手。库的用法出错时，回去把文档重新读一遍，不靠猜。

## 三、代码结构

- 同一件事只放在一个地方。一类功能一个模块，一个功能一个函数，不同情况用参数区分。
- 不为一次实验、一个新版本新建 `.py` 文件，不写 `*_v1`、`*_v2`、`*_strict`、`*_extended`、`*_audit`、`*_review`、`*_quality`、`*_compare` 这种文件。新建 `.py` 文件之前，先在回复里说明为什么不能放进现有模块。
- 分层只能往下引用：`db`、`lake` 不引用 `providers`、`research`、`commands`；`providers` 不引用 `research`、`commands`。把 import 挪进函数里面绕开检查，也算违反。上层要用的常量和函数挪到下层去。
- 生产代码不 import 实验模块。要用实验模块里的函数，就把它挪进正式模块，两边都从正式模块 import。
- 新旧不并存。替换旧逻辑时，在同一个提交里删掉旧代码、兼容旧字段的包装层和没人调用的函数。失败实验的代码不合进 main，结论写进 Run/Evidence。你写的代码你负责清理。

## 四、代码写法

- 优先复用已有模块和成熟的第三方库。不从零写交易日历、重试框架、缓存框架。HTML、XML、JSON、CSV、YAML 用现成的库解析，不拿正则或字符串切分手写解析器。
- 需要的库直接在文件顶部 import，不用 `try: import ... except ImportError` 包着。
- 写人能读懂的 Python：
  - 不写嵌套三元表达式（`a if x else b if y else c`），改用 if/elif 或字典。
  - 推导式里最多一层 for 加一个 if。
  - 业务数据的变量名写全，不用 `f`、`p`、`r`、`c`、`x`。
  - 一个函数只做一件事，大致 50 行以内、参数不超过 6 个、嵌套不超过 3 层，超了就拆成几个有名字的小函数。不为了压行数把代码挤成一行。
- 注释用中文，术语保留英文。只写代码本身看不出来的原因，不复述代码在做什么。
- 不在代码里把 Python 源码拼成字符串，再通过 `ssh ... python -`、`python -c` 或 `subprocess` 的 `input=` 去执行。远程执行和发通知只走仓库里已有的那一个客户端函数。
- 出错怎么处理，分两种情况：
  - 算账、成交、回测、数据入湖、数据发布：出错就当场报错停下。不编价格，不把缺的值填成 0，不捕获异常后假装成功。
  - 每日出卡、盘前快报、盘中提醒：某个次要来源失败（一个新闻源超时、VIX 没取到、一只股票缺价），把这一项标成缺失，卡照常发，在「查看来源」里写明缺了什么。不能因为一个字段对不上整张卡不发。
- 不加没必要的校验。默认不用哈希和指纹，不写"和冻结值不一致就报错"。只有三处可以用哈希：数据湖对象完整性检查、核对外部原始文件、下单和推送的防重复键。
- 测试要真：不用 mock、假数据去绕过真实逻辑，不写只为了让测试变绿的特殊分支。

## 五、操作

- 改代码只用编辑工具，不用 sed、perl 或 Python 脚本批量改源码。
- 命令行里不塞多行的长 Python 或 Bash。需要脚本就写成文件，放在项目的临时目录（analyze2quant 是 `/srv/qrant-runs/tmp/` 下自己的目录），用完删掉。不往 `/tmp`、`/dev/shm` 写东西。
- 不用 git 丢弃改动：不用 `git reset --hard`、`git checkout -- <文件>`、`git restore`、`git clean`，不 force push，别人的改动尤其不能动。用户说"回滚"，指的是用编辑工具手动改回上一个状态。
- 用户可能在你改完之后又改了文件。每次修改前重新读文件，在用户改过的版本上接着改，用户删掉的内容不加回去。

## 六、测试、提交和交付

- 做完要自己运行、测试、修，直到功能真的能用，不写完就让用户去测。只跑和这次改动相关的测试。
- 要部署到 AWS（1 核、952MB 内存）的改动，合并前按 AWS 的内存上限真跑一次。
- 一个 issue 一个 PR。不要部署一次发现一个问题、连着合五个补丁 PR。
- 不替用户决定采用哪个策略，不替用户下实盘单，不改 goal 文档。
- 说完成，要有真实结果：服务跑通了、产出生成了、提交进了能访问的分支。日志里打出 done、有一个 commit，都不算完成。没确认的写"未确认"。
- 遇到小报错（版本不兼容、字段缺失、服务起不来）直接修好往前推，不停下来问，也不把已经在用的新版本退回旧版本。只有下单、删数据要先问用户。

## 七、这个项目里 GPT 常踩的坑

1. **把规则当成逐字条文。** 规则写"必须""一律"，就按最极端的字面意思做。例：规则写"买过的股票继续盯"，结果持仓被硬塞进静水前 3，规则的本意只是别从观察名单里删掉。先想这条规则防什么，按目的做。
2. **改数据不设"不能变坏"的检查。** 例：10-16 一次更新用嘉信原始行情（不带复权价）整行覆盖了 Yahoo 的完整行，10-15 有 1600 只股票的复权价变空，没有报警。改数据管道时，发布前和上一版比：某天关键字段的覆盖数掉了 10% 以上，就不发布。
3. **批量处理读完才存，缓存名字乱带东西。** 例：SEC 年报全部读完才保存，一中断就从头重读 1.6 万份；缓存名字里带了日期窗口和公司名单，名单一变又重读（F-0016）。处理一份存一份，中断后接着做；缓存名字只放数据版本和公式版本号。
4. **生产流程依赖缓存文件。** 例：清了 cache，第二天每日卡 7 小时出不来（F-0020）。生产流程里缓存不在就重算；清缓存、改缓存逻辑、改共用模块之后，当场跑一次每日服务（私聊预览）。
5. **报告写成文书。** 不堆 spec、run、evidence 编号、哈希、行数和免责声明。不为每个 Run 新写一份报告，同一件事只更新一份。
6. **一个方向反复抠细节。** 例：个股看跌因子跑了 8 轮，后面几轮只是换对照组、调权重，信号一直很弱。连续两轮没有实质进展，就停下来报告，换方向或问协调者。
7. **钻进无关的细节。** 动手前先问：这件事对找到翻倍股、拿得住有没有用？没用就不做或少做。例：为了核对身份字段翻遍全网存档。
8. **测试锁死实现细节。** 例：每日卡测试 2384 行，一字不差地比对文案，改一个字要改一串测试。测试检查行为和结果，不检查实现细节。
9. **自己写引擎能做的事。** 算账全走 Qlib（币圈走 VectorBT Pro / Nautilus），业务代码里不自己写净值、成交、持仓模拟。
10. **硬阈值误伤赢家。** 设计硬规则前，先想想正在大涨的股票会不会被挡在外面。例：市值占比超过 0.29% 就剔除，正好把强势股踢掉了。
11. **请 Gemini 审查只给窄问题。** 例：只问一个公式对不对、限 800 字，拿到回复后挑出处毛病，把建议降格成"待检验"，照原路线继续（YANJ-58）。要把完整目的、策略和上一轮的效果数字给过去；不采纳的写明理由，再发回去讨论一次。

## 八、本机资源（10-15 宿主机蓝屏 4 次，每次都是多个大任务同时跑）

本机是 Windows 上的 WSL，总内存 21G、10 核。
- 全面板 Qlib 回测或审计：全机同一时间只跑 1 个，用 `~/.local/bin/a2q-heavy <unit名> <命令>` 启动（内存上限 18G）。数据库 `full_panel_run_slot` 挡住了就等。
- 大下载（UW、Fool、Seeking Alpha、嘉信期权链等历史补数）：全机同一时间最多 2 个，每个 `--workers` 不超过 4。启动前看 `systemctl --user list-units 'a2q-*' 'analyze2quant-*' --state=running` 和 `free -g`，已有 2 个或可用内存不到 6G 就排队。
- pytest 并行（`-n`）不超过 4，不同时跑两套测试。
- 用 `systemd-run --user` 起长任务时加 `-p MemoryMax=`（下载 4G，其他按实际峰值留余量）。
- 机器重启后，用原命令加 `--resume-build` 接着跑，不从头开始。

## 九、其他

- DO NOT send optional commentary. Spend time on thinking; you do not need to use the commentary channel to report progress to me.
- 研究讨论找 Gemini 时，用 Gemini 3.8 Flash（agent `a33e3c28` 或 `eb009520`），不找 Gemini4Argon。
- 产品代码里不接千问或其他按量付费的模型 API。
- 不安装、更新、卸载或替换 Codex（包括 `npm install -g @openai/codex`），除非用户在当前对话里明确要求。
- 被要求追问方案时，每轮最多十个问题，互相独立的放在一起问。
- When the user explicitly asks to update, restart, replace, or recover Codex App or its bundled runtime, use the global `$codex-app-safe-update` skill and follow its backup, reconnection, verification, and rollback workflow.

## Incident history

On 2026-08-24 at approximately 18:35 CST, Codex App appeared to hang because its WSL backend was killed during a system-wide out-of-memory cascade. Multiple concurrent Qlib/Python backtest workers running from a tmux scope exhausted the WSL allocation of 24 GB RAM and all 16 GB of swap. The kernel OOM killer first terminated small infrastructure processes including `ssh-agent` and `dbus-daemon`, then killed a Codex backend process and the user `systemd` manager; WSL init subsequently timed out and the distribution entered repeated restarts until the WSL environment was fully recreated. The initiating cause was the concurrent backtest workload, not an intrinsic Codex App failure and not the SSH connection. BotMux was the possible launch path for the workload, but the BotMux daemon itself was not the primary memory consumer.
