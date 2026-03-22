#!/usr/bin/env bash
# ============================================================================
# runner.sh - OpenCode 外部模型调用胶水脚本
# ============================================================================
# 职责：
#   1. 接收模型别名 + 文件路径 + 指令
#   2. 读取目标文件，构造结构化 prompt
#   3. 通过 stdin 管道调用 opencode run（避免 ARG_MAX 溢出）
#   4. 清洗输出（ANSI 码、think 标签、首尾 markdown 围栏）
#   5. 生成 diff → 覆盖目标文件 → 输出 diff 供 Claude 审查
#
# 用法：
#   bash runner.sh <codex|minimax> <file-path> "<instruction>"
#
# 退出码：
#   0 - 成功（含无变更的情况）
#   1 - 参数错误
#   2 - 文件不存在
#   3 - opencode 调用失败
#   4 - 模型输出为空
# ============================================================================

set -euo pipefail

# ---- 参数校验 ----
if [[ $# -lt 3 ]]; then
    echo "ERROR: 参数不足" >&2
    echo "用法: bash runner.sh <codex|minimax> <file-path> <instruction>" >&2
    exit 1
fi

MODEL_ALIAS="$1"
TARGET_FILE="$2"
shift 2
INSTRUCTION="$*"

# ---- 模型路由 ----
# 将用户友好的别名映射到 opencode 的 provider/model 格式
case "${MODEL_ALIAS}" in
    codex|gpt53)
        MODEL_ID="epoch/gpt-5.3-codex"
        MODEL_DISPLAY="GPT-5.3 Codex"
        ;;
    minimax|mm27)
        MODEL_ID="minimax/MiniMax-M2.7-highspeed"
        MODEL_DISPLAY="MiniMax M2.7 HighSpeed"
        ;;
    *)
        echo "ERROR: 未知模型别名 '${MODEL_ALIAS}'" >&2
        echo "支持的模型: codex (gpt53), minimax (mm27)" >&2
        exit 1
        ;;
esac

# ---- 文件存在性检查 ----
if [[ ! -f "${TARGET_FILE}" ]]; then
    echo "ERROR: 文件不存在: ${TARGET_FILE}" >&2
    exit 2
fi

# ---- 读取目标文件 ----
FILE_CONTENT=$(cat "${TARGET_FILE}")
FILE_EXT="${TARGET_FILE##*.}"

# ---- 调用 OpenCode ----
TEMP_DIR=$(mktemp -d)
TEMP_OUT="${TEMP_DIR}/output.txt"
TEMP_CLEAN="${TEMP_DIR}/clean.txt"
TEMP_PROMPT="${TEMP_DIR}/prompt.txt"

# ---- 构造 Prompt ----
# 直接写入文件，避免 heredoc 反引号转义陷阱
# 关键设计：要求模型只输出代码，不要解释，减少清洗工作量
{
    echo "You are a code modification assistant. Your task is to modify the following file according to the instruction."
    echo ""
    echo "## Rules"
    echo "1. Output ONLY the complete modified file content, nothing else."
    echo "2. Do NOT include any explanation, commentary, or markdown code fences."
    echo "3. Do NOT wrap output in triple backticks."
    echo "4. Preserve the original file's indentation style (tabs or spaces)."
    echo "5. If no changes are needed, output the original file content unchanged."
    echo ""
    echo "## File: ${TARGET_FILE}"
    echo "## Language: ${FILE_EXT}"
    echo ""
    echo "## Current file content:"
    cat "${TARGET_FILE}"
    echo ""
    echo "## Instruction:"
    echo "${INSTRUCTION}"
    echo ""
    echo "## Output the complete modified file below (NO markdown fences, NO explanation):"
} > "${TEMP_PROMPT}"

echo ">>> 正在调用 ${MODEL_DISPLAY}..." >&2

# 通过管道传递 prompt，捕获 stdout 和 stderr
# opencode run 的 -m 指定模型，消息从 positional args 读取
# 但超长消息需要用文件，所以我们用 cat 管道
if ! cat "${TEMP_PROMPT}" | opencode run -m "${MODEL_ID}" 2>/dev/null > "${TEMP_OUT}"; then
    # 检查是否是 opencode 本身的错误
    if [[ -s "${TEMP_OUT}" ]]; then
        echo "ERROR: opencode 调用失败，输出如下:" >&2
        cat "${TEMP_OUT}" >&2
    else
        echo "ERROR: opencode 调用失败，无输出（可能是网络超时或 API 错误）" >&2
    fi
    rm -rf "${TEMP_DIR}"
    exit 3
