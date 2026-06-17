/**
 * Seed jalons_total, jalons_completes, date_debut pour les 16+ projets.
 * Objectif : donner des profils variés afin que l'IA génère des prédictions distinctes.
 *
 * Profils répartis :
 *   - "en avance"   : jalons_completes > prévu par la durée écoulée
 *   - "dans les délais" : jalons_completes ≈ prévu
 *   - "léger retard": jalons_completes un peu en dessous du prévu
 *   - "retard critique": jalons_completes très en dessous du prévu
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function dateDebutIlYA(mois) {
  const d = new Date();
  d.setMonth(d.getMonth() - mois);
  d.setDate(1); // 1er du mois pour simplifier
  return d;
}

async function main() {
  const projects = await prisma.project.findMany({
    select: { id: true, nom: true },
    orderBy: { id: 'asc' },
  });

  const n = projects.length;

  // ── Génère un profil pour chaque projet ──────────────────────────────────
  // On veut une diversité des 4 profils
  const profiles = [
    { nom: "en_avance",        poids: 2 },
    { nom: "dans_delais",      poids: 4 },
    { nom: "leger_retard",     poids: 5 },
    { nom: "retard_critique",  poids: 3 },
    { nom: "debut_projet",     poids: 2 },
  ];

  // Répartition déterministe des profils sur les projets
  const pool = [];
  profiles.forEach(p => {
    for (let i = 0; i < p.poids; i++) pool.push(p.nom);
  });
  // Mélange du pool
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  console.log('\nMise à jour des jalons et dates de démarrage :');
  console.log('─'.repeat(75));

  const updates = [];

  for (let i = 0; i < n; i++) {
    const profile = pool[i % pool.length];
    let jalons_total, jalons_completes, mois_debut;

    const DUREE_STD = 24; // mois standard d'un projet

    switch (profile) {
      case 'en_avance': {
        // Projet démarré il y a 8–18 mois, avance de 15–30%
        mois_debut   = rnd(8, 18);
        jalons_total = rnd(8, 20);
        const prevu  = Math.round((mois_debut / DUREE_STD) * jalons_total);
        jalons_completes = Math.min(jalons_total, prevu + rnd(1, Math.max(1, Math.round(jalons_total * 0.25))));
        break;
      }
      case 'dans_delais': {
        // Projet démarré il y a 6–20 mois, completion ≈ durée écoulée ± 5%
        mois_debut   = rnd(6, 20);
        jalons_total = rnd(8, 18);
        const prevu  = Math.round((mois_debut / DUREE_STD) * jalons_total);
        jalons_completes = Math.max(0, Math.min(jalons_total, prevu + rnd(-1, 1)));
        break;
      }
      case 'leger_retard': {
        // Projet démarré il y a 10–22 mois, retard de 10–25%
        mois_debut   = rnd(10, 22);
        jalons_total = rnd(10, 20);
        const prevu  = Math.round((mois_debut / DUREE_STD) * jalons_total);
        const retard = rnd(1, Math.max(1, Math.round(jalons_total * 0.20)));
        jalons_completes = Math.max(0, prevu - retard);
        break;
      }
      case 'retard_critique': {
        // Projet démarré il y a 14–23 mois, retard de 30–50%
        mois_debut   = rnd(14, 23);
        jalons_total = rnd(10, 20);
        const prevu  = Math.round((mois_debut / DUREE_STD) * jalons_total);
        const retard = rnd(Math.round(jalons_total * 0.30), Math.round(jalons_total * 0.50));
        jalons_completes = Math.max(0, prevu - retard);
        break;
      }
      case 'debut_projet': {
        // Projet tout récent (1–5 mois), peu de jalons complétés
        mois_debut   = rnd(1, 5);
        jalons_total = rnd(10, 18);
        jalons_completes = rnd(0, 2);
        break;
      }
      default: {
        mois_debut   = rnd(6, 18);
        jalons_total = rnd(8, 16);
        jalons_completes = rnd(2, Math.floor(jalons_total / 2));
      }
    }

    const date_debut = dateDebutIlYA(mois_debut);
    const avancement = Math.round((jalons_completes / jalons_total) * 100);
    const prevu_pct  = Math.round((mois_debut / DUREE_STD) * 100);

    console.log(
      `  [${String(projects[i].id).padStart(2)}] ${projects[i].nom.slice(0, 30).padEnd(30)} ` +
      `Profil: ${profile.padEnd(16)} ` +
      `Jalons: ${String(jalons_completes).padStart(2)}/${String(jalons_total).padStart(2)} ` +
      `(${String(avancement).padStart(3)}% réel vs ${String(prevu_pct).padStart(3)}% prévu) ` +
      `Début: il y a ${String(mois_debut).padStart(2)} mois`
    );

    updates.push(
      prisma.project.update({
        where: { id: projects[i].id },
        data: {
          jalons_total,
          jalons_completes,
          date_debut,
        },
      })
    );
  }

  console.log('─'.repeat(75));
  await prisma.$transaction(updates);
  console.log(`\n[OK] ${n} projets mis à jour (jalons + date_debut).`);
  console.log('    → Relancez les prédictions IA pour voir des résultats variés.\n');
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
