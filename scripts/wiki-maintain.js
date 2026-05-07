#!/usr/bin/env node
/**
 * wiki-maintain.js - 自维护 (来源: olw maintain --fix)
 *
 * 修复 wiki 常见问题：
 *   1. 修断链 — 通过 alias 映射修复 [[Alias]] → [[Canonical|Alias]]
 *   2. 建 stub — 为缺失的 wikilink 目标创建 stub 页面
 *   3. 规范化 — 统一 [[Alias]] 为 [[Canonical|Alias]] 格式
 *   4. 检测孤儿页 — 无入链的页面
 *
 * 用法:
 *   node wiki-maintain.js --fix          # 修复所有问题
 *   node wiki-maintain.js --fix-links    # 仅修复断链
 *   node wiki-maintain.js --create-stubs  # 仅创建 stub
 *   node wiki-maintain.js --dry-run       # 预览
 */

const fs = require('fs');
const path = require('path');

const VAULT = process.env.OBSIDIAN_VAULT_PATH || process.env.WIKI_VAULT_PATH || path.join(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');
const FIX_LINKS = process.argv.includes('--fix') || process.argv.includes('--fix-links');
const CREATE_STUBS = process.argv.includes('--fix') || process.argv.includes('--create-stubs');
const FIX_ALL = process.argv.includes('--fix');

// 提取所有 wiki 页面
function walkPages(dir, depth = 0) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir)) {
    if (/^\./.test(entry)) continue;
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (depth < 2) results.push(...walkPages(full, depth + 1));
    } else if (entry.endsWith('.md') && !/^(index|log|brief|purpose|overview)\.md$/.test(entry)) {
      try {
        const content = fs.readFileSync(full, 'utf8');
        results.push({ path: full, rel: path.relative(VAULT, full), content, title: entry.replace('.md', '') });
      } catch (e) {}
    }
  }
  return results;
}

// 提取所有 wikilinks [[target]] 或 [[target|alias]]
function extractWikilinks(content) {
  const links = [];
  const regex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    links.push({ target: m[1].trim(), alias: m[2]?.trim(), full: m[0] });
  }
  return links;
}

// 构建 alias 映射（从所有页面的 frontmatter 和标题）
function buildAliasMap(pages) {
  const map = {}; // alias -> canonical
  for (const p of pages) {
    const canonical = p.rel.replace('.md', '').replace(/\/+/g, '/');
    // 标题本身作为 canonical
    map[p.title.toLowerCase()] = canonical;
    // 从 frontmatter 提取 aliases（如果有）
    const aliasMatch = p.content.match(/^---\n[\s\S]*?\n---\n/);
    if (aliasMatch) {
      const aliases = aliasMatch[0].match(/aliases:\s*\[([^\]]*)\]/);
      if (aliases) {
        aliases[1].split(',').forEach(a => {
          const clean = a.trim().replace(/"/g, '').toLowerCase();
          if (clean) map[clean] = canonical;
        });
      }
    }
  }
  return map;
}

// 修复断链
function fixBrokenLinks(pages, aliasMap) {
  let fixed = 0;
  for (const p of pages) {
    let newContent = p.content;
    const links = extractWikilinks(p.content);
    let changed = false;

    for (const link of links) {
      const targetLower = link.target.toLowerCase();
      // 检查目标是否存在
      const targetExists = pages.some(pg => pg.rel.replace('.md', '').toLowerCase() === targetLower);

      if (!targetExists && aliasMap[targetLower]) {
        // 通过 alias 修复
        const canonical = aliasMap[targetLower];
        const newLink = link.alias
          ? `[[${canonical}|${link.alias}]]`
          : `[[${canonical}|${link.target}]]`;
        newContent = newContent.replace(link.full, newLink);
        console.log(`  🔗 修复断链: ${p.rel} 中的 [[${link.target}]] → [[${canonical}|${link.target}]]`);
        changed = true;
        fixed++;
      }
    }

    if (changed && !DRY_RUN) {
      fs.writeFileSync(p.path, newContent);
    }
  }
  return fixed;
}

