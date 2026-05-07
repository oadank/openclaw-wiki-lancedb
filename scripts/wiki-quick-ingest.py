#!/usr/bin/env python3
"""
wiki-quick-ingest.py: Wiki 快速入库脚本
0 token, 秒级完成。读取源文件 → 自动分类 → 加基础 frontmatter → 复制到 vault → 同步向量库

用法:
  python3 wiki-quick-ingest.py <源文件路径> [分类]
  python3 wiki-quick-ingest.py --force <源文件路径> [分类]    # 强制覆盖（无视 hash 检测）
  python3 wiki-quick-ingest.py --batch <目录> [分类]
"""

import os
import sys
import json
import hashlib
import re
from datetime import datetime, timezone

# 多格式解析器
SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPTS_DIR)

MD_EXTS = ('.md', '.txt', '.markdown')
PARSABLE_EXTS = ('.pdf', '.docx', '.doc', '.xlsx', '.xls')
PARSE_SCRIPT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'parse-file.sh')

VAULT = os.environ.get('OBSIDIAN_VAULT_PATH') or os.environ.get('WIKI_VAULT_PATH') or os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
MANIFEST_PATH = os.path.join(VAULT, '.manifest.json')
LOG_PATH = os.path.join(VAULT, 'log.md')
VECTOR_SCRIPT = os.path.join(VAULT, '.lancedb', 'wiki-vector-search.js')

# 来源类型关键词映射（中英双语，来源分类模板: bluewater8008）
SOURCE_TYPE_KEYWORDS = {
    'article': ['blog', 'post', 'article', 'introduction', 'overview', 'thoughts', 'why',
                'how i', 'lessons learned', 'deep dive', 'exploring', 'guide to',
                '博客', '文章', '教程', '心得', '经验分享', '入门'],
    'document': ['reference', 'api', 'sdk', 'configuration', 'manual', 'specification',
                 'installation', 'setup', 'getting started', 'documentation', 'how to',
                 '文档', '参考', '配置', '安装指南', '使用说明', '手册', '规范'],
    'report': ['report', 'analysis', 'survey', 'statistics', 'benchmark', 'metrics',
               'comparison', 'evaluation', 'performance', 'data', 'results',
               '报告', '分析', '统计', '基准', '对比', '评估', '数据', '结果'],
    'meeting': ['meeting', 'discussion', 'decision', 'action item', 'minutes',
                'agenda', 'retrospective', 'standup', 'sync', 'notes from',
                '会议', '讨论', '决议', '行动项', '纪要', '议程', '回顾', '同步'],
}

CATEGORY_KEYWORDS = {
    'plugins': ['plugin', 'sdk', 'manifest', 'entrypoint', 'subpath'],
    'gateway': ['config', 'setup', 'gateway', 'heartbeat', 'websocket'],
    'automation': ['hook', 'event', 'cron', 'task', 'trigger', 'standing'],
    'skills': ['skill', 'command', 'slash', 'tool'],
    'channels': ['channel', 'discord', 'telegram', 'signal', 'feishu', 'whatsapp'],
    'concepts': ['concept', 'architecture', 'design', 'overview'],
}

def sha256(filepath):
    with open(filepath, 'rb') as f:
        return 'sha256:' + hashlib.sha256(f.read()).hexdigest()

def load_manifest():
    if os.path.exists(MANIFEST_PATH):
        with open(MANIFEST_PATH, 'r') as f:
            return json.load(f)
    return {
        'version': '1.1.0',
        'created': datetime.now(timezone.utc).isoformat(),
        'stats': {'totalSourcesIngested': 0, 'totalPages': 0},
        'projects': {},
        'sources': {}
    }


def save_manifest(manifest):
    with open(MANIFEST_PATH, 'w') as f:
        json.dump(manifest, f, indent=2)

def append_log(operation, status, details):
    line = f'| {datetime.now(timezone.utc).isoformat()} | {operation} | {status} | {details} |'
    with open(LOG_PATH, 'a') as f:
        f.write('\n' + line)

