import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, Sun, Moon, Sparkles, LayoutDashboard, UserCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import api from "@/lib/api";
import { toast } from "@/components/ui/sonner";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({ title, subtitle }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // ── Mon compte dialog ──────────────────────────────────────────────────────
  const [open, setOpen]                     = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail]             = useState("");
  const [newPassword, setNewPassword]       = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent]       = useState(false);
  const [showNew, setShowNew]               = useState(false);
  const [loading, setLoading]               = useState(false);

  const resetForm = () => {
    setCurrentPassword("");
    setNewEmail("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrent(false);
    setShowNew(false);
  };

  const handleClose = () => { setOpen(false); resetForm(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Le mot de passe actuel est requis.");
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword && newPassword.length < 8) {
      toast.error("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (!newEmail && !newPassword) {
      toast.error("Modifiez au moins un champ (email ou mot de passe).");
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, string> = { currentPassword };
      if (newEmail && newEmail !== user?.email) body.email = newEmail;
      if (newPassword) body.newPassword = newPassword;

      const { data } = await api.patch("/api/users/me", body);
      toast.success(data.message || "Compte mis à jour !");

      // Si email changé → met à jour localStorage
      if (newEmail && newEmail !== user?.email) {
        const stored = localStorage.getItem("user");
        if (stored) {
          const u = JSON.parse(stored);
          u.email = newEmail;
          localStorage.setItem("user", JSON.stringify(u));
        }
      }

      // Si mot de passe changé → déconnexion forcée
      if (newPassword) {
        toast.info("Mot de passe modifié. Reconnectez-vous.");
        setTimeout(() => { logout(); navigate("/login"); }, 1500);
      }

      handleClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur lors de la mise à jour.");
    } finally {
      setLoading(false);
    }
  };

  const dashboardPath = user?.role === "admin" ? "/admin-dashboard" : "/chef-dashboard";
  const isOnPredictions = location.pathname === "/ai-predictions";
  const isOnDashboard   = location.pathname === dashboardPath;

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between gap-3">

          {/* Left: logo + title */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex items-center justify-center transition-transform duration-200 hover:scale-105 cursor-pointer shrink-0"
              onClick={() => navigate(dashboardPath)}
            >
              <img src="/logo.png" alt="Green Impact" className="h-8 w-auto object-contain drop-shadow-sm" />
            </div>
            <div className="min-w-0 hidden sm:block">
              {title && (
                <h2 className="text-sm font-semibold text-foreground truncate" style={{ fontFamily: "var(--font-body)" }}>
                  {title}
                </h2>
              )}
              {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
            </div>
          </div>

          {/* Center: nav links */}
          <nav className="flex items-center gap-1">
            <button
              onClick={() => navigate(dashboardPath)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${isOnDashboard
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }
              `}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tableau de bord</span>
            </button>

            <button
              onClick={() => navigate("/ai-predictions")}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${isOnPredictions
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }
              `}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Prédictions IA</span>
            </button>
          </nav>

          {/* Right: mon compte + theme + logout */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-muted-foreground hidden md:inline truncate max-w-[120px]">{user?.name}</span>

            {/* Mon compte */}
            <button
              onClick={() => { setNewEmail(user?.email ?? ""); setOpen(true); }}
              title="Mon compte"
              className="relative w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <UserCircle className="w-4 h-4" />
            </button>

            {/* Dark/light mode */}
            <button
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
              className="relative w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Sun className={`absolute w-4 h-4 transition-all duration-300 ${theme === "dark" ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"}`} />
              <Moon className={`absolute w-4 h-4 transition-all duration-300 ${theme === "light" ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"}`} />
            </button>

            {/* Déconnexion */}
            <Button variant="ghost" size="sm" onClick={() => { logout(); navigate("/login"); }} className="gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Dialog Mon compte ── */}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-primary" />
              Mon compte
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-2">
            {/* Info utilisateur */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <UserCircle className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <span className="ml-auto text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0 capitalize">
                {user?.role === "admin" ? "Administrateur" : "Chef de projet"}
              </span>
            </div>

            {/* Mot de passe actuel */}
            <div className="space-y-2">
              <Label htmlFor="currentPw">Mot de passe actuel <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  id="currentPw"
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Requis pour toute modification"
                  required
                />
                <button type="button" onClick={() => setShowCurrent(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="border-t border-border/50 pt-4 space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Modifier</p>

              {/* Nouvel email */}
              <div className="space-y-2">
                <Label htmlFor="newEmail">Nouvelle adresse email</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder={user?.email}
                />
              </div>

              {/* Nouveau mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="newPw">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="newPw"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="8 caractères minimum"
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmation */}
              {newPassword && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPw">Confirmer le nouveau mot de passe</Label>
                  <Input
                    id="confirmPw"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Répétez le nouveau mot de passe"
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-destructive">Les mots de passe ne correspondent pas</p>
                  )}
                </div>
              )}
            </div>

            {newPassword && (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                Après modification du mot de passe, vous serez automatiquement déconnecté.
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose} disabled={loading}>
                Annuler
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AppHeader;
