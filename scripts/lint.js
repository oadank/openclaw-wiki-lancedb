#!/usr/bin/env node
/**
 * wiki-lint: 检查 wiki 健康度
 * 用法: node scripts/lint.js
 */

const fs = require('fs');
const path = require('path');

const VAULT = process.env.OBSIDIAN_VAULT_PATH || '/root/.openclaw/workspace/openclaw-wiki-lancedb';
const LOG_PATH = path.join(VAULT, 'log.md');
const INDEX_PATH = path.join(VAULT, 'index.md');

function appendLog(operation, status, details) {
  const line = `| ${new Date().toISOString()} | ${operation} | ${status} | ${details} |`;
  let log = fs.readFileSync(LOG_PATH, 'utf8');
  log += '\n' + line;
  fs.writeFileSync(LOG_PATH, log);
}

function getAllPages() {
  const pages = [];
  for (const cat of ['concepts', 'entities', 'skills', 'references', 'synthesis']) {
    const dir = path.join(VAULT, cat);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.md')) continue;
      const fullpath = path.join(dir, file);
      const content = fs.readFileSync(fullpath, 'utf8');
      pages.push({ path: fullpath, category: cat, filename: file, content });
    }
  }
  return pages;
}

function checkFrontmatter(page) {
  const issues = [];
  const fmMatch = page.content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fmMatch) {
    issues.push('缺少 frontmatter');
    return issues;
  }
  const fm = fmMatch[1];
  for (const field of ['title', 'category', 'tags', 'sources', 'created', 'updated']) {
    if (!fm.includes(`${field}:`)) {
      issues.push(`缺少字段: ${field}`);
    }
  }
  return issues;
}

function checkWikilinks(page, allPages) {
  const issues = [];
  const wikilinks = page.content.match(/\[\[(.+?)\]\]/g) || [];
  for (const link of wikilinks) {
    const target = link.slice(2, -2);
    const exists = allPages.some(p =>
      p.content.includes(`title: "${target}"`) ||
      p.content.includes(`title: ${target}`) ||
      p.filename === target + '.md'
    );
    if (!exists) {
      issues.push(`断链: [[${target}]]`);
    }
  }
  if (wikilinks.length === 0) {
    issues.push('孤立页: 没有 wikilinks');
  }
  return issues;
}

function checkIndexCoverage(allPages) {
  const issues = [];
  const indexContent = fs.existsSync(INDEX_PATH) ? fs.readFileSync(INDEX_PATH, 'utf8') : '';
  for (const page of allPages) {
    const fmMatch = page.content.match(/^title:\s*"?([^"]+)"?/m);
    if (!fmMatch) continue;
    const title = fmMatch[1].trim();
    if (!indexContent.includes(title)) {
      issues.push(`index.md 未收录: ${page.category}/${title}`);
    }
  }
  return issues;
}

function checkDuplicateTags(allPages) {
  const tagCounts = {};
  for (const page of allPages) {
    const tagsMatch = page.content.match(/tags:\s*\[([^\]]*)\]/);
    if (!tagsMatch) continue;
    const tags = tagsMatch[1].split(',').map(t => t.trim().replace(/"/g, ''));
    for (const tag of tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  const issues = [];
  const lowerTags = {};
  for (const tag of Object.keys(tagCounts)) {
    const lower = tag.toLowerCase();
    if (lowerTags[lower] && lowerTags[lower] !== tag) {
      issues.push(`标签变体: "${lowerTags[lower]}" 和 "${tag}"`);
    }
    lowerTags[lower] = tag;
  }
  return issues;
}

function lint() {
  console.log('🔍 开始 wiki 体检...\n');
  const pages = getAllPages();
  if (pages.length === 0) {
    console.log('📭 Wiki 为空，暂无可检查的内容');
    return;
  }
  console.log(`📊 共 ${pages.length} 个页面\n`);
  const allIssues = [];
  console.log('📝 检查 frontmatter...');
  for (const page of pages) {
    const issues = checkFrontmatter(page);
    if (issues.length > 0) {
      allIssues.push({ page: `${page.category}/${page.filename}`, issues });
    }
  }
  console.log('🔗 检查 wikilinks...');
  for (const page of pages) {
    const issues = checkWikilinks(page, pages);
    if (issues.length > 0) {
      allIssues.push({ page: `${page.category}/${page.filename}`, issues });
    }
  }
  console.log('📑 检查 index 覆盖率...');
  const indexIssues = checkIndexCoverage(pages);
  if (indexIssues.length > 0) {
    allIssues.push({ page: 'index.md', issues: indexIssues });
  }
  console.log('🏷️ 检查标签一致性...');
  const tagIssues = checkDuplicateTags(pages);
  if (tagIssues.length > 0) {
    allIssues.push({ page: '全局', issues: tagIssues });
  }
  console.log('\n' + '='.repeat(50));
  if (allIssues.length === 0) {
    console.log('✅ Wiki 健康！没有发现问题');
    appendLog('lint', '✅', `检查 ${pages.length} 页，无问题`);
  } else {
    console.log(`⚠️  发现 ${allIssues.length} 个问题:\n`);
    for (const { page, issues } of allIssues) {
      console.log(`📄 ${page}:`);
      for (const issue of issues) {
        console.log(`  - ${issue}`);
      }
      console.log();
    }
    appendLog('lint', '⚠️', `检查 ${pages.length} 页，${allIssues.length} 个问题`);
  }
}

lint();
