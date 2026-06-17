const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { sendPasswordResetEmail, sendPasswordChangedEmail } = require('../services/emailService');

// In-memory rate limiter: max 3 requests/hour per IP+email combo
const rateLimitStore = new Map();

function checkRateLimit(key, maxRequests = 3, windowMs = 60 * 60 * 1000) {
  const now = Date.now();
  const timestamps = (rateLimitStore.get(key) || []).filter(t => now - t < windowMs);
  if (timestamps.length >= maxRequests) return false;
  timestamps.push(now);
  rateLimitStore.set(key, timestamps);
  return true;
}

// Clean up old rate limit entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of rateLimitStore.entries()) {
    const fresh = timestamps.filter(t => now - t < 60 * 60 * 1000);
    if (fresh.length === 0) rateLimitStore.delete(key);
    else rateLimitStore.set(key, fresh);
  }
}, 60 * 60 * 1000);

const NEUTRAL_MSG = { message: 'Si cet email existe, vous recevrez un lien de réinitialisation sous peu.' };

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'Navigateur inconnu';

  const rateLimitKey = `reset:${ip}:${(email || '').toLowerCase().trim()}`;
  if (!checkRateLimit(rateLimitKey)) {
    return res.status(429).json({ message: 'Trop de tentatives. Réessayez dans une heure.' });
  }

  if (!email) return res.json(NEUTRAL_MSG);

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    console.log(`[RESET] Request for ${email} from ${ip} — user found: ${!!user}`);

    if (!user) return res.json(NEUTRAL_MSG);

    // Invalidate any previous unused tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { user_id: user.id, used: false },
      data: { used: true },
    });

    // Generate cryptographically secure token
    const rawToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.passwordResetToken.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        ip_address: ip,
        user_agent: userAgent,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;
    const cancelUrl = `${frontendUrl}/forgot-password?cancel=${rawToken}`;

    sendPasswordResetEmail({
      nom: user.nom,
      email: user.email,
      resetUrl,
      cancelUrl,
      ip,
      userAgent,
      expiresAt,
    }).catch(err => console.error('[RESET] Email error:', err));

    return res.json(NEUTRAL_MSG);
  } catch (err) {
    console.error('[RESET] Error:', err);
    return res.json(NEUTRAL_MSG);
  }
});

// GET /api/auth/verify-reset-token/:token
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const tokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const record = await prisma.passwordResetToken.findUnique({ where: { token_hash: tokenHash } });

    if (!record || record.used || record.expires_at < new Date()) {
      return res.status(400).json({ valid: false, error: 'Lien invalide ou expiré.' });
    }
    return res.json({ valid: true });
  } catch {
    return res.status(500).json({ valid: false, error: 'Erreur serveur.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: 'Données manquantes.' });
  }

  const strongPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{};:,<.>]).{8,}$/;
  if (!strongPassword.test(password)) {
    return res.status(400).json({ error: 'Le mot de passe ne respecte pas les critères de sécurité.' });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const record = await prisma.passwordResetToken.findUnique({
      where: { token_hash: tokenHash },
      include: { user: true },
    });

    if (!record || record.used || record.expires_at < new Date()) {
      console.log('[RESET] Invalid or expired token used');
      return res.status(400).json({ error: 'Lien invalide ou expiré.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const now = new Date();

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.user_id },
        data: { password: hashedPassword, password_changed_at: now },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { used: true },
      }),
    ]);

    console.log(`[RESET] Password changed successfully for ${record.user.email}`);

    sendPasswordChangedEmail({ nom: record.user.nom, email: record.user.email })
      .catch(err => console.error('[RESET] Confirmation email error:', err));

    return res.json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (err) {
    console.error('[RESET] Error:', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/auth/invalidate-reset-token/:token  ("Ce n'était pas moi")
router.get('/invalidate-reset-token/:token', async (req, res) => {
  try {
    const tokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');
    await prisma.passwordResetToken.updateMany({
      where: { token_hash: tokenHash, used: false },
      data: { used: true },
    });
    console.log('[RESET] Token invalidated via "not me" link');
    return res.json({ message: 'Lien annulé.' });
  } catch {
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
