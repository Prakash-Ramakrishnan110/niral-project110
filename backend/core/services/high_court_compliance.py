"""
GEOMMAND Madras High Court Judicial Compliance & ATR Generator
Generates official Affidavits and Action Taken Reports (ATRs) for District Collectors
and Revenue Secretaries responding to High Court PILs / Suo Motu Writs on waterbody protection.
"""

import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

class HighCourtComplianceGenerator:
    """
    Generates high-court compliant Action Taken Reports (ATRs) on waterbody encroachments.
    """

    @classmethod
    def generate_atr_pdf(cls, district="Salem", writ_petition_no=None):
        if not writ_petition_no or not str(writ_petition_no).strip():
            raise ValueError("writ_petition_no is a required parameter with no default and cannot be empty")

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=36,
            rightMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'TitleStyle',
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=15,
            alignment=1,
            textColor=colors.HexColor('#0F172A')
        )
        legal_sub = ParagraphStyle(
            'LegalSub',
            fontName='Helvetica-Bold',
            fontSize=9.5,
            leading=13,
            alignment=1,
            textColor=colors.HexColor('#B91C1C')
        )
        watermark_banner = ParagraphStyle(
            'WatermarkBanner',
            fontName='Helvetica-Bold',
            fontSize=9,
            leading=12,
            alignment=1,
            textColor=colors.HexColor('#DC2626')
        )
        body = ParagraphStyle(
            'BodyStyle',
            fontName='Helvetica',
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor('#1E293B')
        )
        small = ParagraphStyle(
            'Small',
            fontName='Helvetica',
            fontSize=7.5,
            leading=10,
            textColor=colors.HexColor('#64748B')
        )

        elements = []

        # 0. Prominent Draft Watermark Header
        elements.append(Paragraph("<b>[ DRAFT – FOR OFFICER REVIEW AND SWORN EXECUTION ]</b>", watermark_banner))
        elements.append(Spacer(1, 4))

        # 1. High Court Heading
        elements.append(Paragraph("IN THE HIGH COURT OF JUDICATURE AT MADRAS", title_style))
        elements.append(Paragraph("(Special Original Jurisdiction - Waterbody Protection Bench)", ParagraphStyle('Center', fontName='Helvetica-Oblique', fontSize=9, alignment=1)))
        elements.append(Spacer(1, 4))
        elements.append(Paragraph(f"<b>IN THE MATTER OF: {str(writ_petition_no).upper()}</b>", legal_sub))
        elements.append(Spacer(1, 6))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0F172A"), spaceAfter=8))

        # 2. Preamble & Affidavit Identification
        intro_text = f"""
        <b>ACTION TAKEN REPORT (ATR) & AFFIDAVIT FILED BY THE DISTRICT COLLECTOR, {district.upper()} DISTRICT</b><br/>
        IN COMPLIANCE WITH THE DIRECTIONS DATED {datetime.now().strftime('%d-%m-%Y')} OF THE HON'BLE MADRAS HIGH COURT 
        FOR THE RESTORATION AND REMOVAL OF ENCROACHMENTS IN WATERBODIES (ERI / KULAM / ODDAI).
        """
        elements.append(Paragraph(intro_text, body))
        elements.append(Spacer(1, 8))

        # 3. Aggregate Statistical Summary (Strictly Scoped to District)
        total_waterbodies = 0
        total_alerts = 0
        sec7_issued = 0
        sec6_ordered = 0
        restored = 0
        waterbody_alerts = []

        try:
            from ..models import EncroachmentAlert, LandParcel
            total_waterbodies = LandParcel.objects.filter(district__iexact=district, classification='Waterbody').count()
            total_alerts = EncroachmentAlert.objects.filter(parcel__district__iexact=district, parcel__classification='Waterbody').count()
            sec7_issued = EncroachmentAlert.objects.filter(parcel__district__iexact=district, parcel__classification='Waterbody', status='SECTION_7_ISSUED').count()
            sec6_ordered = EncroachmentAlert.objects.filter(parcel__district__iexact=district, parcel__classification='Waterbody', status='SECTION_6_ORDERED').count()
            restored = EncroachmentAlert.objects.filter(parcel__district__iexact=district, parcel__classification='Waterbody', status='RESOLVED').count()
            waterbody_alerts = list(EncroachmentAlert.objects.filter(parcel__district__iexact=district, parcel__classification='Waterbody')[:50])
        except Exception:
            pass

        elements.append(Paragraph(f"<b>I. EXECUTIVE COMPLIANCE METRICS (WATERBODIES SURVEILLANCE - {district.upper()} DISTRICT)</b>", ParagraphStyle('H2', fontName='Helvetica-Bold', fontSize=9, textColor=colors.HexColor('#1D4ED8'))))
        elements.append(Spacer(1, 4))

        stats_data = [
            ["Total Monitored Waterbodies", "Active Detections", "Section 7 Notices Served", "Section 6 Eviction Orders", "Fully Restored & Fenced"],
            [str(total_waterbodies), str(total_alerts), str(sec7_issued), str(sec6_ordered), str(restored)]
        ]
        stats_table = Table(stats_data, colWidths=[110, 95, 110, 105, 100])
        stats_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('BACKGROUND', (0,1), (-1,1), colors.HexColor('#F8FAFC')),
        ]))
        elements.append(stats_table)
        elements.append(Spacer(1, 10))

        # 4. Itemized Waterbody Parcel Action Schedule (Zero fabricated rows)
        elements.append(Paragraph(f"<b>II. ITEMIZED WATERBODY RESTORATION ACTION SCHEDULE ({district.upper()} JURISDICTION)</b>", ParagraphStyle('H2', fontName='Helvetica-Bold', fontSize=9, textColor=colors.HexColor('#1D4ED8'))))
        elements.append(Spacer(1, 4))

        table_data = [
            ["Taluk", "Village", "Survey No", "Waterbody Name", "Encroached Extent", "Action Taken / Status"]
        ]
        if waterbody_alerts:
            for al in waterbody_alerts:
                table_data.append([
                    al.parcel.taluk,
                    al.parcel.village_name or "-",
                    f"{al.parcel.survey_number}/{al.parcel.subdivision or '1'}",
                    al.parcel.owner_name or "Waterbody Poramboke",
                    f"{al.encroached_area_sqft or 0} sq.ft",
                    al.status.replace('_', ' ')
                ])
        else:
            timestamp = datetime.now().strftime('%d-%m-%Y %H:%M:%S')
            table_data.append(["-", "-", "-", f"No waterbody encroachments recorded for {district} as of {timestamp}", "-", "-"])

        item_table = Table(table_data, colWidths=[80, 85, 75, 120, 80, 80])
        item_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 7.5),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        elements.append(item_table)
        elements.append(Spacer(1, 14))

        # 5. Solemn Verification & Affidavit Block
        verif_text = f"""
        <b>SOLEMN VERIFICATION:</b><br/>
        I, District Collector & District Magistrate of {district} District, do hereby verify that the contents of this Action Taken Report are true to my knowledge and backed by satellite temporal records and cadastral survey evidence maintained in the GEOMMAND portal.<br/>
        <b>[NOTICE: THIS IS A DRAFT GENERATED FOR REVIEW AND SWORN ATTESTATION BEFORE THE HON'BLE COURT]</b>
        <br/><br/>
        <b>Verified at {district} on this {datetime.now().strftime('%d day of %B, %Y')}.</b>
        """
        elements.append(Paragraph(verif_text, body))
        elements.append(Spacer(1, 25))

        sig_block = Table([
            [Paragraph("Counsel for the State of Tamil Nadu<br/>High Court, Madras", small), 
             Paragraph(f"<b>DISTRICT COLLECTOR & DISTRICT MAGISTRATE</b><br/>{district.upper()} DISTRICT<br/><i>(Sworn Attestation Pending)</i>", ParagraphStyle('R', parent=body, alignment=2))]
        ], colWidths=[260, 260])
        elements.append(sig_block)

        def draw_draft_watermark(canvas, document):
            canvas.saveState()
            canvas.setFont('Helvetica-Bold', 30)
            canvas.setFillColor(colors.HexColor('#DC2626'), alpha=0.12)
            canvas.translate(A4[0] / 2, A4[1] / 2)
            canvas.rotate(45)
            canvas.drawCentredString(0, 0, 'DRAFT - FOR OFFICER REVIEW & SWORN EXECUTION')
            canvas.restoreState()

        doc.build(elements, onFirstPage=draw_draft_watermark, onLaterPages=draw_draft_watermark)
        buffer.seek(0)
        return buffer.getvalue()
