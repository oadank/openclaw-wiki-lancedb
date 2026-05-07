#!/usr/bin/env node
/**
 * wiki-refine.js: Wiki 后期精加工（olw 草稿审核模式）
 * 读取已入库的 wiki 页面 → 调 LLM 补充 summary / tags / wikilinks / citations
 * → 输出到 .drafts/ 目录 → 需人工审核（approve/reject）后再转正
 * 
 * 用法:
 *   node wiki-refine.js <分类/文件名>          # 精炼单个文件到草稿区
 *   node wiki-refine.js --category plugins     # 精炼某个分类下所有未精炼的文件
 *   node wiki-refine.js --unrefined            # 精炼所有未精炼的文件
 *   node wiki-refine.js --direct <path>        # 跳过草稿区，直接写入正式目录
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const VAULT = process.env.OBSIDIAN_VAULT_PATH || process.env.WIKI_VAULT_PATH || path.join(__dirname, '..');
const VECTOR_SCRIPT = path.join(VAULT, '.lancedb', 'wiki-vector-search.js');
const MANIFEST_PATH = path.join(VAULT, '.manifest.json');
const COST_GUARD = path.join(__dirname, 'wiki-cost-guard.js');
const AUDIT_SCRIPT = path.join(__dirname, 'wiki-audit.js');
const DRAFTS_DIR = path.join(VAULT, '.drafts');
const REJECTIONS_PATH = path.join(VAULT, '.olw', 'rejections.json');
const LOG_PATH = path.join(VAULT, 'log.md');

// LLM 配置（通过环境变量或 .env 文件注入）
// 示例: LLM_BASE_URL=http://localhost:4000 LLM_API_KEY=xxx node wiki-refine.js ...
const LLM_BASE_URL = process.env.LLM_BASE_URL || 'http://localhost:4000';
const LLM_API_KEY = process.env.LLM_API_KEY || '';
const LLM_MODEL = process.env.LLM_MODEL || 'your-model-name';

const CATEGORIES = ['plugins', 'gateway', 'automation', 'skills', 'channels', 'concepts',
                     'references', 'tools', 'cli', 'providers', 'install', 'help',
                     'diagnostics', 'start', 'web', 'nodes', 'debug', 'plan', 'entities',
                     'synthesis', 'mac'];

// 调用 LLM（OpenAI 兼容格式）
// 用写入临时文件 + curl @file 的方式避免 shell 转义问题
async function callLLM(prompt, maxTokens = 2000) {
  const tmpFile = '/tmp/wiki-llm-payload.json';
  const payload = {
    model: LLM_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
    temperature: 0.3
  };
  fs.writeFileSync(tmpFile, JSON.stringify(payload));
  
  try {
    const result = spawnSync('curl', [
      '-s', '-m', '120',
      `${LLM_BASE_URL}/chat/completions`,
      '-H', `Authorization: Bearer ${LLM_API_KEY}`,
      '-H', 'Content-Type: application/json',
      '-d', `@${tmpFile}`
    ], { encoding: 'utf8', timeout: 130000 });
    
    if (result.status !== 0) return null;
    const json = JSON.parse(result.stdout);
    return json.choices?.[0]?.message?.content || null;
  } catch(e) {
    return null;
  } finally {
    try { fs.unlinkSync(tmpFile); } catch(e) {}
  }
}

// 提取 frontmatter
function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { fm: '', body: content, hasFm: false };
  return { fm: match[1], body: match[2].trim(), hasFm: true };
}

// 检查是否已精炼
function isRefined(fm) {
  if (!fm) return false;
  const hasSummary = /summary:\s*"[^"]{10,}"/.test(fm) || /summary:\s*'[^']{10,}'/.test(fm);
  const hasTags = /tags:\s*\[/.test(fm) && /tags:\s*\[\s*\]/.test(fm) === false;
  return hasSummary && hasTags;
}

// 检查是否已有 TLDR 行
function hasTldr(body) {
  return /^>\s*\*\*TL;DR\*\*/.test(body);
}

