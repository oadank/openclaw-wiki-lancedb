#!/usr/bin/env node
/**
 * wiki-review.js - 草稿审核 + 拒绝反馈（olw 核心机制）
 *
 * 审核 .drafts/ 目录下的待审草稿：
 *   [a]pprove  → 移至正式目录，清理标注
 *   [r]eject  → 记录拒绝原因，下次 refine 自动注入
 *   [d]iff    → 对比草稿与正式版差异
 *   [e]dit    → 编辑草稿后重新提交
 *   [q]uit    → 退出
 *
 * 用法:
 *   node wiki-review.js [--dry-run]     # 预览模式（不写入）
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VAULT = process.env.OBSIDIAN_VAULT_PATH || process.env.WIKI_VAULT_PATH || path.join(__dirname, '..');
const DRAFTS_DIR = path.join(VAULT, '.drafts');
const REJECTIONS_PATH = path.join(VAULT, '.olw', 'rejections.json');
const LOG_PATH = path.join(VAULT, 'log.md');

const DRY_RUN = process.argv.includes('--dry-run');

// ── helpers ────────────────────────────────────────────────────────────────

function extractFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  return m ? { fm: m[1], body: m[2].trim() } : { fm: '', body: content };
}

function getField(fm, field) {
  const m = fm.match(new RegExp(`${field}:\\s*"?([^"'\n]+)"?`));
  return m ? m[1].trim() : null;
}

function loadRejections() {
  if (fs.existsSync(REJECTIONS_PATH)) {
    try { return JSON.parse(fs.readFileSync(REJECTIONS_PATH, 'utf8')); } catch (e) {}
  }
  return {}; // { "page-title": { reasons: [], count: 0, blocked: false } }
}

function saveRejections(data) {
  const dir = path.dirname(REJECTIONS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(REJECTIONS_PATH, JSON.stringify(data, null, 2));
}

function appendLog(operation, status, details) {
  const line = `\n| ${new Date().toISOString()} | ${operation} | ${status} | ${details} |`;
  fs.appendFileSync(LOG_PATH, line);
}

function readDrafts() {
  if (!fs.existsSync(DRAFTS_DIR)) return [];
  return fs.readdirSync(DRAFTS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const content = fs.readFileSync(path.join(DRAFTS_DIR, f), 'utf8');
      const { fm, body } = extractFrontmatter(content);
      return {
        filename: f,
        title: getField(fm, 'title') || f.replace('.md', ''),
        status: getField(fm, 'status') || 'draft',
        sources: fm.match(/sources:\n([\s\S]*?)(?=\n\w|$)/)?.[1] || '',
        body: body.substring(0, 200),
        path: path.join(DRAFTS_DIR, f),
        content,
      };
    });
}

function getRejectionsFor(title) {
  const data = loadRejections();
  return data[title] || null;
}

function addRejection(title, reason) {
  const data = loadRejections();
  if (!data[title]) data[title] = { reasons: [], count: 0, blocked: false };
  data[title].reasons.push({
    reason,
    timestamp: new Date().toISOString(),
  });
  data[title].count++;
  if (data[title].count >= 5) data[title].blocked = true;
  saveRejections(data);
  return data[title];
}

function clearRejections(title) {
  const data = loadRejections();
  if (data[title]) {
    data[title] = { reasons: [], count: 0, blocked: false };
    saveRejections(data);
  }
}

// 清理草稿中的 low-confidence / single-source 注释
function stripAnnotations(body) {
  return body
    .replace(/<!-- olw-auto: low-confidence[\s\S]*?-->/g, '')
    .replace(/<!-- olw-auto: single-source[\s\S]*?-->/g, '')
    .replace(/<!-- olw-auto:[\s\S]*?-->/g, '')
    .trim();
}

// ── diff ─────────────────────────────────────────────────────────────

function showDiff(draftPath, existingPath) {
  if (!fs.existsSync(existingPath)) {
    console.log('（无正式版对比，纯新建）');
    return;
  }
  try {
    const out = execSync(`diff -u "${existingPath}" "${draftPath}" 2>&1`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    console.log(out.substring(0, 3000));
  } catch (e) {
    console.log('diff 输出:\n' + e.stdout?.substring(0, 3000));
  }
}

// ── approve ──────────────────────────────────────────────────────────

function approveDraft(draft) {
  const { fm, body } = extractFrontmatter(draft.content);
  const title = getField(fm, 'title') || draft.title;
  const category = getField(fm, 'category') || 'references';

  // 清理标注，生成正式内容
  const cleanBody = stripAnnotations(body);
  const refinedContent = `---\n${fm}\n---\n\n${cleanBody}`;

  const targetDir = path.join(VAULT, category);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  const targetPath = path.join(targetDir, draft.filename);

  if (!DRY_RUN) {
    // 备份旧版（如果有）
    if (fs.existsSync(targetPath)) {
      fs.renameSync(targetPath, targetPath + '.bak.' + Date.now());
    }
    fs.writeFileSync(targetPath, refinedContent);
    fs.unlinkSync(draft.path);
    clearRejections(title);
    appendLog('review-approve', '✅', `${draft.filename} → ${category}/`);
    console.log(`✅ 批准: ${draft.filename} → ${category}/`);
  } else {
    console.log(`[dry-run] 批准: ${draft.filename} → ${category}/`);
  }
}

// ── reject ───────────────────────────────────────────────────────────

function rejectDraft(draft, reason) {
  const title = getField(extractFrontmatter(draft.content).fm, 'title') || draft.title;
  if (!DRY_RUN) {
    const result = addRejection(title, reason);
    appendLog('review-reject', '⚠️', `${draft.filename}: ${reason}（累计 ${result.count} 次）`);
    if (result.blocked) {
      console.log(`🚫 已自动屏蔽（5 次拒绝）: ${title}`);
      console.log(`   解除屏蔽: node wiki-review.js --unblock "${title}"`);
    } else {
      console.log(`⚠️ 拒绝: ${draft.filename}，原因已记录（累计 ${result.count} 次）`);
    }
  } else {
    console.log(`[dry-run] 拒绝: ${draft.filename}, reason: ${reason}`);
  }
}

// ── 交互式菜单 ─────────────────────────────────────────────────────

const rl = (() => {
  try {
    const readline = require('readline');
    return readline.createInterface({ input: process.stdin, output: process.stdout });
  } catch (e) { return null; }
})();

function ask(question) {
  return new Promise(resolve => {
    if (!rl) { console.log(question + ' (y/n)'); resolve('n'); return; }
    rl.question(question, ans => resolve(ans.trim()));
  });
}

async function reviewDraft(draft) {
  console.log('\n' + '═'.repeat(60));
  console.log(`📄 ${draft.filename}`);
  console.log(`   status: ${draft.status}`);
  const rej = getRejectionsFor(draft.title);
  if (rej && rej.count > 0) {
    console.log(`   ⚠️  累计拒绝: ${rej.count} 次`);
    if (rej.blocked) { console.log('   🚫 已屏蔽（需手动解除）'); }
    if (rej.reasons.length > 0) {
      console.log('   拒绝原因:');
      rej.reasons.slice(-3).forEach(r => console.log(`     - ${r.reason}`));
    }
  }
  console.log('\n' + draft.body.substring(0, 500));
  console.log('\n' + '═'.repeat(60));

  while (true) {
    const choice = await ask('[a]pprove / [r]eject / [d]iff / [e]dit / [q]uit: ');
    const c = choice.toLowerCase();

    if (c === 'a' || c === 'approve' || c === '1') {
      approveDraft(draft);
      return;
    }

    if (c === 'r' || c === 'reject' || c === '2') {
      const reason = await ask('  拒绝原因: ');
      if (reason.trim()) {
        rejectDraft(draft, reason.trim());
      } else {
        console.log('  取消（需填写原因）');
      }
      return;
    }

    if (c === 'd' || c === 'diff' || c === '3') {
      const existingPath = path.join(VAULT, getField(extractFrontmatter(draft.content).fm, 'category') || 'references', draft.filename);
      showDiff(draft.path, existingPath);
    }

    if (c === 'e' || c === 'edit' || c === '4') {
      console.log(`  请手动编辑: ${draft.path}`);
      console.log('  编辑后重新运行 node wiki-review.js');
      return 'break';
    }

    if (c === 'q' || c === 'quit' || c === '0') {
      return 'quit';
    }

    console.log('  无效选项，请重试');
  }
}

// ── main ──────────────────────────────────────────────────────────────

async function main() {
  if (DRY_RUN) console.log('🔍 [dry-run 模式 — 不写入任何内容]\n');

  // 处理 --unblock
  if (process.argv.includes('--unblock')) {
    const title = process.argv[process.argv.indexOf('--unblock') + 1];
    if (!title) { console.log('❌ 需要提供标题: --unblock "页面标题"'); process.exit(1); }
    const data = loadRejections();
    if (data[title]) { data[title] = { reasons: [], count: 0, blocked: false }; saveRejections(data); }
    console.log(`✅ 已解除屏蔽: ${title}`);
    return;
  }

  // 处理 --reject（无交互）
  if (process.argv.includes('--reject')) {
    const idx = process.argv.indexOf('--reject');
    const title = process.argv[idx + 1];
    const reason = process.argv[idx + 2] || 'manual reject';
    if (!title) { console.log('❌ --reject 需要标题'); process.exit(1); }
    const drafts = readDrafts();
    const draft = drafts.find(d => d.title === title);
    if (draft) rejectDraft(draft, reason); else console.log(`❌ 未找到草稿: ${title}`);
    return;
  }

  if (!fs.existsSync(DRAFTS_DIR)) {
    console.log('❌ 无待审草稿: .drafts/ 目录不存在');
    process.exit(0);
  }

  const drafts = readDrafts();
  if (drafts.length === 0) {
    console.log('📂 .drafts/ 为空，无待审草稿');
    return;
  }

  console.log(`📋 待审草稿 (${drafts.length} 个)\n`);
  drafts.forEach((d, i) => {
    const rej = getRejectionsFor(d.title);
    const flag = rej?.blocked ? '🚫 ' : rej?.count > 0 ? `⚠️ ${rej.count}次 ` : '  ';
    console.log(`  [${i + 1}] ${flag}${d.title}`);
  });

  while (true) {
    const choice = await ask('\n选择草稿编号（或 q 退出）: ');
    const num = parseInt(choice, 10);

    if (isNaN(num)) {
      if (choice.toLowerCase().startsWith('q')) break;
      console.log('请输入编号或 q');
      continue;
    }

    if (num < 1 || num > drafts.length) {
      console.log(`编号范围 1-${drafts.length}`);
      continue;
    }

    const result = await reviewDraft(drafts[num - 1]);
    if (result === 'quit') break;

    // 重新读取（草稿可能已被 approve/reject）
    const updatedDrafts = readDrafts();
    if (updatedDrafts.length === 0) {
      console.log('\n📂 草稿已全部处理完毕');
      break;
    }
  }

  if (rl) rl.close();
  console.log('\n✅ 审核结束');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
