const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

function attachChef(project) {
  const chef = project.users?.find(u => u.role === 'chef_projet');
  return {
    ...project,
    chef_nom: chef?.nom || '',
    chef_email: chef?.email || '',
    users: undefined,
  };
}

// GET /api/projects — Admin: all | Chef: his own
router.get('/', verifyToken, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: req.user.role === 'admin' ? {} : { id: req.user.projet_id },
      orderBy: { id: 'asc' },
      include: { users: { where: { role: 'chef_projet' }, select: { nom: true, email: true, role: true } } }
    });
    res.json(projects.map(attachChef));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/projects/:id
router.get('/:id', verifyToken, async (req, res) => {
  const id = parseInt(req.params.id);

  if (req.user.role === 'chef_projet' && req.user.projet_id !== id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: { users: { where: { role: 'chef_projet' }, select: { nom: true, email: true, role: true } } }
    });
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    res.json(attachChef(project));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/projects — Admin only
router.post('/', verifyAdmin, async (req, res) => {
  const { nom, acronyme, categorie, laboratoire, budget, date_debut } = req.body;
  if (!nom || !acronyme || !categorie || !laboratoire) {
    return res.status(400).json({ error: 'nom, acronyme, categorie et laboratoire sont requis.' });
  }
  try {
    const project = await prisma.project.create({
      data: {
        nom,
        acronyme,
        categorie,
        laboratoire,
        budget: Number(budget) || 0,
        depenses: 0,
        statut: 'Actif',
        jalons_total: 0,
        jalons_completes: 0,
        date_debut: date_debut ? new Date(date_debut) : null,
      }
    });
    res.status(201).json(project);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Un projet avec ce nom existe déjà.' });
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /api/projects/:id — Admin only
router.put('/:id', verifyAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const { nom, acronyme, categorie, budget, depenses, statut, jalons_total, jalons_completes, date_debut, laboratoire } = req.body;

  try {
    const project = await prisma.project.update({
      where: { id },
      data: { nom, acronyme, categorie, budget, depenses, statut, jalons_total, jalons_completes, date_debut: date_debut ? new Date(date_debut) : undefined, laboratoire }
    });
    res.json(project);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Project not found.' });
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/projects/:id — Admin only
router.delete('/:id', verifyAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.$transaction([
      // 1. Désassigner le chef du projet
      prisma.user.updateMany({ where: { projet_id: id }, data: { projet_id: null } }),
      // 2. Supprimer les soumissions liées
      prisma.submission.deleteMany({ where: { projet_id: id } }),
      // 3. Supprimer le projet
      prisma.project.delete({ where: { id } }),
    ]);
    res.json({ message: 'Projet supprimé avec succès.' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Projet introuvable.' });
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
