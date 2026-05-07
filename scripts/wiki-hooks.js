#!/usr/bin/env node
/**
 * wiki-hooks.js - Hook 系统 (Synthadoc)
 * ingest / lint 后触发自定义脚本
 *
 * 用法:
 *   node wiki-hooks.js fire <event> [args...]   # 手动触发钩子
 *   node wiki-hooks.js list                        # 列出已注册钩子
 *   node wiki-hooks.js add <event> <script>       # 注册钩子
 *   node wiki-hooks.js remove <event> <script>      # 移除钩子
 *
 * 钩子存储在 .olw/hooks.json
 * 事件: on-ingest / on-refine / on-lint / on-delete
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const VAULT = process.env.OBSIDIAN_VAULT_PATH || process.env.WIKI_VAULT_PATH || path.join(__dirname, '..');
const HOOKS_DB = path.join(VAULT, '.olw', 'hooks.json');

function loadHooks() {
  if (!fs.existsSync(HOOKS_DB)) return {};
  try { return JSON.parse(fs.readFileSync(HOOKS_DB, 'utf8')); } catch (e) { return {}; }
}

function saveHooks(hooks) {
  if (!fs.existsSync(path.dirname(HOOKS_DB))) fs.mkdirSync(path.dirname(HOOKS_DB), { recursive: true });
  fs.writeFileSync(HOOKS_DB, JSON.stringify(hooks, null, 2));
}

function list() {
  const hooks = loadHooks();
  const events = Object.keys(hooks);
  if (events.length === 0) { console.log('📋 无已注册钩子'); return; }
  console.log('📋 已注册钩子\n');
  for (const [event, scripts] of Object.entries(hooks)) {
    console.log(`  ${event}:`);
    for (const s of scripts) console.log(`    - ${s}`);
  }
}

function add(event, script) {
  const hooks = loadHooks();
  if (!hooks[event]) hooks[event] = [];
  if (!hooks[event].includes(script)) hooks[event].push(script);
  else { console.log('⏭️  已存在'); return; }
  saveHooks(hooks);
  console.log(`✅ 注册钩子: ${event} → ${script}`);
}

function remove(event, script) {
  const hooks = loadHooks();
  if (!hooks[event]) { console.log('⏭️  事件无钩子'); return; }
  hooks[event] = hooks[event].filter(s => s !== script);
  if (hooks[event].length === 0) delete hooks[event];
  saveHooks(hooks);
  console.log(`✅ 已移除: ${event} → ${script}`);
}

function fire(event, args = []) {
  const hooks = loadHooks();
  if (!hooks[event] || hooks[event].length === 0) {
    console.log(`⏭️  无钩子: ${event}`); return;
  }
  console.log(`🔥 触发钩子: ${event} (${hooks[event].length} 个)`);
  for (const script of hooks[event]) {
    const scriptPath = path.isAbsolute(script) ? script : path.join(VAULT, script);
    if (!fs.existsSync(scriptPath)) { console.log(`  ❌ 脚本不存在: ${script}`); continue; }
    console.log(`  → ${script}`);
    try {
      const r = spawnSync('bash', [scriptPath, ...args], { encoding: 'utf8', timeout: 60000, cwd: VAULT });
      if (r.status === 0) console.log(`  ✅ 完成`);
      else console.log(`  ⚠️ 退出码 ${r.status}: ${r.stderr?.substring(0, 200)}`);
    } catch (e) { console.log(`  ❌ 错误: ${e.message}`); }
  }
}

const sub = process.argv[2];
if (!sub) { console.log('用法: list | add <event> <script> | remove <event> <script> | fire <event> [args...]'); process.exit(1); }
if (sub === 'list') list();
else if (sub === 'add') add(process.argv[3], process.argv[4]);
else if (sub === 'remove') remove(process.argv[3], process.argv[4]);
else if (sub === 'fire') fire(process.argv[3], process.argv.slice(4));
else console.log('未知命令:', sub);
