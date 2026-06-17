const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      nom: true,
      jalons_total: true,
      jalons_completes: true,
      budget: true,
      depenses: true,
      date_debut: true,
    },
    take: 6,
  });
  console.table(projects.map(p => ({
    id: p.id,
    nom: p.nom.slice(0, 30),
    jalons_total: p.jalons_total,
    jalons_completes: p.jalons_completes,
    budget: Number(p.budget),
    depenses: Number(p.depenses),
    date_debut: p.date_debut,
  })));
  await prisma.$disconnect();
}

main();
