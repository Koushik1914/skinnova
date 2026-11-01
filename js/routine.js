/**
 * SKINNOVA - Adaptive Routine & Cosmetic Science Engine
 * Minimalist, climate-responsive barrier longevity protocols for Indian GenZ
 * 
 * Clinical Formulation Philosophy:
 * - Counteracts pollution-induced squalene peroxidation and oxidative degradation.
 * - Prevents Post-Inflammatory Hyperpigmentation (PIH) prevalent in Fitzpatrick III–VI.
 * - Prioritises breathable, humidity-stable gel-creams over occlusive heavy waxes.
 * - "Skip-Today" anti-overconsumption algorithm minimizes excessive cosmetic layering.
 */

export const PAIRED_FORMULATION_CONCEPT = {
  code: "CONCEPT #SK-26-IND",
  name: "Bio-Adaptive Antioxidant & Ceramide Barrier Gel-Cream",
  badge: "Concept, not a product",
  targetAudience: "Indian GenZ urban skin under combined humidity, UV and particulate stress",
  texture: "Micro-droplet water-break gel-cream; zero pore-clogging film; rapid absorption under 80%+ humidity",
  keyActives: [
    {
      name: "Phyllanthus Emblica (Amla) Polyphenol Complex (2%)",
      origin: "Ethically wild-harvested under Indian Biological Diversity Act (Access & Benefit Sharing)",
      action: "Broad-spectrum oxidative neutraliser, suppresses particulate-matter (PM2.5) induced MMP-1 collagenase."
    },
    {
      name: "Clinical Niacinamide (4%)",
      origin: "Synthetic pharmaceutical grade",
      action: "Stimulates endogenous ceramide synthesis, regulates excessive sebum flux in tropical heat."
    },
    {
      name: "Bio-Identical Ceramide Matrix (NP, AP, EOP) + Phytosphingosine (1.5%)",
      origin: "Yeast-fermentation derived",
      action: "Rebuilds lipid lamellae damaged by particulate exposure and trans-epidermal water loss."
    },
    {
      name: "3-O-Ethyl Ascorbic Acid (1%)",
      origin: "Stabilized Vitamin C derivative",
      action: "High thermal stability (tested to 45°C); combats melanin clustering without photo-sensitization."
    }
  ],
  sustainabilityAttributes: [
    "Cold-process emulsification (reduces manufacturing thermal energy by 42%)",
    "Formulated in refillable 100% PCR aluminum cartridge with airless pump",
    "Biodegradable rheology modifier replacing petrochemical carbomers"
  ]
};

/**
 * Generate Adaptive Routine based on CSSI Band and Dominant Skin Signal
 */
