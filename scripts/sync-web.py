#!/usr/bin/env python3
"""
sync-web.py: 网页内容同步入库
定期抓取指定 URL 列表的内容，转 markdown 后入库 wiki

用法:
  python3 sync-web.py --urls urls.txt [--category web] [--interval 86400]
  
urls.txt 格式（每行一个 URL）:
  https://docs.openclaw.ai/getting-started
  https://example.com/blog/post1
"""

import os
import sys
import json
import hashlib
import re
from datetime import datetime, timezone
from urllib.parse import urlparse

try:
    import requests
except ImportError:
    print("❌ 需要 requests 模块: pip install requests")
    sys.exit(1)

VAULT = os.environ.get('WIKI_VAULT_PATH') or os.environ.get('OBSIDIAN_VAULT_PATH') or os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
MANIFEST_PATH = os.path.join(VAULT, '.manifest.json')
INGEST_SCRIPT = os.path.join(VAULT, 'scripts', 'wiki-quick-ingest.py')

def load_manifest():
    if os.path.exists(MANIFEST_PATH):
        with open(MANIFEST_PATH, 'r') as f:
            return json.load(f)
    return {'version': '1.1.0', 'projects': {}, 'sources': {}}

def save_manifest(manifest):
    with open(MANIFEST_PATH, 'w') as f:
        json.dump(manifest, f, indent=2)

def url_to_filename(url):
    """URL 转文件名"""
    parsed = urlparse(url)
    path = parsed.path.strip('/').replace('/', '-')
    if not path:
        path = parsed.netloc
    return re.sub(r'[^a-zA-Z0-9\u4e00-\u9fa5\-_]+', '-', path).strip('-') + '.md'

def fetch_url(url):
    """抓取网页内容"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (compatible; OpenClaw-Wiki-Bot/1.0)'
        }
        resp = requests.get(url, headers=headers, timeout=30, allow_redirects=True)
        resp.raise_for_status()
        return resp.text
    except Exception as e:
        print(f"❌ 抓取失败: {url} - {e}")
        return None

def html_to_markdown(html, url):
    """简单 HTML 转 Markdown（不含完整解析库时用最简方案）"""
    try:
        # 尝试用 html2text
        import html2text
        h = html2text.HTML2Text()
        h.ignore_links = False
        h.ignore_images = True
        h.body_width = 0
        md = h.handle(html)
        return f"---\ntitle: \"{url_to_filename(url).replace('.md', '')}\"\ncategory: web\ntags: []\nsources:\n  - {url}\ncreated: \"{datetime.now(timezone.utc).isoformat()}\"\nupdated: \"{datetime.now(timezone.utc).isoformat()}\"\n---\n\n{md}"
    except ImportError:
        # 最简方案：去掉 HTML 标签
        text = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
        text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL)
        text = re.sub(r'<[^>]+>', '', text)
        text = re.sub(r'\n\s*\n+', '\n\n', text)
        return f"---\ntitle: \"{url_to_filename(url).replace('.md', '')}\"\ncategory: web\ntags: []\nsources:\n  - {url}\ncreated: \"{datetime.now(timezone.utc).isoformat()}\"\nupdated: \"{datetime.now(timezone.utc).isoformat()}\"\n---\n\n{text}"

def sync_web(urls_file, category='web'):
    """同步网页内容到 wiki"""
    if not os.path.exists(urls_file):
        print(f"❌ URL 列表文件不存在: {urls_file}")
        return False
    
    with open(urls_file, 'r') as f:
        urls = [line.strip() for line in f if line.strip() and not line.startswith('#')]
    
    if not urls:
        print("⏭️  没有要同步的 URL")
        return True
    
    manifest = load_manifest()
    sources = manifest.get('sources', {})
    
    # 创建 web 分类目录
    web_dir = os.path.join(VAULT, category)
    os.makedirs(web_dir, exist_ok=True)
    
    success_count = 0
    skip_count = 0
    
    for url in urls:
        print(f"\n🌐 {url}")
        
        # 检查是否已经入库（对比 content hash）
        if url in sources:
            existing = sources[url]
            print(f"   已存在: {existing.get('ingestedAt', 'unknown')}")
            # TODO: 检查网页是否有更新（需要重新抓取对比 hash）
            skip_count += 1
            continue
        
        # 抓取网页
        html = fetch_url(url)
        if not html:
            continue
        
        # 转 markdown
        md_content = html_to_markdown(html, url)
        content_hash = hashlib.sha256(md_content.encode()).hexdigest()
        
        # 检查 hash 是否一致
        if url in sources and sources[url].get('contentHash') == f'sha256:{content_hash}':
            print(f"   ⏭️  内容未变更")
            skip_count += 1
            continue
        
        # 写入临时文件
        filename = url_to_filename(url)
        tmp_path = os.path.join('/tmp', filename)
        with open(tmp_path, 'w') as f:
            f.write(md_content)
        
        # 调用 wiki-quick-ingest.py 入库
        try:
            import subprocess
            result = subprocess.run(
                ['python3', INGEST_SCRIPT, tmp_path, category],
                capture_output=True, text=True, timeout=120,
                cwd=VAULT
            )
            if result.returncode == 0:
                print(f"   ✅ 入库成功: {filename}")
                success_count += 1
                
                # 更新 manifest
                if url not in sources:
                    sources[url] = {
                        'ingestedAt': datetime.now(timezone.utc).isoformat(),
                        'contentHash': f'sha256:{content_hash}',
                        'sourceType': 'web',
                        'format': 'html',
                        'project': 'web-sync',
                        'pagesCreated': [f'{category}/{filename}']
                    }
            else:
                print(f"   ❌ 入库失败: {result.stderr[:200]}")
        except Exception as e:
            print(f"   ❌ 入库异常: {e}")
        finally:
            # 清理临时文件
            try:
                os.remove(tmp_path)
            except:
                pass
    
    # 保存 manifest
    manifest['sources'] = sources
    manifest['updatedAt'] = datetime.now(timezone.utc).isoformat()
    save_manifest(manifest)
    
    print(f"\n📊 同步完成: {success_count} 成功, {skip_count} 跳过/已存在")
    return True

def main():
    import argparse
    parser = argparse.ArgumentParser(description='网页内容同步入库')
    parser.add_argument('--urls', required=True, help='URL 列表文件路径')
    parser.add_argument('--category', default='web', help='wiki 分类（默认 web）')
    parser.add_argument('--force', action='store_true', help='强制重新抓取所有 URL')
    args = parser.parse_args()
    
    sync_web(args.urls, args.category)

if __name__ == '__main__':
    main()
