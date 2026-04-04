研报告：Claude Code DNS 泄漏防护方案（mihomo + 3x-ui + AWS 节点）

 Context

 在中国大陆使用 Claude Code CLI，通过 mihomo 内核连接 3x-ui 管理的 AWS Xray 节点时，存在 DNS 泄漏风险。DNS 泄漏会导致：
 1. ISP/GFW 可以看到你正在解析 api.anthropic.com 等域名
 2. 暴露你的真实网络活动意图
 3. 潜在的账号封禁风险（Anthropic 2026年3月对中国区域大规模封号）

 本报告覆盖：Claude Code 的 DNS 行为分析、已知安全漏洞、mihomo 防泄漏配置、以及完整的终端防泄漏方案。

 ---
 一、Claude Code 的网络行为分析

 1.1 必连域名清单

 ┌─────────────────────┬─────────────────────┬────────────┐
 │        域名         │        用途         │ 是否可关闭 │
 ├─────────────────────┼─────────────────────┼────────────┤
 │ api.anthropic.com   │ Claude API 核心端点 │ 不可       │
 ├─────────────────────┼─────────────────────┼────────────┤
 │ claude.ai           │ OAuth 认证          │ 不可       │
 ├─────────────────────┼─────────────────────┼────────────┤
 │ platform.claude.com │ Console 认证        │ 不可       │
 ├─────────────────────┼─────────────────────┼────────────┤
 │ downloads.claude.ai │ 版本检查/更新       │ 不可       │
 ├─────────────────────┼─────────────────────┼────────────┤
 │ statsig.com         │ 遥测指标            │ 可关       │
 ├─────────────────────┼─────────────────────┼────────────┤
 │ sentry.io           │ 错误上报            │ 可关       │
 └─────────────────────┴─────────────────────┴────────────┘

 1.2 DNS 解析机制

 - Claude Code 是 Node.js 应用，使用 Node.js 内置 DNS 解析器
 - Node.js DNS 默认走系统 DNS（/etc/resolv.conf 或 macOS 的 scutil --dns）
 - 关键问题：Node.js 原生 fetch() API 不自动遵守 HTTP_PROXY 环境变量（GitHub #15684）
 - Claude Code 不自动继承系统代理设置，需要手动配置环境变量（GitHub #30318）

 1.3 代理支持情况

 支持: HTTP_PROXY, HTTPS_PROXY, ALL_PROXY, NO_PROXY
 支持: 基本认证 (user:pass@proxy)
 支持: 自定义 CA 证书 (NODE_EXTRA_CA_CERTS)
 支持: mTLS 客户端证书
 不支持: SOCKS 代理 (重要！)

 1.4 已知安全漏洞 — CVE-2025-55284

 - DNS 数据外泄漏洞（CVSS 7.1 High）
 - 攻击者可通过 prompt injection 诱导 Claude Code 用 ping/nslookup/dig/host 命令将本地敏感文件（如 .env、API Key）通过
 DNS 查询外泄
 - 已修复：v1.0.4+（2025年6月），当前版本已安全
 - 来源：Embrace The Red

 ---
 二、DNS 泄漏的三个层面

 2.1 应用层泄漏（Claude Code 自身）

 Node.js 直接调用系统 DNS 解析 api.anthropic.com 等域名 → 查询明文发送到 ISP DNS → 泄漏

 2.2 代理层泄漏（mihomo 配置不当）

 mihomo 使用 redir-host 或没有正确配置 fake-ip → 本地 DNS 先解析再走代理 → 泄漏

 2.3 系统层泄漏（操作系统行为）

 macOS 的 mDNSResponder 或 systemd-resolved 绕过代理直接查询 DNS → 泄漏

 ---
 三、完整防泄漏方案

 3.1 mihomo 内核配置（核心防线）

 推荐使用 TUN 模式 + fake-ip，这是最彻底的方案：

 # ===== mihomo config.yaml 关键配置 =====

 # 混合代理端口（给终端用）
 mixed-port: 7890

 # TUN 模式（系统级全局代理，最重要的防泄漏手段）
 tun:
   enable: true
   stack: mixed              # mixed 兼容性最好
   auto-route: true          # 自动接管路由
   auto-redirect: true       # 自动重定向
   auto-detect-interface: true
   strict_route: true        # 严格路由，防止旁路泄漏
   dns-hijack:               # 劫持所有 DNS 请求
     - any:53
     - tcp://any:53

 # DNS 配置（2025 v2.0 极简防泄漏）
 dns:
   enable: true
   ipv6: false               # 国内建议关闭，减少泄漏面
   enhanced-mode: fake-ip    # 核心！返回假 IP，避免真实 DNS 查询
   fake-ip-range: 198.18.0.1/16
   fake-ip-filter:           # 这些域名不走 fake-ip
     - geosite:private       # 局域网域名
     - geosite:category-ntp  # NTP 时间同步
   use-hosts: false          # 禁用本地 hosts 解析
   use-system-hosts: false   # 禁用系统 hosts 解析
   respect-rules: true       # DNS 查询遵守路由规则
   nameserver:               # 默认 DNS（走代理查询）
     - https://1.1.1.1/dns-query
     - https://8.8.8.8/dns-query
   proxy-server-nameserver:  # 解析代理节点域名（必须用国内 DNS）
     - https://223.5.5.5/dns-query
     - https://119.29.29.29/dns-query

 # Sniffer（流量嗅探，从 TLS SNI 中提取真实域名）
 sniffer:
   enable: true
   sniff:
     HTTP:
       ports: [80, 8080-8880]
     TLS:
       ports: [443, 8443]
     QUIC:
       ports: [443, 8443]
   skip-domain:
     - "Mijia Cloud"

 关键原理解释：
 - fake-ip 模式：当应用（如 Node.js）请求解析 api.anthropic.com 时，mihomo 不会真的去查 DNS，而是立刻返回一个假 IP（如
 198.18.x.x）。应用用这个假 IP 发起连接，mihomo 拦截后根据域名规则走代理。全程无真实 DNS 查询泄漏。
 - dns-hijack: any:53：即使有应用试图直接向系统 DNS 发查询（绕过代理），TUN 也会劫持这些 53 端口的流量。
 - strict_route: true：防止流量绕过 TUN 接口。

 3.2 3x-ui 服务端配置建议

 在 AWS 节点的 3x-ui 面板中：

 1. 协议选择：VLESS + Reality + Vision（最抗检测）
 2. Inbound 开启 Sniffing：
 {
   "sniffing": {
     "enabled": true,
     "destOverride": ["http", "tls", "quic"]
   }
 }
 2. Sniffing 可以从 TLS ClientHello 中提取真实目标域名，避免在服务端做额外 DNS 查询。
 3. 服务端 DNS：在 VPS 上安装 Unbound 或使用 Cloudflare DoH 作为系统 DNS，确保即使有解析也不走中国 DNS。

 3.3 终端环境变量配置

 在 ~/.zshrc 中添加：

 # ===== Claude Code 代理配置 =====
 # mihomo mixed-port 提供 HTTP 代理
 export HTTP_PROXY=http://127.0.0.1:7890
 export HTTPS_PROXY=http://127.0.0.1:7890
 export ALL_PROXY=http://127.0.0.1:7890

 # 本地地址绕过代理
 export NO_PROXY=localhost,127.0.0.1,::1,192.168.0.0/16,10.0.0.0/8

 # 关闭 Claude Code 非必要遥测（减少不必要的网络请求）
 export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
 export DISABLE_TELEMETRY=1
 export DISABLE_ERROR_REPORTING=1

 重要：即使开了 TUN 模式，也建议同时设置这些环境变量。因为：
 - 部分 Node.js 版本的 fetch() 可能不完全走系统路由
 - 双保险策略，TUN 兜底 + HTTP_PROXY 主动走代理

 3.4 macOS Desktop App 额外配置

 如果你同时使用 Claude Code Desktop App：

 # macOS LaunchAgent 不继承 shell 环境变量，需要额外设置
 launchctl setenv HTTP_PROXY http://127.0.0.1:7890
 launchctl setenv HTTPS_PROXY http://127.0.0.1:7890
 launchctl setenv ALL_PROXY http://127.0.0.1:7890

 3.5 验证 DNS 是否泄漏

 # 1. 检查 DNS 解析是否走代理（应返回 fake-ip 地址 198.18.x.x）
 nslookup api.anthropic.com

 # 2. 用 curl 测试是否走代理
 curl -v https://api.anthropic.com 2>&1 | grep "Connected to"

 # 3. 在线 DNS 泄漏测试（通过代理访问）
 # 浏览器打开：https://www.dnsleaktest.com 或 https://ipleak.net

 # 4. 抓包确认（终极验证）
 # 用 Wireshark 监控网卡，过滤 port 53，看是否有明文 DNS 查询离开本机
 sudo tcpdump -i en0 port 53 -n

 # 5. mihomo 日志验证
 # 查看 mihomo 的连接日志，确认 api.anthropic.com 走了代理规则

 ---
 四、方案对比总结

 ┌───────────────────────────────────┬──────────────────────┬────────┬────────────┐
 │               方案                │   DNS 泄漏防护等级   │ 复杂度 │  推荐场景  │
 ├───────────────────────────────────┼──────────────────────┼────────┼────────────┤
 │ 仅 HTTP_PROXY 环境变量            │ 低（DNS 仍走本地）   │ 低     │ 临时使用   │
 ├───────────────────────────────────┼──────────────────────┼────────┼────────────┤
 │ mihomo 系统代理（无 TUN）         │ 中（部分应用可绕过） │ 中     │ 浏览器为主 │
 ├───────────────────────────────────┼──────────────────────┼────────┼────────────┤
 │ mihomo TUN + fake-ip              │ 高（系统级拦截）     │ 中     │ 推荐方案   │
 ├───────────────────────────────────┼──────────────────────┼────────┼────────────┤
 │ mihomo TUN + fake-ip + HTTP_PROXY │ 最高（双保险）       │ 中高   │ 终极方案   │
 └───────────────────────────────────┴──────────────────────┴────────┴────────────┘

 ---
 五、踩坑预警

 5.1 SOCKS 代理的坑

 Claude Code 不支持 SOCKS 代理。如果你之前用的是 socks5://127.0.0.1:7891，必须改用 mihomo 的 mixed-port（HTTP 代理）。

 5.2 socks5:// vs socks5h:// 的坑

 即使某些工具支持 SOCKS，使用 socks5:// 时 DNS 在本地解析（泄漏！），而 socks5h:// 才会把 DNS 查询也通过代理发送。但这对
 Claude Code 不适用，因为它不支持 SOCKS。

 5.3 IPv6 泄漏

 如果系统启用了 IPv6，DNS 查询可能通过 IPv6 绕过代理。建议：
 - mihomo 中 ipv6: false
 - 或确保 TUN 也劫持 IPv6 DNS

 5.4 macOS mDNSResponder 后台查询

 macOS 的 mDNSResponder 服务会在后台做各种 DNS 查询。TUN 模式的 dns-hijack 可以拦截这些查询，但如果没开
 TUN，这些查询会直接泄漏。

 5.5 Anthropic 封号风险

 - 2026年3月 Anthropic 对中国区域进行了大规模封号
 - 即使解决了 DNS 泄漏，Anthropic 仍可能通过其他手段检测（如 API Key 绑定的 IP 地理位置）
 - 建议：AWS 节点选择美国/日本等受支持地区的出口 IP

 5.6 Node.js fetch 环境变量的坑

 Node.js ≥ 18 的原生 fetch() 早期版本不认 HTTP_PROXY。较新版本（22+）已改进，但仍可能有兼容性问题。TUN 模式可以兜底。

 ---
 六、参考来源

 - Claude Code DNS 数据外泄漏洞 CVE-2025-55284
 - Claude Code 企业网络配置文档
 - Claude Code macOS 代理问题 #30318
 - VS Code 扩展忽略代理设置 #15684
 - mihomo DNS 配置文档
 - mihomo 极简防 DNS 泄漏配置 2025 v2.0
 - mihomo 极简防 DNS 泄漏配置 2025 v1.0
 - Xray DNS 泄漏讨论
 - 中国使用 Claude Code 指南
 - Claude 账号封禁防护指南 2026
 - 代理和 VPN 配置指南
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌






