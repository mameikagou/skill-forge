# 币安美股执行通道：核验入口与当前边界

用于币安美股研究／执行任务。研究范围与映射纪律以主 skill“研究标的池与执行通道分别核实”为准。本文件记录产品入口和带日期的证据；目录数量、资格、费用与可借额度均须在实际任务时刷新，不能永久硬编码。

## 先保留用户的研究对象

2026-09-09 用户再次明确：标普 500／标普 100 成分股截面多因子，币安是执行通道。九只原型不能代表研究全集，SPY 单一 ETF 也不能替代成分股选股。选股研究继续归属美股主线；代码中某个取数范围、可配置子集或历史累计证券数都不是用户合同。

## 三条不同的产品入口

| 产品 | 官方入口 | 需要核实的执行语义 |
| --- | --- | --- |
| Stocks：直接美股及 ETF | `GET /sapi/v1/equity/market/exchangeInfo`、`/quote` | 证券及股类身份、`tradability`、交易时段、碎股、订单限制、结算现金和费用；不能套用现货币对／永续账户 |
| bStocks：代币化证券现货 | `GET /api/v3/exchangeInfo`；`GET /sapi/v1/equity/market/tokenized-assets` 提供底层证券与转换乘数 | `assetCode → underlyingEquitySymbol`、`multiplier` 与生效时点、公司行为、现货过滤器、代币盘口与底层证券的价差 |
| 股票永续 | `GET https://fapi.binance.com/fapi/v1/exchangeInfo` | 产品类别、底层证券、报价／保证金币、合约乘数、交易状态、资金费、保证金与清算；ETF／杠杆 ETF 不等于普通股票 |

