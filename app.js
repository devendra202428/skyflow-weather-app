/* ==========================================================================
   SKYFLOW APP LOGIC (API INTEGRATION & UI INTERACTION)
   ========================================================================== */

// --- Application State ---
const state = {
  activeLocation: {
    name: 'London',
    country: 'United Kingdom',
    lat: 51.5085,
    lon: -0.1257
  },
  tempUnit: 'C', // 'C' or 'F'
  themeMode: 'dark', // 'dark' or 'light'
  favorites: [],
  weatherData: null, // Caches raw data (in Celsius) for client-side conversions
  hourlyChart: null
};

// --- DOM Elements ---
const DOM = {
  citySearch: document.getElementById('city-search'),
  searchSuggestions: document.getElementById('search-suggestions'),
  geoBtn: document.getElementById('geo-btn'),
  unitToggle: document.getElementById('unit-toggle'),
  themeToggleBtn: document.getElementById('theme-toggle-btn'),
  favoritesList: document.getElementById('favorites-list'),
  favoritesContainer: document.getElementById('favorites-container'),
  
  currentCity: document.getElementById('current-city'),
  currentCountry: document.getElementById('current-country'),
  currentTemp: document.getElementById('current-temp'),
  weatherDesc: document.getElementById('weather-desc'),
  weatherIconContainer: document.getElementById('weather-icon-container'),
  tempMin: document.getElementById('temp-min'),
  tempMax: document.getElementById('temp-max'),
  favoriteToggleBtn: document.getElementById('favorite-toggle-btn'),
  
  feelsLike: document.getElementById('feels-like'),
  humidity: document.getElementById('humidity'),
  windSpeed: document.getElementById('wind-speed'),
  windDir: document.getElementById('wind-dir'),
  uvIndex: document.getElementById('uv-index'),
  uvBadge: document.getElementById('uv-badge'),
  pressure: document.getElementById('pressure'),
  sunriseTime: document.getElementById('sunrise-time'),
  sunsetTime: document.getElementById('sunset-time'),
  
  hourlyCardsContainer: document.getElementById('hourly-cards-container'),
  dailyForecastList: document.getElementById('daily-forecast-list'),
  
  loadingOverlay: document.getElementById('loading-overlay'),
  errorOverlay: document.getElementById('error-overlay'),
  errorMessage: document.getElementById('error-message'),
  errorRetryBtn: document.getElementById('error-retry-btn')
};

// --- Configuration & Constants ---
const DEBOUNCE_DELAY = 350; // ms
const NOMINATIM_USER_AGENT = 'SkyFlowWeatherApp/1.0';
const DEFAULT_FAVORITES = [
  { name: 'New York', country: 'United States', lat: 40.7128, lon: -74.0060 },
  { name: 'Tokyo', country: 'Japan', lat: 35.6895, lon: 139.6917 },
  { name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522 }
];

