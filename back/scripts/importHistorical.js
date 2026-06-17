const XLSX = require('xlsx');
const path = require('path');
const prisma = require('../config/db');
require('dotenv').config();

const FILE_PATH = path.join(__dirname, 'data.xlsx');

// ─── Lecture des feuilles ───────────────────────────────────────────────────

function readSheet(workbook, name) {
  const sheet = workbook.Sheets[name];
  if (!sheet) {
    console.error(`❌ Feuille introuvable : "${name}"`);
    process.exit(1);
  }
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

// ─── Groupement des lignes par (projet_id, periode) ────────────────────────

function groupBy(rows, byName = false) {
  const map = {};
  for (const row of rows) {
    const key = byName
      ? `${row.projet_nom}|${row.periode}`
      : `${row.projet_id}|${row.periode}`;
    if (!map[key]) map[key] = [];
    map[key].push(row);
  }
  return map;
}

// ─── Date depuis la période (ex: "S1 2022" → 2022-06-30) ──────────────────

function periodeToDate(periode) {
  const [sem, annee] = periode.split(' ');
  const mois = sem === 'S1' ? '06' : '12';
  return new Date(`${annee}-${mois}-30`);
}

// ─── Construction du rapport_data ──────────────────────────────────────────

function buildTab1(rows) {
  const r = rows[0];
  return {
    numero: String(r.projet_id),
    intitule: r.projet_nom || '',
    acronyme: r.acronyme || '',
    chefNomPrenom: r.chef_projet || '',
    laboratoire: r.laboratoire || '',
    reseauxSociaux: rows
      .map(row => row.reseaux_sociaux)
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i) // unique
      .join('\n')
  };
}

function buildTab2(rows) {
  return rows.map(r => ({
    objectifSpecifique: r.objectif_specifique || '',
    resultatsAttendus: r.resultats_attendus || '',
    activites: r.activites || '',
    livrables: r.livrables || ''
  }));
}

function buildTab3(rows) {
  return rows.map(r => ({
    objectifSpecifique: r.objectif_specifique || '',
    activitePrevue: r.activite_prevue || '',
    tachesRealisees: r.taches_realisees || '',
    etat: r.etat || 'En cours de préparation',
    avancement: Number(r.avancement_pct) || 0
  }));
}

function buildTab4(rows) {
  return rows.map(r => ({
    livrable: r.livrable || '',
    description: r.description || '',
    type: r.type_livrable || '',
    statut: r.statut || 'En cours',
    dissemination: r.niveau_dissemination || 'Public'
  }));
}

function buildTab5(rows) {
  return rows.map(r => ({
    intitule: r.intitule_jalon || '',
    objectifs: r.objectifs || '',
    activiteCadre: '',                              // Fix P1 : colonne absente du fichier Excel
    date: r.date || '',
    lieu: r.lieu || '',
    publicCible: r.public_cible || '',
    nombreParticipants: String(r.nb_participants || '')
  }));
}

function buildTab6(rows) {
  return rows.map(r => ({
    action: r.action_communication || '',
    activiteConcernee: r.activite_concernee || '',
    cible: r.cible || ''
  }));
}

function buildTab7(rows) {
  return rows.map(r => ({
    date: r.date_reunion || '',
    lieu: r.lieu || '',
    objet: r.objet || '',
    partenaires: r.partenaires || ''
  }));
}

function buildTab8(rows) {
  return rows.map(r => ({
    nomPrenom: r.nom_prenom || '',
    genre: r.genre || '',
    typePersonnel: r.type_personnel || '',
    partenaire: r.partenaire || ''
  }));
}

function buildTab9(rows) {
  return rows.map(r => ({
    equipement: r.equipement || '',
    type: r.type_equipement || '',
    laboratoire: r.laboratoire_beneficiaire || ''
  }));
}

// ─── Script principal ───────────────────────────────────────────────────────

