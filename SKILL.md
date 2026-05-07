---
name: openclaw-wiki-lancedb
description: "查询本地 Wiki 知识库。支持关键词搜索、语义联想、双重验证。当用户询问 OpenClaw 文档、配置指南、概念说明、工具用法、安装问题、报错排查、功能解释、最佳实践、版本更新时使用。"
version: 2.11.0
---

# Wiki Vault 查询技能

通过统一搜索引擎查询本地 Wiki 知识库，融合 grep 精确匹配 + 向量语义搜索。

## 🤖 给 AI 的话（Agent 必读）

**你是一名 OpenClaw 专家助手。当用户询问任何与 OpenClaw 相关的问题时，你必须先搜索 wiki 知识库，再基于搜索结果回答。**

### ⚠️ 铁律（不可违反）

1. **每次提问都要搜索** — 即使之前回答过类似问题，用户再次提问时必须重新搜索。wiki 内容可能已更新，旧答案可能过时。
2. **不搜索不许回答** — 没有搜索结果前，禁止凭记忆回答。如果搜索失败，诚实告知"搜索不到相关信息"。
3. **禁止敷衍用户** — 不允许说"刚才已经说过了"、"看上面的回答"等话。每次都要认真对待。

### 何时搜索

以下情况**必须**搜索 wiki：
- 用户问 "OpenClaw 怎么配置 / 安装 / 使用"
- 用户问某个工具/插件/功能怎么用
- 用户遇到报错或故障排查
- 用户问概念、架构、设计原理
- 用户问最佳实践或推荐方案
- 用户问版本更新或变更记录
- 任何包含 "openclaw"、"claw"、"skill"、"plugin"、"gateway"、"channel" 等关键词的问题

### 模式选择（自动判断）

| 用户问题类型 | 模式 | 判断依据 |
|-------------|------|---------|
| "xxx 是什么" / "解释 xxx" / "概念" | **快速** | 只需要定位到文档，直接引用定义 |
| "xxx 在哪里" / "找 xxx 文档" | **快速** | 只需要知道文档位置 |
| "怎么配置 xxx" / "如何安装" / "步骤" | **深度** | 需要操作步骤，必须读全文 |
| "报错 xxx 怎么办" / "排查" / "解决" | **深度** | 需要分析原因和解决方案 |
| "推荐 / 最佳实践 / 对比" | **深度** | 需要综合多个文档给建议 |
| "为什么 xxx" / "原理" | **深度** | 需要深入理解机制 |

**默认规则**：先快速模式搜索，如果结果不够具体（没有明确的操作步骤或解决方案），自动切换到深度模式。

### 如何搜索

```bash
# 快速模式（先尝试）
node scripts/unified-search.js "关键词" 10

# 深度模式（复杂问题）
node scripts/unified-search.js "问题" --mode deep
```

**搜索策略：**
1. 提取用户问题的**核心关键词**（去掉"怎么"、"如何"、"为什么"等虚词）
2. 如果用户问题具体，用具体关键词（如 "gateway config"）
3. 如果用户问题模糊，用宽泛关键词（如 "install"）
4. 首次搜索未找到，换同义词再搜一次
5. **绝对不允许**因为"之前搜过"而跳过搜索

### 如何解读搜索结果

| 标注 | 含义 | 可信度 | 使用建议 |
|------|------|--------|---------|
| 🔥 双重验证 | grep + 向量同时命中 | **最高** | 优先引用，最准确 |
| 📌 精确 | grep 精确匹配标题/内容 | 高 | 直接相关，可引用 |
| 🧠 语义 | 向量语义联想 | 中 | 可能相关，需人工判断 |

### 如何回答用户

1. **先搜索**，获取 wiki 结果
2. **基于搜索结果回答**，不要凭记忆瞎编
3. **引用来源**："根据 wiki 中 `plugins/xxx.md` 的说明..."
4. **如果搜索结果不足**，诚实告知："wiki 中没有找到相关内容，建议查阅官方文档或社区"
5. **如果用户问的是操作步骤**，给出具体命令和配置示例
6. **禁止说"刚才说过了"** — 每次都要基于搜索结果重新组织回答

---

## 知识库路径