// 为缺失目标创建 stub
function createStubs(pages, aliasMap) {
  let created = 0;
  const allTargets = new Set();

  // 收集所有被引用的目标
  for (const p of pages) {
    for (const link of extractWikilinks(p.content)) {
      allTargets.add(link.target.toLowerCase());
    }
  }

  // 检查哪些目标不存在
  const existing = new Set(pages.map(p => p.rel.replace('.md', '').toLowerCase()));
  for (const target of allTargets) {
    if (existing.has(target) || aliasMap[target]) continue;

    // 创建 stub
    const stubPath = path.join(VAULT, `${target}.md`);
    if (fs.existsSync(stubPath)) continue;

    const stubContent = `---
title: "${target}"
category: stub
tags: [stub, auto-generated]
certainty: question
status: active
---

# ${target}

\u003e 🏗️ 这是一个自动生成的 stub 页面。知识库中其他页面引用了此概念，但尚无完整内容。
\u003e
\u003e **如何完善：**
\u003e 1. 搜索相关来源文档并入库
\u003e 2. 运行 \`node scripts/wiki-refine.js ${target}.md\` 精加工
\u003e 3. 或手动编辑此页面

## 引用此概念的页面

`;

    if (!DRY_RUN) {
      fs.writeFileSync(stubPath, stubContent);
    }
    console.log(`  🏗️ 创建 stub: ${target}.md`);
    created++;
  }
  return created;
}

// 检测孤儿页（无入链）
function detectOrphans(pages) {
  const linked = new Set();
  for (const p of pages) {
    for (const link of extractWikilinks(p.content)) {
      linked.add(link.target.toLowerCase());
    }
  }

  const orphans = [];
  for (const p of pages) {
    const pageName = p.rel.replace('.md', '').toLowerCase();
    if (!linked.has(pageName) && !p.rel.startsWith('index')) {
      orphans.push(p.rel);
    }
  }
  return orphans;
}

async function main() {
  if (DRY_RUN) console.log('🔍 [dry-run 模式 — 不写入]\n');

  console.log('📂 扫描 wiki 页面 ...');
  const pages = walkPages(VAULT);
  console.log(`📦 共 ${pages.length} 个页面\n`);

  if (pages.length === 0) { console.log('❌ 无页面'); return; }

  const aliasMap = buildAliasMap(pages);
  console.log(`📋 构建 alias 映射: ${Object.keys(aliasMap).length} 个别名\n`);

  let fixed = 0, created = 0;

  if (FIX_LINKS || FIX_ALL) {
    console.log('🔧 修复断链 ...');
    fixed = fixBrokenLinks(pages, aliasMap);
    console.log(`   ${fixed} 个断链已修复\n`);
  }

  if (CREATE_STUBS || FIX_ALL) {
    console.log('🏗️ 创建 stub 页面 ...');
    created = createStubs(pages, aliasMap);
    console.log(`   ${created} 个 stub 已创建\n`);
  }

  // 总是检测孤儿页（只报告，不修复）
  console.log('🔍 检测孤儿页 ...');
  const orphans = detectOrphans(pages);
  if (orphans.length > 0) {
    console.log(`   ⚠️  ${orphans.length} 个孤儿页（无入链）：`);
    orphans.slice(0, 10).forEach(o => console.log(`     - ${o}`));
    if (orphans.length > 10) console.log(`     ... 还有 ${orphans.length - 10} 个`);
  } else {
    console.log('   ✅ 无孤儿页');
  }

  console.log(`\n📊 维护完成: ${fixed} 断链修复, ${created} stub 创建, ${orphans.length} 孤儿页`);
  if (DRY_RUN) console.log('（dry-run，未写入）');
}

main().catch(err => { console.error('Fatal error:', err); process.exit(1); });
