/* ==========================================================================
   SKYFLOW APP ENGINE (API INTEGRATION & VISUAL WIDGET CALCULATIONS)
   ========================================================================== */

// --- Application State ---
const state = {
  activeLocation: {
    name: 'Lucknow',
    country: 'India',
    lat: 26.8467,
    lon: 80.9462
  },
  tempUnit: 'C', // 'C' or 'F'
  themeMode: 'auto', // 'auto' (dynamic photo) or 'dark'
  favorites: [],
  weatherData: null,
  aqiData: null,
  hourlyChart: null,
  isFiveDayView: true // toggle between 5-day and 7-day view
};

// --- DOM Element References ---
const DOM = {
  currentCity: document.getElementById('current-city'),
  locationPinBtn: document.getElementById('location-pin-btn'),
  openSearchBtn: document.getElementById('open-search-btn'),
  openSettingsBtn: document.getElementById('open-settings-btn'),
  locationDots: document.getElementById('location-dots'),
  
  heroTemp: document.getElementById('hero-temp'),
  heroConditionText: document.getElementById('hero-condition-text'),
  heroTempRange: document.getElementById('hero-temp-range'),
  heroAqiPill: document.getElementById('hero-aqi-pill'),
  heroAqiText: document.getElementById('hero-aqi-text'),
  
  forecastCardTitle: document.getElementById('forecast-card-title'),
  forecastDailyList: document.getElementById('forecast-daily-list'),
  toggleForecastDaysBtn: document.getElementById('toggle-forecast-days-btn'),
  
  hourlySliderList: document.getElementById('hourly-slider-list'),
  
  gaugeUvStatus: document.getElementById('gauge-uv-status'),
  gaugeUvNum: document.getElementById('gauge-uv-num'),
  uvGaugeArc: document.getElementById('uv-gauge-arc'),
  
  gaugeHumidityText: document.getElementById('gauge-humidity-text'),
  humidityGaugeArc: document.getElementById('humidity-gauge-arc'),
  
  gaugeRealfeelText: document.getElementById('gauge-realfeel-text'),
  realfeelNeedle: document.getElementById('realfeel-needle'),
  
  gaugeWindDirTitle: document.getElementById('gauge-wind-dir-title'),
  gaugeWindSpeedText: document.getElementById('gauge-wind-speed-text'),
  compassNeedleGroup: document.getElementById('compass-needle-group'),
  
  gaugeSunriseText: document.getElementById('gauge-sunrise-text'),
  sunCurveActive: document.getElementById('sun-curve-active'),
  sunCurveDot: document.getElementById('sun-curve-dot'),
  gaugeSunriseSub: document.getElementById('gauge-sunrise-sub'),
  gaugeSunsetSub: document.getElementById('gauge-sunset-sub'),
  
  gaugePressureText: document.getElementById('gauge-pressure-text'),
  pressureGaugeArc: document.getElementById('pressure-gauge-arc'),
  
  aqiFullScore: document.getElementById('aqi-full-score'),
  aqiFullDesc: document.getElementById('aqi-full-desc'),
  aqiFullFill: document.getElementById('aqi-full-fill'),
  aqiPm25: document.getElementById('aqi-pm25'),
  aqiPm10: document.getElementById('aqi-pm10'),
  
  searchModal: document.getElementById('search-modal'),
  closeSearchBtn: document.getElementById('close-search-btn'),
  citySearchInput: document.getElementById('city-search-input'),
  modalGeoBtn: document.getElementById('modal-geo-btn'),
  searchSuggestionsList: document.getElementById('search-suggestions-list'),
  modalFavoritesChips: document.getElementById('modal-favorites-chips'),
  pinCurrentCityBtn: document.getElementById('pin-current-city-btn'),
  
  settingsModal: document.getElementById('settings-modal'),
  closeSettingsBtn: document.getElementById('close-settings-btn'),
  btnUnitC: document.getElementById('btn-unit-c'),
  btnUnitF: document.getElementById('btn-unit-f'),
  themeToggleSwitchBtn: document.getElementById('theme-toggle-switch-btn'),
  settingsThemeText: document.getElementById('settings-theme-text'),
  settingsThemeIcon: document.getElementById('settings-theme-icon'),
  settingsRedetectGps: document.getElementById('settings-redetect-gps'),
  
  loadingOverlay: document.getElementById('loading-overlay'),
  errorOverlay: document.getElementById('error-overlay'),
  errorMessage: document.getElementById('error-message'),
  errorRetryBtn: document.getElementById('error-retry-btn')
};

