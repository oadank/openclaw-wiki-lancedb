"""parsers/__init__.py — 多格式解析器注册表"""

from .pdf_parser import parse_pdf
from .docx_parser import parse_docx
from .xlsx_parser import parse_xlsx

PARSERS = {
    '.pdf': parse_pdf,
    '.docx': parse_docx,
    '.doc': parse_docx,
    '.xlsx': parse_xlsx,
    '.xls': parse_xlsx,
}

def parse_file(filepath):
    """自动根据后缀选择解析器"""
    import os
    ext = os.path.splitext(filepath)[1].lower()
    if ext not in PARSERS:
        raise ValueError(f'不支持的文件格式: {ext}')
    return PARSERS[ext](filepath)
