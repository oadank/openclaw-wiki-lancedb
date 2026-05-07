#!/usr/bin/env node
/**
 * wiki-git.js - Git 安全网 (来源: olw git safety net)
 *
 * 每次 wiki 操作后自动 git commit，支持 undo 回退。
 *
 * 用法:
 *   node wiki-git.js commit "操作描述"    # 提交当前变更
 *   node wiki-git.js undo                  # 回退最后一次自动提交
 *   node wiki-git.js log                   # 查看操作历史
 *   node wiki-git.js status                # 查看当前状态
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VAULT = process.env.OBSIDIAN_VAULT_PATH || process.env.WIKI_VAULT_PATH || path.join(__dirname, '..');
const AUTO_COMMIT_MSG = process.argv.includes('--msg') ? process.argv[process.argv.indexOf('--msg') + 1] : 'auto: wiki update';

function runGit(args, ignoreError = false) {
  try {
    return execSync(`git ${args}`, { encoding: 'utf8', timeout: 30000, cwd: VAULT });
  } catch (e) {
    if (!ignoreError) throw e;
    return '';
  }
}

function commit(message) {
  // 检查是否有变更
  const status = runGit('status --porcelain', true);
  if (!status.trim()) {
    console.log('⏭️  无变更，跳过提交');
    return;
  }

  runGit('add -A');
  const result = runGit(`commit -m "${message.replace(/"/g, '\\"')}"`);
  const hash = result.match(/\[\w+\s+([a-f0-9]+)\]/)?.[1] || 'unknown';
  console.log(`✅ 已提交: ${hash} — ${message}`);
}

function undo() {
  // 找到最后一次自动提交
  const log = runGit('log --oneline -n 20 --grep="auto:"');
  const lines = log.trim().split('\n').filter(Boolean);
  if (lines.length === 0) {
    console.log('❌ 无自动提交可回退');
    return;
  }

  const lastAuto = lines[0].match(/^([a-f0-9]+)/)?.[1];
  if (!lastAuto) {
    console.log('❌ 无法解析提交哈希');
    return;
  }

  console.log(`🔄 回退提交: ${lines[0]}`);
  try {
    runGit(`revert --no-edit ${lastAuto}`);
    console.log('✅ 已回退');
  } catch (e) {
    console.log('⚠️  回退失败，可能有冲突');
    console.log(e.message);
  }
}

function log() {
  const result = runGit('log --oneline -n 10 --grep="auto:"');
  if (!result.trim()) {
    console.log('📋 无自动提交记录');
    return;
  }
  console.log('📋 最近自动提交:\n');
  console.log(result);
}

function status() {
  const result = runGit('status --short');
  if (!result.trim()) {
    console.log('✅ 工作区干净');
    return;
  }
  console.log('📂 未提交的变更:\n');
  console.log(result);
}

const sub = process.argv[2];
if (!sub) {
  console.log('用法: commit <msg> | undo | log | status');
  process.exit(1);
}

if (sub === 'commit') {
  const msg = process.argv[3] || AUTO_COMMIT_MSG;
  commit(msg);
} else if (sub === 'undo') {
  undo();
} else if (sub === 'log') {
  log();
} else if (sub === 'status') {
  status();
} else {
  console.log('未知命令:', sub);
  process.exit(1);
}
