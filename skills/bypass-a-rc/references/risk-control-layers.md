# Anthropic 风控检测体系 — 详细参考

## L1：IP 地址 + IP 类型

### 检测原理
Anthropic 通过 MaxMind / ip2location 等 GeoIP 数据库查询用户出口 IP 的类型标签：
- **ISP (Residential)**：住宅 IP，由 ISP 分配给家庭宽带用户
- **DCH (Data Center Hosting)**：数据中心 IP，由云服务商分配
- **VPN/Proxy**：已知 VPN 出口 IP，通常被标记在黑名单中

### IP 类型通过率
| 类型 | 通过率 | 说明 |
|------|--------|------|
| 住宅 IP | 85-95% | 最安全，ISP 分配 |
| 独占云服务器 EIP（美区） | 60-80% | AWS/GCP 弹性 IP，SSH 远程开发是官方推荐用例。GitHub 上无因 AWS EIP 被封号的 issue |
| Cloudflare WARP | 不确定 | 出口 IP 共享，且已知与 Claude Code 存在兼容性问题（见下方警告） |
| 共享数据中心 IP | 20-40% | 在云服务商 ASN 下，多人共用但未被黑名单标记 |
| 共享 VPN IP | 极低 | 多人共用，大概率已被标记 |

### 关于 AWS 美区弹性 IP 的安全性

