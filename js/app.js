/**
 * SKINNOVA - Main Application Orchestrator
 * High-performance, zero-latency state machine for L'Oréal Sustainability Challenge 2026
 * 
 * Author: Koushik Voota, Amrita Vishwa Vidyapeetham
 */

import { CvEngine } from "./cv-engine.js";
import { ClimateService, INDIAN_CITIES } from "./climate.js";
import { calculateCssi, calculateSkinResilienceScore, CSSI_WEIGHTS, CLINICAL_DISCLAIMER } from "./scoring.js";
import { generateAdaptiveRoutine } from "./routine.js";
import { StorageService } from "./storage.js";
import { JUDGE_PROFILES } from "./judge-mode.js";

class SkinnovaApp {
  constructor() {
    this.currentStep = 1;
    this.storage = new StorageService();
    this.climate = new ClimateService();
    this.activeProfile = JUDGE_PROFILES.DELHI_SMOG;
    this.userBaseline = this.storage.getBaseline();

    // DOM Elements
    this.dom = {
      html: document.documentElement,
      themeToggleBtn: document.getElementById("themeToggleBtn"),
      themeIcon: document.getElementById("themeIcon"),

      // Judge mode
      presetDelhiBtn: document.getElementById("presetDelhiBtn"),
      presetChennaiBtn: document.getElementById("presetChennaiBtn"),

      // Stepper
      stepButtons: [
        document.getElementById("stepBtn1"),
        document.getElementById("stepBtn2"),
        document.getElementById("stepBtn3"),
        document.getElementById("stepBtn4")
      ],
      stepViews: [
        document.getElementById("viewStep1"),
        document.getElementById("viewStep2"),
        document.getElementById("viewStep3"),
        document.getElementById("viewStep4")
      ],

      // Step 1: Scanner
      cameraVideo: document.getElementById("cameraVideo"),
      mainCanvas: document.getElementById("mainCanvas"),
      overlayCanvas: document.getElementById("overlayCanvas"),
      scanStatusBadge: document.getElementById("scanStatusBadge"),
      btnStartCamera: document.getElementById("btnStartCamera"),
      btnCapturePhoto: document.getElementById("btnCapturePhoto"),
      cameraBtnLabel: document.getElementById("cameraBtnLabel"),
      btnUploadFile: document.getElementById("btnUploadFile"),
      fileInput: document.getElementById("fileInput"),
      lightingBar: document.getElementById("lightingBar"),
      lightingDot: document.getElementById("lightingDot"),
      lightingStatusText: document.getElementById("lightingStatusText"),
      lightingLVal: document.getElementById("lightingLVal"),
      lightingIssuesBox: document.getElementById("lightingIssuesBox"),
      btnExplainFairness: document.getElementById("btnExplainFairness"),
      metricRednessBand: document.getElementById("metricRednessBand"),
      metricRednessVal: document.getElementById("metricRednessVal"),
      metricDullnessBand: document.getElementById("metricDullnessBand"),
      metricDullnessVal: document.getElementById("metricDullnessVal"),
      metricTextureBand: document.getElementById("metricTextureBand"),
      metricTextureVal: document.getElementById("metricTextureVal"),
      metricShineBand: document.getElementById("metricShineBand"),
      metricShineVal: document.getElementById("metricShineVal"),
      btnNextToClimate: document.getElementById("btnNextToClimate"),

      // Step 2: Climate
      climateModeBadge: document.getElementById("climateModeBadge"),
      citySelect: document.getElementById("citySelect"),
      btnGeoLocation: document.getElementById("btnGeoLocation"),
      climateSourceNotice: document.getElementById("climateSourceNotice"),
      climateUvBand: document.getElementById("climateUvBand"),
      climatePmBand: document.getElementById("climatePmBand"),
      climateTempBand: document.getElementById("climateTempBand"),
      climateRhBand: document.getElementById("climateRhBand"),
      sliderUv: document.getElementById("sliderUv"),
      sliderPm: document.getElementById("sliderPm"),
      sliderTemp: document.getElementById("sliderTemp"),
      sliderRh: document.getElementById("sliderRh"),
      sliderValUv: document.getElementById("sliderValUv"),
      sliderValPm: document.getElementById("sliderValPm"),
      sliderValTemp: document.getElementById("sliderValTemp"),
      sliderValRh: document.getElementById("sliderValRh"),
      btnResetClimate: document.getElementById("btnResetClimate"),
      btnNextToFusion: document.getElementById("btnNextToFusion"),

      // Step 3: Fusion
      resilienceRing: document.getElementById("resilienceRing"),
      resilienceBandText: document.getElementById("resilienceBandText"),
      resilienceNumText: document.getElementById("resilienceNumText"),
      resilienceStatement: document.getElementById("resilienceStatement"),
      btnOpenResilienceDrawer: document.getElementById("btnOpenResilienceDrawer"),
      cssiBandBadge: document.getElementById("cssiBandBadge"),
      cssiScoreNum: document.getElementById("cssiScoreNum"),
      cssiInterpretationText: document.getElementById("cssiInterpretationText"),
      btnOpenCssiDrawer: document.getElementById("btnOpenCssiDrawer"),
      trendGraphContainer: document.getElementById("trendGraphContainer"),
      btnNextToRoutine: document.getElementById("btnNextToRoutine"),

      // Step 4: Routine
      skipTodayBanner: document.getElementById("skipTodayBanner"),
      avoidedCountText: document.getElementById("avoidedCountText"),
      amStepsList: document.getElementById("amStepsList"),
      pmStepsList: document.getElementById("pmStepsList"),
      indianContextList: document.getElementById("indianContextList"),
      sustainStreakVal: document.getElementById("sustainStreakVal"),
      sustainAvoidedVal: document.getElementById("sustainAvoidedVal"),
      sustainCarbonVal: document.getElementById("sustainCarbonVal"),
      sustainEnergyVal: document.getElementById("sustainEnergyVal"),
      btnRestartScan: document.getElementById("btnRestartScan"),

      // Calculation Drawer
      calcDrawerBackdrop: document.getElementById("calcDrawerBackdrop"),
      drawerTitle: document.getElementById("drawerTitle"),
      drawerBodyContent: document.getElementById("drawerBodyContent"),
      btnDrawerClose: document.getElementById("btnDrawerClose")
    };

    // Initialize CV Engine
    this.cv = new CvEngine(this.dom.mainCanvas, this.dom.overlayCanvas);

    // Bind event listeners
    this.initEvents();

    // Populate Indian Cities in Select
    this.populateCitiesDropdown();

    // Init Theme
    this.initTheme();

    // Boot with Default Judge Profile (Delhi Winter Smog)
    this.loadJudgeProfile(JUDGE_PROFILES.DELHI_SMOG);
  }

