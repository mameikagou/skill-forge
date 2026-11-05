---
name: a2q
description: 用本机 a2q 查询美股资格、排名、行情（含区间）、期权、财报、新闻、卡片、持仓与交易；a2q 查不到时怎么读数据湖，并在「缺口登记」记一笔留待开发。查数、分析候选、复盘交易时使用；不用于下单。
---

# a2q 只读查询

> 协调者 Claude；执行 Codex，2026-10-22。用户原话：“之前不是指定的 a2q 吗？”“这个东西的用户可能就是你，或者说是 Gemini。”
> 本次查询修复，协调者 Claude，2026-10-22。用户原话：“你自己的问题你直接让他改吧。。。。赶紧的”。

`a2q` 只读 daily-candidates 当前 release 的每日发布文件、数据湖、年度宽表和 PostgreSQL，不写状态，不联网。

## 查个股

先查成长资格。结果会明确写出是否通过、卡在哪条门槛，并列出排名实际使用的全部输入：

```bash
a2q ZS ATRC FIGS --qualification --json
```

`growth_qualification_passed` 只表示成长财务资格；`ranking_gate_passed` 还包括财报前禁买和市值档门槛。`qualification_gate_reasons` 是实际拦截原因。`financial_data_as_of` 是财报期末，`financial_known_at` 是系统当时可见的时间。

市值资格复用每日排名的跟踪状态：首次按本档范围，曾进前十的上限加倍，有真实买入记录的股票沿原买入档继续跟踪。`qualification_details` 列出实际市值上下限、`ever_top10` 和 `actual_held`。当日排名已保存的市值等展示字段沿用当时输入，其余因子来自已有宽表；跟踪状态缺失时，`ranking_gate_passed` 为空，状态明确写“未确认”。

`sleeve` 优先沿用当日已发布排名所属档；例如 ALGM 的市值已超过首次小盘范围，仍可按小盘跟踪规则进入小盘排名。人读资格只列通过情况、拦截原因和核心财务，完整打分因子在 `--json` 中查看。

再看当天排名和其余资料：

```bash
a2q ZS ATRC FIGS --rank --json
a2q --rank --json
a2q ZS ATRC FIGS --price --earnings --consensus --json
a2q ZS --insider --short --options --transcript --news --days 10 --json
```

`rank` 没有某只票，表示它不在当天小盘或中盘前 20，不影响其他块。批量分析时先用 `qualification` 和 `rank` 初筛，再查询留下的股票。不要在多轮对话中反复读取同一批数据。

`--rank` 省略代码时显示两档完整前 20。`entry_type`、`entry_label` 直接采用发布包的买点类型；没有发布包止损价时，`stop` 按前收的 92% 估算，`stop_basis` 写明口径。`drawdown252` 是相对最高收盘价的回撤小数，`intraday_high252_distance_pct` 是卡片采用的距一年盘中高点百分数。

期权比保留原数据单位：`rank.option_stock_ratio5` 为此前五日的 `100 × 合约数 / 正股股数`，表示按每合约 100 股折合后的股数倍数；`options.option_stock_volume_ratio` 为单日 `合约数 / 正股股数`，乘 100 后才是折合股数倍数。两者窗口也不同。

不写块名会返回全部个股块。一次可以查多只代码；`--days` 控制日线和期权的交易日数，范围 1–60。给 agent 使用 `--json`，给人浏览时省略它。

查一段历史用区间：`a2q SOXL --price --start 2020-01-01 --date 2020-03-20 --json`，`--options` 同理；给了 `--start` 就不受 60 天限制，`--price` 带复权开高低收、MA20/50/200。其他块不支持 `--start`，会直接报错。

## 查全局

全局查询不需要股票代码，可以合并使用：

```bash
a2q --cards --date 2026-10-20 --json
a2q --market-news --regime --date 2026-10-20 --json
a2q --portfolio --json
a2q --actions --slots 10 --date 2026-10-22 --json
```

- `cards`：当天已发量化卡和 Gemini 卡的原文。人读输出按标题、发送时间、来源和正文 Markdown 展开，`card_json` 仅在 JSON 输出中出现。
- `market-news`：当天盘前新闻的原始标题、股票代码、重要程度、时间和正文；传代码时只显示这些股票的新闻。
- `regime`：当天大盘 ETF、细分板块和静水状态，以及小盘、中盘的 `新仓许可`。小盘要求 IWO 收盘不低于 200 日线，中盘不限；收盘和均线只读回测使用的宽表，分别列出价格日期、数值和理由。大盘状态缺失仍可查看这两档许可。
- `portfolio`：按渠道、券商、代码和方向汇总全部已入账股票买卖的净数量，以及近 30 天流水；传代码时过滤。净持仓单列，数量为零表示已平仓，某笔数量缺失时保留未确认。每笔流水单独标出平仓状态，备注保持交易当时原文，当前持有情况看净数量。成交配对复用数据库已有 `journal_rounds`，不另算交易盈亏。
- `actions`：今晚按系统做什么。使用已发布排名，列出每档按名次补位的新买候选、资格和市场拦截原因，以及本地嘉信持仓逐只的持有、卖出或未确认结论。

