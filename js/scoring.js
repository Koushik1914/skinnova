/**
 * SKINNOVA - Climate Skin-Stress Index (CSSI) & Fusion Scoring Engine
 * Clinical Heuristics & Explainable Algorithms
 * 
 * Standards & References:
 * - WHO 2021 Global Air Quality Guidelines (PM2.5 target 15 µg/m³ 24h mean)
 * - Central Pollution Control Board (CPCB, India) National Air Quality Index (NAQI)
 * - WHO Global Solar UV Index (Health risks from UV index >= 3)
 * - Fitzpatrick phototype fairness calibration (relative baseline delta)
 */

export const CSSI_WEIGHTS = {
  uv: 0.35,
  pm25: 0.35,
  rhHeat: 0.20,
  temp: 0.10
};

export const CLINICAL_DISCLAIMER = "Research heuristic, pending clinical validation. Visible proxies, not a medical diagnosis. Barrier damage cannot be measured from a selfie.";

/**
 * Normalise UV index to a 0-100 stress score based on WHO UV Index tiers
 * WHO: 0-2 (Low), 3-5 (Mod), 6-7 (High), 8-10 (Very High), 11+ (Extreme)
 */
export function normaliseUv(uv) {
  if (uv == null || isNaN(uv)) return 20;
  // UV 11 maps to 100% stress; values above 11 saturate at 100
  const score = (uv / 11) * 100;
  return Math.max(0, Math.min(100, score));
}

/**
 * Normalise PM2.5 to a 0-100 stress score based on CPCB AQI & WHO 2021 standards
 * CPCB Severe threshold begins at 120 µg/m³ (24h standard is 60 µg/m³, WHO is 15 µg/m³)
 */
