const axios = require('axios');
require('dotenv').config();

// Render (free tier) bloque les connexions sortantes SMTP (ports 25/465/587).
// On envoie donc via l'API HTTP de Brevo (port 443) plutôt qu'en SMTP direct.
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

function parseAddress(from) {
  const match = /^"?([^"<]*)"?\s*<(.+)>$/.exec(from || '');
  if (match) return { name: match[1].trim() || undefined, email: match[2].trim() };
  return { email: from };
}

const transporter = {
  sendMail: async ({ from, to, subject, html }) => {
    try {
      const { data } = await axios.post(
        BREVO_API_URL,
        {
          sender: parseAddress(from),
          to: [{ email: to }],
          subject,
          htmlContent: html,
        },
        {
          headers: {
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 15_000,
        }
      );
      return data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message);
    }
  },
};

module.exports = transporter;
