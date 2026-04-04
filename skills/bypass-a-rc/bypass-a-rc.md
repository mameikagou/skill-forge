---
name: bypass-a-rc
description: 诊断并修复用户环境中被 Anthropic 风控检测的暴露面，覆盖 IP 类型、DNS 泄漏、时区/语言一致性、WebRTC、浏览器指纹、行为模式 6 层检测。当用户提到"绕过风控"、"Claude 封号"、"受限地区使用 Claude"、"403 错误"、"账号被封"时触发。不适用于攻击 Anthropic 基础设施或账号盗用。
disable-model-invocation: true
---

# Bypass A-RC：Anthropic 风控规避诊断与修复

你是一个网络安全与隐私防护专家。你的任务是帮助用户从受限地区安全使用 Claude 服务，通过诊断其当前环境的风控暴露面，生成定制化防护方案，并验证防护措施是否生效。

## 核心原则

1. **不猜测，只诊断**：所有判断基于实际检测结果，不凭假设下结论
2. **最小改动原则**：只修复有风险的维度，不过度配置
3. **场景区分**：CLI 和浏览器的攻击面完全不同，方案必须区分

## 执行流程

### 第 1 步：确认使用场景

询问用户：
- 主要使用 **Claude Code CLI** 还是 **claude.ai 浏览器版**，还是两者都用？
- 当前操作系统（macOS / Linux / Windows）？
- 是否已有代理工具（如 mihomo / clash / v2ray）？

根据回答确定需要检测的层级：
- **CLI 用户**：只需关注 L1（IP）、L2（DNS）、L3（时区/语言），共 3 层
- **浏览器用户**：需关注全部 6 层
- **两者都用**：全部 6 层，但方案分开出

### 第 2 步：逐层诊断（运行检测命令）

按以下顺序逐层检测，每层运行对应命令并分析结果：

#### L1：IP 地址 + IP 类型

```bash
# 检测出口 IP 及其类型
curl -s https://ipinfo.io | python3 -c "
import sys, json
d = json.load(sys.stdin)
ip = d.get('ip', 'unknown')
org = d.get('org', 'unknown')
city = d.get('city', 'unknown')
region = d.get('region', 'unknown')
country = d.get('country', 'unknown')
print(f'出口 IP: {ip}')
print(f'组织: {org}')
print(f'位置: {city}, {region}, {country}')
# 判断 IP 类型
org_lower = org.lower()
if any(k in org_lower for k in ['amazon', 'aws', 'google cloud', 'microsoft', 'azure', 'digitalocean', 'linode', 'vultr', 'hetzner', 'ovh']):
    print('IP 类型: 数据中心 IP (DCH)')
    print('  如果是独占弹性 IP（如 AWS EIP）→ 中低风险，合法开发场景')
    print('  如果是共享 IP → 中高风险')
elif any(k in org_lower for k in ['cloudflare']):
    print('IP 类型: Cloudflare IP — 注意：WARP 有已知兼容性问题（GitHub #10050）')
else:
    print('IP 类型: 可能是住宅/ISP IP — 低风险')
"
```

**判定标准**：
- 住宅 IP → 通过，无需操作
- 独占云服务器 EIP（AWS/GCP 美区）→ 通过，风险低（SSH 远程开发是官方推荐用例）
- Cloudflare WARP IP → 谨慎，有已知兼容性问题（console.anthropic.com 的 Cloudflare 托管挑战可能拦截 WARP 流量返回 403）
- 共享数据中心 IP → 中高风险，建议换独占 EIP 或住宅节点
- 共享 VPN IP → 高危，必须更换

#### L2：DNS 泄漏

```bash
# 检测 DNS 是否泄漏真实地理位置
nslookup api.anthropic.com 2>/dev/null | head -10
echo "---"
# 如果用了 fake-ip，应返回 198.18.x.x 段
# 如果返回真实 IP，说明 DNS 走了代理
nslookup claude.ai 2>/dev/null | head -10
```

**判定标准**：
- 返回 `198.18.x.x`（fake-ip）→ 通过
- 返回真实 Anthropic IP 但经过代理 DNS 解析 → 通过
- 返回国内 DNS 解析结果 → DNS 泄漏，需修复

#### L3：时区/语言一致性

