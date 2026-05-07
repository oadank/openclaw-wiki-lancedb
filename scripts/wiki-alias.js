#!/usr/bin/env node
/**
 * wiki-alias.js - 概念别名归一化 (来源: olw maintain --fix)
 *
 * 1. 从所有页面提取别名（frontmatter aliases + 标题变体）
 * 2. 构建 alias → canonical 映射
 * 3. 规范化页面中的 [[Alias]] → [[Canonical|Alias]]
 * 4. 为每页 frontmatter 写入 aliases 字段
 *
 * 用法:
 *   node wiki-alias.js --scan            # 扫描并显示别名映射
 *   node wiki-alias.js --normalize       # 规范化所有 wikilinks
 *   node wiki-alias.js --write-fm        # 写入 frontmatter aliases
 *   node wiki-alias.js --fix             # 执行全部（normalize + write-fm）
 *   node wiki-alias.js --dry-run         # 预览
 */

const fs = require('fs');
const path = require('path');

const VAULT = process.env.OBSIDIAN_VAULT_PATH || process.env.WIKI_VAULT_PATH || path.join(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');
const SCAN = process.argv.includes('--scan');
const NORMALIZE = process.argv.includes('--normalize') || process.argv.includes('--fix');
const WRITE_FM = process.argv.includes('--write-fm') || process.argv.includes('--fix');

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

function extractFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---\n/);
  return m ? m[1] : '';
}

function extractBody(content) {
  const m = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return m ? m[1] : content;
}

// 生成别名变体
function generateAliases(title) {
  const aliases = new Set();
  aliases.add(title);
  aliases.add(title.toLowerCase());
  
  // 常见缩写
  const words = title.split(/[-_\s]+/);
  if (words.length > 1) {
    // 首字母缩写
    const acronym = words.map(w => w[0]).join('').toUpperCase();
    aliases.add(acronym);
    // 小写缩写
    aliases.add(acronym.toLowerCase());
    // 驼峰
    const camel = words[0].toLowerCase() + words.slice(1).map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join('');
    aliases.add(camel);
  }
  
  // 去掉连字符
  aliases.add(title.replace(/[-_]/g, ''));
  aliases.add(title.replace(/[-_]/g, ' '));
  
  return Array.from(aliases).filter(a => a && a.length > 1);
}

// 构建 alias → canonical 映射
function buildAliasMap(pages) {
  const map = {};
  for (const p of pages) {
    const canonical = p.rel.replace('.md', '');
    const title = p.title;
    
    // 标题本身
    map[title.toLowerCase()] = canonical;
    
    // 从 frontmatter 提取现有 aliases
    const fm = extractFrontmatter(p.content);
    const fmAliases = fm.match(/aliases:\s*\[([^\]]*)\]/);
    if (fmAliases) {
      fmAliases[1].split(',').forEach(a => {
        const clean = a.trim().replace(/"/g, '').toLowerCase();
        if (clean) map[clean] = canonical;
      });
    }
    
    // 生成变体别名
    for (const alias of generateAliases(title)) {
      if (!map[alias.toLowerCase()]) {
        map[alias.toLowerCase()] = canonical;
      }
    }
  }
  return map;
}

// 提取所有 wikilinks
function extractWikilinks(content) {
  const links = [];
  const regex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    links.push({ target: m[1].trim(), alias: m[2]?.trim(), full: m[0] });
  }
  return links;
}

