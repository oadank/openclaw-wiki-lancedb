#!/usr/bin/env node
/**
 * wiki-delete-vector.js: 从 LanceDB 删除指定向量的辅助脚本
 * 用法: node wiki-delete-vector.js <page_path>
 */
const lancedb = require("@lancedb/lancedb");
const fs = require("fs");
const path = require("path");

const VAULT = process.env.WIKI_VAULT_PATH || path.join(__dirname, '..');
const DB_PATH = path.join(VAULT, '.lancedb', 'vector_db');

async function deleteVector(pagePath) {
  const db = await lancedb.connect(DB_PATH);
  const tbl = await db.openTable("wiki");
  
  // 使用 query() 检查是否存在（不需要向量）
  const existing = await tbl.query().where(`path = '${pagePath}'`).limit(1).toArray();
  if (existing.length === 0) {
    console.log(`NOT_FOUND:${pagePath}`);
    process.exit(1);
  }
  
  // 执行删除
  await tbl.delete(`path = '${pagePath}'`);
  console.log(`DELETED:${pagePath}`);
  
  // 更新 index.json
  const indexPath = path.join(VAULT, '.lancedb', 'index.json');
  if (fs.existsSync(indexPath)) {
    const idx = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    idx.page_count = Math.max(0, (idx.page_count || 0) - 1);
    idx.last_updated = Date.now();
    fs.writeFileSync(indexPath, JSON.stringify(idx, null, 2));
  }
}

const pagePath = process.argv[2];
if (!pagePath) {
  console.error('用法: node wiki-delete-vector.js <page_path>');
  process.exit(1);
}

deleteVector(pagePath).catch(err => {
  console.error(`ERROR:${err.message}`);
  process.exit(1);
});
