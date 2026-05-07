#!/usr/bin/env node
/**
 * Wiki Vector Search - LanceDB + BM25 fallback
 * 混合搜索：向量 + BM25 融合
 * 
 * lancedb 模块延迟加载 — 只在 build 命令时加载，search 命令优先用 grep
 */
const { execSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const VAULT = process.env.WIKI_VAULT_PATH || path.join(__dirname, '..');
const DB_PATH = path.join(VAULT, '.lancedb', 'vector_db');
const EMBED_URL = process.env.EMBEDDING_URL || 'http://host.docker.internal:11435/v1/embeddings';
const RERANK_URL = process.env.RERANK_URL || 'https://api.siliconflow.cn/v1/rerank';
const RERANK_API_KEY = process.env.SILICONFLOW_API_KEY || "";
const RERANK_MODEL = "BAAI/bge-reranker-v2-m3";
const MODEL = "bge-small-zh-v1.5";
const DIMENSIONS = 512;
const BATCH_SIZE = 20;

// Lazy lancedb load
let _lancedb = null;
let _lancedbError = null;
function getLancedb() {
  if (_lancedb) return _lancedb;
  if (_lancedbError) return null;
  try {
    _lancedb = require("@lancedb/lancedb");
    return _lancedb;
  } catch(e) {
    _lancedbError = e.message;
    return null;
  }
}

async function embed(texts) {
  const input = Array.isArray(texts) ? texts.map(t => String(t || '')) : [String(texts || '')];
  const payloadObj = { input, model: MODEL, encoding_format: "float" };
  const tmpFile = `/tmp/wiki-embed-${Date.now()}.json`;
  fs.writeFileSync(tmpFile, JSON.stringify(payloadObj));
  try {
    const result = spawnSync('curl', [
      '-s', '-m', '300', EMBED_URL,
      '-H', 'Content-Type: application/json',
      '-d', `@${tmpFile}`
    ], { encoding: 'utf8', timeout: 310000 });
    if (result.status !== 0) throw new Error(result.stderr || 'curl failed');
    const json = JSON.parse(result.stdout);
    const vecs = (json?.data || []).map(item => item.embedding);
    return Array.isArray(texts) ? vecs : vecs[0];
  } finally {
    try { fs.unlinkSync(tmpFile); } catch(e) {}
  }
}

function collectPages() {
  const pages = [];
  for (const dirName of fs.readdirSync(VAULT).sort()) {
    const dirPath = path.join(VAULT, dirName);
    if (!fs.statSync(dirPath).isDirectory()) continue;
    if (dirName.startsWith('.') || dirName === 'scripts' || dirName === 'raw') continue;
    for (const file of fs.readdirSync(dirPath).sort()) {
      if (!file.endsWith('.md')) continue;
      const filePath = path.join(dirPath, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const relPath = path.relative(VAULT, filePath);
        const title = extractTitle(content, file);
        const summary = extractSummary(content);
        const text = content.slice(0, 3000);
        pages.push({ path: relPath, title, summary, text, category: dirName });
      } catch(e) {}
    }
  }
  return pages;
}

function extractTitle(content, filename) {
  const fm = content.match(/^---\n(.*?)\n---\n/s);
  if (fm) {
    const tm = fm[1].match(/^title:\s*["']?([^\n"']+)["']?\s*$/m);
    if (tm) return tm[1].trim();
    const sm = fm[1].match(/^summary:\s*["']?([^\n"']+)["']?\s*$/m);
    if (sm) return sm[1].trim();
  }
  const h1 = content.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();
  return filename.replace(/\.md$/, '').replace(/[-_]/g, ' ');
}

function extractSummary(content) {
  const fm = content.match(/^---\n(.*?)\n---\n/s);
  if (fm) {
    const sm = fm[1].match(/^summary:\s*["']?([^\n"']+)["']?\s*$/m);
    if (sm) return sm[1].trim();
  }
  return '';
}

async function build() {
  const lancedb = getLancedb();
  if (!lancedb) {
    console.error('❌ lancedb 模块不可用:', _lancedbError);
    process.exit(1);
  }
  const pages = collectPages();
  console.log(`📄 收集到 ${pages.length} 个页面`);

  const allEmbeddings = [];
  for (let i = 0; i < pages.length; i += BATCH_SIZE) {
    const batch = pages.slice(i, i + BATCH_SIZE);
    const texts = batch.map(p => `${p.title} ${p.summary} ${p.text}`);
    const vecs = await embed(texts);
    allEmbeddings.push(...vecs);
    process.stdout.write(`\r  进度: ${Math.min(i + BATCH_SIZE, pages.length)}/${pages.length}`);
  }
  console.log();

  const db = await lancedb.connect(DB_PATH);
  const data = pages.map((p, i) => ({
    path: p.path, title: p.title, summary: p.summary,
    text: p.text, category: p.category || path.dirname(p.path),
    vector: allEmbeddings[i]
  }));
  const tbl = await db.createTable("wiki", data, { mode: "overwrite" });
  console.log(`✅ 向量库已重建: ${data.length} 页`);
  const idx = { page_count: data.length, last_updated: Date.now(), embedding_model: MODEL, dimensions: DIMENSIONS };
  fs.writeFileSync(path.join(VAULT, ".lancedb", "index.json"), JSON.stringify(idx, null, 2));
}

function grepSearch(query, topK = 5) {
  const results = [];
  try {
    const output = execSync(`grep -rl "${query.replace(/"/g, '\\"')}" "${VAULT}" --include="*.md" 2>/dev/null | head -20`, { encoding: 'utf8' });
    for (const file of output.split('\n').filter(Boolean)) {
      const relPath = path.relative(VAULT, file);
      try {
        const content = fs.readFileSync(file, 'utf8');
        const title = extractTitle(content, path.basename(file));
        const snippet = content.slice(0, 200).replace(/\n/g, ' ').trim();
        results.push({ path: relPath, title, text: snippet, score: 1.0 });
      } catch {}
    }
  } catch {}
  return results.slice(0, topK);
}

async function rerank(query, docs, topN = null) {
  if (!RERANK_API_KEY || docs.length <= 1) return null;
  const payload = { model: RERANK_MODEL, query, documents: docs, top_n: topN || docs.length };
  try {
    const r = spawnSync('curl', ['-s', '-m', '10', RERANK_URL,
      '-H', `Authorization: Bearer ${RERANK_API_KEY}`,
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify(payload)], { encoding: 'utf8', timeout: 15000 });
    if (r.status !== 0) return null;
    return JSON.parse(r.stdout).results || [];
  } catch { return null; }
}

async function search(query, topK = 5) {
  // Grep 搜索
  const results = grepSearch(query, topK);
  
  // 尝试向量搜索（仅当 lancedb 可用时）
  const lancedb = getLancedb();
  if (lancedb) {
    try {
      const db = await lancedb.connect(DB_PATH);
      const tbl = await db.openTable("wiki");
      const vec = await embed([query]);
      const vecResults = await tbl.search(vec[0]).limit(topK * 2).toArray();
      for (const r of vecResults) {
        if (!results.find(g => g.path === r.path)) {
          results.push({ path: r.path, text: r.text || '', score: 1 - r._distance / 2 });
        }
      }
    } catch(e) {
      console.error('⚠️ 向量搜索失败:', e.message);
    }
  }

  // Rerank
  if (RERANK_API_KEY && results.length > 1) {
    const docs = results.map(r => r.text);
    const ranked = await rerank(query, docs, topK);
    if (ranked) {
      return ranked.map(r => results[r.index]);
    }
  }
  return results.slice(0, topK);
}

const cmd = process.argv[2];
if (cmd === "build") {
  build().catch(e => { console.error(e); process.exit(1); });
} else if (cmd === "search") {
  const query = process.argv[3] || "how to configure";
  const topK = parseInt(process.argv[4]) || 5;
  search(query, topK).then(results => {
    results.forEach((r, i) => {
      console.log(`[${i + 1}] ${r.path}`);
      console.log(`    ${r.text.slice(0, 150)}`);
    });
    if (results.length === 0) console.log('无结果');
  });
} else {
  console.log("Usage: wiki-vector-search.js [build|search <query> [top_k]]");
}
