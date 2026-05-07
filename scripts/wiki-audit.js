#!/usr/bin/env node
/**
 * wiki-audit.js - 审计 trail 升级 (Synthadoc audit.db)
 * SQLite 不可变记录，含 token 成本/时间戳
 *
 * 用法:
 *   node wiki-audit.js record <op> <detail> [tokens] [cost]
 *   node wiki-audit.js recent [limit]
 *   node wiki-audit.js stats
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const VAULT = process.env.OBSIDIAN_VAULT_PATH || process.env.WIKI_VAULT_PATH || path.join(__dirname, '..');
const AUDIT_DB = path.join(VAULT, '.olw', 'audit.db');

// 简单 JSONL 审计（无需 sqlite 依赖）
const AUDIT_LOG = path.join(VAULT, '.olw', 'audit.jsonl');

function record(operation, detail, tokens = 0, cost = 0) {
  const record = {
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    operation,
    detail,
    tokens: Number(tokens),
    cost: Number(cost),
  };
  if (!fs.existsSync(path.dirname(AUDIT_LOG))) fs.mkdirSync(path.dirname(AUDIT_LOG), { recursive: true });
  fs.appendFileSync(AUDIT_LOG, JSON.stringify(record) + '\n');
  console.log(`✅ 记录: ${operation} | ${detail}`);
}

function recent(limit = 20) {
  if (!fs.existsSync(AUDIT_LOG)) { console.log('无审计记录'); return; }
  const lines = fs.readFileSync(AUDIT_LOG, 'utf8').split('\n').filter(Boolean).slice(-limit);
  let totalTokens = 0, totalCost = 0;
  console.log(`📋 最近 ${lines.length} 条审计记录\n`);
  for (const line of lines) {
    const r = JSON.parse(line);
    const ts = r.ts.split('T')[1].substring(0, 8);
    console.log(`[${ts}] ${r.operation}: ${r.detail} (${r.tokens} tokens / ¥${r.cost})`);
    totalTokens += r.tokens;
    totalCost += r.cost;
  }
  console.log(`\n💰 累计: ${totalTokens} tokens / ¥${totalCost.toFixed(4)}`);
}

function stats() {
  if (!fs.existsSync(AUDIT_LOG)) { console.log('无审计记录'); return; }
  const lines = fs.readFileSync(AUDIT_LOG, 'utf8').split('\n').filter(Boolean);
  const records = lines.map(l => JSON.parse(l));
  const byOp = {};
  let totalTokens = 0, totalCost = 0;
  for (const r of records) {
    byOp[r.operation] = (byOp[r.operation] || 0) + 1;
    totalTokens += r.tokens;
    totalCost += r.cost;
  }
  console.log(`📊 审计统计 (共 ${records.length} 条)`);
  console.log(`   总 token: ${totalTokens}`);
  console.log(`   总成本: ¥${totalCost.toFixed(4)}`);
  console.log(`   按操作: ${JSON.stringify(byOp)}`);
}

const sub = process.argv[2];
if (!sub) { console.log('用法: record <op> <detail> [tokens] [cost] | recent [limit] | stats'); process.exit(1); }
if (sub === 'record') record(process.argv[3], process.argv[4], process.argv[5], process.argv[6]);
else if (sub === 'recent') recent(parseInt(process.argv[3] || 20));
else if (sub === 'stats') stats();