export function generateAdaptiveRoutine(cssi, skinSignals) {
  const band = cssi.band; // 'Low' | 'Moderate' | 'High' | 'Very High'
  const dominantId = skinSignals.dominantSignal?.id || 'dullness';

  let isSkipTodayActive = false;
  let avoidedStepsCount = 0;
  let climateNotice = "";
  let indianContextNotes = [];

  // Base ingredient steps
  const amSteps = [];
  const pmSteps = [];

  // Indian Climate Contextual Insights
  if (cssi.components.rhHeat.score > 60) {
    indianContextNotes.push("High heat-humidity index: switch from rich creams to fluid gel-creams to prevent follicular occlusion and Malassezia overgrowth.");
  }
  if (cssi.components.uv.raw >= 7) {
    indianContextNotes.push("High UV index peak (11:00 AM - 3:30 PM): reapply sunscreen every 2.5 hours. Select invisible non-whitening fluid filters for deep skin tones.");
  }
  if (cssi.components.pm25.raw > 100) {
    indianContextNotes.push("High PM2.5 particulate load: double-cleanse in evening using a gentle non-stripping syndet to dissolve lipid-bound toxic PAHs (Polycyclic Aromatic Hydrocarbons).");
  }

  // 1. LOW STRESS CLIMATE (Clean air, low UV, temperate) -> "SKIP-TODAY" STATE
  if (band === "Low") {
    isSkipTodayActive = true;
    avoidedStepsCount = 2; // Avoided heavy barrier cream and strong daytime antioxidants
    climateNotice = "Low climate stress today. Your skin barrier does not require aggressive defense layering. Practice minimalist longevity.";

    amSteps.push(
      {
        order: 1,
        step: "Splash / Micellar Cleanse",
        ingredientClass: "Hypoallergenic Ambient Rinse",
        productDescription: "Lukewarm water or pH 5.5 micellar fluid",
        why: "Preserves natural acid mantle lipids; avoids stripping natural moisturising factors (NMF).",
        skipped: false
      },
      {
        order: 2,
        step: "Broad-Spectrum Photoprotection",
        ingredientClass: "Lightweight Daily SPF 30 PA+++",
        productDescription: "Fluid non-greasy sunscreen with hybrid UV filters",
        why: "Essential baseline photoprotection against UVA-mediated collagen degradation.",
        skipped: false
      },
      {
        order: 3,
        step: "Heavy Daytime Antioxidant Serum",
        ingredientClass: "Skipped for skin rest",
        productDescription: "Product step bypassed",
        why: "Skipped today: ambient free-radical levels are below stress thresholds. Reduces chemical load.",
        skipped: true
      }
    );

    pmSteps.push(
      {
        order: 1,
        step: "Mild Syndet Cleanser",
        ingredientClass: "Sulfate-Free Amino Acid Cleanser",
        productDescription: "Gentle foaming gel at pH 5.5",
        why: "Removes sunscreen film without disrupting stratum corneum barrier lipids.",
        skipped: false
      },
      {
        order: 2,
        step: "Light Hydrating Gel",
        ingredientClass: "Hyaluronic Acid + Panthenol (Pro-Vitamin B5)",
        productDescription: "Oil-free humectant lotion",
        why: "Restores nocturnal water reserves without heavy occlusives.",
        skipped: false
      },
      {
        order: 3,
        step: "Concentrated Barrier Repair Cream",
        ingredientClass: "Skipped for skin rest",
        productDescription: "Heavy occlusive bypassed",
        why: "Skipped today: skin barrier intact under low ambient stress. Allows natural lipid secretion.",
        skipped: true
      }
    );
  }

  // 2. MODERATE STRESS CLIMATE
  else if (band === "Moderate") {
    climateNotice = "Moderate climate stress detected. Standard barrier maintenance with targeted active support.";

    amSteps.push(
      {
        order: 1,
        step: "Gentle Cleanser",
        ingredientClass: "pH 5.5 Non-Stripping Syndet",
        productDescription: "Sulfate-free oat or amino acid wash",
        why: "Prepares skin surface without stripping epidermal ceramides.",
        skipped: false
      },
      {
        order: 2,
        step: "Barrier Stabiliser Serum",
        ingredientClass: "3% Niacinamide + Zinc PCA",
        productDescription: "Water-based balancing fluid",
        why: "Fortifies epidermal barrier synthesis and moderates sebum under urban exposure.",
        skipped: false
      },
      {
        order: 3,
        step: "Daily Broad-Spectrum Defense",
        ingredientClass: "Broad-Spectrum SPF 50 PA++++",
        productDescription: "Ultra-lightweight invisible fluid with no white cast",
        why: "Shields against solar erythema and pigmentation flare-ups in tropical light.",
        skipped: false
      }
    );

    pmSteps.push(
      {
        order: 1,
        step: "Evening Cleansing",
        ingredientClass: "Gentle Lipid-Solubilising Wash",
        productDescription: "Mild surfactant cleanse",
        why: "Extracts fine particulate dust and sunscreen residue thoroughly.",
        skipped: false
      },
      {
        order: 2,
        step: "Ceramide Moisture Shield",
        ingredientClass: "Multi-Ceramide NP/AP + Hyaluronic Gel-Cream",
        productDescription: "Fast-absorbing light barrier emulsion",
        why: "Re-aligns intracellular lipid bilayer for overnight moisture retention.",
        skipped: false
      }
    );
  }

  // 3. HIGH TO VERY HIGH STRESS CLIMATE (Smog, High UV, Coastal Heat)
  else {
    climateNotice = "Elevated climate assault (heavy particulate / intense UV). Intensive barrier interception required.";

    // Customise step 2 based on dominant skin signal
    let targetedAmActive = {
      name: "Stabilized Antioxidant Shield",
      class: "Phyllanthus Emblica (Amla) + Ethyl Ascorbic Acid (10%)",
      desc: "High-potency botanical-synthetic antioxidant fluid",
      why: "Neutralises reactive oxygen species (ROS) triggered by PM2.5 and urban ozone."
    };

    if (dominantId === 'redness') {
      targetedAmActive = {
        name: "Micro-Vascular Calming Actives",
        class: "Centella Asiatica (Madecassoside) + 4% Niacinamide",
        desc: "Soothing anti-erythema serum",
        why: "Subdues micro-capillary vasodilation and down-regulates inflammatory cytokines."
      };
    } else if (dominantId === 'shine') {
      targetedAmActive = {
        name: "Sebum-Balancing Antioxidant",
        class: "4% Niacinamide + Green Tea Polyphenols + Zinc PCA",
        desc: "Matte sebum-normalising serum",
        why: "Suppresses lipid peroxidation in oxidized sebum plugs during humid pollution."
      };
    } else if (dominantId === 'texture') {
      targetedAmActive = {
        name: "Micro-Smooth Barrier Replenisher",
        class: "Polyhydroxy Acid (PHA Gluconolactone 3%) + Ectoin",
        desc: "Non-irritating osmotic protectant",
        why: "Shields keratinocytes against osmotic cellular shrinkage caused by desiccating particulate air."
      };
    }

    amSteps.push(
      {
        order: 1,
        step: "Gentle Cleanse",
        ingredientClass: "pH 5.5 Syndet Cleanser",
        productDescription: "Non-stripping hydrating gel wash",
        why: "Clears night-time sebum without degrading protective lipid envelope.",
        skipped: false
      },
      {
        order: 2,
        step: targetedAmActive.name,
        ingredientClass: targetedAmActive.class,
        productDescription: targetedAmActive.desc,
        why: targetedAmActive.why,
        skipped: false
      },
      {
        order: 3,
        step: "Anti-Pollution Photoprotection",
        ingredientClass: "Broad-Spectrum SPF 50+ PA++++ with Anti-Adhesion Film",
        productDescription: "Dry-touch sunscreen forming an invisible breathable particulate barrier",
        why: "Physically hinders PM2.5 adhesion while neutralizing deep-penetrating UVA1 radiation.",
        skipped: false
      }
    );

    pmSteps.push(
      {
        order: 1,
        step: "Double Purifying Cleanse",
        ingredientClass: "Non-comedogenic Cleansing Emulsion + Foaming Syndet",
        productDescription: "Two-stage gentle particulate dissolution",
        why: "Essential to remove lipophilic PM2.5/PM10 toxic hydrocarbons without barrier irritation.",
        skipped: false
      },
      {
        order: 2,
        step: "Intensive Barrier Reconstruction",
        ingredientClass: "Bio-Identical Ceramide Complex (NP/AP/EOP 2%) + Ectoin (1%)",
        productDescription: "Barrier repair gel-cream with water-break technology",
        why: "Counteracts trans-epidermal water loss and resets stratum corneum lamellar structure.",
        skipped: false
      }
    );
  }

  return {
    cssiBand: band,
    isSkipTodayActive,
    avoidedStepsCount,
    climateNotice,
    indianContextNotes,
    amSteps,
    pmSteps,
    pairedFormulation: PAIRED_FORMULATION_CONCEPT
  };
}
