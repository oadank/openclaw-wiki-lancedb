#!/usr/bin/env python3
"""
sync-local.py: 本地目录监控同步
监控指定目录的文件变化，自动将新增/修改的文件入库 wiki

用法:
  python3 sync-local.py --watch /path/to/docs [--category auto] [--interval 300]
  
示例:
  # 监控 OpenClaw 官方文档目录
  python3 sync-local.py --watch /opt/openclaw/data/workspace/refs/openclaw-docs/docs --category auto
  
  # 监控项目文档，每 5 分钟检查一次
  python3 sync-local.py --watch ~/projects/my-docs --interval 300
"""

import os
import sys
import json
import hashlib
import time
from datetime import datetime, timezone

VAULT = os.environ.get('WIKI_VAULT_PATH') or os.environ.get('OBSIDIAN_VAULT_PATH') or os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
MANIFEST_PATH = os.path.join(VAULT, '.manifest.json')
INGEST_SCRIPT = os.path.join(VAULT, 'scripts', 'wiki-quick-ingest.py')

# 支持的文件后缀
SUPPORTED_EXTS = ('.md', '.txt', '.markdown', '.pdf', '.docx', '.doc', '.xlsx', '.xls')

def load_manifest():
    if os.path.exists(MANIFEST_PATH):
        with open(MANIFEST_PATH, 'r') as f:
            return json.load(f)
    return {'version': '1.1.0', 'projects': {}, 'sources': {}}

def save_manifest(manifest):
    with open(MANIFEST_PATH, 'w') as f:
        json.dump(manifest, f, indent=2)

def get_file_hash(filepath):
    """计算文件 SHA256"""
    with open(filepath, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()

def scan_directory(watch_dir):
    """扫描目录，返回所有支持的文件及其 hash"""
    files = {}
    for root, dirs, filenames in os.walk(watch_dir):
        for filename in filenames:
            if filename.lower().endswith(SUPPORTED_EXTS):
                fullpath = os.path.join(root, filename)
                try:
                    files[fullpath] = {
                        'hash': get_file_hash(fullpath),
                        'mtime': os.path.getmtime(fullpath),
                        'size': os.path.getsize(fullpath)
                    }
                except Exception as e:
                    print(f"⚠️  无法读取: {fullpath} - {e}")
    return files

def infer_category(filepath, content=''):
    """根据文件路径和内容推断分类"""
    basename = os.path.basename(filepath).lower()
    dirname = os.path.dirname(filepath).lower()
    
    # 根据目录名推断
    if 'plugin' in dirname or 'plugin' in basename:
        return 'plugins'
    elif 'channel' in dirname or 'channel' in basename:
        return 'channels'
    elif 'skill' in dirname or 'skill' in basename:
        return 'skills'
    elif 'gateway' in dirname or 'gateway' in basename:
        return 'gateway'
    elif 'concept' in dirname or 'concept' in basename:
        return 'concepts'
    elif 'tool' in dirname or 'tool' in basename:
        return 'tools'
    elif 'provider' in dirname or 'provider' in basename:
        return 'providers'
    elif 'automation' in dirname or 'cron' in dirname or 'hook' in dirname:
        return 'automation'
    elif 'install' in dirname or 'setup' in dirname or 'deploy' in dirname:
        return 'install'
    elif 'security' in dirname or 'auth' in dirname:
        return 'security'
    
    # 根据内容关键词推断
    if content:
        content_lower = content.lower()
        keywords = {
            'plugins': ['plugin', 'sdk', 'manifest', 'entrypoint'],
            'gateway': ['config', 'setup', 'gateway', 'heartbeat'],
            'automation': ['hook', 'event', 'cron', 'task', 'trigger'],
            'skills': ['skill', 'command', 'slash'],
            'channels': ['channel', 'discord', 'telegram', 'feishu', 'whatsapp'],
            'concepts': ['concept', 'architecture', 'design'],
            'tools': ['tool', 'exec', 'browser', 'search'],
            'providers': ['provider', 'model', 'api'],
            'security': ['security', 'auth', 'token', 'password'],
        }
        for category, kws in keywords.items():
            if any(kw in content_lower for kw in kws):
                return category
    
    return 'references'

def sync_local(watch_dir, category='auto', force=False):
    """同步本地目录到 wiki"""
    if not os.path.isdir(watch_dir):
        print(f"❌ 监控目录不存在: {watch_dir}")
        return False
    
    print(f"🔍 扫描目录: {watch_dir}")
    current_files = scan_directory(watch_dir)
    print(f"   找到 {len(current_files)} 个支持的文件")
    
    manifest = load_manifest()
    sources = manifest.get('sources', {})
    
    # 找出新增或变更的文件
    to_process = []
    for filepath, info in current_files.items():
        file_hash = f"sha256:{info['hash']}"
        
        if filepath in sources:
            existing = sources[filepath]
            if existing.get('contentHash') == file_hash and not force:
                continue  # 未变更
            print(f"📝 文件变更: {os.path.basename(filepath)}")
        else:
            print(f"🆕 新文件: {os.path.basename(filepath)}")
        
        to_process.append(filepath)
    
    if not to_process:
        print("⏭️  没有新增或变更的文件")
        return True
    
    # 处理文件
    success_count = 0
    for filepath in to_process:
        print(f"\n📥 {os.path.basename(filepath)}")
        
        # 推断分类
        file_category = category
        if category == 'auto':
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read(5000)  # 读前 5000 字符
                file_category = infer_category(filepath, content)
            except:
                file_category = infer_category(filepath)
            print(f"   分类: {file_category}")
        
        # 调用 wiki-quick-ingest.py
        try:
            import subprocess
            result = subprocess.run(
                ['python3', INGEST_SCRIPT, filepath, file_category],
                capture_output=True, text=True, timeout=120,
                cwd=VAULT
            )
            if result.returncode == 0:
                print(f"   ✅ 入库成功")
                success_count += 1
            else:
                print(f"   ❌ 入库失败: {result.stderr[:200]}")
        except Exception as e:
            print(f"   ❌ 入库异常: {e}")
    
    print(f"\n📊 同步完成: {success_count}/{len(to_process)} 成功")
    return True

def watch_loop(watch_dir, category='auto', interval=300):
    """持续监控循环"""
    print(f"👁️  开始监控: {watch_dir}")
    print(f"   检查间隔: {interval} 秒 ({interval/60:.1f} 分钟)")
    print(f"   按 Ctrl+C 停止\n")
    
    while True:
        try:
            sync_local(watch_dir, category)
            print(f"\n💤 下次检查: {datetime.now().strftime('%H:%M:%S')} + {interval}s\n")
            time.sleep(interval)
        except KeyboardInterrupt:
            print("\n👋 监控已停止")
            break
        except Exception as e:
            print(f"⚠️  监控异常: {e}")
            time.sleep(interval)

def main():
    import argparse
    parser = argparse.ArgumentParser(description='本地目录监控同步')
    parser.add_argument('--watch', required=True, help='要监控的目录路径')
    parser.add_argument('--category', default='auto', help='wiki 分类（默认 auto 自动推断）')
    parser.add_argument('--interval', type=int, default=300, help='检查间隔秒数（默认 300=5分钟）')
    parser.add_argument('--once', action='store_true', help='只同步一次，不持续监控')
    parser.add_argument('--force', action='store_true', help='强制重新处理所有文件')
    args = parser.parse_args()
    
    if args.once:
        sync_local(args.watch, args.category, args.force)
    else:
        watch_loop(args.watch, args.category, args.interval)

if __name__ == '__main__':
    main()
