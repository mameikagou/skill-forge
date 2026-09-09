# Research lessons from retained evidence

Read this file before designing a factor campaign, factor combination, cross-market transfer, or promotion decision. The frozen user contract and live repository remain authoritative.

## Evidence hierarchy

Use, in order:

1. Current user instruction and frozen PLAN or campaign contract.
2. The original `因子投资方法与实践` book sections relevant to the research object.
3. Live strategy code, point-in-time data, and approved-engine output.
4. `.planning/quant-qlib/failures/` and related reports.
5. Brain notes, papers, and OpenMemory `investment-learning` records.

Do not claim that OpenMemory was checked when its query fails. Do not replace it with an unrelated local store.

## Repeated failures and their durable corrections

### The experiment answered the wrong question

- ETF research copied a daily high-turnover trading shell when the user wanted weak inputs extracted for an existing low-turnover combination.
- A sentiment project evaluated market state with an individual-asset ranking pipeline and selected long-horizon price trends instead of market sentiment.
- A dynamic-theme project substituted a stable industry classification after the required theme data failed its data gate, then reported engineering completion as business completion.
- A combined-factor request was turned into a contest between the original strategy and a filtered weak-factor strategy, so the requested union was never tested.

Correction: state the requested result in one sentence, name the predictor/combination/portfolio/execution layer, and verify that every run directly answers it. A precise backtest of the wrong object is still wrong.

### Weak inputs were rejected too early

Earlier workflows required each weak input to satisfy many standalone profitability and stability gates. This removed inputs whose value could exist only after combination. Later searches relaxed the gates but mostly added adjacent windows: hundreds of formulas represented only a small number of independent directions.

Correction: at the input stage reject only fatal timing, data, reproducibility, constant-output, mapping, or proven-duplicate problems. Evaluate weak legal inputs for conditional or joint increment. Report nominal formulas, economic mechanisms, and effective independent dimensions separately.

### A formula or trading shell failure was exaggerated

- Several incomplete A-share runs were engineering failures, not evidence against factors.
- A frozen quality/value batch failed its one-time later-period test; the valid conclusion covered that batch and combination, not every quality or value mechanism.
- A fixed crypto five-input formula had negative development-period ranking information and gross losses. That rejected the fixed definition and weights, not order flow, open interest, funding, price behavior, or spot-perpetual transmission as families.
- Crypto order-flow inputs retained weak positive ranking information while an extremely high-turnover portfolio lost nearly all capital after fees, slippage, and funding.

Correction: report predictor, combination, portfolio, execution, data, and engineering conclusions separately and at the narrowest supported scope.

### Formula count was mistaken for independent information

Local campaigns produced hundreds of nominal formulas but only a small number of effective directions. Signals with low raw-value correlation still failed in the same years and represented the same economic mechanism. Several positive statistics computed from the same future-return labels were also counted as if they were independent confirmations.

Correction: preserve the complete search denominator, cluster formulas and economic mechanisms, inspect conditional increment and shared failure periods, and never count several views of the same labels and dates as independent evidence.

### Point-in-time semantics and executable prices were violated

Observed failures included current membership copied backward, same-day use of announcements without publication times, revised financial snapshots without a provable historical version, incorrect field meanings, planned management end dates treated as completed departures, incomplete protected-period coverage, and next-open orders silently filled at close.

Correction: validate official field meaning and available-at time before formula design. A date-only announcement becomes available on the next trading day unless a more precise earlier time is proved. Missing required execution prices fail closed; held unsellable assets remain held.

### Development success did not survive later data

Several A-share combinations looked strongly positive in development and all failed the once-opened later period. Repeated access to a historical period makes it known evidence even if a new campaign ID or later time split is created.

Correction: make the development and sample-out-of-sample dates part of the strategy contract. Freeze the complete factor combination and trading strategy before evaluating the later period. If that period was already examined, call it retrospective evidence and use genuinely later untouched data for the next sample-out-of-sample claim. Do not turn this rule into a permission or database-infrastructure project.

### Relative ranking was used as an absolute entry gate

In a crypto strategy, `score above the current cross-sectional 80th percentile` was intended to mean “only hold when there is a real signal.” With a sufficiently large universe, a top 20 percent always existed, so the strategy was almost always fully invested. A cross-sectional standardized score also had no natural 0-to-100 absolute scale.

Correction: use ranking only to compare assets. A rank-only portfolio can use frozen holding periods, rank buffers, and limited replacement to control turnover, then measure actual costed returns with the approved engine. If cash entry, direction timing, precise incremental-value comparison, or Kelly sizing requires an expected-return magnitude, that magnitude must come from a separately specified and validated model; do not infer it from a cross-sectional rank.

### Relative rank was converted into a cardinal return forecast

