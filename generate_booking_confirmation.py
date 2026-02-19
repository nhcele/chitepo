#!/usr/bin/env python3
"""
Generate a comprehensive booking confirmation document for Willow Lodge
"""

from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.style import WD_STYLE_TYPE
from datetime import datetime
import os
from PIL import Image, ImageDraw, ImageFont

def create_logo_image():
    """Create the Willow Lodge logo as an image file"""
    
    # Create a black background image
    width, height = 1200, 350
    img = Image.new('RGB', (width, height), color='black')
    draw = ImageDraw.Draw(img)
    
    # Draw the leaf-like shapes based on description
    leaf_color = (255, 255, 255)  # White
    
    # Create more leaf-like shapes (elongated ovals)
    # First vertical leaf (left) - elongated
    draw.ellipse([80, 120, 180, 280], outline=leaf_color, width=4, fill=None)
    # Vertical line through center (vein)
    draw.line([130, 120, 130, 280], fill=leaf_color, width=2)
    
    # Second vertical leaf (middle, slightly overlapping) - elongated
    draw.ellipse([160, 120, 260, 280], outline=leaf_color, width=4, fill=None)
    draw.line([210, 120, 210, 280], fill=leaf_color, width=2)
    
    # Third horizontal leaf (top left, smaller) - horizontal orientation
    draw.ellipse([100, 80, 200, 160], outline=leaf_color, width=4, fill=None)
    draw.line([150, 80, 150, 160], fill=leaf_color, width=2)
    
    # Add text "WILLOW LODGE" - we'll use a simple text representation
    # Try to use a default font, or create text manually
    try:
        # Try to use a bold font if available
        font_large = ImageFont.truetype("arial.ttf", 60)
        font_small = ImageFont.truetype("arial.ttf", 24)
    except:
        # Fallback to default font
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # Draw "WILLOW LODGE" text
    text = "WILLOW LODGE"
    try:
        bbox = draw.textbbox((0, 0), text, font=font_large)
        text_width = bbox[2] - bbox[0]
    except:
        text_width = len(text) * 30  # Approximate width
    text_x = (width - text_width) // 2 + 100  # Offset for logo
    text_y = height // 2 - 30
    draw.text((text_x, text_y), text, fill=leaf_color, font=font_large)
    
    # Draw tagline "home away from home"
    tagline = "home away from home"
    try:
        bbox_tag = draw.textbbox((0, 0), tagline, font=font_small)
        tag_width = bbox_tag[2] - bbox_tag[0]
    except:
        tag_width = len(tagline) * 12  # Approximate width
    tag_x = (width - tag_width) // 2 + 100
    tag_y = text_y + 70
    draw.text((tag_x, tag_y), tagline, fill=leaf_color, font=font_small)
    
    # Save the logo
    logo_file = "willow_lodge_logo.png"
    img.save(logo_file)
    return logo_file

