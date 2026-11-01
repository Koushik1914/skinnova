/**
 * SKINNOVA - Climate Data Integration Module
 * Live Open-Meteo API + Geolocation + Graceful Offline / Fallback City Presets
 * 
 * Never displays raw errors. Silently provides high-fidelity sample data
 * when offline or when network requests fail.
 */

export const INDIAN_CITIES = [
  {
    name: "Delhi (NCR)",
    state: "Delhi",
    lat: 28.6139,
    lon: 77.2090,
    preset: {
      uv: 4.2,
      pm25: 168,
      pm10: 245,
      temp: 18,
      rh: 68,
      aqi: 320,
      season: "Winter Smog Phase"
    }
  },
  {
    name: "Mumbai",
    state: "Maharashtra",
    lat: 19.0760,
    lon: 72.8777,
    preset: {
      uv: 7.8,
      pm25: 62,
      pm10: 95,
      temp: 31,
      rh: 82,
      aqi: 145,
      season: "Coastal Humid"
    }
  },
  {
    name: "Chennai",
    state: "Tamil Nadu",
    lat: 13.0827,
    lon: 80.2707,
    preset: {
      uv: 10.6,
      pm25: 38,
      pm10: 58,
      temp: 34,
      rh: 79,
      aqi: 95,
      season: "Equatorial High UV"
    }
  },
  {
    name: "Bengaluru",
    state: "Karnataka",
    lat: 12.9716,
    lon: 77.5946,
    preset: {
      uv: 6.4,
      pm25: 42,
      pm10: 64,
      temp: 24,
      rh: 52,
      aqi: 88,
      season: "Plateau Temperate"
    }
  },
  {
    name: "Kolkata",
    state: "West Bengal",
    lat: 22.5726,
    lon: 88.3639,
    preset: {
      uv: 5.8,
      pm25: 115,
      pm10: 170,
      temp: 26,
      rh: 74,
      aqi: 210,
      season: "Riverine Moderate Polluted"
    }
  },
  {
    name: "Hyderabad",
    state: "Telangana",
    lat: 17.3850,
    lon: 78.4867,
    preset: {
      uv: 8.2,
      pm25: 55,
      pm10: 82,
      temp: 29,
      rh: 48,
      aqi: 122,
      season: "Deccan Semi-Arid"
    }
  },
  {
    name: "Vijayawada",
    state: "Andhra Pradesh",
    lat: 16.5062,
    lon: 80.6480,
    preset: {
      uv: 9.1,
      pm25: 46,
      pm10: 70,
      temp: 33,
      rh: 72,
      aqi: 104,
      season: "Krishna Basin Humid Heat"
    }
  },
  {
    name: "Jaipur",
    state: "Rajasthan",
    lat: 26.9124,
    lon: 75.7873,
    preset: {
      uv: 8.5,
      pm25: 88,
      pm10: 160,
      temp: 30,
      rh: 32,
      aqi: 175,
      season: "Arid High-Dust"
    }
  }
];

export class ClimateService {
  constructor() {
    this.currentCity = INDIAN_CITIES[0];
    this.isLive = false;
    this.isSampleMode = true;
    this.data = { ...this.currentCity.preset };
    this.sourceLabel = "Sample data (Delhi baseline)";
    this.listeners = [];
  }

  onChange(fn) {
    this.listeners.push(fn);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.getPayload()));
  }

  getPayload() {
    return {
      cityName: this.currentCity.name,
      state: this.currentCity.state,
      isLive: this.isLive,
      isSampleMode: this.isSampleMode,
      sourceLabel: this.sourceLabel,
      uv: Number(this.data.uv),
      pm25: Number(this.data.pm25),
      pm10: Number(this.data.pm10 || this.data.pm25 * 1.5),
      temp: Number(this.data.temp),
      rh: Number(this.data.rh),
      aqi: Number(this.data.aqi)
    };
  }

  /**
   * Set city by name and try fetching live data with silent fallback
   */
  async setCityByName(cityName, fetchLive = true) {
    const found = INDIAN_CITIES.find(c => c.name.toLowerCase().includes(cityName.toLowerCase()));
    if (found) {
      this.currentCity = found;
      if (fetchLive && navigator.onLine) {
        await this.fetchLiveData(found.lat, found.lon, found.name);
      } else {
        this.applyPreset(found);
      }
    }
    return this.getPayload();
  }

  applyPreset(cityObj) {
    this.currentCity = cityObj;
    this.data = { ...cityObj.preset };
    this.isLive = false;
    this.isSampleMode = true;
    this.sourceLabel = `Sample data (${cityObj.name} preset)`;
    this.notify();
  }

  /**
   * Manual override of parameters via sliders
   */
  updateManualValue(param, value) {
    this.data[param] = parseFloat(value);
    this.isLive = false;
    this.isSampleMode = true;
    this.sourceLabel = "Manual calibration mode";
    this.notify();
  }

  /**
   * Attempt geolocation
   */
  async requestGeolocation() {
    if (!navigator.geolocation) {
      return this.getPayload();
    }

    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          // Find closest Indian city for display name
          const closest = this.findClosestCity(latitude, longitude);
          this.currentCity = closest;
          await this.fetchLiveData(latitude, longitude, `${closest.name} (Nearby GPS)`);
          resolve(this.getPayload());
        },
        () => {
          // Denied or error - smoothly use current city preset
          this.applyPreset(this.currentCity);
          resolve(this.getPayload());
        },
        { timeout: 4000, maximumAge: 300000 }
      );
    });
  }

  findClosestCity(lat, lon) {
    let minD = Infinity;
    let closest = INDIAN_CITIES[0];
    for (const c of INDIAN_CITIES) {
      const d = Math.hypot(c.lat - lat, c.lon - lon);
      if (d < minD) {
        minD = d;
        closest = c;
      }
    }
    return closest;
  }

  /**
   * Fetch live weather and air quality from Open-Meteo
   */
  async fetchLiveData(lat, lon, label) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,uv_index`;
      const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5,pm10,us_aqi`;

      const [wRes, aRes] = await Promise.all([
        fetch(weatherUrl, { signal: controller.signal }),
        fetch(aqiUrl, { signal: controller.signal })
      ]);

      clearTimeout(timeoutId);

      if (!wRes.ok || !aRes.ok) {
        throw new Error("API non-200 response");
      }

      const wData = await wRes.json();
      const aData = await aRes.json();

      const curW = wData.current || {};
      const curA = aData.current || {};

      this.data = {
        uv: curW.uv_index != null ? curW.uv_index : this.currentCity.preset.uv,
        temp: curW.temperature_2m != null ? Math.round(curW.temperature_2m) : this.currentCity.preset.temp,
        rh: curW.relative_humidity_2m != null ? Math.round(curW.relative_humidity_2m) : this.currentCity.preset.rh,
        pm25: curA.pm2_5 != null ? Math.round(curA.pm2_5) : this.currentCity.preset.pm25,
        pm10: curA.pm10 != null ? Math.round(curA.pm10) : this.currentCity.preset.pm10,
        aqi: curA.us_aqi != null ? Math.round(curA.us_aqi) : this.currentCity.preset.aqi
      };

      this.isLive = true;
      this.isSampleMode = false;
      this.sourceLabel = `Live Open-Meteo Telemetry (${label})`;
      this.notify();
    } catch (err) {
      // Clean silent fallback to preset
      this.isLive = false;
      this.isSampleMode = true;
      this.sourceLabel = `Sample data (${this.currentCity.name} fallback)`;
      this.data = { ...this.currentCity.preset };
      this.notify();
    }
  }
}