| 项目 | 路径 |
|------|------|
| Vault 根目录 | `$WIKI_VAULT_PATH` 或 `$OBSIDIAN_VAULT_PATH` 或脚本所在目录的父目录 |
| 索引文件 | `Vault/index.md` |
| 向量库 | `Vault/.lancedb/vector_db/wiki.lance` |

## 导入原始记录

`.manifest.json` 是导入元数据清单，记录了每一条 wiki 页面的原始来源：

| 字段 | 说明 |
|------|------|
| `sources` | 原始文件路径 → 导入元数据映射 |
| `ingestedAt` | 导入时间戳 |
| `sourceType` | 来源类型（document / web / etc） |
| `project` | 来源项目名（如 `openclaw-docs`） |
| `pagesCreated` | 该来源生成的 wiki 页面路径列表 |
| `contentHash` | 内容 SHA256，用于检测变更 |

**用途：**
- 追溯某个 wiki 页面是从哪个原始文件生成的
- 检查原始文件是否有更新（对比 `contentHash`）
- 统计各来源项目的覆盖情况

**示例查询：**
```bash
# 查看某个 wiki 页的原始来源
grep -A5 "pagesCreated.*\"concepts/index.md\"" .manifest.json

# 统计来源项目分布
cat .manifest.json | jq '.sources | group_by(.project) | map({project: .[0].project, count: length})'
```


```bash
# 必填
WIKI_VAULT_PATH=/path/to/wiki-vault           # Vault 根目录
LLM_BASE_URL=http://localhost:4000/v1        # OpenAI 兼容 LLM
LLM_API_KEY=your-key
LLM_MODEL=your-model
EMBEDDING_URL=http://localhost:11435/v1/embeddings  # Embedding 服务

# 可选
RERANK_URL=https://api.siliconflow.cn/v1/rerank
SILICONFLOW_API_KEY=your-key
```

## 删除用法

### 删除 wiki 页面（自动清理关联数据）

```bash
# 删除单页（自动清理文件、索引、manifest、向量库）
python3 scripts/wiki-delete.py <页面路径>

# 示例
python3 scripts/wiki-delete.py concepts/agent.md

# 批量删除
python3 scripts/wiki-delete.py --batch delete-list.txt

# 恢复文件（从 refs 目录复制）
python3 scripts/wiki-delete.py --restore concepts/agent.md
```

**删除时会自动清理：**
1. `.md` 页面文件
2. `index.md` 里的链接
3. `.manifest.json` 里的 source 记录
4. LanceDB 向量库里的向量

---

## 查询用法

### 用户直接提问（IM 对话模式）

用户直接在聊天中提问，AI 自动识别并搜索 wiki：

```
用户: "OpenClaw 怎么配置微信插件？"
AI: [自动调用搜索] → node scripts/unified-search.js "wechat plugin config"
     [基于结果回答] → "根据 wiki 中 channels/wechat.md 的说明..."
```

**触发词**（AI 识别到以下任意关键词即触发搜索）：
- "OpenClaw / openclaw / claw" 相关问题
- "怎么 / 如何 / 为什么 / 是什么" + 技术名词
- "配置 / 安装 / 使用 / 报错 / 排查 / 调试"
- "plugin / skill / gateway / channel / hook / cron"
- "文档 / 说明 / 指南 / 教程 / 参考"
- "最佳实践 / 推荐 / 建议 / 经验"

### 手动搜索（精确控制）

```bash
node scripts/unified-search.js "关键词" [返回数量]
```

### 搜索模式

#### 快速模式（默认）
返回搜索结果列表，适合快速查找文档位置：
```bash
node scripts/unified-search.js "关键词" 10
```

#### 深度模式
搜索 → 读取相关页面全文 → LLM 综合回答，适合复杂问题：
```bash
node scripts/unified-search.js "关键词" --mode deep
# 或直接调用
node scripts/deep-query.js "问题" 10 3
```

**深度模式参数：**
- 第 1 个参数：问题（必填）
- 第 2 个参数：搜索结果数量（默认 10）
- 第 3 个参数：参考页面数量（默认 3）

**何时用深度模式：**
- 用户问的是"怎么做"需要步骤指导
- 问题涉及多个文档的综合理解
- 需要基于 wiki 内容生成结构化回答

### 搜索结果标注

