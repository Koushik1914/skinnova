/**
 * SKINNOVA - Color Space & Biometric Signal Analysis
 * Clinical Heuristics Engine (CIELAB D65 Standard Observer)
 * 
 * Note: Pure vanilla JavaScript implementation.
 * Performs accurate non-linear sRGB gamma expansion, sRGB -> CIE XYZ,
 * and CIE XYZ -> CIELAB transformation to isolate chromaticity (a*, b*)
 * from luminance (L*).
 */

// D65 Standard Illuminant reference white points
const D65 = {
  Xn: 95.047,
  Yn: 100.0,
  Zn: 108.883
};

/**
 * Gamma decompression: convert standard 8-bit sRGB channel (0-255) to linear light [0, 1]
 */
function sRgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/**
 * Convert RGB (0-255) to CIE XYZ (0-100 scale) using standard sRGB matrix
 */
export function rgbToXyz(r, g, b) {
  const lr = sRgbToLinear(r);
  const lg = sRgbToLinear(g);
  const lb = sRgbToLinear(b);

  const x = (lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375) * 100;
  const y = (lr * 0.2126729 + lg * 0.7151522 + lb * 0.0721750) * 100;
  const z = (lr * 0.0193339 + lg * 0.1191920 + lb * 0.9503041) * 100;

  return { x, y, z };
}

/**
 * Helper function f(t) for CIE XYZ to CIELAB transformation
 */
function labF(t) {
  const delta = 6 / 29;
  return t > Math.pow(delta, 3) ? Math.cbrt(t) : t / (3 * Math.pow(delta, 2)) + 4 / 29;
}

/**
 * Convert RGB to CIELAB (L* [0..100], a* [-128..127], b* [-128..127])
 */
export function rgbToLab(r, g, b) {
  const { x, y, z } = rgbToXyz(r, g, b);

  const fx = labF(x / D65.Xn);
  const fy = labF(y / D65.Yn);
  const fz = labF(z / D65.Zn);

  const L = Math.max(0, Math.min(100, 116 * fy - 16));
  const a = 500 * (fx - fy);
  const bVal = 200 * (fy - fz);

  return { L, a, b: bVal };
}

/**
 * Extract pixel statistics from an ImageData object within a bounding box
 */
export function analyzePatch(imageData, x, y, width, height) {
  const imgW = imageData.width;
  const imgH = imageData.height;
  const data = imageData.data;

  const startX = Math.max(0, Math.floor(x));
  const startY = Math.max(0, Math.floor(y));
  const endX = Math.min(imgW, Math.floor(x + width));
  const endY = Math.min(imgH, Math.floor(y + height));

  const count = (endX - startX) * (endY - startY);
  if (count <= 0) {
    return { meanL: 50, meanA: 0, meanB: 0, stdL: 0, stdB: 0, shineFraction: 0, laplacianVar: 0 };
  }

  let sumL = 0;
  let sumA = 0;
  let sumB = 0;
  let shinePixels = 0;

  const lValues = new Float32Array(count);
  const bValues = new Float32Array(count);
  let idx = 0;

  // First pass: accumulate sums and collect L*, b* values
  for (let py = startY; py < endY; py++) {
    for (let px = startX; px < endX; px++) {
      const pIdx = (py * imgW + px) * 4;
      const r = data[pIdx];
      const g = data[pIdx + 1];
      const b = data[pIdx + 2];

      const lab = rgbToLab(r, g, b);
      sumL += lab.L;
      sumA += lab.a;
      sumB += lab.b;

      lValues[idx] = lab.L;
      bValues[idx] = lab.b;
      idx++;

      // Specular shine detection: near-saturated high L* (> 82) with low chroma (C* < 16)
      const chroma = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
      if (lab.L > 82 && chroma < 16) {
        shinePixels++;
      }
    }
  }

  const meanL = sumL / count;
  const meanA = sumA / count;
  const meanB = sumB / count;
  const shineFraction = shinePixels / count;

  // Second pass: standard deviation of L* and b*
  let varL = 0;
  let varB = 0;
  for (let i = 0; i < count; i++) {
    const diffL = lValues[i] - meanL;
    const diffB = bValues[i] - meanB;
    varL += diffL * diffL;
    varB += diffB * diffB;
  }
  const stdL = Math.sqrt(varL / count);
  const stdB = Math.sqrt(varB / count);

  // Compute Laplacian variance on L* channel for surface micro-roughness/texture
  const laplacianVar = computePatchLaplacianVariance(imageData, startX, startY, endX - startX, endY - startY);

  return {
    meanL,
    meanA,
    meanB,
    stdL,
    stdB,
    shineFraction,
    laplacianVar
  };
}

