#!/usr/bin/env node
/**
 * wiki-ingest: 读取 raw 目录的文档，调用 LLM 提炼为 wiki 页面
 * 用法: node scripts/ingest.js [--full] [--raw]
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const VAULT = process.env.OBSIDIAN_VAULT_PATH || process.env.WIKI_VAULT_PATH || path.join(__dirname, '..');
const RAW_DIR = path.join(VAULT, '_raw');
const SOURCES_DIR = process.env.OBSIDIAN_SOURCES_DIR || path.join(VAULT, 'raw');
const MANIFEST_PATH = path.join(VAULT, '.manifest.json');
const LOG_PATH = path.join(VAULT, 'log.md');
const INDEX_PATH = path.join(VAULT, 'index.md');

function loadManifest() {
  if (fs.existsSync(MANIFEST_PATH)) {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  }
  return { version: '1.1.0', created: new Date().toISOString(), projects: {}, sources: {} };
}

function saveManifest(manifest) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

function appendLog(operation, status, details) {
  const line = `| ${new Date().toISOString()} | ${operation} | ${status} | ${details} |`;
  let log = fs.readFileSync(LOG_PATH, 'utf8');
  log += '\n' + line;
  fs.writeFileSync(LOG_PATH, log);
}

function sha256(filepath) {
  const content = fs.readFileSync(filepath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function discoverNewSources() {
  const manifest = loadManifest();
  const sources = [];
  const existingSources = manifest.sources || {};

  for (const dir of [RAW_DIR, SOURCES_DIR]) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      const fullpath = path.join(dir, file);
      const stat = fs.statSync(fullpath);
      if (!stat.isFile()) continue;
      const ext = path.extname(file).toLowerCase();
      if (!['.md', '.txt', '.markdown'].includes(ext)) continue;

      const hash = sha256(fullpath);
      const existing = existingSources[fullpath];
      if (existing && existing.contentHash === hash) continue;

      sources.push({ path: fullpath, hash, isNew: !existing });
    }
  }
  return sources;
}

function findExistingPages(query) {
  const pages = [];
  for (const cat of ['concepts', 'entities', 'skills', 'references', 'synthesis']) {
    const dir = path.join(VAULT, cat);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.md')) continue;
      const fullpath = path.join(dir, file);
      const content = fs.readFileSync(fullpath, 'utf8');
      const titleMatch = content.match(/^title:\s*(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : file.replace('.md', '');
      pages.push({ path: fullpath, title, category: cat, content });
    }
  }
  return pages;
}

// LLM 配置（LiteLLM 代理 — claude-model）
const LLM_BASE_URL = process.env.LLM_BASE_URL || 'http://localhost:4000';
const LLM_API_KEY = process.env.LLM_API_KEY || '';
const LLM_MODEL = process.env.LLM_MODEL || 'your-model-name';

async function callLLM(prompt) {
  const { execSync } = require('child_process');
  const payload = JSON.stringify({
    model: LLM_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 4000,
    temperature: 0.3
  });
  const cmd = `curl -s -m 120 ${LLM_BASE_URL}/chat/completions \\
    -H "Authorization: Bearer ${LLM_API_KEY}" \\
    -H "Content-Type: application/json" \\
    -d '${payload.replace(/'/g, "'\\''")}'`;
  try {
    const output = execSync(cmd, { encoding: 'utf8', timeout: 130000 });
    const json = JSON.parse(output);
    return json.choices?.[0]?.message?.content || null;
  } catch(e) {
    return null;
  }
}

async function ingestSource(source) {
  console.log(`\n📥 Ingesting: ${path.basename(source.path)}`);
  let content = fs.readFileSync(source.path, 'utf8');
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const sourceTitle = path.basename(source.path).replace(/\.\w+$/, '').replace(/[-_]/g, ' ');
  const body = fmMatch ? fmMatch[2] : content;
  const existingPages = findExistingPages(sourceTitle);

  const prompt = `你是一个知识库编辑。请将以下文档提炼为 Obsidian Wiki 页面。
**规则**:
1. 从已有相关页面中提炼整合，不要重复创建
2. 使用 [[wikilinks]] 关联相关概念
3. 输出 YAML frontmatter: title, category, tags, sources, created, updated
4. 分类只能是: concepts, entities, skills, references, synthesis
5. 输出格式：先 frontmatter，再正文

**已有相关页面**:
${existingPages.slice(0, 5).map(p => `- ${p.category}/${p.title}`).join('\n') || '无'}

**源文档**:
\`\`\`
${body.substring(0, 8000)}
\`\`\`

请输出提炼后的 wiki 页面内容（Markdown 格式）：`;

  const llmResult = await callLLM(prompt);

  if (!llmResult) {
    console.log(`⚠️  LLM 不可用，将源文档复制到 wiki 供后续处理`);
    const targetDir = path.join(VAULT, 'references');
    const targetName = path.basename(source.path);
    const targetPath = path.join(targetDir, targetName);
    const frontmatter = `---
title: "${sourceTitle}"
category: references
tags: []
sources:
  - ${source.path}
created: "${new Date().toISOString()}"
updated: "${new Date().toISOString()}"
---

`;
    fs.writeFileSync(targetPath, frontmatter + content);
    appendLog('ingest', '⚠️ 跳过 LLM', `直接复制 ${path.basename(source.path)}`);
    return { path: targetPath, title: sourceTitle };
  }

  const outputMatch = llmResult.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!outputMatch) {
    console.log(`⚠️  LLM 输出格式异常，直接保存`);
    const targetDir = path.join(VAULT, 'references');
    const targetPath = path.join(targetDir, path.basename(source.path));
    fs.writeFileSync(targetPath, llmResult);
    appendLog('ingest', '⚠️ 格式异常', `直接保存 ${path.basename(source.path)}`);
    return { path: targetPath, title: sourceTitle };
  }

  const frontmatter = outputMatch[1];
  const wikiBody = outputMatch[2].trim();
  const catMatch = frontmatter.match(/category:\s*(\w+)/);
  const category = catMatch ? catMatch[1] : 'references';
  const titleMatch = frontmatter.match(/title:\s*"?([^"]+)"?/);
  const title = titleMatch ? titleMatch[1].trim() : sourceTitle;
  const targetDir = path.join(VAULT, category);
  const targetName = title.toLowerCase().replace(/[^a-z\u4e00-\u9fafa-z0-9]+/g, '-').replace(/-+$/, '') + '.md';
  const targetPath = path.join(targetDir, targetName);
  const fullContent = `---\n${frontmatter}\n---\n\n${wikiBody}`;
  fs.writeFileSync(targetPath, fullContent);

  const manifest = loadManifest();
  if (!manifest.projects) manifest.projects = {};
  if (!manifest.sources) manifest.sources = {};
  
  const ext = path.extname(source.path).toLowerCase();
  const formatMap = { '.md': 'markdown', '.txt': 'text', '.markdown': 'markdown' };
  
  manifest.sources[source.path] = {
    ingestedAt: new Date().toISOString(),
    contentHash: source.hash,
    sourceType: 'local-file',
    format: formatMap[ext] || ext.replace('.', ''),
    project: 'manual',
    pagesCreated: [path.relative(VAULT, targetPath).replace(/\\/g, '/')]
  };
  manifest.updatedAt = new Date().toISOString();
  saveManifest(manifest);

  appendLog('ingest', '✅', `${path.basename(source.path)} → ${category}/${targetName}`);
  console.log(`✅ ${path.basename(source.path)} → ${category}/${targetName}`);
  return { path: targetPath, title };
}

function updateIndex() {
  const index = [];
  for (const cat of ['concepts', 'entities', 'skills', 'references', 'synthesis']) {
    const dir = path.join(VAULT, cat);
    if (!fs.existsSync(dir)) continue;
    const entries = [];
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.md')) continue;
      const fullpath = path.join(dir, file);
      const content = fs.readFileSync(fullpath, 'utf8');
      const titleMatch = content.match(/^title:\s*"?([^"]+)"?/m);
      const summaryMatch = content.match(/summary:\s*"?([^"]+)"?/m);
      const title = titleMatch ? titleMatch[1].trim() : file.replace('.md', '');
      const summary = summaryMatch ? summaryMatch[1].trim() : '';
      entries.push(`- [[${cat}/${title}]]${summary ? ' — ' + summary : ''}`);
    }
    if (entries.length > 0) {
      index.push(`## ${cat.charAt(0).toUpperCase() + cat.slice(1)}\n\n${entries.join('\n')}`);
    }
  }

  let indexPath = fs.readFileSync(INDEX_PATH, 'utf8');
  const lines = indexPath.split('\n');
  const headerLines = lines.filter(l => l.startsWith('#') || l.startsWith('>'));
  const journalLines = [];
  if (fs.existsSync(path.join(VAULT, 'journal'))) {
    for (const file of fs.readdirSync(path.join(VAULT, 'journal'))) {
      if (!file.endsWith('.md')) continue;
      journalLines.push(`- [[journal/${file.replace('.md', '')}]]`);
    }
  }

  const newIndex = [...headerLines, '', ...index, '', journalLines.length > 0 ? `## Journal\n\n${journalLines.join('\n')}` : '## Journal\n_No pages yet_'].join('\n');
  fs.writeFileSync(INDEX_PATH, newIndex);
}

async function main() {
  const args = process.argv.slice(2);
  const fullMode = args.includes('--full');
  const rawMode = args.includes('--raw');

  console.log('🔍 发现新源文档...');
  const sources = discoverNewSources();

  if (sources.length === 0) {
    console.log('✅ 没有新文档需要处理');
    return;
  }

  console.log(`📋 找到 ${sources.length} 个新/修改的文档`);
  let successCount = 0;
  for (const source of sources) {
    try {
      await ingestSource(source);
      successCount++;
    } catch (err) {
      console.error(`❌ 处理失败: ${source.path} - ${err.message}`);
      appendLog('ingest', '❌', `${path.basename(source.path)}: ${err.message}`);
    }
  }

  console.log(`\n📊 处理完成: ${successCount}/${sources.length} 成功`);
  console.log('🔄 更新索引...');
  updateIndex();
  console.log('✅ 索引已更新');

  // 自动同步向量库（方案 C: ingest 后更新向量）
  console.log('🧠 同步向量数据库...');
  const { execSync } = require('child_process');
  try {
    const vectorScript = path.join(VAULT, '.lancedb', 'wiki-vector-search.js');
    const output = execSync(`node "${vectorScript}" build 2>&1`, { encoding: 'utf8', timeout: 300000 });
    console.log('✅ 向量库已同步');
  } catch(e) {
    console.error(`⚠️ 向量库同步失败: ${e.message}`);
    console.error('   可手动执行: node .lancedb/wiki-vector-search.js build');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
