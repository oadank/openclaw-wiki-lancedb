#!/usr/bin/env node
/**
 * unified-search: Wiki 统一搜索入口
 * 融合 grep（精确匹配）+ 向量搜索（语义理解）
 * 用法: node unified-search.js "关键词" [limit]
 * 
 * 输出标注:
 *   [双重验证] — 两套系统都命中，可信度最高
 *   [精确]     — grep 精确命中标题/内容
 *   [语义]     — 向量搜索语义联想
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const VAULT = process.env.WIKI_VAULT_PATH || path.join(__dirname, '..');
const INDEX_PATH = path.join(VAULT, 'index.md');
const MANIFEST_PATH = path.join(VAULT, '.manifest.json');
const VECTOR_SEARCH = path.join(VAULT, '.lancedb', 'wiki-vector-search.js');
const QUERY = process.argv[2];
const LIMIT = parseInt(process.argv[3]) || 10;
const MODE = process.argv.includes('--mode') 
  ? (process.argv[process.argv.indexOf('--mode') + 1] || 'fast')
  : 'fast';

if (!QUERY || QUERY === '--mode') {
  console.log('用法: node unified-search.js "关键词" [返回数量] [--mode fast|deep]');
  console.log('  fast: 快速搜索，返回结果列表（默认）');
  console.log('  deep: 深度搜索，读取相关页面并调用 LLM 综合回答');
  process.exit(1);
}

// 深度模式：调用 deep-query.js
if (MODE === 'deep') {
  const { execSync } = require('child_process');
  const deepQuery = path.join(__dirname, 'deep-query.js');
  try {
    const output = execSync(`node "${deepQuery}" "${QUERY.replace(/"/g, '\\"')}" ${LIMIT} 3`, {
      encoding: 'utf8',
      timeout: 180000,
      cwd: VAULT,
      stdio: 'inherit'
    });
  } catch(e) {
    // deep-query 会自己处理错误输出
  }
  process.exit(0);
}

// ============================================================
// 0. 加载 manifest，建立 wiki_page -> 来源信息 反查表
// ============================================================
function loadSourceIndex() {
  const index = {}; // wiki_page_path -> { url, title, ingestedAt }
  try {
    if (!fs.existsSync(MANIFEST_PATH)) return index;
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    for (const src of Object.values(manifest.sources || {})) {
      for (const pg of (src.pagesCreated || [])) {
        index[pg] = {
          url: src.articleUrl || null,
          articleTitle: src.articleTitle || null,
          ingestedAt: src.ingestedAt || null
        };
      }
    }
  } catch(e) {}
  return index;
}
const SOURCE_INDEX = loadSourceIndex();

// ============================================================
// 1. Grep 搜索（精确匹配）
// ============================================================
function grepSearch() {
  const results = new Map();
  
  try {
    const indexOutput = execSync(`grep -in "${QUERY.replace(/"/g, '\\"')}" "${INDEX_PATH}" 2>/dev/null || true`, { encoding: 'utf8' });
    for (const line of indexOutput.split('\n').filter(Boolean)) {
      const match = line.match(/\[\[([^\]|]+)\|([^\]]+)\]\]/);
      if (match) {
        const pagePath = match[1].replace(/\.md$/, '');
        const fullTitle = match[2];
        results.set(pagePath, {
          path: pagePath,
          title: fullTitle,
          source: 'grep',
          detail: line.replace(/^\d+:/, '').trim()
        });
      }
    }
  } catch(e) {}

  try {
    const contentOutput = execSync(`grep -rl "${QUERY.replace(/"/g, '\\"')}" "${VAULT}" --include="*.md" 2>/dev/null | head -20 || true`, { encoding: 'utf8' });
    for (const file of contentOutput.split('\n').filter(Boolean)) {
      const relPath = file.replace(VAULT + '/', '');
      if (!results.has(relPath.replace(/\.md$/, ''))) {
        const filename = path.basename(file).replace(/\.md$/, '');
        try {
          const snippet = execSync(`grep -n "${QUERY.replace(/"/g, '\\"')}" "${file}" 2>/dev/null | head -1 || true`, { encoding: 'utf8' }).trim();
          results.set(relPath, {
            path: relPath.replace(/\.md$/, ''),
            title: filename,
            source: 'grep',
            detail: snippet
          });
        } catch(e) {}
      }
    }
  } catch(e) {}

  return results;
}

// ============================================================
// 2. 向量搜索（语义理解）
// ============================================================
function vectorSearch() {
  const results = new Map();
  
  try {
    const output = execSync(`node "${VECTOR_SEARCH}" search "${QUERY.replace(/"/g, '\\"')}" ${LIMIT} 2>&1`, { encoding: 'utf8', timeout: 60000 });
    const lines = output.split('\n').filter(l => /^\[\d/.test(l.trim()));
    for (const line of lines) {
      const match = line.match(/\[([\d.]+)\]\s+\((\w+)\)\s+(\S+)\s+—\s+(.+)/);
      if (match) {
        const score = parseFloat(match[1]);
        const vecSource = match[2];
        const pagePath = match[3];
        const title = match[4];
        results.set(pagePath, {
          path: pagePath,
          title: title,
          source: 'vector',
          score: score,
          vecSource: vecSource
        });
      }
    }
  } catch(e) {}

  return results;
}

// ============================================================
// 3. 融合去重 + 标注
// ============================================================
function merge(grepResults, vectorResults) {
  const merged = new Map();
  
  for (const [pagePath, item] of grepResults) {
    merged.set(pagePath, { ...item });
  }
  
  for (const [pagePath, item] of vectorResults) {
    if (merged.has(pagePath)) {
      const existing = merged.get(pagePath);
      existing.source = 'both';
      existing.score = item.score;
    } else {
      merged.set(pagePath, { ...item });
    }
  }
  
  const priority = { both: 0, vector: 1, grep: 2 };
  return [...merged.values()]
    .sort((a, b) => {
      const pDiff = (priority[a.source] || 2) - (priority[b.source] || 2);
      if (pDiff !== 0) return pDiff;
      if (a.score && b.score) return b.score - a.score;
      return 0;
    })
    .slice(0, LIMIT);
}

// ============================================================
// 4. 查询来源信息
// ============================================================
function getSourceInfo(pagePath) {
  return SOURCE_INDEX[pagePath] || SOURCE_INDEX[pagePath + '.md'] || null;
}

// ============================================================
// 5. 输出
// ============================================================
function output(results) {
  if (results.length === 0) {
    console.log('未找到匹配内容。');
    return;
  }
  
  console.log(`搜索: "${QUERY}" — 找到 ${results.length} 条结果\n`);
  
  for (const r of results) {
    let tag;
    if (r.source === 'both') tag = '🔥 双重验证';
    else if (r.source === 'vector') tag = `🧠 语义 (${r.vecSource})`;
    else tag = '📌 精确';
    
    console.log(`[${tag}] ${r.path}`);
    if (r.title) console.log(`  标题: ${r.title}`);
    if (r.detail) console.log(`  匹配: ${r.detail}`);
    if (r.score) console.log(`  向量分: ${r.score.toFixed(3)}`);
    
    // 来源信息
    const src = getSourceInfo(r.path);
    if (src) {
      if (src.url) console.log(`  📎 来源: ${src.url}`);
      if (src.articleTitle) console.log(`  📰 原文: ${src.articleTitle}`);
    }
    console.log();
  }
  
  const both = results.filter(r => r.source === 'both').length;
  const vector = results.filter(r => r.source === 'vector').length;
  const grep = results.filter(r => r.source === 'grep').length;
  console.log(`--- 统计: 双重验证 ${both} 条 | 语义 ${vector} 条 | 精确 ${grep} 条 ---`);
}

// ============================================================
// Main
// ============================================================
const grepResults = grepSearch();
const vectorResults = vectorSearch();
const merged = merge(grepResults, vectorResults);
output(merged);
