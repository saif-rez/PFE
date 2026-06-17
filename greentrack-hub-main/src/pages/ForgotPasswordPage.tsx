import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

const ForgotPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const cancelToken = searchParams.get("cancel");

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [cancelStatus, setCancelStatus] = useState<"loading" | "done" | null>(
    cancelToken ? "loading" : null
  );

  useEffect(() => {
    if (!cancelToken) return;
    api
      .get(`/api/auth/invalidate-reset-token/${cancelToken}`)
      .then(() => setCancelStatus("done"))
      .catch(() => setCancelStatus("done"));
  }, [cancelToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email });
      setSubmitted(true);
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError("Trop de tentatives. Réessayez dans une heure.");
      } else {
        setError("Une erreur est survenue. Réessayez.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary leaf-pattern relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/80" />
      <div className="relative z-10 w-full max-w-md mx-4 animate-fade-in-up">
        <div className="bg-card rounded-lg shadow-2xl shadow-primary/30 p-8 space-y-6">

          {/* Logo */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center mb-3 transition-transform duration-300 hover:scale-105">
              <img src="/logo.png" alt="Green Impact" className="h-16 w-auto object-contain drop-shadow-md" />
            </div>
          </div>

          {/* "Ce n'était pas moi" — token annulation */}
          {cancelToken && (
            <div className="rounded-lg border p-4 text-center space-y-2">
              {cancelStatus === "loading" ? (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Annulation en cours…</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    Le lien de réinitialisation a été annulé. Votre mot de passe est inchangé.
                  </span>
                </div>
              )}
              <Link to="/login" className="text-xs text-muted-foreground hover:text-primary underline">
                Retour à la connexion
              </Link>
            </div>
          )}

          {/* Main content — hidden when showing cancel confirmation */}
          {!cancelToken && (
            <>
              {submitted ? (
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                      <Mail className="w-7 h-7 text-green-700" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-foreground">Vérifiez votre boîte mail</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Si cette adresse email existe dans notre système, vous recevrez un lien de réinitialisation sous peu.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Le lien expire dans <strong>15 minutes</strong>.
                    </p>
                  </div>
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="gap-2 mt-2">
                      <ArrowLeft className="w-4 h-4" />
                      Retour à la connexion
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-foreground">Mot de passe oublié ?</h2>
                    <p className="text-sm text-muted-foreground">
                      Entrez votre adresse email. Si elle est connue, vous recevrez un lien de réinitialisation.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Adresse email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre@email.tn"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 text-destructive text-sm">
                        <XCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <Button type="submit" className="w-full" size="lg" disabled={loading}>
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Envoi en cours…
                        </span>
                      ) : (
                        "Envoyer le lien"
                      )}
                    </Button>
                  </form>

                  <div className="text-center">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Retour à la connexion
                    </Link>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