// --- Weather Code Interpreter (WMO standard) ---
function getWeatherDetails(code, isDay) {
  // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
  const mapping = {
    0: { desc: 'Clear Sky', theme: isDay ? 'theme-clear-day' : 'theme-clear-night', icon: getClearIcon(isDay) },
    1: { desc: 'Mainly Clear', theme: isDay ? 'theme-clear-day' : 'theme-clear-night', icon: getClearIcon(isDay) },
    2: { desc: 'Partly Cloudy', theme: 'theme-cloudy', icon: getCloudyIcon(isDay, true) },
    3: { desc: 'Overcast', theme: 'theme-cloudy', icon: getCloudyIcon(isDay, false) },
    45: { desc: 'Foggy', theme: 'theme-foggy', icon: getFogIcon() },
    48: { desc: 'Depositing Rime Fog', theme: 'theme-foggy', icon: getFogIcon() },
    51: { desc: 'Light Drizzle', theme: 'theme-rainy', icon: getRainIcon(false) },
    53: { desc: 'Moderate Drizzle', theme: 'theme-rainy', icon: getRainIcon(false) },
    55: { desc: 'Dense Drizzle', theme: 'theme-rainy', icon: getRainIcon(false) },
    56: { desc: 'Light Freezing Drizzle', theme: 'theme-snowy', icon: getSnowIcon() },
    57: { desc: 'Dense Freezing Drizzle', theme: 'theme-snowy', icon: getSnowIcon() },
    61: { desc: 'Slight Rain', theme: 'theme-rainy', icon: getRainIcon(false) },
    63: { desc: 'Moderate Rain', theme: 'theme-rainy', icon: getRainIcon(false) },
    65: { desc: 'Heavy Rain', theme: 'theme-rainy', icon: getRainIcon(true) },
    66: { desc: 'Light Freezing Rain', theme: 'theme-snowy', icon: getSnowIcon() },
    67: { desc: 'Heavy Freezing Rain', theme: 'theme-snowy', icon: getSnowIcon() },
    71: { desc: 'Slight Snowfall', theme: 'theme-snowy', icon: getSnowIcon() },
    73: { desc: 'Moderate Snowfall', theme: 'theme-snowy', icon: getSnowIcon() },
    75: { desc: 'Heavy Snowfall', theme: 'theme-snowy', icon: getSnowIcon() },
    77: { desc: 'Snow Grains', theme: 'theme-snowy', icon: getSnowIcon() },
    80: { desc: 'Slight Rain Showers', theme: 'theme-rainy', icon: getRainIcon(true) },
    81: { desc: 'Moderate Rain Showers', theme: 'theme-rainy', icon: getRainIcon(true) },
    82: { desc: 'Violent Rain Showers', theme: 'theme-rainy', icon: getRainIcon(true) },
    85: { desc: 'Slight Snow Showers', theme: 'theme-snowy', icon: getSnowIcon() },
    86: { desc: 'Heavy Snow Showers', theme: 'theme-snowy', icon: getSnowIcon() },
    95: { desc: 'Thunderstorm', theme: 'theme-stormy', icon: getStormIcon() },
    96: { desc: 'Thunderstorm with Hail', theme: 'theme-stormy', icon: getStormIcon() },
    99: { desc: 'Severe Thunderstorm', theme: 'theme-stormy', icon: getStormIcon() }
  };
  
  return mapping[code] || { desc: 'Unknown Weather', theme: 'theme-clear-day', icon: getClearIcon(true) };
}

// --- Animated SVG Weather Icons ---
function getClearIcon(isDay) {
  if (isDay) {
    return `
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <circle cx="50" cy="50" r="22" class="weather-svg-sun" />
        <path class="weather-svg-sun" d="M50 8 v12 M50 80 v12 M8 50 h12 M80 50 h12 M20.3 20.3 l8.5 8.5 M71.2 71.2 l8.5 8.5 M20.3 79.7 l8.5 -8.5 M71.2 28.8 l8.5 -8.5" stroke="var(--accent-sun)" stroke-width="6" stroke-linecap="round" />
      </svg>
    `;
  } else {
    return `
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <path class="weather-svg-cloud" d="M35 15 A32 32 0 0 0 82 62 A30 30 0 1 1 35 15 Z" fill="#818cf8" stroke="#6366f1" stroke-width="2" />
        <circle cx="75" cy="25" r="2" fill="#fff" opacity="0.8" style="animation: float 4s infinite;" />
        <circle cx="85" cy="35" r="1.5" fill="#fff" opacity="0.6" style="animation: float 5s infinite -1s;" />
      </svg>
    `;
  }
}

function getCloudyIcon(isDay, isPartly) {
  const sunHtml = isDay ? `
    <circle cx="62" cy="38" r="16" fill="var(--accent-sun)" style="animation: rotate-slow 30s linear infinite; transform-origin: 62px 38px;" />
    <path d="M62 16 v6 M62 60 v6 M40 38 h6 M78 38 h6" stroke="var(--accent-sun)" stroke-width="4" stroke-linecap="round" style="animation: rotate-slow 30s linear infinite; transform-origin: 62px 38px;" />
  ` : `
    <path d="M50 25 A20 20 0 0 0 80 55 A18 18 0 1 1 50 25 Z" fill="#818cf8" />
  `;

  if (isPartly) {
    return `
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        ${sunHtml}
        <path class="weather-svg-cloud" d="M22 68 A14 14 0 0 1 28 41 A18 18 0 0 1 60 45 A14 14 0 0 1 60 68 Z" />
      </svg>
    `;
  } else {
    return `
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <path class="weather-svg-cloud-back" d="M38 56 A12 12 0 0 1 42 32 A16 16 0 0 1 70 36 A12 12 0 0 1 70 56 Z" />
        <path class="weather-svg-cloud" d="M20 68 A15 15 0 0 1 25 38 A20 20 0 0 1 60 42 A15 15 0 0 1 60 68 Z" />
      </svg>
    `;
  }
}

