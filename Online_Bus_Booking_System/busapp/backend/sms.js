/**
 * SMS module — sends real SMS via Africa's Talking (works well for Tanzanian numbers).
 * Sign up free at https://africastalking.com to get apiKey + username, then set
 * AT_API_KEY and AT_USERNAME in your .env file.
 *
 * To use Twilio instead, swap the implementation below for the Twilio Node SDK.
 */
require("dotenv").config();

const AT_USERNAME = process.env.AT_USERNAME;
const AT_API_KEY = process.env.AT_API_KEY;

async function sendSMS(phone, message) {
  // If no SMS credentials are configured, log instead of failing (safe default for local/demo use)
  if (!AT_USERNAME || !AT_API_KEY) {
    console.log(`[SMS SIMULATED] To: ${phone} | Message: ${message}`);
    return { success: true, simulated: true };
  }

  try {
    const AfricasTalking = require("africastalking")({
      apiKey: AT_API_KEY,
      username: AT_USERNAME
    });
    const sms = AfricasTalking.SMS;
    const result = await sms.send({
      to: [phone],
      message,
      from: process.env.AT_SENDER_ID || undefined
    });
    return { success: true, result };
  } catch (err) {
    console.error("SMS send failed:", err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendSMS };
