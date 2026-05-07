"""parsers/pdf_parser.py — PDF 解析（PyMuPDF）"""

def parse_pdf(filepath):
    """将 PDF 解析为 Markdown 文本"""
    import fitz  # PyMuPDF
    doc = fitz.open(filepath)
    pages = []
    for i, page in enumerate(doc):
        text = page.get_text()
        # 清理空白，保留换行结构
        lines = [l.rstrip() for l in text.split('\n')]
        text = '\n'.join(l for l in lines if l.strip() or l == '')
        pages.append(f'## 第 {i+1} 页\n\n{text}')
    doc.close()
    return '\n\n'.join(pages)
