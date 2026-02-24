/* ============================================
   iOS Weather App - JavaScript
   OpenWeather API integration with error handling
   ============================================ */

// ============================================
// API Configuration
// ============================================

// Get your free API key from: https://openweathermap.org/api
// Sign up at https://openweathermap.org/users/register
const API_KEY = 'b2d450061939dbb1fb0f15f7cb6804d7'; // Replace with your actual API key
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// ============================================
// DOM Elements
// ============================================

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const geoBtn = document.getElementById('geoBtn');
const themeToggle = document.getElementById('themeToggle');
const errorMessage = document.getElementById('errorMessage');
const loadingSpinner = document.getElementById('loadingSpinner');
const weatherDisplay = document.getElementById('weatherDisplay');
const emptyState = document.getElementById('emptyState');
const searchHistorySection = document.getElementById('searchHistorySection');
const searchHistory = document.getElementById('searchHistory');
const favoritesSection = document.getElementById('favoritesSection');
const favoritesList = document.getElementById('favoritesList');
const favoriteBtn = document.getElementById('favoriteBtn');

// Weather display elements
const cityName = document.getElementById('cityName');
const weatherCondition = document.getElementById('weatherCondition');
const temperature = document.getElementById('temperature');
const weatherIcon = document.getElementById('weatherIcon');
const humidity = document.getElementById('humidity');
const feelsLike = document.getElementById('feelsLike');
const windSpeed = document.getElementById('windSpeed');
const pressure = document.getElementById('pressure');

// ============================================
// Event Listeners
// ============================================

searchBtn.addEventListener('click', handleSearch);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

geoBtn.addEventListener('click', handleGeolocation);
themeToggle.addEventListener('click', toggleTheme);
favoriteBtn.addEventListener('click', handleFavorite);

// ============================================
// Main Search Handler
// ============================================

/**
 * Handles the weather search functionality
 * Validates input and fetches weather data
 */
async function handleSearch() {
    const city = cityInput.value.trim();

    // Validation: Check if input is empty
    if (!city) {
        showError('Please enter a city name');
        return;
    }

    // Clear previous errors
    clearError();

    // Fetch weather data
    await fetchWeatherData(city);
}

/**
 * Handles geolocation search
 */
function handleGeolocation() {
    geoBtn.textContent = '⏳';
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                await fetchWeatherByCoords(latitude, longitude);
                geoBtn.textContent = '📍';
            },
            (error) => {
                showError('Unable to get your location. Please enable location access.');
                geoBtn.textContent = '📍';
                console.error('Geolocation error:', error);
            }
        );
    } else {
        showError('Geolocation is not supported by your browser.');
        geoBtn.textContent = '📍';
    }
}

// ============================================
// Fetch Weather Data
// ============================================

/**
 * Fetches weather data from OpenWeather API
 * @param {string} city - City name to search for
 */
async function fetchWeatherData(city) {
    try {
        // Check if API key is configured
        if (API_KEY === 'YOUR_OPENWEATHER_API_KEY') {
            showError('⚠️ API key not configured. Get your free key at openweathermap.org');
            return;
        }

        // Show loading state
        showLoading(true);

        // Build API URL with parameters
        const url = new URL(API_BASE_URL);
        url.searchParams.append('q', city);
        url.searchParams.append('appid', API_KEY);
        url.searchParams.append('units', 'metric'); // Use Celsius

        // Make API request
        const response = await fetch(url);

        // Handle API response
        if (!response.ok) {
            if (response.status === 404) {
                showError(`City "${city}" not found. Please try another one.`);
            } else if (response.status === 401) {
                showError('Invalid API key. Please check your configuration.');
            } else {
                showError(`API Error: ${response.statusText}`);
            }
            showLoading(false);
            return;
        }

        // Parse JSON response
        const data = await response.json();

        // Add to search history
        addToSearchHistory(data.name);

        // Update UI with weather data
        displayWeather(data);
        showLoading(false);

    } catch (error) {
        // Handle network and other errors
        console.error('Error fetching weather:', error);
        showError('Failed to fetch weather data. Please check your connection.');
        showLoading(false);
    }
}