A Binance USD-M 4H model had positive Rank IC, so a strategy regressed the past realized top-minus-bottom return on the model's basket score gap. The resulting linear estimate was treated as expected 12-hour spread and used for entry, 4-hour continuation, and Kelly sizing. The regression was point-in-time, but that only prevented future-data leakage; it did not prove that distances between rank scores had stable return units. The policy blocked 98.6 percent of complete entry checks, usually exited after four hours despite a 12-hour label, and every accepted Kelly value hit its cap.

Correction: preserve the model as an ordinal selector only. The future return of a portfolio formed from high and low ranks is an evaluation result, not a magnitude encoded in the rank score. Use structural turnover controls for a rank-only strategy. If the contract requires ex-ante alpha to exceed costs or requires Kelly sizing, build and validate a separate magnitude model instead of converting ranks by convenience.

### Independent sleeves were confused with separate models

A long-short crypto design required a valid long basket and a valid short basket at the same time. That made market neutrality an entry requirement. A useful long opportunity could not trade without a simultaneous short opportunity, and vice versa. The proposed correction then jumped too far and treated independent long and short execution as proof that two predictive models were immediately required.

Correction: portfolio sleeves and predictive models are different decisions. Start with one validated cross-sectional ranking model and let the long and short sleeves activate independently. A separate market-direction or timing signal may set each sleeve's gross budget. Split the predictive models only after results support different long-side and short-side relationships.

### A rank-only strategy had no legitimate cash switch

A cross-sectional rank always produces a highest and lowest group. Therefore “only trade the strongest ranks” still forces exposure whenever the universe is non-empty. Turning score distance into expected return does not solve this; it only hides a new magnitude model inside an unvalidated calibration.

Correction: if cash is allowed, define a separate point-in-time direction or timing signal for each sleeve, or later build calibrated top-tail and bottom-tail probability models. Keep market-wide BTC, ETH, breadth, and volatility inputs in the activation layer rather than the coin-ranking layer. Do not call a rank percentile an absolute signal threshold.

### The holding horizon was rejudged before it elapsed

A model ranked future 12-hour relative strength, but the strategy reopened the question every four hours and usually exited after one bar. This paid full round-trip costs before the prediction horizon had a chance to play out.

Correction: freeze members and target weights for the stated horizon. Intermediate checks may enforce only frozen lifecycle, tradability, or severe-risk exits. Rerank and decide renewal after the horizon expires; do not use a fresh overlapping 12-hour prediction to repeatedly cancel the previous one.

### A review boundary was implemented as forced liquidation

A Binance USD-M rank strategy treated the 24-hour review boundary as an unconditional exit. Assets that remained inside the frozen retention band were sold and could be bought again on the next bar only to reset their holding clock. This created orders without new ranking information and made fees, slippage, and funding dominate the weak gross signal.

Correction: distinguish a minimum lock, a periodic eligibility review, and a genuine hard liquidation deadline. For a rank-only strategy, the ordinary boundary is a review: if the side remains allowed and an asset remains tradable and inside the frozen retention band, preserve the exact member and target weight and emit zero orders. Replace only members that fall out. Require an explicit business or risk reason before imposing an unconditional liquidation deadline, and test that continuing members do not create sell-and-rebuy round trips.

### Costs were deducted after trading instead of deciding whether to trade

Crypto combinations showed positive weak ranking information but changed members at most 4-hour checks. Gross gains were consumed by fees, slippage, and funding. Ranking buffers reduced turnover but did not ensure that a replacement was economically worthwhile.

Correction: compare expected new holding value with the existing holding or cash before emitting a target change. If the expected improvement does not strictly exceed all incremental costs and the frozen safety margin, emit `HOLD` and zero orders.

### Strategy decisions were rewritten by account behavior

An intended hold can still create trades when an account layer restores nominal equal weights. A small number of approved member changes combined with high order count or turnover proves the actual engine behavior differs from the strategy decision.

Correction: reconcile decisions to authoritative engine orders. `HOLD`, `HOLD_COST`, `BLOCKED`, and unchanged membership produce zero orders. Never maintain a second account or fee ledger to repair the approved engine.

### A nominal position limit was mistaken for a loss limit

A Binance USD-M research run opened a short with a target weight of 10 percent inside one shared-cash portfolio. The code treated that entry notional as if it capped the asset's possible loss. When the contract price rose by several multiples and no engine-native liquidation occurred, the short consumed almost the whole account; it later recovered on paper after the price fell. The reported return and drawdown therefore described an account contract the strategy never intended.

Correction: state margin mode and loss ownership separately from target notional. If “one coin is 10 percent” is intended to mean that coin can lose at most its allocated 10 percent, use the approved engine's isolated-margin or equivalent independent-cash contract and its native liquidation behavior. Before a real run, replay a multi-fold adverse move and prove that the position is closed from its own allocation, the remaining cash is not used to support it, and no post-liquidation price recovery restores the account. If the approved engine cannot represent this contract, block the formal result rather than clipping losses afterward or building a shadow account.

