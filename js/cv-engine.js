/**
 * SKINNOVA - On-Device Computer Vision & Biometric Signal Scan Engine
 * 
 * Strict Privacy & Clinical Integrity:
 * - 100% Client-Side Canvas Processing. The photo is never uploaded or transmitted.
 * - Persistent Trust Badge: "Processed on your phone. Photo never leaves it."
 * - Fairness: Normalises against individual calibrated baseline (Fitzpatrick III-VI equitable).
 * - Labelled: "Visible proxies, not a medical diagnosis. Barrier damage cannot be measured from a selfie."
 */

import { analyzePatch, evaluateLightingQuality } from "./color-space.js";
import { evaluateSkinSignals } from "./scoring.js";

export class CvEngine {
  constructor(canvasElement, overlayCanvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext("2d", { willReadFrequently: true });
    this.overlayCanvas = overlayCanvasElement;
    this.overlayCtx = overlayCanvasElement.getContext("2d");

    this.videoStream = null;
    this.isStreaming = false;
    this.lastMetrics = null;
    this.lastLighting = null;
    this.lastSignals = null;

    // Relative patch geometry (expressed in normalized coordinates 0.0 - 1.0)
    // Forehead: center top; Cheeks: bilateral mid-face
    this.patchGeometry = {
      forehead: { nx: 0.38, ny: 0.22, nw: 0.24, nh: 0.12, label: "Forehead" },
      leftCheek: { nx: 0.20, ny: 0.48, nw: 0.20, nh: 0.16, label: "Left Cheek (Malar)" },
      rightCheek: { nx: 0.60, ny: 0.48, nw: 0.20, nh: 0.16, label: "Right Cheek (Malar)" }
    };

    this.onScanComplete = null;
    this.onLightingChange = null;
  }

