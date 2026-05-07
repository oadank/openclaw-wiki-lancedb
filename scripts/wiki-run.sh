#!/usr/bin/env bash
# wiki-run.sh - 一键流水线 (来源: olw run)
# ingest → refine → lint → 可选审核
#
# 用法:
#   bash scripts/wiki-run.sh              # 全量流水线
#   bash scripts/wiki-run.sh --batch      # 批量入库 raw/ 下所有文件
#   bash scripts/wiki-run.sh --auto-refine # 入库后自动精加工
#   bash scripts/wiki-run.sh --review     # 精加工后进入审核
#   bash scripts/wiki-run.sh --dry-run    # 预览

set -e

VAULT="${WIKI_VAULT_PATH:-$(cd "$(dirname "$0")/.." && pwd)}"
RAW_DIR="${VAULT}/raw"
DRY_RUN=""
BATCH=""
AUTO_REFINE=""
REVIEW=""

# 解析参数
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN="--dry-run" ;;
    --batch) BATCH="1" ;;
    --auto-refine) AUTO_REFINE="1" ;;
    --review) REVIEW="1" ;;
  esac
done

echo "╔════════════════════════════════════════╗"
echo "║   Wiki 一键流水线                      ║"
echo "╚════════════════════════════════════════╝"
echo ""

# 1. 批量入库（如果 --batch）
if [ -n "$BATCH" ]; then
  if [ -d "$RAW_DIR" ]; then
    FILES=$(find "$RAW_DIR" -maxdepth 1 -type f \( -name "*.md" -o -name "*.pdf" -o -name "*.docx" -o -name "*.xlsx" \) | wc -l)
    if [ "$FILES" -gt 0 ]; then
      echo "📦 Step 1/4: 批量入库 ($FILES 个文件)"
      if [ -n "$DRY_RUN" ]; then
        echo "  [dry-run] 应执行: python3 scripts/wiki-quick-ingest.py --batch $RAW_DIR"
      else
        python3 "$VAULT/scripts/wiki-quick-ingest.py" --batch "$RAW_DIR" $DRY_RUN || true
      fi
    else
      echo "📂 Step 1/4: raw/ 目录为空，跳过"
    fi
  else
    echo "📂 Step 1/4: raw/ 目录不存在，跳过"
  fi
  echo ""
fi

# 2. 精加工未精炼文件
if [ -n "$AUTO_REFINE" ]; then
  echo "🔄 Step 2/4: 精加工未精炼文件"
  if [ -n "$DRY_RUN" ]; then
    echo "  [dry-run] 应执行: node scripts/wiki-refine.js --unrefined"
  else
    node "$VAULT/scripts/wiki-refine.js" --unrefined $DRY_RUN || true
  fi
  echo ""
else
  echo "⏭️  Step 2/4: 跳过精加工（加 --auto-refine 启用）"
  echo ""
fi

# 3. 健康检查
echo "🔍 Step 3/4: 健康检查"
if [ -n "$DRY_RUN" ]; then
  echo "  [dry-run] 应执行: node scripts/lint.js"
else
  node "$VAULT/scripts/lint.js" || true
fi
echo ""

# 4. 审核草稿（如果 --review）
if [ -n "$REVIEW" ]; then
  echo "👁️  Step 4/4: 审核草稿"
  if [ -n "$DRY_RUN" ]; then
    echo "  [dry-run] 应执行: node scripts/wiki-review.js"
  else
    # 检查是否有草稿
    DRAFTS=$(find "$VAULT/.drafts" -maxdepth 1 -name "*.md" 2>/dev/null | wc -l)
    if [ "$DRAFTS" -gt 0 ]; then
      node "$VAULT/scripts/wiki-review.js" || true
    else
      echo "  无草稿需要审核"
    fi
  fi
  echo ""
else
  echo "⏭️  Step 4/4: 跳过审核（加 --review 启用）"
  echo ""
fi

echo "✅ 流水线完成"
echo ""
echo "常用组合:"
echo "  bash scripts/wiki-run.sh --batch --auto-refine   # 入库+精加工"
echo "  bash scripts/wiki-run.sh --batch --auto-refine --review  # 入库+精加工+审核"
echo "  bash scripts/wiki-run.sh --auto-refine --review  # 精加工+审核（不批量入库）"