Stocks 和 tokenized-assets 的 MARKET_DATA 接口需要 `X-MBX-APIKEY`，无需签名。`exchangeInfo` 可不传 symbol 获取目录；单一股票 symbol 不存在时可能返回空数组。不能拿无鉴权错误当作产品不存在，也不能仅按 `BUSDT` 后缀识别 bStocks，普通加密资产也可能匹配。[Stocks 官方 API 文档](https://developers.binance.com/en/docs/catalog/advanced-trading-stocks-trading/api/rest-api/market-data)

官方于 2026-07-20 宣布 Stocks API 上线。股票服务 FAQ 介绍超过 7,000 只股票及 ETF、股票受益所有权和托管安排；这属于产品说明，不能代替账户目录实测。USDT 等资金可转换为 USDC 购买，卖出款进入 Funding Account 的 USDC，不能在账户引擎中默认现金始终是 USDT。按 FAQ 的当前普通口径，小额订单涉及最低费用，较大订单涉及 spread，零佣金不等于零成本。[API 上线公告](https://www.binance.com/en/support/announcement/detail/95d746cb2b5e4d179c50d0026dd7dfbe)、[股票服务 FAQ](https://www.binance.com/en/support/faq/detail/a7469c7703524024b5bc2d492b03639d)

## 2026-09-09 只读实测

时间：约 04:03–04:09 UTC。直接访问官方 HTTPS API，无账户鉴权、无下单、无借还款。以下是访问结果，不是模拟盘、实盘验收或样本外策略结果。

| 检查 | 实际结果 | 可得出的结论 |
| --- | --- | --- |
| Spot exchangeInfo | HTTP 200；全目录 3,692 个交易对；SPYBUSDT、QQQBUSDT、NVDABUSDT 为 TRADING，Spot 与 Margin 标志为 true | bStocks 现货入口真实存在；不证明全部 bStocks 数量或账户杠杆能力 |
| Futures exchangeInfo | HTTP 200；`underlyingType=EQUITY` 共 156 个 TRADING 合约，其中 155 个 USDT、1 个 USD1；底层代码去重 155 个 | “只有九只”错误；156 是合约条目数，既不是 156 只普通股票，也不是标普全覆盖证明 |
| Stocks exchangeInfo；tokenized-assets | 均 HTTP 400、`code=-2014`、API-key format invalid | 本次未取得股票全目录和官方 token→证券映射，准确覆盖与账户可用性尚未完成核验 |
| Cross Margin allPairs；Isolated allPairs，查询 SPYBUSDT | 均 HTTP 400、`code=-2014` | 未完成融资通道鉴权；不能宣称逐仓／全仓均可用或可做 1.5–2 倍 |
| SPYBUSDT bookTicker／depth | HTTP 200；一次买一／卖一为 766.46／766.47；卖一数量 0.037，约 28.36 USDT | 行情可取；一档价差小不证明目标仓位能低滑点成交 |
| NVDABUSDT bookTicker | HTTP 200；一次买一／卖一为 226.18／226.19 | 个股代币行情可取，不限于 SPY 指数代币 |
| SPYBUSDT 日线，startTime=0、limit=1000 | 65 行，首根 2026-07-07，末根 2026-09-09 | 真实代币历史短，末根为当日未完成日线 |
| NVDABUSDT 同口径日线 | 91 行，首根 2026-06-11，末根 2026-09-09 | 不能直接用这些日线完成 200 根日线预热，更不能声称具备多年真实执行历史 |

主要原始响应 SHA-256：

- Spot：`16ab7e1db5c75444d1ce5dd347712e78d81d266533c1e3a7490a5890307eab0b`
- Futures：`d56cd3bfe37ca1e3e45f82f86eada3bff8720624c4c1c3d2a982592e5808c9a8`
- SPYB 日线：`0f1023ecc0c2c6edd88c6954d1a3c9ef293b0a70ffe713ec3fe5e2a270f14c56`

原提交声称的“78 个 bStocks”本次未获得官方分类全集复核，已从永久规则移除。全量 Spot 目录中 85 个 `BUSDT` 后缀条目包含 BNB、SHIB 等加密币，不能按此计数或批量建立证券映射。

## 标普覆盖：当前辅助比对，不冒充历史成分

获取发行方 iShares 的 [OEF 持仓 CSV](https://www.ishares.com/us/products/239723/ishares-s-p-100-etf/latest-holdings.csv) 与 [IVV 持仓 CSV](https://www.ishares.com/us/products/239726/ishares-core-sp-500-etf/latest-holdings.csv)，均标注 2026-09-04。只保留 `Asset Class=Equity`；它们是跟踪标普 100／500 的 ETF 持仓代理，并非本轮取得的官方指数 PIT 成分历史。

| 当前持仓代理 | Equity 行数 | ticker 与 USDT 股票永续 baseAsset 同名 | ticker + B 与 USDT 现货 baseAsset 同名候选 |
| --- | --- | --- | --- |
| OEF | 101 | 37 | 18 |
| IVV | 504 | 64 | 33 |

这只是代码层面的候选对应数，不是已核验证券身份、别名、转换乘数和账户权限后的覆盖率；同一公司的不同股类也不能合并顶替。CSV 已保留每行候选与未匹配项。JNJ、XOM、GOOG 等在本次永续同名比对中未匹配，不能据此断言 Stocks 入口也不提供。结论是需要核实 Stocks 广域目录，不能把 bStocks／永续的局部覆盖冒称覆盖整个标普。

## 杠杆可行性要分开回答

2026-07-24 更新的官方抵押 FAQ 将部分 bStocks 抵押资格限定于适用地区的合格 VIP3+ 用户，列出的模式是 Cross Margin、Portfolio Margin、Portfolio Margin Pro；它没有给出“所有用户均可逐仓借 USDT 买 SPYB”的承诺。FAQ 还把 bStocks 的抵押用途和借贷支持作了区分。[bStocks 抵押 FAQ](https://www.binance.com/en/support/faq/detail/4f5444780f444bf6b39adbec77ef545a)

据此既不能断言原建议的融资闭环已可用，也不能反向断言所有借 USDT 买入路径都不存在。使用已有授权账户的只读接口分别验证：账户地区／产品资格、API 权限、具体交易对买卖权限、USDT 借款额度与利率、抵押折算、保证金模式、偿还和强平制度。实际借款／下单属于另一项执行动作，本次未做；Stocks 服务也不能凭同属币安便继承 bStocks 或 USD-M 的杠杆能力。[Margin 市场数据接口](https://developers.binance.com/en/docs/catalog/core-trading-margin-trading/api/rest-api/market-data)

## 现有主线承接程度

核对 analyze2quant 的 `research/cross_market.py::adapt_us_portfolio_to_binance_stocks`：它已经负责组合意图到渠道标的的映射、规则时点和缺失映射检查，不计算订单或账户。因此应复用它，不能把该函数存在等同于 Stocks 交易链路已完成。

`research/adapters/us_hseries.py` 当前仍以原型 `SYMBOLS` 限定可配置股票，读取股票永续行情及资金费并进入原生永续账户。这条路径的运行不能证明直接股票／bStocks 现货及现货融资已经打通。此轮没有修改或重启被用户叫停的策略。

恢复策略研究时：保留标普 500／100 的研究范围与时点成分合同，沿已有美股因子→组合意图→venue adapter→相应账户主线继续；补齐 Stocks 鉴权目录及证券映射，分别报告执行覆盖和融资是否成立。行情读取已验证，账户交易与融资尚未验收，广域选股策略的样本外有效性也仍未由本次检查回答。
