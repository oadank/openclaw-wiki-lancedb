---
title: "OpenClaw Wiki - 本地知识库"
category: projects
tags: [knowledge-base, vector-search, lancedb, hybrid-search, rag, file-watcher, pipeline, self-maintenance, git-safety, alias-normalization]
sources:
  - /opt/openclaw/data/workspace/skills/openclaw-wiki-lancedb/README.md
created: "2026-04-25T09:18:15.602661+00:00"
updated: "2026-04-26T17:01:22.000000+00:00"
provenance:
  extracted: 1.0
  inferred: 0.0
  ambiguous: 0.0
summary: "LanceDB wiki with hybrid search for OpenClaw. v2.11.0 adds file monitoring, pipeline, self-maintenance, git safety, alias normalization."
---

# OpenClaw Wiki - 本地知识库

基于 LanceDB + BGE 向量嵌入的 OpenClaw 知识库，支持混合搜索（向量 + 精确匹配双重验证）。

---

## 🤖 给 AI 的话（Agent 请读这里）

> 你是一个 AI 助手，阅读本项目后，你应该能够独立完成：搜索知识库、导入新文档、精加工已有页面、审核草稿、重建向量索引、删除页面、生成日报、重建 Scaffold。
>
> **遇到问题时**：优先读 `SKILL.md`，里面定义了你的触发词和行为规范。

### 核心操作速查

| 操作 | 命令 |
|------|------|
| **搜索** | `node scripts/unified-search.js "关键词"` — 向量+grep+BM25 混合，双重验证 |
| **快速入库** | `python3 scripts/wiki-quick-ingest.py <文件路径> [分类]` — 0 token，秒级 |
| **批量入库** | `python3 scripts/wiki-quick-ingest.py --batch <目录>` |
| **精加工** | `node scripts/wiki-refine.js --unrefined` — LLM 补 summary/tags/wikilinks/TLDR/citations |
| **审核草稿** | `node scripts/wiki-review.js` — 交互式 approve/reject/diff/edit/quit |
| **重建 Scaffold** | `node scripts/wiki-scaffold.js --dry-run` — 重建 index.md + purpose.md + overview.md |
| **生成日报** | `node scripts/wiki-brief.js` — 解析 log.md 近 24h，生成 brief.md |
| **删除页面** | `python3 scripts/wiki-delete.py <页面路径>` — 一键清理 4 处残留 |
| **矛盾检测** | `node scripts/wiki-detect-contradictions.js` — LLM 比对相似页面 |
| **反偏见扫描** | `node scripts/wiki-divergence.js --dry-run` — 生成 Counter-Arguments + Data Gaps |
| **Query 分解** | `node scripts/wiki-query-decompose.js "复杂问题" --search` — 拆子问题+Gap 检测 |
| **审计记录** | `node scripts/wiki-audit.js recent 20` — 查看最近 20 条操作记录 |
| **重建向量库** | `cd .lancedb && node wiki-vector-search.js build` |
| **缓存管理** | `node scripts/wiki-cache.js stats` / `clear` / `get <key>` |
| **文件监控** | `node scripts/wiki-watch.js [目录]` — 自动入库 |
| **一键流水线** | `bash scripts/wiki-run.sh --batch --auto-refine` — 全量流水线 |
| **自维护** | `node scripts/wiki-maintain.js --fix` — 修断链+建 stub |
| **Git 安全网** | `node scripts/wiki-git.js commit "msg"` — 自动提交 |
| **概念别名** | `node scripts/wiki-alias.js --fix` — 别名归一化 |
| **Hook 触发** | `node scripts/wiki-hooks.js fire on-ingest` |
| **Cost 监控** | `node scripts/wiki-cost-guard.js status` — 查看今日 token 消耗 |

### 搜索标注说明

- 🔥 **双重验证** = grep + 向量同时命中，可信度最高
- 📌 **精确** = 仅 grep 命中
- 🧠 **语义** = 仅向量语义联想

---

### AI 自助安装（全新 clone 后）

```bash
# 1. 克隆
git clone https://github.com/oadank/openclaw-wiki-lancedb.git
cd openclaw-wiki-lancedb

# 2. 配置（任选一种方式）
# 方式 A：编辑 .env.example 填入你的配置，保存为 .env
# 方式 B：直接编辑脚本内的默认值（适合固定部署）

# 3. 安装 Node.js 依赖（向量搜索用）
cd .lancedb && npm install && cd ..

# 4. 启动 Embedding 服务（BGE 本地服务或远程 API）

# 5. 重建向量库（首次 clone 必须）
cd .lancedb && node wiki-vector-search.js build
```

