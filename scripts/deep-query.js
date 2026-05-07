#!/usr/bin/env node
/**
 * deep-query.js: 深度查询模式
 * 先搜索 wiki，再读取相关页面全文，最后调 LLM 综合回答
 * 用法: node deep-query.js "问题" [搜索结果数量] [参考页面数量]
 * 例: node deep-query.js "OpenClaw gateway 怎么配置" 10 3
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const VAULT = process.env.WIKI_VAULT_PATH || path.join(__dirname, '..');
const UNIFIED_SEARCH = path.join(__dirname, 'unified-search.js');

// LLM 配置
const LLM_BASE_URL = process.env.LLM_BASE_URL || 'http://host.docker.internal:4000';
const LLM_API_KEY = process.env.LLM_API_KEY || '200418';
const LLM_MODEL = process.env.LLM_MODEL || 'auto';

const QUERY = process.argv[2];
const SEARCH_LIMIT = parseInt(process.argv[3]) || 10;
const CONTEXT_PAGES = parseInt(process.argv[4]) || 3;

if (!QUERY) {
  console.log('用法: node deep-query.js "问题" [搜索结果数量] [参考页面数量]');
  console.log('例: node deep-query.js "OpenClaw gateway 怎么配置" 10 3');
  process.exit(1);
}

// ============================================================
// 1. 搜索 wiki
// ============================================================
function searchWiki(query, limit) {
  try {
    const output = execSync(
      `node "${UNIFIED_SEARCH}" "${query.replace(/"/g, '\\"')}" ${limit} 2>&1`,
      { encoding: 'utf8', timeout: 60000, cwd: VAULT }
    );
    
    // 解析搜索结果，提取页面路径
    const results = [];
    const lines = output.split('\n');
    for (const line of lines) {
      const match = line.match(/^\[.+\]\s+(\S+\.md)$/);
      if (match) {
        results.push(match[1]);
      }
    }
    return results;
  } catch (e) {
    console.error('搜索失败:', e.message);
    return [];
  }
}

// ============================================================
// 2. 读取页面内容
// ============================================================
function readPages(pagePaths) {
  const contents = [];
  for (const p of pagePaths) {
    const fullPath = path.join(VAULT, p);
    if (!fs.existsSync(fullPath)) continue;
    
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      // 去掉 frontmatter，只保留正文
      const bodyMatch = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
      const body = bodyMatch ? bodyMatch[1].trim() : content;
      
  contents.push({
        path: p,
        content: body.substring(0, 3000) // 单页最多 3000 字符，避免超上下文
      });
    } catch (e) {
      console.error(`读取失败: ${p}`, e.message);
    }
  }
  return contents;
}

// ============================================================
// 3. 调用 LLM 综合回答
// ============================================================
async function callLLM(query, contexts) {
  const contextText = contexts.map((c, i) => 
    `--- 参考文档 ${i + 1}: ${c.path} ---\n${c.content}`
  ).join('\n\n');

  const prompt = `你是一个专业的 OpenClaw 技术助手。请根据以下 wiki 知识库内容，回答用户的问题。\n\n**用户问题**: ${query}\n\n**参考文档**:\n${contextText}\n\n**回答要求**:\n1. 基于参考文档内容回答，不要编造\n2. 如果文档不足以回答问题，诚实说明\n3. 给出具体的操作步骤或配置示例\n4. 引用来源文档路径（如 "根据 concepts/agent.md"）\n5. 保持简洁，突出重点\n\n请回答:`;

  const payloadObj = {
    model: LLM_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 4000,
    temperature: 0.3
  };

  // 写临时文件避免 shell 转义问题
  const tmpFile = `/tmp/deep-query-${Date.now()}.json`;
  fs.writeFileSync(tmpFile, JSON.stringify(payloadObj));

  const cmd = `curl -s -m 120 ${LLM_BASE_URL}/chat/completions -H "Authorization: Bearer ${LLM_API_KEY}" -H "Content-Type: application/json" -d @${tmpFile}`;

  try {
    const output = execSync(cmd, { encoding: 'utf8', timeout: 130000 });
    try { fs.unlinkSync(tmpFile); } catch(e) {}
    const json = JSON.parse(output);
    return json.choices?.[0]?.message?.content || null;
  } catch (e) {
    try { fs.unlinkSync(tmpFile); } catch(e2) {}
    console.error('LLM 调用失败:', e.message);
    return null;
  }
}

// ============================================================
// Main
// ============================================================
async function main() {
  console.log(`🔍 深度查询: "${QUERY}"`);
  console.log(`   搜索 ${SEARCH_LIMIT} 条结果，取前 ${CONTEXT_PAGES} 页作为参考\n`);

  // 1. 搜索
  const searchResults = searchWiki(QUERY, SEARCH_LIMIT);
  if (searchResults.length === 0) {
    console.log('❌ 未找到相关文档');
    process.exit(1);
  }
  console.log(`📚 找到 ${searchResults.length} 个相关页面`);
  console.log(`   参考页面: ${searchResults.slice(0, CONTEXT_PAGES).join(', ')}\n`);

  // 2. 读取内容
  const contexts = readPages(searchResults.slice(0, CONTEXT_PAGES));
  if (contexts.length === 0) {
    console.log('❌ 无法读取参考页面内容');
    process.exit(1);
  }

  // 3. LLM 综合回答
  console.log('🤖 调用 LLM 生成综合回答...\n');
  const answer = await callLLM(QUERY, contexts);
  
  if (!answer) {
    console.log('❌ LLM 未返回结果');
    process.exit(1);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(answer);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('📎 参考来源:');
  contexts.forEach((c, i) => {
    console.log(`   ${i + 1}. ${c.path}`);
  });
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