/**
 * 3x3 Discrete Laplacian Kernel convolution:
 *  [ 0,  1,  0 ]
 *  [ 1, -4,  1 ]
 *  [ 0,  1,  0 ]
 * Used to measure high-frequency micro-contrast / texture roughness.
 */
function computePatchLaplacianVariance(imageData, startX, startY, width, height) {
  const imgW = imageData.width;
  const data = imageData.data;

  // Subsample step to keep computational load light for mobile (30-60fps)
  const step = 2;
  const laplacianValues = [];
  let sumLap = 0;

  for (let py = startY + 1; py < startY + height - 1; py += step) {
    for (let px = startX + 1; px < startX + width - 1; px += step) {
      // Fast luminance approximation for kernel: 0.299R + 0.587G + 0.114B
      const getLum = (x, y) => {
        const i = (y * imgW + x) * 4;
        return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      };

      const center = getLum(px, py);
      const top = getLum(px, py - 1);
      const bottom = getLum(px, py + 1);
      const left = getLum(px - 1, py);
      const right = getLum(px + 1, py);

      const lap = (top + bottom + left + right) - 4 * center;
      laplacianValues.push(lap);
      sumLap += lap;
    }
  }

  if (laplacianValues.length === 0) return 0;

  const meanLap = sumLap / laplacianValues.length;
  let variance = 0;
  for (let i = 0; i < laplacianValues.length; i++) {
    const diff = laplacianValues[i] - meanLap;
    variance += diff * diff;
  }

  return variance / laplacianValues.length;
}

/**
 * Lighting Quality Gate
 * Evaluates illumination uniformity, dynamic range clipping, and color casts.
 */
export function evaluateLightingQuality(patchMetrics) {
  const issues = [];
  let isUsable = true;
  let confidence = 0.95;

  const { forehead, leftCheek, rightCheek } = patchMetrics;
  const avgL = (forehead.meanL + leftCheek.meanL + rightCheek.meanL) / 3;

  // Check 1: Underexposure (too dark)
  if (avgL < 25) {
    issues.push("Lighting is too dim. Move closer to a diffused light source or window.");
    confidence = Math.max(0.4, confidence - 0.35);
    isUsable = false;
  }
  // Check 2: Overexposure (too bright / washed out)
  else if (avgL > 82) {
    issues.push("Strong direct lighting is washing out skin detail. Step back from harsh glare.");
    confidence = Math.max(0.4, confidence - 0.35);
    isUsable = false;
  }

  // Check 3: Asymmetric lighting (direct side window casting deep shadow on one cheek)
  const cheekLDelta = Math.abs(leftCheek.meanL - rightCheek.meanL);
  if (cheekLDelta > 16) {
    issues.push("Asymmetrical lighting detected (one side in shadow). Face light source directly.");
    confidence = Math.max(0.5, confidence - 0.25);
  }

  // Check 4: Unnatural color cast (e.g. strong yellow bulb or neon)
  const avgB = (forehead.meanB + leftCheek.meanB + rightCheek.meanB) / 3;
  if (avgB > 38 || avgB < 2) {
    issues.push("Color temperature cast detected. Natural indirect daylight yields highest accuracy.");
    confidence = Math.max(0.6, confidence - 0.15);
  }

  // Overall status
  let status = "Optimal";
  if (!isUsable) {
    status = "Suboptimal (Retake Recommended)";
  } else if (confidence < 0.8) {
    status = "Acceptable with caveat";
  }

  return {
    isUsable,
    status,
    confidence: Math.round(confidence * 100),
    avgL: Math.round(avgL),
    cheekLDelta: Math.round(cheekLDelta),
    issues
  };
}