async function main() {
  console.log('\n======================================');
  console.log('  IMPORT DONNÉES HISTORIQUES');
  console.log('======================================\n');

  const workbook = XLSX.readFile(FILE_PATH);

  // Lecture des 9 feuilles
  const sheet1 = readSheet(workbook, 'Feuille 1 - Identification');
  const sheet2 = readSheet(workbook, 'Feuille 2 - MCL');
  const sheet3 = readSheet(workbook, 'Feuille 3 - Activites');
  const sheet4 = readSheet(workbook, 'Feuille 4 - Livrables');
  const sheet5 = readSheet(workbook, 'Feuille 5 - Jalons');
  const sheet6 = readSheet(workbook, 'Feuille 6 - Communication');
  const sheet7 = readSheet(workbook, 'Feuille 7 - Reunions');
  const sheet8 = readSheet(workbook, 'Feuille 8 - Contractuels');
  const sheet9 = readSheet(workbook, 'Feuille 9 - Equipements');

  // Groupement par (projet_nom, periode) — on utilise le nom pour éviter les conflits d'IDs
  const g1 = groupBy(sheet1, true);
  const g2 = groupBy(sheet2, true);
  const g3 = groupBy(sheet3, true);
  const g4 = groupBy(sheet4, true);
  const g5 = groupBy(sheet5, true);
  const g6 = groupBy(sheet6, true);
  const g7 = groupBy(sheet7, true);
  const g8 = groupBy(sheet8, true);
  const g9 = groupBy(sheet9, true);

  // Toutes les soumissions uniques (projet_nom, periode) depuis Feuille 1
  const submissionKeys = Object.keys(g1);
  console.log(`📊 Soumissions trouvées dans le fichier : ${submissionKeys.length}\n`);

  // Corrections de noms entre Excel et BDD
  const NAME_MAP = {
    'Protection zones humides': 'Protection des zones humides'
  };

  // Chargement des projets et chefs depuis la BDD (lookup par nom)
  const dbProjects = await prisma.project.findMany({ select: { id: true, nom: true } });
  const chefs = await prisma.user.findMany({
    where: { role: 'chef_projet' },
    select: { id: true, projet_id: true }
  });

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const key of submissionKeys) {
    const separatorIdx = key.lastIndexOf('|');
    const projetNom = key.substring(0, separatorIdx);
    const periode = key.substring(separatorIdx + 1).trim();

    // Trouver le projet en base par son nom (avec mapping si nécessaire)
    const resolvedNom = NAME_MAP[projetNom] || projetNom;
    const dbProject = dbProjects.find(p => p.nom.trim() === resolvedNom.trim());
    if (!dbProject) {
      console.log(`⚠  Projet introuvable en base : "${projetNom}" — ignoré`);
      skipped++;
      continue;
    }
    const projet_id = dbProject.id;

    // Trouver le chef assigné à ce projet
    const chef = chefs.find(c => c.projet_id === projet_id);
    if (!chef) {
      console.log(`⚠  Aucun chef trouvé pour "${projetNom}" (db_id=${projet_id}) — ignoré`);
      skipped++;
      continue;
    }

    // Vérifier si la soumission existe déjà
    const existing = await prisma.submission.findFirst({
      where: { projet_id, periode }
    });
    if (existing) {
      console.log(`⏭  Déjà importé : ${projetNom} — ${periode}`);
      skipped++;
      continue;
    }

    try {
      const rapport_data = {
        tab1: buildTab1(g1[key] || []),
        tab2: buildTab2(g2[key] || []),
        tab3: buildTab3(g3[key] || []),
        tab4: buildTab4(g4[key] || []),
        tab5: buildTab5(g5[key] || []),
        tab6: buildTab6(g6[key] || []),
        tab7: buildTab7(g7[key] || []),
        tab8: buildTab8(g8[key] || []),
        tab9: buildTab9(g9[key] || [])
      };

      await prisma.submission.create({
        data: {
          projet_id,
          user_id: chef.id,
          periode,
          statut: 'approuve',
          rapport_data,
          date_soumission: periodeToDate(periode),  // Fix P3
          date_decision:   periodeToDate(periode),  // Fix P3
        }
      });

      console.log(`✅ Importé : ${projetNom} — ${periode}`);
      inserted++;
    } catch (err) {
      console.error(`❌ Erreur : ${projetNom} — ${periode} :`, err.message);
      errors++;
    }
  }

  console.log('\n======================================');
  console.log(`  ✅ Insérées  : ${inserted}`);
  console.log(`  ⏭  Ignorées  : ${skipped}`);
  console.log(`  ❌ Erreurs   : ${errors}`);
  console.log('======================================\n');
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