> **不依赖 Docker**：上述步骤在裸机 Linux / Mac / Windows（WSL）均可直接运行。
> **使用 Docker**：在 docker run / docker-compose 中通过 `-e` 注入环境变量即可。

---

## 💡 架构来源：Karpathy 的 LLM Wiki

本项目源自 [Karpathy 的 LLM Wiki 架构](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)。

### RAG 的问题

传统 RAG：上传文件 → 查询时检索片段 → LLM 生成答案。**每次都从零发现知识，没有积累。** 问了涉及 5 个文档的复杂问题，LLM 每次都得重新找出来拼凑，什么都没沉淀。

### LLM Wiki 的思路

> 当你添加一个新来源时，LLM 不是简单索引它以待后用。它**读取它，提取关键信息，将其整合进现有的 wiki**——更新实体页面、修订主题摘要、标注矛盾之处。知识被编译一次，然后保持最新，而不是每次查询都重新推导。

### 核心差异

| | RAG | LLM Wiki |
|--|-----|---------|
| 知识状态 | 每次重新检索 | **持久积累**，编译一次 |
| 交叉引用 | 每次重新发现 | **已有**，wiki 里写好 |
| 矛盾标注 | 每次重新判断 | **已有**，LLM 已标注 |

> Obsidian 是 IDE；LLM 是程序员；Wiki 是代码库。 —— Karpathy

### Karpathy 的完整组件

```
源文档 → [ingest] → LLM 提炼 → Wiki 页面（.md + frontmatter + wikilinks）
                                ↓
                          index.md（全库索引）
                                ↓
                          log.md（时间线记录，append-only）
                                ↓
                          [lint / health check] → LLM 扫描不一致、缺失、矛盾
```

---

### 🆚 我们比 Karpathy 多了什么

Karpathy 的方案是纯文本检索（grep / grepf），适合几百页的小型 Wiki。本项目在此基础上增加了：

| 增强 | Karpathy 原版 | 我们 |
|------|-------------|------|
| **搜索方式** | 纯文本 grep | **混合搜索**：grep + BGE 向量 + BM25 + Rerank 二次排序 |
| **搜索标注** | 无 | **双重验证**：🔥双重验证 / 📌精确 / 🧠语义 |
| **入库速度** | LLM 提炼（耗时、耗 token） | **快速入库**：0 token 秒级 + LLM 精加工（按需） |
| **向量库** | 无 | **本地 LanceDB 向量库**，语义相似度搜索 |
| **OpenClaw 集成** | 无 | **SKILL.md**，AI 直接对话触发查询 |
| **增量同步** | 手动 | **自动同步**：入库后向量库自动 rebuild |
| **来源追踪** | 无 | **manifest.json**：每个文件带来源 URL / hash / 入库时间 |
| **精加工** | 每次全量 lint | **按需精加工**：`--category` / `--unrefined` 灵活选择 |
| **多格式导入** | 无 | **PDF/DOCX/XLSX 自动解析**为 Markdown 后入库 |
| **删除干净** | 无 | **`wiki-delete.py`** 一键删除，自动清理文件/索引/manifest/向量 |
| **来源项目管理** | 无 | **`.manifest.json` 新增 `projects` 表**，集中管理来源 URL |
| **草稿审核** | 无 | **`wiki-review.js`** 交互式审核，拒绝反馈闭环 |
| **手动编辑保护** | 无 | **git diff 检测**，内容变更自动跳过 refine |
| **反偏见区** | 无 | **`wiki-divergence.js`** 生成 Counter-Arguments + Data Gaps |
| **Query 分解** | 无 | **`wiki-query-decompose.js`** 拆子问题+Gap 检测 |
| **缓存层** | 无 | **`wiki-cache.js`** LLM 响应缓存，SHA256 键 |
| **审计 trail** | 无 | **`wiki-audit.js`** JSONL 不可变记录，tokens/cost 追踪 |
| **Hook 系统** | 无 | **`wiki-hooks.js`** 事件驱动钩子 |
| **Cost Guard** | 无 | **`wiki-cost-guard.js`** 日限额门控 |
| **文件监控** | 无 | **`wiki-watch.js`** 监控 raw/ 自动入库 |
| **一键流水线** | 无 | **`wiki-run.sh`** ingest → refine → lint → review |
| **自维护** | 无 | **`wiki-maintain.js`** 修断链 + 建 stub + 检测孤儿页 |
| **Git 安全网** | 无 | **`wiki-git.js`** 自动 commit + undo 回退 |
| **概念别名归一化** | 无 | **`wiki-alias.js`** `[[Alias]]` → `[[Canonical|Alias]]` |

