const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const PROJECTS = [
  { id: 1,  nom: 'Reforestation du Nord',          acronyme: 'RN',  categorie: 'Environnement',       laboratoire: 'Labo Écosystèmes Forestiers' },
  { id: 2,  nom: 'Énergie solaire rurale',          acronyme: 'ESR', categorie: 'Énergie',              laboratoire: 'Labo Énergies Renouvelables' },
  { id: 3,  nom: 'Eau potable Kasserine',           acronyme: 'EPK', categorie: 'Eau & Assainissement', laboratoire: 'Labo Ressources Hydriques' },
  { id: 4,  nom: 'Agriculture durable Béja',        acronyme: 'ADB', categorie: 'Agriculture',          laboratoire: 'Labo Agroécologie' },
  { id: 5,  nom: 'Protection zones humides',        acronyme: 'PZH', categorie: 'Biodiversité',         laboratoire: 'Labo Écologie Aquatique' },
  { id: 6,  nom: 'Mobilité verte Tunis',            acronyme: 'MVT', categorie: 'Mobilité',             laboratoire: 'Labo Urbanisme Durable' },
  { id: 7,  nom: 'Compostage communautaire',        acronyme: 'CC',  categorie: 'Déchets',              laboratoire: 'Labo Économie Circulaire' },
  { id: 8,  nom: 'Éducation environnementale',      acronyme: 'EE',  categorie: 'Éducation',            laboratoire: 'Labo Sciences de l\'Éducation' },
  { id: 9,  nom: 'Pêche durable Sfax',              acronyme: 'PDS', categorie: 'Pêche',                laboratoire: 'Labo Ressources Marines' },
  { id: 10, nom: 'Reboisement Jendouba',            acronyme: 'RJ',  categorie: 'Environnement',       laboratoire: 'Labo Écosystèmes Forestiers' },
  { id: 11, nom: 'Économie circulaire Sousse',      acronyme: 'ECS', categorie: 'Économie verte',       laboratoire: 'Labo Économie Circulaire' },
  { id: 12, nom: 'Jardins urbains Bizerte',         acronyme: 'JUB', categorie: 'Urbanisme',            laboratoire: 'Labo Urbanisme Durable' },
  { id: 13, nom: 'Gestion des déchets Gafsa',       acronyme: 'GDG', categorie: 'Déchets',              laboratoire: 'Labo Gestion Environnementale' },
  { id: 14, nom: 'Tourisme écologique Tozeur',      acronyme: 'TET', categorie: 'Tourisme',             laboratoire: 'Labo Développement Durable' },
  { id: 15, nom: 'Apiculture durable Siliana',      acronyme: 'ADS', categorie: 'Agriculture',          laboratoire: 'Labo Agroécologie' },
  { id: 16, nom: 'Conservation des sols Médenine',  acronyme: 'CSM', categorie: 'Agriculture',          laboratoire: 'Labo Pédologie' },
];

const CHEFS = [
  { id: 1,  nom: 'Ahmed Ben Ali',   email: 'ahmed.ben.ali@greenimpact.tn',   projet_id: 1  },
  { id: 2,  nom: 'Fatma Chabbi',    email: 'fatma.chabbi@greenimpact.tn',    projet_id: 2  },
  { id: 3,  nom: 'Mohamed Slama',   email: 'mohamed.slama@greenimpact.tn',   projet_id: 3  },
  { id: 4,  nom: 'Leila Mansour',   email: 'leila.mansour@greenimpact.tn',   projet_id: 4  },
  { id: 5,  nom: 'Karim Gharbi',    email: 'karim.gharbi@greenimpact.tn',    projet_id: 5  },
  { id: 6,  nom: 'Sonia Khelil',    email: 'sonia.khelil@greenimpact.tn',    projet_id: 6  },
  { id: 7,  nom: 'Youssef Hajji',   email: 'youssef.hajji@greenimpact.tn',   projet_id: 7  },
  { id: 8,  nom: 'Rim Trabelsi',    email: 'rim.trabelsi@greenimpact.tn',    projet_id: 8  },
  { id: 9,  nom: 'Omar Jebali',     email: 'omar.jebali@greenimpact.tn',     projet_id: 9  },
  { id: 10, nom: 'Nadia Belhaj',    email: 'nadia.belhaj@greenimpact.tn',    projet_id: 10 },
  { id: 11, nom: 'Hichem Dridi',    email: 'hichem.dridi@greenimpact.tn',    projet_id: 11 },
  { id: 12, nom: 'Amira Sellami',   email: 'amira.sellami@greenimpact.tn',   projet_id: 12 },
  { id: 13, nom: 'Tarek Bouaziz',   email: 'tarek.bouaziz@greenimpact.tn',   projet_id: 13 },
  { id: 14, nom: 'Samira Ayari',    email: 'samira.ayari@greenimpact.tn',    projet_id: 14 },
  { id: 15, nom: 'Bilel Nasri',     email: 'bilel.nasri@greenimpact.tn',     projet_id: 15 },
  { id: 16, nom: 'Olfa Zouari',     email: 'olfa.zouari@greenimpact.tn',     projet_id: 16 },
];

async function main() {
  console.log('\n======================================');
  console.log('  SEED PROJETS + CHEFS');
  console.log('======================================\n');

  const hashedPassword = await bcrypt.hash('chef123', 10);

  // ── 1. Déplacer l'admin vers id=100 pour libérer les IDs 1-16 ────────────
  await prisma.$executeRawUnsafe(`UPDATE users SET id = 100 WHERE role = 'admin'`);
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('users','id'), 100, true)`);
  console.log('✅ Admin déplacé → id=100\n');

  // ── 2. Insérer les projets avec IDs explicites ────────────────────────────
  for (const p of PROJECTS) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO projects (id, nom, acronyme, categorie, laboratoire, statut, budget, depenses, jalons_total, jalons_completes)
       VALUES ($1, $2, $3, $4, $5, 'Actif', 0, 0, 0, 0)`,
      p.id, p.nom, p.acronyme, p.categorie, p.laboratoire
    );
    console.log(`✅ Projet ${p.id} : ${p.nom}`);
  }

  // Mettre à jour la séquence des projets
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('projects','id'), 16, true)`);

  // ── 3. Insérer les chefs avec IDs explicites ──────────────────────────────
  console.log('');
  for (const c of CHEFS) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO users (id, nom, email, password, role, projet_id)
       VALUES ($1, $2, $3, $4, 'chef_projet', $5)`,
      c.id, c.nom, c.email, hashedPassword, c.projet_id
    );
    console.log(`✅ Chef ${c.id} : ${c.nom} → ${c.email} (projet_id=${c.projet_id})`);
  }

  // Mettre à jour la séquence des users (max est 100 pour l'admin)
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('users','id'), 100, true)`);

  console.log('\n======================================');
  console.log('  ✅ 16 projets insérés');
  console.log('  ✅ 16 chefs insérés (mot de passe: chef123)');
  console.log('  ✅ Admin conservé → id=100');
  console.log('======================================\n');
}

main()
  .catch(err => { console.error('❌', err.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
