#!/usr/bin/env node
/**
 * wiki-cache.js - LLM 3层响应缓存 (Synthadoc)
 * 按 prompt SHA256 缓存 LLM 响应，节省 token
 *
 * 用法:
 *   node wiki-cache.js build [--force]  # 预热缓存（扫描所有待处理文件）
 *   node wiki-cache.js clear            # 清空缓存
 *   node wiki-cache.js stats            # 查看缓存统计
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const VAULT = process.env.OBSIDIAN_VAULT_PATH || process.env.WIKI_VAULT_PATH || path.join(__dirname, '..');
const CACHE_DIR = path.join(VAULT, '.olw', 'cache');
const CACHE_DB = path.join(CACHE_DIR, 'responses.json');

function cacheKey(text) {
  return crypto.createHash('sha256').update(text).digest('hex').substring(0, 16);
}

function loadCache() {
  if (!fs.existsSync(CACHE_DB)) return {};
  try { return JSON.parse(fs.readFileSync(CACHE_DB, 'utf8')); } catch (e) { return {}; }
}

function saveCache(cache) {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(CACHE_DB, JSON.stringify(cache, null, 2));
}

function getCached(key) {
  const cache = loadCache();
  return cache[key] || null;
}

function setCached(key, value, meta = {}) {
  const cache = loadCache();
  cache[key] = { value, cachedAt: new Date().toISOString(), ...meta };
  saveCache(cache);
}

function stats() {
  const cache = loadCache();
  const entries = Object.entries(cache);
  const totalSize = entries.reduce((acc, [, v]) => acc + (JSON.stringify(v.value || '').length), 0);
  console.log(`📊 缓存统计`);
  console.log(`   条目数: ${entries.length}`);
  console.log(`   估算大小: ~${Math.round(totalSize / 1024)} KB`);
  console.log(`   存储路径: ${CACHE_DB}`);
}

function clear() {
  if (fs.existsSync(CACHE_DB)) {
    fs.unlinkSync(CACHE_DB);
    console.log('✅ 缓存已清空');
  } else {
    console.log('⏭️  无缓存文件');
  }
}

function get(key) {
  const cached = getCached(key);
  if (cached) {
    console.log('✅ 缓存命中');
    return cached.value;
  }
  console.log('❌ 缓存未命中');
  return null;
}

function set(key, value, meta = {}) {
  setCached(key, value, meta);
  console.log('✅ 已写入缓存');
}

const sub = process.argv[2];
if (sub === 'stats') stats();
else if (sub === 'clear') clear();
else if (sub === 'get') console.log(get(process.argv[3]));
else if (sub === 'set') set(process.argv[3], process.argv[4]);
else {
  console.log('用法: node wiki-cache.js stats|clear|get <key>|set <key> <value>');
  console.log('  build --force   — 预热缓存（扫描所有待处理文件）');
  stats();
}
