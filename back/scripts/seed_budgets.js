/**
 * Seed aléatoire des budgets et dépenses pour les 16 projets.
 * Contrainte : budget total ≤ 10 000 000 DT
 * Dépenses : entre 20% et 85% du budget alloué par projet.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
    select: { id: true, nom: true },
    orderBy: { id: 'asc' },
  });

  const n = projects.length;
  const TOTAL_MAX = 10_000_000;

  // ── Génère des parts aléatoires qui somment à 1 ──────────────────────────
  // Méthode : tirage exponentiel normalisé (donne une bonne dispersion)
  const raw = Array.from({ length: n }, () => -Math.log(Math.random()));
  const sum = raw.reduce((a, b) => a + b, 0);
  const shares = raw.map(v => v / sum);

  // ── Applique une variation ±15% autour de la part moyenne ────────────────
  // puis arrondi à 1 000 DT près
  const budgets = shares.map(s => Math.round((s * TOTAL_MAX) / 1000) * 1000);

  // Ajustement si l'arrondi fait dépasser le total
  let totalBudget = budgets.reduce((a, b) => a + b, 0);
  let diff = totalBudget - TOTAL_MAX;
  // Corrige sur les projets les plus grands jusqu'à être dans les limites
  let i = 0;
  while (Math.abs(diff) >= 1000 && i < n) {
    const adj = Math.min(Math.abs(diff), 1000) * Math.sign(diff);
    budgets[i] -= adj;
    diff -= adj;
    i = (i + 1) % n;
  }

  console.log('\nBudgets générés :');
  console.log('─'.repeat(60));

  const updates = [];
  for (let j = 0; j < n; j++) {
    const budget = budgets[j];
    // Dépenses : entre 20% et 85% du budget
    const minPct = 0.20;
    const maxPct = 0.85;
    const pct = minPct + Math.random() * (maxPct - minPct);
    const depenses = Math.round((budget * pct) / 500) * 500; // arrondi 500 DT

    console.log(
      `  [${String(projects[j].id).padStart(2)}] ${projects[j].nom.slice(0, 35).padEnd(35)} ` +
      `Budget: ${(budget / 1000).toFixed(0).padStart(5)} k DT   ` +
      `Dépenses: ${(depenses / 1000).toFixed(1).padStart(6)} k DT ` +
      `(${Math.round((depenses / budget) * 100)}%)`
    );

    updates.push(
      prisma.project.update({
        where: { id: projects[j].id },
        data: { budget, depenses },
      })
    );
  }

  const totalBudgetFinal = budgets.reduce((a, b) => a + b, 0);
  console.log('─'.repeat(60));
  console.log(`  TOTAL budget : ${(totalBudgetFinal / 1_000_000).toFixed(3)} M DT`);
  console.log('');

  await prisma.$transaction(updates);
  console.log(`[OK] ${n} projets mis à jour avec succès.`);
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
