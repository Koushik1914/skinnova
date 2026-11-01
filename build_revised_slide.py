"""
SKINNOVA - Master Single-Slide Executive Presentation Generator
L'Oréal Sustainability Challenge 2026 (Research & Innovation Track, Option 02)
Author: Koushik Voota | Amrita Vishwa Vidyapeetham

Implements the Master Revision Brief:
- Exactly ONE 16:9 widescreen slide.
- Strict scientific credibility corrections applied (no false clinical/statistical claims).
- Crated typography, 8-pt spacing, uncrowded cards.
- True clickable hyperlink for prototype.
"""

import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def build_presentation(output_pptx):
    prs = Presentation()
    # 16:9 widescreen: 13.333 x 7.5 inches
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    blank_layout = prs.slide_layouts[6]
    slide = prs.slides.add_slide(blank_layout)

    # Color Palette: Deep Navy, Warm Ivory, Muted Gold, Scientific Teal
    NAVY_DARK = RGBColor(7, 14, 31)        # #070E1F
    NAVY_CARD = RGBColor(11, 22, 48)       # #0B1630
    NAVY_ELEVATED = RGBColor(16, 28, 58)   # #101C3A
    GOLD = RGBColor(201, 162, 75)          # #C9A24B
    TEAL = RGBColor(43, 179, 163)          # #2BB3A3
    IVORY = RGBColor(247, 244, 238)        # #F7F4EE
    MUTED_GRAY = RGBColor(165, 178, 196)   # #A5B2C4 (high contrast against navy)
    HAIRLINE = RGBColor(28, 44, 80)        # clean hairline border
    BOX_BG = RGBColor(12, 22, 46)          # card fill

    # 1. Slide Canvas Background
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg.fill.solid()
    bg.fill.fore_color.rgb = NAVY_DARK
    bg.line.fill.background()

    # Helper: Add rounded card with optional left accent stripe
    def create_card(left, top, width, height, bg_col=BOX_BG, border_col=HAIRLINE, accent_col=None):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_col
        card.line.color.rgb = border_col
        card.line.width = Pt(0.75)

        if accent_col:
            stripe = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, Inches(0.045), height)
            stripe.fill.solid()
            stripe.fill.fore_color.rgb = accent_col
            stripe.line.fill.background()
        return card

    # =========================================================================
    # 1. TOP HEADER SECTION
    # =========================================================================
    header_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.25), Inches(8.5), Inches(0.92))
    htf = header_box.text_frame
    htf.word_wrap = True
    htf.margin_left = htf.margin_top = htf.margin_right = htf.margin_bottom = 0

    p_super = htf.paragraphs[0]
    r_sup = p_super.add_run()
    r_sup.text = "L'ORÉAL SUSTAINABILITY CHALLENGE 2026 · RESEARCH & INNOVATION (OPTION 02)"
    r_sup.font.size = Pt(8.5)
    r_sup.font.bold = True
    r_sup.font.color.rgb = GOLD

    p_title = htf.add_paragraph()
    r_t1 = p_title.add_run()
    r_t1.text = "SKINNOVA"
    r_t1.font.name = "Georgia"
    r_t1.font.size = Pt(24)
    r_t1.font.bold = True
    r_t1.font.color.rgb = IVORY

    r_dot = p_title.add_run()
    r_dot.text = " · "
    r_dot.font.size = Pt(22)
    r_dot.font.color.rgb = GOLD

    r_t2 = p_title.add_run()
    r_t2.text = "Climate-Adaptive Skin Longevity Platform for Indian GenZ"
    r_t2.font.size = Pt(13.5)
    r_t2.font.color.rgb = TEAL

    # Top Right Relevance Card
    badge_card = create_card(Inches(9.18), Inches(0.24), Inches(3.653), Inches(0.88), bg_col=NAVY_ELEVATED, border_col=HAIRLINE)
    btf = badge_card.text_frame
    btf.word_wrap = True
    btf.margin_left = Inches(0.16)
    btf.margin_right = Inches(0.12)
    btf.margin_top = Inches(0.10)

    bp0 = btf.paragraphs[0]
    r_bp0 = bp0.add_run()
    r_bp0.text = "BRAND PORTFOLIO RELEVANCE"
    r_bp0.font.size = Pt(8)
    r_bp0.font.bold = True
    r_bp0.font.color.rgb = GOLD

    bp1 = btf.add_paragraph()
    r_bp1 = bp1.add_run()
    r_bp1.text = "L'Oréal Paris · CeraVe · Garnier"
    r_bp1.font.size = Pt(10)
    r_bp1.font.bold = True
    r_bp1.font.color.rgb = IVORY

    bp2 = btf.add_paragraph()
    r_bp2 = bp2.add_run()
    r_bp2.text = "Zero-Backend PWA · On-Device Image Analysis · Live Open-Meteo"
    r_bp2.font.size = Pt(7.5)
    r_bp2.font.color.rgb = MUTED_GRAY

    # =========================================================================
    # 2. FOUR-STEP WORKFLOW RIBBON (Primary Visual Anchor)
    # =========================================================================
    wf_y = Inches(1.22)
    wf_h = Inches(0.92)
    step_w = Inches(2.98)
    gap = Inches(0.137)

    workflow_steps = [
        ("01 · SCAN", "On-Device Facial Analysis", "Forehead & cheek patches in CIELAB. Visible-signal proxies only. Image remains on user device.", TEAL),
        ("02 · CLIMATE", "Open-Meteo Telemetry", "Live ambient UV, PM2.5, temp & humidity. 8 Indian city presets with sample-data fallback.", TEAL),
        ("03 · FUSION", "CSSI & Guidance Index", "Transparent environmental index fused with baseline-relative visible signal comparisons.", GOLD),
        ("04 · ROUTINE", "Minimal Adaptive Routine", "AM/PM barrier essentials (SPF, Niacinamide, Ceramides). 'Skip-Today' on low-stress days.", GOLD)
    ]

    for i, (tag, stitle, sdesc, col) in enumerate(workflow_steps):
        s_left = Inches(0.5) + i * (step_w + gap)
        scard = create_card(s_left, wf_y, step_w, wf_h, bg_col=NAVY_CARD, border_col=HAIRLINE, accent_col=col)
        stf = scard.text_frame
        stf.word_wrap = True
        stf.margin_left = Inches(0.18)
        stf.margin_right = Inches(0.10)
        stf.margin_top = Inches(0.08)

        p1 = stf.paragraphs[0]
        r_tag = p1.add_run()
        r_tag.text = tag
        r_tag.font.size = Pt(7.8)
        r_tag.font.bold = True
        r_tag.font.color.rgb = col

        p2 = stf.add_paragraph()
        r_title = p2.add_run()
        r_title.text = stitle
        r_title.font.size = Pt(9.5)
        r_title.font.bold = True
        r_title.font.color.rgb = IVORY

        p3 = stf.add_paragraph()
        r_desc = p3.add_run()
        r_desc.text = sdesc
        r_desc.font.size = Pt(7.6)
        r_desc.font.color.rgb = MUTED_GRAY

    # Narrative Visual Storytelling Ribbon (Subtle connector)
    flow_bar = slide.shapes.add_textbox(Inches(0.5), Inches(2.18), Inches(12.333), Inches(0.24))
    ftf = flow_bar.text_frame
    ftf.word_wrap = True
    ftf.margin_left = ftf.margin_top = ftf.margin_right = ftf.margin_bottom = 0
    fp = ftf.paragraphs[0]
    r_flow = fp.add_run()
    r_flow.text = "VISUAL PIPELINE:  Environmental Exposure  ➔  Visible Skin Signals  ➔  Personalised Guidance  ➔  Minimal Adaptive Routine  ➔  Lower Overconsumption"
    r_flow.font.size = Pt(7.5)
    r_flow.font.bold = True
    r_flow.font.color.rgb = TEAL

    # =========================================================================
    # 3. MAIN THREE-COLUMN CORE CONTENT (Y: 2.45 to 6.85)
    # =========================================================================
    main_y = Inches(2.44)
    c1_left = Inches(0.5)
    c1_w = Inches(3.88)

    c2_left = Inches(4.53)
    c2_w = Inches(4.273)

    c3_left = Inches(8.95)
    c3_w = Inches(3.883)

    # -------------------------------------------------------------------------
    # COLUMN 1: THE CLIMATE CHALLENGE + CORE DIFFERENTIATOR (ETHICAL AI)
    # -------------------------------------------------------------------------
    # Card 1A: Problem & Key Stressors
    c1a = create_card(c1_left, main_y, c1_w, Inches(2.28), accent_col=GOLD)
    tf1a = c1a.text_frame
    tf1a.word_wrap = True
    tf1a.margin_left = Inches(0.20)
    tf1a.margin_right = Inches(0.14)
    tf1a.margin_top = Inches(0.10)

    p = tf1a.paragraphs[0]
    r = p.add_run()
    r.text = "THE CLIMATE CHALLENGE FOR INDIAN GENZ"
    r.font.size = Pt(8)
    r.font.bold = True
    r.font.color.rgb = GOLD

    p = tf1a.add_paragraph()
    r = p.add_run()
    r.text = "Three Key Environmental Stressors"
    r.font.size = Pt(11)
    r.font.bold = True
    r.font.color.rgb = IVORY

    stressors = [
        ("UV Exposure: ", "Intense solar irradiance inducing oxidative stress pathways and photo-induced pigmentation concerns in melanin-rich skin."),
        ("Air Pollution: ", "Ambient particulate matter (PM2.5/PM10) exposure accelerating surface sebum oxidation and cellular barrier fatigue."),
        ("Heat & Humidity: ", "Monsoon humidity (>80% RH) and tropical heat increasing sebum flux, follicular discomfort, and barrier challenges under multi-product layering.")
    ]
    for s_title, s_desc in stressors:
        p = tf1a.add_paragraph()
        r1 = p.add_run()
        r1.text = "• " + s_title
        r1.font.bold = True
        r1.font.size = Pt(7.8)
        r1.font.color.rgb = TEAL
        r2 = p.add_run()
        r2.text = s_desc
        r2.font.size = Pt(7.8)
        r2.font.color.rgb = MUTED_GRAY

    # Card 1B: Fairness & Privacy Statement
    c1b = create_card(c1_left, main_y + Inches(2.36), c1_w, Inches(2.02), accent_col=TEAL)
    tf1b = c1b.text_frame
    tf1b.word_wrap = True
    tf1b.margin_left = Inches(0.20)
    tf1b.margin_right = Inches(0.14)
    tf1b.margin_top = Inches(0.10)

    p = tf1b.paragraphs[0]
    r = p.add_run()
    r.text = "CORE DIFFERENTIATOR · ETHICAL ON-DEVICE AI"
    r.font.size = Pt(8)
    r.font.bold = True
    r.font.color.rgb = TEAL

    p = tf1b.add_paragraph()
    r = p.add_run()
    r.text = "Fairness & Privacy Architecture"
    r.font.size = Pt(11)
    r.font.bold = True
    r.font.color.rgb = IVORY

    fairness_points = [
        ("Baseline-Relative Analysis: ", "Designed to reduce absolute skin-tone dependence through individual baseline-relative comparisons (ΔL*, Δa*, ΔLaplacian)."),
        ("On-Device Processing: ", "All canvas computer vision executes locally on the user's phone; zero facial images uploaded or stored on cloud servers."),
        ("Lighting-Quality Checks: ", "Automated checks for underexposure, glare, and cheek asymmetry prompt friendly retakes rather than issuing misleading scores.")
    ]
    for f_title, f_desc in fairness_points:
        p = tf1b.add_paragraph()
        r1 = p.add_run()
        r1.text = "• " + f_title
        r1.font.bold = True
        r1.font.size = Pt(7.8)
        r1.font.color.rgb = GOLD
        r2 = p.add_run()
        r2.text = f_desc
        r2.font.size = Pt(7.8)
        r2.font.color.rgb = MUTED_GRAY

    # -------------------------------------------------------------------------
    # COLUMN 2: SCIENTIFIC ENGINE + PAIRED FORMULATION CONCEPT
    # -------------------------------------------------------------------------
    # Card 2A: Transparent Environmental-to-Routine Framework
    c2a = create_card(c2_left, main_y, c2_w, Inches(2.28), accent_col=TEAL)
    tf2a = c2a.text_frame
    tf2a.word_wrap = True
    tf2a.margin_left = Inches(0.20)
    tf2a.margin_right = Inches(0.14)
    tf2a.margin_top = Inches(0.10)

    p = tf2a.paragraphs[0]
    r = p.add_run()
    r.text = "SCIENTIFIC ENGINE · DECISION SUPPORT"
    r.font.size = Pt(8)
    r.font.bold = True
    r.font.color.rgb = TEAL

    p = tf2a.add_paragraph()
    r = p.add_run()
    r.text = "Transparent Environmental-to-Routine Framework"
    r.font.size = Pt(11)
    r.font.bold = True
    r.font.color.rgb = IVORY

    # CSSI formula & disclaimer
    p_f1 = tf2a.add_paragraph()
    r_f1 = p_f1.add_run()
    r_f1.text = "CSSI = 0.35 × S(UV) + 0.35 × S(PM2.5) + 0.20 × S(RH_Heat) + 0.10 × S(Temp)"
    r_f1.font.name = "Consolas"
    r_f1.font.size = Pt(7.8)
    r_f1.font.color.rgb = TEAL

    p_f1_note = tf2a.add_paragraph()
    r_f1n = p_f1_note.add_run()
    r_f1n.text = "Proposed prototype weights; not clinically validated biological weights."
    r_f1n.font.size = Pt(7.0)
    r_f1n.font.color.rgb = MUTED_GRAY

    # Guidance Index formula & disclaimer
    p_f2 = tf2a.add_paragraph()
    r_f2_lbl = p_f2.add_run()
    r_f2_lbl.text = "Experimental Personalised Skin Guidance Index:\n"
    r_f2_lbl.font.size = Pt(8.2)
    r_f2_lbl.font.bold = True
    r_f2_lbl.font.color.rgb = IVORY
    r_f2 = p_f2.add_run()
    r_f2.text = "Guidance Index = 100 − (0.55 × CSSI + 0.45 × Visible Signal Index)"
    r_f2.font.name = "Consolas"
    r_f2.font.size = Pt(7.8)
    r_f2.font.color.rgb = GOLD

    p_disc = tf2a.add_paragraph()
    r_disc = p_disc.add_run()
    r_disc.text = "Experimental recommendation heuristic; not a clinical measure of skin health or biological aging."
    r_disc.font.size = Pt(7.0)
    r_disc.font.color.rgb = MUTED_GRAY

    p_val = tf2a.add_paragraph()
    r_val = p_val.add_run()
    r_val.text = "• Future Clinical Validation: "
    r_val.font.size = Pt(7.5)
    r_val.font.bold = True
    r_val.font.color.rgb = TEAL
    r_val2 = p_val.add_run()
    r_val2.text = "Protocol planned against Corneometer® (hydration), Tewameter® (TEWL), and Mexameter® (erythema) instruments."
    r_val2.font.size = Pt(7.5)
    r_val2.font.color.rgb = MUTED_GRAY

    # Card 2B: Paired Formulation Concept
    c2b = create_card(c2_left, main_y + Inches(2.36), c2_w, Inches(2.02), accent_col=GOLD)
    tf2b = c2b.text_frame
    tf2b.word_wrap = True
    tf2b.margin_left = Inches(0.20)
    tf2b.margin_right = Inches(0.14)
    tf2b.margin_top = Inches(0.10)

    p = tf2b.paragraphs[0]
    r = p.add_run()
    r.text = "PAIRED FORMULATION CONCEPT"
    r.font.size = Pt(8)
    r.font.bold = True
    r.font.color.rgb = GOLD

    p = tf2b.add_paragraph()
    r = p.add_run()
    r.text = "Lightweight Antioxidant + Barrier-Support Gel-Cream"
    r.font.size = Pt(11)
    r.font.bold = True
    r.font.color.rgb = IVORY

    p_char = tf2b.add_paragraph()
    r_c = p_char.add_run()
    r_c.text = "Target Sensory: Lightweight, humidity-friendly, non-comedogenic formulation target."
    r_c.font.size = Pt(7.5)
    r_c.font.color.rgb = MUTED_GRAY

    ingreds = [
        ("Proposed Ingredient Classes: ", "Niacinamide, Ceramides, Vitamin C/E derivatives, and ethically sourced Indian botanicals such as amla (Phyllanthus emblica)."),
        ("Concept Notice: ", "Concept formulation — not an existing or clinically validated product.")
    ]
    for i_title, i_desc in ingreds:
        p = tf2b.add_paragraph()
        r1 = p.add_run()
        r1.text = "• " + i_title
        r1.font.bold = True
        r1.font.size = Pt(7.6)
        r1.font.color.rgb = TEAL if "Proposed" in i_title else GOLD
        r2 = p.add_run()
        r2.text = i_desc
        r2.font.size = Pt(7.6)
        r2.font.color.rgb = MUTED_GRAY

    # -------------------------------------------------------------------------
    # COLUMN 3: SUSTAINABILITY + GO-TO-MARKET STRATEGY
    # -------------------------------------------------------------------------
    # Card 3A: Sustainability
    c3a = create_card(c3_left, main_y, c3_w, Inches(2.28), accent_col=GOLD)
    tf3a = c3a.text_frame
    tf3a.word_wrap = True
    tf3a.margin_left = Inches(0.20)
    tf3a.margin_right = Inches(0.14)
    tf3a.margin_top = Inches(0.10)

    p = tf3a.paragraphs[0]
    r = p.add_run()
    r.text = "SUSTAINABILITY · RESPONSIBLE INNOVATION"
    r.font.size = Pt(8)
    r.font.bold = True
    r.font.color.rgb = GOLD

    p = tf3a.add_paragraph()
    r = p.add_run()
    r.text = "Circular Design & Anti-Overconsumption"
    r.font.size = Pt(11)
    r.font.bold = True
    r.font.color.rgb = IVORY

    sust_points = [
        ("Circular Packaging Concepts: ", "Refillable and recyclable packaging designs with modular replaceable inner cartridges to minimize single-use plastics."),
        ("Responsible Botanical Sourcing: ", "Sourcing framework structured around applicable Indian Biological Diversity Act Access and Benefit Sharing (ABS) considerations."),
        ("Minimalist Routine Support: ", "'Skip-Today' recommendations on low-stress days to actively discourage unnecessary product layering."),
        ("Privacy-First On-Device Compute: ", "Local processing avoids continuous cloud GPU infrastructure energy demands.")
    ]
    for s_title, s_desc in sust_points:
        p = tf3a.add_paragraph()
        r1 = p.add_run()
        r1.text = "• " + s_title
        r1.font.bold = True
        r1.font.size = Pt(7.8)
        r1.font.color.rgb = TEAL
        r2 = p.add_run()
        r2.text = s_desc
        r2.font.size = Pt(7.8)
        r2.font.color.rgb = MUTED_GRAY

    # Card 3B: Go-To-Market
    c3b = create_card(c3_left, main_y + Inches(2.36), c3_w, Inches(2.02), accent_col=TEAL)
    tf3b = c3b.text_frame
    tf3b.word_wrap = True
    tf3b.margin_left = Inches(0.20)
    tf3b.margin_right = Inches(0.14)
    tf3b.margin_top = Inches(0.10)

    p = tf3b.paragraphs[0]
    r = p.add_run()
    r.text = "GO-TO-MARKET · BRAND PORTFOLIO ALIGNMENT"
    r.font.size = Pt(8)
    r.font.bold = True
    r.font.color.rgb = TEAL

    p = tf3b.add_paragraph()
    r = p.add_run()
    r.text = "Scalable Engagement for Indian GenZ"
    r.font.size = Pt(11)
    r.font.bold = True
    r.font.color.rgb = IVORY

    gtm_points = [
        ("Target Demographic: ", "Indian GenZ, initially urban college students and young professionals seeking clinical clarity and climate-adapted barrier defense."),
        ("Frictionless Digital Entry: ", "Designed for fast QR-based mobile web access; requires zero app store download or mandatory user login."),
        ("Activation Touchpoints: ", "Interactive demonstrations at university campuses and beauty retail settings (smart mirror kiosks in partner stores)."),
        ("Brand Portfolio Synergy: ", "Potential conceptual fit for CeraVe (barrier care), L'Oréal Paris (youth longevity), or Garnier (botanical sourcing).")
    ]
    for g_title, g_desc in gtm_points:
        p = tf3b.add_paragraph()
        r1 = p.add_run()
        r1.text = "• " + g_title
        r1.font.bold = True
        r1.font.size = Pt(7.8)
        r1.font.color.rgb = GOLD
        r2 = p.add_run()
        r2.text = g_desc
        r2.font.size = Pt(7.8)
        r2.font.color.rgb = MUTED_GRAY

    # =========================================================================
    # 4. FOOTER SECTION WITH CLICKABLE PROTOTYPE HYPERLINK
    # =========================================================================
    footer_box = slide.shapes.add_textbox(Inches(0.5), Inches(6.94), Inches(12.333), Inches(0.38))
    ftf = footer_box.text_frame
    ftf.word_wrap = True
    ftf.margin_left = ftf.margin_top = ftf.margin_right = ftf.margin_bottom = 0

    fp = ftf.paragraphs[0]

    # Disclaimer text
    r_disc = fp.add_run()
    r_disc.text = "Concept proposal; metrics and formulation targets pending validation. Not a medical diagnostic tool.  |  "
    r_disc.font.size = Pt(8.0)
    r_disc.font.color.rgb = MUTED_GRAY

    # Clickable Live Prototype Hyperlink
    r_link_lbl = fp.add_run()
    r_link_lbl.text = "Explore Interactive Prototype: "
    r_link_lbl.font.size = Pt(8.2)
    r_link_lbl.font.bold = True
    r_link_lbl.font.color.rgb = TEAL

    r_link = fp.add_run()
    r_link.text = "https://koushik1914.github.io/skinnova/"
    r_link.font.size = Pt(8.2)
    r_link.font.bold = True
    r_link.font.underline = True
    r_link.font.color.rgb = TEAL
    r_link.hyperlink.address = "https://koushik1914.github.io/skinnova/"

    # Author text
    r_sep = fp.add_run()
    r_sep.text = "  |  "
    r_sep.font.size = Pt(8.0)
    r_sep.font.color.rgb = MUTED_GRAY

    r_author = fp.add_run()
    r_author.text = "Koushik Voota | Amrita Vishwa Vidyapeetham"
    r_author.font.size = Pt(8.2)
    r_author.font.bold = True
    r_author.font.color.rgb = GOLD

    # Save presentation
    prs.save(output_pptx)
    print(f"[OK] PowerPoint generated: {output_pptx}")
    print(f"[OK] Slide count: {len(prs.slides)} (Verified: EXACTLY ONE SLIDE)")

if __name__ == "__main__":
    out_dir = r"c:\Users\vkous\Downloads\Loreal"
    out_file = os.path.join(out_dir, "Koushik_Voota_Amrita_Vishwa_Vidyapeetham_Presentation.pptx")
    build_presentation(out_file)
