export interface ReportTab1 {
  numero: string;
  intitule: string;
  acronyme: string;
  chefNomPrenom: string;
  laboratoire: string;
  reseauxSociaux: string;
}

export interface ReportTab2Row {
  id: string;
  objectifSpecifique: string;
  resultatsAttendus: string;
  activites: string;
  livrables: string;
}

export interface ReportTab3Row {
  id: string;
  objectifSpecifique: string;
  activitePrevue: string;
  tachesRealisees: string;
  etat: "En cours de préparation" | "En cours de mise en œuvre" | "Clôturée";
  avancement: number;
}

export interface ReportTab4Row {
  id: string;
  livrable: string;
  description: string;
  type: string;
  statut: "Terminé" | "En cours" | "En retard";
  dissemination: "Public" | "Accès limité" | "Consortium du projet";
}

export interface ReportTab5Row {
  id: string;
  intitule: string;
  objectifs: string;
  activiteCadre: string;
  date: string;
  lieu: string;
  publicCible: string;
  nombreParticipants: number;
}

export interface ReportTab6Row {
  id: string;
  action: string;
  activiteConcernee: string;
  cible: string;
}

export interface ReportTab7Row {
  id: string;
  date: string;
  lieu: string;
  objet: string;
  partenaires: string;
}

export interface ReportTab8Row {
  id: string;
  nomPrenom: string;
  genre: "Homme" | "Femme";
  typePersonnel: "Docteur" | "Doctorant" | "Étudiant en master" | "Personnel d'appui";
  partenaire: string;
}

export interface ReportTab9Row {
  id: string;
  equipement: string;
  type: "Équipement informatique" | "Équipement scientifique";
  laboratoire: string;
}

export interface Report {
  id: string;
  projectId: string;
  dateSoumission: string;
  periodeCouvert: string;
  statut: "En attente" | "Approuvé" | "Rejeté";
  raisonRejet?: string;
  tab1: ReportTab1;
  tab2: ReportTab2Row[];
  tab3: ReportTab3Row[];
  tab4: ReportTab4Row[];
  tab5: ReportTab5Row[];
  tab6: ReportTab6Row[];
  tab7: ReportTab7Row[];
  tab8: ReportTab8Row[];
  tab9: ReportTab9Row[];
}

export interface Project {
  id: string;
  nom: string;
  chefNom: string;
  chefEmail: string;
  budget: number;
  depenses: number;
  statut: "Actif" | "En pause" | "Terminé";
  jalonsTotal: number;
  jalonsCompletes: number;
  categorie: string;
  dateDebut: string;
}

const uid = (i: number) => `p${String(i).padStart(2, "0")}`;
const rid = (pi: number, ri: number) => `r${String(pi).padStart(2, "0")}-${ri}`;

const categories = [
  "Reforestation", "Énergie renouvelable", "Eau & Assainissement", "Agriculture",
  "Biodiversité", "Transport", "Déchets", "Éducation",
  "Pêche", "Reforestation", "Économie circulaire", "Agriculture urbaine",
  "Déchets", "Tourisme", "Biodiversité", "Conservation"
];

const projectNames = [
  "Reforestation du Nord", "Énergie solaire rurale", "Eau potable Kasserine",
  "Agriculture durable Béja", "Protection des zones humides", "Mobilité verte Tunis",
  "Compostage communautaire", "Éducation environnementale", "Pêche durable Sfax",
  "Reboisement Jendouba", "Économie circulaire Sousse", "Jardins urbains Bizerte",
  "Gestion des déchets Gafsa", "Tourisme écologique Tozeur", "Apiculture durable Siliana",
  "Conservation des sols Médenine"
];

const chefNames = [
  "Amine Ben Salah", "Sarra Khelifi", "Mohamed Trabelsi", "Fatma Gharbi",
  "Youssef Mejri", "Leila Bouazizi", "Karim Daoud", "Nadia Hammami",
  "Riadh Jelassi", "Samia Chahed", "Oussama Ferchichi", "Hana Mrad",
  "Bilel Sassi", "Ines Louati", "Walid Riahi", "Mariem Bouzid"
];

const statuts: ("Actif" | "En pause" | "Terminé")[] = [
  "Actif","Actif","Actif","Actif","Actif","Actif","Actif","Actif","Actif","Actif",
  "En pause","En pause","En pause","Terminé","Terminé","Terminé"
];

export const projects: Project[] = projectNames.map((nom, i) => ({
  id: uid(i),
  nom,
  chefNom: chefNames[i],
  chefEmail: i === 0 ? "chef@greenimpact.tn" : `chef${i}@greenimpact.tn`,
  budget: 100000 + Math.round(Math.random() * 200000),
  depenses: 40000 + Math.round(Math.random() * 120000),
  statut: statuts[i],
  jalonsTotal: 8 + Math.floor(Math.random() * 5),
  jalonsCompletes: 2 + Math.floor(Math.random() * 7),
  categorie: categories[i],
  dateDebut: `2024-0${1 + (i % 9)}-15`,
}));

// Fix jalonsCompletes to not exceed total
projects.forEach(p => { if (p.jalonsCompletes > p.jalonsTotal) p.jalonsCompletes = p.jalonsTotal; });