| 标注 | 含义 |
|------|------|
| 🔥 双重验证 | grep + 向量都命中，可信度最高 |
| 📌 精确 | grep 精确匹配标题/内容 |
| 🧠 语义 | 向量语义联想，模糊查询也能找到 |

## 多格式导入

支持 PDF、Word、Excel 文件自动解析为 Markdown。

### 方式一：Docker 容器内使用（自动穿透宿主机）

```bash
bash scripts/parse-file.sh 文件路径
```

脚本内部会用 `nsenter` 穿透到宿主机执行 Python 解析，适用于 OpenClaw 容器环境。

**支持格式：**

| 格式 | 解析方式 |
|------|---------|
| PDF | `fitz`（PyMuPDF），每页转换为 `## 第 N 页` Markdown |
| DOCX / DOC | `python-docx`，标题样式 → `#` / `##`，正文 → 普通段落 |
| XLSX / XLS | `openpyxl`，每工作表转换为 Markdown 表格 |

### 方式二：裸机 / 非 Docker 环境

直接运行以下 Python 命令，无需 `nsenter`：

```bash
# PDF
python3 -c "
import fitz
doc = fitz.open('file.pdf')
for i, page in enumerate(doc):
    text = page.get_text()
    lines = [l.rstrip() for l in text.split('\\n')]
    print(f'## 第 {i+1} 页\\n\\n' + '\\n'.join(l for l in lines if l.strip()))
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
    print(f'## 工作表: {sheet_name}\\n')
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

**依赖安装（非 Docker 环境需要先装）：**
```bash
pip install pymupdf python-docx openpyxl
```

## 入库用法

### 方式 A：快速入库（0 token, 秒级）

适合大量文档快速入库，后续再精加工。

```bash
python3 skills/openclaw-wiki-lancedb/scripts/wiki-quick-ingest.py <源文件.md> [分类]
python3 skills/openclaw-wiki-lancedb/scripts/wiki-quick-ingest.py --batch <目录> [分类]
```

- 自动分类（根据内容关键词推断）
- 自动生成基础 frontmatter（title/category/sources）
- 自动同步向量库
- 多格式文件（PDF/DOCX/XLSX）自动调用 parse-file.sh 转换后再入库

### 方式 B：精加工（有 token 消耗）

对已入库的文档补充 summary、tags、wikilinks、TLDR、citations、Open Questions。

```bash
# 单个文件（输出到 .drafts/）
node skills/openclaw-wiki-lancedb/scripts/wiki-refine.js plugins/five-lessons.md

# 指定分类
node skills/openclaw-wiki-lancedb/scripts/wiki-refine.js --category plugins

# 全库未精炼文件
node skills/openclaw-wiki-lancedb/scripts/wiki-refine.js --unrefined

# 跳过草稿区，直接写入
node skills/openclaw-wiki-lancedb/scripts/wiki-refine.js --direct concepts/agent.md
```

**精加工内容：**
- `summary` — 一句话摘要
- `tags` — 相关标签
- `tldr` — 中文 TLDR（frontmatter 后、正文前）
- `wikilinks` — 内部链接（`[[相关页面]]`）
- `citations` — 来源引用标记 `[^N]` + `## References` 区
- `OPEN_QUESTIONS` — 未解决问题区

### 方式 C：LLM 提炼入库（原始 ingest）

适合需要 AI 理解、提炼、整合的文档。

```bash
node skills/openclaw-wiki-lancedb/scripts/ingest.js [--full]
```

---

## 审核草稿

精加工输出到 `.drafts/` 目录，需人工审核后转正。

```bash
node skills/openclaw-wiki-lancedb/scripts/wiki-review.js
# 菜单: (a)pprove (r)eject (d)iff (e)dit (q)uit
```

**功能：**
- approve → 移动到正式目录
- reject → 记录拒绝原因（注入下次 refine prompt）
- 5 次拒绝自动屏蔽（`--unblock "页面名"` 解除）

---

## 反偏见扫描

全库扫描，LLM 识别反驳观点和数据缺口。

```bash
# dry-run 预览
node skills/openclaw-wiki-lancedb/scripts/wiki-divergence.js --dry-run

# 单页处理
node skills/openclaw-wiki-lancedb/scripts/wiki-divergence.js --page concepts/agent.md
```

---

## Query 分解 + Gap 检测

