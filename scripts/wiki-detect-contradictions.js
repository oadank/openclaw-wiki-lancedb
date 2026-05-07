#!/usr/bin/env node
/**
 * wiki-detect-contradictions.js
 * 矛盾检测（Synthadoc 风格）
 *
 * 当新文件入库时，与同名/同标签的现有页面比对，
 * LLM 判断是否存在矛盾。冲突时：
 *   - 旧页面 status: active → contradicted
 *   - 新页面 certainty: inferred（LLM 推断，非事实）
 *   - 双方声明均保留，用 ⚠️ 标注
 *
 * 用法:
 *   node wiki-detect-contradictions.js <新文件路径> [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const VAULT = process.env.OBSIDIAN_VAULT_PATH || process.env.WIKI_VAULT_PATH ||
  path.join(__dirname, '..');
const MANIFEST_PATH = path.join(VAULT, '.manifest.json');
const LOG_PATH = path.join(VAULT, 'log.md');

const LLM_BASE_URL = process.env.LLM_BASE_URL || 'http://localhost:4000';
const LLM_API_KEY = process.env.LLM_API_KEY || '';
const LLM_MODEL = process.env.LLM_MODEL || 'your-model-name';

// 从 frontmatter 提取字段
function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { fm: '', body: match ? match[2] : content, hasFm: false };
  return { fm: match[1], body: match[2].trim(), hasFm: true };
}

function getField(fm, field) {
  const m = fm.match(new RegExp(`${field}:\\s*"?([^"'\n]+)"?`));
  return m ? m[1].trim() : null;
}

// 找与目标页面标题或标签相似的现有 wiki 页面
function findCandidatePages(targetTitle, targetBody, limit = 5) {
  const results = [];
  const targetLower = (targetTitle + ' ' + targetBody).toLowerCase();

  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir)) {
      if (entry === '.drafts' || entry === '.synthadoc' || entry === '.olw') continue;
      const fullPath = path.join(dir, entry);
      if (fs.statSync(fullPath).isDirectory()) {
        scanDir(fullPath);
      } else if (entry.endsWith('.md') && entry !== 'index.md' && entry !== 'log.md') {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const { fm, body } = extractFrontmatter(content);
          const title = getField(fm, 'title') || entry.replace('.md', '');
          const status = getField(fm, 'status') || 'active';
          const rel = path.relative(VAULT, fullPath);
          // 排除自己
          if (rel === targetTitle) return;
          // 相似度评分：标题词重叠 + 标签重叠
          const titleWords = new Set(title.toLowerCase().split(/[\s\-\/]/).filter(w => w.length > 2));
          const targetWords = new Set(targetLower.split(/[\s\-\/]/).filter(w => w.length > 2));
          let overlap = 0;
          for (const w of titleWords) {
            if (targetWords.has(w)) overlap++;
          }
          // 提取 tags
          const tagsMatch = fm.match(/tags:\s*\[([^\]]*)\]/);
          const tags = tagsMatch ? tagsMatch[1].split(',').map(t => t.trim().replace(/['"]/g, '')).filter(Boolean) : [];
          const bodyOverlap = body.split(/\s+/).filter(w => w.length > 4 && targetLower.includes(w.toLowerCase())).length;
          const score = overlap * 3 + Math.min(bodyOverlap, 20);
          if (score > 2) {
            results.push({ rel, title, status, score, fm, body, fullPath });
          }
        } catch (e) {}
      }
    }
  }

  scanDir(VAULT);
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

// 调用 LLM 判断是否存在矛盾
function checkContradiction(newTitle, newBody, existingTitle, existingBody) {
  const prompt = `You are a fact-checker. Given two texts about the same topic, determine if they CONTRADICT each other.

Texts may use different words but mean the same thing — that is NOT a contradiction.
A contradiction occurs when one text explicitly states the opposite of the other, OR when they make incompatible factual claims.

Respond ONLY with this exact format (no extra text):
CONTRADICTION: yes
REASON: <one sentence explaining why>

or:

CONTRADICTION: no
REASON: <one sentence explaining why>

--- TEXT A ---
${existingTitle}

${existingBody.substring(0, 3000)}

--- TEXT B ---
${newTitle}

${newBody.substring(0, 3000)}
`;

  const tmpFile = '/tmp/wiki-contradiction-prompt.json';
  const payload = {
    model: LLM_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 150,
    temperature: 0
  };
  fs.writeFileSync(tmpFile, JSON.stringify(payload));

  try {
    const result = spawnSync('curl', [
      '-s', '-m', '60',
      `${LLM_BASE_URL}/chat/completions`,
      '-H', `Authorization: Bearer ${LLM_API_KEY}`,
      '-H', 'Content-Type: application/json',
      '-d', `@${tmpFile}`
    ], { encoding: 'utf8', timeout: 70000 });

    if (result.status !== 0) return { contradiction: null, reason: 'LLM call failed' };
    const json = JSON.parse(result.stdout);
    const text = json.choices?.[0]?.message?.content || '';
    const isContradiction = text.toLowerCase().includes('contradiction: yes');
    const reasonMatch = text.match(/REASON:\s*(.+)/s);
    return { contradiction: isContradiction, reason: reasonMatch ? reasonMatch[1].trim() : text };
  } catch (e) {
    return { contradiction: null, reason: e.message };
  } finally {
    try { fs.unlinkSync(tmpFile); } catch (e) {}
  }
}

// 标记页面为 contradicted
function markContradicted(filePath, fm, oldClaim, newClaim, reason) {
  const newFm = fm
    .replace(/status:\s*\w+/, 'status: contradicted')
    .replace(/^certainty:\s*.+$/m, 'certainty: inference');

  // 底部追加矛盾标注
  const contradictionBlock = `\n\n---\n⚠️ **Contradiction Detected** (${new Date().toISOString().split('T')[0]})\n\n**Reason:** ${reason}\n\n**Old claim:**\n> ${oldClaim.substring(0, 500)}\n\n**New claim:**\n> ${newClaim.substring(0, 500)}\n`;

  const content = fs.readFileSync(filePath, 'utf8');
  const { body } = extractFrontmatter(content);
  const updated = `---\n${newFm}\n---\n\n${body}${contradictionBlock}`;
  fs.writeFileSync(filePath, updated);
  console.log(`⚠️  Marked contradicted: ${path.relative(VAULT, filePath)}`);
}

// 追加到 log.md
function appendLog(newFile, candidates, results) {
  const lines = [];
  for (const { rel, title, reason } of results) {
    lines.push(`| ${new Date().toISOString()} | detect-contradiction | ⚠️ | ${newFile} ↔ ${rel}: ${reason} |`);
  }
  if (lines.length === 0) {
    lines.push(`| ${new Date().toISOString()} | detect-contradiction | ✅ | ${newFile}: no contradictions found |`);
  }
  fs.appendFileSync(LOG_PATH, '\n' + lines.join('\n'));
}

// 主流程
async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log('用法: node wiki-detect-contradictions.js <新文件路径> [--dry-run]');
    process.exit(1);
  }

  const newFilePath = args[0];
  const dryRun = args.includes('--dry-run');

  if (!fs.existsSync(newFilePath)) {
    console.log(`❌ 文件不存在: ${newFilePath}`);
    process.exit(1);
  }

  const newContent = fs.readFileSync(newFilePath, 'utf8');
  const { fm: newFm, body: newBody } = extractFrontmatter(newContent);
  const newTitle = getField(newFm, 'title') || path.basename(newFilePath, '.md');

  console.log(`🔍 检测矛盾: ${newTitle}`);

  // 找候选页面
  const candidates = findCandidatePages(newTitle, newBody);
  if (candidates.length === 0) {
    console.log('✅ 未找到候选对比页面，跳过');
    appendLog(newFilePath, candidates, []);
    return;
  }

  console.log(`📋 候选对比页: ${candidates.map(c => c.title).join(', ')}`);

  const results = [];
  for (const cand of candidates) {
    console.log(`  比对: ${cand.title} ...`);
    const { contradiction, reason } = checkContradiction(newTitle, newBody, cand.title, cand.body);
    if (contradiction === null) {
      console.log(`  ⚠️  LLM 不可用，跳过`);
      continue;
    }
    console.log(`  → ${contradiction ? '⚠️ 矛盾' : '✅ 无矛盾'}: ${reason}`);

    results.push({ rel: cand.rel, title: cand.title, reason });

    if (contradiction && !dryRun) {
      // 标记旧页面为 contradicted
      markContradicted(cand.fullPath, cand.fm, cand.body, newBody, reason);
    }
  }

  appendLog(newFilePath, candidates, results);
  console.log(`\n📊 完成: 检测 ${results.length} 项`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
