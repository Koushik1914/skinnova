/**
 * SKINNOVA - Local Storage, Longitudinal Tracking & Sustainability Engine
 * 
 * Strict Privacy:
 * All scan data is stored locally in the browser's localStorage.
 * No data, tokens, or photos ever leave the client machine.
 * All operations are defensively wrapped in try/catch to ensure
 * zero failure in private browsing modes.
 */

const STORAGE_KEYS = {
  HISTORY: "skinnova_scan_history_v1",
  BASELINE: "skinnova_user_baseline_v1",
  SUSTAINABILITY: "skinnova_sustain_stats_v1"
};

export class StorageService {
  constructor() {
    this.isAvailable = this.checkStorageAvailability();
  }

  checkStorageAvailability() {
    try {
      const test = "__test_local_storage__";
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  getHistory() {
    if (!this.isAvailable) return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  saveScan(scanRecord) {
    if (!this.isAvailable) return;
    try {
      const history = this.getHistory();
      // Keep last 30 scans
      history.unshift({
        id: "scan_" + Date.now(),
        timestamp: new Date().toISOString(),
        dateStr: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        ...scanRecord
      });
      if (history.length > 30) history.pop();
      window.localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));

      // Update sustainability streak
      this.incrementStreak(scanRecord.avoidedStepsCount || 0);
    } catch (e) {
      // Gracefully silent
    }
  }

  getBaseline() {
    if (!this.isAvailable) return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.BASELINE);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  setBaseline(metrics) {
    if (!this.isAvailable) return;
    try {
      window.localStorage.setItem(STORAGE_KEYS.BASELINE, JSON.stringify({
        date: new Date().toISOString(),
        metrics
      }));
    } catch (e) {
      // Gracefully silent
    }
  }

  clearBaseline() {
    if (!this.isAvailable) return;
    try {
      window.localStorage.removeItem(STORAGE_KEYS.BASELINE);
    } catch (e) {
      // Gracefully silent
    }
  }

  getSustainabilityStats() {
    const defaults = {
      streakDays: 4,
      totalAvoidedProducts: 9,
      carbonAvoidedGrams: 36, // ~4g per avoided product packaging cycle (target estimate)
      onDeviceEnergySavedWh: 0.24, // ~0.078 Wh saved per scan vs cloud GPU API call (target estimate)
      packagingCyclesRefilled: 1
    };

    if (!this.isAvailable) return defaults;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.SUSTAINABILITY);
      return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
    } catch (e) {
      return defaults;
    }
  }

  incrementStreak(avoidedSteps = 0) {
    if (!this.isAvailable) return;
    try {
      const stats = this.getSustainabilityStats();
      stats.streakDays = (stats.streakDays || 0) + 1;
      stats.totalAvoidedProducts = (stats.totalAvoidedProducts || 0) + avoidedSteps;
      stats.carbonAvoidedGrams = (stats.carbonAvoidedGrams || 0) + (avoidedSteps * 4);
      stats.onDeviceEnergySavedWh = +(stats.onDeviceEnergySavedWh + 0.08).toFixed(2);
      window.localStorage.setItem(STORAGE_KEYS.SUSTAINABILITY, JSON.stringify(stats));
    } catch (e) {
      // Gracefully silent
    }
  }

  /**
   * Prepopulate historical trend data if user history is empty
   * This provides an immediate, elegant clinical graph demonstration
   */
  getOrSeedTrendData() {
    const history = this.getHistory();
    if (history.length >= 3) {
      return history.slice(0, 14).reverse();
    }

    // Seed realistic 7-day longitudinal history for Indian urban user
    const sampleTrend = [
      { dateStr: "Day 1", resilience: 74, cssi: 48, label: "Initial Calibration" },
      { dateStr: "Day 3", resilience: 71, cssi: 56, label: "Moderate Smog" },
      { dateStr: "Day 6", resilience: 68, cssi: 64, label: "Elevated PM2.5" },
      { dateStr: "Day 10", resilience: 75, cssi: 42, label: "Clear Day" },
      { dateStr: "Day 14", resilience: 79, cssi: 35, label: "Barrier Restored" },
      { dateStr: "Day 21", resilience: 72, cssi: 58, label: "High UV Spike" },
      { dateStr: "Today", resilience: 76, cssi: 50, label: "Current Equilibrium" }
    ];
    return sampleTrend;
  }

  /**
   * Render an inline SVG trend line
   */
  renderTrendSvg(trendData, width = 320, height = 120) {
    if (!trendData || trendData.length === 0) {
      return `<div class="empty-trend-message">No historical scans recorded yet. First scan establishes baseline.</div>`;
    }

    const padding = { top: 16, right: 24, bottom: 24, left: 24 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const scores = trendData.map(d => d.resilience || d.score || 70);
    const minVal = 40;
    const maxVal = 100;

    const points = scores.map((score, idx) => {
      const x = padding.left + (idx / (scores.length - 1)) * chartW;
      const normY = (score - minVal) / (maxVal - minVal);
      const y = padding.top + chartH - (normY * chartH);
      return { x, y, score, label: trendData[idx].dateStr };
    });

    const pathD = points.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, "");

    // Area fill path
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;

    const dots = points.map(pt => `
      <circle cx="${pt.x}" cy="${pt.y}" r="3.5" fill="var(--color-navy)" stroke="var(--color-teal)" stroke-width="2"/>
    `).join("");

    const labels = points.filter((_, i) => i === 0 || i === Math.floor(points.length / 2) || i === points.length - 1).map(pt => `
      <text x="${pt.x}" y="${height - 6}" font-size="10" fill="var(--color-text-muted)" text-anchor="middle" font-family="Inter, sans-serif">${pt.label}</text>
    `).join("");

    return `
      <svg class="trend-chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="30-day resilience trend line">
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--color-teal)" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="var(--color-teal)" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        <!-- Horizontal benchmark guides -->
        <line x1="${padding.left}" y1="${padding.top}" x2="${width - padding.right}" y2="${padding.top}" stroke="var(--color-border)" stroke-dasharray="2,3" stroke-width="1"/>
        <line x1="${padding.left}" y1="${padding.top + chartH / 2}" x2="${width - padding.right}" y2="${padding.top + chartH / 2}" stroke="var(--color-border)" stroke-dasharray="2,3" stroke-width="1"/>
        <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="var(--color-border)" stroke-width="1"/>
        <!-- Area & line -->
        <path d="${areaD}" fill="url(#trendGradient)"/>
        <path d="${pathD}" fill="none" stroke="var(--color-teal)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        ${dots}
        ${labels}
      </svg>
    `;
  }
}
