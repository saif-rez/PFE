const XLSX = require('xlsx');
const path = require('path');
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
require('dotenv').config();

const FILE_PATH = path.join(__dirname, 'data.xlsx');

async function main() {
  console.log('\n======================================');
  console.log('  CRÉATION DES CHEFS DE PROJET');
  console.log('======================================\n');

  const workbook = XLSX.readFile(FILE_PATH);
  const sheet1 = XLSX.utils.sheet_to_json(workbook.Sheets['Feuille 1 - Identification'], { defval: '' });

  // Extraire un chef unique par projet (première occurrence)
  const chefsMap = {};
  for (const row of sheet1) {
    if (row.projet_id && !chefsMap[row.projet_id]) {
      chefsMap[row.projet_id] = {
        projet_id: row.projet_id,
        projet_nom: row.projet_nom,
        nom: row.chef_projet
      };
    }
  }

  const chefs = Object.values(chefsMap).sort((a, b) => a.projet_id - b.projet_id);
  console.log(`${chefs.length} chefs trouvés dans le fichier Excel.\n`);

  const defaultPassword = await bcrypt.hash('chef123', 10);
  let created = 0;
  let skipped = 0;

  for (const chef of chefs) {
    // Générer un email unique depuis le nom
    const emailBase = chef.nom
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '') // supprimer accents
      .replace(/\s+/g, '.')
      .replace(/[^a-z.]/g, '');
    const email = `${emailBase}@greenimpact.tn`;

    // Vérifier si un chef existe déjà pour ce projet
    const existingByProject = await prisma.user.findFirst({
      where: { role: 'chef_projet', projet_id: chef.projet_id }
    });

    if (existingByProject) {
      console.log(`⏭  Déjà existant : projet ${chef.projet_id} (${chef.projet_nom})`);
      skipped++;
      continue;
    }

    // Vérifier si l'email est déjà pris → ajouter le projet_id pour le rendre unique
    const existingByEmail = await prisma.user.findUnique({ where: { email } });
    const finalEmail = existingByEmail ? `${emailBase}.p${chef.projet_id}@greenimpact.tn` : email;

    await prisma.user.create({
      data: {
        nom: chef.nom,
        email: finalEmail,
        password: defaultPassword,
        role: 'chef_projet',
        projet_id: chef.projet_id
      }
    });

    console.log(`✅ Créé : ${chef.nom} → ${finalEmail} (projet ${chef.projet_id} — ${chef.projet_nom})`);
    created++;
  }

  console.log('\n======================================');
  console.log(`  ✅ Créés   : ${created}`);
  console.log(`  ⏭  Ignorés : ${skipped}`);
  console.log('======================================');
  console.log('\n  Mot de passe par défaut : chef123');
  console.log('  (À changer après la première connexion)\n');
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