DNS 防泄漏伪装计划 — 基于你的实际配置                                                                                  

 Context

 你在中国大陆使用 Claude Code CLI，通过 mihomo-party（smart core）连接 3x-ui 的 AWS VLESS+Reality
 节点。当前配置已有基础防护（TUN + fake-ip），但存在多个泄漏缺口。本计划针对性修补这些缺口。

 ---
 现状诊断（你的配置存在的问题）

 已有的好配置（不用动）

 - TUN 模式已开启（utun1500, mixed stack, dns-hijack: any:53）
 - DNS fake-ip 已开启（198.18.0.1/16）
 - Sniffer 已开启
 - use-hosts: false, use-system-hosts: false 已设置
 - store-fake-ip: true 已设置

 发现的泄漏缺口

 ┌─────┬────────────────────────────────────────────────────────────────────────────────┬──────────┬─────────────────┐
 │  #  │                                      问题                                      │ 风险等级 │     谁来修      │
 ├─────┼────────────────────────────────────────────────────────────────────────────────┼──────────┼─────────────────┤
 │ 1   │ 终端无代理环境变量 — ~/.zshrc 中没有 HTTP_PROXY 等变量，Claude Code (Node.js)  │ 高       │ 我来改          │
 │     │ 的网络请求可能不完全走 TUN                                                     │          │                 │
 ├─────┼────────────────────────────────────────────────────────────────────────────────┼──────────┼─────────────────┤
 │ 2   │ anyrouter.top 无规则 — 你的 ANTHROPIC_BASE_URL 指向 anyrouter.top，但 mihomo   │ 高       │ 你去            │
 │     │ 规则中没有这个域名，DNS 查询走国内 DNS                                         │          │ mihomo-party 改 │
 ├─────┼────────────────────────────────────────────────────────────────────────────────┼──────────┼─────────────────┤
 │ 3   │ nameserver 用国内 DNS — nameserver 配置的是 alidns/doh.pub，非直连域名的初始   │ 中       │ 你去            │
 │     │ DNS 查询也会先发到中国 DNS 服务器                                              │          │ mihomo-party 改 │
 ├─────┼────────────────────────────────────────────────────────────────────────────────┼──────────┼─────────────────┤
 │ 4   │ strict_route 未开启 — 部分流量可能绕过 TUN 接口                                │ 中       │ 你去            │
 │     │                                                                                │          │ mihomo-party 改 │
 ├─────┼────────────────────────────────────────────────────────────────────────────────┼──────────┼─────────────────┤
 │ 5   │ auto-redirect: false — 未开启自动重定向                                        │ 中       │ 你去            │
 │     │                                                                                │          │ mihomo-party 改 │
 ├─────┼────────────────────────────────────────────────────────────────────────────────┼──────────┼─────────────────┤
 │ 6   │ respect-rules: false — DNS 查询不遵守路由规则                                  │ 中       │ 你去            │
 │     │                                                                                │          │ mihomo-party 改 │
 ├─────┼────────────────────────────────────────────────────────────────────────────────┼──────────┼─────────────────┤
 │ 7   │ Claude Code 遥测未关闭 — statsig.com/sentry.io 会产生额外网络请求              │ 低       │ 我来改          │
 ├─────┼────────────────────────────────────────────────────────────────────────────────┼──────────┼─────────────────┤
 │ 8   │ nameserver-policy 不完整 — 缺少                                                │ 中       │ 你去            │
 │     │ anyrouter.top、platform.claude.com、downloads.claude.ai                        │          │ mihomo-party 改 │
 ├─────┼────────────────────────────────────────────────────────────────────────────────┼──────────┼─────────────────┤
 │ 9   │ Sniffer 缺少 QUIC — 443 端口的 QUIC 流量没被嗅探                               │ 低       │ 你去            │
 │     │                                                                                │          │ mihomo-party 改 │
 └─────┴────────────────────────────────────────────────────────────────────────────────┴──────────┴─────────────────┘

 ---
 操作计划

 Part A：我直接帮你改的（自动执行）

 A1. 在 ~/.zshrc 添加代理环境变量

 # ===== DNS 防泄漏：Claude Code 代理配置 =====
 export HTTP_PROXY=http://127.0.0.1:7890
 export HTTPS_PROXY=http://127.0.0.1:7890
 export ALL_PROXY=http://127.0.0.1:7890
 export NO_PROXY=localhost,127.0.0.1,::1,192.168.0.0/16,10.0.0.0/8,172.16.0.0/12

 # 关闭 Claude Code 非必要网络请求
 export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
 export DISABLE_TELEMETRY=1
 export DISABLE_ERROR_REPORTING=1

 文件: ~/.zshrc
 原理: 即使 TUN 已兜底，显式设置 HTTP_PROXY 可以让 Node.js 在应用层就走代理，不依赖 TUN 拦截。双保险。
 端口说明: mihomo-party 的 HTTP 端口是 7890（port: 7890），mixed 端口是 53002。这里用 7890（HTTP 端口）。

 A2. 更新 Claude Code settings.json

 在 ~/.claude/settings.json 的 env 中添加遥测关闭变量，确保即使 shell 环境变量没加载（如从 Desktop App 启动），也能生效。

 文件: ~/.claude/settings.json

 ---
 Part B：你需要在 mihomo-party 中改的

 B1. 在 mihomo-party 的 nameserver-policy 中添加域名

 位置：mihomo-party → 设置 → nameserverPolicy

 需要添加的域名（全部指向海外 DoH）：

 anyrouter.top: https://8.8.8.8/dns-query
 platform.claude.com: https://8.8.8.8/dns-query
 downloads.claude.ai: https://8.8.8.8/dns-query
 statsig.com: https://8.8.8.8/dns-query
 sentry.io: https://8.8.8.8/dns-query

 为什么: 你的 ANTHROPIC_BASE_URL 是 anyrouter.top，Claude Code 每次 API 调用都要解析它。如果走国内 DNS，ISP 看得到。

 B2. 在 profile 的 rules 中添加 anyrouter.top

 在你的 profile 19cfe0a3f20.yaml 的 AI 服务规则区域添加：

 # ==================== AI 服务（核心需求）====================
 - DOMAIN-SUFFIX,anyrouter.top,Proxies          # ← 新增：你的 API 中转
 - DOMAIN-SUFFIX,claude.ai,Proxies
 - DOMAIN-SUFFIX,anthropic.com,Proxies

 B3. 优化 DNS nameserver 配置（推荐）

 当前问题：nameserver 用的是国内 DNS（alidns/doh.pub），非直连域名的初始查询也会先发到国内。

 推荐方案：在 mihomo-party 的 DNS 设置中，将 nameserver 改为海外 DNS，仅在 proxy-server-nameserver 保留国内
 DNS（用于解析代理节点 IP）：

 dns:
   nameserver:
     - https://1.1.1.1/dns-query    # ← 改为海外 DNS
     - https://8.8.8.8/dns-query    # ← 改为海外 DNS
   proxy-server-nameserver:          # 保持国内（用于解析 34.239.230.149）
     - https://doh.pub/dns-query
     - https://dns.alidns.com/dns-query

 注意：这个改动可能让部分国内网站首次访问稍慢（fake-ip 模式下影响极小）。如果不愿改，至少确保 B1 的 nameserver-policy
 覆盖了所有关键域名。

 B4. 开启 strict_route 和 auto-redirect（推荐）

 在 mihomo-party 的 TUN 设置中：
 - strict_route: true — 防止流量绕过 TUN
 - auto-redirect: true — 自动重定向

 B5. 开启 respect-rules（可选）

 在 mihomo-party 的 DNS 设置中：
 - respect-rules: true — DNS 查询也遵守路由规则

 ⚠️  开启后需要确保 proxy-server-nameserver 配置正确，否则可能死循环。

 B6. Sniffer 添加 QUIC（可选）

 在 sniffer 配置中添加 QUIC 嗅探：
 sniffer:
   sniff:
     QUIC:
       ports:
         - 443

 ---
 验证步骤

 改完后按顺序验证：

 # 1. 重载 shell 配置
 source ~/.zshrc

 # 2. 验证环境变量生效
 echo $HTTP_PROXY  # 应输出 http://127.0.0.1:7890

 # 3. 验证 Claude Code 走代理
 curl -v https://anyrouter.top 2>&1 | head -20

 # 4. DNS 泄漏测试（在终端中）
 # fake-ip 模式下应返回 198.18.x.x
 nslookup api.anthropic.com
 nslookup anyrouter.top

 # 5. 抓包验证（终极测试）
 # 开一个新终端窗口，运行 tcpdump 监听 53 端口
 # 如果 TUN+fake-ip 生效，应该看不到任何明文 DNS 查询
 sudo tcpdump -i en0 port 53 -n -c 20

 # 6. 然后在另一个终端启动 Claude Code，进行一次对话
 # 回来看 tcpdump 输出，应该没有到外部 DNS 服务器的流量

 # 7. 在线测试（通过浏览器）
 # 访问 https://browserleaks.com/dns 或 https://ipleak.net

 ---
 风险提醒

 1. Anthropic 封号风险：即使 DNS 不泄漏，Anthropic 仍可能通过 API Key 地理位置、IP 信誉等手段检测。你用的是 anyrouter.top
  中转，风险取决于该中转服务的安全性。
 2. anyrouter.top 中转的安全性：你的 API Key 经过第三方中转，需信任该服务商。建议确认它是否支持 HTTPS。
 3. mihomo-party 更新：mihomo-party 更新可能重置部分配置，建议备份 config.yaml 和 profile。