# certainty 关键词映射（laphilosophia 评论：区分事实/推断/开放问题）
CERTAINTY_KEYWORDS = {
    'fact': ['官方', '文档', '配置', 'reference', 'specification', 'configuration',
             'according to', 'is defined', 'is described', '官方文档', '规范'],
    'inference': ['分析', '认为', '可能', '建议', '推测', '估计', '看起来',
                  'think', 'believe', 'may be', 'might be', 'probably', 'suggest'],
    'question': ['？', '?', '待验证', 'TODO', '未确定', '需要确认', '疑问',
                 'to be verified', 'unconfirmed', 'uncertain', 'open question'],
}

def _infer_certainty(content, filepath):
    """根据内容推断 certainty（事实/推断/开放问题）"""
    text = (content + ' ' + os.path.basename(filepath)).lower()
    scores = {}
    for ctype, keywords in CERTAINTY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw.lower() in text)
        scores[ctype] = score
    # 优先判断是否有问号和待验证关键词
    if '？' in content or '?' in content or 'TODO' in content or '待验证' in content:
        return 'question'
    # 按得分判断
    best = max(scores, key=lambda k: scores[k])
    return 'fact' if scores[best] == 0 else best


def extract_title(content, filepath):
    """提取标题"""
    # 尝试从 frontmatter 提取
    fm = re.match(r'^---\n(.*?)\n---\n', content, re.DOTALL)
    if fm:
        title_match = re.search(r'^title:\s*["\']?([^\n"\']+)["\']?\s*$', fm.group(1), re.MULTILINE)
        if title_match:
            return title_match.group(1).strip()
    
    # 尝试从第一行 # 标题提取
    h1 = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
    if h1:
        return h1.group(1).strip()
    
    # 用文件名
    return os.path.basename(filepath).replace('.md', '').replace('-', ' ').replace('_', ' ').title()

def extract_first_heading(content):
    """提取正文第一个 # 标题，用于生成 TLDR"""
    # 跳过 frontmatter 找正文中的第一个 # 标题
    body_start = content.find('\n---\n')
    body = content[body_start + 5:] if body_start >= 0 else content
    h1 = re.search(r'^#\s+(.+)$', body, re.MULTILINE)
    return h1.group(1).strip() if h1 else None

def infer_source_type(content, filepath):
    """根据内容关键词推断 sourceType（来源分类模板）"""
    text = (content + ' ' + os.path.basename(filepath)).lower()
    for stype, keywords in SOURCE_TYPE_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in text:
                return stype
    return 'article'  # 兜底

def infer_category(content, filepath):
    """根据内容关键词推断分类"""
    text = (content + ' ' + os.path.basename(filepath)).lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in text:
                return category
    return 'references'  # 兜底

def slugify(title):
    """生成文件名（截断过长部分，避免 OS 文件名限制）"""
    s = title.lower()
    s = re.sub(r'[^\w\u4e00-\u9fa5]+', '-', s)
    s = s.strip('-')
    # 截断到 120 字符（避免超过文件系统限制）
    if len(s) > 120:
        s = s[:120].rstrip('-')
    return s + '.md'