// 精炼单个文件
function wasManuallyEdited(filePath) {
  try {
    // 只检测非草稿区的文件（草稿区自己写的文件不算）
    if (filePath.includes('.drafts') || filePath.includes('.olw')) return false;
    // git diff 检查工作区 vs 最新提交
    const result = execSync(`git diff -- "${path.relative(vault, filePath)}" 2>/dev/null`, {
      encoding: 'utf8', timeout: 10000, cwd: vault
    });
    if (!result.trim()) return false;
    // diff 中只包含 frontmatter 行变更 → 不是手动编辑
    const diffLines = result.split('\n').filter(l => !l.startsWith('---') && !l.startsWith('+++') &&
      !l.startsWith('index ') && !l.startsWith('@@'));
    const contentChanges = diffLines.filter(l =>
      l.startsWith('+') && !l.startsWith('+++') && !l.includes('summary:') &&
      !l.includes('tags:') && !l.includes('tldr:') && !l.includes('sourceType:') &&
      !l.includes('certainty:') && !l.includes('status:') && !l.includes('created:') &&
      !l.includes('updated:') && !l.includes('> **TL;DR')
    );
    if (contentChanges.length > 0) {
      console.log(`⚠️  检测到手动编辑: ${path.basename(filePath)}，跳过 refine`);
      return true;
    }
  } catch (e) {
    // git 命令失败（文件不在 git 下） → 跳过检测，不阻止
  }
  return false;
}

// 加载拒绝记录
function loadRejections() {
  if (fs.existsSync(REJECTIONS_PATH)) {
    try { return JSON.parse(fs.readFileSync(REJECTIONS_PATH, 'utf8')); } catch (e) {}
  }
  return {};
}

// 检查页面是否被屏蔽（5 次拒绝）
function isBlocked(title) {
  const data = loadRejections();
  return data[title]?.blocked || false;
}

// 获取历史拒绝原因，注入 prompt
function getRejectionFeedback(title) {
  const data = loadRejections();
  const entry = data[title];
  if (!entry || entry.reasons.length === 0) return '';
  const recent = entry.reasons.slice(-5);
  return 'PREVIOUS REJECTIONS — address these issues:\n' +
    recent.map((r, i) => `${i + 1}. ${r.reason}`).join('\n');
}

