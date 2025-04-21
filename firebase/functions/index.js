/**
 * Import function triggers from their respective submodules.
 */
const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const axios = require("axios");

// Initialize the Firebase Admin SDK
admin.initializeApp();

/**
 * Helper function that fetches weather data and sends push notifications.
 */
async function sendWeatherNotification() {
  try {
    // 1. Fetch weather data from an external API (OpenWeatherMap example)
    const weatherResponse = await axios.get(
      "https://api.openweathermap.org/data/2.5/weather",
      {
        params: {
          q: "Baltimore",       // Replace with your desired city
          appid: "419994eddf7de67dc5b803e6df72bf89",     // Replace with your weather API key
          units: "metric",           // Use "imperial" for Fahrenheit
        },
      }
    );
    const weatherData = weatherResponse.data;
    const description = weatherData.weather[0].description;
    const temp = weatherData.main.temp;
    const messageBody = `Today's weather: ${description}, ${temp}°C.`;

    // 2. Get the list of user push tokens from Firestore (assume tokens are in the "users" collection)
    const tokensSnapshot = await admin.firestore().collection("users").get();
    const tokens = [];
    tokensSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data && data.expoPushToken) {
        tokens.push(data.expoPushToken);
      }
    });
    if (tokens.length === 0) {
      logger.info("No push tokens available.");
      return;
    }

    // 3. Build the notification payload for each token
    const messages = tokens.map((token) => ({
      to: token,
      sound: "default",
      title: "Daily Weather Update",
      body: messageBody,
      data: { weather: weatherData },
    }));

    // 4. Send each notification via Expo's push endpoint
    for (const message of messages) {
      try {
        const response = await axios.post("https://exp.host/--/api/v2/push/send", message, {
          headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
        });
        logger.info("Push notification sent:", response.data);
      } catch (error) {
        logger.error("Error sending push notification:", error);
      }
    }

    logger.info("Daily weather notifications sent successfully.");
  } catch (error) {
    logger.error("Error in sendWeatherNotification helper:", error);
    throw error;
  }
}

/**
 * Scheduled function: Runs every day at 8 AM (time zone: America/New_York).
 */
exports.dailyWeatherNotification = onSchedule(
  {
    schedule: "0 8 * * *", // Every day at 8:00 AM
    timeZone: "America/New_York",
  },
  async (context) => {
    await sendWeatherNotification();
  }
);

/**
 * Test function: HTTP trigger to test push notification at any time.
 * You can invoke this function via a web browser or Postman.
 */
exports.testDailyWeatherNotification = onRequest(async (req, res) => {
  try {
    await sendWeatherNotification();
    res.status(200).send("Test weather notifications sent successfully.");
  } catch (error) {
    logger.error("Error in testDailyWeatherNotification function:", error);
    res.status(500).send("Error sending test notifications.");
  }
});

/**
 * Simple HTTPS function example (if needed)
 */
exports.helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", { structuredData: true });
  response.send("Hello from Firebase!");
});

exports.testEndpoint = onRequest((req, res) => {
  res.send("Container is live!");
});