`--actions` 的 `--slots` 可选 10（默认）或 2，每只目标权重为本档账户的 `1/N`。`starting_buy_ranks` 是起点账户前 N 名内当前允许新买的名次；完整候选表按名次供已有账户补空位使用，前 20 之外的名次不在查询范围内。退出沿用现行规则：初始底线为买价的 92%，曾涨 20% 后底线为成本与 50 日线的较大值；至少持有 20 个交易日、从未涨到 20% 且名次超线时触发僵尸退出。小盘 10/2 仓的僵尸线为 15/无，中盘为 15/3。

候选的 `initial_stop_reference` 按上一收盘仅作价格参考，实际初始底线按实际买价计算。持仓 `holding_floor` 是当前系统底线，`holding_exit_reasons` 列出退出原因。`actions` 与 `portfolio` 共用嘉信流水净数量，成本只取数量一致的本地账户快照；缺成本时未确认。买入来源不足时，仅能确认已触及初始底线的退出；其余去留标为未确认，持有期行情不完整时也标为未确认。`--actions --date` 只接受当前已发布的下单日，不提供历史账户重放。

`actions` 和 `portfolio` 的嘉信净持仓共用账户时效：`account_as_of` 表示快照内容确认到的时间，取最近一次没有持仓采集错误的 sync 与快照时间中较新的时间；`account_positions_changed_at` 是持仓最后变化的快照时间，`account_sync_at` 是最近同步时间。持仓未变时快照沿用原记录，成功同步仍会确认其内容。`account_status` 按确认时间判断是否已旧；最近一次同步含 `schwab_positions` 或 `schwab_cached_positions` 错误时标为“未确认”，同时保留此前确认时间。快照缺失也标为“未确认”。未同步的交易不在这些记录中。

## 数据时间

每行的 `data_as_of` 是该块数据截至日，`data_status` 会直接写出数据是否已旧。看到“数据已旧”或“无数据”时，保留这个限制，不把缺失解释成零，也不把旧数据写成当前事实。

排名、日线和期权按已收盘交易日检查，落后超过 1 个交易日就标为已旧；查询历史日线时相对指定日期检查。其余来源沿自然日门槛：Nasdaq 财报 7 天、长桥预期 3 天、内部人 7 天、FINRA 空头 35 天、电话会 180 天、SeekingAlpha 3 天。

支持 `--date` 的块为 `qualification`、`rank`、`price`、`cards`、`market-news`、`regime`、`event`、`similar`。排名读取指定当日发布的本地包或数据湖已发卡片保存的原始候选快照，来源见 `publication_source`；两处都缺失时明确没有数据。历史名单按当时实际保存的覆盖返回，日线截到指定日期。`earnings`、`consensus`、`insider`、`short`、`options`、`transcript`、`news`、`portfolio` 只支持当前查询，传 `--date` 会报错。历史日线来自当前已发布数据集，原入库时间仍看 `source_known_at`。

- `qualification`：已有年度宽表中的最近交易日；财务数据另看 `financial_data_as_of` 和 `financial_known_at`。
- `rank`：每日候选发布日。
- `rank` 和 `actions` 的 `price_session`：该份排名使用的已收盘行情日。
- `price`：最近已收盘日；`close` 是复权收盘，距离 20/50 日线的字段单位是百分数。
- `earnings`：当前来源发布日；下次日期取每日候选使用的完整财报日历，并列出 Nasdaq 近四季 EPS。若本地日历尚未取得下次日期，会明确标出。
- `consensus`：长桥最近一次实际采集；只显示未来三季营收和 normalized EPS 预期。
- `insider`：SEC Form 4 当前数据集的发布日；只列近 90 天公开市场买入和卖出。最后一笔交易较早不代表来源已经停止更新。
- `short`：FINRA 最近结算日；这是半月持仓，`days_to_cover` 是回补天数。
- `options`：嘉信最近期权交易日。
- `transcript`：最近一次电话会日期；两段 summary 是管理层原文的压缩摘录，不是模型推断。
- `news`：SeekingAlpha 当前数据集的发布日；文章的实际日期看 `published_at`，摘要缺失时查看 `summary_status`。

`rank` 和 `earnings` 共用离财报交易日数。财报日期超出发布包交易日历时，使用本地交易所日历计算，输出 `published_calendar_through`、`earnings_day_count_basis` 和覆盖说明；这只补充距离，不改变原财报日期及其预计或待确认属性。