async function refineFile(filePath) {
  const fileDir = path.dirname(filePath);
  const fileName = path.basename(filePath);
  
  // 检查是否在草稿屏蔽名单
  const pageTitle = fileName.replace('.md', '');
  if (isBlocked(pageTitle)) {
    console.log(`🚫 页面已被屏蔽（5次拒绝）: ${pageTitle}，跳过`);
    console.log(`   解除: node wiki-review.js --unblock "${pageTitle}"`);
    return false;
  }

  // 检查是否被人工编辑过
  if (wasManuallyEdited(filePath)) {
    const logLine = `\n| ${new Date().toISOString()} | refine-skip | ⚠️ | manual-edit-detected: ${fileName} |`;
    if (fs.existsSync(LOG_PATH)) fs.appendFileSync(LOG_PATH, logLine);
    return false;
  }
  
  // 检查是否 --direct 模式
  const directMode = process.argv.includes('--direct');
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ 文件不存在: ${filePath}`);
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const { fm, body, hasFm } = extractFrontmatter(content);
  
  if (isRefined(fm)) {
    console.log(`⏭️  已精炼，跳过: ${path.basename(filePath)}`);
    return false;
  }
  
  // 获取当前分类下其他页面，用于生成 wikilinks
  const category = path.basename(path.dirname(filePath));
  const otherPages = [];
  const catDir = path.dirname(filePath);
  for (const f of fs.readdirSync(catDir)) {
    if (f.endsWith('.md') && f !== path.basename(filePath)) {
      const otherContent = fs.readFileSync(path.join(catDir, f), 'utf8');
      const otherFm = extractFrontmatter(otherContent).fm;
      const titleMatch = otherFm?.match(/title:\s*["']?([^"'\n]+)["']?/);
      if (titleMatch) otherPages.push(titleMatch[1].trim());
    }
  }
  
  // 获取 wiki 索引，用于 wikilinks 参考
  const indexPath = path.join(VAULT, 'index.md');
  let indexContent = '';
  if (fs.existsSync(indexPath)) {
    indexContent = fs.readFileSync(indexPath, 'utf8').split('\n')
      .filter(l => l.includes('[['))
      .slice(0, 50)
      .join('\n');
  }
  
  // 读取 sourceType 选择 prompt 模板（来源分类模板: bluewater8008）
  const sourceTypeMatch = fm?.match(/sourceType:\s*([a-z]+)/);
  const sourceType = sourceTypeMatch ? sourceTypeMatch[1] : 'article';
  
  const TEMPLATES = {
    article: {
      role: '你是一个知识文章编辑。提炼核心观点、论据和结论。',
      rules: [
        '生成 1 句 summary（15-30 字，英文，概括核心论点）',
        '生成 3-5 个 tags（英文小写）',
        '生成 1 句 TLDR（中文，20-40 字，总结文章要点）',
        '从参考索引中选 2-4 个相关页面，用 [[wikilinks]] 插入正文开头',
      ],
    },
    document: {
      role: '你是一个技术文档编辑。提取功能描述、配置项、命令和示例。',
      rules: [
        '生成 1 句 summary（15-30 字，英文，概括文档内容）',
        '生成 3-5 个 tags（英文小写）',
        '生成 1 句 TLDR（中文，20-40 字，说明本文档用途）',
        '从参考索引中选 2-4 个相关页面，用 [[wikilinks]] 插入正文开头',
      ],
    },
    report: {
      role: '你是一个报告分析编辑。提取关键指标、对比结果和趋势结论。',
      rules: [
        '生成 1 句 summary（15-30 字，英文，概括报告核心发现）',
        '生成 3-5 个 tags（英文小写）',
        '生成 1 句 TLDR（中文，20-40 字，总结报告关键数据点）',
        '从参考索引中选 2-4 个相关页面，用 [[wikilinks]] 插入正文开头',
      ],
    },
    meeting: {
      role: '你是一个会议记录编辑。提取决议、行动项和责任人。',
      rules: [
        '生成 1 句 summary（15-30 字，英文，概括会议主题和结果）',
        '生成 3-5 个 tags（英文小写）',
        '生成 1 句 TLDR（中文，20-40 字，总结会议核心决策）',
        '从参考索引中选 2-4 个相关页面，用 [[wikilinks]] 插入正文开头',
      ],
    },
  };
  
  // meeting 模板额外加 Open Questions 规则
  const meetingRules = [
    '生成 1 句 summary（15-30 字，英文，概括会议主题和结果）',
    '生成 3-5 个 tags（英文小写）',
    '生成 1 句 TLDR（中文，20-40 字，总结会议核心决策）',
    '识别本次会议未解决的开放问题和后续跟进事项，输出到 Open Questions 区',
    '从参考索引中选 2-4 个相关页面，用 [[wikilinks]] 插入正文开头',
  ];
  
  const tpl = TEMPLATES[sourceType] || TEMPLATES.article;
  const rejectionFeedback = getRejectionFeedback(pageTitle);
  const feedbackBlock = rejectionFeedback
    ? `\n\n${rejectionFeedback}\n`
    : '';
  const rules = sourceType === 'meeting' ? meetingRules : [...tpl.rules, '识别本文中尚未解决的关键问题，输出到 Open Questions 区'];
  
  const prompt = `${tpl.role}请为以下 wiki 页面补充元数据、TLDR 和内部链接。

**规则**:
${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

**引用标记规则（来源: peas + laphilosophia 评论建议）**：
在正文每个关键声明后面插入 [^N] 引用标记（N=1,2,3...），格式：声明内容[^1]
每个标记的声明必须来自原文。不要发明内容。没有可引用的声明时跳过此步骤。

**输出格式**（严格按此顺序）：
summary: "一句话摘要"
tags: [tag1, tag2, tag3]
tldr: "TLDR 一句话（中文）"
wikilinks: "[[相关页面1]] [[相关页面2]]"
citations: "[^1]: <来源路径> — <摘要>; [^2]: ..."

OPEN_QUESTIONS:
1. [问题描述，如无则写 "none"]

**文档内容**:
\`\`\`
${body.substring(0, 6000)}
\`\`\`

**当前分类下的其他页面**: ${otherPages.join(', ') || '无'}

**参考索引**:
${indexContent.substring(0, 3000)}

请输出补充的 frontmatter 行和 TLDR：`;  const finalPrompt = prompt + (feedbackBlock || '');

  console.log(`🔄 正在精炼: ${path.basename(filePath)} ...`);
  // Cost Guard 检查
  const costCheck = spawnSync('node', [COST_GUARD, 'check', '0', '0'], { encoding: 'utf8', timeout: 5000 });
  if (costCheck.status !== 0) { console.log('⚠️ Cost Guard 拦截，跳过'); return false; }

  const llmResult = await callLLM(finalPrompt || prompt);
  if (!llmResult) {
    console.log(`⚠️  LLM 不可用，跳过: ${path.basename(filePath)}`);
    return false;
  }
  
  // 提取 summary、tags、tldr、wikilinks 和 Open Questions
  const summaryMatch = llmResult.match(/summary:\s*["']([^"']+)["']/);
  const tagsMatch = llmResult.match(/tags:\s*\[([^\]]*)\]/);
  const tldrMatch = llmResult.match(/tldr:\s*["']([^"']+)["']/);
  const wikilinksMatch = llmResult.match(/wikilinks:\s*["']([^"']+)["']/);
  const citationsMatch = llmResult.match(/citations:\s*["']([^"']+)["']/);
  const openQMatch = llmResult.match(/OPEN_QUESTIONS:\n([\s\S]+?)$/);
  
  if (!summaryMatch) {
    console.log(`⚠️  LLM 输出缺少 summary，跳过: ${path.basename(filePath)}`);
    console.log(`   LLM 返回: ${llmResult.substring(0, 200)}`);
    return false;
  }
  
  // 生成 TLDR 行（有 LLM 输出的用 LLM 的，否则用 summary 转中文占位）
  let tldrLine = '';
  if (tldrMatch) {
    tldrLine = `> **TL;DR** ${tldrMatch[1]}`;
    console.log(`   TLDR: ${tldrMatch[1]}`);
  } else if (summaryMatch) {
    // 用 summary 作为 fallback
    tldrLine = `> **TL;DR** ${summaryMatch[1]}`;
    console.log(`   TLDR: (fallback from summary)`);
  }
  let newFm = fm;
  if (/summary:/.test(newFm)) {
    newFm = newFm.replace(/summary:.*/, `summary: "${summaryMatch[1]}"`);
  } else {
    newFm += `\nsummary: "${summaryMatch[1]}"`;
  }
  
  if (tagsMatch) {
    if (/tags:/.test(newFm)) {
      newFm = newFm.replace(/tags:.*/, `tags: [${tagsMatch[1]}]`);
    } else {
      newFm += `\ntags: [${tagsMatch[1]}]`;
    }
  }
  
  // TLDR 插入：frontmatter 后、正文前。如果已有 TLDR 则替换，否则新增。
  let bodyForTldr = body;
  // 清理 body 中可能已有的 TLDR 行
  let cleanBody = bodyForTldr.replace(/^>\s*\*\*TL;DR\*\*.+\n?\n?/m, '');
  // 插入新 TLDR + wikilinks
  let prefix = '';
  if (tldrLine) prefix += tldrLine + '\n\n';
  if (wikilinksMatch && wikilinksMatch[1].trim()) {
    prefix += wikilinksMatch[1].trim() + '\n\n';
  }
  if (prefix) cleanBody = prefix + cleanBody;
  const newBody = cleanBody;
  
  // 追加 Open Questions 到正文末尾（laphilosophia 评论建议）
  // 追加 Open Questions 区（laphilosophia 评论建议）
  let openQuestionsSection = '';
  if (openQMatch && !openQMatch[1].trim().toLowerCase().startsWith('none')) {
    const qs = openQMatch[1].trim();
    openQuestionsSection = `\n\n---
\n## Open Questions\n\n${qs}\n`;
    console.log(`   Open Questions: ${qs.split('\n').filter(l => l.trim()).length} 项`);
  }
  
  // 追加 Citations 区（peas + laphilosophia 评论建议）
  let citationsSection = '';
  if (citationsMatch && citationsMatch[1].trim() && !/^none$/i.test(citationsMatch[1].trim())) {
    const rawCitations = citationsMatch[1].trim();
    const refs = [];
    const parts = rawCitations.split(/;\s*/);
    for (const part of parts) {
      const m = part.trim().match(/\[\^(\d+)\]\:\s*(.+?)\s*—\s*(.+)/);
      if (m) {
        refs.push(`[^${m[1]}]: ${m[2].trim()} — ${m[3].trim()}`);
      }
    }
    if (refs.length > 0) {
      citationsSection = `\n\n---
\n## References\n\n${refs.join('\n')}\n`;
      console.log(`   Citations: ${refs.length} 条引用`);
    }
  }
  
  // 输出到草稿区 .drafts/，等待审核
  if (!fs.existsSync(DRAFTS_DIR)) fs.mkdirSync(DRAFTS_DIR, { recursive: true });
  const draftPath = path.join(DRAFTS_DIR, fileName);
  const refinedContent = `---\n${newFm}
---

${newBody}${openQuestionsSection}${citationsSection}`;
  fs.writeFileSync(draftPath, refinedContent);
  const logLine = `\n| ${new Date().toISOString()} | refine-draft | ✅ | ${fileName} → .drafts/ |`;
  if (fs.existsSync(LOG_PATH)) fs.appendFileSync(LOG_PATH, logLine);

  // Audit trail 记录
  try { spawnSync('node', [AUDIT_SCRIPT, 'record', 'refine-draft', `${fileName} → .drafts/`], { timeout: 5000 }); } catch (e) {}
  console.log(`📝 草稿已生成: ${fileName} → .drafts/`);
  console.log(`   下一步: node wiki-review.js 审核`);
  return true;
}