**我们多了一个搜索增强层**，在 Karpathy 的 Wiki 持久积累之上，增加了向量语义搜索能力——精确查和语义联想互补，双重验证确保可信度。

---

## 📚 已入库来源

| 来源 | 文档数 | 说明 |
|------|--------|------|
| [OpenClaw 官方文档](https://docs.openclaw.ai) | 449 | OpenClaw 官方文档全量吸收 |
| `OpenClaw_Skills_AI_Configuration_Guide.pdf` | 1 | PDF 测试导入 |
| [openclaw-wiki-lancedb 项目 README](https://github.com/oadank/openclaw-wiki-lancedb) | 1 | 本项目自身文档 |

> **来源记录**：`.manifest.json` 记录每个文件的入库时间、来源 URL、sha256 hash 和 wiki 页面路径。

## 架构

```
源文档 → [ingest/quick-ingest] → Wiki 页面（Markdown）
                                      ↓
                            [向量同步] → LanceDB 向量库
                                      ↓
                            [统一搜索] → unified-search.js
                                      ↓
                            grep 精确 + 向量语义 → 交叉验证输出
                                      ↓
                            [精加工/审核] → refine.js → .drafts/ → review.js → 转正
                                      ↓
                            [Scaffold] → index.md / purpose.md / overview.md
                                      ↓
                            [审计] → log.md + audit.jsonl
                                      ↓
                            [健康检查] → lint.js / divergence.js / detect-contradictions.js
```

## 核心文件

| 文件 | 说明 |
|------|------|
| `SKILL.md` | OpenClaw 技能定义 |
| `README.md` | 本文件 |
| `index.md` | Wiki 全库索引（Scaffold 自动生成） |
| `log.md` | 运行日志（append-only） |
| `brief.md` | 每日日报（自动生成） |
| `purpose.md` | Wiki 范围边界声明（自动生成） |
| `overview.md` | 全局概览（自动生成） |
| `.manifest.json` | 入库记录（sha256 追踪 + projects 表） |
| `scripts/unified-search.js` | **统一搜索入口**（grep + 向量 + BM25 + Rerank） |
| `scripts/wiki-quick-ingest.py` | 快速入库（0 token，秒级，支持 PDF/DOCX/XLSX） |
| `scripts/wiki-delete.py` | 删除 wiki 页面（自动清理 4 处残留） |
| `scripts/wiki-refine.js` | LLM 精加工（补 summary/tags/wikilinks/TLDR/citations/Open Questions） |
| `scripts/wiki-review.js` | 草稿审核（approve/reject/diff/edit/quit） |
| `scripts/wiki-scaffold.js` | Scaffold 重建（index/purpose/overview） |
| `scripts/wiki-brief.js` | 每日日报生成 |
| `scripts/wiki-divergence.js` | 反偏见扫描（Counter-Arguments + Data Gaps） |
| `scripts/wiki-detect-contradictions.js` | 矛盾检测 |
| `scripts/wiki-query-decompose.js` | Query 分解 + Gap 检测 |
| `scripts/wiki-cache.js` | LLM 响应缓存（SHA256 键） |
| `scripts/wiki-audit.js` | 审计 trail（JSONL，tokens/cost 追踪） |
| `scripts/wiki-hooks.js` | Hook 系统（on-ingest/on-refine/on-lint/on-delete） |
| `scripts/wiki-cost-guard.js` | Cost Guard（日限额门控） |
| `scripts/wiki-watch.js` | 文件监控自动入库 |
| `scripts/wiki-run.sh` | 一键流水线 |
| `scripts/wiki-maintain.js` | 自维护（修断链+建 stub+检测孤儿页） |
| `scripts/wiki-git.js` | Git 安全网（自动 commit + undo） |
| `scripts/wiki-alias.js` | 概念别名归一化 |
| `scripts/ingest.js` | 完整 LLM 提炼入库 |
| `scripts/lint.js` | Wiki 健康检查 |
| `.lancedb/wiki-vector-search.js` | 向量搜索核心（build/search） |
| `.lancedb/wiki-delete-vector.js` | 向量删除辅助脚本 |

## 功能列表

| 功能 | 说明 |
|------|------|
| **混合搜索** | grep 精确 + BGE 向量 + BM25 + Rerank 四路融合 |
| **双重验证** | 搜索结果标注「🔥双重验证 / 📌精确 / 🧠语义」 |
| **快速入库** | `wiki-quick-ingest.py` — Python 脚本，0 token，秒级，自动分类 |
| **多格式导入** | PDF / DOCX / XLSX 自动解析为 Markdown，再入库 |
| **删除干净** | `wiki-delete.py` 一键删除页面，自动清理 4 处残留 |
| **来源项目管理** | `.manifest.json` 新增 `projects` 表，集中存储来源名称/URL/类型 |
| **LLM 精加工** | `wiki-refine.js` — 批量补 summary / tags / wikilinks / TLDR / citations / Open Questions |
| **草稿审核** | `wiki-review.js` — 交互式 approve/reject/diff/edit/quit，拒绝反馈闭环 |
| **手动编辑保护** | git diff 检测内容行变更（排除 frontmatter），手动编辑时跳过 refine |
| **反偏见区** | `wiki-divergence.js` — LLM 生成 Counter-Arguments & Biases + Data Gaps |
| **矛盾检测** | `wiki-detect-contradictions.js` — LLM 比对相似页面，矛盾时标 `status: contradicted` |
| **Query 分解** | `wiki-query-decompose.js` — 复杂问题拆 1-4 子问题并行搜索，Gap 检测推荐搜索 |
| **缓存层** | `wiki-cache.js` — LLM 响应按 prompt SHA256 缓存，stats/clear/get/set |
| **审计 trail** | `wiki-audit.js` — JSONL 不可变记录（operation/tokens/cost/ts），record/recent/stats |
| **Hook 系统** | `wiki-hooks.js` — 事件驱动钩子（on-ingest/on-refine/on-lint/on-delete），list/add/remove/fire |
| **Cost Guard** | `wiki-cost-guard.js` — 日限额+警告阈值门控，超限自动拦截 |
| **Scaffold 重建** | `wiki-scaffold.js` — 重建 index.md（分类组织）/ purpose.md（范围边界）/ overview.md（全局概览） |
| **每日日报** | `wiki-brief.js` — 解析 log.md 近 24h，生成 brief.md 日报 |
| **完整入库** | `ingest.js` — LLM 提炼整合，生成结构化 wiki 页 |
| **向量库自动同步** | ingest / quick-ingest 完成后自动 rebuild 向量库 |
| **增量更新** | manifest sha256 对比，只处理变更文件 |
| **统一搜索入口** | `unified-search.js` — 一个入口综合多套搜索 |
| **OpenClaw 技能** | `SKILL.md`，AI 自动识别触发，直接对话查询 |
| **来源追踪** | `.manifest.json` 记录每个文件的来源 URL、入库时间、hash、format、sourceType |
| **向量数据库** | LanceDB + BGE-Small-ZH（512 维），本地存储 |
| **批量入库** | `python3 scripts/wiki-quick-ingest.py --batch <目录>` 整目录批量吸收 |
| **分类自动推断** | 根据内容关键词自动分发到 concepts/gateway/plugins 等分类 |
| **搜索结果格式化** | 展示路径 / 标题 / 匹配片段 / 分数 / 来源类型 |

## ⚙️ 配置（Docker 和非 Docker 都适用）

所有配置均通过**环境变量**注入，支持 Docker / 直接运行 / cron 任务各种场景。

### 方式一：环境变量（推荐）

```bash
# 必填：LLM 接口（OpenAI 兼容格式）
export LLM_BASE_URL=https://your-llm-endpoint/v1
export LLM_API_KEY=your-api-key
export LLM_MODEL=your-model-name

# 必填：Embedding 服务（本地或远程均可）
export EMBEDDING_URL=http://your-embedding-endpoint/v1/embeddings

# 可选：Rerank 排序模型（显著提升搜索相关性）
export RERANK_URL=https://api.siliconflow.cn/v1/rerank
export SILICONFLOW_API_KEY=your-siliconflow-api-key

# 可选：Wiki Vault 路径（默认自动推断）
export WIKI_VAULT_PATH=/path/to/wiki-vault
```

### 方式二：编辑脚本内的默认值

各脚本头部的常量可以直接改（适合固定部署）：

```javascript
// .lancedb/wiki-vector-search.js
const EMBED_URL = 'http://your-embedding-endpoint/v1/embeddings';

// scripts/wiki-refine.js / scripts/ingest.js
const LLM_BASE_URL = 'https://your-llm-endpoint/v1';
const LLM_API_KEY = 'your-api-key';
const LLM_MODEL = 'your-model-name';
```

### 推荐方案

| 需求 | 推荐方案 |
|------|---------|
| LLM | [硅基流动](https://siliconflow.cn)（聚合多家，按量计费）或 [阿里云 DashScope](https://dashscope.console.aliyun.com)（中文效果好）或 [OpenRouter](https://openrouter.ai) |
| Embedding | [BGE-Small-ZH](https://github.com/FlagOpen/FlagEmbedding)（支持本地部署）或 硅基流动 API |
| Rerank | [硅基流动](https://siliconflow.cn) 申请 BAAI/bge-reranker-v2-m3 |
| 完全本地 | [Ollama](https://ollama.com) 跑 LLM + Embedding，LlamaEdge 跑 Rerank |

> **不配置 Rerank 也能正常搜索**，只是跳过二次排序，效果略降。

### Docker 部署

如果用 Docker 运行，需要把宿主机的服务地址传进去：

```bash
# 假设宿主机的 LiteLLM 代理监听 192.168.1.100:4000
docker run -e LLM_BASE_URL=http://192.168.1.100:4000/v1 \
           -e EMBEDDING_URL=http://192.168.1.100:11435/v1/embeddings \
           your-image
```

> 💡 容器内 `host.docker.internal` = 宿主机 IP，适用于 Linux Docker。

### 多格式导入

PDF、Word、Excel 文件自动解析为 Markdown，再入库。

**Docker 容器环境：**
```bash
bash scripts/parse-file.sh 文件路径
```

**裸机 / 非 Docker 环境：**
```bash
# PDF
python3 -c "
import fitz
doc = fitz.open('file.pdf')
for i, page in enumerate(doc):
    text = page.get_text()
    lines = [l.rstrip() for l in text.split('\n')]
    print(f'## 第 {i+1} 页\n\n' + '\n'.join(l for l in lines if l.strip()))
doc.close()
"

# DOCX
python3 -c "
from docx import Document
doc = Document('file.docx')
for para in doc.paragraphs:
    style = para.style.name.lower() if para.style.name else ''
    text = para.text.strip()
    if not text: continue
    if 'heading' in style and '1' in style: print(f'# {text}')
    elif 'heading' in style and '2' in style: print(f'## {text}')
    else: print(text)
"

# XLSX
python3 -c "
from openpyxl import load_workbook
wb = load_workbook('file.xlsx', data_only=True)
for sheet_name in wb.sheetnames:
    ws = wb[sheet_name]
    print(f'## 工作表: {sheet_name}\n')
    rows = list(ws.iter_rows(values_only=True))
    if not rows: continue
    headers = [str(c) if c is not None else '' for c in rows[0]]
    print('| ' + ' | '.join(headers) + ' |')
    print('| ' + ' | '.join(['---'] * len(headers)) + ' |')
    for row in rows[1:]:
        cells = [str(c) if c is not None else '' for c in row]
        print('| ' + ' | '.join(cells) + ' |')
wb.close()
"
```

**依赖（非 Docker 环境需要先装）：**
```bash
pip install pymupdf python-docx openpyxl
```

| 格式 | 解析方式 |
|------|---------|
| PDF | `fitz`（PyMuPDF），每页转换为 `## 第 N 页` Markdown |
| DOCX / DOC | `python-docx`，标题样式 → `#` / `##`，正文 → 普通段落 |
| XLSX / XLS | `openpyxl`，每工作表转换为 Markdown 表格 |

---

## 使用方法

### 查询

```bash
node scripts/unified-search.js "关键词" [返回数量]
# 或
bash scripts/wiki-search.sh "关键词" [返回数量]
```

### 快速入库（0 token）

```bash
python3 scripts/wiki-quick-ingest.py <源文件.md> [分类]
# 例：python3 scripts/wiki-quick-ingest.py ~/docs/hooks.md plugins
# 批量：python3 scripts/wiki-quick-ingest.py --batch ~/docs/
```

### 删除页面（自动清理关联数据）

```bash
# 删除单页
python3 scripts/wiki-delete.py plugins/my-plugin.md

# 批量删除（文件列表每行一个路径）
python3 scripts/wiki-delete.py --batch delete-list.txt

# 恢复文件（从 refs 目录复制）
python3 scripts/wiki-delete.py --restore concepts/agent.md
```

### 精加工（LLM 补元数据）

```bash
# 未精炼的文件（输出到 .drafts/）
node scripts/wiki-refine.js --unrefined

# 指定分类
node scripts/wiki-refine.js --category plugins

# 跳过草稿区，直接写入
node scripts/wiki-refine.js --direct concepts/agent.md
```

### 审核草稿

```bash
node scripts/wiki-review.js
# 菜单: (a)pprove (r)eject (d)iff (e)dit (q)uit
```

### 反偏见扫描

```bash
# 全库扫描（dry-run 预览）
node scripts/wiki-divergence.js --dry-run

# 单页处理
node scripts/wiki-divergence.js --page concepts/agent.md
```

### Query 分解

```bash
# 复杂问题拆子问题搜索
node scripts/wiki-query-decompose.js "比较 OpenClaw 和 Dify"

# 含 Gap 检测
node scripts/wiki-query-decompose.js "OpenClaw 安装" --search
```

### Scaffold 重建

```bash
# 全量重建
node scripts/wiki-scaffold.js

# 仅重建 index.md
node scripts/wiki-scaffold.js --index

# 仅重建 overview.md
node scripts/wiki-scaffold.js --overview

# dry-run 预览
node scripts/wiki-scaffold.js --dry-run
```

### 每日日报

```bash
# 生成近 24h 日报
node scripts/wiki-brief.js

# 指定时间范围
node scripts/wiki-brief.js --since "2026-04-25T00:00:00"
```

### 重建向量库

```bash
cd .lancedb && node wiki-vector-search.js build
```

### 审计查询

```bash
# 最近 20 条记录
node scripts/wiki-audit.js recent 20

# 统计
node scripts/wiki-audit.js stats
```

### Cost 监控

```bash
# 查看今日消耗
node scripts/wiki-cost-guard.js status

# 设置日限额 50000 tokens，警告阈值 80%
node scripts/wiki-cost-guard.js set 50000 0.8
```

### Hook 管理

```bash
# 列出钩子
node scripts/wiki-hooks.js list

# 注册钩子
node scripts/wiki-hooks.js add on-ingest ./hooks/post-ingest.sh

# 触发钩子
node scripts/wiki-hooks.js fire on-ingest
```

## 搜索结果标注

| 标注 | 含义 |
|------|------|
| 🔥 双重验证 | grep + 向量同时命中，可信度最高 |
| 📌 精确 | grep 精确匹配标题/内容 |
| 🧠 语义 | 向量语义联想 |

## 目录结构

```
openclaw-wiki-lancedb/
├── SKILL.md                    # OpenClaw 技能定义
├── README.md                   # 本文件
├── index.md                    # Wiki 全库索引（Scaffold 自动生成）
├── log.md                      # 运行日志（append-only）
├── brief.md                    # 每日日报（自动生成）
├── purpose.md                  # Wiki 范围边界声明（自动生成）
├── overview.md                 # 全局概览（自动生成）
├── .gitignore
├── .manifest.json              # 入库记录（sha256 追踪 + projects 表）
├── .olw/
│   ├── cache/                  # LLM 响应缓存
│   │   └── responses.json
│   ├── hooks.json              # 钩子注册表
│   ├── audit.jsonl             # 审计记录
│   └── cost.json               # Cost Guard 数据
├── .drafts/                    # 草稿区（refine 输出，审核后转正）
├── .lancedb/
│   ├── wiki-vector-search.js   # 向量搜索核心
│   ├── wiki-delete-vector.js   # 向量删除辅助脚本
│   ├── index.json              # 向量库元数据
│   └── vector_db/wiki.lance/   # LanceDB 向量数据
├── _raw/                      # 原始源文档（可选）
├── scripts/
│   ├── unified-search.js       # 统一搜索入口
│   ├── wiki-search.sh         # 搜索包装器
│   ├── wiki-quick-ingest.py   # 快速入库（支持 PDF/DOCX/XLSX）
│   ├── wiki-delete.py         # 删除页面（清理文件/索引/manifest/向量）
│   ├── wiki-refine.js         # LLM 精加工
│   ├── wiki-review.js         # 草稿审核
│   ├── wiki-scaffold.js       # Scaffold 重建
│   ├── wiki-brief.js          # 每日日报
│   ├── wiki-divergence.js     # 反偏见扫描
│   ├── wiki-detect-contradictions.js  # 矛盾检测
│   ├── wiki-query-decompose.js      # Query 分解 + Gap 检测
│   ├── wiki-cache.js          # LLM 响应缓存
│   ├── wiki-audit.js          # 审计 trail
│   ├── wiki-hooks.js          # Hook 系统
│   ├── wiki-cost-guard.js     # Cost Guard
│   ├── wiki-watch.js          # 文件监控
│   ├── wiki-run.sh            # 一键流水线
│   ├── wiki-maintain.js       # 自维护
│   ├── wiki-git.js            # Git 安全网
│   ├── wiki-alias.js          # 概念别名归一化
│   ├── ingest.js              # 完整 LLM 入库
│   ├── lint.js                # Wiki 健康检查
│   └── query.js              # 查询工具
└── [分类目录]/                # Wiki 内容（concepts/gateway/plugins/...）
    ├── concepts/
    ├── gateway/
    ├── plugins/
    └── ...
```

## ✨ 核心特性（对比其他方案）

| 特性 | 本项目 | 其他 RAG / Wiki |
|------|--------|---------------|
| **搜索** | 向量 + 精确 + Rerank 四路融合 | 纯向量 or 纯 grep |
| **来源** | manifest 记录每个文档的 URL 和入库时间 | 无 |
| **更新** | 增量入库，sha256 对比，只处理变更 | 全量重索引 |
| **入库速度** | 0 token 秒级（快速入库）+ LLM 精加工（按需） | 每次 LLM 提炼 |
| **删除** | 一键删除，自动清理 4 处残留 | 手动删文件 |
| **多格式** | PDF/DOCX/XLSX 自动解析 | 仅 Markdown |
| **OpenClaw 集成** | SKILL.md，AI 对话直接触发 | 手动调用 |
| **草稿审核** | 交互式审核，拒绝反馈闭环 | 无 |
| **手动编辑保护** | git diff 检测，自动跳过 | 无 |
| **反偏见** | Counter-Arguments + Data Gaps | 无 |
| **Query 分解** | 子问题拆分 + Gap 检测 | 无 |
| **缓存** | LLM 响应 SHA256 缓存 | 无 |
| **审计** | tokens/cost 不可变记录 | 无 |
| **Hook** | 事件驱动，可扩展 | 无 |
| **Cost Guard** | 日限额门控 | 无 |
| **文件监控** | raw/ 目录自动入库 | 无 |
| **一键流水线** | ingest → refine → lint → review | 无 |
| **自维护** | 修断链 + 建 stub | 无 |
| **Git 安全网** | 自动 commit + undo | 无 |
| **概念别名** | `[[Alias]]` → `[[Canonical|Alias]]` | 无 |

---

## 📒 更新日志（append-only）

`log.md` 是本项目的 append-only 时间线，记录所有入库、精加工、lint 操作。每次变更后自动追加一行，便于追踪知识库演化历史。

格式：`[时间] | 操作 | 状态 | 详情`

```bash
# 查看最近 5 条记录
grep "^|" log.md | tail -5
```

---

## 📋 版本更新记录

### 2026-04-26 — v2.11.0

**新增功能**（来源: kytmanov/obsidian-llm-wiki-local v0.7.0）

**项目16 — 文件监控自动入库**
- `scripts/wiki-watch.js`（新增）：监控 raw/ 目录，新文件自动触发 quick-ingest
- `--auto-refine` 入库后自动精加工
- `--debounce N` 防抖（默认 3 秒，避免处理半写文件）
- `--batch` 启动时批量处理现有文件
- `--dry-run` 预览
- 支持 `.md` / `.pdf` / `.docx` / `.xlsx` 格式

**项目17 — 一键流水线**
- `scripts/wiki-run.sh`（新增）：4 步流水线
  - Step 1: 批量入库（`--batch`）
  - Step 2: 精加工（`--auto-refine`）
  - Step 3: 健康检查（lint.js，始终执行）
  - Step 4: 审核草稿（`--review`）
- 失败不影响后续步骤，可独立开关

**项目18 — 自维护**
- `scripts/wiki-maintain.js`（新增）：修复 wiki 常见问题
  - `--fix-links`: 修复断链（通过 alias 映射规范化 wikilinks）
  - `--create-stubs`: 为缺失目标创建 stub 页面
  - `--fix`: 执行全部（断链修复 + stub 创建 + 孤儿页检测）
  - 构建 alias 映射：`[[Alias]]` → `[[Canonical|Alias]]`

**项目19 — Git 安全网**
- `scripts/wiki-git.js`（新增）：每次 wiki 操作后自动 git commit
  - `commit <msg>`: 自动 git add -A + commit
  - `undo`: 回退最后一次 auto: 提交（用 git revert）
  - `log`: 查看自动提交历史
  - `status`: 查看未提交变更
  - 只提交 `auto:` 前缀的自动变更，不干扰手动提交

**项目20 — 概念别名归一化**
- `scripts/wiki-alias.js`（新增）：别名提取和归一化
  - `--scan`: 扫描并显示 alias 映射表
  - `--normalize`: 规范化 wikilinks
  - `--write-fm`: 写入 frontmatter aliases 字段
  - `--fix`: 执行全部（normalize + write-fm）
  - 自动生成别名变体：缩写、驼峰、去连字符
  - 最多 10 个别名写入 frontmatter

**文档更新**
- README.md: 核心操作速查 + 目录结构 + 功能对比表全面更新
- SKILL.md: 新增 5 个完整章节（文件监控/一键流水线/自维护/Git安全网/别名归一化）

---

### 2026-04-26 — v2.10.0

**新增功能**

**项目11 — LLM 3层缓存**（来源: Synthadoc）
- `scripts/wiki-cache.js`（新增）：SHA256 缓存键，JSON 存储，`stats/clear/get/set` 子命令

**项目12 — 审计 trail**（来源: Synthadoc）
- `scripts/wiki-audit.js`（新增）：JSONL 不可变记录（operation/tokens/cost/ts），`record/recent/stats`
- 集成到 `wiki-refine.js`

**项目13 — Hook 系统**（来源: Synthadoc）
- `scripts/wiki-hooks.js`（新增）：事件驱动钩子（on-ingest/on-refine/on-lint/on-delete），`list/add/remove/fire`

**项目14 — Query 分解 + Gap 检测**（来源: Synthadoc）
- `scripts/wiki-query-decompose.js`（新增）：复杂问题拆成 1-4 个子问题并行搜索，`--search` 含 Gap 检测和搜索建议

**项目15 — Cost Guard**（来源: Synthadoc）
- `scripts/wiki-cost-guard.js`（新增）：日限额+警告阈值两层门控，超限自动拦截
- `record/status/set` 子命令，集成到 `wiki-refine.js`

---

### 2026-04-26 — v2.9.0

**新增功能**
- ✅ **每日 cron brief 汇总**（来源: umbex 评论建议）
  - `scripts/wiki-brief.js`（新增）：解析 log.md 近 24 小时条目，生成 `brief.md` 日报
  - 日报含操作统计表格 + 详细记录
  - `--since` 指定时间范围，`--dry-run` 预览
  - 计划 cron: `0 7 * * *` 每日早晨自动执行

---

### 2026-04-26 — v2.8.0

**新增功能**
- ✅ **Scaffold 自动重建**（来源: Synthadoc 架构）
  - `scripts/wiki-scaffold.js`（新增）：一键重建核心元文件
    - `index.md` — 分类组织，保护已有链接
    - `purpose.md` — LLM 定义 wiki 范围边界
    - `overview.md` — 取最近 10 页，LLM 写全局概览
  - `--index` / `--overview` / `--dry-run` 分模式运行

---

### 2026-04-26 — v2.7.0

**新增功能**
- ✅ **Divergence Check 反偏见区**（来源: localwolfpackai 评论建议）
  - `scripts/wiki-divergence.js`（新增）：全量扫描 wiki，LLM 识别反驳观点和数据缺口
  - 输出 `## Counter-Arguments & Biases` + `## Data Gaps & Verification Needed` 区
  - `--dry-run` 预览模式 / `--page <path>` 单页模式
  - 已有区或 LLM 无内容则跳过，不重复
  - `wiki-refine.js`：Divergence 区保留（不重复追加）

---

### 2026-04-26 — v2.6.0

**新增功能**
- ✅ **手动编辑保护**（来源: olw 机制）
  - `wasManuallyEdited()` 函数：git diff 检测内容行变更（排除 frontmatter 自动更新）
  - 判定为手动编辑时跳过 refine，记录到 log.md
  - 草稿区 / 系统目录不检测
  - 解除冲突：`git add` 手动编辑的文件后重新 refine

**脚本更新**
- `wiki-refine.js`：手动编辑检测

---

### 2026-04-26 — v2.5.0

**新增功能**
- ✅ **草稿审核 + 拒绝反馈闭环**（来源: olw 核心机制）
  - `wiki-refine.js` 改输出到 `.drafts/` 目录，需人工审核后再转正
  - 5 次拒绝自动屏蔽该页面（`node wiki-review.js --unblock` 解除）
  - 历史拒绝原因注入 prompt，下次生成自动修正
  - `--direct` 参数：跳过草稿区，直接写入正式目录
  - `scripts/wiki-review.js`（新增）：交互式审核菜单

**脚本更新**
- `wiki-refine.js`：草稿区输出 + 屏蔽检测 + 拒绝反馈注入
- `scripts/wiki-review.js`（新增）：approve / reject / diff / edit / quit

---

### 2026-04-26 — v2.4.0

**新增功能**
- ✅ **来源段落级引用**（来源: peas + laphilosophia 评论建议）
  - LLM refine prompt 新增引用标记规则：正文关键声明后加 `[^N]` 上标
  - prompt 输出新增 `citations` 字段：`[^N]: <来源路径> — <声明摘要>` 格式
  - 正文末尾追加 `## References` 区，解析 citations 输出
  - 不发明内容：没有可引用的声明时输出 `none` 跳过

**脚本更新**
- `wiki-refine.js`：引用标记规则 + citations 输出 + References 区追加

---

### 2026-04-26 — v2.3.