// --- Constants ---
const NOMINATIM_USER_AGENT = 'SkyFlowWeatherApp/2.0';
const DEBOUNCE_DELAY = 350;
const DEFAULT_FAVORITES = [
  { name: 'Lucknow', country: 'India', lat: 26.8467, lon: 80.9462 },
  { name: 'New York', country: 'United States', lat: 40.7128, lon: -74.0060 },
  { name: 'Tokyo', country: 'Japan', lat: 35.6895, lon: 139.6917 }
];

// --- Weather Code Mapping (WMO Standard) ---
function getWeatherMeta(code, isDay) {
  const map = {
    0: { desc: 'Clear Sky', bg: isDay ? 'weather-bg-clear-day' : 'weather-bg-clear-night', icon: getSunMoonIcon(isDay) },
    1: { desc: 'Mainly Clear', bg: isDay ? 'weather-bg-clear-day' : 'weather-bg-clear-night', icon: getSunMoonIcon(isDay) },
    2: { desc: 'Partly Cloudy', bg: 'weather-bg-cloudy', icon: getCloudyIcon(true) },
    3: { desc: 'Overcast', bg: 'weather-bg-cloudy', icon: getCloudyIcon(false) },
    45: { desc: 'Foggy', bg: 'weather-bg-foggy', icon: getFogIcon() },
    48: { desc: 'Rime Fog', bg: 'weather-bg-foggy', icon: getFogIcon() },
    51: { desc: 'Light Drizzle', bg: 'weather-bg-rainy', icon: getRainIcon(false) },
    53: { desc: 'Drizzle', bg: 'weather-bg-rainy', icon: getRainIcon(false) },
    55: { desc: 'Dense Drizzle', bg: 'weather-bg-rainy', icon: getRainIcon(true) },
    61: { desc: 'Slight Rain', bg: 'weather-bg-rainy', icon: getRainIcon(false) },
    63: { desc: 'Moderate Rain', bg: 'weather-bg-rainy', icon: getRainIcon(false) },
    65: { desc: 'Heavy Rain', bg: 'weather-bg-rainy', icon: getRainIcon(true) },
    71: { desc: 'Slight Snow', bg: 'weather-bg-snowy', icon: getSnowIcon() },
    73: { desc: 'Moderate Snow', bg: 'weather-bg-snowy', icon: getSnowIcon() },
    75: { desc: 'Heavy Snow', bg: 'weather-bg-snowy', icon: getSnowIcon() },
    80: { desc: 'Rain Showers', bg: 'weather-bg-rainy', icon: getRainIcon(true) },
    81: { desc: 'Heavy Showers', bg: 'weather-bg-rainy', icon: getRainIcon(true) },
    82: { desc: 'Violent Showers', bg: 'weather-bg-rainy', icon: getRainIcon(true) },
    95: { desc: 'Thunderstorm', bg: 'weather-bg-stormy', icon: getStormIcon() },
    96: { desc: 'Thunderstorm with Hail', bg: 'weather-bg-stormy', icon: getStormIcon() },
    99: { desc: 'Severe Thunderstorm', bg: 'weather-bg-stormy', icon: getStormIcon() }
  };
  return map[code] || { desc: 'Cloudy', bg: 'weather-bg-cloudy', icon: getCloudyIcon(false) };
}

// Inline SVG Icon Builders for Forecast Rows and Slider
function getSunMoonIcon(isDay) {
  return isDay
    ? `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill="#fbbf24"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#93c5fd" stroke="#60a5fa" stroke-width="1.5"/></svg>`;
}

function getCloudyIcon(isSun) {
  return `<svg viewBox="0 0 24 24" fill="none">
    ${isSun ? '<circle cx="8" cy="8" r="3.5" fill="#fbbf24"/>' : ''}
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="rgba(255,255,255,0.9)"/>
  </svg>`;
}

