#!/usr/bin/env node
/**
 * wiki-brief.js - 每日 cron brief 汇总（umbex 评论建议）
 *
 * 解析 log.md 近 24 小时条目，生成 brief.md 日报。
 *
 * 用法:
 *   node wiki-brief.js                # 每日汇总（生成 brief.md）
 *   node wiki-brief.js --since "..."  # 指定时间范围
 *   node wiki-brief.js --dry-run      # 预览不写入
 */

const fs = require('fs');
const path = require('path');

const VAULT = process.env.OBSIDIAN_VAULT_PATH || process.env.WIKI_VAULT_PATH || path.join(__dirname, '..');
const LOG_PATH = path.join(VAULT, 'log.md');
const BRIEF_PATH = path.join(VAULT, 'brief.md');

const DRY_RUN = process.argv.includes('--dry-run');

// 解析时间范围
function parseSince() {
  const idx = process.argv.indexOf('--since');
  if (idx >= 0 && process.argv[idx + 1]) {
    return new Date(process.argv[idx + 1]);
  }
  // 默认近 24 小时
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
}

// 解析 log.md
function parseLog(since) {
  if (!fs.existsSync(LOG_PATH)) return [];
  const lines = fs.readFileSync(LOG_PATH, 'utf8').split('\n');
  const entries = [];
  for (const line of lines) {
    if (!line.startsWith('|')) continue;
    const cols = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cols.length < 3) continue;
    const [timestamp, operation, status, ...rest] = cols;
    let date;
    try { date = new Date(timestamp); } catch (e) { continue; }
    if (date < since) continue;
    entries.push({
      timestamp: date,
      operation: operation.trim(),
      status: status.trim(),
      detail: rest.join(' | ').trim(),
    });
  }
  return entries;
}

// 按操作类型统计
function summarize(entries) {
  const byOp = {};
  for (const e of entries) {
    if (!byOp[e.operation]) byOp[e.operation] = [];
    byOp[e.operation].push(e);
  }

  const lines = [];
  for (const [op, items] of Object.entries(byOp)) {
    const ok = items.filter(i => i.status === '✅').length;
    const warn = items.filter(i => i.status !== '✅').length;
    lines.push(`### ${op} (${ok} ✅ / ${warn} ⚠️)`);
    for (const item of items.slice(0, 10)) {
      const time = item.timestamp.toISOString().replace('T', ' ').substring(11, 16);
      lines.push(`- [${time}] ${item.detail || '(无详情)'}`);
    }
    if (items.length > 10) lines.push(`  ... 还有 ${items.length - 10} 条`);
    lines.push('');
  }
  return lines.join('\n');
}

function buildBrief(entries, since) {
  const date = new Date().toISOString().split('T')[0];
  const summary = summarize(entries);

  return `---
title: Daily Brief
date: ${date}
entries: ${entries.length}
since: ${since.toISOString()}
---

# 📰 Wiki Daily Brief — ${date}

> 自动生成 by wiki-brief.py | 统计范围: 最近 24 小时

## 操作统计

| 操作 | 成功 | 警告 |
|------|------|------|
${Object.entries(
  entries.reduce((acc, e) => {
    acc[e.operation] = acc[e.operation] || { ok: 0, warn: 0 };
    acc[e.operation][e.status === '✅' ? 'ok' : 'warn']++;
    return acc;
  }, {})
).map(([op, {ok, warn}]) => `| ${op} | ${ok} | ${warn} |`).join('\n')}

## 详细记录

${summary || '_（无记录）_'}

---

*生成时间: ${new Date().toISOString()} | 下次: 明天自动更新*
`;
}

async function main() {
  if (DRY_RUN) console.log('🔍 [dry-run 模式]\n');
  const since = parseSince();
  const entries = parseLog(since);
  console.log(`📋 统计 ${entries.length} 条记录（${since.toISOString()} 之后）`);
  if (entries.length === 0) {
    console.log('⏭️  无记录，跳过');
    return;
  }
  const brief = buildBrief(entries, since);
  console.log('\n--- 预览 ---');
  console.log(brief.substring(0, 2000));
  if (DRY_RUN) console.log('[dry-run] 未写入'); else {
    fs.writeFileSync(BRIEF_PATH, brief);
    console.log(`\n✅ brief.md 已写入 (${entries.length} 条)`);
  }
}

main().catch(err => { console.error('Fatal error:', err); process.exit(1); });
