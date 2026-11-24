
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const message = document.getElementById("message");

const weatherContent = document.getElementById("weatherContent");
const aiBtn = document.getElementById("aiBtn");
const aiResult = document.getElementById("aiResult");
const aiLoading = document.getElementById("aiLoading");

// Gemini API Key
const GEMINI_API_KEY = "AQ.Ab8RN6LLBcbpK2QTPJjKEqXjTd6MsS2PLpvVFa88Ob-cdM-1Yg";

// Weather code description and emoji
function getWeatherInfo(code) {
  const weatherCodes = {
    0: ["Clear Sky", "☀️"],
    1: ["Mainly Clear", "🌤️"],
    2: ["Partly Cloudy", "⛅"],
    3: ["Overcast", "☁️"],
    45: ["Fog", "🌫️"],
    48: ["Fog", "🌫️"],
    51: ["Light Drizzle", "🌦️"],
    53: ["Drizzle", "🌦️"],
    55: ["Heavy Drizzle", "🌧️"],
    61: ["Light Rain", "🌧️"],
    63: ["Moderate Rain", "🌧️"],
    65: ["Heavy Rain", "🌧️"],
    71: ["Light Snow", "🌨️"],
    73: ["Snow", "❄️"],
    75: ["Heavy Snow", "❄️"],
    80: ["Rain Showers", "🌦️"],
    81: ["Rain Showers", "🌧️"],
    82: ["Heavy Showers", "⛈️"],
    95: ["Thunderstorm", "⛈️"],
    96: ["Thunderstorm with Hail", "⛈️"],
    99: ["Severe Thunderstorm", "⛈️"]
  };

  return weatherCodes[code] || ["Unknown", "🌡️"];
}

// Search city
searchBtn.addEventListener("click", getWeather);

cityInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    getWeather();
  }
});

let currentWeatherData = null;

async function getWeather() {
  const city = cityInput.value.trim();

  if (!city) {
    message.textContent = "Please enter a city name!";
    return;
  }

  try {
    message.textContent = "Loading weather data...";
    searchBtn.disabled = true;
    weatherContent.classList.add("hidden");

    // Step 1: Get city coordinates
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );

    if (!geoResponse.ok) {
      throw new Error("Unable to search city.");
    }

    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("City not found! Try another city.");
    }

    const location = geoData.results[0];
    const latitude = location.latitude;
    const longitude = location.longitude;

    // Step 2: Get weather data
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`
    );

    if (!weatherResponse.ok) {
      throw new Error("Unable to fetch weather data.");
    }

    const weatherData = await weatherResponse.json();

    currentWeatherData = {
      city: location.name,
      country: location.country,
      current: weatherData.current,
      daily: weatherData.daily
    };

    // Step 3: Display weather
    displayWeather(currentWeatherData);

    message.textContent = "";
    weatherContent.classList.remove("hidden");

    aiResult.textContent =
      "Click Generate AI Weather Report to get your weather advice.";

  } catch (error) {
    message.textContent = error.message;
  } finally {
    searchBtn.disabled = false;
  }
}

// Display current weather and forecast
function displayWeather(data) {
  const current = data.current;
  const [description, icon] = getWeatherInfo(current.weather_code);

  document.getElementById("cityName").textContent =
    `${data.city}, ${data.country}`;

  document.getElementById("date").textContent =
    new Date(current.time).toLocaleString();

  document.getElementById("temperature").textContent =
    Math.round(current.temperature_2m);

  document.getElementById("weatherIcon").textContent = icon;
  document.getElementById("weatherDescription").textContent = description;

  document.getElementById("humidity").textContent =
    current.relative_humidity_2m + "%";

  document.getElementById("wind").textContent =
    current.wind_speed_10m + " km/h";

  document.getElementById("feelsLike").textContent =
    Math.round(current.apparent_temperature) + "°C";

  displayForecast(data.daily);
}

// Display 5 day forecast
function displayForecast(daily) {
  const forecastList = document.getElementById("forecastList");

  forecastList.innerHTML = "";

  daily.time.forEach((date, index) => {
    const [description, icon] =
      getWeatherInfo(daily.weather_code[index]);

    const day = new Date(date + "T12:00:00")
      .toLocaleDateString("en-US", {
        weekday: "short"
      });

    const card = document.createElement("div");
    card.className = "forecast-item";

    const dayText = document.createElement("p");
    dayText.textContent = day;

    const iconText = document.createElement("span");
    iconText.textContent = icon;

    const tempText = document.createElement("h3");
    tempText.textContent =
      `${Math.round(daily.temperature_2m_max[index])}° / ${Math.round(daily.temperature_2m_min[index])}°`;

    const descriptionText = document.createElement("p");
    descriptionText.textContent = description;

    card.append(dayText, iconText, tempText, descriptionText);
    forecastList.appendChild(card);
  });
}

// Gemini AI Weather Assistant
aiBtn.addEventListener("click", generateAIReport);

async function generateAIReport() {
  if (!currentWeatherData) {
    aiResult.textContent = "Please search for a city first.";
    return;
  }

  if (
    !GEMINI_API_KEY ||
    GEMINI_API_KEY === "YOUR_GEMINI_API_KEY"
  ) {
    aiResult.textContent =
      "Please add your Gemini API key in script.js first.";
    return;
  }

  try {
    aiBtn.disabled = true;
    aiLoading.classList.remove("hidden");
    aiResult.textContent = "Generating report...";

    const weather = currentWeatherData;
    const current = weather.current;
    const daily = weather.daily;

    const prompt = `
      You are a helpful weather assistant.

      Analyze this actual weather data:

      City: ${weather.city}, ${weather.country}
      Temperature: ${current.temperature_2m}°C
      Feels Like: ${current.apparent_temperature}°C
      Humidity: ${current.relative_humidity_2m}%
      Wind Speed: ${current.wind_speed_10m} km/h
      Weather: ${getWeatherInfo(current.weather_code)[0]}

      Five day forecast:
      ${daily.time.map((date, i) =>
        `${date}: ${getWeatherInfo(daily.weather_code[i])[0]},
        Maximum: ${daily.temperature_2m_max[i]}°C,
        Minimum: ${daily.temperature_2m_min[i]}°C`
      ).join("\n")}

      Give me:
      1. A short weather summary.
      2. Clothing suggestions.
      3. Outdoor activity advice.
      4. Any necessary precautions.

      Use simple English and bullet points.
      Do not invent weather information.
    `;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error?.message || "Gemini API request failed."
      );
    }

    const aiText =
      result.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("\n");

    if (!aiText) {
      throw new Error("Gemini did not return a report.");
    }

    aiResult.textContent = aiText;

  } catch (error) {
    aiResult.textContent = "Error: " + error.message;
  } finally {
    aiLoading.classList.add("hidden");
    aiBtn.disabled = false;
  }
}
