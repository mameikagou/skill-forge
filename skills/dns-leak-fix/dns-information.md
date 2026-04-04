# DNS 泄漏防护指南：在中国大陆安全使用 Claude Code

## 什么是 DNS 泄漏？

当你通过代理（如 mihomo + 3x-ui）访问 Claude Code 时，你以为所有流量都走了代理，但实际上 **DNS 查询可能绕过代理，以明文形式直接发送到你的 ISP**。这就是 DNS 泄漏。

打个比方：你戴着面具去寄信（代理），但寄信前先大声喊了一句"我要找 api.anthropic.com 的地址！"（DNS 查询）——旁边所有人都听到了。面具白戴了。

### DNS 泄漏的后果

1. **ISP/GFW 可见**：你的网络运营商能看到你在解析 `api.anthropic.com`、`claude.ai` 等域名
2. **暴露网络意图**：即使数据加密了，DNS 查询泄漏了你要访问什么
3. **账号风险**：Anthropic 2026 年 3 月对中国区域进行了大规模封号

---

## Claude Code 的网络行为

### 必连域名

| 域名 | 用途 | 是否可关闭 |
|------|------|-----------|
| `api.anthropic.com` | Claude API 核心端点 | 不可 |
| `claude.ai` | OAuth 认证 | 不可 |
| `platform.claude.com` | Console 认证 | 不可 |
| `downloads.claude.ai` | 版本检查/更新 | 不可 |
| `statsig.com` | 遥测指标 | 可关 |
| `sentry.io` | 错误上报 | 可关 |

### 为什么 Claude Code 容易泄漏 DNS？

- Claude Code 是 **Node.js 应用**，使用 Node.js 内置 DNS 解析器
- Node.js DNS 默认走 **系统 DNS**（`/etc/resolv.conf` 或 macOS 的 `scutil --dns`）
- Node.js 原生 `fetch()` API **不自动遵守** `HTTP_PROXY` 环境变量
- Claude Code **不自动继承**系统代理设置，需要手动配置

### 代理支持情况

- 支持：`HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY`、`NO_PROXY`
- 支持：基本认证（`user:pass@proxy`）
- 支持：自定义 CA 证书（`NODE_EXTRA_CA_CERTS`）
- **不支持：SOCKS 代理**（重要！）

---

## DNS 泄漏的三个层面

### 1. 应用层泄漏（Claude Code 自身）

Node.js 直接调用系统 DNS 解析 `api.anthropic.com` → 查询明文发送到 ISP DNS → **泄漏**

### 2. 代理层泄漏（mihomo 配置不当）

mihomo 使用 `redir-host` 或没有正确配置 `fake-ip` → 本地 DNS 先解析再走代理 → **泄漏**

### 3. 系统层泄漏（操作系统行为）

macOS 的 `mDNSResponder` 或 Linux 的 `systemd-resolved` 绕过代理直接查询 DNS → **泄漏**

---

## 完整防泄漏方案

### 方案对比

| 方案 | DNS 泄漏防护等级 | 复杂度 | 推荐场景 |
|------|----------------|--------|---------|
| 仅 `HTTP_PROXY` 环境变量 | 低（DNS 仍走本地） | 低 | 临时使用 |
| mihomo 系统代理（无 TUN） | 中（部分应用可绕过） | 中 | 浏览器为主 |
| mihomo TUN + fake-ip | 高（系统级拦截） | 中 | **推荐方案** |
| mihomo TUN + fake-ip + HTTP_PROXY | 最高（双保险） | 中高 | **终极方案** |

### 核心防线：mihomo TUN + fake-ip

推荐使用 TUN 模式 + fake-ip，这是最彻底的方案。

```yaml
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

# DNS 配置（极简防泄漏）
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
```

#### 原理解释

- **fake-ip 模式**：当应用请求解析 `api.anthropic.com` 时，mihomo 不会真的去查 DNS，而是立刻返回一个假 IP（如 `198.18.x.x`）。应用用这个假 IP 发起连接，mihomo 拦截后根据域名规则走代理。全程无真实 DNS 查询泄漏。
- **dns-hijack: any:53**：即使有应用试图直接向系统 DNS 发查询（绕过代理），TUN 也会劫持这些 53 端口的流量。
- **strict_route: true**：防止流量绕过 TUN 接口。

