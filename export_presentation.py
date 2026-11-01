"""
SKINNOVA - Export Single Slide PPTX, PDF, and PNG Preview
Uses python-pptx and PowerPoint COM automation.
"""

import os
import sys
import win32com.client
from pptx import Presentation
from create_single_slide import create_deck

def export_all():
    work_dir = r"c:\Users\vkous\Downloads\Loreal"
    pptx_path = os.path.abspath(os.path.join(work_dir, "SKINNOVA_Executive_Slide.pptx"))
    pdf_path = os.path.abspath(os.path.join(work_dir, "SKINNOVA_Executive_Slide.pdf"))
    png_path = os.path.abspath(os.path.join(work_dir, "SKINNOVA_Executive_Slide_Preview.png"))

    # 1. Generate PPTX
    print("Generating PPTX...")
    create_deck(pptx_path)

    # 2. Strict Verification: Exactly 1 slide
    prs = Presentation(pptx_path)
    slide_count = len(prs.slides)
    print(f"Verifying slide count: {slide_count}")
    assert slide_count == 1, f"ERROR: Expected exactly 1 slide, but got {slide_count}"

    # 3. Export to PDF and PNG via PowerPoint COM
    print("Exporting to PDF and PNG via PowerPoint COM...")
    ppt_app = win32com.client.Dispatch("PowerPoint.Application")
    # Open presentation (read-only = False, untitled = False, with_window = False)
    deck = ppt_app.Presentations.Open(pptx_path, False, False, False)

    try:
        # Export to PDF (32 is ppSaveAsPDF format constant)
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
        deck.SaveAs(pdf_path, 32)
        print(f"Saved PDF to: {pdf_path}")

        # Export Slide 1 to 1920x1080 PNG preview
        if os.path.exists(png_path):
            os.remove(png_path)
        slide_obj = deck.Slides(1)
        slide_obj.Export(png_path, "PNG", 1920, 1080)
        print(f"Saved PNG preview to: {png_path}")

    finally:
        deck.Close()
        ppt_app.Quit()

    # 4. Final verification of generated artifacts
    for f in [pptx_path, pdf_path, png_path]:
        assert os.path.exists(f), f"Missing file: {f}"
        size = os.path.getsize(f)
        print(f"[OK] {os.path.basename(f)} ({size:,} bytes)")

    print("\nALL DELIVERABLES SUCCESSFULLY EXPORTED!")

if __name__ == "__main__":
    export_all()
