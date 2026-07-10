# 🌿 Green Impact Platform

> Plateforme Web Full-Stack de Centralisation et de Suivi des Projets
> de Recherche Environnementale avec Agent IA de Prédiction

![React](https://img.shields.io/badge/React-TypeScript-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-purple)
![Python](https://img.shields.io/badge/Python-scikit--learn-orange)
![Flask](https://img.shields.io/badge/Flask-API-red)

---

## 📋 Description

**Green Impact Platform** est une application web développée pour l'ONG
tunisienne **Green Impact** qui supervise 16 projets de recherche
environnementale répartis sur tout le territoire tunisien.

La plateforme digitalise entièrement le processus de collecte et de
validation des rapports semestriels de suivi de projet, remplaçant
les fichiers Excel dispersés par une solution centralisée, sécurisée
et intelligente.

---

## ✨ Fonctionnalités principales

### 👤 Administrateur
- Créer et gérer les comptes chefs de projet
- Consulter les 16 projets et leurs rapports
- Approuver ou rejeter les rapports soumis (avec motif obligatoire)
- Tableau de bord BI global (4 graphiques Recharts)
- Consulter les prédictions IA par projet
- Exports PDF/Excel (tableau projets, dashboard BI, rapports)

### 👨‍💼 Chef de Projet
- Remplir le rapport semestriel en 9 onglets interactifs
- Auto-save toutes les 30 secondes
- Suivre le statut de ses soumissions (en attente / approuvé / rejeté)
- Corriger et resoumettre un rapport rejeté
- Dashboard BI personnel (3 graphiques filtrés)
- Exports PDF/Excel (rapport individuel, statistiques BI)

### 🤖 Agent IA
- Prédiction de l'avancement dans 6 mois
- Détection du risque de retard (OUI/NON)
- Score de risque de 0 à 1
- 3 modèles Random Forest entraînés sur 4200 observations

### 📧 Automatisation
- Email automatique à l'admin lors de chaque soumission
- Email au chef lors de l'approbation ou du rejet
- Rappel automatique chaque lundi (node-cron)

---

## 🛠️ Stack Technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React · TypeScript · Next.js · Tailwind CSS |
| Graphiques | Recharts · Lucide React |
| Export PDF | jsPDF · html2canvas |
| Backend | Node.js · Express.js · Prisma ORM |
| Authentification | JWT · bcryptjs |
| Base de données | PostgreSQL · Supabase |
| Agent IA | Python · scikit-learn · Flask · joblib |
| ETL | Talend (pipeline 9 étapes) |
| Emails | Nodemailer · node-cron |
| Déploiement | Vercel (frontend) · Railway (backend + IA) |

---

## 🗄️ Base de données

4 tables PostgreSQL :

```
projects    → 16 projets de recherche
users       → Administrateurs et Chefs de projet
submissions → Rapports semestriels (rapport_data JSON 9 onglets)
comments    → Commentaires de rejet
```

---

## 🤖 Agent IA — Détails

- **Dataset** : 4200 lignes × 38 colonnes (Synthetic Data Generation)
- **Pipeline ETL** : Talend (9 étapes : Extract → Transform → Load)
- **Algorithme** : Random Forest (scikit-learn)
- **Modèle 1** : Régression — avancement prédit S+1 → R² = 0.92
- **Modèle 2** : Classification — en retard OUI/NON → Accuracy = 93%
- **Modèle 3** : Régression — score de risque 0-1 → R² = 0.91
- **API** : Flask (port 5001) appelée par Node.js via axios

### 8 Features d'entrée
```
avancement_actuel_pct       · avancement_prevu_pct
ecart_avancement_pct        · budget_consomme_pct
taux_completion_jalons_pct  · velocity_score
ratio_avancement_budget     · semestre_normalise
```

---

## 🚀 Installation et lancement

### Prérequis
- Node.js >= 18
- Python >= 3.9
- PostgreSQL (ou compte Supabase)

### Frontend
```bash
cd green-impact-frontend
npm install
npm run dev
```

### Backend
```bash
cd green-impact-backend
npm install
npx prisma migrate dev
npm run dev
```

### Agent IA
```bash
cd green-impact-ai
pip install pandas scikit-learn flask flask-cors joblib openpyxl
python train_model.py    # entraîner les 3 modèles
python predict_api.py    # lancer l'API Flask sur port 5001
```

---

## 🔐 Variables d'environnement

### Backend (.env)
```env
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret
FLASK_URL=http://localhost:5001
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
```

---

## 📁 Structure du projet

```
green-impact-platform/
│
├── green-impact-frontend/       # React + TypeScript
│   ├── src/
│   │   ├── pages/              # Login · Dashboard Admin · Dashboard Chef
│   │   ├── components/         # Formulaire 9 onglets · Graphiques · PDF
│   │   └── services/           # Appels API
│
├── green-impact-backend/        # Node.js + Express
│   ├── controllers/            # auth · projects · submissions · predictions
│   ├── routes/                 # auth · projects · submissions · predictions
│   ├── middleware/             # auth.js · isAdmin.js · errorHandler.js
│   ├── services/               # email.service.js
│   └── prisma/                 # schema.prisma
│
└── green-impact-ai/             # Python
    ├── train_model.py           # Entraînement des 3 modèles Random Forest
    ├── predict_api.py           # API Flask de prédiction (port 5001)
    ├── model_avancement.pkl     # Modèle régression avancement
    ├── model_retard.pkl         # Modèle classification retard
    └── model_risque.pkl         # Modèle régression risque
```

---

## 📊 Workflow d'approbation

```
Chef soumet rapport
        ↓
Statut : EN ATTENTE 🟡
        ↓
Admin consulte les 9 onglets
        ↓
    ┌───┴───┐
Approuve ✅  Rejette ❌
    ↓           ↓
APPROUVÉ     REJETÉ + motif
    ↓           ↓
Email chef   Email chef
visible BI   Chef corrige
             et resoumet
```

---

## 🔮 Prédictions IA — Exemple

```json
{
  "projet": "Reforestation du Nord",
  "avancement_predit": 61.2,
  "en_retard": true,
  "risque_retard": 0.62,
  "finira_a_temps": false,
  "message": "Ce projet aura 61.2% dans 6 mois",
  "alerte": "⚠️ Intervention recommandée"
}
```

---

## 📧 Automatisation des emails

| Déclencheur | Destinataire | Type |
|-------------|--------------|------|
| Chef soumet un rapport | Administrateur | Alerte nouvelle soumission |
| Admin approuve | Chef de projet | Confirmation ✅ |
| Admin rejette | Chef de projet | Motif de rejet ❌ |
| Chaque lundi 08h00 (node-cron) | Chefs sans soumission | Rappel ⚠️ |

---

## 👨‍🎓 Contexte académique

- **Type** : Projet de Fin d'Études (PFE)
- **Niveau** : Licence Génie Logiciel
- **Organisme** : Green Impact ONG — Tunisie
- **Année** : 2024/2025

---

## 📄 Licence

Ce projet est développé dans le cadre d'un PFE académique.  
© 2024/2025 — Green Impact ONG Tunisie