function getRainIcon(isHeavy) {
  const rainDrops = isHeavy ? `
    <line class="weather-svg-rain-drop" x1="32" y1="68" x2="27" y2="82" />
    <line class="weather-svg-rain-drop" x1="42" y1="68" x2="37" y2="82" />
    <line class="weather-svg-rain-drop" x1="52" y1="68" x2="47" y2="82" />
    <line class="weather-svg-rain-drop" x1="62" y1="68" x2="57" y2="82" />
  ` : `
    <line class="weather-svg-rain-drop" x1="35" y1="68" x2="30" y2="80" />
    <line class="weather-svg-rain-drop" x1="50" y1="68" x2="45" y2="80" />
    <line class="weather-svg-rain-drop" x1="65" y1="68" x2="60" y2="80" />
  `;

  return `
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <path class="weather-svg-cloud" d="M25 60 A15 15 0 0 1 30 30 A20 20 0 0 1 65 35 A15 15 0 0 1 65 60 Z" />
      ${rainDrops}
    </svg>
  `;
}

function getSnowIcon() {
  return `
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <path class="weather-svg-cloud" d="M28 58 A12 12 0 0 1 33 34 A16 16 0 0 1 62 38 A12 12 0 0 1 62 58 Z" />
      <g class="weather-svg-snowflake">
        <line x1="35" y1="68" x2="35" y2="76" stroke="var(--accent-snow)" stroke-width="2" stroke-linecap="round"/>
        <line x1="31" y1="72" x2="39" y2="72" stroke="var(--accent-snow)" stroke-width="2" stroke-linecap="round"/>
      </g>
      <g class="weather-svg-snowflake" style="animation-delay: -1.5s; transform-origin: 50px 72px;">
        <line x1="50" y1="68" x2="50" y2="76" stroke="var(--accent-snow)" stroke-width="2" stroke-linecap="round"/>
        <line x1="46" y1="72" x2="54" y2="72" stroke="var(--accent-snow)" stroke-width="2" stroke-linecap="round"/>
      </g>
      <g class="weather-svg-snowflake" style="animation-delay: -3s; transform-origin: 65px 68px;">
        <line x1="65" y1="64" x2="65" y2="72" stroke="var(--accent-snow)" stroke-width="2" stroke-linecap="round"/>
        <line x1="61" y1="68" x2="69" y2="68" stroke="var(--accent-snow)" stroke-width="2" stroke-linecap="round"/>
      </g>
    </svg>
  `;
}

function getStormIcon() {
  return `
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <path class="weather-svg-cloud" style="fill: #475569;" d="M25 58 A15 15 0 0 1 30 28 A20 20 0 0 1 65 33 A15 15 0 0 1 65 58 Z" />
      <line class="weather-svg-rain-drop" x1="36" y1="66" x2="31" y2="76" />
      <line class="weather-svg-rain-drop" x1="58" y1="66" x2="53" y2="76" />
      <polygon class="weather-svg-lightning" points="47,60 38,76 45,76 40,90 54,72 47,72" />
    </svg>
  `;
}

function getFogIcon() {
  return `
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <line class="weather-svg-fog-line" x1="20" y1="35" x2="80" y2="35" />
      <line class="weather-svg-fog-line" x1="25" y1="48" x2="75" y2="48" />
      <line class="weather-svg-fog-line" x1="18" y1="61" x2="82" y2="61" />
      <line class="weather-svg-fog-line" x1="30" y1="74" x2="70" y2="74" />
    </svg>
  `;
}

// --- Wind Direction Cardinal Finder ---
function getWindDirection(deg) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(deg / 22.5) % 16;
  return directions[index];
}

// --- Unit Conversions (Celsius <-> Fahrenheit) ---
function cToF(c) {
  return Math.round((c * 9/5) + 32);
}

function convertTemp(cTemp) {
  return state.tempUnit === 'C' ? Math.round(cTemp) : cToF(cTemp);
}