复杂问题拆成子问题并行搜索，Gap 检测推荐搜索关键词。

```bash
# 简单分解
node skills/openclaw-wiki-lancedb/scripts/wiki-query-decompose.js "比较 OpenClaw 和 Dify"

# 含 Gap 检测（无结果时推荐搜索建议）
node skills/openclaw-wiki-lancedb/scripts/wiki-query-decompose.js "OpenClaw 安装" --search
```

---

## Scaffold 重建

自动重建 wiki 核心元文件。

```bash
# 全量重建
node skills/openclaw-wiki-lancedb/scripts/wiki-scaffold.js

# 仅重建 index.md
node skills/openclaw-wiki-lancedb/scripts/wiki-scaffold.js --index

# dry-run 预览
node skills/openclaw-wiki-lancedb/scripts/wiki-scaffold.js --dry-run
```

---

## 每日日报

解析 log.md 近 24 小时条目，生成 brief.md 日报。

```bash
node skills/openclaw-wiki-lancedb/scripts/wiki-brief.js
# --since 指定时间范围
# --dry-run 预览
```

---

## 审计记录

JSONL 不可变记录，追踪 tokens/cost。

```bash
# 记录操作
node skills/openclaw-wiki-lancedb/scripts/wiki-audit.js record refine "agent-loop.md" 500 0.001

# 最近 20 条
node skills/openclaw-wiki-lancedb/scripts/wiki-audit.js recent 20

# 统计
node skills/openclaw-wiki-lancedb/scripts/wiki-audit.js stats
```

---

## 缓存管理

LLM 响应按 prompt SHA256 缓存。

```bash
node skills/openclaw-wiki-lancedb/scripts/wiki-cache.js stats
node skills/openclaw-wiki-lancedb/scripts/wiki-cache.js clear
```

---

## Hook 系统

事件驱动钩子，可扩展自定义逻辑。

```bash
# 列出钩子
node skills/openclaw-wiki-lancedb/scripts/wiki-hooks.js list

# 注册
node skills/openclaw-wiki-lancedb/scripts/wiki-hooks.js add on-ingest ./hooks/post-ingest.sh

# 触发
node skills/openclaw-wiki-lancedb/scripts/wiki-hooks.js fire on-ingest
```

---

## Cost Guard

日限额门控，超限自动拦截。

```bash
# 查看今日消耗
node skills/openclaw-wiki-lancedb/scripts/wiki-cost-guard.js status

# 设置日限额 50000 tokens，警告 80%
node skills/openclaw-wiki-lancedb/scripts/wiki-cost-guard.js set 50000 0.8
```

---

## 文件监控

监控 raw/ 目录，新文件自动入库。

```bash
# 启动监控（默认 raw/ 目录）
node skills/openclaw-wiki-lancedb/scripts/wiki-watch.js

# 监控指定目录 + 自动精加工 + 5 秒防抖
node skills/openclaw-wiki-lancedb/scripts/wiki-watch.js /path/to/watch --auto-refine --debounce 5

# 启动时批量处理现有文件
node skills/openclaw-wiki-lancedb/scripts/wiki-watch.js --batch

# 预览模式（不执行）
node skills/openclaw-wiki-lancedb/scripts/wiki-watch.js --dry-run
```

**功能：**
- 监控 `.md` / `.pdf` / `.docx` / `.xlsx` 文件
- 自动调用 `quick-ingest.py` 入库
- `--auto-refine` 入库后自动精加工（需 LiteLLM 可用）
- `--debounce N` 防抖（默认 3 秒，避免处理半写文件）
- 500ms 文件稳定检测（大小不再变化才处理）

---

## 一键流水线

ingest → refine → lint → review 四步流水线。

```bash
# 全量流水线（批量入库 + 精加工）
bash skills/openclaw-wiki-lancedb/scripts/wiki-run.sh --batch --auto-refine

# 入库 + 精加工 + 审核草稿（交互式）
bash skills/openclaw-wiki-lancedb/scripts/wiki-run.sh --batch --auto-refine --review

# 仅精加工 + 审核（不批量入库）
bash skills/openclaw-wiki-lancedb/scripts/wiki-run.sh --auto-refine --review

# 预览模式（不执行）
bash skills/openclaw-wiki-lancedb/scripts/wiki-run.sh --dry-run
```

