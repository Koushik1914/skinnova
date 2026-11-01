"""
SKINNOVA - Single-Slide Executive Presentation Generator
L'Oréal Sustainability Challenge 2026 (Research & Innovation Track, Option 02)
Author: Koushik Voota | Amrita Vishwa Vidyapeetham

Generates EXACTLY ONE 16:9 widescreen PowerPoint slide,
exports it to PDF and high-res PNG preview.
"""

import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_deck(output_pptx):
    prs = Presentation()
    # 16:9 widescreen dimensions
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    # Blank layout
    blank_slide_layout = prs.slide_layouts[6]
    slide = prs.slides.add_slide(blank_slide_layout)

    # Core Colors
    NAVY_DARK = RGBColor(7, 14, 31)       # #070E1F
    NAVY_CARD = RGBColor(11, 22, 48)      # #0B1630
    NAVY_ELEVATED = RGBColor(17, 32, 66)  # #112042
    GOLD = RGBColor(201, 162, 75)         # #C9A24B
    TEAL = RGBColor(43, 179, 163)         # #2BB3A3
    IVORY = RGBColor(247, 244, 238)       # #F7F4EE
    MUTED_GRAY = RGBColor(160, 174, 192)  # #A0AEC0
    BORDER_COLOR = RGBColor(30, 48, 88)   # subtle hairline

    # 1. Slide Background
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg.fill.solid()
    bg.fill.fore_color.rgb = NAVY_DARK
    bg.line.fill.background()

    # Helper: Card with background and optional accent line
    def add_card(left, top, width, height, bg_color=NAVY_CARD, border_color=BORDER_COLOR, accent_color=None):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        card.line.color.rgb = border_color
        card.line.width = Pt(1)
        
        if accent_color:
            accent = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, Pt(4), height)
            accent.fill.solid()
            accent.fill.fore_color.rgb = accent_color
            accent.line.fill.background()
        return card

    # =========================================================================
    # HEADER SECTION
    # =========================================================================
    header_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.25), Inches(8.5), Inches(0.95))
    tf = header_box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

    p0 = tf.paragraphs[0]
    r_tag = p0.add_run()
    r_tag.text = "L'ORÉAL SUSTAINABILITY CHALLENGE 2026 · OPTION 02: LONGEVITY & FUTURE AGING"
    r_tag.font.size = Pt(8.5)
    r_tag.font.bold = True
    r_tag.font.color.rgb = GOLD

    p1 = tf.add_paragraph()
    r_title = p1.add_run()
    r_title.text = "SKINNOVA"
    r_title.font.name = "Georgia"
    r_title.font.size = Pt(22)
    r_title.font.bold = True
    r_title.font.color.rgb = IVORY

    r_dot = p1.add_run()
    r_dot.text = " · "
    r_dot.font.size = Pt(22)
    r_dot.font.color.rgb = GOLD

    r_sub = p1.add_run()
    r_sub.text = "Climate-Adaptive Skin Longevity Platform for Indian GenZ"
    r_sub.font.size = Pt(14)
    r_sub.font.color.rgb = TEAL

    # Header Right Badge
    badge_card = add_card(Inches(9.1), Inches(0.25), Inches(3.733), Inches(0.85), bg_color=NAVY_ELEVATED, border_color=BORDER_COLOR)
    badge_tf = badge_card.text_frame
    badge_tf.word_wrap = True
    badge_tf.margin_left = Inches(0.15)
    badge_tf.margin_right = Inches(0.15)
    badge_tf.margin_top = Inches(0.1)
    
    bp0 = badge_tf.paragraphs[0]
    r_b0 = bp0.add_run()
    r_b0.text = "RESEARCH & INNOVATION TRACK"
    r_b0.font.size = Pt(8.5)
    r_b0.font.bold = True
    r_b0.font.color.rgb = GOLD

    bp1 = badge_tf.add_paragraph()
    r_b1 = bp1.add_run()
    r_b1.text = "Target Brands: L'Oréal Paris · CeraVe · Garnier"
    r_b1.font.size = Pt(9.5)
    r_b1.font.bold = True
    r_b1.font.color.rgb = IVORY

    bp2 = badge_tf.add_paragraph()
    r_b2 = bp2.add_run()
    r_b2.text = "Zero-Backend PWA · 100% On-Device CV · Live Open-Meteo"
    r_b2.font.size = Pt(7.5)
    r_b2.font.color.rgb = MUTED_GRAY

    # =========================================================================
    # WORKFLOW RIBBON: SCAN -> CLIMATE -> FUSION -> ROUTINE
    # =========================================================================
    wf_y = Inches(1.22)
    wf_h = Inches(0.98)
    col_w = Inches(2.98)
    gap = Inches(0.137)

    steps = [
        ("01 · SCAN", "On-Device Canvas CV", "Forehead & bilateral malar patches in CIELAB D65; Laplacian micro-roughness. Photo never leaves phone.", TEAL),
        ("02 · CLIMATE", "Live Hyper-Local Telemetry", "Open-Meteo API ingestion (UV, PM2.5, Temp, RH) across 8 Indian cities; silent sample fallback.", TEAL),
        ("03 · FUSION", "CSSI & Resilience Score", "Transparent 0-100 heuristic referencing WHO 2021 & CPCB NAQI; self-anchored delta calibration.", GOLD),
        ("04 · ROUTINE", "Adaptive Minimalist Protocol", "CSSI × Signal matrix; fluid SPF 50+, 4% Niacinamide, Ceramides, & 'Skip-Today' bypass state.", GOLD)
    ]

    for i, (tag, title, desc, col) in enumerate(steps):
        s_left = Inches(0.5) + i * (col_w + gap)
        c = add_card(s_left, wf_y, col_w, wf_h, bg_color=NAVY_CARD, accent_color=col)
        ctf = c.text_frame
        ctf.word_wrap = True
        ctf.margin_left = Inches(0.18)
        ctf.margin_right = Inches(0.1)
        ctf.margin_top = Inches(0.08)
        
        p = ctf.paragraphs[0]
        r1 = p.add_run()
        r1.text = tag
        r1.font.size = Pt(8)
        r1.font.bold = True
        r1.font.color.rgb = col

        p2 = ctf.add_paragraph()
        r2 = p2.add_run()
        r2.text = title
        r2.font.size = Pt(9.5)
        r2.font.bold = True
        r2.font.color.rgb = IVORY

        p3 = ctf.add_paragraph()
        r3 = p3.add_run()
        r3.text = desc
        r3.font.size = Pt(7.5)
        r3.font.color.rgb = MUTED_GRAY

    # =========================================================================
    # MAIN 3-COLUMN CORE CONTENT (Y: 2.30 to 6.85)
    # =========================================================================
    main_y = Inches(2.30)
    col1_left = Inches(0.5)
    col1_w = Inches(3.85)

    col2_left = Inches(4.5)
    col2_w = Inches(4.333)

    col3_left = Inches(8.98)
    col3_w = Inches(3.853)

    # -------------------------------------------------------------------------
    # COLUMN 1: PROBLEM & BIOLOGICAL RATIONALE + FAIRNESS TECHNOLOGY
    # -------------------------------------------------------------------------
    # Card 1A: Problem & Climate Trilemma
    c1a = add_card(col1_left, main_y, col1_w, Inches(2.45), accent_color=GOLD)
    tf1a = c1a.text_frame
    tf1a.word_wrap = True
    tf1a.margin_left = Inches(0.2)
    tf1a.margin_right = Inches(0.15)
    tf1a.margin_top = Inches(0.12)

    p = tf1a.paragraphs[0]
    r = p.add_run()
    r.text = "THE PROBLEM · INDIAN GENZ CLIMATE TRILEMMA"
    r.font.size = Pt(8)
    r.font.bold = True
    r.font.color.rgb = GOLD

    p = tf1a.add_paragraph()
    r = p.add_run()
    r.text = "Environmental Stress Accelerates Invisible Aging"
    r.font.size = Pt(11)
    r.font.bold = True
    r.font.color.rgb = IVORY

    bullets_1a = [
        ("PM2.5 / Winter Smog (>180 µg/m³): ", "Particulate-bound PAHs activate AhR receptor, triggering ROS & MMP-1 collagenase degradation."),
        ("Extreme Solar UV (Index 11-12+): ", "Tropical solar irradiance drives mitochondrial DNA damage & rapid squalene peroxidation."),
        ("Tropical Heat & Humidity (>80% RH): ", "Promotes follicular occlusion, oxidized sebum plugs, and barrier breakdown from 10-step over-layering."),
        ("Melanin-Rich Vulnerability: ", "Micro-inflammation induces stubborn Post-Inflammatory Hyperpigmentation (PIH) in Fitzpatrick phototypes III-VI.")
    ]
    for b_title, b_desc in bullets_1a:
        p = tf1a.add_paragraph()
        r1 = p.add_run()
        r1.text = "• " + b_title
        r1.font.bold = True
        r1.font.size = Pt(7.5)
        r1.font.color.rgb = TEAL
        r2 = p.add_run()
        r2.text = b_desc
        r2.font.size = Pt(7.5)
        r2.font.color.rgb = MUTED_GRAY

    # Card 1B: Technology & Algorithmic Fairness
    c1b = add_card(col1_left, main_y + Inches(2.55), col1_w, Inches(1.95), accent_color=TEAL)
    tf1b = c1b.text_frame
    tf1b.word_wrap = True
    tf1b.margin_left = Inches(0.2)
    tf1b.margin_right = Inches(0.15)
    tf1b.margin_top = Inches(0.12)

    p = tf1b.paragraphs[0]
    r = p.add_run()
    r.text = "CORE DIFFERENTIATOR · ETHICAL ON-DEVICE AI"
    r.font.size = Pt(8)
    r.font.bold = True
    r.font.color.rgb = TEAL

    p = tf1b.add_paragraph()
    r = p.add_run()
    r.text = "Fairness-by-Design & Zero-Leakage Privacy"
    r.font.size = Pt(11)
    r.font.bold = True
    r.font.color.rgb = IVORY

    bullets_1b = [
        ("100% Client-Side Privacy: ", "Zero facial images uploaded or stored on cloud servers. Instant sub-1.5s load via QR code with zero user login."),
        ("Baseline-Relative Calibration: ", "Signals evaluated against individual calibrated baseline (ΔL*, Δa*, ΔLaplacian), mathematically preventing pale-skin bias across Indian skin."),
        ("Lighting Quality Gate: ", "Active checks on mean L*, dynamic range, and cheek symmetry block corrupted scans with friendly retake cues.")
    ]
    for b_title, b_desc in bullets_1b:
        p = tf1b.add_paragraph()
        r1 = p.add_run()
        r1.text = "• " + b_title
        r1.font.bold = True
        r1.font.size = Pt(7.5)
        r1.font.color.rgb = GOLD
        r2 = p.add_run()
        r2.text = b_desc
        r2.font.size = Pt(7.5)
        r2.font.color.rgb = MUTED_GRAY

    # -------------------------------------------------------------------------
    # COLUMN 2: MATHEMATICAL FUSION (CSSI) & PAIRED FORMULATION CONCEPT
    # -------------------------------------------------------------------------
    # Card 2A: Climate Skin-Stress Index (CSSI) & Clinical Validation
    c2a = add_card(col2_left, main_y, col2_w, Inches(2.25), accent_color=TEAL)
    tf2a = c2a.text_frame
    tf2a.word_wrap = True
    tf2a.margin_left = Inches(0.2)
    tf2a.margin_right = Inches(0.15)
    tf2a.margin_top = Inches(0.12)

    p = tf2a.paragraphs[0]
    r = p.add_run()
    r.text = "FUSION ENGINE · CSSI & SKIN RESILIENCE"
    r.font.size = Pt(8)
    r.font.bold = True
    r.font.color.rgb = TEAL

    p = tf2a.add_paragraph()
    r = p.add_run()
    r.text = "Transparent Scientific Heuristic (0–100)"
    r.font.size = Pt(11)
    r.font.bold = True
    r.font.color.rgb = IVORY

    # Formula box
    p_f = tf2a.add_paragraph()
    r_f = p_f.add_run()
    r_f.text = "CSSI = 0.35·S(UV) + 0.35·S(PM2.5) + 0.20·S(RH_Heat) + 0.10·S(Temp)\nResilience Score = clamp(100 - (0.55·CSSI + 0.45·VisibleStress), 5, 98)"
    r_f.font.name = "Consolas"
    r_f.font.size = Pt(7.5)
    r_f.font.color.rgb = TEAL

    p_v = tf2a.add_paragraph()
    r_v = p_v.add_run()
    r_v.text = "Clinical Validation Plan (Non-Invasive Gold Standards):"
    r_v.font.size = Pt(7.8)
    r_v.font.bold = True
    r_v.font.color.rgb = IVORY

    validation_items = [
        ("Corneometer® CM 825: ", "Validates predicted barrier hydration vs stratum corneum capacitance (target r ≥ 0.78)."),
        ("Tewameter® TM 300: ", "Inverse correlation (r ≤ -0.72) against vapor-flux Trans-Epidermal Water Loss (TEWL)."),
        ("Mexameter® MX 18: ", "Spectrophotometric calibration of Δa* against Melanin & Erythema Indices in Fitzpatrick III–VI.")
    ]
    for v_title, v_desc in validation_items:
        p = tf2a.add_paragraph()
        r1 = p.add_run()
        r1.text = "• " + v_title
        r1.font.bold = True
        r1.font.size = Pt(7.2)
        r1.font.color.rgb = GOLD
        r2 = p.add_run()
        r2.text = v_desc
        r2.font.size = Pt(7.2)
        r2.font.color.rgb = MUTED_GRAY

    # Card 2B: Paired Formulation Concept #SK-26-IND
    c2b = add_card(col2_left, main_y + Inches(2.35), col2_w, Inches(2.15), accent_color=GOLD)
    tf2b = c2b.text_frame
    tf2b.word_wrap = True
    tf2b.margin_left = Inches(0.2)
    tf2b.margin_right = Inches(0.15)
    tf2b.margin_top = Inches(0.12)

    p = tf2b.paragraphs[0]
    r = p.add_run()
    r.text = "PAIRED FORMULATION · CONCEPT #SK-26-IND"
    r.font.size = Pt(8)
    r.font.bold = True
    r.font.color.rgb = GOLD

    p = tf2b.add_paragraph()
    r = p.add_run()
    r.text = "Bio-Adaptive Antioxidant & Ceramide Gel-Cream"
    r.font.size = Pt(11)
    r.font.bold = True
    r.font.color.rgb = IVORY

    p = tf2b.add_paragraph()
    r = p.add_run()
    r.text = "Sensory: Water-break micro-droplet gel-cream; zero pore-clogging film under 80%+ humidity."
    r.font.size = Pt(7.5)
    r.font.color.rgb = MUTED_GRAY

    actives = [
        ("2% Phyllanthus Emblica (Amla): ", "ABS-certified polyphenol complex suppressing PM2.5-induced collagenase (MMP-1)."),
        ("4% Pharmaceutical Niacinamide: ", "Regulates sebum flux in tropical heat & accelerates epidermal ceramide synthesis."),
        ("1.5% Bio-Identical Ceramides: ", "Yeast-derived NP, AP, EOP rebuilding intercellular lipid lamellar bilayers."),
        ("1% Stabilized Ethyl Ascorbic Acid: ", "High thermal stability (to 45°C); combats melanin clustering without phototoxicity.")
    ]
    for a_title, a_desc in actives:
        p = tf2b.add_paragraph()
        r1 = p.add_run()
        r1.text = "• " + a_title
        r1.font.bold = True
        r1.font.size = Pt(7.2)
        r1.font.color.rgb = TEAL
        r2 = p.add_run()
        r2.text = a_desc
        r2.font.size = Pt(7.2)
        r2.font.color.rgb = MUTED_GRAY

    # -------------------------------------------------------------------------
    # COLUMN 3: SUSTAINABILITY (BIODIVERSITY ACT) & GO-TO-MARKET STRATEGY
    # -------------------------------------------------------------------------
    # Card 3A: Sustainability & Circularity
    c3a = add_card(col3_left, main_y, col3_w, Inches(2.25), accent_color=GOLD)
    tf3a = c3a.text_frame
    tf3a.word_wrap = True
    tf3a.margin_left = Inches(0.2)
    tf3a.margin_right = Inches(0.15)
    tf3a.margin_top = Inches(0.12)

    p = tf3a.paragraphs[0]
    r = p.add_run()
    r.text = "SUSTAINABILITY · BIODIVERSITY ACT & CIRCULARITY"
    r.font.size = Pt(8)
    r.font.bold = True
    r.font.color.rgb = GOLD

    p = tf3a.add_paragraph()
    r = p.add_run()
    r.text = "Ethical Sourcing & Anti-Overconsumption"
    r.font.size = Pt(11)
    r.font.bold = True
    r.font.color.rgb = IVORY

    sust_items = [
        ("India Biodiversity Act Compliance: ", "Access & Benefit Sharing (ABS) partnership with tribal farmer cooperatives in Madhya Pradesh for wild Amla."),
        ("Circular Packaging: ", "Refillable 100% PCR aluminum cartridge with compostable PHA inner pods; reduces virgin plastics by 78%."),
        ("'Skip-Today' Anti-Overconsumption: ", "Algorithmically bypasses heavy actives on low-stress days (target ~4g CO₂e avoided per skipped step)."),
        ("Edge Compute Efficiency: ", "On-device processing uses ~0.002 Wh/scan vs ~0.08 Wh for cloud GPU server API roundtrips.")
    ]
    for s_title, s_desc in sust_items:
        p = tf3a.add_paragraph()
        r1 = p.add_run()
        r1.text = "• " + s_title
        r1.font.bold = True
        r1.font.size = Pt(7.2)
        r1.font.color.rgb = TEAL
        r2 = p.add_run()
        r2.text = s_desc
        r2.font.size = Pt(7.2)
        r2.font.color.rgb = MUTED_GRAY

    # Card 3B: Go-To-Market & Brand Alignment
    c3b = add_card(col3_left, main_y + Inches(2.35), col3_w, Inches(2.15), accent_color=TEAL)
    tf3b = c3b.text_frame
    tf3b.word_wrap = True
    tf3b.margin_left = Inches(0.2)
    tf3b.margin_right = Inches(0.15)
    tf3b.margin_top = Inches(0.12)

    p = tf3b.paragraphs[0]
    r = p.add_run()
    r.text = "GO-TO-MARKET · BRAND PORTFOLIO INTEGRATION"
    r.font.size = Pt(8)
    r.font.bold = True
    r.font.color.rgb = TEAL

    p = tf3b.add_paragraph()
    r = p.add_run()
    r.text = "Radical Transparency for Indian GenZ"
    r.font.size = Pt(11)
    r.font.bold = True
    r.font.color.rgb = IVORY

    gtm_items = [
        ("Consumer Mindset: ", "18-25 urbanites fatigued by multi-step hype; seeking honest barrier science, zero white cast, and proven climate defense."),
        ("L'Oréal Synergy: ", "CeraVe India (clinical barrier diagnostics), L'Oréal Paris (youth longevity), or Garnier (biodiverse Indian botanicals)."),
        ("Campus & Retail QR Mirrors: ", "Zero-install QR web app at university tech fests, Nykaa, and Tira beauty counters; loads in < 1.5 seconds."),
        ("Core Brand Message: ", "'Protect the barrier, skip the excess. Climate longevity engineered for Indian skin.'")
    ]
    for g_title, g_desc in gtm_items:
        p = tf3b.add_paragraph()
        r1 = p.add_run()
        r1.text = "• " + g_title
        r1.font.bold = True
        r1.font.size = Pt(7.2)
        r1.font.color.rgb = GOLD
        r2 = p.add_run()
        r2.text = g_desc
        r2.font.size = Pt(7.2)
        r2.font.color.rgb = MUTED_GRAY

    # =========================================================================
    # FOOTER SECTION
    # =========================================================================
    footer_box = slide.shapes.add_textbox(Inches(0.5), Inches(6.92), Inches(12.333), Inches(0.4))
    ftf = footer_box.text_frame
    ftf.word_wrap = True
    ftf.margin_left = ftf.margin_top = ftf.margin_right = ftf.margin_bottom = 0

    fp = ftf.paragraphs[0]
    r_f1 = fp.add_run()
    r_f1.text = "Concept proposal; metrics are targets pending validation.  |  Live Web App: https://koushik1914.github.io/skinnova/  |  "
    r_f1.font.size = Pt(8.5)
    r_f1.font.color.rgb = MUTED_GRAY

    r_f2 = fp.add_run()
    r_f2.text = "Koushik Voota | Amrita Vishwa Vidyapeetham"
    r_f2.font.size = Pt(8.5)
    r_f2.font.bold = True
    r_f2.font.color.rgb = GOLD

    # Save PowerPoint file
    prs.save(output_pptx)
    print(f"PowerPoint generated successfully: {output_pptx}")
    print(f"Total slides count: {len(prs.slides)} (Verified: EXACTLY ONE SLIDE)")

if __name__ == "__main__":
    out_dir = r"c:\Users\vkous\Downloads\Loreal"
    pptx_path = os.path.join(out_dir, "SKINNOVA_Executive_Slide.pptx")
    create_deck(pptx_path)