function formatTempString(cTemp) {
  return `${convertTemp(cTemp)}°${state.tempUnit}`;
}

// --- UV Index Badge Creator ---
function getUvBadgeInfo(uv) {
  if (uv <= 2) return { text: 'Low', class: 'uv-low' };
  if (uv <= 5) return { text: 'Mod', class: 'uv-moderate' };
  return { text: 'High', class: 'uv-high' };
}

// --- Overlay Management ---
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

// --- Weather Fetch Engine (Open-Meteo API) ---
async function fetchWeather(lat, lon) {
  showLoader();
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to retrieve weather data from server.');
    
    const data = await response.json();
    state.weatherData = data;
    hideError();
    renderWeatherDashboard();
  } catch (error) {
    console.error(error);
    showError(error.message || 'Unable to connect to the weather server. Please check your internet connection and try again.');
  } finally {
    hideLoader();
  }
}

// --- Geolocation Handler ---
function initGeolocation() {
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
      
      // Perform Nominatim reverse lookup to guess city name
      try {
        const revUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
        const res = await fetch(revUrl, {
          headers: { 'User-Agent': NOMINATIM_USER_AGENT }
        });
        if (res.ok) {
          const resData = await res.json();
          const city = resData.address.city || resData.address.town || resData.address.village || resData.address.county || 'Your Location';
          const country = resData.address.country || '';
          state.activeLocation.name = city;
          state.activeLocation.country = country;
        }
      } catch (err) {
        console.warn('Reverse geocoding failed, falling back to label "Your Location".', err);
      }
      
      fetchWeather(latitude, longitude);
    },
    (error) => {
      hideLoader();
      let errorMsg = 'Geolocation error.';
      if (error.code === error.PERMISSION_DENIED) {
        errorMsg = 'Location access denied. Please type a city name in the search box.';
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        errorMsg = 'Location information is unavailable.';
      }
      showError(errorMsg);
    },
    { timeout: 10000 }
  );
}

// --- Autocomplete Geocoding Search (Open-Meteo Geocoding API) ---
let searchDebounceTimer;

async function handleSearchInput(e) {
  const query = e.target.value.trim();
  
  clearTimeout(searchDebounceTimer);
  if (query.length < 2) {
    DOM.searchSuggestions.classList.add('hidden');
    return;
  }
  
  searchDebounceTimer = setTimeout(async () => {
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      
      if (data.results && data.results.length > 0) {
        renderSuggestions(data.results);
      } else {
        DOM.searchSuggestions.classList.add('hidden');
      }
    } catch (err) {
      console.error('Geocoding autocomplete failed:', err);
    }
  }, DEBOUNCE_DELAY);
}

function renderSuggestions(results) {
  DOM.searchSuggestions.innerHTML = '';
  results.forEach(city => {
    const li = document.createElement('li');
    
    const cityNameSpan = document.createElement('span');
    cityNameSpan.className = 'search-item-main';
    cityNameSpan.textContent = city.name;
    
    const adminSpan = document.createElement('span');
    adminSpan.className = 'search-item-sub';
    const stateName = city.admin1 ? `${city.admin1}, ` : '';
    adminSpan.textContent = `${stateName}${city.country || ''}`;
    
    li.appendChild(cityNameSpan);
    li.appendChild(adminSpan);
    
    li.addEventListener('click', () => {
      state.activeLocation = {
        name: city.name,
        country: city.country || '',
        lat: city.latitude,
        lon: city.longitude
      };
      DOM.citySearch.value = '';
      DOM.searchSuggestions.classList.add('hidden');
      fetchWeather(city.latitude, city.longitude);
    });
    
    DOM.searchSuggestions.appendChild(li);
  });
  DOM.searchSuggestions.classList.remove('hidden');
}

// Close suggestions dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!DOM.citySearch.contains(e.target) && !DOM.searchSuggestions.contains(e.target)) {
    DOM.searchSuggestions.classList.add('hidden');
  }
});

// --- Favorites Management ---
function loadFavorites() {
  const stored = localStorage.getItem('skyflow_favorites');
  if (stored) {
    state.favorites = JSON.parse(stored);
  } else {
    state.favorites = [...DEFAULT_FAVORITES];
    saveFavorites();
  }
  renderFavoritesList();
}

