#!/usr/bin/env node
/**
 * wiki-watch.js - 文件监控自动入库 (来源: olw watch)
 *
 * 监控 raw/ 目录，新文件自动触发 quick-ingest + 可选 refine。
 * 支持 debounce（避免处理半写文件）和 batch 批量处理。
 *
 * 用法:
 *   node wiki-watch.js                    # 监控默认 raw/ 目录
 *   node wiki-watch.js /path/to/watch     # 监控指定目录
 *   node wiki-watch.js --auto-refine      # 入库后自动精加工
 *   node wiki-watch.js --debounce 5       # 5秒防抖（默认3秒）
 *   node wiki-watch.js --dry-run          # 预览不执行
 *   node wiki-watch.js --batch            # 启动时先批量处理现有文件
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const VAULT = process.env.OBSIDIAN_VAULT_PATH || process.env.WIKI_VAULT_PATH || path.join(__dirname, '..');
const RAW_DIR = process.argv.slice(2).find(a => !a.startsWith('--')) || path.join(VAULT, 'raw');
const AUTO_REFINE = process.argv.includes('--auto-refine');
const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_MODE = process.argv.includes('--batch');
const DEBOUNCE_MS = (() => {
  const idx = process.argv.indexOf('--debounce');
  return idx >= 0 ? (parseInt(process.argv[idx + 1]) || 3) * 1000 : 3000;
})();

const WATCHED_EXTS = ['.md', '.pdf', '.docx', '.xlsx', '.doc', '.xls'];

// 防抖定时器
let debounceTimer = null;
let pendingFiles = new Set();

function isWatched(file) {
  return WATCHED_EXTS.some(ext => file.toLowerCase().endsWith(ext));
}

function processFile(filePath) {
  const relPath = path.relative(VAULT, filePath);
  const fileName = path.basename(filePath);

  if (DRY_RUN) {
    console.log(`[dry-run] 应处理: ${relPath}`);
    return;
  }

  console.log(`📥 检测到新文件: ${relPath}`);

  // 调用 quick-ingest
  const ingestScript = path.join(__dirname, 'wiki-quick-ingest.py');
  const result = spawnSync('python3', [ingestScript, filePath], {
    encoding: 'utf8',
    timeout: 120000,
    cwd: VAULT,
    env: { ...process.env, WIKI_VAULT_PATH: VAULT }
  });

  if (result.status === 0) {
    console.log(`✅ 入库成功: ${fileName}`);

    // 自动精加工（如果启用）
    if (AUTO_REFINE) {
      console.log('🔄 自动精加工所有未精炼文件 ...');
      const refineResult = spawnSync('node', [
        path.join(__dirname, 'wiki-refine.js'),
        '--unrefined'
      ], {
        encoding: 'utf8',
        timeout: 300000,
        cwd: VAULT,
        env: { ...process.env, WIKI_VAULT_PATH: VAULT }
      });
      if (refineResult.status === 0) {
        console.log('✅ 精加工完成');
      } else {
        console.log(`⚠️  精加工失败: ${refineResult.stderr?.substring(0, 200)}`);
      }
    }
  } else {
    console.log(`❌ 入库失败: ${fileName}`);
    console.log(result.stderr?.substring(0, 300) || '(无错误输出)');
  }
}

function flushPending() {
  if (pendingFiles.size === 0) return;
  const files = Array.from(pendingFiles);
  pendingFiles.clear();

  console.log(`\n🔄 批量处理 ${files.length} 个文件 ...`);
  for (const f of files) {
    try {
      if (fs.existsSync(f)) processFile(f);
    } catch (e) {
      console.log(`⚠️  处理失败: ${f} — ${e.message}`);
    }
  }
  console.log('');
}

function onFileChange(filePath) {
  if (!isWatched(filePath)) return;
  pendingFiles.add(filePath);

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    flushPending();
  }, DEBOUNCE_MS);
}

// 初始批量处理
function processExisting() {
  if (!fs.existsSync(RAW_DIR)) {
    console.log(`📁 创建监控目录: ${path.relative(VAULT, RAW_DIR)}`);
    fs.mkdirSync(RAW_DIR, { recursive: true });
    return;
  }

  const files = fs.readdirSync(RAW_DIR)
    .map(f => path.join(RAW_DIR, f))
    .filter(f => fs.statSync(f).isFile() && isWatched(f));

  if (files.length === 0) {
    console.log('📂 监控目录为空，等待新文件 ...');
    return;
  }

  if (BATCH_MODE) {
    console.log(`📦 批量模式: 处理现有 ${files.length} 个文件`);
    files.forEach(f => pendingFiles.add(f));
    flushPending();
  } else {
    console.log(`📂 监控目录有 ${files.length} 个文件（--batch 可批量处理）`);
  }
}

function startWatch() {
  if (!fs.existsSync(RAW_DIR)) {
    fs.mkdirSync(RAW_DIR, { recursive: true });
  }

  console.log(`👁️  开始监控: ${path.relative(VAULT, RAW_DIR) || 'raw/'}`);
  console.log(`   防抖: ${DEBOUNCE_MS / 1000}s | 自动精加工: ${AUTO_REFINE ? '✅' : '❌'} | dry-run: ${DRY_RUN ? '✅' : '❌'}`);
  console.log(`   支持的格式: ${WATCHED_EXTS.join(', ')}`);
  console.log('');

  processExisting();

  // 使用 fs.watch 监控目录
  const watcher = fs.watch(RAW_DIR, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    const fullPath = path.join(RAW_DIR, filename);
    if (isWatched(fullPath)) {
      // 延迟检查文件是否稳定（大小不再变化）
      setTimeout(() => {
        try {
          if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
            onFileChange(fullPath);
          }
        } catch (e) {}
      }, 500);
    }
  });

  console.log('按 Ctrl+C 停止监控\n');

  // 优雅退出
  process.on('SIGINT', () => {
    console.log('\n🛑 停止监控');
    watcher.close();
    clearTimeout(debounceTimer);
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    watcher.close();
    clearTimeout(debounceTimer);
    process.exit(0);
  });
}

startWatch();
