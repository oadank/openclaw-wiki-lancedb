#!/usr/bin/env node
/**
 * wiki-cost-guard.js - Cost Guard (Synthadoc)
 * token 消耗门控，超限自动拦截
 *
 * 用法:
 *   node wiki-cost-guard.js check <tokens> [cost]   # 检查是否超限
 *   node wiki-cost-guard.js set <daily-limit> [warn-threshold]
 *   node wiki-cost-guard.js status
 */

const fs = require('fs');
const path = require('path');

const VAULT = process.env.OBSIDIAN_VAULT_PATH || process.env.WIKI_VAULT_PATH || path.join(__dirname, '..');
const COST_DB = path.join(VAULT, '.olw', 'cost.json');

function today() { return new Date().toISOString().split('T')[0]; }

function load() {
  if (!fs.existsSync(COST_DB)) return { dailyLimit: 100000, warnThreshold: 0.8, days: {} };
  try { return JSON.parse(fs.readFileSync(COST_DB, 'utf8')); }
  catch (e) { return { dailyLimit: 100000, warnThreshold: 0.8, days: {} }; }
}

function save(data) {
  if (!fs.existsSync(path.dirname(COST_DB))) fs.mkdirSync(path.dirname(COST_DB), { recursive: true });
  fs.writeFileSync(COST_DB, JSON.stringify(data, null, 2));
}

function record(tokens, cost) {
  const data = load();
  const d = today();
  if (!data.days[d]) data.days[d] = { tokens: 0, cost: 0 };
  data.days[d].tokens += Number(tokens);
  data.days[d].cost += Number(cost);
  // 只保留最近 30 天
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
  data.days = Object.fromEntries(
    Object.entries(data.days).filter(([k]) => new Date(k) >= cutoff)
  );
  save(data);
}

function status() {
  const data = load();
  const d = today();
  const today_ = data.days[d] || { tokens: 0, cost: 0 };
  const used = today_.tokens;
  const limit = data.dailyLimit;
  const pct = limit > 0 ? (used / limit * 100).toFixed(1) : 0;
  const warn = data.warnThreshold * 100;
  console.log(`📊 Cost Guard 状态 (${d})`);
  console.log(`   今日消耗: ${used} / ${limit} tokens (${pct}%)`);
  console.log(`   今日成本: ¥${today_.cost.toFixed(4)}`);
  console.log(`   警告阈值: ${warn}%`);
  console.log(`   门控: ${pct >= 100 ? '🚫 已超限，拦截' : pct >= warn ? '⚠️  接近上限' : '✅ 正常'}`);
}

function check(tokens, cost = 0) {
  const data = load();
  const d = today();
  const today_ = data.days[d] || { tokens: 0, cost: 0 };
  const used = today_.tokens + Number(tokens);
  const limit = data.dailyLimit;
  const warn = data.warnThreshold * limit;

  if (used > limit) {
    console.log(`🚫 COST GUARD: 超出日限额 ${limit} tokens（当前 ${used}），操作被拦截`);
    process.exit(1);
  }
  if (used > warn) {
    console.log(`⚠️  COST GUARD: 接近上限 ${limit}（当前 ${used}，${warn}）`);
  } else {
    console.log(`✅ COST GUARD: 检查通过（${used}/${limit}）`);
  }
  record(tokens, cost);
}

const sub = process.argv[2];
if (!sub) { console.log('用法: check <tokens> [cost] | set <daily-limit> [warn-threshold] | status'); process.exit(1); }
if (sub === 'check') check(process.argv[3], process.argv[4]);
else if (sub === 'status') status();
else if (sub === 'set') {
  const data = load();
  data.dailyLimit = Number(process.argv[3]) || 100000;
  data.warnThreshold = Number(process.argv[4]) || 0.8;
  save(data);
  console.log(`✅ 已设置: 日限额 ${data.dailyLimit} tokens，警告阈值 ${(data.warnThreshold*100)}%`);
}