function saveFavorites() {
  localStorage.setItem('skyflow_favorites', JSON.stringify(state.favorites));
}

function toggleFavorite() {
  const idx = state.favorites.findIndex(
    f => Math.abs(f.lat - state.activeLocation.lat) < 0.01 && 
         Math.abs(f.lon - state.activeLocation.lon) < 0.01
  );
  
  if (idx > -1) {
    state.favorites.splice(idx, 1);
    DOM.favoriteToggleBtn.classList.remove('active');
  } else {
    // Add active city to favorites
    state.favorites.push({
      name: state.activeLocation.name,
      country: state.activeLocation.country,
      lat: state.activeLocation.lat,
      lon: state.activeLocation.lon
    });
    DOM.favoriteToggleBtn.classList.add('active');
  }
  saveFavorites();
  renderFavoritesList();
}

function checkFavoriteState() {
  const isFav = state.favorites.some(
    f => Math.abs(f.lat - state.activeLocation.lat) < 0.01 && 
         Math.abs(f.lon - state.activeLocation.lon) < 0.01
  );
  if (isFav) {
    DOM.favoriteToggleBtn.classList.add('active');
  } else {
    DOM.favoriteToggleBtn.classList.remove('active');
  }
}

// Renders the top horizontal pills list
async function renderFavoritesList() {
  DOM.favoritesList.innerHTML = '';
  
  if (state.favorites.length === 0) {
    DOM.favoritesList.innerHTML = '<span class="no-favorites-msg">No saved locations yet. Search and click the star to pin them!</span>';
    return;
  }
  
  state.favorites.forEach((fav) => {
    const pill = document.createElement('div');
    pill.className = 'favorite-pill';
    
    const textSpan = document.createElement('span');
    textSpan.textContent = fav.name;
    pill.appendChild(textSpan);
    
    // Quick weather fetch to show temperatures on pills in parallel (cached or fast lookup)
    const tempSpan = document.createElement('span');
    tempSpan.className = 'favorite-pill-temp';
    tempSpan.textContent = '--°';
    pill.appendChild(tempSpan);
    
    // Fast weather fetch for favorites
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${fav.lat}&longitude=${fav.lon}&current=temperature_2m&timezone=auto`)
      .then(res => res.json())
      .then(d => {
        if (d.current) {
          tempSpan.textContent = formatTempString(d.current.temperature_2m);
        }
      })
      .catch(() => {});

    // Click event to select favorite
    pill.addEventListener('click', (e) => {
      // Don't switch if clicking the remove button
      if (e.target.closest('.favorite-pill-remove')) return;
      state.activeLocation = fav;
      fetchWeather(fav.lat, fav.lon);
    });
    
    // Delete favorite button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'favorite-pill-remove';
    removeBtn.title = 'Remove';
    removeBtn.innerHTML = '<i data-lucide="x"></i>';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = state.favorites.indexOf(fav);
      if (idx > -1) {
        state.favorites.splice(idx, 1);
        saveFavorites();
        renderFavoritesList();
        checkFavoriteState();
      }
    });
    pill.appendChild(removeBtn);
    DOM.favoritesList.appendChild(pill);
  });
  
  lucide.createIcons(); // Instantiates Lucide Icons on dynamic HTML content
}

// --- UI Rendering Engine ---
function renderWeatherDashboard() {
  if (!state.weatherData) return;
  
  const current = state.weatherData.current;
  const daily = state.weatherData.daily;
  const hourly = state.weatherData.hourly;
  
  const weatherInterpretation = getWeatherDetails(current.weather_code, current.is_day === 1);
  
  // 1. Update Body Theme Class
  document.body.className = weatherInterpretation.theme;
  
  // 2. Set Current Location details & favorites button
  DOM.currentCity.textContent = state.activeLocation.name;
  DOM.currentCountry.textContent = state.activeLocation.country || 'Forecast Details';
  checkFavoriteState();
  
  // 3. Current Temp, high/low, description
  DOM.currentTemp.textContent = convertTemp(current.temperature_2m);
  DOM.weatherDesc.textContent = weatherInterpretation.desc;
  DOM.weatherIconContainer.innerHTML = weatherInterpretation.icon;
  
  DOM.tempMin.textContent = formatTempString(daily.temperature_2m_min[0]);
  DOM.tempMax.textContent = formatTempString(daily.temperature_2m_max[0]);
  
  // 4. Advanced Metrics Block
  DOM.feelsLike.textContent = formatTempString(current.apparent_temperature);
  DOM.humidity.textContent = `${current.relative_humidity_2m}%`;
  DOM.windSpeed.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  DOM.windDir.textContent = `Dir: ${getWindDirection(current.wind_direction_10m)}`;
  
  const maxUvToday = daily.uv_index_max[0];
  DOM.uvIndex.textContent = maxUvToday.toFixed(1);
  const uvBadge = getUvBadgeInfo(maxUvToday);
  DOM.uvBadge.textContent = uvBadge.text;
  DOM.uvBadge.className = `uv-badge ${uvBadge.class}`;
  
  DOM.pressure.textContent = `${Math.round(current.pressure_msl)} hPa`;
  
  // Formatting sunrise and sunset
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  DOM.sunriseTime.textContent = formatTime(daily.sunrise[0]);
  DOM.sunsetTime.textContent = formatTime(daily.sunset[0]);
  
  // 5. Hourly Temperature Chart & Cards List
  renderHourlyChartAndList();
  
  // 6. 7-Day Forecast Rendering
  renderDailyForecastList();
  
  // Refresh icons
  lucide.createIcons();
}

function renderHourlyChartAndList() {
  const hourly = state.weatherData.hourly;
  const currentLocalTime = new Date(state.weatherData.current.time);
  
  // Find index of current hour in hourly forecast array
  let startIndex = hourly.time.findIndex(t => new Date(t).getHours() === currentLocalTime.getHours() && new Date(t).getDate() === currentLocalTime.getDate());
  if (startIndex === -1) startIndex = 0;
  
  // Gather data for the next 24 hours
  const next24HoursTimes = [];
  const next24HoursTemps = [];
  const next24HoursRawTemps = []; // Cache raw Celsius for conversions
  const next24HoursCodes = [];
  const next24HoursPop = []; // Precipitation probability
  
  for (let i = 0; i < 24; i++) {
    const idx = startIndex + i;
    if (idx >= hourly.time.length) break;
    
    const timeObj = new Date(hourly.time[idx]);
    const hr = timeObj.getHours();
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const formattedHr = `${hr % 12 || 12} ${ampm}`;
    
    next24HoursTimes.push(i === 0 ? 'Now' : formattedHr);
    next24HoursRawTemps.push(hourly.temperature_2m[idx]);
    next24HoursTemps.push(convertTemp(hourly.temperature_2m[idx]));
    next24HoursCodes.push(hourly.weather_code[idx]);
    next24HoursPop.push(hourly.precipitation_probability ? hourly.precipitation_probability[idx] : 0);
  }
  
  // Render Chart.js curve
  if (state.hourlyChart) {
    state.hourlyChart.destroy();
  }
  
  const ctx = document.getElementById('hourly-temp-chart').getContext('2d');
  
  // Create beautiful gradient fill
  const accentColor = getComputedStyle(document.body).getPropertyValue('--accent-theme').trim() || '#3b82f6';
  const gradient = ctx.createLinearGradient(0, 0, 0, 160);
  gradient.addColorStop(0, accentColor + '33'); // Accent with opacity
  gradient.addColorStop(1, accentColor + '00'); // Fades to complete transparent
  
  state.hourlyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: next24HoursTimes,
      datasets: [{
        label: 'Temp',
        data: next24HoursTemps,
        borderColor: accentColor,
        borderWidth: 3,
        pointBackgroundColor: accentColor,
        pointBorderColor: 'rgba(255,255,255,0.7)',
        pointBorderWidth: 1.5,
        pointRadius: 3,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true,
        backgroundColor: gradient
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          titleFont: { family: 'Outfit', size: 12 },
          bodyFont: { family: 'Outfit', size: 14, weight: 'bold' },
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          callbacks: {
            label: function(context) {
              return ` ${context.parsed.y}°${state.tempUnit}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: document.body.classList.contains('mode-light') ? 'rgba(15, 23, 42, 0.55)' : 'rgba(255, 255, 255, 0.5)',
            font: { family: 'Outfit', size: 10 }
          }
        },
        y: {
          grid: {
            color: document.body.classList.contains('mode-light') ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.05)',
            drawBorder: false
          },
          ticks: {
            color: document.body.classList.contains('mode-light') ? 'rgba(15, 23, 42, 0.55)' : 'rgba(255, 255, 255, 0.5)',
            font: { family: 'Outfit', size: 10 },
            callback: function(value) {
              return `${value}°`;
            }
          }
        }
      }
    }
  });

  // Render Horizontal Cards underneath the chart for quick scanning
  DOM.hourlyCardsContainer.innerHTML = '';
  
  next24HoursTimes.forEach((time, index) => {
    const card = document.createElement('div');
    card.className = 'hourly-card';
    
    const timeEl = document.createElement('span');
    timeEl.className = 'hourly-time';
    timeEl.textContent = time;
    card.appendChild(timeEl);
    
    const iconEl = document.createElement('div');
    iconEl.className = 'hourly-icon';
    const interpret = getWeatherDetails(next24HoursCodes[index], true); // default to day icons for small forecast thumbnails
    iconEl.innerHTML = interpret.icon;
    card.appendChild(iconEl);
    
    const tempEl = document.createElement('span');
    tempEl.className = 'hourly-temp';
    tempEl.textContent = `${next24HoursTemps[index]}°`;
    card.appendChild(tempEl);
    
    const pop = next24HoursPop[index];
    if (pop > 0) {
      const popEl = document.createElement('span');
      popEl.className = 'hourly-pop';
      popEl.innerHTML = `<i data-lucide="droplet" style="width: 10px; height: 10px;"></i> ${pop}%`;
      card.appendChild(popEl);
    }
    
    DOM.hourlyCardsContainer.appendChild(card);
  });
}

