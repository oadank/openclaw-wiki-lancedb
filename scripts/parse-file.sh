#!/bin/bash
# parse-file.sh — 解析 PDF/Word/Excel → Markdown
# 自动检测运行环境：容器内直接执行，宿主机用 nsenter+chroot 穿透

FILE="$1"

# 解析文件路径（去掉 /host 前缀以支持容器内传入的宿主机路径）
if [[ "$FILE" == /host/* ]]; then
  REAL_FILE="${FILE#/host}"
else
  REAL_FILE="$FILE"
fi

# 判断是否在容器内（/host 挂载时可用）
is_in_container() {
  [[ -d /host ]] && nsenter -t 1 -m -u -i -n -p -- true 2>/dev/null
}

# 在容器内直接执行 Python（不需要 nsenter）
run_python() {
  python3 -c "$1"
}

EXT=$(echo "$REAL_FILE" | sed 's/.*\.//')

case "$EXT" in
  pdf)
    run_python "
import fitz
doc = fitz.open('$REAL_FILE')
pages = []
for i, page in enumerate(doc):
    text = page.get_text()
    lines = [l.rstrip() for l in text.split('\n')]
    text = '\n'.join(l for l in lines if l.strip())
    pages.append(f'## 第 {i+1} 页\n\n{text}')
doc.close()
print('\n\n'.join(pages))
"
    ;;
  docx|doc)
    run_python "
from docx import Document
doc = Document('$REAL_FILE')
parts = []
for para in doc.paragraphs:
    style = para.style.name.lower() if para.style.name else ''
    text = para.text.strip()
    if not text: continue
    if 'heading' in style and '1' in style: parts.append(f'# {text}')
    elif 'heading' in style and '2' in style: parts.append(f'## {text}')
    else: parts.append(text)
print('\n\n'.join(parts))
"
    ;;
  xlsx|xls)
    run_python "
from openpyxl import load_workbook
wb = load_workbook('$REAL_FILE', data_only=True)
parts = []
for sheet_name in wb.sheetnames:
    ws = wb[sheet_name]
    parts.append(f'## 工作表: {sheet_name}\n')
    rows = list(ws.iter_rows(values_only=True))
    if not rows: continue
    headers = [str(c) if c is not None else '' for c in rows[0]]
    parts.append('| ' + ' | '.join(headers) + ' |')
    parts.append('| ' + ' | '.join(['---'] * len(headers)) + ' |')
    for row in rows[1:]:
        cells = [str(c) if c is not None else '' for c in row]
        parts.append('| ' + ' | '.join(cells) + ' |')
wb.close()
print('\n\n'.join(parts))
"
    ;;
  *)
    cat "$REAL_FILE"
    ;;
esac