def ingest_file(filepath, forced_category=None, force=False):
    """处理单个文件"""
    if not os.path.exists(filepath):
        print(f'❌ 文件不存在: {filepath}')
        return False
    
    ext = os.path.splitext(filepath)[1].lower()
    file_stat = os.stat(filepath)
    file_hash = sha256(filepath)
    mtime = file_stat.st_mtime
    
    # 解析文件内容
    if ext in MD_EXTS:
        content = open(filepath, 'r').read()
    elif ext in PARSABLE_EXTS:
        import subprocess
        try:
            result = subprocess.run(['bash', PARSE_SCRIPT, filepath], capture_output=True, text=True, timeout=60)
            if result.returncode != 0:
                print(f'❌ 解析失败: {filepath} - {result.stderr[:100]}')
                return False
            content = result.stdout
            print(f'  📄 {ext} → Markdown ({len(content)} 字符)')
        except Exception as e:
            print(f'❌ 解析异常: {filepath} - {e}')
            return False
    else:
        print(f'⏭️  不支持的格式: {ext}')
        return False
    file_hash = sha256(filepath)
    
    # 检查是否已存在（对比 hash + 修改时间）
    manifest = load_manifest()
    sources = manifest.get('sources', {})
    if isinstance(sources, dict):
        if filepath in sources and not force:
            existing_hash = sources[filepath].get('contentHash', '')
            existing_mtime_str = sources[filepath].get('modifiedAt', '')
            if existing_hash == file_hash:
                print(f'⏭️  文件未变更，跳过: {os.path.basename(filepath)}')
                return True
            # Compare mtime: parse ISO string to timestamp if available
            if existing_mtime_str:
                try:
                    existing_mtime_ts = datetime.fromisoformat(existing_mtime_str.replace('Z', '+00:00')).timestamp()
                    if mtime <= existing_mtime_ts:
                        print(f'⏭️  文件修改时间早于上次入库，跳过: {os.path.basename(filepath)}')
                        return True
                except Exception:
                    pass  # If parsing fails, proceed with ingest
    
    if force:
        print(f'⚡ force 模式: {os.path.basename(filepath)}')
    
    title = extract_title(content, filepath)
    category = forced_category or infer_category(content, filepath)
    source_type = infer_source_type(content, filepath)
    filename = slugify(title)
    
    # 目标路径
    target_dir = os.path.join(VAULT, category)
    os.makedirs(target_dir, exist_ok=True)
    target_path = os.path.join(target_dir, filename)
    
    # force 覆盖：先删除旧文件（如果有），避免生成 -1 后缀
    if force and os.path.exists(target_path):
        os.remove(target_path)
        print(f'⚡ force 覆盖旧文件: {filename}')
    
    # 如果文件名冲突，加序号（非 force 模式）
    counter = 1
    base = filename[:-3]
    while os.path.exists(target_path):
        filename = f'{base}-{counter}.md'
        target_path = os.path.join(target_dir, filename)
        counter += 1
    
    # 检查是否已有 frontmatter
    has_fm = re.match(r'^---\n', content)
    
    # 生成 TLDR（从第一个 # 标题推断）
    first_heading = extract_first_heading(content) if has_fm else title
    tldr_line = f'> **TL;DR** {first_heading}' if first_heading else ''
    
    # 注入字段（中英双语关键词判断 certainty）
    certainty = _infer_certainty(content, filepath)
    
    if has_fm:
        # 已有 frontmatter：注入缺失字段
        fm_end = content.find('\n---\n')
        additions = []
        if source_type and not re.search(r'sourceType:\s*', content):
            additions.append(f'sourceType: {source_type}')
        if not re.search(r'certainty:\s*', content):
            additions.append(f'certainty: {certainty}')
        if not re.search(r'status:\s*', content):
            additions.append('status: active')
        if additions:
            inject = '\n' + '\n'.join(additions)
            content = content[:fm_end + 5] + inject + content[fm_end + 5:]
        # 检查是否已有 TLDR，没有则插入
        if tldr_line and not re.search(r'^>\s*\*\*TL;DR\*\*', content, re.MULTILINE):
            fm_end = content.find('\n---\n')
            if fm_end >= 0:
                content = content[:fm_end + 5] + '\n' + tldr_line + '\n\n' + content[fm_end + 5:]
        full_content = content
    else:
        frontmatter = f'''---
title: "{title}"
category: {category}
tags: []
sources:
  - {filepath}
sourceType: {source_type}
certainty: {certainty}
status: active
created: "{datetime.now(timezone.utc).isoformat()}"
updated: "{datetime.now(timezone.utc).isoformat()}"
provenance:
  extracted: 1.0
  inferred: 0.0
  ambiguous: 0.0
---

{tldr_line}

'''
        # 去掉正文开头的 TLDR（避免重复）
        body = re.sub(r'^>\s*\*\*TL;DR\*\*.+\n?\n?', '', content).strip()
        full_content = frontmatter + body
    
    # 写入
    with open(target_path, 'w') as f:
        f.write(full_content)
    
    # 更新 manifest（sources 是字典）
    if not isinstance(sources, dict):
        sources = {}

    # 尝试从源路径或文件名提取标题和链接
    article_title = title
    article_url = filepath
    if filepath.startswith('http://') or filepath.startswith('https://'):
        article_url = filepath
    if article_title == os.path.basename(filepath).replace('.md', '').replace('-', ' ').title():
        # 标题是默认生成的，用文件名代替
        article_title = os.path.basename(filepath).replace('.md', '')

    sources[filepath] = {
        'ingestedAt': datetime.now(timezone.utc).isoformat(),
        'modifiedAt': mtime,
        'sizeBytes': os.path.getsize(filepath),
        'contentHash': file_hash,
        'sourceType': source_type,
        'format': ext.lstrip('.') if ext.startswith('.') else ext,
        'project': 'manual',
        'pagesCreated': [f'{category}/{filename}']
    }
    manifest['sources'] = sources
    
    stats = manifest.get('stats', {})
    stats['totalPages'] = stats.get('totalPages', 0) + 1
    stats['totalSourcesIngested'] = stats.get('totalSourcesIngested', 0) + 1
    manifest['stats'] = stats
    manifest['updatedAt'] = datetime.now(timezone.utc).isoformat()
    
    save_manifest(manifest)
    
    # 追加日志
    append_log('quick-ingest', '✅', f'{os.path.basename(filepath)} → {category}/{filename}')
    
    print(f'✅ {os.path.basename(filepath)} → {category}/{filename}')
    return True

