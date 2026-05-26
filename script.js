// OpenWeatherMap API Configuration
// Get your free API key at: https://openweathermap.org/api
const API_KEY = 'YOUR_API_KEY_HERE'; // Replace with your OpenWeatherMap API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const currentWeather = document.getElementById('currentWeather');
const loadingState = document.getElementById('loadingState');
const welcomeState = document.getElementById('welcomeState');
const errorMessage = document.getElementById('errorMessage');

// Event Listeners
searchBtn.addEventListener('click', searchWeather);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchWeather();
});

// Search Weather Function
async function searchWeather() {
    const city = searchInput.value.trim();
    
    if (!city) {
        showError('Please enter a city name');
        return;
    }

    if (API_KEY === 'YOUR_API_KEY_HERE') {
        showError('Please set your OpenWeatherMap API key in script.js');
        return;
    }

    try {
        showLoading();
        clearError();
        
        // Fetch current weather and forecast
        const [currentData, forecastData] = await Promise.all([
            fetchCurrentWeather(city),
            fetchForecast(city)
        ]);

        // Fetch additional data (UV Index)
        const uvData = await fetchUVIndex(currentData.coord.lat, currentData.coord.lon);

        // Display weather data
        displayCurrentWeather(currentData, uvData);
        displayForecast(forecastData);
        
        // Hide welcome state and show weather
        welcomeState.classList.add('hidden');
        currentWeather.classList.remove('hidden');
        
    } catch (error) {
        showError(error.message);
        loadingState.classList.add('hidden');
        welcomeState.classList.remove('hidden');
    }
}

// Fetch Current Weather
async function fetchCurrentWeather(city) {
    const response = await fetch(
        `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`
    );

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('City not found. Please try another city name.');
        }
        throw new Error('Failed to fetch weather data');
    }

    return await response.json();
}

// Fetch 5-Day Forecast
async function fetchForecast(city) {
    const response = await fetch(
        `${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`
    );

    if (!response.ok) {
        throw new Error('Failed to fetch forecast data');
    }

    return await response.json();
}

// Fetch UV Index
async function fetchUVIndex(lat, lon) {
    try {
        const response = await fetch(
            `${BASE_URL}/uvi?lat=${lat}&lon=${lon}&appid=${API_KEY}`
        );
        return await response.json();
    } catch (error) {
        console.log('UV Index data not available');
        return { value: 'N/A' };
    }
}

// Display Current Weather
function displayCurrentWeather(data, uvData) {
    const currentDate = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = currentDate.toLocaleDateString('en-US', options);

    // Update location info
    document.getElementById('cityName').textContent = `${data.name}, ${data.sys.country}`;
    document.getElementById('currentDate').textContent = dateString;

    // Update temperature and weather
    const temp = Math.round(data.main.temp);
    const feelsLike = Math.round(data.main.feels_like);
    document.getElementById('temperature').textContent = `${temp}°C`;
    document.getElementById('description').textContent = capitalizeWords(data.weather[0].description);
    document.getElementById('feelsLike').textContent = `Feels like ${feelsLike}°C`;

    // Update weather icon
    const iconCode = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
    document.getElementById('weatherIcon').src = iconUrl;

    // Update details
    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('windSpeed').textContent = `${data.wind.speed} m/s`;
    document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
    document.getElementById('visibility').textContent = `${(data.visibility / 1000).toFixed(1)} km`;
    document.getElementById('cloudiness').textContent = `${data.clouds.all}%`;
    
    // Update UV Index
    const uvValue = uvData.value || uvData.value === 0 ? Math.round(uvData.value * 10) / 10 : 'N/A';
    document.getElementById('uvIndex').textContent = uvValue;

    // Stop loading
    loadingState.classList.add('hidden');
}

// Display Forecast
function displayForecast(data) {
    const forecastContainer = document.getElementById('forecastContainer');
    forecastContainer.innerHTML = '';

    // Get forecast for next 5 days (one forecast per day)
    const dailyForecasts = {};

    data.list.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const day = date.toLocaleDateString('en-US');

        // Keep only one forecast per day (the first one, which is usually midday)
        if (!dailyForecasts[day]) {
            dailyForecasts[day] = forecast;
        }
    });

    // Get first 5 days
    const forecastDays = Object.values(dailyForecasts).slice(0, 5);

    forecastDays.forEach((forecast, index) => {
        const date = new Date(forecast.dt * 1000);
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        const dateString = date.toLocaleDateString('en-US', options);

        const temp = Math.round(forecast.main.temp);
        const tempMax = Math.round(forecast.main.temp_max);
        const tempMin = Math.round(forecast.main.temp_min);
        const description = forecast.weather[0].main;
        const icon = forecast.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card';
        forecastCard.innerHTML = `
            <div class="forecast-date">${dateString}</div>
            <div class="forecast-icon">
                <img src="${iconUrl}" alt="${description}">
            </div>
            <div class="forecast-description">${description}</div>
            <div class="forecast-temp">
                <span class="high">${tempMax}°</span>
                <span class="low">${tempMin}°</span>
            </div>
        `;

        forecastContainer.appendChild(forecastCard);
    });
}

// Utility Functions
function showLoading() {
    loadingState.classList.remove('hidden');
    welcomeState.classList.add('hidden');
    currentWeather.classList.add('hidden');
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 5000);
}

function clearError() {
    errorMessage.classList.remove('show');
    errorMessage.textContent = '';
}

function capitalizeWords(str) {
    return str
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Initialize - show welcome state
window.addEventListener('load', () => {
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        showError('⚠️ Please add your OpenWeatherMap API key to use this dashboard. Get a free key at https://openweathermap.org/api');
    }
});