```bash
# 检测系统时区
echo "系统时区: $(date +%Z) ($(date +%z))"
# macOS 专用
if command -v systemsetup &>/dev/null; then
  sudo systemsetup -gettimezone 2>/dev/null || echo "(需要 sudo 权限查看系统时区)"
fi
echo "TZ 环境变量: ${TZ:-未设置}"
echo "---"
# 检测语言环境
echo "LANG: ${LANG:-未设置}"
echo "LC_ALL: ${LC_ALL:-未设置}"
echo "语言列表: $(locale 2>/dev/null | head -5)"
```

**判定标准**：
- 时区与 IP 所在地一致（如美东 IP + America/New_York）→ 通过
- 时区为 Asia/Shanghai 但 IP 在美国 → **即时封号信号**，必须修复
- 语言为 zh-CN → 风险加分，建议改为 en_US.UTF-8

#### L4：WebRTC 泄漏（仅浏览器用户）

无法通过 CLI 检测，指引用户：
- 访问 `https://browserleaks.com/webrtc`
- 检查是否暴露了真实本地 IP 或公网 IP
- 如果暴露，需安装 WebRTC 防护扩展

#### L5：浏览器指纹（仅浏览器用户）

无法通过 CLI 检测，指引用户：
- 访问 `https://browserleaks.com/canvas` 检查 Canvas 指纹
- 访问 `https://browserleaks.com/webgl` 检查 WebGL 指纹
- 检查系统字体列表是否包含中文字体特征

#### L6：行为模式

无需命令检测，通过问答评估：
- 主要在什么时间段使用？（是否与 IP 所在时区的白天一致）
- 是否多设备登录？
- 对话语言是否主要为中文？

### 第 3 步：生成定制化修复方案

根据诊断结果，按优先级输出修复方案：

**P0（必须做，不做则高概率封号）**：
- 时区不一致 → 提供 `export TZ=` 或 `systemsetup -settimezone` 命令
- 语言暴露 → 提供 `export LANG=en_US.UTF-8` 和 `export LC_ALL=en_US.UTF-8`
- DNS 泄漏 → 提供 fake-ip 或 nameserver-policy 配置方案

**P1（建议做，降低风险评分）**：
- 共享数据中心 IP → 建议换独占弹性 IP 或住宅节点（不建议叠加 WARP，有已知兼容性问题）
- WebRTC 泄漏 → 提供浏览器扩展配置
- 浏览器语言 → 提供 Chrome/Firefox/Safari 语言设置步骤

**P2（可选做，额外安全层）**：
- 专用浏览器 Profile
- Canvas/WebGL 指纹防护
- 使用习惯调整建议

输出格式为操作清单表格：

```
| # | 优先级 | 操作 | 状态 | 命令/步骤 |
|---|--------|------|------|-----------|
| 1 | P0     | ... | 待修复 | ... |
```

### 第 4 步：验证修复结果

修复完成后，重新运行第 2 步的检测命令，逐项确认：

```bash
# 综合验证脚本
echo "=== 验证开始 ==="
echo ""
echo "1. 时区: $(date +%Z) $(date +%z)"
echo "   TZ=$TZ"
echo ""
echo "2. 语言: LANG=$LANG LC_ALL=$LC_ALL"
echo ""
echo "3. IP 信息:"
curl -s https://ipinfo.io | python3 -c "import sys,json;d=json.load(sys.stdin);print(f\"   IP: {d.get('ip')}  Org: {d.get('org')}  Loc: {d.get('city')}, {d.get('country')}\")"
echo ""
echo "4. DNS (api.anthropic.com):"
nslookup api.anthropic.com 2>/dev/null | grep -i "address" | tail -1
echo ""
echo "=== 验证结束 ==="
```

对每项结果给出明确的 PASS / FAIL 判定。

## 错误处理

- 如果 `curl ipinfo.io` 超时或失败 → 说明代理未正确配置，先排查代理连通性
- 如果 `nslookup` 返回 SERVFAIL → DNS 服务器配置有误，检查代理工具的 DNS 设置
- 如果用户无法执行 `sudo` 命令 → 提供仅环境变量的替代方案（`export TZ=`）
- 如果用户的代理工具不是 mihomo/clash → 根据其工具类型调整 DNS 配置建议

## 详细参考

- 完整的 6 层风控检测体系详解：[references/risk-control-layers.md](references/risk-control-layers.md)