// 规范化 wikilinks
function normalizeLinks(pages, aliasMap) {
  let normalized = 0;
  for (const p of pages) {
    let newContent = p.content;
    const links = extractWikilinks(p.content);
    let changed = false;
    
    for (const link of links) {
      const targetLower = link.target.toLowerCase();
      // 如果 target 本身就是 canonical，不需要改
      const isCanonical = pages.some(pg => pg.rel.replace('.md', '').toLowerCase() === targetLower);
      if (isCanonical) continue;
      
      // 如果 target 是别名，规范化
      const canonical = aliasMap[targetLower];
      if (canonical && canonical.toLowerCase() !== targetLower) {
        const newLink = link.alias 
          ? `[[${canonical}|${link.alias}]]`
          : `[[${canonical}|${link.target}]]`;
        newContent = newContent.replace(link.full, newLink);
        console.log(`  🔗 ${p.rel}: [[${link.target}]] → [[${canonical}|${link.target}]]`);
        changed = true;
        normalized++;
      }
    }
    
    if (changed && !DRY_RUN) {
      fs.writeFileSync(p.path, newContent);
    }
  }
  return normalized;
}

// 写入 frontmatter aliases
function writeFrontmatterAliases(pages, aliasMap) {
  let written = 0;
  for (const p of pages) {
    const fm = extractFrontmatter(p.content);
    if (!fm) continue;
    
    // 收集此页面的别名（反向查找）
    const canonical = p.rel.replace('.md', '').toLowerCase();
    const aliases = [];
    for (const [alias, target] of Object.entries(aliasMap)) {
      if (target.toLowerCase() === canonical && alias !== p.title.toLowerCase()) {
        aliases.push(alias);
      }
    }
    
    if (aliases.length === 0) continue;
    
    // 去重并排序
    const uniqueAliases = [...new Set(aliases)].sort().slice(0, 10); // 最多10个
    
    // 检查现有 frontmatter 是否已有 aliases
    if (/aliases:/.test(fm)) {
      // 已有 aliases，跳过（不覆盖手动设置的）
      continue;
    }
    
    // 在 frontmatter 末尾添加 aliases
    const newFm = fm + `\naliases: ["${uniqueAliases.join('", "')}"]`;
    const body = extractBody(p.content);
    const newContent = `---\n${newFm}\n---\n${body}`;
    
    if (!DRY_RUN) {
      fs.writeFileSync(p.path, newContent);
    }
    console.log(`  📝 ${p.rel}: 写入 ${uniqueAliases.length} 个别名`);
    written++;
  }
  return written;
}

// 显示别名映射
function showAliasMap(aliasMap) {
  console.log('\n📋 Alias 映射表（前30条）：\n');
  const entries = Object.entries(aliasMap).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [alias, canonical] of entries.slice(0, 30)) {
    console.log(`  ${alias.padEnd(25)} → ${canonical}`);
  }
  if (entries.length > 30) {
    console.log(`  ... 还有 ${entries.length - 30} 条`);
  }
}

async function main() {
  if (DRY_RUN) console.log('🔍 [dry-run 模式 — 不写入]\n');
  
  console.log('📂 扫描 wiki 页面 ...');
  const pages = walkPages(VAULT);
  console.log(`📦 共 ${pages.length} 个页面\n`);
  
  if (pages.length === 0) { console.log('❌ 无页面'); return; }
  
  const aliasMap = buildAliasMap(pages);
  console.log(`📋 构建 alias 映射: ${Object.keys(aliasMap).length} 个条目\n`);
  
  if (SCAN || (!NORMALIZE && !WRITE_FM)) {
    showAliasMap(aliasMap);
  }
  
  let normalized = 0, written = 0;
  
  if (NORMALIZE) {
    console.log('🔧 规范化 wikilinks ...');
    normalized = normalizeLinks(pages, aliasMap);
    console.log(`   ${normalized} 个链接已规范化\n`);
  }
  
  if (WRITE_FM) {
    console.log('📝 写入 frontmatter aliases ...');
    written = writeFrontmatterAliases(pages, aliasMap);
    console.log(`   ${written} 个页面已更新\n`);
  }
  
  console.log(`📊 完成: ${Object.keys(aliasMap).length} 别名映射, ${normalized} 链接规范化, ${written} 页面更新`);
  if (DRY_RUN) console.log('（dry-run，未写入）');
}

main().catch(err => { console.error('Fatal error:', err); process.exit(1); });
