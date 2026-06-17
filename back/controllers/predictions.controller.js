const axios = require('axios');
const prisma = require('../config/db');

const FLASK_URL = process.env.FLASK_URL || 'http://localhost:5001';

/**
 * Calcule les 8 features ML à partir d'un objet projet Prisma.
 * Durée standard d'un projet : 24 mois.
 */
function calculateFeatures(project) {
  const jalons_total     = Math.max(1, project.jalons_total     || 0);
  const jalons_completes =             project.jalons_completes || 0;
  const budget           = Math.max(1, parseFloat(project.budget)   || 0);
  const depenses         =             parseFloat(project.depenses) || 0;

  const avancement_actuel = (jalons_completes / jalons_total) * 100;

  const now   = new Date();
  const debut = project.date_debut ? new Date(project.date_debut) : now;
  const mois  = Math.max(1,
    (now.getFullYear() - debut.getFullYear()) * 12 +
    (now.getMonth()   - debut.getMonth())
  );

  const DUREE_STD = 24;
  const av_prev   = Math.min(100, (mois / DUREE_STD) * 100);
  const bcons     = (depenses / budget) * 100;

  const r = (v, d = 10) => Math.round(v * d) / d;

  return {
    avancement_actuel_pct:       r(avancement_actuel),
    avancement_prevu_pct:        r(av_prev),
    ecart_avancement_pct:        r(avancement_actuel - av_prev),
    budget_consomme_pct:         r(bcons),
    taux_completion_jalons_pct:  r(avancement_actuel),
    velocity_score:              r(avancement_actuel / Math.max(1, av_prev), 1000),
    ratio_avancement_budget:     r(avancement_actuel / Math.max(1, bcons),   1000),
    semestre_normalise:          r(Math.min(1, mois / DUREE_STD),            1000),
  };
}

/** Traduction des erreurs de connexion Flask en message lisible. */
function handleFlaskError(err, res) {
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') {
    return res.status(503).json({
      error: `Service IA indisponible (${FLASK_URL}). Vérifiez que predict_api.py est démarré.`,
    });
  }
  console.error('[AI]', err.message);
  return res.status(500).json({ error: 'Erreur serveur.' });
}

// ── GET /api/predictions/:id ──────────────────────────────────────────────────
const getPrediction = async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID projet invalide.' });

  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ error: 'Projet non trouvé.' });

    // Chef : ne peut consulter que son propre projet
    if (req.user.role !== 'admin' && req.user.projet_id !== id) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    const features = calculateFeatures(project);

    const { data: prediction } = await axios.post(
      `${FLASK_URL}/predict`,
      features,
      { timeout: 10_000 }
    );

    return res.json({
      projet_id:  project.id,
      projet_nom: project.nom,
      acronyme:   project.acronyme,
      statut:     project.statut,
      features,
      prediction,
    });
  } catch (err) {
    return handleFlaskError(err, res);
  }
};

// ── GET /api/predictions/all ──────────────────────────────────────────────────
const getAllPredictions = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({ orderBy: { id: 'asc' } });

    if (projects.length === 0) return res.json([]);

    const batch = projects.map(p => ({
      projet_id:  p.id,
      projet_nom: p.nom,
      features:   calculateFeatures(p),
    }));

    const { data: predictions } = await axios.post(
      `${FLASK_URL}/predict/batch`,
      batch,
      { timeout: 30_000 }
    );

    return res.json(predictions);
  } catch (err) {
    return handleFlaskError(err, res);
  }
};

module.exports = { getPrediction, getAllPredictions };
