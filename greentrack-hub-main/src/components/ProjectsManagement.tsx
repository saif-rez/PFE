import React, { useState } from "react";
import { useProjects } from "@/contexts/ProjectsContext";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { FolderPlus, Trash2, AlertTriangle, Pencil } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const CATEGORIES = [
  "Agriculture", "Biodiversité", "Déchets", "Eau & Assainissement",
  "Économie verte", "Éducation", "Énergie", "Environnement",
  "Mobilité", "Pêche", "Tourisme", "Urbanisme",
];

const ProjectsManagement: React.FC = () => {
  const { projects, refresh } = useProjects();
  const { allUsers } = useAuth();
  const chefUsers = allUsers.filter(u => u.role === "chef_projet");

  // ── Create form ──────────────────────────────────────────────────────────
  const [projOpen, setProjOpen]           = useState(false);
  const [projNom, setProjNom]             = useState("");
  const [projAcronyme, setProjAcronyme]   = useState("");
  const [projCategorie, setProjCategorie] = useState("");
  const [projLaboratoire, setProjLaboratoire] = useState("");
  const [projBudget, setProjBudget]       = useState("");
  const [projDateDebut, setProjDateDebut] = useState("");
  const [projLoading, setProjLoading]     = useState(false);

  // ── Edit form ────────────────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<{
    id: number; nom: string; acronyme: string; categorie: string; laboratoire: string;
    budget: number; depenses: number; dateDebut: string;
  } | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // ── Delete confirmation ──────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; nom: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const resetForm = () => {
    setProjNom(""); setProjAcronyme(""); setProjCategorie(""); setProjLaboratoire("");
    setProjBudget(""); setProjDateDebut("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projNom.trim() || !projAcronyme.trim() || !projCategorie || !projLaboratoire.trim()) return;
    setProjLoading(true);
    try {
      await api.post("/api/projects", {
        nom: projNom.trim(),
        acronyme: projAcronyme.trim(),
        categorie: projCategorie,
        laboratoire: projLaboratoire.trim(),
        budget: projBudget ? Number(projBudget) : 0,
        date_debut: projDateDebut || null,
      });
      await refresh();
      toast.success(`Projet "${projNom.trim()}" créé avec succès`);
      resetForm();
      setProjOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Erreur lors de la création.");
    } finally {
      setProjLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditLoading(true);
    try {
      await api.put(`/api/projects/${editTarget.id}`, {
        nom: editTarget.nom,
        acronyme: editTarget.acronyme,
        categorie: editTarget.categorie,
        laboratoire: editTarget.laboratoire,
        budget: editTarget.budget,
        depenses: editTarget.depenses,
        date_debut: editTarget.dateDebut || null,
      });
      await refresh();
      toast.success("Projet mis à jour avec succès");
      setEditTarget(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Erreur lors de la modification.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/api/projects/${deleteTarget.id}`);
      await refresh();
      toast.success(`Projet "${deleteTarget.nom}" supprimé`);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Erreur lors de la suppression.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      {/* Dialog edit */}
      <Dialog open={!!editTarget} onOpenChange={open => { if (!open) setEditTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}>
              Modifier le projet
            </DialogTitle>
          </DialogHeader>
          {editTarget && (
            <form onSubmit={handleEdit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Nom du projet *</Label>
                <Input value={editTarget.nom} onChange={e => setEditTarget(t => t && ({ ...t, nom: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>ID *</Label>
                <Input value={editTarget.acronyme} onChange={e => setEditTarget(t => t && ({ ...t, acronyme: e.target.value }))} required maxLength={10} />
              </div>
              <div className="space-y-2">
                <Label>Thématique *</Label>
                <Select value={editTarget.categorie} onValueChange={v => setEditTarget(t => t && ({ ...t, categorie: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Coordinateur *</Label>
                <Input value={editTarget.laboratoire} onChange={e => setEditTarget(t => t && ({ ...t, laboratoire: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Budget (TND)</Label>
                  <Input
                    type="number" min={0} step="0.01"
                    value={editTarget.budget}
                    onChange={e => setEditTarget(t => t && ({ ...t, budget: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dépenses (TND)</Label>
                  <Input
                    type="number" min={0} step="0.01"
                    value={editTarget.depenses}
                    onChange={e => setEditTarget(t => t && ({ ...t, depenses: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Date de début</Label>
                <Input
                  type="date"
                  value={editTarget.dateDebut}
                  onChange={e => setEditTarget(t => t && ({ ...t, dateDebut: e.target.value }))}
                />
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setEditTarget(null)} disabled={editLoading}>Annuler</Button>
                <Button type="submit" disabled={editLoading}>{editLoading ? "Enregistrement…" : "Enregistrer"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog delete */}
      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> Confirmer la suppression
            </DialogTitle>
            <DialogDescription className="pt-2">
              Vous êtes sur le point de supprimer le projet{" "}
              <span className="font-semibold text-foreground">{deleteTarget?.nom}</span>.
              <br />
              Toutes les soumissions associées seront également supprimées. Cette action est{" "}
              <span className="font-semibold">irréversible</span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading} className="gap-1.5">
              <Trash2 className="w-4 h-4" />
              {deleteLoading ? "Suppression…" : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main card */}
      <div className="bg-card rounded-lg border shadow-sm">
        <div className="p-5 border-b flex flex-wrap gap-3 items-center justify-between">
          <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}>
            Projets enregistrés
            <span className="ml-2 text-sm font-normal text-muted-foreground">({projects.length})</span>
          </h3>
          <Dialog open={projOpen} onOpenChange={setProjOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FolderPlus className="w-4 h-4" /> Nouveau projet
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}>
                  Créer un nouveau projet
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="projNom">Nom du projet *</Label>
                  <Input id="projNom" value={projNom} onChange={e => setProjNom(e.target.value)} required placeholder="Ex: Reforestation du Sud" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projAcronyme">ID *</Label>
                  <Input id="projAcronyme" value={projAcronyme} onChange={e => setProjAcronyme(e.target.value)} required placeholder="Ex: RS" maxLength={10} />
                </div>
                <div className="space-y-2">
                  <Label>Thématique *</Label>
                  <Select value={projCategorie} onValueChange={setProjCategorie}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner une catégorie" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projLab">Coordinateur *</Label>
                  <Input id="projLab" value={projLaboratoire} onChange={e => setProjLaboratoire(e.target.value)} required placeholder="Ex: Prof. Ahmed Ben Ali" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projBudget">Budget (TND)</Label>
                  <Input
                    id="projBudget" type="number" min={0} step="0.01"
                    value={projBudget} onChange={e => setProjBudget(e.target.value)}
                    placeholder="Ex: 150000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projDateDebut">Date de début</Label>
                  <Input
                    id="projDateDebut" type="date"
                    value={projDateDebut} onChange={e => setProjDateDebut(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={projLoading}>
                  {projLoading ? "Création…" : "Créer le projet"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-5 py-3 font-medium text-muted-foreground">Nom</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">ID</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">Thématique</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">Chef assigné</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => {
                const chef = chefUsers.find(u => u.projet_id === Number(p.id));
                return (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-medium">{p.nom}</td>
                    <td className="px-5 py-3 text-muted-foreground">{p.acronyme}</td>
                    <td className="px-5 py-3 text-muted-foreground">{p.categorie}</td>
                    <td className="px-5 py-3">
                      {chef ? chef.nom : <span className="text-xs text-warning italic">Non assigné</span>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost" size="sm" className="gap-1"
                          onClick={() => setEditTarget({
                            id: Number(p.id), nom: p.nom, acronyme: p.acronyme,
                            categorie: p.categorie, laboratoire: p.laboratoire,
                            budget: p.budget, depenses: p.depenses, dateDebut: p.dateDebut,
                          })}
                        >
                          <Pencil className="w-4 h-4" /> Modifier
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => setDeleteTarget({ id: Number(p.id), nom: p.nom })}
                          className="text-destructive hover:text-destructive gap-1"
                        >
                          <Trash2 className="w-4 h-4" /> Supprimer
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {projects.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">Aucun projet enregistré.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ProjectsManagement;
