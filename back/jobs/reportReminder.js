const cron = require('node-cron');
const prisma = require('../config/db');
const { sendReminderEmail, sendOverdueEmail } = require('../services/emailService');

const getSemesterPeriod = (month, year) => {
  return month <= 6 ? `S1 ${year}` : `S2 ${year}`;
};

const getChefsWithoutSubmission = async (periode) => {
  const submitted = await prisma.submission.findMany({
    where: {
      periode,
      statut: { in: ['en_attente', 'approuve'] }
    },
    select: { user_id: true }
  });

  const submittedIds = submitted.map(s => s.user_id);

  return prisma.user.findMany({
    where: {
      role: 'chef_projet',
      projet_id: { not: null },
      ...(submittedIds.length > 0 && { id: { notIn: submittedIds } })
    },
    include: { project: { select: { nom: true } } }
  });
};

const checkAndSendEmails = async () => {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();

  // Email 1 — Rappel 3 jours avant deadline
  // 27 juin (3j avant 30 juin) ou 28 décembre (3j avant 31 décembre)
  const isReminder = (month === 6 && day === 27) || (month === 12 && day === 28);

  // Email 2 — Deadline dépassée
  // 1er juillet (lendemain du 30 juin) ou 1er janvier (lendemain du 31 décembre)
  const isOverdue = (month === 7 && day === 1) || (month === 1 && day === 1);

  if (!isReminder && !isOverdue) return;

  let periode;
  let deadline;

  if (isReminder) {
    periode = getSemesterPeriod(month, year);
    deadline = month === 6 ? '30 juin' : '31 décembre';
  } else {
    // Pour le 1er juillet → vérifier S1 de l'année en cours
    // Pour le 1er janvier → vérifier S2 de l'année précédente
    if (month === 7) periode = `S1 ${year}`;
    else periode = `S2 ${year - 1}`;
  }

  try {
    const chefs = await getChefsWithoutSubmission(periode);

    if (chefs.length === 0) {
      console.log(`[Reminder] Tous les chefs ont soumis pour ${periode}.`);
      return;
    }

    console.log(`[Reminder] ${chefs.length} chef(s) sans soumission pour ${periode}. Envoi des emails...`);

    for (const chef of chefs) {
      try {
        if (isReminder) {
          await sendReminderEmail({
            chefNom: chef.nom,
            projetNom: chef.project?.nom ?? 'votre projet',
            deadline,
            chefEmail: chef.email
          });
          console.log(`[Reminder] Email rappel envoyé à ${chef.email}`);
        } else {
          await sendOverdueEmail({
            chefNom: chef.nom,
            projetNom: chef.project?.nom ?? 'votre projet',
            chefEmail: chef.email
          });
          console.log(`[Reminder] Email deadline dépassée envoyé à ${chef.email}`);
        }
      } catch (err) {
        console.error(`[Reminder] Échec envoi email à ${chef.email}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[Reminder] Erreur lors de la vérification des soumissions:', err.message);
  }
};

// Déclenché tous les jours à 8h00 (heure de Tunis)
cron.schedule('0 8 * * *', checkAndSendEmails, {
  timezone: 'Africa/Tunis'
});

console.log('[Reminder] Cron job démarré — vérification quotidienne à 08:00 (Tunis)');

module.exports = { checkAndSendEmails };
