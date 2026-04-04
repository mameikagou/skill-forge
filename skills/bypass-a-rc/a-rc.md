# A 社（Anthropic）风控检测体系全景分析

> 本文档基于公开信息和社区实测，系统性梳理 Anthropic 对受限地区用户的检测机制。
> 适用于需要从非支持地区安全使用 Claude 服务的开发者。

---

## 一、风控检测体系概览（6 层模型）

Anthropic 的风控是**多维度交叉验证**，不是单一条件触发。可以理解为"风险评分制"——每个维度贡献一定分数，总分超过阈值才会触发封号。

| 层级 | 检测维度 | 风险等级 | 影响范围 |
|------|----------|----------|----------|
| L1 | IP 地址 + IP 类型 | **高危** | CLI + 浏览器 |
| L2 | DNS 泄漏 | 高危 | CLI + 浏览器 |
| L3 | 时区/语言一致性 | **高危** | CLI + 浏览器 |
| L4 | WebRTC 泄漏 | 中危 | 仅浏览器 |
| L5 | 浏览器指纹 | 中危 | 仅浏览器 |
| L6 | 行为模式分析 | 低危 | CLI + 浏览器 |

---

## 二、各层详解

### L1：IP 地址 + IP 类型（最关键）

这是最重要的检测维度。Anthropic 会通过 MaxMind / ip2location 等数据库识别 IP 类型：