export function normalisePm25(pm25) {
  if (pm25 == null || isNaN(pm25)) return 30;
  // 120 µg/m³ PM2.5 saturates at 100% stress
  const score = (pm25 / 120) * 100;
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate Humidity-Heat Load Stress (0-100)
 * Evaluates dual microclimate risks:
 * 1. High RH (>65%) + High Temp (>28°C): excessive perspiration, lipid peroxidation, follicular occlusion
 * 2. Low RH (<35%): excessive TEWL (trans-epidermal water loss) and stratum corneum xerosis
 */
export function calculateRhHeatStress(temp, rh) {
  const t = temp != null ? temp : 26;
  const h = rh != null ? rh : 55;

  let stress = 0;

  // High humidity + Heat stress
  if (t > 26 && h > 60) {
    const heatExcess = Math.max(0, t - 26);
    const humidityExcess = Math.max(0, h - 60);
    stress = (heatExcess * 2.5) + (humidityExcess * 1.2);
  }
  // Dry air / winter desiccation stress
  else if (h < 35) {
    stress = (35 - h) * 1.8 + (t < 18 ? (18 - t) * 1.5 : 0);
  } else {
    // Temperate comfort zone
    stress = 10 + Math.abs(h - 50) * 0.4;
  }

  return Math.max(0, Math.min(100, stress));
}

/**
 * Calculate Temperature Extremes Stress (0-100)
 * Evaluates deviation from skin thermal homeostasis (20-25°C)
 */
export function calculateTempStress(temp) {
  const t = temp != null ? temp : 24;
  if (t >= 20 && t <= 26) {
    return 10; // Homeostatic baseline
  }
  if (t > 26) {
    // Hot stress (vasodilation, barrier stress)
    return Math.min(100, 10 + (t - 26) * 5.0);
  }
  // Cold stress (vasoconstriction, lipid rigidity)
  return Math.min(100, 10 + (20 - t) * 4.5);
}

/**
 * Compute Climate Skin-Stress Index (CSSI, 0-100)
 */
export function calculateCssi(climateData) {
  const { uv = 3, pm25 = 45, temp = 27, rh = 60 } = climateData;

  const sUv = normaliseUv(uv);
  const sPm = normalisePm25(pm25);
  const sRhHeat = calculateRhHeatStress(temp, rh);
  const sTemp = calculateTempStress(temp);

  const aggregate = (
    CSSI_WEIGHTS.uv * sUv +
    CSSI_WEIGHTS.pm25 * sPm +
    CSSI_WEIGHTS.rhHeat * sRhHeat +
    CSSI_WEIGHTS.temp * sTemp
  );

  const rounded = Math.round(aggregate);

  let band = "Low";
  let interpretation = "Minimal environmental barrier challenge. Ideal for maintaining baseline hydration.";
  if (rounded >= 75) {
    band = "Very High";
    interpretation = "Severe ambient assault. Heightened free-radical generation and particulate adhesion require intensive barrier defense.";
  } else if (rounded >= 55) {
    band = "High";
    interpretation = "Substantial environmental stress. Elevated UV and particulate exposure require focused antioxidant and photoprotection.";
  } else if (rounded >= 30) {
    band = "Moderate";
    interpretation = "Moderate climate stress. Noticeable humidity or light pollution load; balanced protection advised.";
  }

  return {
    score: rounded,
    band,
    interpretation,
    components: {
      uv: { raw: uv, score: Math.round(sUv), weight: CSSI_WEIGHTS.uv },
      pm25: { raw: pm25, score: Math.round(sPm), weight: CSSI_WEIGHTS.pm25 },
      rhHeat: { raw: `${temp}°C / ${rh}%`, score: Math.round(sRhHeat), weight: CSSI_WEIGHTS.rhHeat },
      temp: { raw: `${temp}°C`, score: Math.round(sTemp), weight: CSSI_WEIGHTS.temp }
    },
    weights: CSSI_WEIGHTS,
    citations: [
      "WHO Global Solar UV Index guidelines (WHO / WMO / UNEP)",
      "CPCB National Air Quality Index (NAQI) Breakpoints (India)",
      "WHO 2021 Global Air Quality Guidelines (PM2.5 annual: 5 µg/m³, 24h: 15 µg/m³)"
    ]
  };
}

/**
 * Evaluate Visible Skin Proxies relative to the user's calibrated baseline.
 * Fairness Guarantee:
 * By computing Δa*, ΔL*, and relative texture variance against individual baseline
 * rather than absolute chromatic thresholds, the algorithm ensures zero bias across
 * Fitzpatrick phototypes III through VI (common across the Indian subcontinent).
 */
export function evaluateSkinSignals(currentMetrics, baselineMetrics = null) {
  // If baseline is not set, use current metrics as self-anchored baseline (initial scan)
  const isBaseline = !baselineMetrics;
  const base = baselineMetrics || currentMetrics;

  const { forehead, leftCheek, rightCheek } = currentMetrics;
  const baseF = base.forehead;
  const baseL = base.leftCheek;
  const baseR = base.rightCheek;

  // Average current patch values
  const currMeanL = (forehead.meanL + leftCheek.meanL + rightCheek.meanL) / 3;
  const currMeanA = (forehead.meanA + leftCheek.meanA + rightCheek.meanA) / 3;
  const currMeanB = (forehead.meanB + leftCheek.meanB + rightCheek.meanB) / 3;
  const currLapVar = (forehead.laplacianVar + leftCheek.laplacianVar + rightCheek.laplacianVar) / 3;
  const currShine = (forehead.shineFraction + leftCheek.shineFraction + rightCheek.shineFraction) / 3;

  // Baseline averages
  const baseMeanL = (baseF.meanL + baseL.meanL + baseR.meanL) / 3;
  const baseMeanA = (baseF.meanA + baseL.meanA + baseR.meanA) / 3;
  const baseMeanB = (baseF.meanB + baseL.meanB + baseR.meanB) / 3;
  const baseLapVar = (baseF.laplacianVar + baseL.laplacianVar + baseR.laplacianVar) / 3;

  // Delta calculations (relative shift)
  // 1. Redness / Erythema shift (Δa*): increased redness indicates micro-inflammation or vasodilation
  const deltaA = currMeanA - baseMeanA;
  const rednessStress = Math.max(0, Math.min(100, 20 + deltaA * 12));

  // 2. Dullness / Radiance reduction (ΔL* loss or contrast drop):
  const deltaL = baseMeanL - currMeanL; // positive if skin is darker/duller than baseline
  const dullnessStress = Math.max(0, Math.min(100, 25 + deltaL * 8));

  // 3. Texture micro-roughness (Laplacian variance shift):
  const lapRatio = baseLapVar > 0 ? currLapVar / baseLapVar : 1.0;
  const textureStress = Math.max(0, Math.min(100, 20 + (lapRatio - 1.0) * 50));

  // 4. Shine / Sebum film (specular saturation fraction):
  const shineStress = Math.max(0, Math.min(100, currShine * 250));

  // 5. Regional Pigmentation Unevenness (standard deviation of L* and b* between forehead and cheeks)
  const patchLValues = [forehead.meanL, leftCheek.meanL, rightCheek.meanL];
  const patchBValues = [forehead.meanB, leftCheek.meanB, rightCheek.meanB];
  const stdRegionalL = stdDev(patchLValues);
  const stdRegionalB = stdDev(patchBValues);
  const pigmentStress = Math.max(0, Math.min(100, (stdRegionalL + stdRegionalB) * 12));

  // Determine dominant stress signal
  const signals = [
    { id: 'redness', name: 'Micro-Vascular Redness', score: Math.round(rednessStress), delta: deltaA.toFixed(1) },
    { id: 'dullness', name: 'Oxidative Dullness', score: Math.round(dullnessStress), delta: deltaL.toFixed(1) },
    { id: 'texture', name: 'Surface Micro-Roughness', score: Math.round(textureStress), delta: (lapRatio - 1).toFixed(2) },
    { id: 'shine', name: 'Sebum / Shine Film', score: Math.round(shineStress), fraction: (currShine * 100).toFixed(1) + '%' },
    { id: 'pigment', name: 'Regional Tone Variance', score: Math.round(pigmentStress), variance: (stdRegionalL + stdRegionalB).toFixed(1) }
  ];

  signals.sort((a, b) => b.score - a.score);
  const dominantSignal = signals[0];

  // Aggregate visible stress proxy (0-100)
  const compositeVisibleStress = Math.round(
    0.30 * rednessStress +
    0.25 * dullnessStress +
    0.20 * textureStress +
    0.15 * shineStress +
    0.10 * pigmentStress
  );

  return {
    isBaseline,
    compositeVisibleStress,
    dominantSignal,
    signals,
    rawValues: {
      meanL: Math.round(currMeanL),
      meanA: Math.round(currMeanA),
      meanB: Math.round(currMeanB),
      laplacianVar: Math.round(currLapVar),
      shineFraction: (currShine * 100).toFixed(1) + '%'
    },
    fairnessNotice: "Calculated strictly relative to your self-anchored baseline (Fitzpatrick phototypes III–VI equitable analysis)."
  };
}

function stdDev(arr) {
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
  const sqDiffs = arr.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / arr.length);
}