function makeReport(pi: number, ri: number, statut: Report["statut"]): Report {
  const p = projects[pi];
  return {
    id: rid(pi, ri),
    projectId: p.id,
    dateSoumission: `2025-${String(1 + ri * 6).padStart(2, "0")}-15`,
    periodeCouvert: ri === 0 ? "Janvier – Juin 2025" : "Juillet – Décembre 2025",
    statut,
    raisonRejet: statut === "Rejeté" ? "Données budgétaires incomplètes, veuillez compléter le tableau des dépenses." : undefined,
    tab1: {
      numero: `PRJ-${String(pi + 1).padStart(3, "0")}`,
      intitule: p.nom,
      acronyme: p.nom.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 5),
      chefNomPrenom: p.chefNom,
      laboratoire: `Lab ${categories[pi]} - L${categories[pi].slice(0, 3).toUpperCase()}`,
      reseauxSociaux: `https://facebook.com/greenimpact-${p.id}\nhttps://linkedin.com/company/greenimpact-${p.id}`,
    },
    tab2: [
      { id: "1", objectifSpecifique: "OS1: Renforcer les capacités locales", resultatsAttendus: "Formation de 50 agents locaux", activites: "Ateliers de formation, sessions pratiques", livrables: "Rapport de formation, certificats" },
      { id: "2", objectifSpecifique: "OS2: Mise en œuvre des actions terrain", resultatsAttendus: "3 sites pilotes opérationnels", activites: "Installation, suivi technique", livrables: "Rapports techniques, photos terrain" },
    ],
    tab3: [
      { id: "1", objectifSpecifique: "OS1", activitePrevue: "Formation des agents communaux", tachesRealisees: "2 ateliers réalisés avec 25 participants chacun", etat: "Clôturée", avancement: 100 },
      { id: "2", objectifSpecifique: "OS1", activitePrevue: "Étude de diagnostic territorial", tachesRealisees: "Collecte de données en cours sur 4 communes", etat: "En cours de mise en œuvre", avancement: 65 },
      { id: "3", objectifSpecifique: "OS2", activitePrevue: "Installation des sites pilotes", tachesRealisees: "Préparation des cahiers des charges", etat: "En cours de préparation", avancement: 20 },
    ],
    tab4: [
      { id: "1", livrable: "Rapport de diagnostic", description: "Analyse complète de la situation environnementale locale", type: "Études", statut: "Terminé", dissemination: "Public" },
      { id: "2", livrable: "Base de données SIG", description: "Cartographie des zones d'intervention", type: "Logiciels ou bases de données", statut: "En cours", dissemination: "Consortium du projet" },
    ],
    tab5: [
      { id: "1", intitule: "Atelier de lancement", objectifs: "Présenter le projet aux parties prenantes", activiteCadre: "OS1 - A1", date: "2025-02-10", lieu: "Tunis", publicCible: "Partenaires institutionnels", nombreParticipants: 42 },
    ],
    tab6: [
      { id: "1", action: "Publication article dans journal local", activiteConcernee: "OS1 - Communication", cible: "Grand public" },
      { id: "2", action: "Post réseaux sociaux (série de 5)", activiteConcernee: "OS2 - Sensibilisation", cible: "Jeunes 18-35 ans" },
    ],
    tab7: [
      { id: "1", date: "2025-01-20", lieu: "Siège Green Impact, Tunis", objet: "Réunion de démarrage du projet", partenaires: "ANPE, CRDA, Université de Tunis" },
      { id: "2", date: "2025-04-15", lieu: "En ligne (Zoom)", objet: "Suivi trimestriel des activités", partenaires: "Tous les partenaires" },
    ],
    tab8: [
      { id: "1", nomPrenom: "Ahmed Mansouri", genre: "Homme", typePersonnel: "Doctorant", partenaire: "Université de Tunis El Manar" },
      { id: "2", nomPrenom: "Sara Boukhris", genre: "Femme", typePersonnel: "Étudiant en master", partenaire: "INAT" },
    ],
    tab9: [
      { id: "1", equipement: "Station météorologique portable", type: "Équipement scientifique", laboratoire: `Lab ${categories[pi]}` },
      { id: "2", equipement: "Ordinateur portable Dell Latitude", type: "Équipement informatique", laboratoire: `Lab ${categories[pi]}` },
    ],
  };
}

// Generate reports: first 5 projects have pending, others have approved/rejected mix
export const reports: Report[] = [
  ...projects.slice(0, 5).map((_, i) => makeReport(i, 0, "En attente")),
  ...projects.slice(0, 5).map((_, i) => makeReport(i, 1, "En attente")), // extra pending
  ...projects.slice(5, 10).map((_, i) => makeReport(i + 5, 0, "Approuvé")),
  ...projects.slice(10, 13).map((_, i) => makeReport(i + 10, 0, "Rejeté")),
  ...projects.slice(13, 16).map((_, i) => makeReport(i + 13, 0, "Approuvé")),
];

// Remove duplicate pending - keep only 1 per project for first 5
export const initialReports: Report[] = [
  ...projects.slice(0, 5).map((_, i) => makeReport(i, 0, "En attente")),
  ...projects.slice(5, 10).map((_, i) => makeReport(i + 5, 0, "Approuvé")),
  ...projects.slice(10, 13).map((_, i) => makeReport(i + 10, 0, "Rejeté")),
  ...projects.slice(13, 16).map((_, i) => makeReport(i + 13, 0, "Approuvé")),
];

export interface AppUser {
  email: string;
  password: string;
  role: "chef" | "admin";
  name: string;
  projectId: string | null;
  createdAt: string;
}

export const users: AppUser[] = [
  { email: "admin@greenimpact.tn", password: "admin123", role: "admin", name: "Dorra Mansour", projectId: null, createdAt: "2024-01-01" },
  ...projects.map((p, i) => ({
    email: p.chefEmail,
    password: i === 0 ? "chef123" : `chef${i}123`,
    role: "chef" as const,
    name: p.chefNom,
    projectId: p.id,
    createdAt: `2024-0${1 + (i % 9)}-10`,
  })),
];
