#!/usr/bin/env node
/**
 * wiki-query-decompose.js - Query 分解 + Gap 检测 (Synthadoc)
 * 复杂问题拆成并行子查询，gap 检测推荐搜索
 *
 * 用法:
 *   node wiki-query-decompose.js "复杂问题"   # 分解并搜索
 *   node wiki-query-decompose.js "问题" --search   # 含 gap 检测
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const LLM_BASE_URL = process.env.LLM_BASE_URL || 'http://localhost:4000';
const LLM_API_KEY = process.env.LLM_API_KEY || '';
const LLM_MODEL = process.env.LLM_MODEL || 'your-model-name';
const VAULT = process.env.OBSIDIAN_VAULT_PATH || process.env.WIKI_VAULT_PATH || path.join(__dirname, '..');

function callLLM(prompt, maxTokens = 500) {
  const tmpFile = '/tmp/wiki-query-decompose.json';
  const payload = { model: LLM_MODEL, messages: [{ role: 'user', content: prompt }], max_tokens: maxTokens, temperature: 0 };
  fs.writeFileSync(tmpFile, JSON.stringify(payload));
  try {
    const r = spawnSync('curl', ['-s', '-m', '60', `${LLM_BASE_URL}/chat/completions`,
      '-H', `Authorization: Bearer ${LLM_API_KEY}`, '-H', 'Content-Type: application/json', '-d', `@${tmpFile}`],
      { encoding: 'utf8', timeout: 70000 });
    if (r.status !== 0) return null;
    return JSON.parse(r.stdout).choices?.[0]?.message?.content || null;
  } catch (e) { return null; }
  finally { try { fs.unlinkSync(tmpFile); } catch (e) {} }
}

function bm25Search(query) {
  // 简单 grep 替代 BM25（避免引入新依赖）
  try {
    const r = execSync(`grep -ril "${query.replace(/"/g, '\\"')}" "${VAULT}" 2>/dev/null | head -5`,
      { encoding: 'utf8', timeout: 10000, cwd: VAULT });
    return r.trim().split('\n').filter(Boolean);
  } catch (e) { return []; }
}

function execSync(cmd, opts) {
  const { spawnSync: _s } = require('child_process');
  return _s('bash', ['-c', cmd], opts);
}

async function decompose(question) {
  const prompt = `分解以下问题为 1-4 个独立子问题（关键词搜索用）。

问题: ${question}

Respond ONLY with this format (JSON array):
["子问题1", "子问题2", ...]
If the question is simple, return a single-element array.

Examples:
- "比较 Python 和 Java 的区别" → ["Python vs Java", "Python 特点", "Java 特点"]
- "OpenClaw 的 hook 怎么配" → ["OpenClaw hook 配置"]
`;

  const result = await callLLM(prompt, 300);
  if (!result) return [question];
  try {
    const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const arr = JSON.parse(cleaned);
    return Array.isArray(arr) ? arr : [question];
  } catch (e) { return [question]; }
}

async function detectGap(question, candidates) {
  if (candidates.length > 0) return null; // 有结果，不需要 gap
  const prompt = `用户问题没有搜到相关 wiki 页面。

问题: ${question}

生成 1-3 个关键词搜索建议，帮助找到相关信息。

Respond ONLY with this format:
SUGGESTIONS:
1. [搜索建议1]
2. [搜索建议2]
`;

  const result = await callLLM(prompt, 200);
  if (!result) return null;
  const matches = [...result.matchAll(/^\d+\.\s*(.+)/gm)].map(m => m[1].trim());
  return matches.length > 0 ? matches : null;
}

async function main() {
  const question = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || '';
  const withSearch = process.argv.includes('--search');

  if (!question) { console.log('用法: node wiki-query-decompose.js "问题" [--search]'); process.exit(1); }

  console.log(`❓ 问题: ${question}\n`);

  const subquestions = await decompose(question);
  console.log(`🔍 分解为 ${subquestions.length} 个子问题:`);
  subquestions.forEach((q, i) => console.log(`   ${i + 1}. ${q}`));

  console.log('\n🔎 并行搜索:');
  const results = [];
  for (const q of subquestions) {
    const found = bm25Search(q);
    results.push({ q, found });
    console.log(`   "${q}" → ${found.length} 个结果`);
    for (const f of found.slice(0, 3)) {
      console.log(`     - ${path.relative(VAULT, f)}`);
    }
  }

  if (withSearch) {
    const allFound = results.flatMap(r => r.found);
    const gap = await detectGap(question, allFound);
    if (gap) {
      console.log('\n⚠️  Knowledge Gap 检测 — 建议搜索:');
      gap.forEach(g => console.log(`   - ${g}`));
    } else {
      console.log('\n✅ 搜索结果充分，无 Knowledge Gap');
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