function renderDailyForecastList() {
  const daily = state.weatherData.daily;
  DOM.dailyForecastList.innerHTML = '';
  
  // Find global min and max temperatures across the 7 days to calibrate progress range bars
  const globalMin = Math.min(...daily.temperature_2m_min);
  const globalMax = Math.max(...daily.temperature_2m_max);
  const globalRange = globalMax - globalMin || 1;
  
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(daily.time[i]);
    const weekday = dayDate.toLocaleDateString('en-US', { weekday: 'long' });
    const dayLabel = i === 0 ? 'Today' : weekday;
    
    const minTemp = daily.temperature_2m_min[i];
    const maxTemp = daily.temperature_2m_max[i];
    const code = daily.weather_code[i];
    const interpret = getWeatherDetails(code, true);
    
    const item = document.createElement('div');
    item.className = 'daily-forecast-item';
    
    // Day text
    const dayEl = document.createElement('span');
    dayEl.className = 'daily-day';
    dayEl.textContent = dayLabel;
    item.appendChild(dayEl);
    
    // Weather Icon
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'daily-icon-wrapper';
    iconWrapper.innerHTML = interpret.icon;
    item.appendChild(iconWrapper);
    
    // Status text
    const descEl = document.createElement('span');
    descEl.className = 'daily-desc';
    descEl.textContent = interpret.desc;
    item.appendChild(descEl);
    
    // Visual temperature range bar
    const barContainer = document.createElement('div');
    barContainer.className = 'daily-temp-bar-container';
    
    const minLabel = document.createElement('span');
    minLabel.className = 'temp-bar-label';
    minLabel.textContent = `${convertTemp(minTemp)}°`;
    barContainer.appendChild(minLabel);
    
    const track = document.createElement('div');
    track.className = 'temp-bar-track';
    
    const fill = document.createElement('div');
    fill.className = 'temp-bar-fill';
    
    // Calculate margins for custom positioning inside range track
    const leftPercent = ((minTemp - globalMin) / globalRange) * 100;
    const widthPercent = ((maxTemp - minTemp) / globalRange) * 100;
    fill.style.left = `${leftPercent}%`;
    fill.style.width = `${widthPercent}%`;
    
    track.appendChild(fill);
    barContainer.appendChild(track);
    
    const maxLabel = document.createElement('span');
    maxLabel.className = 'temp-bar-label high';
    maxLabel.textContent = `${convertTemp(maxTemp)}°`;
    barContainer.appendChild(maxLabel);
    
    item.appendChild(barContainer);
    
    // Precipitation/rain chance if exists (calculated dynamically from code indices or placeholders. 
    // Open-Meteo daily forecast doesn't return pop directly unless queried. We will use weather codes 
    // to render a clean visual, or show wind speed).
    const popEl = document.createElement('span');
    popEl.className = 'daily-pop-info';
    
    // Render daily rain chance representation based on code index
    if ([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code)) {
      popEl.innerHTML = '<i data-lucide="cloud-rain" style="width: 14px; height: 14px;"></i> Rain';
    } else if ([71,73,75,77,85,86].includes(code)) {
      popEl.innerHTML = '<i data-lucide="snowflake" style="width: 14px; height: 14px;"></i> Snow';
    } else if ([95,96,99].includes(code)) {
      popEl.innerHTML = '<i data-lucide="cloud-lightning" style="width: 14px; height: 14px;"></i> Storm';
    } else {
      popEl.innerHTML = '<i data-lucide="sun" style="width: 14px; height: 14px; color: var(--accent-sun);"></i> Fine';
    }
    item.appendChild(popEl);
    
    DOM.dailyForecastList.appendChild(item);
  }
}

