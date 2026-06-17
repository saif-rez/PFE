const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { sendReportApprovedEmail, sendReportRejectedEmail } = require('../services/emailService');

// GET /api/submissions — Admin: all | Chef: his own
router.get('/', verifyToken, async (req, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      where: req.user.role === 'admin' ? {} : { user_id: req.user.id },
      include: {
        project: { select: { nom: true } },
        user: { select: { nom: true } }
      },
      orderBy: { date_soumission: 'desc' }
    });
    res.json(submissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/submissions/:id
router.get('/:id', verifyToken, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        project: { select: { nom: true } },
        user: { select: { nom: true } }
      }
    });
    if (!submission) return res.status(404).json({ error: 'Submission not found.' });

    if (req.user.role === 'chef_projet' && submission.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/submissions — Chef submits a report
router.post('/', verifyToken, async (req, res) => {
  if (req.user.role !== 'chef_projet') {
    return res.status(403).json({ error: 'Only chefs de projet can submit reports.' });
  }

  const { periode, rapport_data } = req.body;
  if (!periode || !rapport_data) {
    return res.status(400).json({ error: 'periode and rapport_data are required.' });
  }

  try {
    const submission = await prisma.submission.create({
      data: { projet_id: req.user.projet_id, user_id: req.user.id, periode, rapport_data }
    });
    res.status(201).json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /api/submissions/:id — Chef resubmits a rejected report
router.put('/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'chef_projet') {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const id = parseInt(req.params.id);
  const { rapport_data, periode } = req.body;

  try {
    const existing = await prisma.submission.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Submission not found.' });
    if (existing.user_id !== req.user.id) return res.status(403).json({ error: 'Access denied.' });
    if (existing.statut !== 'rejete') return res.status(400).json({ error: 'Only rejected submissions can be updated.' });

    const submission = await prisma.submission.update({
      where: { id },
      data: { rapport_data, periode, statut: 'en_attente', commentaire_rejet: null, date_soumission: new Date() }
    });
    res.json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PATCH /api/submissions/:id/approve — Admin approves
router.patch('/:id/approve', verifyAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const submission = await prisma.submission.update({
      where: { id },
      data: { statut: 'approuve', date_decision: new Date() },
      include: { user: true, project: { select: { nom: true } } }
    });

    sendReportApprovedEmail({
      chefNom: submission.user.nom,
      chefEmail: submission.user.email,
      projetNom: submission.project.nom,
      periode: submission.periode,
    }).catch(err => console.error(`[Email] Échec envoi approbation à ${submission.user.email}:`, err.message));

    res.json(submission);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Submission not found.' });
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PATCH /api/submissions/:id/reject — Admin rejects with reason
router.patch('/:id/reject', verifyAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const { commentaire_rejet } = req.body;

  if (!commentaire_rejet) {
    return res.status(400).json({ error: 'commentaire_rejet is required.' });
  }

  try {
    const [submission] = await prisma.$transaction([
      prisma.submission.update({
        where: { id },
        data: { statut: 'rejete', commentaire_rejet, date_decision: new Date() },
        include: { user: true, project: { select: { nom: true } } }
      }),
      prisma.comment.create({
        data: { submission_id: id, admin_id: req.user.id, texte: commentaire_rejet }
      }),
    ]);

    sendReportRejectedEmail({
      chefNom: submission.user.nom,
      chefEmail: submission.user.email,
      projetNom: submission.project.nom,
      periode: submission.periode,
      raison: commentaire_rejet,
    }).catch(err => console.error(`[Email] Échec envoi rejet à ${submission.user.email}:`, err.message));

    res.json(submission);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Submission not found.' });
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
