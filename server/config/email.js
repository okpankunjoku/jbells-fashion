
const { BrevoClient } = require("@getbrevo/brevo");

// Check required environment variables.
if (!process.env.BREVO_API_KEY) {
  throw new Error("BREVO_API_KEY is missing from the server .env file");
}

if (!process.env.BREVO_SENDER_EMAIL) {
  throw new Error("BREVO_SENDER_EMAIL is missing from the server .env file");
}

// Initialize Brevo.
const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
  timeoutInSeconds: 30,
  maxRetries: 2,
});

// JBELLS sender details.
const emailSender = {
  name: process.env.BREVO_SENDER_NAME || "JBELLS",
  email: process.env.BREVO_SENDER_EMAIL,
};

module.exports = {
  brevo,
  emailSender,
};
