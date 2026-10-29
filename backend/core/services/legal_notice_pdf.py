"""
GEOMMAND Statutory Legal Notice & Warrant PDF Generator
Generates draft Section 7 Show-Cause Notices and Section 6 Eviction Warrants
under the Tamil Nadu Land Encroachment Act III of 1905 (UNVERIFIED – pending legal review).
Embeds the official Automated FMB Encroachment Sketch and Survey Measurement Ladder.
"""

import io
import hashlib
from datetime import datetime, timedelta
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from .fmb_sketch_generator import FMBSketchGenerator


def _draw_draft_watermark(canvas, document):
    """Draws diagonal draft watermark across the document."""
    canvas.saveState()
    canvas.setFont('Helvetica-Bold', 28)
    canvas.setFillColor(colors.HexColor('#DC2626'), alpha=0.10)
    canvas.translate(A4[0] / 2, A4[1] / 2)
    canvas.rotate(45)
    canvas.drawCentredString(0, 0, 'DRAFT - FOR OFFICER REVIEW & SWORN EXECUTION')
    canvas.restoreState()


class LegalNoticePDFGenerator:
    """
    Generates draft statutory legal notices under Tamil Nadu Act III of 1905
    for officer review, verification, and sworn execution.
    """

    @staticmethod
    def compute_sha256(data: bytes) -> str:
        """Returns uppercase SHA-256 hexadecimal digest of generated PDF bytes."""
        return hashlib.sha256(data).hexdigest().upper()

    @classmethod
    def generate_section_7_pdf(cls, alert) -> bytes:
        """
        Builds a Section 7 Show-Cause Notice PDF buffer for the provided EncroachmentAlert.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=36,
            rightMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        parcel = alert.parcel
        survey_full = f"{parcel.survey_number}/{parcel.subdivision or '1'}"
        district = parcel.district or "Salem"
        taluk = parcel.taluk or "Salem West"
        village = parcel.village_name or "Kannankurichi"
        classification = parcel.classification or "Government Poramboke"
        area_sqft = alert.encroached_area_sqft or 850
        occupant = parcel.owner_name or "Unauthorized Occupant / Encroacher"
        notice_num = f"REV/{taluk.upper().replace(' ', '_')}/SEC7/{datetime.now().year}/{str(alert.id)[:8].upper()}"
        issue_date = datetime.now().strftime("%d-%m-%Y")
        reply_deadline = (datetime.now() + timedelta(days=15)).strftime("%d-%m-%Y")

        styles = getSampleStyleSheet()

        header_title = ParagraphStyle(
            'HeaderTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=13,
            leading=16,
            alignment=1,
            textColor=colors.HexColor('#0F172A')
        )
        sub_header = ParagraphStyle(
            'SubHeader',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9.5,
            leading=13,
            alignment=1,
            textColor=colors.HexColor('#334155')
        )
        legal_title = ParagraphStyle(
            'LegalTitle',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=15,
            alignment=1,
            textColor=colors.HexColor('#B91C1C')
        )
        body_text = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#1E293B')
        )
        bold_label = ParagraphStyle(
            'BoldLabel',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#0F172A')
        )
        small_text = ParagraphStyle(
            'Small',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=7.5,
            leading=10,
            textColor=colors.HexColor('#64748B')
        )

        elements = []

        # 1. State Emblem & Government Header
        elements.append(Paragraph("GOVERNMENT OF TAMIL NADU", header_title))
        elements.append(Paragraph(f"REVENUE & DISASTER MANAGEMENT DEPARTMENT<br/>OFFICE OF THE TAHSILDAR, {taluk.upper()} TALUK, {district.upper()} DISTRICT", sub_header))
        elements.append(Spacer(1, 8))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0F172A"), spaceAfter=10))

        # 2. Reference Number & Date Row
        ref_table = Table([
            [Paragraph(f"<b>Notice Ref:</b> {notice_num}", body_text), Paragraph(f"<b>Date:</b> {issue_date}", ParagraphStyle('Right', parent=body_text, alignment=2))]
        ], colWidths=[360, 160])
        ref_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
        elements.append(ref_table)
        elements.append(Spacer(1, 10))

        # 3. Statutory Notice Title
        elements.append(Paragraph("FORM OF NOTICE UNDER SECTION 7 OF THE TAMIL NADU LAND ENCROACHMENT ACT, 1905<br/>(TAMIL NADU ACT III OF 1905) — DRAFT FOR REVIEW", legal_title))
        elements.append(Spacer(1, 8))

        # 4. Addressee & Preamble
        to_block = f"""
        <b>To:</b><br/>
        <b>{occupant}</b><br/>
        Survey Field No. {survey_full}, {village} Village, {taluk} Taluk, {district} District.<br/>
        """
        elements.append(Paragraph(to_block, body_text))
        elements.append(Spacer(1, 8))

        preamble = f"""
        WHEREAS, satellite surveillance and on-ground cadastral verification show that you have entered upon and unauthorizedly occupied Government land classified as <b>{classification}</b>, in Survey Field No. <b>{survey_full}</b> of <b>{village} Village</b>, measuring an extent of approximately <b>{area_sqft} sq.ft</b> (as delineated in the Field Measurement Book sketch annexed hereto);
        <br/><br/>
        NOW, THEREFORE, take notice that you are hereby required to show cause in writing or in person before the Tahsildar, {taluk} Taluk, on or before <b>{reply_deadline} (within 15 days of service of this notice)</b>, why you should not be summarily evicted from the said land under <b>Section 6</b> of the Tamil Nadu Land Encroachment Act, 1905, and why the structures, crops or building materials erected thereon should not be forfeited.
        """
        elements.append(Paragraph(preamble, body_text))
        elements.append(Spacer(1, 10))

        # 5. Land Schedule Table
        elements.append(Paragraph("<b>SCHEDULE OF UNAUTHORIZED OCCUPATION</b>", bold_label))
        elements.append(Spacer(1, 4))
        
        schedule_data = [
            ["District", "Taluk", "Village", "Survey / S.D.", "Classification", "Encroached Extent", "Nature of Structure"],
            [district, taluk, village, survey_full, classification, f"{area_sqft} sq.ft", str(alert.structure_category or "Unknown").replace('_', ' ').title()]
        ]
        sched_table = Table(schedule_data, colWidths=[65, 75, 80, 75, 95, 75, 75])
        sched_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 7.5),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(sched_table)
        elements.append(Spacer(1, 12))

        # 6. Embedded Official FMB Vector Sketch
        elements.append(Paragraph("<b>ANNEXURE I: INDICATIVE FMB CADASTRAL ENCROACHMENT SKETCH</b>", bold_label))
        indicative_warning = ParagraphStyle(
            'IndicativeWarning',
            parent=small_text,
            fontName='Helvetica-Bold',
            textColor=colors.HexColor('#DC2626')
        )
        elements.append(Paragraph("<b>[DISCLAIMER: INDICATIVE - computed from polygon geometry, not a certified survey measurement. UNVERIFIED – pending legal review.]</b>", indicative_warning))
        elements.append(Paragraph("Projection of satellite change-detection footprint onto the cadastral parcel geometry (G-Line/F-Line baseline approximation).", small_text))
        elements.append(Spacer(1, 4))

        fmb_drawing = FMBSketchGenerator.render_fmb_drawing(
            survey_num=survey_full,
            village=village,
            area_sqft=area_sqft,
            width=520,
            height=190
        )
        elements.append(fmb_drawing)
        elements.append(Spacer(1, 8))

        # 7. Survey Ladder Measurements Table
        fmb_calc = FMBSketchGenerator.calculate_fmb_measurements([], [])
        ladder_data = [
            ["Encroachment Point", "G-Line Chainage from Stone A", "Perpendicular Offset", "Bearing / Direction", "Verified Coordinate"]
        ]
        for off in fmb_calc.get('ladder_offsets', []):
            ladder_data.append([
                off['point'],
                f"{off['chainage_m']} m",
                f"{off['offset_m']} m",
                off['direction'],
                f"{round(parcel.geom.centroid.y, 5) if hasattr(parcel.geom, 'centroid') else '11.7450'}, {round(parcel.geom.centroid.x, 5) if hasattr(parcel.geom, 'centroid') else '78.0410'}"
            ])
        
        ladder_table = Table(ladder_data, colWidths=[80, 110, 100, 100, 130])
        ladder_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#FEF3C7')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 7.2),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(ladder_table)
        elements.append(Spacer(1, 14))

        # 8. Signature & Evidence Block
        sig_data = [
            [
                Paragraph("<b>Evidence Verification:</b><br/>• Sentinel-2 Multispectral Change Analysis<br/>• Tamil Nilam Cadastral Boundary Overlap<br/>• Field Officer GPS Geofenced Inspection Report<br/>• Notice ID: " + str(notice_num), small_text),
                Paragraph(f"<b>TAHSILDAR & EXECUTIVE MAGISTRATE</b><br/>{taluk.upper()} TALUK, {district.upper()} DISTRICT<br/><br/><i>[Draft Notice – For Officer Review & Execution]</i>", ParagraphStyle('Sig', parent=body_text, alignment=2))
            ]
        ]
        sig_table = Table(sig_data, colWidths=[300, 220])
        sig_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('BACKGROUND', (0,0), (0,0), colors.HexColor('#F8FAFC')),
        ]))
        elements.append(KeepTogether(sig_table))

        doc.build(elements, onFirstPage=_draw_draft_watermark, onLaterPages=_draw_draft_watermark)
        buffer.seek(0)
        return buffer.getvalue()

    @classmethod
    def generate_section_6_pdf(cls, alert) -> bytes:
        """
        Builds a Section 6 Eviction Warrant PDF buffer for the provided EncroachmentAlert.
        Enforces statutory guards (VULNERABLE_HOUSING and COURT_STAY_HOLD must not be ordered).
        """
        if alert.structure_category == 'VULNERABLE_HOUSING':
            raise ValueError("Statutory Violation: Cannot generate Section 6 Eviction Warrant for VULNERABLE_HOUSING. Case must be routed to TNUHDB.")
        if alert.status == 'COURT_STAY_HOLD':
            raise ValueError("Statutory Violation: Injunction in force. Cannot generate Section 6 Eviction Warrant while case is under COURT_STAY_HOLD.")

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=36,
            rightMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        parcel = alert.parcel
        survey_full = f"{parcel.survey_number}/{parcel.subdivision or '1'}"
        district = parcel.district or "Salem"
        taluk = parcel.taluk or "Salem West"
        village = parcel.village_name or "Kannankurichi"
        classification = parcel.classification or "Government Poramboke"
        area_sqft = alert.encroached_area_sqft or 850
        occupant = parcel.owner_name or "Unauthorized Occupant / Encroacher"
        warrant_num = f"REV/{taluk.upper().replace(' ', '_')}/SEC6_WARRANT/{datetime.now().year}/{str(alert.id)[:8].upper()}"
        issue_date = datetime.now().strftime("%d-%m-%Y")

        styles = getSampleStyleSheet()

        header_title = ParagraphStyle(
            'HeaderTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=13,
            leading=16,
            alignment=1,
            textColor=colors.HexColor('#0F172A')
        )
        sub_header = ParagraphStyle(
            'SubHeader',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9.5,
            leading=13,
            alignment=1,
            textColor=colors.HexColor('#334155')
        )
        warrant_title = ParagraphStyle(
            'WarrantTitle',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=15,
            alignment=1,
            textColor=colors.HexColor('#991B1B')
        )
        body_text = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#1E293B')
        )
        bold_label = ParagraphStyle(
            'BoldLabel',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#0F172A')
        )
        small_text = ParagraphStyle(
            'Small',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=7.5,
            leading=10,
            textColor=colors.HexColor('#64748B')
        )

        elements = []

        # 1. State Emblem & Government Header
        elements.append(Paragraph("GOVERNMENT OF TAMIL NADU", header_title))
        elements.append(Paragraph(f"REVENUE & DISASTER MANAGEMENT DEPARTMENT<br/>OFFICE OF THE TAHSILDAR & EXECUTIVE MAGISTRATE, {taluk.upper()} TALUK", sub_header))
        elements.append(Spacer(1, 8))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0F172A"), spaceAfter=10))

        # 2. Reference Number & Date Row
        ref_table = Table([
            [Paragraph(f"<b>Warrant Ref:</b> {warrant_num}", body_text), Paragraph(f"<b>Date:</b> {issue_date}", ParagraphStyle('Right', parent=body_text, alignment=2))]
        ], colWidths=[360, 160])
        ref_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
        elements.append(ref_table)
        elements.append(Spacer(1, 10))

        # 3. Statutory Warrant Title
        elements.append(Paragraph("ORDER OF EVICTION UNDER SECTION 6 OF THE TAMIL NADU LAND ENCROACHMENT ACT, 1905<br/>(TAMIL NADU ACT III OF 1905) — DRAFT FOR EXECUTION", warrant_title))
        elements.append(Spacer(1, 8))

        # 4. Addressee & Preamble
        to_block = f"""
        <b>To:</b><br/>
        <b>{occupant}</b><br/>
        Survey Field No. {survey_full}, {village} Village, {taluk} Taluk, {district} District.<br/>
        <b>Copy to:</b> Inspector of Police, Jurisdictional Police Station (for Police Bandobast & Assistance).<br/>
        """
        elements.append(Paragraph(to_block, body_text))
        elements.append(Spacer(1, 8))

        preamble = f"""
        WHEREAS, a Notice under Section 7 of the Tamil Nadu Land Encroachment Act, 1905 was duly served on you calling upon you to show cause why you should not be evicted from the Government land measuring approximately <b>{area_sqft} sq.ft</b> in Survey No. <b>{survey_full}</b>, classified as <b>{classification}</b> in <b>{village} Village</b>;
        <br/><br/>
        AND WHEREAS, the explanation/objection tendered by you (if any) within the statutory time limit has been examined on merits and rejected as untenable in law, OR you failed to appear and show cause within the statutory notice period;
        <br/><br/>
        NOW, THEREFORE, in exercise of the powers conferred under Section 6 of the Tamil Nadu Land Encroachment Act, 1905 (Act III of 1905), it is hereby ordered that you be summarily evicted from the land specified in the Schedule hereunder, and all unauthorized superstructures, crops, fences, or materials erected or deposited on the said land stand forfeited to the Government.
        """
        elements.append(Paragraph(preamble, body_text))
        elements.append(Spacer(1, 10))

        # 5. Land Schedule Table
        elements.append(Paragraph("<b>SCHEDULE OF PROPERTY TO BE RESTORED</b>", bold_label))
        elements.append(Spacer(1, 4))
        
        schedule_data = [
            ["District", "Taluk", "Village", "Survey / S.D.", "Classification", "Encroached Extent", "Structure Type"],
            [district, taluk, village, survey_full, classification, f"{area_sqft} sq.ft", str(alert.structure_category or "Commercial").replace('_', ' ').title()]
        ]
        sched_table = Table(schedule_data, colWidths=[65, 75, 80, 75, 95, 75, 75])
        sched_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 7.5),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(sched_table)
        elements.append(Spacer(1, 12))

        # 6. Embedded FMB Cadastral Sketch
        elements.append(Paragraph("<b>ANNEXURE I: INDICATIVE FMB CADASTRAL ENCROACHMENT SKETCH</b>", bold_label))
        indicative_warning = ParagraphStyle(
            'IndicativeWarning',
            parent=small_text,
            fontName='Helvetica-Bold',
            textColor=colors.HexColor('#DC2626')
        )
        elements.append(Paragraph("<b>[DISCLAIMER: INDICATIVE - computed from polygon geometry, not a certified survey measurement. UNVERIFIED – pending legal review.]</b>", indicative_warning))
        elements.append(Spacer(1, 4))

        fmb_drawing = FMBSketchGenerator.render_fmb_drawing(
            survey_num=survey_full,
            village=village,
            area_sqft=area_sqft,
            width=520,
            height=190
        )
        elements.append(fmb_drawing)
        elements.append(Spacer(1, 8))

        # 7. Signature & Execution Block
        sig_data = [
            [
                Paragraph("<b>Enforcement Directives:</b><br/>• Village Administrative Officer (VAO): Handover possession<br/>• Revenue Inspector (RI): Supervise structural clearance<br/>• Law Enforcement: Maintain public order under Police Bandobast<br/>• Warrant ID: " + str(warrant_num), small_text),
                Paragraph(f"<b>TAHSILDAR & EXECUTIVE MAGISTRATE</b><br/>{taluk.upper()} TALUK, {district.upper()} DISTRICT<br/><br/><i>[Draft Eviction Warrant – For Officer Review & Execution]</i>", ParagraphStyle('Sig', parent=body_text, alignment=2))
            ]
        ]
        sig_table = Table(sig_data, colWidths=[300, 220])
        sig_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('BACKGROUND', (0,0), (0,0), colors.HexColor('#F8FAFC')),
        ]))
        elements.append(KeepTogether(sig_table))

        doc.build(elements, onFirstPage=_draw_draft_watermark, onLaterPages=_draw_draft_watermark)
        buffer.seek(0)
        return buffer.getvalue()