**步骤：**
1. 批量入库 raw/ 下所有文件（`--batch`）
2. 精加工未精炼文件（`--auto-refine`）
3. 健康检查（lint.js，始终执行）
4. 审核草稿（`--review`）

---

## 自维护

修断链 + 建 stub + 检测孤儿页。

```bash
# 修复所有问题（断链 + stub + 孤儿页检测）
node skills/openclaw-wiki-lancedb/scripts/wiki-maintain.js --fix

# 仅修复断链（通过 alias 映射规范化 wikilinks）
node skills/openclaw-wiki-lancedb/scripts/wiki-maintain.js --fix-links

# 仅为缺失目标创建 stub 页面
node skills/openclaw-wiki-lancedb/scripts/wiki-maintain.js --create-stubs

# 预览模式（不执行）
node skills/openclaw-wiki-lancedb/scripts/wiki-maintain.js --dry-run
```

**功能：**
- 构建 alias 映射（从 frontmatter aliases + 标题变体）
- `[[Alias]]` → `[[Canonical|Alias]]` 规范化
- 为缺失的 wikilink 目标创建 stub 页面（带引用列表）
- 检测孤儿页（无入链的页面）
- 失败自动回退（不破坏现有内容）

---

## Git 安全网

每次 wiki 操作后自动 git commit，支持 undo 回退。

```bash
# 提交当前变更（自动 git add -A + commit）
node skills/openclaw-wiki-lancedb/scripts/wiki-git.js commit "操作描述"

# 回退最后一次自动提交（只回退 auto: 前缀的提交）
node skills/openclaw-wiki-lancedb/scripts/wiki-git.js undo

# 查看自动提交历史（只显示 auto: 前缀的）
node skills/openclaw-wiki-lancedb/scripts/wiki-git.js log

# 查看未提交的变更
de skills/openclaw-wiki-lancedb/scripts/wiki-git.js status
```

**功能：**
- 只提交 `auto:` 前缀的自动变更（不干扰手动提交）
- `undo` 用 `git revert` 安全回退，不破坏历史
- `log` 过滤 `auto:` 前缀，只显示自动提交记录
- 无变更时自动跳过（不产生空提交）

---

## 概念别名归一化

- 默认返回 10 条结果
- 搜索结果展示路径+标题+匹配片段
- 完整内容需用 `cat` 查看具体文件

## 数据源自动同步（P4）

### 网页同步（sync-web.py）

抓取指定 URL 列表的内容，转 markdown 后入库：

```bash
# 1. 创建 URL 列表文件
cat > urls.txt << 'EOF'
https://docs.openclaw.ai/getting-started
https://example.com/blog/openclaw-tips
EOF

# 2. 同步入库
python3 scripts/sync-web.py --urls urls.txt --category web
```

**功能：**
- 自动抓取网页 HTML，转 Markdown
- 支持 `html2text` 解析（安装：`pip install html2text`）
- 去重：对比 content hash，未变更的跳过
- 自动写 `sourceType: web` 到 manifest

### 本地目录同步（sync-local.py）

监控本地目录，自动将新增/变更的文件入库：

```bash
# 一次性同步
python3 scripts/sync-local.py --watch /path/to/docs --once

# 持续监控（每 5 分钟检查一次）
python3 scripts/sync-local.py --watch /path/to/docs --interval 300

# 自动推断分类
python3 scripts/sync-local.py --watch /path/to/docs --category auto

# 强制重新处理所有文件
python3 scripts/sync-local.py --watch /path/to/docs --once --force
```

**支持的格式：** `.md` `.txt` `.pdf` `.docx` `.xlsx`

**自动分类规则：**
- 根据目录名推断（plugins/channels/skills/...）
- 根据内容关键词推断
- 无法推断时归入 `references`

### 定时同步（Cron）

通过 OpenClaw cron 每天自动同步：

```bash
# 添加每日同步任务
openclaw cron add --name "wiki-sync-local" \
  --schedule "0 2 * * *" \
  --command "python3 /path/to/scripts/sync-local.py --watch /path/to/docs --once"

# 添加网页同步任务（每周）
openclaw cron add --name "wiki-sync-web" \
  --schedule "0 3 * * 0" \
  --command "python3 /path/to/scripts/sync-web.py --urls urls.txt"
```