  initTheme() {
    const savedTheme = localStorage.getItem("skinnova_theme") || "light";
    this.setTheme(savedTheme);

    this.dom.themeToggleBtn.addEventListener("click", () => {
      const nextTheme = this.dom.html.getAttribute("data-theme") === "dark" ? "light" : "dark";
      this.setTheme(nextTheme);
    });
  }

  setTheme(theme) {
    this.dom.html.setAttribute("data-theme", theme);
    localStorage.setItem("skinnova_theme", theme);

    if (theme === "dark") {
      this.dom.themeIcon.innerHTML = `
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      `;
    } else {
      this.dom.themeIcon.innerHTML = `
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      `;
    }
  }

  populateCitiesDropdown() {
    this.dom.citySelect.innerHTML = "";
    INDIAN_CITIES.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.name;
      opt.textContent = `${c.name} (${c.preset.season})`;
      this.dom.citySelect.appendChild(opt);
    });
  }

  initEvents() {
    // Stepper Navigation
    this.dom.stepButtons.forEach((btn, idx) => {
      btn.addEventListener("click", () => this.goToStep(idx + 1));
    });

    // Step Transitions
    this.dom.btnNextToClimate.addEventListener("click", () => this.goToStep(2));
    this.dom.btnNextToFusion.addEventListener("click", () => this.goToStep(3));
    this.dom.btnNextToRoutine.addEventListener("click", () => this.goToStep(4));
    this.dom.btnRestartScan.addEventListener("click", () => this.goToStep(1));

    // Judge Preset Toggles
    this.dom.presetDelhiBtn.addEventListener("click", () => {
      this.loadJudgeProfile(JUDGE_PROFILES.DELHI_SMOG);
    });

    this.dom.presetChennaiBtn.addEventListener("click", () => {
      this.loadJudgeProfile(JUDGE_PROFILES.CHENNAI_SUMMER);
    });

    // Camera Controls
    this.dom.btnStartCamera.addEventListener("click", () => this.toggleCameraStream());
    this.dom.btnCapturePhoto.addEventListener("click", () => this.captureCameraFrame());

    // File Upload
    this.dom.btnUploadFile.addEventListener("click", () => this.dom.fileInput.click());
    this.dom.fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        this.handleFileUpload(e.target.files[0]);
      }
    });

    // Climate Events
    this.dom.citySelect.addEventListener("change", async (e) => {
      await this.climate.setCityByName(e.target.value, true);
    });

    this.dom.btnGeoLocation.addEventListener("click", async () => {
      this.dom.climateSourceNotice.textContent = "Requesting device GPS coordinates...";
      await this.climate.requestGeolocation();
    });

    this.dom.btnResetClimate.addEventListener("click", () => {
      this.climate.applyPreset(this.climate.currentCity);
    });

    // Manual Climate Sliders
    const handleSlider = (param, inputEl, textEl, suffix = "") => {
      inputEl.addEventListener("input", (e) => {
        textEl.textContent = `${e.target.value}${suffix}`;
        this.climate.updateManualValue(param, e.target.value);
      });
    };

    handleSlider("uv", this.dom.sliderUv, this.dom.sliderValUv);
    handleSlider("pm25", this.dom.sliderPm, this.dom.sliderValPm, " µg/m³");
    handleSlider("temp", this.dom.sliderTemp, this.dom.sliderValTemp, "°C");
    handleSlider("rh", this.dom.sliderRh, this.dom.sliderValRh, "%");

    // Climate Service Listener
    this.climate.onChange((payload) => {
      this.updateClimateUI(payload);
      this.recalculateAll();
    });

    // Drawers & Explanations
    this.dom.btnOpenResilienceDrawer.addEventListener("click", () => this.openResilienceDrawer());
    this.dom.btnOpenCssiDrawer.addEventListener("click", () => this.openCssiDrawer());
    this.dom.btnExplainFairness.addEventListener("click", () => this.openFairnessDrawer());

    this.dom.btnDrawerClose.addEventListener("click", () => this.closeDrawer());
    this.dom.calcDrawerBackdrop.addEventListener("click", (e) => {
      if (e.target === this.dom.calcDrawerBackdrop) this.closeDrawer();
    });
  }

  goToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > 4) return;
    this.currentStep = stepNumber;

    // Update step buttons
    this.dom.stepButtons.forEach((btn, idx) => {
      const s = idx + 1;
      btn.classList.toggle("active", s === stepNumber);
      btn.classList.toggle("completed", s < stepNumber);
    });

    // Update views
    this.dom.stepViews.forEach((view, idx) => {
      view.classList.toggle("active", idx + 1 === stepNumber);
    });

    // If leaving camera step, ensure stream is safely stopped
    if (stepNumber !== 1 && this.cv.isStreaming) {
      this.cv.stopCamera();
      this.dom.cameraVideo.style.display = "none";
      this.dom.mainCanvas.style.display = "block";
      this.dom.btnCapturePhoto.style.display = "none";
      this.dom.cameraBtnLabel.textContent = "Use Camera";
    }

    // Scroll to top of app
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async toggleCameraStream() {
    if (this.cv.isStreaming) {
      this.cv.stopCamera();
      this.dom.cameraVideo.style.display = "none";
      this.dom.mainCanvas.style.display = "block";
      this.dom.btnCapturePhoto.style.display = "none";
      this.dom.cameraBtnLabel.textContent = "Use Camera";
    } else {
      try {
        this.dom.cameraBtnLabel.textContent = "Starting...";
        await this.cv.startCamera(this.dom.cameraVideo);
        this.dom.cameraVideo.style.display = "block";
        this.dom.mainCanvas.style.display = "none";
        this.dom.btnCapturePhoto.style.display = "inline-flex";
        this.dom.cameraBtnLabel.textContent = "Stop Camera";
      } catch (err) {
        this.dom.cameraBtnLabel.textContent = "Use Camera";
        alert("Camera access was not granted or is unavailable on this device. You can test immediately using Photo Upload or the Judge Mode presets.");
      }
    }
  }

  captureCameraFrame() {
    if (!this.cv.isStreaming) return;
    const scanResult = this.cv.captureFromVideo(this.dom.cameraVideo, this.userBaseline);
    this.cv.stopCamera();
    this.dom.cameraVideo.style.display = "none";
    this.dom.mainCanvas.style.display = "block";
    this.dom.btnCapturePhoto.style.display = "none";
    this.dom.cameraBtnLabel.textContent = "Retake Photo";

    this.onNewScanData(scanResult, "User Live Capture");
  }

  async handleFileUpload(file) {
    try {
      const scanResult = await this.cv.loadFromFile(file, this.userBaseline);
      this.onNewScanData(scanResult, "User Photo Upload");
    } catch (err) {
      alert("Unable to process uploaded image. Please ensure it is a valid JPEG/PNG.");
    }
  }

  loadJudgeProfile(profile) {
    this.activeProfile = profile;

    // Toggle active preset button
    this.dom.presetDelhiBtn.classList.toggle("active", profile.id === "delhi_winter");
    this.dom.presetChennaiBtn.classList.toggle("active", profile.id === "chennai_summer");

    // 1. Load scientific canvas diagram
    const scanResult = this.cv.loadSampleFace(profile.id, profile.baseline);

    // 2. Load matching climate data
    this.climate.data = { ...profile.climate };
    this.climate.isLive = false;
    this.climate.isSampleMode = true;
    this.climate.sourceLabel = profile.climate.label;

    // Set dropdown to matching city if available
    const matchingCity = INDIAN_CITIES.find(c => profile.id.includes(c.name.toLowerCase()));
    if (matchingCity) {
      this.climate.currentCity = matchingCity;
      this.dom.citySelect.value = matchingCity.name;
    }

    this.onNewScanData(scanResult, profile.badgeLabel);
  }

  onNewScanData(scanResult, sourceLabel) {
    const { patchMetrics, lighting, signals } = scanResult;

    // Update Status Badge
    this.dom.scanStatusBadge.textContent = sourceLabel;

    // Update Lighting Bar
    this.dom.lightingLVal.textContent = `Mean L*: ${lighting.avgL}`;
    this.dom.lightingStatusText.textContent = `${lighting.status} (Confidence: ${lighting.confidence}%)`;

    this.dom.lightingDot.className = "lighting-dot";
    if (lighting.isUsable && lighting.confidence >= 80) {
      this.dom.lightingDot.classList.add("optimal");
    } else if (lighting.isUsable) {
      this.dom.lightingDot.classList.add("warning");
    } else {
      this.dom.lightingDot.classList.add("error");
    }

    if (lighting.issues.length > 0) {
      this.dom.lightingIssuesBox.innerHTML = lighting.issues.map(i => `<div>• ${i}</div>`).join("");
      this.dom.lightingIssuesBox.classList.add("visible");
    } else {
      this.dom.lightingIssuesBox.classList.remove("visible");
    }

    // Update Visible Metric Cards
    this.updateScanMetricCards(signals);

    // Recalculate CSSI, Resilience, and Routine
    this.recalculateAll();
  }

  updateScanMetricCards(signals) {
    if (!signals || !signals.signals) return;

    const findSignal = (id) => signals.signals.find(s => s.id === id) || { score: 20, delta: '0' };

    const red = findSignal("redness");
    this.dom.metricRednessVal.textContent = `${red.delta >= 0 ? '+' : ''}${red.delta} Δa* vs base`;
    this.dom.metricRednessBand.textContent = this.getBandFromScore(red.score);

    const dull = findSignal("dullness");
    this.dom.metricDullnessVal.textContent = `${dull.delta >= 0 ? '+' : ''}${dull.delta} ΔL* shift`;
    this.dom.metricDullnessBand.textContent = this.getBandFromScore(dull.score);

    const tex = findSignal("texture");
    this.dom.metricTextureVal.textContent = `${tex.delta} rel ratio`;
    this.dom.metricTextureBand.textContent = this.getBandFromScore(tex.score);

    const shine = findSignal("shine");
    this.dom.metricShineVal.textContent = `${shine.fraction || '2.5%'} specular`;
    this.dom.metricShineBand.textContent = this.getBandFromScore(shine.score);
  }

  getBandFromScore(score) {
    if (score >= 70) return "High";
    if (score >= 45) return "Moderate";
    return "Low";
  }

  updateClimateUI(payload) {
    // Mode Badge
    this.dom.climateModeBadge.className = `climate-source-badge ${payload.isLive ? 'live' : 'sample'}`;
    this.dom.climateModeBadge.textContent = payload.isLive ? "Live Open-Meteo" : "Sample Data Mode";
    this.dom.climateSourceNotice.textContent = `Source: ${payload.sourceLabel}`;

    // Metric Bands
    this.dom.climateUvBand.textContent = `${this.getUvBand(payload.uv)} (${payload.uv.toFixed(1)})`;
    this.dom.climatePmBand.textContent = `${this.getPmBand(payload.pm25)} (${Math.round(payload.pm25)} µg)`;
    this.dom.climateTempBand.textContent = `${Math.round(payload.temp)}°C`;
    this.dom.climateRhBand.textContent = `${Math.round(payload.rh)}% RH`;

    // Sliders
    this.dom.sliderUv.value = payload.uv;
    this.dom.sliderValUv.textContent = payload.uv.toFixed(1);

    this.dom.sliderPm.value = payload.pm25;
    this.dom.sliderValPm.textContent = `${Math.round(payload.pm25)} µg/m³`;

    this.dom.sliderTemp.value = payload.temp;
    this.dom.sliderValTemp.textContent = `${Math.round(payload.temp)}°C`;

    this.dom.sliderRh.value = payload.rh;
    this.dom.sliderValRh.textContent = `${Math.round(payload.rh)}%`;
  }

  getUvBand(uv) {
    if (uv >= 11) return "Extreme";
    if (uv >= 8) return "Very High";
    if (uv >= 6) return "High";
    if (uv >= 3) return "Moderate";
    return "Low";
  }

  getPmBand(pm) {
    if (pm > 120) return "Severe";
    if (pm > 90) return "Poor";
    if (pm > 60) return "Moderate";
    if (pm > 30) return "Satisfactory";
    return "Good";
  }

  recalculateAll() {
    const climatePayload = this.climate.getPayload();
    const cssi = calculateCssi(climatePayload);
    this.lastCssi = cssi;

    const visibleStressScore = this.cv.lastSignals ? this.cv.lastSignals.compositeVisibleStress : 40;
    const resilience = calculateSkinResilienceScore(cssi.score, visibleStressScore);
    this.lastResilience = resilience;

    // Update Fusion Step UI
    this.dom.cssiScoreNum.textContent = cssi.score;
    this.dom.cssiBandBadge.textContent = `${cssi.band} Stress (${cssi.score} / 100)`;
    this.dom.cssiInterpretationText.textContent = cssi.interpretation;

    // Update Resilience Hero Gauge
    this.dom.resilienceBandText.textContent = resilience.band;
    this.dom.resilienceNumText.textContent = `${resilience.score} / 100`;
    this.dom.resilienceStatement.textContent = resilience.statement;

    // Gauge circle animation (circumference 2 * pi * 70 = 439.82)
    const maxOffset = 440;
    const offset = maxOffset - (resilience.score / 100) * maxOffset;
    this.dom.resilienceRing.style.strokeDashoffset = offset;

    if (resilience.score >= 75) {
      this.dom.resilienceRing.style.stroke = "var(--color-teal)";
    } else if (resilience.score >= 50) {
      this.dom.resilienceRing.style.stroke = "var(--color-status-mod)";
    } else {
      this.dom.resilienceRing.style.stroke = "var(--color-status-severe)";
    }

    // Render Trend Graph
    const trendData = this.storage.getOrSeedTrendData();
    this.dom.trendGraphContainer.innerHTML = this.storage.renderTrendSvg(trendData);

    // Formulate Adaptive Routine
    const signals = this.cv.lastSignals || { dominantSignal: { id: "dullness" } };
    const routine = generateAdaptiveRoutine(cssi, signals);
    this.updateRoutineUI(routine);

    // Save scan to history
    this.storage.saveScan({
      resilience: resilience.score,
      cssi: cssi.score,
      avoidedStepsCount: routine.avoidedStepsCount
    });

    // Update sustainability panel numbers
    this.updateSustainabilityUI();
  }

  updateRoutineUI(routine) {
    // Skip Today banner
    if (routine.isSkipTodayActive) {
      this.dom.skipTodayBanner.style.display = "flex";
      this.dom.avoidedCountText.textContent = `${routine.avoidedStepsCount} Steps Bypassed`;
    } else {
      this.dom.skipTodayBanner.style.display = "none";
    }

    // Render AM Steps
    this.dom.amStepsList.innerHTML = routine.amSteps.map(step => `
      <li class="routine-step-card ${step.skipped ? 'skipped' : ''}">
        ${step.skipped ? '<span class="routine-step-badge">Bypassed Today</span>' : ''}
        <div class="routine-step-title">${step.order}. ${step.step}</div>
        <div class="routine-step-class">${step.ingredientClass}</div>
        <div class="routine-step-why">${step.why}</div>
      </li>
    `).join("");

    // Render PM Steps
    this.dom.pmStepsList.innerHTML = routine.pmSteps.map(step => `
      <li class="routine-step-card ${step.skipped ? 'skipped' : ''}">
        ${step.skipped ? '<span class="routine-step-badge">Bypassed Today</span>' : ''}
        <div class="routine-step-title">${step.order}. ${step.step}</div>
        <div class="routine-step-class">${step.ingredientClass}</div>
        <div class="routine-step-why">${step.why}</div>
      </li>
    `).join("");

    // Indian Context Notes
    this.dom.indianContextList.innerHTML = routine.indianContextNotes.map(n => `
      <div style="padding-left: var(--space-2); border-left: 2px solid var(--color-teal);">${n}</div>
    `).join("");
  }

  updateSustainabilityUI() {
    const stats = this.storage.getSustainabilityStats();
    this.dom.sustainStreakVal.textContent = `${stats.streakDays} Days`;
    this.dom.sustainAvoidedVal.textContent = stats.totalAvoidedProducts;
    this.dom.sustainCarbonVal.textContent = `${stats.carbonAvoidedGrams} g`;
    this.dom.sustainEnergyVal.textContent = `${stats.onDeviceEnergySavedWh} Wh`;
  }

  /* Drawers */
  openResilienceDrawer() {
    this.dom.drawerTitle.textContent = "Skin Resilience Score Calculation";
    this.dom.drawerBodyContent.innerHTML = `
      <p><strong>Primary Function:</strong> Synthesizes macro-environmental stress with micro-vascular visible skin proxies into an actionable 0–100 longevity index.</p>
      
      <div style="background-color: var(--bg-surface-elevated); padding: var(--space-3); border-radius: var(--radius-sm); border: 1px solid var(--color-border); font-family: var(--font-mono); font-size: 11px;">
        Resilience = clamp(100 - (0.55 × CSSI + 0.45 × VisibleStressProxy), 5, 98)
      </div>

      <div style="display: flex; flex-direction: column; gap: 4px;">
        <strong>Component Weighting:</strong>
        <div>• <strong>55% Climate Stress (CSSI):</strong> UV Index, PM2.5, Humidity-Heat Load, Temperature extremes.</div>
        <div>• <strong>45% Facial Proxy Shift:</strong> Calibrated delta in erythema (Δa*), dullness (ΔL*), and texture roughness (Laplacian).</div>
      </div>

      <div style="border-top: 1px solid var(--color-border); padding-top: var(--space-2);">
        <strong>Clinical Banding Thresholds:</strong>
        <div>• <strong>80–98 (Very High):</strong> Cellular defense reserves optimal.</div>
        <div>• <strong>60–79 (High):</strong> Strong barrier; standard photoprotection required.</div>
        <div>• <strong>41–59 (Moderate):</strong> Environmental stress taxing barrier equilibrium.</div>
        <div>• <strong>0–40 (Low):</strong> Compromised resilience; targeted barrier reconstruction required.</div>
      </div>
    `;
    this.showDrawer();
  }

  openCssiDrawer() {
    this.dom.drawerTitle.textContent = "Climate Skin-Stress Index (CSSI) Formula";
    this.dom.drawerBodyContent.innerHTML = `
      <p><strong>Objective:</strong> Standardized multi-pollutant and thermodynamic stress index calibrated to Indian climate extremes.</p>
      
      <div style="background-color: var(--bg-surface-elevated); padding: var(--space-3); border-radius: var(--radius-sm); border: 1px solid var(--color-border); font-family: var(--font-mono); font-size: 11px;">
        CSSI = 0.35·S(UV) + 0.35·S(PM2.5) + 0.20·S(RH_Heat) + 0.10·S(Temp)
      </div>

      <div>
        <strong>Scientific Standards &amp; Thresholds:</strong>
        <ul style="padding-left: var(--space-4); margin-top: 4px; display: flex; flex-direction: column; gap: 4px;">
          <li><strong>UV Index (35%):</strong> Normalized against WHO Solar UV Index scale (0 to 11+ extreme). High UV induces direct DNA thymine dimers and lipid oxidation.</li>
          <li><strong>PM2.5 Ambient (35%):</strong> Calibrated to Central Pollution Control Board (CPCB) National Air Quality Index. Severe breakpoint at 120 µg/m³; WHO 2021 24h ceiling is 15 µg/m³.</li>
          <li><strong>Humidity-Heat Load (20%):</strong> Assesses dual thermodynamic risks: tropical high RH (>65%) + high heat causing sebum oxidation and follicular blockage, versus winter dry desiccation causing TEWL.</li>
          <li><strong>Temperature Deviation (10%):</strong> Distance from skin homeostatic comfort zone (20°C–25°C).</li>
        </ul>
      </div>
    `;
    this.showDrawer();
  }

  openFairnessDrawer() {
    this.dom.drawerTitle.textContent = "Algorithmic Fairness & CIELAB Calibration";
    this.dom.drawerBodyContent.innerHTML = `
      <p><strong>Anti-Bias Architectural Commitment:</strong></p>
      <p>Conventional computer vision dermatological algorithms frequently anchor against Eurocentric pale skin thresholds (Fitzpatrick I–II), falsely categorizing deeper melanin-rich tones (Fitzpatrick III–VI) as "darker", "duller", or less healthy.</p>

      <div style="background-color: var(--bg-surface-elevated); padding: var(--space-3); border-radius: var(--radius-sm); border: 1px solid var(--color-border);">
        <strong>Relative Baseline Principle:</strong>
        <div style="font-size: 11px; margin-top: 4px;">
          SKINNOVA measures relative differential vector shifts: (ΔL*, Δa*, ΔLaplacian) strictly comparing today's scan against the individual user's self-anchored baseline.
        </div>
      </div>

      <div>
        <strong>Color Space Integrity:</strong>
        <div>All operations are conducted in standard CIE L*a*b* (D65 illuminant), cleanly separating lightness (L*) from red-green chromaticity (a*) and yellow-blue (b*).</div>
      </div>
    `;
    this.showDrawer();
  }

  showDrawer() {
    this.dom.calcDrawerBackdrop.classList.add("open");
  }

  closeDrawer() {
    this.dom.calcDrawerBackdrop.classList.remove("open");
  }
}

// Instantiate on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  window.skinnova = new SkinnovaApp();
});
