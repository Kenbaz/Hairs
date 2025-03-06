# admin_api/utils/invoice_generator.py

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from io import BytesIO
import logging

logger = logging.getLogger(__name__)


class InvoiceGenerator:
    def __init__(self, order):
        self.order = order
        self.buffer = BytesIO()
        self.styles = getSampleStyleSheet()
        self.doc = SimpleDocTemplate(
            self.buffer,
            pageSize=letter,
            rightMargin=inch/2,
            leftMargin=inch/2,
            topMargin=inch/2,
            bottomMargin=inch/2
        )
    
    def _create_header_style(self):
        header_style = ParagraphStyle(
            'CustomHeader',
            parent=self.styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
            alignment=TA_CENTER
        )
        return header_style
    

    def _create_address_style(self):
        address_style = ParagraphStyle(
            'AddressStyle',
            parent=self.styles['Normal'],
            fontSize=11,
            spaceAfter=20,
        )
        return address_style
    

    def _create_table_style(self):
        return TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ALIGN', (-1, 0), (-1, -1), 'RIGHT'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ])
    

    def generateInvoice(self):
        try:
            # Create document elements list
            elements = []

            # Add company header
            header_style = self._create_header_style()
            elements.append(Paragraph("Miz Viv Hairs", header_style))
            elements.append(Spacer(1, 20))

            # Add invoice information
            elements.append(
                Paragraph(f"Invoice #{self.order.id}", header_style))
            elements.append(Paragraph(f"Date: {self.order.created_at.strftime('%B %d, %Y')}",
                                      self.styles['Normal']))
            elements.append(Spacer(1, 20))

            # Add addresses
            address_style = self._create_address_style()
            elements.append(Paragraph("Bill To:", self.styles['Heading3']))
            elements.append(Paragraph(
                f"{self.order.user.first_name} {self.order.user.last_name}",
                address_style
            ))
            elements.append(Paragraph(
                self.order.user.email,
                address_style
            ))
            if self.order.shipping_address:
                elements.append(Paragraph(
                    self.order.shipping_address,
                    address_style
                ))
            elements.append(Spacer(1, 10))

            # Create items table
            logger.info("Creating items table")
            table_data = [
                ["Item", "Price", "Quantity", "Subtotal"]
            ]

            # Add order items to table
            for item in self.order.items.all():
                logger.debug(f"Processing item: {item.product.name}")
                table_data.append([
                    item.product.name,
                    f"${item.price:.2f}",
                    str(item.quantity),
                    f"${(item.quantity * item.price):.2f}"
                ])

            # Add totals
            table_data.extend([
                ["", "", "Total:", f"${self.order.total_amount:.2f}"]
            ])

            # Create and style the table
            table = Table(table_data, colWidths=[
                          3*inch, 1*inch, 1.25*inch, 1.25*inch])
            table.setStyle(self._create_table_style())
            elements.append(table)

            # Add payment status and notes
            elements.append(Spacer(1, 30))
            elements.append(Paragraph(
                f"Payment Status: {
                    'Paid' if self.order.payment_status else 'Unpaid'}",
                self.styles['Normal']
            ))

            if self.order.tracking_number:
                elements.append(Paragraph(
                    f"Tracking Number: {self.order.tracking_number}",
                    self.styles['Normal']
                ))

            # Build the PDF
            logger.info("Building PDF document")
            self.doc.build(elements)
            pdf = self.buffer.getvalue()
            self.buffer.close()

            logger.info("PDF generation completed successfully")
            return pdf

        except Exception as e:
            logger.error(f"Error generating invoice: {str(e)}", exc_info=True)
            raise Exception(f"Failed to generate invoice: {str(e)}")