def sync_vector_db():
    """同步向量数据库"""
    print('🧠 同步向量数据库...')
    import subprocess
    try:
        result = subprocess.run(
            ['node', VECTOR_SCRIPT, 'build'],
            capture_output=True, text=True, timeout=300,
            cwd=os.path.join(VAULT, '.lancedb')
        )
        if result.returncode == 0:
            print('✅ 向量库已同步')
        else:
            print(f'⚠️ 向量库同步失败: {result.stderr[:200]}')
    except Exception as e:
        print(f'⚠️ 向量库同步异常: {e}')

def main():
    if len(sys.argv) < 2:
        print('用法: python3 wiki-quick-ingest.py <源文件路径> [分类]')
        print('      python3 wiki-quick-ingest.py --batch <目录> [分类]')
        sys.exit(1)
    
    mode = sys.argv[1]
    forced_category = sys.argv[2] if len(sys.argv) > 2 else None
    count = 0
    
    if mode == '--force':
        # force + file: python3 wiki-quick-ingest.py --force <源文件路径> [分类]
        force_arg = True
        filepath = sys.argv[2] if len(sys.argv) > 2 else None
        forced_category = sys.argv[3] if len(sys.argv) > 3 else None
        if not filepath:
            print('❌ force 模式需要提供文件路径')
            sys.exit(1)
        if ingest_file(filepath, forced_category, force=True):
            count = 1
    elif mode == '--batch':
        batch_dir = sys.argv[2]
        if not os.path.isdir(batch_dir):
            print(f'❌ 目录不存在: {batch_dir}')
            sys.exit(1)
        
        count = 0
        for f in sorted(os.listdir(batch_dir)):
            if f.endswith(MD_EXTS + PARSABLE_EXTS):
                if ingest_file(os.path.join(batch_dir, f), forced_category):
                    count += 1
        
        print(f'\n📊 批量入库完成: {count} 个文件')
    else:
        filepath = sys.argv[1]
        forced_category = sys.argv[2] if len(sys.argv) > 2 else None
        if ingest_file(filepath, forced_category):
            count = 1
    
    if count > 0:
        sync_vector_db()

if __name__ == '__main__':
    main()
