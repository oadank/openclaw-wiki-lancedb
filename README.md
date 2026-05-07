# OpenClaw Wiki - 本地知识库

基于 LanceDB + BGE 向量嵌入的 OpenClaw 知识库，支持混合搜索（向量 + 精确匹配双重验证）。

---

## 📦 仓库信息

| 项目 | 值 |
|------|-----|
| **GitHub** | https://github.com/oadank/openclaw-wiki-lancedb |
| **来源** | OpenClaw 官方文档 https://github.com/openclaw/openclaw |
| **文档数** | 487 页 |
| **向量维度** | 512（BGE-Small-ZH-v1.5） |
| **大小** | ~63MB |

---

## 🤖 给 AI 的话（Agent 请读这里）

> 你是一个 AI 助手，阅读本项目后，你应该能够独立完成：搜索知识库、导入新文档、精加工已有页面、审核草稿、重建向量索引、删除页面、生成日报、重建 Scaffold。
>

---

## 目录结构

```
openclaw-wiki-lancedb/
├── .lancedb/              # LanceDB 向量数据库
│   ├── vector_db/         # 实际数据存储
│   ├── wiki-vector-search.js
│   └── wiki-delete-vector.js
├── .manifest.json         # 索引入库清单（记录来源与 page 映射）
├── SKILL.md               # Wiki 技能定义
├── index.md               # 全量索引页（人类可读）
├── scripts/               # 工具脚本
│   ├── unified-search.js  # 统一搜索入口
│   ├── ingest.js          # 导入文档
│   ├── wiki-refine.js     # 精加工
│   ├── wiki-audit.js      # 审核
│   └── ...
├── plugins/               # OpenClaw 插件文档
├── gateway/               # Gateway 配置文档
├── concepts/              # 核心概念
├── channels/              # 通道文档
├── cli/                   # CLI 命令文档
├── litellm-*/             # LiteLLM 相关文档（24 个模块）
└── ...                    # 其他分类目录
```

---

## 快速搜索

```bash
# 统一搜索（推荐）
node scripts/unified-search.js "关键词"

# 纯向量搜索
node .lancedb/wiki-vector-search.js "关键词"

# grep 精确匹配
grep -r "关键词" --include="*.md" .
```

---

## 导入新文档

```bash
# 单文件导入
node scripts/ingest.js path/to/document.md

# 批量导入（目录）
node scripts/ingest.js path/to/docs/

# 从 GitHub 远程导入
node scripts/ingest.js --remote https://github.com/openclaw/openclaw/blob/main/docs/some-doc.md
```

---

## 索引维护

```bash
# 重建索引（慎用）
node scripts/wiki-maintain.js --rebuild

# 清理已删除页面的向量
node .lancedb/wiki-delete-vector.js --clean

# 检查索引完整性
node scripts/wiki-audit.js --check
```

---

## 来源映射（.manifest.json）

`.manifest.json` 记录了每个文档的来源 URL 与生成的 page 文件映射：

```json
{
  "https://github.com/openclaw/openclaw/blob/main/docs/tools/image-generation.md": {
    "pagesCreated": ["plugins/image-generation.md"],
    "contentHash": "sha256:...",
    "ingestedAt": "2026-04-28T03:33:15Z"
  }
}
```

- **来源 URL**：指向 OpenClaw 官方文档 GitHub 地址
- **pagesCreated**：本地生成的 page 文件路径
- **contentHash**：内容哈希，用于判断是否需要更新

---

## 更新日志

- **2026-05-07**: 清理重复文件，修复 `.manifest.json` 路径映射（本地 → GitHub URL）
- **2026-04-28**: 初始导入 487 页 OpenClaw 文档

---

## 相关链接

- OpenClaw 官方文档: https://docs.openclaw.ai
- GitHub: https://github.com/openclaw/openclaw
- LanceDB: https://lancedb.github.io/lancedb