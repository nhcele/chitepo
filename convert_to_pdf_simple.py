#!/usr/bin/env python3
"""
Convert CHITEPO_ZANU_PF_PITCH.md to PDF using reportlab
"""

import re
import sys
import subprocess
from pathlib import Path

# Try to import reportlab, install if not available
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
    from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT
except ImportError:
    print("reportlab not found. Installing...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "--user", "reportlab"])
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
    from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT

def markdown_to_paragraphs(markdown_text, styles):
    """Convert markdown to reportlab Paragraph objects"""
    paragraphs = []
    lines = markdown_text.split('\n')
    in_list = False
    
    for line in lines:
        line = line.strip()
        
        if not line:
            if in_list:
                paragraphs.append(Spacer(1, 0.1*inch))
                in_list = False
            continue
        
        # Headers
        if line.startswith('### '):
            if in_list:
                in_list = False
            text = line[4:].strip()
            paragraphs.append(Paragraph(text, styles['Heading3']))
            paragraphs.append(Spacer(1, 0.2*inch))
        elif line.startswith('## '):
            if in_list:
                in_list = False
            text = line[3:].strip()
            paragraphs.append(Paragraph(text, styles['Heading2']))
            paragraphs.append(Spacer(1, 0.3*inch))
        elif line.startswith('# '):
            if in_list:
                in_list = False
            text = line[2:].strip()
            paragraphs.append(Paragraph(text, styles['Heading1']))
            paragraphs.append(Spacer(1, 0.3*inch))
        # Horizontal rule
        elif line == '---':
            if in_list:
                in_list = False
            paragraphs.append(Spacer(1, 0.2*inch))
            paragraphs.append(Paragraph('<hr/>', styles['Normal']))
            paragraphs.append(Spacer(1, 0.2*inch))
        # List items
        elif line.startswith('- '):
            if not in_list:
                in_list = True
            text = line[2:].strip()
            # Convert bold
            text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
            paragraphs.append(Paragraph(f'• {text}', styles['Normal']))
        # Regular paragraphs
        else:
            if in_list:
                in_list = False
                paragraphs.append(Spacer(1, 0.1*inch))
            # Convert bold
            text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
            paragraphs.append(Paragraph(text, styles['Normal']))
            paragraphs.append(Spacer(1, 0.15*inch))
    
    return paragraphs

def main():
    # Read markdown file
    md_file = Path('CHITEPO_ZANU_PF_PITCH.md')
    if not md_file.exists():
        print(f"Error: {md_file} not found!")
        return
    
    markdown = md_file.read_text(encoding='utf-8')
    
    # Create PDF
    pdf_file = Path('CHITEPO_ZANU_PF_PITCH.pdf')
    doc = SimpleDocTemplate(str(pdf_file), pagesize=letter,
                            rightMargin=0.75*inch, leftMargin=0.75*inch,
                            topMargin=0.75*inch, bottomMargin=0.75*inch)
    
    # Create styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    styles.add(ParagraphStyle(
        name='Heading1',
        parent=styles['Heading1'],
        fontSize=20,
        textColor='#1a1a1a',
        spaceAfter=12,
        borderWidth=0,
        borderPadding=0
    ))
    
    styles.add(ParagraphStyle(
        name='Heading2',
        parent=styles['Heading2'],
        fontSize=16,
        textColor='#2c2c2c',
        spaceAfter=10
    ))
    
    styles.add(ParagraphStyle(
        name='Heading3',
        parent=styles['Heading3'],
        fontSize=13,
        textColor='#3c3c3c',
        spaceAfter=8
    ))
    
    styles.add(ParagraphStyle(
        name='Normal',
        parent=styles['Normal'],
        fontSize=11,
        leading=16,
        alignment=TA_JUSTIFY,
        spaceAfter=6
    ))
    
    # Convert markdown to paragraphs
    story = markdown_to_paragraphs(markdown, styles)
    
    # Build PDF
    doc.build(story)
    print(f"PDF created successfully: {pdf_file}")

if __name__ == '__main__':
    main()