### Engineering work became the deliverable

Some investigations focused on hashes, audit surfaces, one-off modules, reports, or extra safety layers while the requested research result remained unanswered. One-off U.S. experiments also entered long-lived source despite an existing campaign runner.

Correction: the deliverable is the implemented factor strategy and its result. Retain only the smallest correctness checks and repairs needed to run that strategy. Reuse the official runner and engines; do not create a new infrastructure surface, mechanical sample seal, audit framework, or registry project for one research round.

### Hardcoded scratch tuples were mistaken for the exchange universe and the research object was hijacked

The user's U.S. cross-sectional multi-factor research scope was S&P 500 / S&P 100 constituent stocks, with a Binance execution line. On 2026-09-09 the user reiterated: “我的标的物一直都是标普 500 甚至标普 100”。 The implementation instead used a nine-symbol prototype (`NVDA`, `TSLA`, `AMD`, `META`, `MU`, `INTC`, `AVGO`, `TQQQ`, `SOXL`) and a perpetual-account path, without reconciling that scope to the broad research objective and the venue's complete product catalogues. A later configurable subset still rejected securities outside that prototype. The experiment therefore answered a narrow strategy question, not the requested broad-universe factor question. Its losses cannot establish that the broad factor families failed or that Binance offers only those symbols.

The mistake was failure to enforce an existing contract, not absence of a warning. The existing analyze2quant report `planning/reports/币圈与美股公开策略弱因子研究-2026-09-05.md`, section 62, already separated direct stocks, bStocks and stock perpetuals; it also distinguished a local ingestion filter from exchange availability. The subsequent skill-forge correction in commit `5367d4a` introduced a second drift: “S&P 500” became SPY-only exposure, and unqualified counts and Margin flags became permanent claims of complete execution support. This section corrects that record; it does not endorse those claims.

Correction:
1. Preserve the user's constituent-stock research object. Neither a small prototype nor a single index ETF is a substitute. An existing lake's cumulative symbol count is not a verified point-in-time index membership list.
2. Follow “研究标的池与执行通道分别核实” in the main skill: reconcile the research pool, dated complete product inventory and account-executable mapping. A missing API key is an unverified capability, not proof of nonexistence.
3. Do not promote dated catalogue counts, a token suffix, collateral eligibility or a Margin flag into permanent facts about full coverage or borrowing. Stocks, bStocks and perpetuals have different identity, cash, corporate-action, execution and financing semantics. Read the maintained [Binance execution reference](binance-us-equity-execution.md) for evidence and remaining gaps.
4. Attribute failure at the layer actually tested. Correct implementation errors and scope drift before discussing factor-family failure; require the frozen sample-out discipline before claiming generalization. Writing an apology or a new rule does not retroactively make an incorrectly scoped experiment valid.

## Useful retained sources

- `.planning/quant-qlib/failures/README.md` and all current `F-*.md` records.
- `.planning/quant-qlib/plan/Binance_USDM_4H弱因子组合Goal执行计划-2026-08-21.md`, especially the later frozen-contract and cost-gate sections.
- Brain `因子/因子研究.md`.
- Brain `AI投研/Looping 因子挖掘：验证器捕获与真实 Alpha 边界.md`.
- Brain `币圈/Binance USD-M 4H订单流与杠杆因子研究方法及失败归因-2026-08-21.md`.
- Brain original book `投资书籍/因子投资方法与实践/chunks/`: chapter 2 sections in chunks 003–007, chapter 6 sections in chunks 023–029, and chapter 7 sections in chunks 030–037. Read these before the derived chapter notes.
- Brain `投资书籍/因子投资方法与实践/读书笔记-第6章-因子研究现状.md` as a derived local summary, not as a substitute for the original chapter.
- OpenMemory `investment-learning` memory `3254e9a0-960e-49dc-9766-f6e831db9041`: predictor evidence, combination evidence, and costed trading-policy evidence are three separate layers. Its metadata was verified as `canonical_project=investment-learning`.

These records are evidence and corrections, not a new universal contract. Resolve apparent conflict by returning to the current frozen contract, the live code path, and the original methodological source.


### User-requested four-to-one splits were replaced by arbitrary years

2026-09-09：美股两套策略此前被切为SPY约56/44、多因子约58/42，并只跑MA120/1.5x和Top10/Buffer15/Cap2，未完成用户要的改进比较。用户明确要求四一分后，不能继续解释历史污染来替代实际重跑。按固定交易日历取floor(4N/5)开发、余下检验，冻结日期/数量和候选，再跑原生账户；复核SPY/QQQ、MA60/120、1.5/2x及Top15/Buffer20/Cap3–4。具体配置属于本次用户实验，不写成全局“正确参数”。放宽Cap一定有Alpha、现货杠杆无强平风险、80/20唯一正确等附件判断不能不经验证写成知识。保留原配置对照和失败，结论对应实际实验。