def create_booking_confirmation():
    """Create a comprehensive booking confirmation document"""
    
    # Create logo first
    logo_file = create_logo_image()
    
    # Create document
    doc = Document()
    
    # Set margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.5)
        section.bottom_margin = Inches(0.5)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)
    
    # Add logo
    if os.path.exists(logo_file):
        header_para = doc.add_paragraph()
        header_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = header_para.add_run()
        run.add_picture(logo_file, width=Inches(5))
    else:
        # Fallback to text if logo creation failed
        header_para = doc.add_paragraph()
        header_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        logo_run = header_para.add_run("WILLOW LODGE")
        logo_run.font.size = Pt(32)
        logo_run.font.bold = True
        logo_run.font.color.rgb = RGBColor(0, 0, 0)
        
        tagline_para = doc.add_paragraph()
        tagline_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        tagline_run = tagline_para.add_run("home away from home")
        tagline_run.font.size = Pt(12)
        tagline_run.font.italic = True
        tagline_run.font.color.rgb = RGBColor(64, 64, 64)
    
    # Add spacing
    doc.add_paragraph()
    
    # Title
    title_para = doc.add_paragraph()
    title_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_run = title_para.add_run("BOOKING CONFIRMATION")
    title_run.font.size = Pt(24)
    title_run.font.bold = True
    title_run.font.color.rgb = RGBColor(0, 0, 0)
    
    doc.add_paragraph()
    doc.add_paragraph()
    
    # Confirmation Number
    conf_num_para = doc.add_paragraph()
    conf_num_para.add_run("Confirmation Number: ").bold = True
    conf_num_para.add_run(f"WL-{datetime.now().strftime('%Y%m%d')}-001")
    
    doc.add_paragraph()
    
    # Guest Information Section
    guest_heading = doc.add_paragraph()
    guest_heading.add_run("GUEST INFORMATION").bold = True
    guest_heading.add_run().font.size = Pt(14)
    
    doc.add_paragraph("Guest Name: Rev and Mrs Gondongwe")
    doc.add_paragraph()
    
    # Booking Details Section
    booking_heading = doc.add_paragraph()
    booking_heading.add_run("BOOKING DETAILS").bold = True
    booking_heading.add_run().font.size = Pt(14)
    
    # Calculate duration and pricing
    from datetime import date
    check_in = date(2025, 12, 23)
    check_out = date(2026, 1, 12)
    duration = (check_out - check_in).days
    price_per_night = 120
    subtotal = duration * price_per_night
    tax_rate = 0.15  # 15% tax (adjust as needed)
    tax_amount = subtotal * tax_rate
    total_amount = subtotal + tax_amount
    
    # Create booking details table
    table = doc.add_table(rows=7, cols=2)
    table.style = 'Light Grid Accent 1'
    
    # Set column widths
    for row in table.rows:
        row.cells[0].width = Inches(2.5)
        row.cells[1].width = Inches(3.5)
    
    # Populate table
    rows_data = [
        ("Check-in Date:", "Monday, December 23, 2025"),
        ("Check-in Time:", "2:00 PM"),
        ("Check-out Date:", "Monday, January 12, 2026"),
        ("Check-out Time:", "11:00 AM"),
        ("Duration of Stay:", f"{duration} nights"),
        ("Price per Night:", f"${price_per_night:.2f}"),
        ("Total Nights:", f"{duration} nights")
    ]
    
    for i, (label, value) in enumerate(rows_data):
        table.rows[i].cells[0].paragraphs[0].add_run(label).bold = True
        table.rows[i].cells[1].paragraphs[0].add_run(value)
        # Set font size
        for cell in table.rows[i].cells:
            for paragraph in cell.paragraphs:
                for run in paragraph.runs:
                    run.font.size = Pt(11)
    
    doc.add_paragraph()
    
    # Accommodation Details
    acc_heading = doc.add_paragraph()
    acc_heading.add_run("ACCOMMODATION DETAILS").bold = True
    acc_heading.add_run().font.size = Pt(14)
    
    doc.add_paragraph("Room Type: To be confirmed")
    doc.add_paragraph("Number of Guests: 2")
    doc.add_paragraph()
    
    # Payment Information
    payment_heading = doc.add_paragraph()
    payment_heading.add_run("PAYMENT INFORMATION").bold = True
    payment_heading.add_run().font.size = Pt(14)
    
    # Create payment details table
    payment_table = doc.add_table(rows=5, cols=2)
    payment_table.style = 'Light Grid Accent 1'
    
    # Set column widths
    for row in payment_table.rows:
        row.cells[0].width = Inches(2.5)
        row.cells[1].width = Inches(3.5)
    
    # Populate payment table
    payment_data = [
        ("Subtotal:", f"${subtotal:,.2f}"),
        ("Tax (15%):", f"${tax_amount:,.2f}"),
        ("Total Amount:", f"${total_amount:,.2f}"),
        ("Payment Status:", "Confirmed"),
        ("Deposit:", "Paid"),
    ]
    
    for i, (label, value) in enumerate(payment_data):
        payment_table.rows[i].cells[0].paragraphs[0].add_run(label).bold = True
        payment_table.rows[i].cells[1].paragraphs[0].add_run(value)
        # Make total amount bold
        if i == 2:  # Total Amount row
            payment_table.rows[i].cells[1].paragraphs[0].runs[0].bold = True
            payment_table.rows[i].cells[1].paragraphs[0].runs[0].font.size = Pt(12)
        # Set font size
        for cell in payment_table.rows[i].cells:
            for paragraph in cell.paragraphs:
                for run in paragraph.runs:
                    if run.bold is None or not run.bold:
                        run.font.size = Pt(11)
    
    doc.add_paragraph()
    doc.add_paragraph("Balance Due: To be settled upon check-in")
    doc.add_paragraph()
    
    # Important Information
    important_heading = doc.add_paragraph()
    important_heading.add_run("IMPORTANT INFORMATION").bold = True
    important_heading.add_run().font.size = Pt(14)
    
    important_points = [
        "Please present a valid form of identification upon check-in.",
        "Check-in is available from 2:00 PM. Early check-in may be available upon request and subject to availability.",
        "Check-out is by 11:00 AM. Late check-out may be arranged for an additional fee.",
        "Cancellation Policy: Free cancellation up to 48 hours before check-in. Cancellations made within 48 hours will incur a one-night charge.",
        "Special requests and preferences should be communicated at least 7 days prior to arrival.",
        "Wi-Fi is complimentary throughout the property.",
        "Parking is available on-site at no additional charge.",
        "Breakfast is included in your stay.",
        "We are committed to providing a safe and comfortable environment. Please inform us of any special requirements or accessibility needs.",
    ]
    
    for point in important_points:
        para = doc.add_paragraph(point, style='List Bullet')
    
    doc.add_paragraph()
    
    # Contact Information
    contact_heading = doc.add_paragraph()
    contact_heading.add_run("CONTACT INFORMATION").bold = True
    contact_heading.add_run().font.size = Pt(14)
    
    doc.add_paragraph("Willow Lodge")
    doc.add_paragraph("For reservations and inquiries:")
    doc.add_paragraph("Email: reservations@willowlodge.com")
    doc.add_paragraph("Phone: +1 (555) 123-4567")
    doc.add_paragraph("Website: www.willowlodge.com")
    doc.add_paragraph()
    
    # Footer
    footer_para = doc.add_paragraph()
    footer_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer_run = footer_para.add_run("We look forward to welcoming you to Willow Lodge!")
    footer_run.font.size = Pt(12)
    footer_run.italic = True
    footer_run.font.color.rgb = RGBColor(64, 64, 64)
    
    doc.add_paragraph()
    
    date_para = doc.add_paragraph()
    date_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    date_run = date_para.add_run(f"Confirmation Date: {datetime.now().strftime('%B %d, %Y')}")
    date_run.font.size = Pt(10)
    date_run.font.color.rgb = RGBColor(128, 128, 128)
    
    # Save document
    output_file = "Willow_Lodge_Booking_Confirmation.docx"
    doc.save(output_file)
    print(f"Booking confirmation generated: {output_file}")
    return output_file

if __name__ == "__main__":
    create_booking_confirmation()

