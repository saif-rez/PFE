import React, { useState, useMemo } from "react";
import { useProjects } from "@/contexts/ProjectsContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { UserPlus, Trash2, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const generatePassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const UserManagement: React.FC = () => {
  const { allUsers, addUser, removeUser } = useAuth();
  const { projects } = useProjects();

  // ── Chef form state ──────────────────────────────────────────────────────
  const [chefOpen, setChefOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedProject, setSelectedProject] = useState("");

  // ── Delete confirmation state ────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; nom: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const chefUsers = allUsers.filter(u => u.role === "chef_projet");
  const assignedProjectIds = new Set(chefUsers.map(u => u.projet_id).filter(Boolean));

  const availableProjects = useMemo(
    () => projects.filter(p => !assignedProjectIds.has(Number(p.id))),
    [projects, chefUsers.length]
  );

  // ── Chef handlers ────────────────────────────────────────────────────────
  const resetChefForm = () => { setName(""); setEmail(""); setPassword(""); setSelectedProject(""); };

  const handleChefSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;
    try {
      await addUser({
        nom: name.trim(),
        email: email.trim(),
        password: password.trim(),
        projet_id: selectedProject ? Number(selectedProject) : null,
      });
      toast.success("Compte créé avec succès");
      resetChefForm();
      setChefOpen(false);
    } catch {
      toast.error("Erreur lors de la création du compte.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await removeUser(deleteTarget.id);
      toast.success(`Utilisateur "${deleteTarget.nom}" supprimé`);
      setDeleteTarget(null);
    } catch {
      toast.error("Erreur lors de la suppression.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
    {/* Dialog confirmation suppression */}
    <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" /> Confirmer la suppression
          </DialogTitle>
          <DialogDescription className="pt-2">
            Vous êtes sur le point de supprimer le compte de{" "}
            <span className="font-semibold text-foreground">{deleteTarget?.nom}</span>.
            <br />
            Cette action est <span className="font-semibold">irréversible</span>.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading} className="gap-1.5">
            <Trash2 className="w-4 h-4" />
            {deleteLoading ? "Suppression…" : "Supprimer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <div className="space-y-6">
      {/* ── Chefs de projet ─────────────────────────────────────────────── */}
      <div className="bg-card rounded-lg border shadow-sm">
        <div className="p-5 border-b flex flex-wrap gap-3 items-center justify-between">
          <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}>
            Gestion des chefs de projet
          </h3>
          <Dialog open={chefOpen} onOpenChange={setChefOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="w-4 h-4" /> Créer un chef de projet
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}>
                  Créer un chef de projet
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleChefSubmit} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet *</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Sami Ben Ali" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="chef@greenimpact.tn" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe temporaire *</Label>
                  <div className="flex gap-2">
                    <Input id="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="8 caractères min." />
                    <Button type="button" variant="outline" size="sm" onClick={() => setPassword(generatePassword())} className="gap-1 shrink-0">
                      <RefreshCw className="w-3.5 h-3.5" /> Générer
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Projet assigné</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner un projet" /></SelectTrigger>
                    <SelectContent>
                      {availableProjects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>
                      ))}
                      {availableProjects.length === 0 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">Tous les projets sont assignés</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Créer le compte</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-5 py-3 font-medium text-muted-foreground">Nom</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">Email</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">Projet assigné</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">Date création</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {chefUsers.map(u => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-medium">{u.nom}</td>
                  <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-5 py-3">
                    {u.project?.nom ?? <span className="text-muted-foreground italic">Non assigné</span>}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {u.created_at ? String(u.created_at).split('T')[0] : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget({ id: u.id, nom: u.nom })} className="text-destructive hover:text-destructive gap-1">
                      <Trash2 className="w-4 h-4" /> Supprimer
                    </Button>
                  </td>
                </tr>
              ))}
              {chefUsers.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">Aucun chef de projet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
    </>
  );
};

export default UserManagement;