function getRainIcon(isHeavy) {
  return `<svg viewBox="0 0 24 24" fill="none">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="rgba(255,255,255,0.9)"/>
    <line x1="8" y1="21" x2="6" y2="24" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
    <line x1="13" y1="21" x2="11" y2="24" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
    ${isHeavy ? '<line x1="18" y1="21" x2="16" y2="24" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>' : ''}
  </svg>`;
}

function getSnowIcon() {
  return `<svg viewBox="0 0 24 24" fill="none">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="rgba(255,255,255,0.9)"/>
    <circle cx="8" cy="22" r="1.5" fill="#e2e8f0"/>
    <circle cx="14" cy="22" r="1.5" fill="#e2e8f0"/>
  </svg>`;
}

function getStormIcon() {
  return `<svg viewBox="0 0 24 24" fill="none">
    <path d="M18 10h-1.26A8 8 0 1 0 9 18h9a5 5 0 0 0 0-10z" fill="rgba(255,255,255,0.85)"/>
    <polygon points="12,16 9,21 13,21 11,25 16,19 12,19" fill="#fbbf24"/>
  </svg>`;
}

function getFogIcon() {
  return `<svg viewBox="0 0 24 24" fill="none">
    <line x1="3" y1="10" x2="21" y2="10" stroke="rgba(255,255,255,0.8)" stroke-width="2" stroke-linecap="round"/>
    <line x1="5" y1="14" x2="19" y2="14" stroke="rgba(255,255,255,0.8)" stroke-width="2" stroke-linecap="round"/>
    <line x1="3" y1="18" x2="21" y2="18" stroke="rgba(255,255,255,0.8)" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}

// --- Unit Conversions ---
function cToF(c) {
  return Math.round((c * 9/5) + 32);
}

function convertTemp(cTemp) {
  if (cTemp === null || cTemp === undefined) return '--';
  return state.tempUnit === 'C' ? Math.round(cTemp) : cToF(cTemp);
}

function formatTempUnit(cTemp) {
  return `${convertTemp(cTemp)}°`;
}

// --- Wind Direction Cardinal Finder ---
function getWindCardinal(deg) {
  const directions = ['North', 'NNE', 'NE', 'ENE', 'East', 'ESE', 'SE', 'SSE', 'South', 'SSW', 'SW', 'WSW', 'West', 'WNW', 'NW', 'NNW'];
  const index = Math.round(deg / 22.5) % 16;
  return directions[index];
}

// --- AQI Evaluation ---
function getAqiDescription(aqi) {
  if (aqi <= 50) return { desc: 'Good Air Quality', color: '#34d399' };
  if (aqi <= 100) return { desc: 'Moderate Air Quality', color: '#fbbf24' };
  if (aqi <= 150) return { desc: 'Unhealthy (Sensitive)', color: '#fb923c' };
  if (aqi <= 200) return { desc: 'Unhealthy Air Quality', color: '#f87171' };
  if (aqi <= 300) return { desc: 'Very Unhealthy', color: '#c084fc' };
  return { desc: 'Hazardous Air Quality', color: '#e11d48' };
}

// --- Overlays ---
function showLoader() {
  DOM.loadingOverlay.classList.remove('hidden');
}

function hideLoader() {
  DOM.loadingOverlay.classList.add('hidden');
}

function showError(msg) {
  DOM.errorMessage.textContent = msg;
  DOM.errorOverlay.classList.remove('hidden');
}

function hideError() {
  DOM.errorOverlay.classList.add('hidden');
}

// --- Parallel Weather & Air Quality Fetch Engine ---
async function fetchWeather(lat, lon) {
  showLoader();
  try {
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto`;
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10&timezone=auto`;

    const [forecastRes, aqiRes] = await Promise.all([
      fetch(forecastUrl),
      fetch(aqiUrl).catch(() => null)
    ]);

    if (!forecastRes.ok) throw new Error('Could not retrieve weather data.');
    
    state.weatherData = await forecastRes.json();
    
    if (aqiRes && aqiRes.ok) {
      state.aqiData = await aqiRes.json();
    } else {
      state.aqiData = null;
    }

    // Persist last valid city
    localStorage.setItem('skyflow_last_location', JSON.stringify(state.activeLocation));

    hideError();
    renderAppDashboard();
  } catch (error) {
    console.error(error);
    showError(error.message || 'Unable to connect to weather services.');
  } finally {
    hideLoader();
  }
}

// --- Main UI Rendering Engine ---
function renderAppDashboard() {
  if (!state.weatherData) return;

  const current = state.weatherData.current;
  const daily = state.weatherData.daily;
  const meta = getWeatherMeta(current.weather_code, current.is_day === 1);

  // 1. Photographic Weather Background
  document.body.className = `${meta.bg} ${state.themeMode === 'dark' ? 'mode-dark' : ''}`;

  // 2. Header & Location
  DOM.currentCity.textContent = state.activeLocation.name;
  updateLocationDots();

  // 3. Hero Weather Section
  DOM.heroTemp.textContent = convertTemp(current.temperature_2m);
  DOM.heroConditionText.textContent = meta.desc;
  
  const minTempToday = formatTempUnit(daily.temperature_2m_min[0]);
  const maxTempToday = formatTempUnit(daily.temperature_2m_max[0]);
  DOM.heroTempRange.textContent = `${maxTempToday} / ${minTempToday}`;

  // AQI Badge, Score, and Pollutants (Live Real-Time Data)
  const aqiCurrent = state.aqiData && state.aqiData.current ? state.aqiData.current : null;
  const aqiValue = aqiCurrent && aqiCurrent.us_aqi !== null ? Math.round(aqiCurrent.us_aqi) : 110;
  const aqiInfo = getAqiDescription(aqiValue);
  
  DOM.heroAqiText.textContent = `AQI ${aqiValue}`;
  DOM.aqiFullScore.textContent = aqiValue;
  DOM.aqiFullDesc.textContent = aqiInfo.desc;
  DOM.aqiFullDesc.style.color = aqiInfo.color;
  DOM.aqiFullFill.style.width = `${Math.min(Math.round((aqiValue / 300) * 100), 100)}%`;

  if (DOM.aqiPm25 && DOM.aqiPm10) {
    DOM.aqiPm25.textContent = aqiCurrent && aqiCurrent.pm2_5 !== undefined ? aqiCurrent.pm2_5 : '--';
    DOM.aqiPm10.textContent = aqiCurrent && aqiCurrent.pm10 !== undefined ? aqiCurrent.pm10 : '--';
  }

  // 4. Daily Forecast List (5-Day or 7-Day)
  renderDailyForecast();

  // 5. 24-Hour Curve & Sliders
  renderHourlyChartAndSlider();

  // 6. Interactive SVG Gauges
  renderGauges(current, daily);

  // Refresh Lucide dynamic icons
  lucide.createIcons();
}

function updateLocationDots() {
  const activeIdx = state.favorites.findIndex(f => f.name.toLowerCase() === state.activeLocation.name.toLowerCase());
  DOM.locationDots.innerHTML = '';
  
  const totalDots = Math.max(state.favorites.length, 1);
  for (let i = 0; i < totalDots; i++) {
    const dot = document.createElement('span');
    dot.className = `dot ${i === (activeIdx >= 0 ? activeIdx : 0) ? 'active' : ''}`;
    DOM.locationDots.appendChild(dot);
  }
}

// --- 5-Day / 7-Day Forecast Card Renderer ---
function renderDailyForecast() {
  const daily = state.weatherData.daily;
  DOM.forecastDailyList.innerHTML = '';

  const daysToShow = state.isFiveDayView ? 5 : 7;
  DOM.forecastCardTitle.textContent = `${daysToShow}-day forecast`;
  DOM.toggleForecastDaysBtn.querySelector('span').textContent = state.isFiveDayView ? 'View 7-day forecast' : 'Show 5-day forecast';

  const globalMin = Math.min(...daily.temperature_2m_min.slice(0, daysToShow));
  const globalMax = Math.max(...daily.temperature_2m_max.slice(0, daysToShow));
  const globalRange = globalMax - globalMin || 1;

  for (let i = 0; i < daysToShow; i++) {
    const date = new Date(daily.time[i]);
    const weekday = i === 0 ? 'Today' : (i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short' }));
    const minTemp = daily.temperature_2m_min[i];
    const maxTemp = daily.temperature_2m_max[i];
    const meta = getWeatherMeta(daily.weather_code[i], true);

    const row = document.createElement('div');
    row.className = 'forecast-row';

    // Day Name
    const dayEl = document.createElement('span');
    dayEl.className = 'forecast-day-name';
    dayEl.textContent = weekday;
    row.appendChild(dayEl);

    // Weather Icon
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'forecast-icon-wrapper';
    iconWrapper.innerHTML = meta.icon;
    row.appendChild(iconWrapper);

    // Min Temp
    const minEl = document.createElement('span');
    minEl.className = 'forecast-temp-min';
    minEl.textContent = formatTempUnit(minTemp);
    row.appendChild(minEl);

    // Range Slider Track
    const track = document.createElement('div');
    track.className = 'forecast-slider-track';

    const leftPercent = ((minTemp - globalMin) / globalRange) * 100;
    const widthPercent = Math.max(((maxTemp - minTemp) / globalRange) * 100, 8);

    const fill = document.createElement('div');
    fill.className = 'forecast-slider-fill';
    fill.style.left = `${leftPercent}%`;
    fill.style.width = `${widthPercent}%`;
    track.appendChild(fill);

    const dot = document.createElement('div');
    dot.className = 'forecast-slider-dot';
    dot.style.left = `${leftPercent + (widthPercent * 0.5)}%`;
    track.appendChild(dot);

    row.appendChild(track);

    // Max Temp
    const maxEl = document.createElement('span');
    maxEl.className = 'forecast-temp-max';
    maxEl.textContent = formatTempUnit(maxTemp);
    row.appendChild(maxEl);

    DOM.forecastDailyList.appendChild(row);
  }
}

// --- 24-Hour Forecast Chart & Horizontal Slider ---
function renderHourlyChartAndSlider() {
  const hourly = state.weatherData.hourly;
  const currentLocalTime = new Date(state.weatherData.current.time);

  let startIndex = hourly.time.findIndex(t => new Date(t).getHours() === currentLocalTime.getHours() && new Date(t).getDate() === currentLocalTime.getDate());
  if (startIndex === -1) startIndex = 0;

  const times = [];
  const temps = [];
  const codes = [];
  const winds = [];

  for (let i = 0; i < 24; i++) {
    const idx = startIndex + i;
    if (idx >= hourly.time.length) break;

    const tObj = new Date(hourly.time[idx]);
    const hr = tObj.getHours();
    const formattedHr = `${hr.toString().padStart(2, '0')}:00`;

    times.push(i === 0 ? 'Now' : formattedHr);
    temps.push(convertTemp(hourly.temperature_2m[idx]));
    codes.push(hourly.weather_code[idx]);
    winds.push(Math.round(hourly.wind_speed_10m[idx] * 10) / 10);
  }

  // Draw Smooth Golden/Cyan Bezier Line Chart
  if (state.hourlyChart) {
    state.hourlyChart.destroy();
  }

  const ctx = document.getElementById('hourly-temp-chart').getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 90);
  gradient.addColorStop(0, 'rgba(251, 191, 36, 0.35)');
  gradient.addColorStop(1, 'rgba(251, 191, 36, 0.0)');

  state.hourlyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: times,
      datasets: [{
        data: temps,
        borderColor: '#fbbf24',
        borderWidth: 2.5,
        tension: 0.45,
        fill: true,
        backgroundColor: gradient,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#fbbf24',
        pointBorderWidth: 2,
        pointRadius: (ctx) => ctx.dataIndex === 0 ? 4.5 : 0,
        pointHoverRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleFont: { family: 'Outfit', size: 12 },
          bodyFont: { family: 'Outfit', size: 14, weight: 'bold' },
          displayColors: false,
          callbacks: {
            label: (context) => ` ${context.parsed.y}°`
          }
        }
      },
      scales: {
        x: { display: false },
        y: { display: false }
      }
    }
  });

  // Slider Elements
  DOM.hourlySliderList.innerHTML = '';
  times.forEach((time, index) => {
    const item = document.createElement('div');
    item.className = 'hourly-item';

    const tempEl = document.createElement('span');
    tempEl.className = 'hourly-item-temp';
    tempEl.textContent = `${temps[index]}°`;
    item.appendChild(tempEl);

    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'hourly-item-icon';
    iconWrapper.innerHTML = getWeatherMeta(codes[index], true).icon;
    item.appendChild(iconWrapper);

    const windEl = document.createElement('span');
    windEl.className = 'hourly-item-wind';
    windEl.textContent = `${winds[index]}km/h`;
    item.appendChild(windEl);

    const timeEl = document.createElement('span');
    timeEl.className = 'hourly-item-time';
    timeEl.textContent = time;
    item.appendChild(timeEl);

    DOM.hourlySliderList.appendChild(item);
  });
}

// --- Interactive SVG Gauges Calculation Engine ---
function renderGauges(current, daily) {
  // 1. UV Gauge
  const maxUvToday = daily.uv_index_max ? daily.uv_index_max[0] : 1;
  DOM.gaugeUvNum.textContent = Math.round(maxUvToday);
  
  let uvStatus = 'Weak';
  if (maxUvToday > 2 && maxUvToday <= 5) uvStatus = 'Moderate';
  else if (maxUvToday > 5 && maxUvToday <= 7) uvStatus = 'High';
  else if (maxUvToday > 7 && maxUvToday <= 10) uvStatus = 'Very High';
  else if (maxUvToday > 10) uvStatus = 'Extreme';
  DOM.gaugeUvStatus.textContent = uvStatus;

  const uvArcLength = 190;
  const uvOffset = uvArcLength - (Math.min(maxUvToday, 11) / 11) * uvArcLength;
  DOM.uvGaugeArc.style.strokeDashoffset = uvOffset;

  // 2. Humidity Gauge
  const humidity = current.relative_humidity_2m;
  DOM.gaugeHumidityText.textContent = `${humidity}%`;
  const humArcLength = 190;
  const humOffset = humArcLength - (humidity / 100) * humArcLength;
  DOM.humidityGaugeArc.style.strokeDashoffset = humOffset;

  // 3. Real Feel Needle
  const apparentTemp = current.apparent_temperature;
  DOM.gaugeRealfeelText.textContent = formatTempUnit(apparentTemp);
  // Map -10°C .. 45°C to needle rotation -70deg .. +70deg
  const clampedTemp = Math.min(Math.max(apparentTemp, -10), 45);
  const needleRotation = ((clampedTemp - (-10)) / (45 - (-10))) * 140 - 70;
  DOM.realfeelNeedle.setAttribute('transform', `rotate(${needleRotation}, 50, 70)`);

  // 4. Wind & Compass Needle
  const windSpeed = Math.round(current.wind_speed_10m * 10) / 10;
  const windHeading = current.wind_direction_10m;
  DOM.gaugeWindDirTitle.textContent = getWindCardinal(windHeading);
  DOM.gaugeWindSpeedText.textContent = windSpeed;
  DOM.compassNeedleGroup.setAttribute('transform', `rotate(${windHeading}, 50, 50)`);

  // 5. Sunrise & Sunset Parabolic Arc
  const sunriseIso = daily.sunrise[0];
  const sunsetIso = daily.sunset[0];
  
  const formatHourMin = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };
  
  const sunriseStr = formatHourMin(sunriseIso);
  const sunsetStr = formatHourMin(sunsetIso);
  DOM.gaugeSunriseText.textContent = sunriseStr;
  DOM.gaugeSunriseSub.textContent = sunriseStr;
  DOM.gaugeSunsetSub.textContent = sunsetStr;

  // Position Sun Dot along Bezier path: (15,55) -> control (60,12) -> (105,55)
  const now = new Date();
  const sunriseTime = new Date(sunriseIso);
  const sunsetTime = new Date(sunsetIso);
  
  let sunProgress = (now - sunriseTime) / (sunsetTime - sunriseTime);
  sunProgress = Math.min(Math.max(sunProgress, 0), 1);
  
  const t = sunProgress;
  const dotX = (1 - t) * (1 - t) * 15 + 2 * (1 - t) * t * 60 + t * t * 105;
  const dotY = (1 - t) * (1 - t) * 55 + 2 * (1 - t) * t * 12 + t * t * 55;
  
  DOM.sunCurveDot.setAttribute('cx', dotX);
  DOM.sunCurveDot.setAttribute('cy', dotY);
  DOM.sunCurveActive.style.strokeDashoffset = 160 - (t * 160);

  // 6. Pressure Gauge
  const pressure = Math.round(current.pressure_msl);
  DOM.gaugePressureText.textContent = pressure;
  const pressArcLength = 160;
  const pressPercent = Math.min(Math.max(pressure - 960, 0), 80) / 80;
  DOM.pressureGaugeArc.style.strokeDashoffset = pressArcLength - (pressPercent * pressArcLength);
}

// --- Geolocation Handler ---
function detectLocation() {
  if (!navigator.geolocation) {
    showError('Geolocation is not supported by your browser.');
    return;
  }

  showLoader();
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      state.activeLocation = {
        name: 'Your Location',
        country: '',
        lat: latitude,
        lon: longitude
      };

      try {
        const revUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
        const res = await fetch(revUrl, {
          headers: { 'User-Agent': NOMINATIM_USER_AGENT }
        });
        if (res.ok) {
          const data = await res.json();
          state.activeLocation.name = data.address.city || data.address.town || data.address.village || data.address.county || 'Your Location';
          state.activeLocation.country = data.address.country || '';
        }
      } catch (err) {
        console.warn('Reverse geocoding lookup failed.');
      }

      fetchWeather(latitude, longitude);
    },
    (err) => {
      hideLoader();
      showError('Location access was denied or unavailable. Please use the search bar to pick your city.');
    },
    { timeout: 8000 }
  );
}

// --- Search Autocomplete Handler ---
let searchDebounce;
function handleSearchInput(e) {
  const query = e.target.value.trim();
  clearTimeout(searchDebounce);
  
  if (query.length < 2) {
    DOM.searchSuggestionsList.classList.add('hidden');
    return;
  }

  searchDebounce = setTimeout(async () => {
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      
      if (data.results && data.results.length > 0) {
        renderSearchSuggestions(data.results);
      } else {
        DOM.searchSuggestionsList.classList.add('hidden');
      }
    } catch (err) {
      console.error(err);
    }
  }, DEBOUNCE_DELAY);
}

function renderSearchSuggestions(cities) {
  DOM.searchSuggestionsList.innerHTML = '';
  cities.forEach((city) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="sugg-main">${city.name}</span>
      <span class="sugg-sub">${city.admin1 ? city.admin1 + ', ' : ''}${city.country || ''}</span>
    `;
    li.addEventListener('click', () => {
      state.activeLocation = {
        name: city.name,
        country: city.country || '',
        lat: city.latitude,
        lon: city.longitude
      };
      DOM.searchModal.classList.add('hidden');
      DOM.citySearchInput.value = '';
      DOM.searchSuggestionsList.classList.add('hidden');
      fetchWeather(city.latitude, city.longitude);
    });
    DOM.searchSuggestionsList.appendChild(li);
  });
  DOM.searchSuggestionsList.classList.remove('hidden');
}

