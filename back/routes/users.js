const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { verifyAdmin, verifyToken } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../services/emailService');

// GET /api/users — Admin only
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, nom: true, email: true, role: true, projet_id: true, created_at: true, project: { select: { nom: true } } },
      orderBy: { id: 'asc' }
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/users — Admin only: create a user
router.post('/', verifyAdmin, async (req, res) => {
  const { nom, email, password, role, projet_id } = req.body;

  if (!nom || !email || !password || !role) {
    return res.status(400).json({ error: 'nom, email, password, and role are required.' });
  }
  if (!['admin', 'chef_projet'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { nom, email, password: hashedPassword, role, projet_id: projet_id || null },
      select: { id: true, nom: true, email: true, role: true, projet_id: true, created_at: true }
    });

    // Envoi de l'email de bienvenue avec les identifiants
    if (role === 'chef_projet') {
      let projetNom = null;
      if (projet_id) {
        const projet = await prisma.project.findUnique({ where: { id: Number(projet_id) }, select: { nom: true } });
        projetNom = projet?.nom || null;
      }
      sendWelcomeEmail({ chefNom: nom, chefEmail: email, motDePasse: password, projetNom })
        .catch(err => console.error(`[Welcome] Échec envoi email à ${email}:`, err.message));
    }

    res.status(201).json(user);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Email already in use.' });
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /api/users/:id — Admin only: update a user
router.put('/:id', verifyAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const { nom, email, role, projet_id, password } = req.body;

  try {
    const data = { nom, email, role, projet_id: projet_id || null };
    if (password) data.password = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, nom: true, email: true, role: true, projet_id: true, created_at: true }
    });
    res.json(user);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'User not found.' });
    if (err.code === 'P2002') return res.status(409).json({ error: 'Email already in use.' });
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/users/:id — Admin only
router.delete('/:id', verifyAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'User not found.' });
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PATCH /api/users/me — Utilisateur connecté modifie son propre compte
router.patch('/me', verifyToken, async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  const id = req.user.id;

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    // Vérification du mot de passe actuel obligatoire
    if (!currentPassword) {
      return res.status(400).json({ error: 'Le mot de passe actuel est requis.' });
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect.' });
    }

    const data = {};

    // Mise à jour email
    if (email && email !== user.email) {
      data.email = email;
    }

    // Mise à jour mot de passe
    if (newPassword) {
      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
      }
      data.password = await bcrypt.hash(newPassword, 12);
      data.password_changed_at = new Date();
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Aucune modification détectée.' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, nom: true, email: true, role: true, projet_id: true },
    });

    res.json({ message: 'Compte mis à jour avec succès.', user: updated });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Cet email est déjà utilisé.' });
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
