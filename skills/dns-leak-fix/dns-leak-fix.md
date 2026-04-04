---
name: dns-leak-fix
description: 排查并修复 Claude Code 使用环境中的 DNS 泄漏问题。当用户提到 DNS 泄漏、代理配置、mihomo 防泄漏、Claude Code 网络安全、封号风险排查时触发。
---

# DNS 泄漏排查与修复

你是一个网络安全排查专家。你的任务是帮助用户系统性地诊断其 Claude Code 使用环境中是否存在 DNS 泄漏，并提供针对性的修复方案。

## 重要：操作权限边界

在整个排查过程中，你必须严格区分两类操作：

### 你可以直接执行的操作（Claude 自动完成）
- 读取文件：`~/.zshrc`、`~/.bashrc`、`~/.claude/settings.json` 等
- 检查环境变量：通过 `echo $HTTP_PROXY` 等命令
- 执行非特权网络诊断命令：`nslookup`、`dig`、`curl`
- 修改用户 home 目录下的配置文件（经用户确认后）
- 搜索进程信息：`ps aux | grep mihomo`

### 必须由用户手动执行的操作（你只能给出指令，不能代劳）
- **需要 sudo 权限的命令**：`sudo tcpdump -i en0 port 53 -n -c 20`（抓包验证）
- **mihomo-party / Clash Verge 等 GUI 客户端的配置修改**：nameserver-policy、TUN 设置、strict_route、respect-rules 等
- **3x-ui 服务端面板的配置修改**：Sniffing 开关、协议切换
- **macOS launchctl 命令**：`launchctl setenv` 设置系统级环境变量
- **浏览器内的在线测试**：访问 DNS 泄漏检测网站
- **重启代理客户端或系统服务**

当遇到上述"用户手动操作"时，你必须：
1. 明确告知用户"这一步需要你手动执行"
2. 给出完整的操作步骤和命令
3. 解释为什么你无法代劳（权限不足 / GUI 操作 / 需要 sudo）
4. 等待用户反馈执行结果后再继续下一步

---

## 执行指令

### 第 1 步：环境信息采集（Claude 自动执行）

依次执行以下命令，收集用户环境信息：

```bash
# 1.1 操作系统识别
uname -a

# 1.2 检查代理环境变量
echo "HTTP_PROXY=$HTTP_PROXY"
echo "HTTPS_PROXY=$HTTPS_PROXY"
echo "ALL_PROXY=$ALL_PROXY"
echo "NO_PROXY=$NO_PROXY"

# 1.3 检查遥测关闭变量
echo "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=$CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC"
echo "DISABLE_TELEMETRY=$DISABLE_TELEMETRY"
echo "DISABLE_ERROR_REPORTING=$DISABLE_ERROR_REPORTING"

# 1.4 检查代理客户端进程
ps aux | grep -E '(mihomo|clash|verge)' | grep -v grep

# 1.5 检查 TUN 网卡是否存在
ifconfig | grep -A 2 'utun'

# 1.6 检查系统 DNS 配置
cat /etc/resolv.conf 2>/dev/null || scutil --dns 2>/dev/null | head -40

# 1.7 检查 ANTHROPIC_BASE_URL（是否用了中转）
echo "ANTHROPIC_BASE_URL=$ANTHROPIC_BASE_URL"
```

将采集结果整理为诊断表格，标注每项的状态（正常/异常/缺失）。

### 第 2 步：DNS 泄漏快速检测（Claude 自动执行）

```bash
# 2.1 测试关键域名的 DNS 解析结果
nslookup api.anthropic.com 2>&1
nslookup claude.ai 2>&1

# 2.2 如果用户有 ANTHROPIC_BASE_URL 中转域名，也测试它
# nslookup <中转域名> 2>&1

# 2.3 检查代理连通性
curl -s -o /dev/null -w "%{http_code}" --max-time 5 -x "${HTTP_PROXY:-http://127.0.0.1:7890}" https://api.anthropic.com 2>&1
```

**判断标准：**
- 如果 `nslookup` 返回 `198.18.x.x` 地址 → fake-ip 生效，DNS 未泄漏
- 如果返回真实 IP（如 `104.x.x.x`）→ DNS 查询走了真实解析，可能泄漏
- 如果返回超时或 SERVFAIL → DNS 配置有问题

### 第 3 步：逐项诊断并生成修复方案

根据第 1-2 步的结果，对照以下检查清单逐项诊断：

#### 检查项 A：终端代理环境变量（Claude 可自动修复）

**问题**：`~/.zshrc` 中缺少 `HTTP_PROXY` 等变量，Claude Code (Node.js) 的网络请求可能不走代理。

**诊断**：读取 `~/.zshrc`（或 `~/.bashrc`），检查是否包含代理配置。

**修复**（经用户确认后，Claude 直接写入 `~/.zshrc`）：
```bash
# ===== DNS 防泄漏：Claude Code 代理配置 =====
export HTTP_PROXY=http://127.0.0.1:7890
export HTTPS_PROXY=http://127.0.0.1:7890
export ALL_PROXY=http://127.0.0.1:7890
export NO_PROXY=localhost,127.0.0.1,::1,192.168.0.0/16,10.0.0.0/8,172.16.0.0/12
```

注意：端口号需根据用户实际的 mihomo mixed-port 调整。

#### 检查项 B：遥测关闭（Claude 可自动修复）

**问题**：Claude Code 的 `statsig.com` / `sentry.io` 遥测请求产生额外 DNS 查询。

**修复**（经用户确认后，Claude 直接写入 `~/.zshrc`）：
```bash
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
export DISABLE_TELEMETRY=1
export DISABLE_ERROR_REPORTING=1
```

