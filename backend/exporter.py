import os
import pandas as pd
from datetime import datetime
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet

class Exporter:
    def __init__(self, db_manager):
        self.db_manager = db_manager
        os.makedirs("exports", exist_ok=True)

    def to_csv(self, sql: str, filename: str) -> str:
        if not filename.endswith(".csv"):
            filename += ".csv"
        
        res = self.db_manager.execute_query(sql)
        if isinstance(res, list) and res:
            df = pd.DataFrame(res)
            path = os.path.join("exports", filename)
            df.to_csv(path, index=False)
            return path
        raise Exception("No data found or query failed")

    def to_pdf(self, sql: str, title: str, filename: str) -> str:
        if not filename.endswith(".pdf"):
            filename += ".pdf"
            
        res = self.db_manager.execute_query(sql)
        if not isinstance(res, list) or not res:
            raise Exception("No data found or query failed")
        
        df = pd.DataFrame(res)
        path = os.path.join("exports", filename)
        
        # Use landscape if many columns
        pagesize = landscape(letter) if len(df.columns) > 6 else letter
        doc = SimpleDocTemplate(path, pagesize=pagesize)
        elements = []
        styles = getSampleStyleSheet()
        
        # Header
        elements.append(Paragraph(title, styles['Title']))
        elements.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
        elements.append(Paragraph(f"SQL: {sql[:200]}...", styles['Italic']))
        elements.append(Spacer(1, 12))
        
        # Prepare data for reportlab table (limit to first 100 rows for PDF safety)
        table_data = [df.columns.tolist()]
        for _, row in df.head(100).iterrows():
            table_data.append([str(item) for item in row.values])
            
        # Create Table
        t = Table(table_data)
        
        # Style (matching app theme colors roughly)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1a1a2e")), # Deep navy card color
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#f1f5f9")), # Slate-100
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
        ]))
        
        elements.append(t)
        
        if len(df) > 100:
            elements.append(Spacer(1, 12))
            elements.append(Paragraph(f"... and {len(df) - 100} more rows (Exported first 100 to PDF)", styles['Italic']))
            
        doc.build(elements)
        return path