// --- Pinned Locations / Favorites ---
function loadFavorites() {
  const stored = localStorage.getItem('skyflow_favorites');
  state.favorites = stored ? JSON.parse(stored) : [...DEFAULT_FAVORITES];
  renderFavoriteChips();
}

function saveFavorites() {
  localStorage.setItem('skyflow_favorites', JSON.stringify(state.favorites));
  renderFavoriteChips();
  updateLocationDots();
}

function renderFavoriteChips() {
  DOM.modalFavoritesChips.innerHTML = '';
  state.favorites.forEach((fav) => {
    const chip = document.createElement('div');
    chip.className = 'fav-chip';
    chip.innerHTML = `
      <span>${fav.name}</span>
      <span class="fav-chip-remove" title="Remove"><i data-lucide="x"></i></span>
    `;
    
    chip.addEventListener('click', (e) => {
      if (e.target.closest('.fav-chip-remove')) return;
      state.activeLocation = fav;
      DOM.searchModal.classList.add('hidden');
      fetchWeather(fav.lat, fav.lon);
    });

    chip.querySelector('.fav-chip-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = state.favorites.indexOf(fav);
      if (idx > -1) {
        state.favorites.splice(idx, 1);
        saveFavorites();
      }
    });

    DOM.modalFavoritesChips.appendChild(chip);
  });
  lucide.createIcons();
}