每日卡准备的交易日历覆盖到当前日期后 370 天，已知财报日可正常显示剩余交易日数。未取得下次日期时，`earnings.data_status` 明确写“未取得下次日期”。

`a2q --help` 分“查个股”和“查全局”列出全部块。资格查询会显示业绩指引、融资事件等真正进入排名的输入；缺值保持为空。

## 历史事件与相似日

先核实事件日期，再查日线结果；板块 ETF 和个股一起写在代码列表里：

```bash
a2q CRWD PANW CIBR --event 2021-12-09 --json
a2q MRVL --similar --json
a2q MRVL --similar --direction short --current-price 237 --qqq-price 720.57 --json
a2q MRVL --similar --state asset_change_pct=-3.2 --state qqq_change_pct=-1 --json
```

事件日从当日收盘起算，休市日顺延到下一个交易日，自动加入 QQQ。输出随后 1/5/20 个交易日的涨跌、相对 QQQ 超额、收盘最大回撤和不利波动，并和事件日前同标的全部交易日基准比较。最大回撤使用收盘路径，无法判断日内先碰止损还是先到目标价。

相似日默认使用这只股票最新有日线的一天；`--date YYYY-MM-DD` 指定目标状态日，`--history-start YYYY-MM-DD` 指定搜索起点，默认 2013-01-01。盘中现价按当天收盘近似，均线包含该价格；没有提供盘中报价的其他标的沿用此前收盘状态，查看 `state_source_sessions`。形态列只读已有年度宽表。QQQ、个股价格分别从 ETF 和个股日线直接投影读取。

固定维度及容差如下。这些参数在本轮查看结果前确定，使用时不扫容差挑胜率。

| `--state` 维度 | 单位和含义 | 容差 |
|---|---|---:|
| `asset_change_pct` | 个股当日涨跌，百分数 | ±2 个百分点 |
| `qqq_change_pct` | QQQ 当日涨跌，百分数 | ±1 个百分点 |
| `asset_ma50_distance_pct` | 个股相对 50 日线的距离，百分数 | ±5 个百分点 |
| `qqq_lookback_return_pct` | QQQ 近 5 日涨跌，百分数 | ±3 个百分点 |
| `asset_return5_pct` | 个股近 5 日涨跌，百分数 | ±5 个百分点 |
| `asset_ma20_distance_pct` | 个股相对 20 日线的距离，百分数 | ±4 个百分点 |
| `asset_high252_distance_pct` | 个股相对 252 日最高价的距离，百分数 | ±10 个百分点 |
| `position.range_contraction` | 宽表原始振幅收敛值，较大表示收缩 | ±0.25 |
| `position.volume_dryup` | 宽表原始负量比，越接近零表示量越小 | ±0.35 |

使用同标的历史，所有可用维度同时落在 `match_ranges` 内才算匹配。缺少的维度列在 `missing_dimensions`，例如部分 ETF 没有宽表振幅和成交量因子。每个维度同时给出目标值、上下界和来源日期。历史样本和基准使用相同特征覆盖；最近日期按容差归一后的距离排列。

`dimension_diagnostics` 按单独排除样本最多的维度排序，逐项列出可用、单维命中、超出容差和缺失的交易日数。诊断只纳入该标的已有历史涨跌的日期，总数见 `diagnostic_session_count`。各维独立计数，排除数不能相加；它们包含尚未成熟的历史状态，收益统计仍只用决策日前成熟的标签。样本很少或为零时先看这张表；`--state` 只调整目标状态值，固定容差与匹配方法保持不变。

每个期限分别报告 `sample_count`、`distinct_session_count`、收益中位数、方向胜率、超额中位数、超额胜率、10%/90%分位及收盘回撤。基准在 `baseline`，差在 `difference`。收益为百分数，胜率为 0–1，胜率差乘 100 才是百分点。做空的方向收益和方向超额取相反数，QQQ 自身超额恒为零。

同一标的每个日期只算一次；批量查多只股票时，每只分别给结果，不能把多只股票同一天的结果当成独立日期。相邻日期的未来窗口仍会重叠。样本数照实显示，不设最低门槛，不把少数日期的高胜率解释成确定性。

## 盘中想法与冲动复盘（玩法草稿，供协调者审查）

当用户想追买、开空、临时加杠杆或提前卖出时：

