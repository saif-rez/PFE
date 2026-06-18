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

/**
 * POST avec retries — le service IA (Render free tier) s'endort après 15 min
 * d'inactivité ; son réveil ("cold start") peut prendre jusqu'à ~60-90s pendant
 * lesquelles le proxy Render renvoie 502/503. On retente plusieurs fois avant
 * d'abandonner.
 */
async function postWithRetry(url, data, { timeout, retries = 3, retryDelayMs = 5000 }) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await axios.post(url, data, { timeout });
    } catch (err) {
      const status = err.response?.status;
      const isRetryable = status === 502 || status === 503 || status === 504 || err.code === 'ECONNRESET';
      if (!isRetryable || attempt === retries) throw err;
      console.warn(`[AI] Tentative ${attempt}/${retries} échouée (${status || err.code}) — réveil du service en cours, nouvelle tentative dans ${retryDelayMs / 1000}s...`);
      await new Promise(r => setTimeout(r, retryDelayMs));
    }
  }
}

/** Traduction des erreurs de connexion Flask en message lisible. */
function handleFlaskError(err, res) {
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') {
    return res.status(503).json({
      error: `Service IA indisponible (${FLASK_URL}). Vérifiez que predict_api.py est démarré.`,
    });
  }
  if (err.response?.status) {
    console.error(`[AI] Service IA a répondu ${err.response.status} après plusieurs tentatives.`);
    return res.status(503).json({
      error: 'Service IA en cours de démarrage (cold start Render). Merci de réessayer dans quelques secondes.',
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

    const { data: prediction } = await postWithRetry(
      `${FLASK_URL}/predict`,
      features,
      { timeout: 15_000, retries: 3, retryDelayMs: 5000 }
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

    const { data: predictions } = await postWithRetry(
      `${FLASK_URL}/predict/batch`,
      batch,
      { timeout: 35_000, retries: 3, retryDelayMs: 5000 }
    );

    return res.json(predictions);
  } catch (err) {
    return handleFlaskError(err, res);
  }
};

module.exports = { getPrediction, getAllPredictions };
