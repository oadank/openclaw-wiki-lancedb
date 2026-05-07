#!/usr/bin/env node
/**
 * wiki-query: 在 wiki 中搜索并回答问题
 * 用法: node scripts/query.js "你的问题" [--index-only]
 */

const fs = require('fs');
const path = require('path');

const VAULT = process.env.OBSIDIAN_VAULT_PATH || '/root/.openclaw/workspace/openclaw-wiki-lancedb';
const INDEX_PATH = path.join(VAULT, 'index.md');

function loadIndex() {
  if (!fs.existsSync(INDEX_PATH)) return [];
  const content = fs.readFileSync(INDEX_PATH, 'utf8');
  const pages = [];
  for (const match of content.matchAll(/\[\[(.+?)\]\]/g)) {
    pages.push(match[1]);
  }
  return pages;
}

function findCandidatePages(query) {
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
  const candidates = [];

  for (const cat of ['concepts', 'entities', 'skills', 'references', 'synthesis']) {
    const dir = path.join(VAULT, cat);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.md')) continue;
      const fullpath = path.join(dir, file);
      const content = fs.readFileSync(fullpath, 'utf8');
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
      const frontmatter = fmMatch ? fmMatch[1] : '';
      const titleMatch = frontmatter.match(/title:\s*"?([^"]+)"?/);
      const tagsMatch = frontmatter.match(/tags:\s*\[([^\]]*)\]/);
      const summaryMatch = frontmatter.match(/summary:\s*"?([^"]+)"?/);
      const title = titleMatch ? titleMatch[1].trim().toLowerCase() : file.replace('.md', '').toLowerCase();
      const tags = tagsMatch ? tagsMatch[1].toLowerCase() : '';
      const summary = summaryMatch ? summaryMatch[1].toLowerCase() : '';

      let score = 0;
      for (const term of terms) {
        if (title.includes(term)) score += 10;
        if (tags.includes(term)) score += 5;
        if (summary.includes(term)) score += 3;
      }

      if (score > 0) {
        candidates.push({ path: fullpath, title: titleMatch ? titleMatch[1].trim() : file.replace('.md', ''), category: cat, score, frontmatter: content.substring(0, content.indexOf('\n---\n') + 5) || '', content });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, 5);
}

async function queryWiki(question, indexOnly = false) {
  console.log(`🔍 查询: ${question}`);
  const indexPages = loadIndex();
  console.log(`📑 索引中有 ${indexPages.length} 个页面`);
  const candidates = findCandidatePages(question);

  if (candidates.length === 0) {
    console.log('❌ 没有找到相关页面');
    return '没有找到相关内容。';
  }

  console.log(`📋 找到 ${candidates.length} 个候选页面:`);
  for (const c of candidates) {
    console.log(`  - ${c.category}/${c.title} (score: ${c.score})`);
  }

  let context = '';
  for (const c of candidates) {
    const content = indexOnly ? c.frontmatter : c.content;
    context += `\n\n### ${c.title} (${c.category})\n${content}\n`;
  }

  const prompt = `你是一个知识库助手。请根据以下 wiki 页面内容回答问题。\n\n**问题**: ${question}\n\n**相关页面**:\n${context}\n\n**规则**:\n1. 只基于提供的 wiki 页面回答\n2. 如果信息不足，说明哪些内容缺失\n3. 使用 [[wikilink]] 格式引用相关页面\n4. 回答要简洁准确`;

  const response = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'dashscope/qwen3.6-plus',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.3
    })
  }).catch(() => null);

  let answer;
  if (response && response.ok) {
    const data = await response.json();
    answer = data.choices?.[0]?.message?.content;
  }

  if (!answer) {
    console.log('\n⚠️  LLM 不可用，返回候选页面内容:');
    for (const c of candidates) {
      console.log(`\n--- ${c.title} (${c.category}) ---`);
      console.log(c.content.substring(0, 1000));
    }
    return;
  }

  console.log('\n💡 回答:');
  console.log(answer);
  return answer;
}

async function main() {
  const args = process.argv.slice(2);
  const indexOnly = args.includes('--index-only');
  const question = args.filter(a => !a.startsWith('--')).join(' ');

  if (!question) {
    console.log('用法: node query.js "你的问题" [--index-only]');
    process.exit(1);
  }

  await queryWiki(question, indexOnly);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