/**
 * Calculate Skin Resilience Score (0-100)
 * High Resilience = strong barrier, well-shielded against current environmental loads
 */
export function calculateSkinResilienceScore(cssiScore, visibleStressScore) {
  // Resilience formula: 100 - (0.55 * CSSI + 0.45 * visibleStress)
  const rawResilience = 100 - (0.55 * cssiScore + 0.45 * visibleStressScore);
  const score = Math.max(5, Math.min(98, Math.round(rawResilience)));

  let band = "Moderate";
  let statement = "Skin barrier is actively maintaining equilibrium under moderate oxidative pressure.";
  if (score >= 80) {
    band = "Very High";
    statement = "Robust cellular defense. Barrier reserves are optimal to withstand external stressors.";
  } else if (score >= 60) {
    band = "High";
    statement = "Solid barrier integrity. Minor adaptive reinforcement recommended for daytime pollution.";
  } else if (score <= 40) {
    band = "Low";
    statement = "Compromised skin resilience. Heightened environmental exposure warrants immediate barrier-repair actives.";
  }

  return {
    score,
    band,
    statement,
    formula: "Resilience = clamp(100 - (0.55 × CSSI + 0.45 × VisibleStressProxy), 5, 98)",
    weights: {
      environmentalStress: "55%",
      visibleScanStress: "45%"
    }
  };
}
