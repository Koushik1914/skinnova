"""
SKINNOVA - Export Final Single-Slide Deliverables
- Koushik_Voota_Amrita_Vishwa_Vidyapeetham_Presentation.pptx
- Koushik_Voota_Amrita_Vishwa_Vidyapeetham_Presentation.pdf
- SKINNOVA_Final_Preview.png
"""

import os
import shutil
import win32com.client
from pptx import Presentation
from build_revised_slide import build_presentation

def export_deliverables():
    work_dir = r"c:\Users\vkous\Downloads\Loreal"
    pptx_path = os.path.abspath(os.path.join(work_dir, "Koushik_Voota_Amrita_Vishwa_Vidyapeetham_Presentation.pptx"))
    pdf_path = os.path.abspath(os.path.join(work_dir, "Koushik_Voota_Amrita_Vishwa_Vidyapeetham_Presentation.pdf"))
    png_path = os.path.abspath(os.path.join(work_dir, "SKINNOVA_Final_Preview.png"))
    artifact_png = r"C:\Users\vkous\.gemini\antigravity-ide\brain\bbf6e001-cf4b-4f27-8f72-7d0c83e6d912\SKINNOVA_Final_Preview.png"

    # 1. Build PPTX
    print("Building revised single-slide PowerPoint...")
    build_presentation(pptx_path)

    # 2. Assert strictly 1 slide
    prs = Presentation(pptx_path)
    assert len(prs.slides) == 1, f"ERROR: Slide count is {len(prs.slides)}, expected 1."

    # 3. Export via PowerPoint COM
    print("Exporting to PDF and PNG preview via Microsoft PowerPoint...")
    ppt_app = win32com.client.Dispatch("PowerPoint.Application")
    deck = ppt_app.Presentations.Open(pptx_path, False, False, False)

    try:
        # Save as PDF (Format constant 32)
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
        deck.SaveAs(pdf_path, 32)
        print(f"[OK] Generated PDF: {pdf_path}")

        # Save slide 1 as 1920x1080 PNG
        if os.path.exists(png_path):
            os.remove(png_path)
        slide_obj = deck.Slides(1)
        slide_obj.Export(png_path, "PNG", 1920, 1080)
        print(f"[OK] Generated PNG: {png_path}")

    finally:
        deck.Close()
        ppt_app.Quit()

    # 4. Copy preview to artifact directory for rendering in IDE
    try:
        shutil.copy2(png_path, artifact_png)
        print(f"[OK] Copied preview to artifact directory: {artifact_png}")
    except Exception as e:
        print(f"Artifact copy note: {e}")

    # 5. File size verification
    print("\n--- DELIVERABLE VERIFICATION ---")
    for f in [pptx_path, pdf_path, png_path]:
        assert os.path.exists(f), f"Missing: {f}"
        print(f"Verified: {os.path.basename(f)} ({os.path.getsize(f):,} bytes)")

    print("\nAll deliverables generated successfully!")

if __name__ == "__main__":
    export_deliverables()