// --- Event Binding ---
function bindEvents() {
  DOM.citySearch.addEventListener('input', handleSearchInput);
  DOM.geoBtn.addEventListener('click', initGeolocation);
  
  DOM.unitToggle.addEventListener('change', (e) => {
    state.tempUnit = e.target.checked ? 'F' : 'C';
    localStorage.setItem('skyflow_temp_unit', state.tempUnit);
    renderWeatherDashboard();
    renderFavoritesList();
  });
  
  DOM.themeToggleBtn.addEventListener('click', () => {
    state.themeMode = state.themeMode === 'dark' ? 'light' : 'dark';
    localStorage.setItem('skyflow_theme_mode', state.themeMode);
    applyThemeMode();
  });
  
  DOM.favoriteToggleBtn.addEventListener('click', toggleFavorite);
  
  DOM.errorRetryBtn.addEventListener('click', hideError);
  
  // Re-fetch when clicking retry
  DOM.errorRetryBtn.addEventListener('click', () => {
    fetchWeather(state.activeLocation.lat, state.activeLocation.lon);
  });
}

function applyThemeMode() {
  const icon = DOM.themeToggleBtn.querySelector('i');
  if (state.themeMode === 'light') {
    document.body.classList.add('mode-light');
    icon.setAttribute('data-lucide', 'sun');
  } else {
    document.body.classList.remove('mode-light');
    icon.setAttribute('data-lucide', 'moon');
  }
  lucide.createIcons();
  
  // Re-render chart since grid/tick colors need to adjust for contrast
  if (state.weatherData) {
    renderHourlyChartAndList();
  }
}

