#!/bin/bash
# wiki-search.sh → 统一搜索入口（包装器）
# 用法: wiki-search.sh "关键词" [limit]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
QUERY="${1:?用法: wiki-search.sh \"关键词\" [返回数量]}"
LIMIT="${2:-10}"

# 调用统一搜索引擎
node "$SCRIPT_DIR/unified-search.js" "$QUERY" "$LIMIT"
