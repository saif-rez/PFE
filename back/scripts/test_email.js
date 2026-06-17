/**
 * Script de test — Envoi manuel des emails automatiques
 * ======================================================
 * Usage :
 *   node scripts/test_email.js reminder   → simule le 27 juin  (rappel 3 jours avant)
 *   node scripts/test_email.js overdue    → simule le 1er juillet (deadline dépassée)
 *   node scripts/test_email.js list       → affiche les chefs sans soumission (sans envoyer)
 */

require('dotenv').config();
const prisma   = require('../config/db');
const { sendReminderEmail, sendOverdueEmail } = require('../services/emailService');

// ── Argument de la ligne de commande ─────────────────────────────────────────
const MODE = process.argv[2];

if (!MODE || !['reminder', 'overdue', 'list'].includes(MODE)) {
  console.log('\n Usage :');
  console.log('   node scripts/test_email.js reminder  → email rappel (3j avant deadline)');
  console.log('   node scripts/test_email.js overdue   → email deadline dépassée');
  console.log('   node scripts/test_email.js list      → affiche les chefs sans soumission\n');
  process.exit(1);
}

// ── Configuration selon le mode ───────────────────────────────────────────────
const CONFIG = {
  reminder: {
    label:    '27 juin (Rappel — 3 jours avant deadline)',
    periode:  `S1 ${new Date().getFullYear()}`,
    deadline: '30 juin',
    isReminder: true,
  },
  overdue: {
    label:    '1er juillet (Deadline dépassée)',
    periode:  `S1 ${new Date().getFullYear()}`,
    deadline: null,
    isReminder: false,
  },
  list: {
    label:    'Liste uniquement (aucun email envoyé)',
    periode:  `S1 ${new Date().getFullYear()}`,
    deadline: null,
    isReminder: null,
  },
};

const cfg = CONFIG[MODE];

// ── Récupère les chefs sans soumission ───────────────────────────────────────
async function getChefsWithoutSubmission(periode) {
  const submitted = await prisma.submission.findMany({
    where: {
      periode,
      statut: { in: ['en_attente', 'approuve'] },
    },
    select: { user_id: true },
  });

  const submittedIds = submitted.map(s => s.user_id);

  console.log(`\n   Chefs ayant déjà soumis pour ${periode} : ${submittedIds.length}`);

  return prisma.user.findMany({
    where: {
      role:      'chef_projet',
      projet_id: { not: null },
      ...(submittedIds.length > 0 && { id: { notIn: submittedIds } }),
    },
    include: { project: { select: { nom: true } } },
  });
}

// ── Fonction principale ───────────────────────────────────────────────────────
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log(' TEST EMAIL — Green Impact Platform');
  console.log('='.repeat(60));
  console.log(` Mode     : ${MODE.toUpperCase()}`);
  console.log(` Simule   : ${cfg.label}`);
  console.log(` Période  : ${cfg.periode}`);
  console.log('='.repeat(60));

  const chefs = await getChefsWithoutSubmission(cfg.periode);

  if (chefs.length === 0) {
    console.log(`\n [OK] Tous les chefs ont soumis pour ${cfg.periode}.`);
    console.log('      Aucun email à envoyer.\n');
    return;
  }

  console.log(`\n Chefs sans soumission : ${chefs.length}`);
  console.log(' ' + '-'.repeat(56));

  chefs.forEach((chef, i) => {
    console.log(` ${i + 1}. ${chef.nom.padEnd(25)} → ${chef.email}`);
    console.log(`    Projet : ${chef.project?.nom ?? 'Non assigné'}`);
  });

  console.log(' ' + '-'.repeat(56));

  // Mode list → on n'envoie pas
  if (MODE === 'list') {
    console.log('\n [INFO] Mode "list" — aucun email envoyé.');
    console.log('        Relancez avec "reminder" ou "overdue" pour envoyer.\n');
    return;
  }

  // Confirmation avant envoi
  console.log(`\n  ${chefs.length} email(s) vont être envoyés depuis :`);
  console.log(`  ${process.env.SMTP_USER}`);
  console.log('\n  Envoi en cours...\n');

  let success = 0;
  let failed  = 0;

  for (const chef of chefs) {
    try {
      if (cfg.isReminder) {
        await sendReminderEmail({
          chefNom:   chef.nom,
          projetNom: chef.project?.nom ?? 'votre projet',
          deadline:  cfg.deadline,
          chefEmail: chef.email,
        });
      } else {
        await sendOverdueEmail({
          chefNom:   chef.nom,
          projetNom: chef.project?.nom ?? 'votre projet',
          chefEmail: chef.email,
        });
      }

      console.log(` [OK]  Email envoyé → ${chef.email}`);
      success++;
    } catch (err) {
      console.error(` [ERR] Échec → ${chef.email} : ${err.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(` RÉSULTAT : ${success} envoyé(s)  |  ${failed} échec(s)`);
  console.log('='.repeat(60) + '\n');
}

main()
  .catch(err => {
    console.error('\n [FATAL]', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