| IP 类型 | 来源 | 检测通过率 | 说明 |
|---------|------|-----------|------|
| 住宅 IP (Residential) | ISP 分配给家庭用户 | 85-95% | 最安全 |
| 独占云服务器 EIP（美区） | AWS/GCP/Azure 弹性 IP | 60-80% | 合法开发场景，SSH 远程开发是官方推荐用例 |
| Cloudflare WARP | WARP 出口 IP | 不确定 | 出口 IP 共享，且已知与 `console.anthropic.com` 存在兼容性问题（[GitHub #10050](https://github.com/anthropics/claude-code/issues/10050)） |
| 共享数据中心 IP | 多人共用的云 IP | 20-40% | 在云服务商 ASN 下，但未被黑名单标记 |
| 共享 VPN IP | 商业 VPN 出口（ExpressVPN 等） | 极低 | 多人共用，大概率已被标记 |

**关键区分**：
- **共享 VPN IP**：被数百人同时使用，大量被反欺诈数据库标记，Anthropic 直接拉黑
- **独占云服务器 EIP**：AWS 官方推荐在 EC2 上使用 Claude Code（SSH 开发、CI/CD），Anthropic 不可能封杀整个 AWS IP 段。GitHub `anthropics/claude-code` 仓库中**未找到任何因 AWS 弹性 IP 被封号的 issue**，所有 403 均为 OAuth token 过期或 IAM 配置错误
- **Cloudflare WARP**：此前被社区认为是优质出口方案，但实测发现 WARP 开启后 `console.anthropic.com` 的 Cloudflare 托管挑战会拦截 WARP 流量返回 403（[GitHub #10050](https://github.com/anthropics/claude-code/issues/10050)、[#9885](https://github.com/anthropics/claude-code/issues/9885)）。且 WARP 出口 IP 是共享的，多人使用同一出口可能触发风控
- **风险组合**：单独的数据中心 IP 风险可控，但如果叠加"非英文时区 + 中文语言"则风险显著升高

**注意**：VLESS+Reality 等抗 DPI 协议只解决"ISP 看不到你在用代理"的问题，但 Anthropic 端看到的出口 IP 类型不变。这是两个不同层面的问题。

### L2：DNS 泄漏

即使代理配置正确，DNS 请求可能绕过代理直接发送到本地 ISP 的 DNS 服务器，从而暴露真实地理位置。

**检测方式**：Anthropic 可以通过嵌入特殊子域名追踪 DNS 解析路径。

**常见泄漏场景**：
- 系统 DNS 未被代理接管
- 浏览器 Secure DNS 指向国内 DoH
- 部分应用绕过系统代理直接解析

### L3：时区/语言一致性（即时封号信号）

Anthropic 通过以下方式获取时区和语言信息：

**浏览器端**：
```javascript
Intl.DateTimeFormat().resolvedOptions().timeZone  // 系统时区
new Date().getTimezoneOffset()                     // UTC 偏移
navigator.language                                  // 首选语言
navigator.languages                                 // 语言列表
```

**CLI 端**：
- Node.js 进程的 `process.env.TZ` 和系统 locale
- HTTP `Accept-Language` header
- 遥测数据（如未关闭）

**判定逻辑**：如果 IP 显示在美国，但时区是 `Asia/Shanghai`、语言是 `zh-CN`，这是**即时封号信号**。

### L4：WebRTC 泄漏（仅浏览器）

WebRTC 是浏览器内置的 P2P 通信协议，会通过 STUN 请求获取真实本地 IP 和公网 IP，**即使 VPN/代理已开启**。

- **CLI 不受影响**：WebRTC 是纯浏览器技术
- **浏览器受影响**：如果在浏览器中使用 claude.ai，WebRTC 泄漏会暴露真实 IP

### L5：浏览器指纹（仅浏览器）

以下信息组成唯一指纹：
- Canvas / WebGL 渲染指纹
- 系统字体列表（中文字体如宋体、微软雅黑是强特征）
- 屏幕分辨率
- 插件列表
- 硬件并发数等

**CLI 不受影响**。

### L6：行为模式分析

- **登录时间**：是否与 IP 所在时区一致（如美东 IP 却在美东凌晨 3 点频繁活跃）
- **使用频率**：异常高频使用
- **设备数量**：多设备同时登录
- **对话语言**：中文对话不是直接封号原因，但会提高风险评分

---

## 三、CLI vs 浏览器 风险对比

| 检测维度 | Claude Code CLI | claude.ai 浏览器 |
|----------|----------------|-------------------|
| IP 地址 | 走代理即可 | 走代理即可 |
| IP 类型 | 取决于出口节点 | 取决于出口节点 |
| DNS | 需要正确配置 | 需要正确配置 |
| 时区 | Node.js 可读取系统时区 | JS 可读取系统时区 |
| 语言 | Accept-Language header | navigator.language |
| WebRTC | **不适用** | 可能暴露 |
| 浏览器指纹 | **不适用** | 暴露 |
| 遥测 | 可关闭 | 无法完全控制 |

**结论**：CLI 的攻击面显著小于浏览器，只需关注 IP、DNS、时区、语言四个维度。

---

## 四、支付环节风控

| 支付方式 | 安全性 | 原因 |
|----------|--------|------|
| Apple Gift Card + 美区 Apple ID + iOS IAP | **最安全** | Anthropic 只看到 Apple 支付通知，无银行卡地理信息 |
| 美国虚拟信用卡 | 较安全 | 账单地址可伪造，但卡 BIN 可能暴露发卡行 |
| 国内信用卡 | **危险** | 银行卡 BIN 直接暴露中国发卡行 |

---

## 五、封号后果

- **永久封禁**，无法解封
- Pro/Max 订阅费用自动退款到原支付方式
- 申诉成功率极低（受限地区用户几乎为零）
- 所有对话历史丢失

---

## 六、政策趋势

- **2025.9**：Anthropic 显著加强地区限制，从"IP 检测"扩展到"所有权结构检测"
- **2025.11**：大批量封号潮
- **趋势**：越来越严格，不是放松

---

## 七、参考来源

- Anthropic 支持的国家和地区列表（官方）
- [Claude Code 403 问题讨论（GitHub #30318）](https://github.com/anthropics/claude-code/issues/30318)
- [WARP 与 Claude Code 兼容性问题（GitHub #10050）](https://github.com/anthropics/claude-code/issues/10050)
- [Cloudflare 验证导致无法登录（GitHub #9885）](https://github.com/anthropics/claude-code/issues/9885)
- [SSH 远程连接 403（GitHub #21904）](https://github.com/anthropics/claude-code/issues/21904)
- [AWS Guidance for Claude Code with Bedrock（官方）](https://aws.amazon.com/solutions/guidance/claude-code-with-amazon-bedrock/)
- [claude-ip-guard 工具](https://github.com/cso1z/claude-ip-guard)
- VLESS+Reality+WARP 叠加方案（社区实测）
- 住宅 IP vs 数据中心 IP 对比分析
