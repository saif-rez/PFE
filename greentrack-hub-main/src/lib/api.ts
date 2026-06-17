import axios from 'axios';
import type { Report, ReportTab1 } from '@/data/mockData';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Status mapping ────────────────────────────────────────────────────────

export const STATUS_TO_FRONTEND: Record<string, Report['statut']> = {
  en_attente: 'En attente',
  approuve: 'Approuvé',
  rejete: 'Rejeté',
};

// ─── Submission → Report mapper ────────────────────────────────────────────

const defaultTab1: ReportTab1 = {
  numero: '', intitule: '', acronyme: '', chefNomPrenom: '', laboratoire: '', reseauxSociaux: '',
};

export const mapSubmission = (s: any): Report => ({
  id: String(s.id),
  projectId: String(s.projet_id),
  dateSoumission: s.date_soumission ? String(s.date_soumission).split('T')[0] : '',
  periodeCouvert: s.periode || '',
  statut: STATUS_TO_FRONTEND[s.statut] ?? 'En attente',
  raisonRejet: s.commentaire_rejet || undefined,
  tab1: s.rapport_data?.tab1 ?? defaultTab1,
  tab2: s.rapport_data?.tab2 ?? [],
  tab3: s.rapport_data?.tab3 ?? [],
  tab4: s.rapport_data?.tab4 ?? [],
  tab5: s.rapport_data?.tab5 ?? [],
  tab6: s.rapport_data?.tab6 ?? [],
  tab7: s.rapport_data?.tab7 ?? [],
  tab8: s.rapport_data?.tab8 ?? [],
  tab9: s.rapport_data?.tab9 ?? [],
});

// ─── Project mapper ────────────────────────────────────────────────────────

export const mapProject = (p: any) => ({
  id: String(p.id),
  nom: p.nom || '',
  acronyme: p.acronyme || '',
  chefNom: p.chef_nom || '',
  chefEmail: p.chef_email || '',
  budget: Number(p.budget) || 0,
  depenses: Number(p.depenses) || 0,
  statut: (p.statut || 'Actif') as 'Actif' | 'En pause' | 'Terminé',
  jalonsTotal: p.jalons_total || 0,
  jalonsCompletes: p.jalons_completes || 0,
  categorie: p.categorie || '',
  dateDebut: p.date_debut ? String(p.date_debut).split('T')[0] : '',
  laboratoire: p.laboratoire || '',
});

export type MappedProject = ReturnType<typeof mapProject>;

export default api;