/**
 * Fetches weather data by coordinates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 */
async function fetchWeatherByCoords(lat, lon) {
    try {
        if (API_KEY === 'YOUR_OPENWEATHER_API_KEY') {
            showError('⚠️ API key not configured.');
            return;
        }

        showLoading(true);

        const url = new URL(API_BASE_URL);
        url.searchParams.append('lat', lat);
        url.searchParams.append('lon', lon);
        url.searchParams.append('appid', API_KEY);
        url.searchParams.append('units', 'metric');

        const response = await fetch(url);

        if (!response.ok) {
            showError('Failed to fetch weather for your location.');
            showLoading(false);
            return;
        }

        const data = await response.json();
        addToSearchHistory(data.name);
        displayWeather(data);
        showLoading(false);

    } catch (error) {
        console.error('Error fetching weather by coordinates:', error);
        showError('Failed to fetch weather data.');
        showLoading(false);
    }
}

// ============================================
// Display Weather Data
// ============================================

/**
 * Displays weather information in the UI
 * @param {object} data - Weather data from API
 */
function displayWeather(data) {
    // Extract weather information
    const {
        name,                          // City name
        sys: { country },              // Country code
        main: {
            temp,                       // Current temperature
            feels_like,                 // Feels like temperature
            humidity: humidityPercent,  // Humidity percentage
            pressure: pressureValue     // Atmospheric pressure
        },
        weather: [{ main, description, icon }], // Weather condition and icon
        wind: { speed: windSpeedValue } // Wind speed
    } = data;

    // Store current city for favorites
    window.currentCity = { name, country, temp: Math.round(temp) };

    // Update DOM with weather data
    cityName.textContent = `${name}, ${country}`;
    weatherCondition.textContent = description;
    temperature.textContent = `${Math.round(temp)}°`;
    feelsLike.textContent = `${Math.round(feels_like)}°C`;
    humidity.textContent = `${humidityPercent}%`;
    windSpeed.textContent = `${windSpeedValue.toFixed(1)} m/s`;
    pressure.textContent = `${pressureValue} hPa`;

    // Update weather icon using emoji for better clarity
    const iconEmoji = getWeatherEmoji(main);
    // Create an SVG data URL with the emoji
    const svgUrl = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><text x="64" y="96" text-anchor="middle" font-size="96">${iconEmoji}</text></svg>`;
    weatherIcon.src = svgUrl;
    weatherIcon.alt = description;

    // Clear input field
    cityInput.value = '';

    // Update favorite button state
    updateFavoriteButtonState(name);

    // Show weather display, hide empty state
    weatherDisplay.classList.remove('hidden');
    emptyState.classList.add('hidden');
}

// ============================================
// Utility Functions
// ============================================

/**
 * Maps weather conditions to emoji icons
 * @param {string} condition - Weather condition from API
 * @returns {string} Emoji icon
 */
function getWeatherEmoji(condition) {
    const iconMap = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Drizzle': '🌦️',
        'Thunderstorm': '⛈️',
        'Snow': '❄️',
        'Mist': '🌫️',
        'Smoke': '💨',
        'Haze': '🌫️',
        'Dust': '🌪️',
        'Fog': '🌫️',
        'Sand': '🌪️',
        'Ash': '🌋',
        'Squall': '💨',
        'Tornado': '🌪️'
    };

    return iconMap[condition] || '🌤️';
}

/**
 * Shows loading spinner and hides content
 * @param {boolean} isLoading - Whether to show loading state
 */
function showLoading(isLoading) {
    if (isLoading) {
        loadingSpinner.classList.remove('hidden');
        weatherDisplay.classList.add('hidden');
        emptyState.classList.add('hidden');
    } else {
        loadingSpinner.classList.add('hidden');
    }
}

/**
 * Displays error message to user
 * @param {string} message - Error message to display
 */
function showError(message) {
    errorMessage.textContent = message;
    weatherDisplay.classList.add('hidden');
    emptyState.classList.remove('hidden');
    loadingSpinner.classList.add('hidden');
}

/**
 * Clears error message
 */
function clearError() {
    errorMessage.textContent = '';
}

// ============================================
// Search History & Favorites
// ============================================

/**
 * Adds city to search history
 * @param {string} city - City name to add
 */
function addToSearchHistory(city) {
    let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    
    // Remove if already exists to avoid duplicates
    history = history.filter(c => c.toLowerCase() !== city.toLowerCase());
    
    // Add to beginning
    history.unshift(city);
    
    // Keep only last 5
    history = history.slice(0, 5);
    
    localStorage.setItem('searchHistory', JSON.stringify(history));
    renderSearchHistory();
}

/**
 * Renders search history buttons
 */
function renderSearchHistory() {
    const history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    
    if (history.length === 0) {
        searchHistorySection.classList.add('hidden');
        return;
    }
    
    searchHistorySection.classList.remove('hidden');
    searchHistory.innerHTML = history.map(city => 
        `<button class="history-btn" onclick="searchCity('${city}')">${city}</button>`
    ).join('');
}

/**
 * Adds current city to favorites
 */
function handleFavorite() {
    if (!window.currentCity) {
        showError('Please search for a city first');
        return;
    }

    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const cityName = window.currentCity.name;
    
    const isFavorite = favorites.some(f => f.name.toLowerCase() === cityName.toLowerCase());
    
    if (isFavorite) {
        // Remove from favorites
        favorites = favorites.filter(f => f.name.toLowerCase() !== cityName.toLowerCase());
        favoriteBtn.classList.remove('active');
    } else {
        // Add to favorites
        favorites.push(window.currentCity);
        favoriteBtn.classList.add('active');
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
}

/**
 * Updates favorite button state
 */
function updateFavoriteButtonState(cityName) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const isFavorite = favorites.some(f => f.name.toLowerCase() === cityName.toLowerCase());
    
    if (isFavorite) {
        favoriteBtn.classList.add('active');
        favoriteBtn.textContent = '⭐ Remove from Favorites';
    } else {
        favoriteBtn.classList.remove('active');
        favoriteBtn.textContent = '⭐ Add to Favorites';
    }
}

/**
 * Renders favorite cities buttons
 */
function renderFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    
    if (favorites.length === 0) {
        favoritesSection.classList.add('hidden');
        return;
    }
    
    favoritesSection.classList.remove('hidden');
    favoritesList.innerHTML = favorites.map(city => 
        `<button class="favorite-city-btn" onclick="searchCity('${city.name}')">
            ${city.name} <span class="remove-favorite" onclick="removeFavorite('${city.name}', event)">✕</span>
        </button>`
    ).join('');
}

/**
 * Removes a favorite city
 */
function removeFavorite(cityName, event) {
    event.stopPropagation();
    
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    favorites = favorites.filter(f => f.name.toLowerCase() !== cityName.toLowerCase());
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    renderFavorites();
    updateFavoriteButtonState(cityName);
}

/**
 * Searches for a city (used by history and favorites)
 */
function searchCity(city) {
    cityInput.value = city;
    handleSearch();
}

/**
 * Toggles dark mode theme
 */
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeButtonIcon();
}

/**
 * Updates theme button icon
 */
function updateThemeButtonIcon() {
    if (document.body.classList.contains('dark-mode')) {
        themeToggle.textContent = '☀️';
    } else {
        themeToggle.textContent = '🌙';
    }
}

// ============================================
// Initialization
// ============================================

// Initialize app on page load
window.addEventListener('DOMContentLoaded', () => {
    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
    updateThemeButtonIcon();
    
    // Render history and favorites
    renderSearchHistory();
    renderFavorites();
    
    // Set focus to input
    cityInput.focus();
});

// Show welcome message in console
console.log(
    '%cWeather App Ready! 🌤️',
    'font-size: 16px; font-weight: bold; color: #667eea;'
);
console.log(
    '%cNew Features: Geolocation 📍 | Dark Mode 🌙 | Favorites ⭐ | History 📝 | Animations ✨',
    'font-size: 12px; color: #764ba2;'
);
