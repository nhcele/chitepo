#!/usr/bin/env python3
"""
Generate a comprehensive car hire booking confirmation document
"""

from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from datetime import datetime, date
import os

def find_logo_file(logo_path=None):
    """Find the existing logo file for The Best Car Hire"""
    # If logo path is provided, use it
    if logo_path and os.path.exists(logo_path):
        return logo_path
    
    # Try common logo file names
    possible_names = [
        "best_car_hire_logo.png",
        "the_best_car_hire_logo.png",
        "best_car_hire_logo.jpg",
        "the_best_car_hire_logo.jpg",
        "logo_best_car_hire.png",
        "logo.png",
        "best_logo.png"
    ]
    
    for logo_name in possible_names:
        if os.path.exists(logo_name):
            return logo_name
    
    return None

def create_car_hire_confirmation(logo_path=None):
    """Create a comprehensive car hire booking confirmation document"""
    
    # Find existing logo file
    logo_file = find_logo_file(logo_path)
    
    if not logo_file:
        print("Warning: Logo file not found. Please ensure the logo image file is in the same directory.")
        print("Looking for files named: best_car_hire_logo.png, the_best_car_hire_logo.png, etc.")
    
    # Create document
    doc = Document()
    
    # Set margins - different from hotel booking
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.4)
        section.bottom_margin = Inches(0.4)
        section.left_margin = Inches(0.5)
        section.right_margin = Inches(0.5)
    
    # Add logo at top
    if logo_file and os.path.exists(logo_file):
        header_para = doc.add_paragraph()
        header_para.alignment = WD_ALIGN_PARAGRAPH.LEFT
        run = header_para.add_run()
        run.add_picture(logo_file, width=Inches(6))
    
    doc.add_paragraph()
    
    # Header section with company info (different layout)
    header_table = doc.add_table(rows=1, cols=2)
    header_table.style = None
    
    # Left cell - Company info
    left_cell = header_table.rows[0].cells[0]
    left_cell.width = Inches(3)
    left_para = left_cell.paragraphs[0]
    left_para.add_run("THE BEST CAR HIRE").bold = True
    left_para.add_run().font.size = Pt(14)
    left_cell.add_paragraph("123 Main Street")
    left_cell.add_paragraph("City, State 12345")
    left_cell.add_paragraph("Phone: +1 (555) 987-6543")
    left_cell.add_paragraph("Email: bookings@thebestcarhire.com")
    
    # Right cell - Confirmation details
    right_cell = header_table.rows[0].cells[1]
    right_cell.width = Inches(3.5)
    right_para = right_cell.paragraphs[0]
    right_para.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    right_para.add_run("RENTAL CONFIRMATION").bold = True
    right_para.add_run().font.size = Pt(16)
    right_cell.add_paragraph()
    conf_para = right_cell.add_paragraph()
    conf_para.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    conf_para.add_run("Confirmation #: ").bold = True
    conf_para.add_run(f"TBCH-{datetime.now().strftime('%Y%m%d')}-001")
    date_para = right_cell.add_paragraph()
    date_para.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    date_para.add_run(f"Issued: {datetime.now().strftime('%B %d, %Y')}")
    
    doc.add_paragraph()
    doc.add_paragraph()
    
    # Customer Information Section (different format - side by side)
    cust_heading = doc.add_paragraph()
    cust_heading.add_run("CUSTOMER INFORMATION").bold = True
    cust_heading.add_run().font.size = Pt(13)
    cust_heading.add_run().font.color.rgb = RGBColor(255, 140, 0)  # Orange
    
    cust_table = doc.add_table(rows=2, cols=2)
    cust_table.style = 'Light List Accent 1'
    
    cust_data = [
        ("Customer Name:", "Rev and Mrs Gondongwe"),
        ("Contact Email:", "guest@example.com"),
        ("Contact Phone:", "+1 (555) 123-4567"),
        ("Booking Reference:", f"TBCH-{datetime.now().strftime('%Y%m%d')}-001")
    ]
    
    for i, (label, value) in enumerate(cust_data):
        row_idx = i // 2
        col_idx = i % 2
        if row_idx >= len(cust_table.rows):
            cust_table.add_row()
        cell = cust_table.rows[row_idx].cells[col_idx]
        cell.paragraphs[0].add_run(label).bold = True
        cell.paragraphs[0].add_run(f" {value}")
        for paragraph in cell.paragraphs:
            for run in paragraph.runs:
                run.font.size = Pt(10)
    
    doc.add_paragraph()
    
    # Rental Period Section (horizontal layout)
    rental_heading = doc.add_paragraph()
    rental_heading.add_run("RENTAL PERIOD").bold = True
    rental_heading.add_run().font.size = Pt(13)
    rental_heading.add_run().font.color.rgb = RGBColor(255, 140, 0)
    
    rental_table = doc.add_table(rows=3, cols=4)
    rental_table.style = 'Medium Grid 1 Accent 1'
    
    # Header row
    headers = ["Location", "Date", "Time", "Address"]
    for i, header in enumerate(headers):
        cell = rental_table.rows[0].cells[i]
        cell.paragraphs[0].add_run(header).bold = True
        cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in cell.paragraphs[0].runs:
            run.font.size = Pt(11)
            run.font.color.rgb = RGBColor(255, 255, 255)
    
    # Data rows
    rental_data = [
        ("Pick-Up", "Monday, Dec 23, 2025", "10:00 AM", "123 Main Street, City"),
        ("Drop-Off", "Monday, Jan 12, 2026", "4:00 PM", "123 Main Street, City")
    ]
    
    for i, row_data in enumerate(rental_data):
        for j, data in enumerate(row_data):
            cell = rental_table.rows[i+1].cells[j]
            cell.paragraphs[0].add_run(data)
            cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
            for run in cell.paragraphs[0].runs:
                run.font.size = Pt(10)
    
    doc.add_paragraph()
    
    # Vehicle Information (different format)
    vehicle_heading = doc.add_paragraph()
    vehicle_heading.add_run("VEHICLE DETAILS").bold = True
    vehicle_heading.add_run().font.size = Pt(13)
    vehicle_heading.add_run().font.color.rgb = RGBColor(255, 140, 0)
    
    vehicle_table = doc.add_table(rows=6, cols=2)
    vehicle_table.style = 'Light Shading Accent 1'
    
    vehicle_data = [
        ("Vehicle Category:", "Premium SUV"),
        ("Make & Model:", "Toyota Land Cruiser 2024"),
        ("Transmission:", "Automatic"),
        ("Fuel Type:", "Petrol"),
        ("Seating Capacity:", "7 passengers"),
        ("Luggage Capacity:", "4 large suitcases")
    ]
    
    for i, (label, value) in enumerate(vehicle_data):
        vehicle_table.rows[i].cells[0].paragraphs[0].add_run(label).bold = True
        vehicle_table.rows[i].cells[1].paragraphs[0].add_run(value)
        for cell in vehicle_table.rows[i].cells:
            for paragraph in cell.paragraphs:
                for run in paragraph.runs:
                    run.font.size = Pt(10)
    
    doc.add_paragraph()
    
    # Driver Information (both drivers)
    driver_heading = doc.add_paragraph()
    driver_heading.add_run("AUTHORIZED DRIVERS").bold = True
    driver_heading.add_run().font.size = Pt(13)
    driver_heading.add_run().font.color.rgb = RGBColor(255, 140, 0)
    
    driver_table = doc.add_table(rows=3, cols=4)
    driver_table.style = 'Medium Grid 1 Accent 1'
    
    # Header
    driver_headers = ["Driver", "License Number", "License Expiry", "Country"]
    for i, header in enumerate(driver_headers):
        cell = driver_table.rows[0].cells[i]
        cell.paragraphs[0].add_run(header).bold = True
        cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in cell.paragraphs[0].runs:
            run.font.size = Pt(10)
            run.font.color.rgb = RGBColor(255, 255, 255)
    
    # Driver data
    driver_info = [
        ("Rev Gondongwe", "DL123456789", "Dec 31, 2027", "Zimbabwe"),
        ("Mrs Gondongwe", "DL987654321", "Mar 15, 2028", "Zimbabwe")
    ]
    
    for i, driver in enumerate(driver_info):
        for j, data in enumerate(driver):
            cell = driver_table.rows[i+1].cells[j]
            cell.paragraphs[0].add_run(data)
            cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
            for run in cell.paragraphs[0].runs:
                run.font.size = Pt(9)
    
    doc.add_paragraph()
    
    # Rental Charges (different calculation)
    check_in = date(2025, 12, 23)
    check_out = date(2026, 1, 12)
    rental_days = (check_out - check_in).days
    
    charges_heading = doc.add_paragraph()
    charges_heading.add_run("RENTAL CHARGES & FEES").bold = True
    charges_heading.add_run().font.size = Pt(13)
    charges_heading.add_run().font.color.rgb = RGBColor(255, 140, 0)
    
    charges_table = doc.add_table(rows=7, cols=3)
    charges_table.style = 'Light Grid Accent 1'
    
    # Headers
    charge_headers = ["Description", "Quantity", "Amount"]
    for i, header in enumerate(charge_headers):
        cell = charges_table.rows[0].cells[i]
        cell.paragraphs[0].add_run(header).bold = True
        cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in cell.paragraphs[0].runs:
            run.font.size = Pt(10)
    
    # Calculate charges
    daily_rate = 85.00
    subtotal = rental_days * daily_rate
    additional_driver = 15.00 * rental_days
    insurance = 25.00 * rental_days
    gps_nav = 8.00 * rental_days
    subtotal_all = subtotal + additional_driver + insurance + gps_nav
    tax_rate = 0.12
    tax = subtotal_all * tax_rate
    total = subtotal_all + tax
    
    charge_items = [
        ("Daily Rental Rate", f"{rental_days} days @ ${daily_rate:.2f}/day", f"${subtotal:,.2f}"),
        ("Additional Driver Fee", f"{rental_days} days @ $15.00/day", f"${additional_driver:,.2f}"),
        ("Full Coverage Insurance", f"{rental_days} days @ $25.00/day", f"${insurance:,.2f}"),
        ("GPS Navigation System", f"{rental_days} days @ $8.00/day", f"${gps_nav:,.2f}"),
        ("Subtotal", "", f"${subtotal_all:,.2f}"),
        ("Tax (12%)", "", f"${tax:,.2f}"),
    ]
    
    for i, (desc, qty, amt) in enumerate(charge_items):
        row = charges_table.rows[i+1]
        row.cells[0].paragraphs[0].add_run(desc)
        row.cells[1].paragraphs[0].add_run(qty)
        row.cells[1].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row.cells[2].paragraphs[0].add_run(amt)
        row.cells[2].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
        
        # Make subtotal and tax bold
        if i >= 4:
            for cell in row.cells:
                for paragraph in cell.paragraphs:
                    for run in paragraph.runs:
                        run.bold = True
                        run.font.size = Pt(10)
        else:
            for cell in row.cells:
                for paragraph in cell.paragraphs:
                    for run in paragraph.runs:
                        run.font.size = Pt(9)
    
    # Total row
    total_row = charges_table.add_row()
    total_row.cells[0].paragraphs[0].add_run("TOTAL AMOUNT DUE").bold = True
    total_row.cells[0].paragraphs[0].runs[0].font.size = Pt(11)
    total_row.cells[1].paragraphs[0].add_run("")
    total_row.cells[2].paragraphs[0].add_run(f"${total:,.2f}").bold = True
    total_row.cells[2].paragraphs[0].runs[0].font.size = Pt(12)
    total_row.cells[2].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
    
    doc.add_paragraph()
    
    # Payment Information
    payment_heading = doc.add_paragraph()
    payment_heading.add_run("PAYMENT INFORMATION").bold = True
    payment_heading.add_run().font.size = Pt(13)
    payment_heading.add_run().font.color.rgb = RGBColor(255, 140, 0)
    
    payment_info = [
        ("Deposit Paid:", "$500.00"),
        ("Balance Due at Pick-Up:", f"${total - 500:,.2f}"),
        ("Payment Method:", "Credit Card ending in ****1234")
    ]
    
    for label, value in payment_info:
        para = doc.add_paragraph()
        para.add_run(label).bold = True
        para.add_run(f" {value}")
        for run in para.runs:
            run.font.size = Pt(10)
    
    doc.add_paragraph()
    
    # Terms & Conditions (different format - numbered list)
    terms_heading = doc.add_paragraph()
    terms_heading.add_run("TERMS & CONDITIONS").bold = True
    terms_heading.add_run().font.size = Pt(13)
    terms_heading.add_run().font.color.rgb = RGBColor(255, 140, 0)
    
    terms_list = [
        "Minimum age requirement: 25 years with valid driver's license",
        "Fuel Policy: Vehicle must be returned with the same fuel level as at pick-up (Full-to-Full)",
        "Mileage: Unlimited mileage included in rental period",
        "Insurance: Full coverage insurance included. Deductible: $500 per incident",
        "Cancellation: Free cancellation up to 48 hours before pick-up. 50% charge for cancellations within 48 hours",
        "Additional Driver: Second driver authorized at no extra charge (already included)",
        "Late Return: Late returns beyond 1 hour grace period will incur additional daily charges",
        "Prohibited Use: Vehicle must not be used for racing, towing, or off-road activities",
        "Damage: Any damage to the vehicle must be reported immediately. Customer is responsible for damage not covered by insurance",
        "Roadside Assistance: 24/7 roadside assistance available at +1 (555) 987-6543"
    ]
    
    for i, term in enumerate(terms_list, 1):
        para = doc.add_paragraph(f"{i}. {term}", style='List Number')
        for run in para.runs:
            run.font.size = Pt(9)
    
    doc.add_paragraph()
    
    # Important Notes (box format)
    notes_heading = doc.add_paragraph()
    notes_heading.add_run("IMPORTANT REMINDERS").bold = True
    notes_heading.add_run().font.size = Pt(13)
    notes_heading.add_run().font.color.rgb = RGBColor(255, 140, 0)
    
    notes_table = doc.add_table(rows=4, cols=1)
    notes_table.style = 'Light Shading Accent 1'
    
    reminders = [
        "Please arrive 15 minutes before scheduled pick-up time to complete paperwork",
        "Bring valid driver's license and credit card used for booking",
        "Inspect vehicle thoroughly before leaving the rental location and report any existing damage",
        "Keep rental agreement and emergency contact numbers with you at all times during the rental period"
    ]
    
    for i, reminder in enumerate(reminders):
        cell = notes_table.rows[i].cells[0]
        cell.paragraphs[0].add_run("• ").bold = True
        cell.paragraphs[0].add_run(reminder)
        for run in cell.paragraphs[0].runs:
            run.font.size = Pt(9)
    
    doc.add_paragraph()
    doc.add_paragraph()
    
    # Footer (different style)
    footer_table = doc.add_table(rows=1, cols=2)
    footer_table.style = None
    
    left_footer = footer_table.rows[0].cells[0]
    left_footer.paragraphs[0].add_run("Thank you for choosing The Best Car Hire!").italic = True
    left_footer.paragraphs[0].runs[0].font.size = Pt(10)
    left_footer.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 140, 0)
    
    right_footer = footer_table.rows[0].cells[1]
    right_footer.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
    right_footer.paragraphs[0].add_run("Safe travels!").bold = True
    right_footer.paragraphs[0].runs[0].font.size = Pt(10)
    
    # Save document
    output_file = "The_Best_Car_Hire_Confirmation.docx"
    doc.save(output_file)
    print(f"Car hire confirmation generated: {output_file}")
    
    return output_file

if __name__ == "__main__":
    import sys
    logo_path = sys.argv[1] if len(sys.argv) > 1 else None
    create_car_hire_confirmation(logo_path)