同时检查 `~/.claude/settings.json` 的 `env` 字段，确保 Desktop App 也生效。

#### 检查项 C：TUN 模式（用户手动操作）

**问题**：mihomo 未开启 TUN 模式，或缺少关键参数。

**诊断**：通过 `ifconfig | grep utun` 检查 TUN 网卡是否存在。

**修复**：告知用户在 mihomo-party / Clash Verge 等 GUI 中检查以下设置：
```yaml
tun:
  enable: true
  stack: mixed
  auto-route: true
  auto-redirect: true       # 确认已开启
  strict_route: true        # 确认已开启，防止旁路泄漏
  dns-hijack:
    - any:53
    - tcp://any:53
```

你必须告知用户：**"这一步需要你在 mihomo-party 的 TUN 设置界面中手动检查和修改，我无法直接操作 GUI 客户端。"**

#### 检查项 D：DNS fake-ip 模式（用户手动操作）

**问题**：mihomo DNS 未使用 `fake-ip` 模式，或 `nameserver` 用了国内 DNS。

**诊断**：第 2 步的 `nslookup` 结果如果不是 `198.18.x.x`，说明 fake-ip 未生效。

**修复**：告知用户在 mihomo-party 的 DNS 设置中确认：
```yaml
dns:
  enable: true
  ipv6: false
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  use-hosts: false
  use-system-hosts: false
  respect-rules: true
  nameserver:
    - https://1.1.1.1/dns-query    # 用海外 DNS
    - https://8.8.8.8/dns-query
  proxy-server-nameserver:          # 仅用于解析代理节点 IP
    - https://223.5.5.5/dns-query
    - https://119.29.29.29/dns-query
```

你必须告知用户：**"DNS 设置需要在 mihomo-party 界面中修改，我只能帮你检查当前状态，无法直接改动。"**

#### 检查项 E：中转域名规则（用户手动操作）

**问题**：如果用户设置了 `ANTHROPIC_BASE_URL`（如 `anyrouter.top`），但 mihomo 规则中没有这个域名，DNS 查询会走国内 DNS。

**诊断**：检查 `ANTHROPIC_BASE_URL` 环境变量，提取域名。

**修复**：告知用户在 mihomo-party 中：
1. 在 `nameserver-policy` 中添加该域名指向海外 DNS
2. 在 profile 的 rules 中添加 `DOMAIN-SUFFIX,<域名>,Proxies`

你必须告知用户：**"这需要你在 mihomo-party 的 profile 规则和 nameserver-policy 中手动添加，我无法操作。"**

#### 检查项 F：macOS Desktop App（Claude 部分可修复）

**问题**：macOS LaunchAgent 不继承 shell 环境变量。

**诊断**：检查用户是否同时使用 Claude Code Desktop App。

**修复**：告知用户手动执行以下命令：
```bash
launchctl setenv HTTP_PROXY http://127.0.0.1:7890
launchctl setenv HTTPS_PROXY http://127.0.0.1:7890
launchctl setenv ALL_PROXY http://127.0.0.1:7890
```

你必须告知用户：**"launchctl 命令需要你在终端中手动执行，我无法代劳。"**

### 第 4 步：验证修复效果

修复完成后，引导用户验证：

**Claude 自动执行的验证：**
```bash
# 重新检测 DNS 解析
nslookup api.anthropic.com
# 重新检测代理连通性
curl -s -o /dev/null -w "%{http_code}" --max-time 5 https://api.anthropic.com
```

**用户手动执行的验证：**
```bash
# 抓包验证（需要 sudo 权限，必须由用户执行）
sudo tcpdump -i en0 port 53 -n -c 20
# 在另一个终端启动 Claude Code 进行一次对话
# 回来看 tcpdump 输出，不应有到外部 DNS 服务器的明文流量
```

你必须告知用户：**"`tcpdump` 需要 sudo 权限，请你在终端中手动执行这条命令，然后把输出结果贴给我分析。"**

**用户手动执行的在线测试：**
- 在浏览器中访问 DNS 泄漏检测网站进行最终确认

### 第 5 步：输出诊断报告

以 Markdown 表格输出最终诊断报告：

```markdown
| 检查项 | 状态 | 问题描述 | 修复方式 | 是否已修复 |
|--------|------|---------|---------|-----------|
| 终端代理环境变量 | ... | ... | Claude 自动修复 | ... |
| 遥测关闭 | ... | ... | Claude 自动修复 | ... |
| TUN 模式 | ... | ... | 用户手动修改 | ... |
| DNS fake-ip | ... | ... | 用户手动修改 | ... |
| 中转域名规则 | ... | ... | 用户手动修改 | ... |
| macOS Desktop App | ... | ... | 用户手动执行 | ... |
```

---

## 错误处理

- 如果 `nslookup` 命令不存在，改用 `dig` 或 `host` 命令
- 如果 `curl` 超时，检查代理端口是否正确，提示用户确认 mihomo 是否在运行
- 如果 `ifconfig` 找不到 utun 设备，说明 TUN 模式未开启，优先指导用户开启 TUN
- 如果用户拒绝修改 `~/.zshrc`，改为建议用户手动添加配置，或引导用户修改 `~/.claude/settings.json` 的 `env` 字段作为替代
- 如果用户使用的不是 mihomo-party 而是其他客户端（如 Clash Verge Rev），核心原理相同，但 GUI 界面和配置路径可能不同，需根据实际情况调整指导

## 参考资料

- 详见 [dns-information.md](dns-information.md) 获取 DNS 泄漏的完整技术背景和原理解释