// --- Application Init ---
function init() {
  // Load settings from localStorage
  const savedUnit = localStorage.getItem('skyflow_temp_unit');
  if (savedUnit) {
    state.tempUnit = savedUnit;
    DOM.unitToggle.checked = savedUnit === 'F';
  }
  
  const savedTheme = localStorage.getItem('skyflow_theme_mode');
  if (savedTheme) {
    state.themeMode = savedTheme;
  }
  
  bindEvents();
  applyThemeMode(); // Setup active theme variables and classes
  loadFavorites();
  
  // Load current location on startup, fallback to London if permission denied/unavailable
  loadStartupWeather();
}

function loadStartupWeather() {
  if (navigator.geolocation) {
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
            const resData = await res.json();
            const city = resData.address.city || resData.address.town || resData.address.village || resData.address.county || 'Your Location';
            const country = resData.address.country || '';
            state.activeLocation.name = city;
            state.activeLocation.country = country;
          }
        } catch (err) {
          console.warn('Reverse geocoding failed, falling back to label "Your Location".', err);
        }
        
        fetchWeather(latitude, longitude);
      },
      (error) => {
        console.warn('Geolocation failed or denied. Falling back to London.');
        // Fallback to default London
        fetchWeather(state.activeLocation.lat, state.activeLocation.lon);
      },
      { timeout: 7000 }
    );
  } else {
    // Fallback to default London directly
    fetchWeather(state.activeLocation.lat, state.activeLocation.lon);
  }
}

// Kickstart
document.addEventListener('DOMContentLoaded', init);