// 同步向量库
function syncVectorDb() {
  if (!fs.existsSync(VECTOR_SCRIPT)) {
    console.log('⏭️  向量同步脚本不存在，跳过');
    return;
  }
  console.log('🧠 同步向量数据库...');
  try {
    const output = execSync(`node "${VECTOR_SCRIPT}" build 2>&1`, { encoding: 'utf8', timeout: 300000 });
    console.log('✅ 向量库已同步');
  } catch(e) {
    console.error(`⚠️ 向量库同步失败: ${e.message}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  let refined = 0;
  
  if (args[0] === '--category' && args[1]) {
    const cat = args[1];
    const dir = path.join(VAULT, cat);
    if (!fs.existsSync(dir)) {
      console.log(`❌ 分类不存在: ${cat}`);
      process.exit(1);
    }
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.md')) continue;
      if (await refineFile(path.join(dir, f))) refined++;
    }
    console.log(`\n📊 精加工完成: ${refined} 个文件`);
  } else if (args[0] === '--unrefined') {
    for (const cat of CATEGORIES) {
      const dir = path.join(VAULT, cat);
      if (!fs.existsSync(dir)) continue;
      for (const f of fs.readdirSync(dir)) {
        if (!f.endsWith('.md')) continue;
        if (await refineFile(path.join(dir, f))) refined++;
      }
    }
    console.log(`\n📊 全局精加工完成: ${refined} 个文件`);
  } else if (args[0]) {
    const filePath = path.join(VAULT, args[0]);
    if (await refineFile(filePath)) refined++;
    console.log(`\n📊 精加工完成: ${refined} 个文件`);
  } else {
    console.log('用法: node wiki-refine.js <分类/文件名>');
    console.log('      node wiki-refine.js --category <分类>');
    console.log('      node wiki-refine.js --unrefined');
  }
  
  if (refined > 0) {
    syncVectorDb();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
