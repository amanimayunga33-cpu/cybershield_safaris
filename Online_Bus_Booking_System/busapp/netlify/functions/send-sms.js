// Netlify serverless function: sends a REAL SMS via Africa's Talking.
// Deploy this whole repo to Netlify (via GitHub, not drag-and-drop, so functions run),
// then set these environment variables in Netlify → Site settings → Environment variables:
//   AT_USERNAME  = your Africa's Talking username (use "sandbox" for free testing)
//   AT_API_KEY   = your Africa's Talking API key
//   AT_SENDER_ID = (optional) your approved alphanumeric sender ID
//
// Once deployed, index.html's SMS_BACKEND_URL ("/.netlify/functions/send-sms") will
// automatically reach this function — no frontend code changes needed.

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const { AT_USERNAME, AT_API_KEY, AT_SENDER_ID } = process.env;
  if (!AT_USERNAME || !AT_API_KEY) {
    return {
      statusCode: 200,
      body: JSON.stringify({ success: false, simulated: true, reason: "AT_USERNAME / AT_API_KEY not configured in Netlify environment variables" })
    };
  }

  try {
    const { phone, message } = JSON.parse(event.body || "{}");
    if (!phone || !message) {
      return { statusCode: 400, body: JSON.stringify({ error: "phone and message are required" }) };
    }

    const isSandbox = AT_USERNAME === "sandbox";
    const url = isSandbox
      ? "https://api.sandbox.africastalking.com/version1/messaging"
      : "https://api.africastalking.com/version1/messaging";

    const params = new URLSearchParams({ username: AT_USERNAME, to: phone, message });
    if (AT_SENDER_ID) params.append("from", AT_SENDER_ID);

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        apiKey: AT_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json"
      },
      body: params.toString()
    });
    const data = await resp.json();

    return { statusCode: 200, body: JSON.stringify({ success: true, result: data }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: err.message }) };
  }
};