fi

# ---- 清洗输出 ----
# opencode 的 default 格式输出会包含：
#   1. ANSI 颜色转义码（\033[...m）
#   2. Header 行（"> plan · model-name"）
#   3. 可能的 <think>...</think> 标签（MiniMax 特有）
#   4. 可能的首尾 ``` markdown 围栏

# Step 1: 去除 ANSI 转义码
sed 's/\x1b\[[0-9;]*m//g' "${TEMP_OUT}" > "${TEMP_CLEAN}"

# Step 2: 去除 opencode header 行（匹配 "> agent · model" 格式）
sed -i '' '/^>[[:space:]].*·/d' "${TEMP_CLEAN}"

# Step 3: 去除 <think>...</think> 块（MiniMax 的思考过程，可能跨多行）
# 使用 perl 处理跨行匹配，比 sed 更可靠
if command -v perl &>/dev/null; then
    perl -0777 -pi -e 's/<think>.*?<\/think>\s*//gs' "${TEMP_CLEAN}"
fi

# Step 4: 去除首尾的 markdown 围栏（只删首尾，不删中间合法内容）
# 首行如果是 ```xxx 开头，删掉
# 末行如果是 ``` 结尾，删掉
TOTAL_LINES=$(wc -l < "${TEMP_CLEAN}" | tr -d ' ')
if [[ "${TOTAL_LINES}" -gt 2 ]]; then
    FIRST_LINE=$(head -1 "${TEMP_CLEAN}")
    LAST_LINE=$(tail -1 "${TEMP_CLEAN}")

    # 检查首行是否是 ```language 格式
    if [[ "${FIRST_LINE}" =~ ^'```' ]]; then
        sed -i '' '1d' "${TEMP_CLEAN}"
    fi

    # 检查末行是否是 ``` 格式（可能带空格）
    if [[ "${LAST_LINE}" =~ ^'```'[[:space:]]*$ ]]; then
        sed -i '' '$d' "${TEMP_CLEAN}"
    fi
fi

# Step 5: 去除首尾空行
# 使用 perl 替代 sed，避免 macOS sed 的兼容性问题
if command -v perl &>/dev/null; then
    perl -pi -e 'BEGIN{$s=0} $s=1 if /\S/; $_ = "" unless $s' "${TEMP_CLEAN}"  # 去除开头空行
    perl -0777 -pi -e 's/\n+$/\n/' "${TEMP_CLEAN}"  # 去除结尾多余空行，保留最后一个换行
fi

# ---- 验证输出 ----
if [[ ! -s "${TEMP_CLEAN}" ]]; then
    echo "ERROR: 模型输出为空（清洗后无内容）" >&2
    rm -rf "${TEMP_DIR}"
    exit 4
fi

# ---- 生成 Diff ----
echo ">>> 生成 diff..." >&2

DIFF_OUTPUT=$(diff -u "${TARGET_FILE}" "${TEMP_CLEAN}" 2>/dev/null || true)

if [[ -z "${DIFF_OUTPUT}" ]]; then
    echo ">>> 无变更：模型输出与原文件完全一致" >&2
    echo "NO_CHANGES"
    rm -rf "${TEMP_DIR}"
    exit 0
fi

# ---- 覆盖目标文件 ----
# 先备份原文件（.bak），再覆盖
cp "${TARGET_FILE}" "${TARGET_FILE}.bak"
cp "${TEMP_CLEAN}" "${TARGET_FILE}"
echo ">>> 文件已覆盖: ${TARGET_FILE}（备份: ${TARGET_FILE}.bak）" >&2

# ---- 输出 Diff 供 Claude 审查 ----
echo "DIFF_START"
echo "${DIFF_OUTPUT}"
echo "DIFF_END"

# ---- 清理临时文件 ----
rm -rf "${TEMP_DIR}"

echo ">>> 完成" >&2
exit 0
