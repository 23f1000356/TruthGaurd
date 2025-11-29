"""
Report Export Service
Generates PDF, HTML, and Markdown reports from claim verification results
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
import json
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from io import BytesIO
import base64
from jinja2 import Template
import markdown


class ReportExporter:
    def __init__(self):
        """Initialize report exporter"""
        self.styles = getSampleStyleSheet()
    
    def export_to_pdf(
        self,
        claims: List[Dict[str, Any]],
        logo_path: Optional[str] = None,
        footer_text: Optional[str] = None,
        title: str = "Fact-Check Report"
    ) -> BytesIO:
        """
        Export claims to PDF
        
        Args:
            claims: List of claim verification results
            logo_path: Path to logo image file
            footer_text: Custom footer text
            title: Report title
            
        Returns:
            PDF file as BytesIO
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        story = []
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor='#1e40af',
            spaceAfter=30,
            alignment=TA_CENTER
        )
        story.append(Paragraph(title, title_style))
        story.append(Spacer(1, 0.2*inch))
        
        # Logo
        if logo_path:
            try:
                logo = Image(logo_path, width=2*inch, height=0.5*inch)
                story.append(logo)
                story.append(Spacer(1, 0.2*inch))
            except:
                pass  # Skip logo if can't load
        
        # Metadata
        meta_style = ParagraphStyle(
            'Meta',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor='#666666'
        )
        story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", meta_style))
        story.append(Paragraph(f"Total Claims: {len(claims)}", meta_style))
        story.append(Spacer(1, 0.3*inch))
        
        # Claims
        for idx, claim in enumerate(claims, 1):
            # Claim header
            claim_header = ParagraphStyle(
                'ClaimHeader',
                parent=self.styles['Heading2'],
                fontSize=14,
                textColor='#1e40af',
                spaceAfter=10
            )
            story.append(Paragraph(f"Claim {idx}: {claim.get('text', claim.get('claim', 'Unknown'))}", claim_header))
            
            # Verdict
            verdict = claim.get('verdict', 'unverified')
            verdict_color = {
                'true': '#10b981',
                'false': '#ef4444',
                'misleading': '#f59e0b',
                'unverified': '#6b7280'
            }.get(verdict, '#6b7280')
            
            verdict_style = ParagraphStyle(
                'Verdict',
                parent=self.styles['Normal'],
                fontSize=12,
                textColor=verdict_color,
                fontName='Helvetica-Bold'
            )
            story.append(Paragraph(f"Verdict: {verdict.upper()}", verdict_style))
            
            # Confidence
            confidence = claim.get('confidence', 0.0)
            story.append(Paragraph(f"Confidence: {confidence:.0%}", self.styles['Normal']))
            
            # Explanation
            explanation = claim.get('explanation', 'No explanation provided.')
            story.append(Spacer(1, 0.1*inch))
            story.append(Paragraph("<b>Explanation:</b>", self.styles['Normal']))
            story.append(Paragraph(explanation, self.styles['Normal']))
            
            # Citations
            citations = claim.get('citations', [])
            if citations:
                story.append(Spacer(1, 0.1*inch))
                story.append(Paragraph("<b>Citations:</b>", self.styles['Normal']))
                for citation in citations:
                    story.append(Paragraph(f"• {citation}", self.styles['Normal']))
            
            story.append(Spacer(1, 0.2*inch))
            story.append(PageBreak())
        
        # Footer
        if footer_text:
            story.append(Spacer(1, 0.5*inch))
            footer_style = ParagraphStyle(
                'Footer',
                parent=self.styles['Normal'],
                fontSize=9,
                textColor='#999999',
                alignment=TA_CENTER
            )
            story.append(Paragraph(footer_text, footer_style))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer
    
    def export_to_html(
        self,
        claims: List[Dict[str, Any]],
        logo_path: Optional[str] = None,
        footer_text: Optional[str] = None,
        title: str = "Fact-Check Report"
    ) -> str:
        """
        Export claims to HTML
        
        Args:
            claims: List of claim verification results
            logo_path: Path to logo image (converted to base64)
            footer_text: Custom footer text
            title: Report title
            
        Returns:
            HTML string
        """
        logo_base64 = None
        if logo_path:
            try:
                with open(logo_path, 'rb') as f:
                    logo_data = f.read()
                    logo_base64 = base64.b64encode(logo_data).decode('utf-8')
                    logo_ext = logo_path.split('.')[-1]
                    logo_base64 = f"data:image/{logo_ext};base64,{logo_base64}"
            except:
                pass
        
        html_template = Template("""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{ title }}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { max-width: 200px; margin: 20px 0; }
        .meta { color: #666; font-size: 12px; margin-bottom: 30px; }
        .claim { margin-bottom: 40px; padding: 20px; border-left: 4px solid #1e40af; background: #f9fafb; }
        .claim-header { font-size: 18px; font-weight: bold; color: #1e40af; margin-bottom: 10px; }
        .verdict { font-weight: bold; margin: 10px 0; }
        .verdict.true { color: #10b981; }
        .verdict.false { color: #ef4444; }
        .verdict.misleading { color: #f59e0b; }
        .verdict.unverified { color: #6b7280; }
        .explanation { margin: 15px 0; }
        .citations { margin-top: 15px; }
        .citations ul { list-style-type: none; padding-left: 0; }
        .citations li { margin: 5px 0; }
        .footer { margin-top: 50px; text-align: center; color: #999; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ title }}</h1>
        {% if logo_base64 %}
        <img src="{{ logo_base64 }}" alt="Logo" class="logo">
        {% endif %}
        <div class="meta">
            Generated: {{ generated_date }}<br>
            Total Claims: {{ claim_count }}
        </div>
    </div>
    
    {% for claim in claims %}
    <div class="claim">
        <div class="claim-header">Claim {{ loop.index }}: {{ claim.text or claim.claim }}</div>
        <div class="verdict {{ claim.verdict }}">Verdict: {{ claim.verdict.upper() }}</div>
        <div>Confidence: {{ "%.0f"|format(claim.confidence * 100) }}%</div>
        <div class="explanation">
            <strong>Explanation:</strong><br>
            {{ claim.explanation or 'No explanation provided.' }}
        </div>
        {% if claim.citations %}
        <div class="citations">
            <strong>Citations:</strong>
            <ul>
                {% for citation in claim.citations %}
                <li>• {{ citation }}</li>
                {% endfor %}
            </ul>
        </div>
        {% endif %}
    </div>
    {% endfor %}
    
    {% if footer_text %}
    <div class="footer">{{ footer_text }}</div>
    {% endif %}
</body>
</html>
        """)
        
        return html_template.render(
            title=title,
            logo_base64=logo_base64,
            generated_date=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            claim_count=len(claims),
            claims=claims,
            footer_text=footer_text or ""
        )
    
    def export_to_markdown(
        self,
        claims: List[Dict[str, Any]],
        footer_text: Optional[str] = None,
        title: str = "Fact-Check Report"
    ) -> str:
        """
        Export claims to Markdown
        
        Args:
            claims: List of claim verification results
            footer_text: Custom footer text
            title: Report title
            
        Returns:
            Markdown string
        """
        md = f"# {title}\n\n"
        md += f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        md += f"**Total Claims:** {len(claims)}\n\n"
        md += "---\n\n"
        
        for idx, claim in enumerate(claims, 1):
            claim_text = claim.get('text', claim.get('claim', 'Unknown'))
            verdict = claim.get('verdict', 'unverified')
            confidence = claim.get('confidence', 0.0)
            explanation = claim.get('explanation', 'No explanation provided.')
            citations = claim.get('citations', [])
            
            md += f"## Claim {idx}: {claim_text}\n\n"
            md += f"**Verdict:** `{verdict.upper()}`\n\n"
            md += f"**Confidence:** {confidence:.0%}\n\n"
            md += f"**Explanation:**\n\n{explanation}\n\n"
            
            if citations:
                md += "**Citations:**\n\n"
                for citation in citations:
                    md += f"- {citation}\n"
                md += "\n"
            
            md += "---\n\n"
        
        if footer_text:
            md += f"\n---\n\n*{footer_text}*\n"
        
        return md