### 终端环境变量配置（双保险）

在 `~/.zshrc` 中添加：

```bash
# ===== DNS 防泄漏：Claude Code 代理配置 =====
export HTTP_PROXY=http://127.0.0.1:7890
export HTTPS_PROXY=http://127.0.0.1:7890
export ALL_PROXY=http://127.0.0.1:7890
export NO_PROXY=localhost,127.0.0.1,::1,192.168.0.0/16,10.0.0.0/8,172.16.0.0/12

# 关闭 Claude Code 非必要网络请求
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
export DISABLE_TELEMETRY=1
export DISABLE_ERROR_REPORTING=1
```

> 即使开了 TUN 模式，也建议同时设置这些环境变量。部分 Node.js 版本的 `fetch()` 可能不完全走系统路由，双保险更安全。

### 3x-ui 服务端配置建议

在 AWS 节点的 3x-ui 面板中：

1. **协议选择**：VLESS + Reality + Vision（最抗检测）
2. **开启 Sniffing**：从 TLS ClientHello 中提取真实目标域名，避免在服务端做额外 DNS 查询
3. **服务端 DNS**：在 VPS 上使用 Cloudflare DoH 或安装 Unbound，确保解析不走中国 DNS

### macOS Desktop App 额外配置

macOS LaunchAgent 不继承 shell 环境变量，需要额外设置：

```bash
launchctl setenv HTTP_PROXY http://127.0.0.1:7890
launchctl setenv HTTPS_PROXY http://127.0.0.1:7890
launchctl setenv ALL_PROXY http://127.0.0.1:7890
```

---

## 验证 DNS 是否泄漏

```bash
# 1. 检查 DNS 解析是否走代理（fake-ip 模式下应返回 198.18.x.x）
nslookup api.anthropic.com

# 2. 用 curl 测试是否走代理
curl -v https://api.anthropic.com 2>&1 | grep "Connected to"

# 3. 在线 DNS 泄漏测试（通过代理访问）
# 浏览器打开：https://www.dnsleaktest.com 或 https://ipleak.net

# 4. 抓包确认（终极验证）
# 用 Wireshark 或 tcpdump 监控网卡，过滤 port 53
# 如果 TUN+fake-ip 生效，应该看不到任何明文 DNS 查询
sudo tcpdump -i en0 port 53 -n -c 20
```

---

## 常见踩坑

### SOCKS 代理的坑

Claude Code **不支持 SOCKS 代理**。如果你之前用的是 `socks5://127.0.0.1:7891`，必须改用 mihomo 的 `mixed-port`（HTTP 代理）。

### socks5:// vs socks5h:// 的区别

`socks5://` 时 DNS 在本地解析（泄漏！），`socks5h://` 才会把 DNS 查询通过代理发送。但这对 Claude Code 不适用，因为它不支持 SOCKS。

### IPv6 泄漏

如果系统启用了 IPv6，DNS 查询可能通过 IPv6 绕过代理。建议在 mihomo 中设置 `ipv6: false`。

### macOS mDNSResponder 后台查询

macOS 的 `mDNSResponder` 服务会在后台做各种 DNS 查询。没开 TUN 的话，这些查询会直接泄漏。TUN 模式的 `dns-hijack` 可以拦截它们。

### Node.js fetch 环境变量的坑

Node.js 18+ 的原生 `fetch()` 早期版本不认 `HTTP_PROXY`。较新版本（22+）已改进，但仍可能有兼容性问题。TUN 模式可以兜底。

### Anthropic 封号风险

即使解决了 DNS 泄漏，Anthropic 仍可能通过其他手段检测（如 API Key 绑定的 IP 地理位置）。建议 AWS 节点选择美国/日本等受支持地区的出口 IP。

---

## 已知安全漏洞

**CVE-2025-55284**（CVSS 7.1 High）：攻击者可通过 prompt injection 诱导 Claude Code 用 `ping`/`nslookup`/`dig`/`host` 命令将本地敏感文件（如 `.env`、API Key）通过 DNS 查询外泄。已在 v1.0.4+（2025 年 6 月）修复。

---

## 参考来源

- Claude Code 企业网络配置文档
- Claude Code macOS 代理问题 #30318
- mihomo DNS 配置文档
- mihomo 极简防 DNS 泄漏配置
- Claude 账号封禁防护指南 2026
