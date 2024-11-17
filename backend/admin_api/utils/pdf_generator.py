from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER
from io import BytesIO
from datetime import datetime


class PDFGenerator:
    def __init__(self, data_type):
        self.data_type = data_type
        self.styles = getSampleStyleSheet()
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
            alignment=TA_CENTER
        )

    def generatepdf(self, data):
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(letter),
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )

        # Build the PDF content
        elements = []

        # Add title
        title = f"{self.data_type.title()} Report - {datetime.now().strftime('%Y-%m-%d')}"
        elements.append(Paragraph(title, self.title_style))
        elements.append(Spacer(1, 20))

        # Create table
        if data:
            table_data = [list(data[0].keys())] # Headers
            for item in data:
                table_data.append([str(value) for value in item.values()])
            
            # Create the table with appropraite styling
            table = Table(table_data, repeatRows=1)
            self.style_table(table, len(table_data), len(table_data[0]))
            elements.append(table)
        
        # Build the PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer
    
    
    def _style_table(self, table, rows, cols):
        style = [
            # Basic table styling
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            # Alternate row coloring
            *[('BACKGROUND', (0, i), (-1, i), colors.lightgrey)
              for i in range(1, rows) if i % 2 == 0]
        ]
        table.setStyle(TableStyle(style))