  /**
   * Start live camera stream
   */
  async startCamera(videoElement) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Camera API not supported in this browser. Please use photo upload or sample mode.");
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 640 }
        },
        audio: false
      });

      this.videoStream = stream;
      videoElement.srcObject = stream;
      await videoElement.play();
      this.isStreaming = true;
      return true;
    } catch (err) {
      this.isStreaming = false;
      throw err;
    }
  }

  /**
   * Stop camera stream safely
   */
  stopCamera() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
      this.isStreaming = false;
    }
  }

  /**
   * Capture a still frame from live video element to canvas
   */
  captureFromVideo(videoElement, baselineMetrics = null) {
    const w = videoElement.videoWidth || 480;
    const h = videoElement.videoHeight || 480;

    this.canvas.width = w;
    this.canvas.height = h;
    this.overlayCanvas.width = w;
    this.overlayCanvas.height = h;

    // Draw video to main canvas
    this.ctx.drawImage(videoElement, 0, 0, w, h);
    return this.processCanvas(baselineMetrics);
  }

  /**
   * Load an image file (from user file upload)
   */
  async loadFromFile(file, baselineMetrics = null) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Normalize max dimension to 640px to ensure mobile speed
          const maxDim = 640;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          this.canvas.width = w;
          this.canvas.height = h;
          this.overlayCanvas.width = w;
          this.overlayCanvas.height = h;

          this.ctx.drawImage(img, 0, 0, w, h);
          const results = this.processCanvas(baselineMetrics);
          resolve(results);
        };
        img.onerror = () => reject(new Error("Unable to decode image file."));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error("File reading failed."));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Load synthetic / sample face image onto canvas for Judge Mode or Offline Testing
   */
  loadSampleFace(sampleProfile = "delhi_winter", baselineMetrics = null) {
    const w = 480;
    const h = 480;

    this.canvas.width = w;
    this.canvas.height = h;
    this.overlayCanvas.width = w;
    this.overlayCanvas.height = h;

    this.drawScientificFaceDiagram(sampleProfile);
    return this.processCanvas(baselineMetrics);
  }

  /**
   * Core image analysis on current canvas frame
   */
  processCanvas(baselineMetrics = null) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const imageData = this.ctx.getImageData(0, 0, w, h);

    // Extract forehead, left cheek, right cheek patches
    const foreheadPatch = this.getPatchRect(this.patchGeometry.forehead, w, h);
    const leftCheekPatch = this.getPatchRect(this.patchGeometry.leftCheek, w, h);
    const rightCheekPatch = this.getPatchRect(this.patchGeometry.rightCheek, w, h);

    const fMetrics = analyzePatch(imageData, foreheadPatch.x, foreheadPatch.y, foreheadPatch.w, foreheadPatch.h);
    const lMetrics = analyzePatch(imageData, leftCheekPatch.x, leftCheekPatch.y, leftCheekPatch.w, leftCheekPatch.h);
    const rMetrics = analyzePatch(imageData, rightCheekPatch.x, rightCheekPatch.y, rightCheekPatch.w, rightCheekPatch.h);

    const patchMetrics = {
      forehead: fMetrics,
      leftCheek: lMetrics,
      rightCheek: rMetrics
    };
    this.lastMetrics = patchMetrics;

    // Assess lighting gate
    const lighting = evaluateLightingQuality(patchMetrics);
    this.lastLighting = lighting;

    // Evaluate skin signal visible proxies against baseline
    const signals = evaluateSkinSignals(patchMetrics, baselineMetrics);
    this.lastSignals = signals;

    // Render visual ROI patch overlays on overlay canvas
    this.renderPatchOverlays([
      { rect: foreheadPatch, label: "Forehead (L*: " + Math.round(fMetrics.meanL) + ")" },
      { rect: leftCheekPatch, label: "L. Cheek (a*: " + Math.round(lMetrics.meanA) + ")" },
      { rect: rightCheekPatch, label: "R. Cheek (a*: " + Math.round(rMetrics.meanA) + ")" }
    ]);

    const result = {
      patchMetrics,
      lighting,
      signals
    };

    if (this.onScanComplete) this.onScanComplete(result);
    return result;
  }

  getPatchRect(geom, w, h) {
    return {
      x: Math.round(geom.nx * w),
      y: Math.round(geom.ny * h),
      w: Math.round(geom.nw * w),
      h: Math.round(geom.nh * h)
    };
  }

  /**
   * Draw clinical hairline patch overlays with biometric anchor brackets
   */
  renderPatchOverlays(patches) {
    const ctx = this.overlayCtx;
    ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

    patches.forEach(({ rect, label }) => {
      // Soft translucent fill
      ctx.fillStyle = "rgba(43, 179, 163, 0.12)";
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

      // Fine clinical dashed border
      ctx.strokeStyle = "rgba(43, 179, 163, 0.85)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      ctx.setLineDash([]);

      // Corner precision brackets
      const corner = 6;
      ctx.strokeStyle = "#C9A24B";
      ctx.lineWidth = 2;
      // Top-left
      ctx.beginPath();
      ctx.moveTo(rect.x, rect.y + corner);
      ctx.lineTo(rect.x, rect.y);
      ctx.lineTo(rect.x + corner, rect.y);
      ctx.stroke();

      // Top-right
      ctx.beginPath();
      ctx.moveTo(rect.x + rect.w - corner, rect.y);
      ctx.lineTo(rect.x + rect.w, rect.y);
      ctx.lineTo(rect.x + rect.w, rect.y + corner);
      ctx.stroke();

      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(rect.x, rect.y + rect.h - corner);
      ctx.lineTo(rect.x, rect.y + rect.h);
      ctx.lineTo(rect.x + corner, rect.y + rect.h);
      ctx.stroke();

      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(rect.x + rect.w - corner, rect.y + rect.h);
      ctx.lineTo(rect.x + rect.w, rect.y + rect.h);
      ctx.lineTo(rect.x + rect.w, rect.y + rect.h - corner);
      ctx.stroke();

      // Small scientific tag badge
      ctx.fillStyle = "rgba(11, 22, 48, 0.85)";
      ctx.fillRect(rect.x, rect.y - 18, Math.min(rect.w, 140), 16);
      ctx.fillStyle = "#F7F4EE";
      ctx.font = "9px Inter, sans-serif";
      ctx.fillText(label, rect.x + 4, rect.y - 6);
    });
  }

  /**
   * Draw an ultra-clean scientific face diagram directly onto canvas
   * when testing in Judge Mode or when camera is offline.
   * Represents Fitzpatrick phototype IV (warm olive/brown Indian skin tone).
   */
  drawScientificFaceDiagram(profile = "delhi_winter") {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Background gradient: clean clinical laboratory dark navy
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, "#0D1B36");
    bgGrad.addColorStop(1, "#070E1F");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle alignment grid
    ctx.strokeStyle = "rgba(43, 179, 163, 0.08)";
    ctx.lineWidth = 1;
    for (let x = 40; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 40; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const cx = w / 2;
    const cy = h / 2;

    // Base skin tone colors (Fitzpatrick IV Indian skin tone)
    // If delhi_winter: slight environmental oxidative dullness + erythema micro-flush
    let skinBase = "#9C6E4E";
    let cheekFlush = "rgba(180, 80, 70, 0.22)";
    if (profile === "chennai_summer") {
      skinBase = "#8E5F3F";
      cheekFlush = "rgba(210, 100, 70, 0.35)"; // UV induced flush
    }

    // Head oval
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, 130, 170, 0, 0, Math.PI * 2);
    ctx.fillStyle = skinBase;
    ctx.fill();

    // Soft clinical face shading / skin depth
    const faceGrad = ctx.createRadialGradient(cx, cy - 20, 20, cx, cy, 160);
    faceGrad.addColorStop(0, "rgba(255, 230, 200, 0.18)");
    faceGrad.addColorStop(0.7, "rgba(0, 0, 0, 0.1)");
    faceGrad.addColorStop(1, "rgba(0, 0, 0, 0.45)");
    ctx.fillStyle = faceGrad;
    ctx.fill();

    // Forehead area
    const foreheadGrad = ctx.createRadialGradient(cx, cy - 80, 10, cx, cy - 80, 70);
    foreheadGrad.addColorStop(0, "rgba(255, 245, 220, 0.15)");
    foreheadGrad.addColorStop(1, "transparent");
    ctx.fillStyle = foreheadGrad;
    ctx.beginPath();
    ctx.arc(cx, cy - 80, 60, 0, Math.PI * 2);
    ctx.fill();

    // Bilateral cheek flush
    ctx.fillStyle = cheekFlush;
    ctx.beginPath();
    ctx.ellipse(cx - 65, cy + 15, 38, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(cx + 65, cy + 15, 38, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Subtle face contours (eyes, brows, nose bridge) for anatomical anchor
    ctx.strokeStyle = "rgba(50, 30, 20, 0.45)";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";

    // Eyebrows
    ctx.beginPath();
    ctx.arc(cx - 50, cy - 36, 28, Math.PI * 1.1, Math.PI * 1.85);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx + 50, cy - 36, 28, Math.PI * 1.15, Math.PI * 1.9);
    ctx.stroke();

    // Eyes
    ctx.beginPath();
    ctx.ellipse(cx - 50, cy - 20, 16, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#2D1E16";
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(cx + 50, cy - 20, 16, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#2D1E16";
    ctx.fill();

    // Nose bridge & tip
    ctx.strokeStyle = "rgba(70, 45, 30, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 25);
    ctx.lineTo(cx - 3, cy + 25);
    ctx.quadraticCurveTo(cx, cy + 32, cx + 8, cy + 28);
    ctx.stroke();

    // Lips
    ctx.fillStyle = "rgba(165, 80, 80, 0.65)";
    ctx.beginPath();
    ctx.ellipse(cx, cy + 72, 28, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
