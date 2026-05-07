"""parsers/docx_parser.py — Word 文档解析（python-docx）"""

def parse_docx(filepath):
    """将 .docx 解析为 Markdown 文本"""
    from docx import Document
    doc = Document(filepath)
    parts = []
    for para in doc.paragraphs:
        style = para.style.name.lower() if para.style.name else ''
        text = para.text.strip()
        if not text:
            continue
        if 'heading' in style and '1' in style:
            parts.append(f'# {text}')
        elif 'heading' in style and '2' in style:
            parts.append(f'## {text}')
        elif 'heading' in style and '3' in style:
            parts.append(f'### {text}')
        else:
            parts.append(text)
    return '\n\n'.join(parts)