1. 记下时间、标的、方向、是否已成交及当时的计划。用 `--portfolio` 查已入账记录；没有记录只能说“未确认成交”。
2. 调 `--similar`，同时报告样本数、不同日期数、1/5/20 日方向胜率和收益中位数，以及同标的基准和差。新闻有已核实的历史日期时再加 `--event`。业务新闻相似和价格形态相似分别说明。
3. 回看旧决策时只用当时已知状态。没有盘中快照，用上一个已收盘日并明确写“前收状态代理”；不传入决策日事后收盘、不成熟标签或盘中后来出现的最高价。
4. 分开写“当时的统计依据”“实际随后走势”“实际执行盈亏”。统计和后来走势相反也照实保留；不凭一次赚钱或亏钱判对错。相似样本为零时直接写“数据不足”。

本轮 2018–2026 年系统成交的观察中，小盘第三天仍亏、市场在 QQQ 50 日线上方的 184 笔里，28.3% 最终盈利，8.7% 最终达到至少 20%；第三天已赚的 210 笔按系统拿到卖点，平均收益比当时的价格涨幅多 10.84 个百分点。它们是既有规则下的回看统计，尚未验证新的“第三天一律卖”规则。完整日期去重结果与同组基准见报告。

给用户的一句话：**买后第 1、3、5 天的红绿先作观察，去留继续按买前约定的退出条件执行。** 这次没有验证新的仓位比例、杠杆倍数或止损距离。风险金额和退出价沿用该笔已有计划；需要计算股数时，用已约定风险金额除以每股到退出价的距离，并说明跳空、滑点和费用会改变实际损失。没有约定就标为未定义。

MRVL 的实际记录证明：日线后来方向有利，仍可能在此前先止损；所有分批仓位的保护单要逐项核对。日线工具不能给出分钟级触发胜率、杠杆合约收益或保证成交价。

详细数据与覆盖限制见 analyze2quant 仓库 `planning/reports/实盘冲动复盘.md`。聊天回复用“历史样本与基准 → 当前计划 → 未确认项”的顺序，避免用盈利故事催下单。

## a2q 查不到时

先 `a2q --help` 确认真没有这个块或字段。确实没有，按下面做，**做完在「缺口登记」加一行**（直接改 `/home/admin/mrlonely-code/skill-forge/skills/a2q/SKILL.md`，这是唯一底稿），后续统一开发进 a2q。

脚本读数据湖只用这两个入口，不要试别的名字（`lake.api`、`Lake`、`LakeClient`、`LakeStore`、`DatasetStore`、`read_dataset` 都不存在）：

```python
from analyze2quant.us.panel import symbol_rows            # 按股票取行，返回 DataFrame
rows = symbol_rows("us_equity.etf_daily_1d", ["SOXL"],
                   ["symbol", "session_date", "open", "high", "low", "close", "known_at"],
                   date_column="session_date", since="2020-01-01")

from analyze2quant.lake.reader import current_dataset     # 整个数据集
for table in current_dataset("us_equity.uw_iv_rank").iter_tables(columns=[...]):
    ...                                                    # 逐文件 pyarrow.Table，别一次全转 pandas
```

- 运行：临时查询用 a2q 背后的只读生产环境 `$(dirname $(readlink -f ~/.local/bin/a2q))/python`。本地旧 checkout 可能没有 `symbol_rows`；系统 `python3` 没有 pandas。
- 常用数据集：个股日线 `us_equity.daily_1d_consolidated`；ETF/指数日线 `us_equity.etf_daily_1d`（未复权，复权乘 `provider_adj_close / close`）；期权日指标 `us_equity.schwab_option_metrics_1d`；期权链 `us_equity.schwab_option_chains`（10-12 起）；分钟线 `us_equity.schwab_minute_1m`（10-08 起）；IV 排名 `us_equity.uw_iv_rank`；财报日历 `us_equity.nasdaq_earnings_calendar`。全部名字：`ls /srv/qrant-data/datasets/us_equity/`，前面加 `us_equity.`。
- 可见时点看 `known_at` 或数据集自带的来源时钟，不看 `session_date`。
- 盘中现价湖里没有：`longbridge quote SOXL.US`；日 K `longbridge kline SOXL.US --period day --count 5 --format json`。

## 缺口登记

a2q 查不到、只能自己写脚本或联网的需求，在这里追加一行（日期｜谁｜想查什么｜a2q 缺什么｜临时怎么查的）。协调者定期把它们派成开发任务，做完的划掉并写上 PR 号。

- 2026-11-05｜gemini-4-argon 会话｜SOXL 2020 年以来盘中最低跌超 20% 的日子及之后走势｜`--price` 只能看最近 60 天、没有开高低、没有 MA200｜~~写脚本读 etf_daily_1d~~ → 已由 PR #548 解决（区间、开高低、MA200），2026-11-06 部署
- 2026-11-05｜同上｜MA120、MA250 等任意窗口均线｜`--price` 只有 MA20/50/200｜脚本自算
- 2026-11-05｜同上｜盘中实时价｜a2q 不联网，只到上一收盘｜币安、longbridge