AWS 官方与 Anthropic 深度合作，提供了 [Guidance for Claude Code with Amazon Bedrock](https://aws.amazon.com/solutions/guidance/claude-code-with-amazon-bedrock/) 方案，推荐在 EC2 上部署开发环境。大量开发者合法从 EC2 通过 SSH 使用 Claude Code，Anthropic 不可能封杀整个 AWS IP 段。

搜索 GitHub `anthropics/claude-code` 仓库的所有 403 相关 issue，**未找到任何因 AWS 弹性 IP 被封号的案例**。所有 403 错误均为 OAuth token 过期、IAM 权限配置错误或地区限制导致。

**结论**：独占 AWS 美区弹性 IP + 正确的时区/语言/DNS 配置 = **低风险**，是 CLI 用户的推荐方案。

### WARP 叠加方案（有已知问题，谨慎使用）

在代理服务器上安装 Cloudflare WARP，让出口流量通过 WARP 转发：

```
用户设备 -> 代理客户端 -> 代理服务器 -> WARP -> Anthropic
```

Anthropic 看到的出口 IP 变为 Cloudflare IP。

> **已知问题（2025 年实测）**：
> - [GitHub #10050](https://github.com/anthropics/claude-code/issues/10050)：Cloudflare WARP 开启后 Claude Code 无法工作，`console.anthropic.com` 的 Cloudflare 托管挑战拦截 WARP 流量返回 403
> - [GitHub #9885](https://github.com/anthropics/claude-code/issues/9885)：Claude Code 在 Cloudflare 验证页面无法完成登录
> - WARP 出口 IP 是共享的（非独占），多人使用同一出口可能触发风控
>
> **建议**：如果你已有独占的美区云服务器 EIP 且时区/语言配置正确，**不建议叠加 WARP**，反而可能引入问题。WARP 主要适用于没有独占 IP 的场景。

---

## L2：DNS 泄漏

### 检测原理
即使 HTTP 流量走了代理，DNS 查询可能绕过代理直接发往本地 ISP DNS，暴露真实地理位置。

### 常见泄漏路径
1. **系统 DNS 未被代理接管**：操作系统直接查询 `/etc/resolv.conf` 中的 DNS
2. **浏览器 Secure DNS**：Chrome 的 DoH 可能指向国内服务器
3. **应用级 DNS**：部分应用自行解析，不走系统代理

### 防护方案
- **fake-ip 模式**：代理工具劫持所有 DNS 查询，返回虚假 IP（如 198.18.x.x），实际解析在代理服务器端完成
- **nameserver-policy**：为特定域名指定 DNS 服务器
- **TUN 模式 + strict_route**：在网络层拦截所有流量，包括 DNS

---

## L3：时区/语言一致性

### 浏览器端检测
```javascript
// Anthropic 可通过以下 JS API 获取
Intl.DateTimeFormat().resolvedOptions().timeZone  // "Asia/Shanghai"
new Date().getTimezoneOffset()                     // -480 (UTC+8)
navigator.language                                  // "zh-CN"
navigator.languages                                 // ["zh-CN", "zh"]
```

### CLI 端检测
- `process.env.TZ` — Node.js 读取的时区环境变量
- `Accept-Language` HTTP header — 由 LANG/LC_ALL 影响
- 遥测数据中的系统信息（如未关闭遥测）

### 致命组合
IP 在美国 + 时区 `Asia/Shanghai` + 语言 `zh-CN` = **即时封号信号**

### 修复方法

**CLI（仅终端环境）**：
```bash
# 添加到 ~/.zshrc 或 ~/.bashrc
export TZ=America/New_York      # 匹配 IP 所在时区
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
```

**系统级（影响 GUI）**：
```bash
# macOS
sudo systemsetup -settimezone America/New_York
# Linux
sudo timedatectl set-timezone America/New_York
```

---

## L4：WebRTC 泄漏

### 检测原理
WebRTC 的 STUN 请求会绕过代理，直接获取：
- 本地局域网 IP（如 192.168.x.x）
- 真实公网 IP

### 仅影响浏览器
CLI 不涉及 WebRTC，无需处理。

### 浏览器防护
| 浏览器 | 方法 |
|--------|------|
| Chrome | 安装 WebRTC Leak Shield 扩展，或 uBlock Origin 勾选防护选项 |
| Firefox | `about:config` 设置 `media.peerconnection.enabled = false` |
| Safari | 默认较安全，可在 Develop 菜单中进一步关闭 ICE candidates |

---

## L5：浏览器指纹

### 组成要素
- Canvas 渲染指纹
- WebGL 渲染指纹
- 系统字体列表（中文字体如宋体、微软雅黑是强特征）
- 屏幕分辨率和 DPI
- 已安装插件列表
- 硬件并发数（navigator.hardwareConcurrency）

### 仅影响浏览器
CLI 不发送任何浏览器指纹。

### 防护建议
- 使用专用浏览器 Profile，不安装中文扩展
- 可选：Canvas Fingerprint Defender 扩展
- 高级：使用反指纹浏览器（AdsPower、Multilogin）

---

## L6：行为模式分析

### 检测信号
| 信号 | 风险 | 说明 |
|------|------|------|
| 登录时间与 IP 时区不一致 | 中 | 美东凌晨 3 点频繁活跃 |
| 异常高频使用 | 低-中 | 远超正常开发者使用量 |
| 多设备同时登录 | 低 | 可能被判为账号共享 |
| 对话语言为中文 | 低 | 不直接触发，但增加风险评分 |

### 建议
- 尽量在 IP 对应时区的白天时间使用
- 固定使用一个代理节点，不频繁切换
- 固定设备数量

---

## 支付安全

| 方式 | 安全性 | 原因 |
|------|--------|------|
| Apple Gift Card + 美区 Apple ID + iOS IAP | 最安全 | Anthropic 只看到 Apple 通知，无银行卡信息 |
| 美国虚拟信用卡 | 较安全 | 账单地址可伪造，但 BIN 可能暴露发卡行 |
| 国内信用卡 | 危险 | BIN 直接暴露中国发卡行 |

---

## 封号后果

- 永久封禁，无法解封
- 订阅费用退款到原支付方式
- 申诉成功率极低
- 所有对话历史丢失

## 政策趋势

- 2025.9：加强地区限制，扩展到"所有权结构检测"
- 2025.11：大批量封号潮
- 趋势：持续收紧
