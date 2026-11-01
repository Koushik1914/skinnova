/**
 * SKINNOVA - Judge Demonstration Mode & High-Fidelity Presets
 * Enables rapid 10-second evaluation of the full climate-adaptive pipeline
 * without requiring camera permissions or live network availability.
 */

export const JUDGE_PROFILES = {
  DELHI_SMOG: {
    id: "delhi_winter",
    name: "Delhi Winter Smog Phase",
    badgeLabel: "Illustrative sample · High Particulate Stress",
    location: "National Capital Region (NCR)",
    climate: {
      uv: 3.2,
      pm25: 195,
      pm10: 285,
      temp: 16,
      rh: 72,
      aqi: 345,
      label: "Sample data (Delhi Winter Smog)"
    },
    metrics: {
      forehead: { meanL: 54, meanA: 14.8, meanB: 23.2, stdL: 3.8, stdB: 3.2, shineFraction: 0.02, laplacianVar: 48 },
      leftCheek: { meanL: 52, meanA: 18.2, meanB: 22.8, stdL: 4.1, stdB: 3.6, shineFraction: 0.03, laplacianVar: 56 },
      rightCheek: { meanL: 53, meanA: 17.9, meanB: 23.0, stdL: 4.0, stdB: 3.4, shineFraction: 0.025, laplacianVar: 54 }
    },
    baseline: {
      forehead: { meanL: 57, meanA: 13.5, meanB: 23.0, stdL: 3.2, stdB: 3.0, shineFraction: 0.02, laplacianVar: 42 },
      leftCheek: { meanL: 55, meanA: 14.2, meanB: 22.5, stdL: 3.5, stdB: 3.1, shineFraction: 0.02, laplacianVar: 44 },
      rightCheek: { meanL: 55, meanA: 14.0, meanB: 22.7, stdL: 3.4, stdB: 3.2, shineFraction: 0.02, laplacianVar: 43 }
    },
    narrative: "Severe PM2.5 particulate loading (195 µg/m³) promotes lipid peroxidation and micro-inflammation. Skin presents elevated erythema (+4.0 Δa*) and surface micro-roughness."
  },

  CHENNAI_SUMMER: {
    id: "chennai_summer",
    name: "Chennai Coastal Summer Peak",
    badgeLabel: "Illustrative sample · Extreme UV & Humidity",
    location: "Tamil Nadu Coast",
    climate: {
      uv: 11.2,
      pm25: 32,
      pm10: 52,
      temp: 35,
      rh: 84,
      aqi: 80,
      label: "Sample data (Chennai Coastal Summer)"
    },
    metrics: {
      forehead: { meanL: 50, meanA: 16.4, meanB: 24.8, stdL: 3.6, stdB: 3.5, shineFraction: 0.082, laplacianVar: 38 },
      leftCheek: { meanL: 48, meanA: 19.8, meanB: 25.1, stdL: 3.9, stdB: 3.8, shineFraction: 0.095, laplacianVar: 40 },
      rightCheek: { meanL: 49, meanA: 19.5, meanB: 24.9, stdL: 3.8, stdB: 3.7, shineFraction: 0.088, laplacianVar: 39 }
    },
    baseline: {
      forehead: { meanL: 52, meanA: 14.0, meanB: 24.0, stdL: 3.2, stdB: 3.2, shineFraction: 0.03, laplacianVar: 36 },
      leftCheek: { meanL: 51, meanA: 14.5, meanB: 24.2, stdL: 3.4, stdB: 3.3, shineFraction: 0.03, laplacianVar: 37 },
      rightCheek: { meanL: 51, meanA: 14.2, meanB: 24.1, stdL: 3.3, stdB: 3.2, shineFraction: 0.03, laplacianVar: 36 }
    },
    narrative: "Extreme solar irradiance (UV Index 11.2) combined with 84% relative humidity triggers intense sebum flux (9.5% specular shine) and actinic vasodilation. Requires ultra-light barrier fluid."
  }
};
