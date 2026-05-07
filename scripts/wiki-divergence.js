#!/usr/bin/env node
/**
 * wiki-divergence.js - Divergence Check 反偏见区（localwolfpackai 评论建议）
 *
 * 扫描 wiki 页面，为每篇添加 ## Counter-Arguments & Data Gaps 区：
 * - 主动识别偏见、逻辑漏洞、未探索视角
 * - 不发明内容，只从已有 wiki 内容推断
 *
 * 用法:
 *   node wiki-divergence.js              # 全量扫描
 *   node wiki-divergence.js --dry-run    # 预览不写入
 *   node wiki-divergence.js --page <path> # 单页扫描
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const VAULT = process.env.OBSIDIAN_VAULT_PATH || process.env.WIKI_VAULT_PATH || path.join(__dirname, '..');
const LOG_PATH = path.join(VAULT, 'log.md');

const DRY_RUN = process.argv.includes('--dry-run');

const LLM_BASE_URL = process.env.LLM_BASE_URL || 'http://localhost:4000';
const LLM_API_KEY = process.env.LLM_API_KEY || '';
const LLM_MODEL = process.env.LLM_MODEL || 'your-model-name';

function extractFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  return m ? { fm: m[1], body: m[2].trim() } : { fm: '', body: content };
}

function getField(fm, field) {
  const m = fm.match(new RegExp(`${field}:\\s*"?([^"'\n]+)"?`));
  return m ? m[1].trim() : null;
}

function callLLM(prompt, maxTokens = 800) {
  const tmpFile = '/tmp/wiki-divergence-prompt.json';
  const payload = {
    model: LLM_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
    temperature: 0.3
  };
  fs.writeFileSync(tmpFile, JSON.stringify(payload));
  try {
    const r = spawnSync('curl', [
      '-s', '-m', '90',
      `${LLM_BASE_URL}/chat/completions`,
      '-H', `Authorization: Bearer ${LLM_API_KEY}`,
      '-H', 'Content-Type: application/json',
      '-d', `@${tmpFile}`
    ], { encoding: 'utf8', timeout: 100000 });
    if (r.status !== 0) return null;
    return JSON.parse(r.stdout).choices?.[0]?.message?.content || null;
  } catch (e) { return null; }
  finally { try { fs.unlinkSync(tmpFile); } catch (e) {} }
}

function appendLog(details) {
  const line = `\n| ${new Date().toISOString()} | divergence-check | ✅ | ${details} |`;
  if (fs.existsSync(LOG_PATH)) fs.appendFileSync(LOG_PATH, line);
}

function findWikiPages() {
  const results = [];
  function scan(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir)) {
      if (/^\./.test(entry) || entry === '.drafts' || entry === '.olw') continue;
      const full = path.join(dir, entry);
      if (fs.statSync(full).isDirectory()) scan(full);
      else if (entry.endsWith('.md') && entry !== 'index.md' && entry !== 'log.md') {
        results.push({ rel: path.relative(VAULT, full), full });
      }
    }
  }
  scan(VAULT);
  return results;
}

function checkHasDivergence(body) {
  return /## Counter-Arguments/.test(body) || /## Data Gaps/.test(body);
}

async function generateDivergence(pageTitle, body) {
  const prompt = `You are a critical thinking auditor. Analyze the following article and identify:

1. **Counter-Arguments**: What opposing viewpoints, weaknesses, or challenges to the main thesis exist or should be considered?
2. **Data Gaps**: What information is missing, unverified, or requires further investigation?

Respond ONLY in this exact format (no extra text):

COUNTER_ARGUMENTS:
1. [specific counter-argument or bias to consider]
2. ...

DATA_GAPS:
1. [specific missing information or verification needed]
2. ...

If none found for a section, write "none".

---

# ${pageTitle}

${body.substring(0, 5000)}
`;
  return callLLM(prompt);
}

function parseDivergence(text) {
  const caMatch = text.match(/COUNTER_ARGUMENTS:\n([\s\S]*?)(?=DATA_GAPS:|$)/);
  const dgMatch = text.match(/DATA_GAPS:\n([\s\S]*?)$/);

  const ca = caMatch
    ? caMatch[1].trim().split('\n').filter(l => l.trim() && !l.toLowerCase().includes('none'))
    : [];
  const dg = dgMatch
    ? dgMatch[1].trim().split('\n').filter(l => l.trim() && !l.toLowerCase().includes('none'))
    : [];

  return { ca, dg };
}

function buildDivergenceSection(ca, dg) {
  const parts = [];
  if (ca.length > 0) {
    parts.push('## Counter-Arguments & Biases\n\n' + ca.join('\n'));
  }
  if (dg.length > 0) {
    parts.push('## Data Gaps & Verification Needed\n\n' + dg.join('\n'));
  }
  if (parts.length === 0) return '';
  return '\n\n---\n\n' + parts.join('\n\n') + '\n';
}

async function processPage(rel, full) {
  const content = fs.readFileSync(full, 'utf8');
  const { fm, body } = extractFrontmatter(content);
  const title = getField(fm, 'title') || rel.replace('.md', '');

  // 检查是否已有 divergence 区
  const cleanBody = body.replace(/## Counter-Arguments[\s\S]*$/, '').trim();

  console.log(`  🔍 ${rel} ...`);
  const llmResult = await generateDivergence(title, cleanBody);
  if (!llmResult) {
    console.log(`  ⚠️  LLM 不可用，跳过`);
    return false;
  }

  const { ca, dg } = parseDivergence(llmResult);
  if (ca.length === 0 && dg.length === 0) {
    console.log(`  ⏭️  无反偏见/数据缺口内容，跳过`);
    return false;
  }

  const section = buildDivergenceSection(ca, dg);
  const newContent = `---\n${fm}\n---\n\n${cleanBody}${section}`;

  if (!DRY_RUN) {
    fs.writeFileSync(full, newContent);
    console.log(`  ✅ 已添加（${ca.length} 反驳 + ${dg.length} 缺口）`);
  } else {
    console.log(`  [dry-run] 本应写入: ${rel}`);
  }

  return true;
}

async function main() {
  if (DRY_RUN) console.log('🔍 [dry-run 模式 — 不写入任何内容]\n');

  const singlePage = process.argv.find((a, i) => a === '--page' && process.argv[i + 1]);
  const pages = singlePage
    ? [{ rel: process.argv[process.argv.indexOf('--page') + 1], full: path.join(VAULT, process.argv[process.argv.indexOf('--page') + 1]) }]
    : findWikiPages();

  console.log(`📋 待扫描: ${pages.length} 个页面\n`);
  let processed = 0;

  for (const { rel, full } of pages) {
    if (!fs.existsSync(full)) continue;
    const body = extractFrontmatter(fs.readFileSync(full, 'utf8')).body;
    if (checkHasDivergence(body)) {
      console.log(`  ⏭️  已存在 Divergence 区，跳过: ${rel}`);
      continue;
    }
    try {
      const ok = await processPage(rel, full);
      if (ok) {
        processed++;
        appendLog(rel);
      }
    } catch (e) {
      console.log(`  ❌ 错误: ${e.message}`);
    }
  }

  console.log(`\n📊 完成: 扫描 ${pages.length} 页，新增 ${processed} 个反偏见区`);
  if (DRY_RUN) console.log('（dry-run，未写入）');
}

main().catch(err => { console.error('Fatal error:', err); process.exit(1); });
