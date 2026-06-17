const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  family: 4, // force IPv4 — évite ENETUNREACH sur les hébergeurs sans sortie IPv6 (ex. Render)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

module.exports = transporter;
