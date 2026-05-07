#!/usr/bin/env python3
"""
wiki-delete.py: 删除 Wiki 页面，自动清理关联数据
用法: python3 wiki-delete.py <页面路径>
       python3 wiki-delete.py tools/exec.md
       python3 wiki-delete.py --batch <文件列表.txt>
"""

import os
import sys
import json
import re
import shutil
from datetime import datetime, timezone

# 路径配置
VAULT = os.environ.get('OBSIDIAN_VAULT_PATH') or os.environ.get('WIKI_VAULT_PATH') or os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
MANIFEST_PATH = os.path.join(VAULT, '.manifest.json')
INDEX_PATH = os.path.join(VAULT, 'index.md')
LOG_PATH = os.path.join(VAULT, 'log.md')
DB_PATH = os.path.join(VAULT, '.lancedb', 'vector_db')

def log(msg):
    print(f"  {msg}")

def load_manifest():
    if os.path.exists(MANIFEST_PATH):
        with open(MANIFEST_PATH, 'r') as f:
            return json.load(f)
    return {'version': '1.1.0', 'projects': {}, 'sources': {}}

def save_manifest(manifest):
    with open(MANIFEST_PATH, 'w') as f:
        json.dump(manifest, f, indent=2)

def append_log(operation, status, details):
    line = f'| {datetime.now(timezone.utc).isoformat()} | {operation} | {status} | {details} |'
    with open(LOG_PATH, 'a') as f:
        f.write('\n' + line)

def delete_file(filepath):
    """删除文件"""
    if os.path.exists(filepath):
        os.remove(filepath)
        log(f"✅ 删除文件: {os.path.relpath(filepath, VAULT)}")
        return True
    else:
        log(f"⚠️ 文件不存在: {os.path.relpath(filepath, VAULT)}")
        return False

def remove_from_index(page_path):
    """从 index.md 移除链接"""
    if not os.path.exists(INDEX_PATH):
        log("⚠️ index.md 不存在")
        return False
    
    with open(INDEX_PATH, 'r') as f:
        content = f.read()
    
    category = os.path.dirname(page_path)
    filename = os.path.basename(page_path)
    title = filename.replace('.md', '')
    
    patterns = [
        rf'- \[\[{re.escape(page_path)}\]\].*?\n',
        rf'- \[\[{re.escape(title)}\]\].*?\n',
        rf'- \[\[{re.escape(category)}/{re.escape(title)}\]\].*?\n',
    ]
    
    original = content
    for pattern in patterns:
        content = re.sub(pattern, '', content)
    
    if content != original:
        with open(INDEX_PATH, 'w') as f:
            f.write(content)
        log(f"✅ 从 index.md 移除链接")
        return True
    else:
        log(f"⏭️  index.md 中未找到链接")
        return False

def remove_from_manifest(page_path):
    """从 .manifest.json 移除 source 记录"""
    manifest = load_manifest()
    sources = manifest.get('sources', {})
    
    removed = []
    for source_path, source in list(sources.items()):
        pages = source.get('pagesCreated', [])
        if page_path in pages:
            del sources[source_path]
            removed.append(source_path)
            log(f"✅ 从 manifest 移除 source: {source_path}")
    
    if removed:
        stats = manifest.get('stats', {})
        stats['totalPages'] = max(0, stats.get('totalPages', 0) - len(removed))
        stats['totalSourcesIngested'] = max(0, stats.get('totalSourcesIngested', 0) - len(removed))
        manifest['updatedAt'] = datetime.now(timezone.utc).isoformat()
        save_manifest(manifest)
        return True
    else:
        log(f"⏭️  manifest 中未找到对应 source")
        return False

def delete_vector(page_path):
    """从 LanceDB 向量库删除对应向量（通过 Node.js 辅助脚本）"""
    if not os.path.exists(DB_PATH):
        log("⚠️ 向量库不存在")
        return False
    
    vector_script = os.path.join(VAULT, '.lancedb', 'wiki-delete-vector.js')
    if not os.path.exists(vector_script):
        log("⚠️ 向量删除脚本不存在，跳过")
        return False
    
    try:
        import subprocess
        result = subprocess.run(
            ['node', vector_script, page_path],
            capture_output=True, text=True, timeout=30,
            cwd=VAULT
        )
        output = result.stdout.strip()
        
        if output.startswith('DELETED:'):
            log(f"✅ 从向量库删除: {page_path}")
            return True
        elif output.startswith('NOT_FOUND:'):
            log(f"⏭️  向量库中未找到: {page_path}")
            return False
        else:
            log(f"⚠️ 向量删除异常: {output}")
            return False
    except Exception as e:
        log(f"❌ 向量删除失败: {e}")
        return False

def delete_page(page_path):
    """删除一个 wiki 页面及其关联数据"""
    print(f"\n🗑️  删除: {page_path}")
    
    page_path = page_path.strip()
    if page_path.startswith('/'):
        page_path = page_path[len(VAULT):].lstrip('/')
    
    # 1. 删除 .md 文件
    md_path = os.path.join(VAULT, page_path)
    file_deleted = delete_file(md_path)
    
    # 2. 从 index.md 移除链接
    index_removed = remove_from_index(page_path)
    
    # 3. 从 manifest 移除 source 记录
    manifest_removed = remove_from_manifest(page_path)
    
    # 4. 从向量库删除
    vector_deleted = delete_vector(page_path)
    
    results = {
        'file': file_deleted,
        'index': index_removed,
        'manifest': manifest_removed,
        'vector': vector_deleted
    }
    
    success = any(results.values())
    status = '✅' if success else '⏭️ '
    details = f"file={file_deleted}, index={index_removed}, manifest={manifest_removed}, vector={vector_deleted}"
    
    append_log('delete', status, f'{page_path}: {details}')
    
    if success:
        print(f"  {status} 删除完成")
    else:
        print(f"  {status} 未找到任何关联数据")
    
    return success

def restore_page(page_path):
    """恢复测试用的 wiki 页面（从备份复制）"""
    source_path = os.path.join('/opt/openclaw/data/workspace/refs/openclaw-docs/docs', page_path)
    if os.path.exists(source_path):
        target_path = os.path.join(VAULT, page_path)
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        shutil.copy2(source_path, target_path)
        print(f"  已恢复: {page_path}")
        return True
    return False

def main():
    if len(sys.argv) < 2:
        print('用法: python3 wiki-delete.py <页面路径>')
        print('       python3 wiki-delete.py tools/exec.md')
        print('       python3 wiki-delete.py --batch <文件列表.txt>')
        print('       python3 wiki-delete.py --restore <页面路径>  # 恢复文件')
        sys.exit(1)
    
    mode = sys.argv[1]
    
    if mode == '--batch':
        list_file = sys.argv[2]
        if not os.path.exists(list_file):
            print(f'❌ 列表文件不存在: {list_file}')
            sys.exit(1)
        
        with open(list_file, 'r') as f:
            pages = [line.strip() for line in f if line.strip() and not line.startswith('#')]
        
        print(f'📋 批量删除 {len(pages)} 个页面...')
        success_count = 0
        for page in pages:
            if delete_page(page):
                success_count += 1
        
        print(f'\n📊 完成: {success_count}/{len(pages)} 个页面已删除')
    elif mode == '--restore':
        page_path = sys.argv[2]
        if restore_page(page_path):
            print(f"✅ 已恢复: {page_path}")
        else:
            print(f"❌ 无法恢复: {page_path}")
            sys.exit(1)
    else:
        page_path = mode
        delete_page(page_path)

if __name__ == '__main__':
    main()
