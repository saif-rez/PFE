import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

interface PasswordRule {
  label: string;
  test: (v: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: "8 caractères minimum", test: v => v.length >= 8 },
  { label: "Une lettre majuscule", test: v => /[A-Z]/.test(v) },
  { label: "Un chiffre", test: v => /\d/.test(v) },
  { label: "Un caractère spécial (!@#$%…)", test: v => /[!@#$%^&*()\-_=+{};:,<.>]/.test(v) },
];

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [tokenStatus, setTokenStatus] = useState<"checking" | "valid" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const rulesPass = PASSWORD_RULES.map(r => r.test(password));
  const allRulesPass = rulesPass.every(Boolean);
  const passwordsMatch = password === confirm && confirm.length > 0;

  useEffect(() => {
    if (!token) {
      setTokenStatus("invalid");
      return;
    }
    api
      .get(`/api/auth/verify-reset-token/${token}`)
      .then(res => setTokenStatus(res.data.valid ? "valid" : "invalid"))
      .catch(() => setTokenStatus("invalid"));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRulesPass || !passwordsMatch) return;

    setError("");
    setSubmitting(true);
    try {
      await api.post("/api/auth/reset-password", { token, password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 4000);
    } catch (err: any) {
      const msg = err.response?.data?.error || "Une erreur est survenue.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary leaf-pattern relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/80" />
      <div className="relative z-10 w-full max-w-md mx-4 animate-fade-in-up">
        <div className="bg-card rounded-lg shadow-2xl shadow-primary/30 p-8 space-y-6">

          {/* Logo */}
          <div className="flex items-center justify-center transition-transform duration-300 hover:scale-105">
            <img src="/logo.png" alt="Green Impact" className="h-16 w-auto object-contain drop-shadow-md" />
          </div>

          {/* Checking token */}
          {tokenStatus === "checking" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Vérification du lien…</p>
            </div>
          )}

          {/* Invalid token */}
          {tokenStatus === "invalid" && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="w-7 h-7 text-red-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">Lien invalide ou expiré</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Ce lien de réinitialisation n'est plus valide. Il a peut-être expiré (15 minutes) ou déjà été utilisé.
                </p>
              </div>
              <Link to="/forgot-password">
                <Button className="w-full" size="lg">
                  Demander un nouveau lien
                </Button>
              </Link>
              <Link to="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                Retour à la connexion
              </Link>
            </div>
          )}

          {/* Success */}
          {tokenStatus === "valid" && success && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-green-700" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">Mot de passe modifié !</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Votre mot de passe a été réinitialisé. Toutes vos sessions actives ont été déconnectées.
                </p>
                <p className="text-xs text-muted-foreground">Redirection vers la connexion dans quelques secondes…</p>
              </div>
              <Link to="/login">
                <Button className="w-full" size="lg">Se connecter</Button>
              </Link>
            </div>
          )}

          {/* Password form */}
          {tokenStatus === "valid" && !success && (
            <>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-foreground">Nouveau mot de passe</h2>
                <p className="text-sm text-muted-foreground">Choisissez un mot de passe sécurisé.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Password field */}
                <div className="space-y-2">
                  <Label htmlFor="password">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPw ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Real-time rules checklist */}
                  {password.length > 0 && (
                    <ul className="space-y-1 mt-2">
                      {PASSWORD_RULES.map((rule, i) => (
                        <li key={i} className={`flex items-center gap-2 text-xs transition-colors ${rulesPass[i] ? "text-green-600" : "text-muted-foreground"}`}>
                          {rulesPass[i]
                            ? <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                            : <XCircle className="w-3.5 h-3.5 shrink-0" />
                          }
                          {rule.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Confirm password */}
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirm.length > 0 && !passwordsMatch && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" />
                      Les mots de passe ne correspondent pas.
                    </p>
                  )}
                  {confirm.length > 0 && passwordsMatch && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Les mots de passe correspondent.
                    </p>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={submitting || !allRulesPass || !passwordsMatch}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Réinitialisation…
                    </span>
                  ) : (
                    "Réinitialiser le mot de passe"
                  )}
                </Button>
              </form>

              <div className="text-center">
                <Link to="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Retour à la connexion
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
