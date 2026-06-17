const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create projects
  const projects = await Promise.all([
    prisma.project.upsert({ where: { id: 1 }, update: {}, create: { nom: 'Reforestation du Nord', acronyme: 'REFOR-N', categorie: 'Environnement', budget: 150000, statut: 'Actif', date_debut: new Date('2023-01-15'), laboratoire: 'LESTE' } }),
    prisma.project.upsert({ where: { id: 2 }, update: {}, create: { nom: 'Énergie solaire rurale', acronyme: 'ESR', categorie: 'Énergie', budget: 200000, statut: 'Actif', date_debut: new Date('2023-03-01'), laboratoire: 'LEEI' } }),
    prisma.project.upsert({ where: { id: 3 }, update: {}, create: { nom: 'Eau potable Kasserine', acronyme: 'EPK', categorie: 'Eau', budget: 180000, statut: 'Terminé', date_debut: new Date('2022-06-01'), laboratoire: 'LRHYA' } }),
    prisma.project.upsert({ where: { id: 4 }, update: {}, create: { nom: 'Agriculture durable Béja', acronyme: 'ADB', categorie: 'Agriculture', budget: 130000, statut: 'Actif', date_debut: new Date('2023-09-01'), laboratoire: 'INRAT' } }),
    prisma.project.upsert({ where: { id: 5 }, update: {}, create: { nom: 'Protection des zones humides', acronyme: 'PZH', categorie: 'Biodiversité', budget: 90000, statut: 'En pause', date_debut: new Date('2023-02-01'), laboratoire: 'LEBE' } }),
    prisma.project.upsert({ where: { id: 6 }, update: {}, create: { nom: 'Mobilité verte Tunis', acronyme: 'MVT', categorie: 'Transport', budget: 220000, statut: 'Actif', date_debut: new Date('2023-05-01'), laboratoire: 'LTSM' } }),
    prisma.project.upsert({ where: { id: 7 }, update: {}, create: { nom: 'Compostage communautaire', acronyme: 'COMP', categorie: 'Déchets', budget: 75000, statut: 'Actif', date_debut: new Date('2023-04-01'), laboratoire: 'LEDE' } }),
    prisma.project.upsert({ where: { id: 8 }, update: {}, create: { nom: 'Éducation environnementale', acronyme: 'EDENV', categorie: 'Éducation', budget: 60000, statut: 'Actif', date_debut: new Date('2023-07-01'), laboratoire: 'ISEFC' } }),
    prisma.project.upsert({ where: { id: 9 }, update: {}, create: { nom: 'Pêche durable Sfax', acronyme: 'PDS', categorie: 'Marine', budget: 160000, statut: 'Actif', date_debut: new Date('2022-09-01'), laboratoire: 'INSTM' } }),
    prisma.project.upsert({ where: { id: 10 }, update: {}, create: { nom: 'Reboisement Jendouba', acronyme: 'REBJ', categorie: 'Forêt', budget: 95000, statut: 'Actif', date_debut: new Date('2023-06-01'), laboratoire: 'LESTE' } }),
    prisma.project.upsert({ where: { id: 11 }, update: {}, create: { nom: 'Économie circulaire Sousse', acronyme: 'ECS', categorie: 'Industrie', budget: 140000, statut: 'En pause', date_debut: new Date('2023-01-01'), laboratoire: 'LETI' } }),
    prisma.project.upsert({ where: { id: 12 }, update: {}, create: { nom: 'Jardins urbains Bizerte', acronyme: 'JUB', categorie: 'Agriculture', budget: 55000, statut: 'Actif', date_debut: new Date('2023-08-01'), laboratoire: 'INAT' } }),
    prisma.project.upsert({ where: { id: 13 }, update: {}, create: { nom: 'Gestion des déchets Gafsa', acronyme: 'GDG', categorie: 'Déchets', budget: 110000, statut: 'Terminé', date_debut: new Date('2022-03-01'), laboratoire: 'CERTE' } }),
    prisma.project.upsert({ where: { id: 14 }, update: {}, create: { nom: 'Tourisme écologique Tozeur', acronyme: 'TET', categorie: 'Tourisme', budget: 85000, statut: 'Actif', date_debut: new Date('2023-10-01'), laboratoire: 'IHEC' } }),
    prisma.project.upsert({ where: { id: 15 }, update: {}, create: { nom: 'Apiculture durable Siliana', acronyme: 'APS', categorie: 'Agriculture', budget: 70000, statut: 'Actif', date_debut: new Date('2023-11-01'), laboratoire: 'IRESA' } }),
    prisma.project.upsert({ where: { id: 16 }, update: {}, create: { nom: 'Conservation des sols Médenine', acronyme: 'CSM', categorie: 'Sol', budget: 120000, statut: 'Terminé', date_debut: new Date('2022-01-01'), laboratoire: 'IRA' } }),
  ]);

  console.log(`${projects.length} projects seeded.`);

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const chefPassword = await bcrypt.hash('chef123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@greenimpact.tn' },
    update: {},
    create: { nom: 'Sonia Trabelsi', email: 'admin@greenimpact.tn', password: adminPassword, role: 'admin' }
  });

  const chef = await prisma.user.upsert({
    where: { email: 'chef@greenimpact.tn' },
    update: {},
    create: { nom: 'Ahmed Ben Ali', email: 'chef@greenimpact.tn', password: chefPassword, role: 'chef_projet', projet_id: 1 }
  });

  console.log(`Users seeded: ${admin.email}, ${chef.email}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