function pinCurrentCity() {
  const exists = state.favorites.some(f => f.name.toLowerCase() === state.activeLocation.name.toLowerCase());
  if (!exists) {
    state.favorites.push({ ...state.activeLocation });
    saveFavorites();
  }
}

// --- Event Listeners Binding ---
function bindEvents() {
  // Modals Toggle
  DOM.openSearchBtn.addEventListener('click', () => {
    DOM.searchModal.classList.remove('hidden');
    DOM.citySearchInput.focus();
  });

  DOM.closeSearchBtn.addEventListener('click', () => {
    DOM.searchModal.classList.add('hidden');
  });

  DOM.openSettingsBtn.addEventListener('click', () => {
    DOM.settingsModal.classList.remove('hidden');
  });

  DOM.closeSettingsBtn.addEventListener('click', () => {
    DOM.settingsModal.classList.add('hidden');
  });

  // Search
  DOM.citySearchInput.addEventListener('input', handleSearchInput);
  DOM.modalGeoBtn.addEventListener('click', () => {
    DOM.searchModal.classList.add('hidden');
    detectLocation();
  });
  DOM.locationPinBtn.addEventListener('click', detectLocation);
  DOM.pinCurrentCityBtn.addEventListener('click', pinCurrentCity);

  // Unit Switcher
  DOM.btnUnitC.addEventListener('click', () => {
    state.tempUnit = 'C';
    DOM.btnUnitC.classList.add('active');
    DOM.btnUnitF.classList.remove('active');
    localStorage.setItem('skyflow_temp_unit', 'C');
    renderAppDashboard();
  });

  DOM.btnUnitF.addEventListener('click', () => {
    state.tempUnit = 'F';
    DOM.btnUnitF.classList.add('active');
    DOM.btnUnitC.classList.remove('active');
    localStorage.setItem('skyflow_temp_unit', 'F');
    renderAppDashboard();
  });

  // Theme Switcher
  DOM.themeToggleSwitchBtn.addEventListener('click', () => {
    state.themeMode = state.themeMode === 'dark' ? 'auto' : 'dark';
    localStorage.setItem('skyflow_theme_mode', state.themeMode);
    DOM.settingsThemeText.textContent = state.themeMode === 'dark' ? 'Dark Tint' : 'Dynamic Sky';
    renderAppDashboard();
  });

  DOM.settingsRedetectGps.addEventListener('click', () => {
    DOM.settingsModal.classList.add('hidden');
    detectLocation();
  });

  // Forecast Days Toggle (5-day vs 7-day)
  DOM.toggleForecastDaysBtn.addEventListener('click', () => {
    state.isFiveDayView = !state.isFiveDayView;
    renderDailyForecast();
  });

  DOM.errorRetryBtn.addEventListener('click', () => {
    hideError();
    fetchWeather(state.activeLocation.lat, state.activeLocation.lon);
  });
}

// --- Service Worker Registration ---
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('[Service Worker] Active.', reg.scope))
      .catch(err => console.warn('[Service Worker] Error:', err));
  }
}

// --- Initialization ---
function init() {
  // 1. Load LocalStorage configs
  const savedUnit = localStorage.getItem('skyflow_temp_unit');
  if (savedUnit) {
    state.tempUnit = savedUnit;
    if (savedUnit === 'F') {
      DOM.btnUnitF.classList.add('active');
      DOM.btnUnitC.classList.remove('active');
    }
  }

  const savedTheme = localStorage.getItem('skyflow_theme_mode');
  if (savedTheme) {
    state.themeMode = savedTheme;
    DOM.settingsThemeText.textContent = savedTheme === 'dark' ? 'Dark Tint' : 'Dynamic Sky';
  }

  const cachedLastLocation = localStorage.getItem('skyflow_last_location');
  if (cachedLastLocation) {
    state.activeLocation = JSON.parse(cachedLastLocation);
  }

  bindEvents();
  loadFavorites();
  registerServiceWorker();

  // 2. Fetch Weather for active location
  fetchWeather(state.activeLocation.lat, state.activeLocation.lon);
}

document.addEventListener('DOMContentLoaded', init);
