import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import AppHeader from "@/components/AppHeader";
import {
  Sparkles, Brain, TrendingUp, AlertTriangle, CheckCircle2,
  XCircle, Zap, BarChart3, Target, Clock, Filter, Activity,
  ShieldCheck, Gauge,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Prediction {
  avancement_predit: number;
  en_retard: boolean;
  risque_retard: number;
  finira_a_temps: boolean;
  message: string;
  alerte: string;
}

interface ProjectPrediction {
  projet_id: number;
  projet_nom: string;
  acronyme?: string;
  statut?: string;
  features?: Record<string, number>;
  prediction: Prediction;
}

type RiskLevel = "faible" | "modere" | "eleve";

// ── Risk config ───────────────────────────────────────────────────────────────
const RISK = {
  faible: {
    label: "Faible",
    textClass: "text-emerald-700 dark:text-emerald-400",
    bgClass: "bg-emerald-50 dark:bg-emerald-900/25",
    borderClass: "border-emerald-300 dark:border-emerald-700",
    borderLeftColor: "#10b981",
    barClass: "from-emerald-400 to-emerald-600",
    dotClass: "bg-emerald-500",
    ringColor: "#10b981",
    icon: CheckCircle2,
    pulse: false,
  },
  modere: {
    label: "Modéré",
    textClass: "text-amber-700 dark:text-amber-400",
    bgClass: "bg-amber-50 dark:bg-amber-900/25",
    borderClass: "border-amber-300 dark:border-amber-700",
    borderLeftColor: "#f59e0b",
    barClass: "from-amber-400 to-orange-500",
    dotClass: "bg-amber-500",
    ringColor: "#f59e0b",
    icon: AlertTriangle,
    pulse: false,
  },
  eleve: {
    label: "Élevé",
    textClass: "text-rose-700 dark:text-rose-400",
    bgClass: "bg-rose-50 dark:bg-rose-900/25",
    borderClass: "border-rose-300 dark:border-rose-700",
    borderLeftColor: "#f43f5e",
    barClass: "from-rose-400 to-rose-600",
    dotClass: "bg-rose-500",
    ringColor: "#f43f5e",
    icon: XCircle,
    pulse: true,
  },
} as const;

function getRiskLevel(risque: number): RiskLevel {
  if (risque >= 0.7) return "eleve";
  if (risque >= 0.4) return "modere";
  return "faible";
}

// ── Circular Progress Ring ─────────────────────────────────────────────────────
const CircularProgress: React.FC<{ value: number; color: string; size?: number }> = ({
  value, color, size = 84,
}) => {
  const sw = 7;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, value)) / 100) * circ;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 absolute">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor"
          strokeWidth={sw} className="text-muted-foreground/10" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
          strokeWidth={sw} strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)" }} />
      </svg>
      <div className="flex flex-col items-center">
        <span className="text-base font-bold leading-none" style={{ color }}>{value}%</span>
      </div>
    </div>
  );
};

// ── Skeleton Card ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="rounded-2xl border bg-card p-5 space-y-4 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <div className="h-4 w-40 bg-muted rounded" />
        <div className="h-3 w-16 bg-muted rounded" />
      </div>
      <div className="h-6 w-16 bg-muted rounded-full" />
    </div>
    <div className="flex gap-4">
      <div className="w-[84px] h-[84px] rounded-full bg-muted shrink-0" />
      <div className="flex-1 space-y-3 pt-2">
        <div className="h-2 w-full bg-muted rounded-full" />
        <div className="h-3 w-3/4 bg-muted rounded" />
        <div className="h-3 w-1/2 bg-muted rounded" />
      </div>
    </div>
    <div className="h-10 w-full bg-muted rounded-xl" />
  </div>
);

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  iconBg?: string;
  iconColor?: string;
}> = ({ icon: Icon, label, value, sub, iconBg = "bg-primary/10", iconColor = "text-primary" }) => (
  <div className="bg-card border rounded-2xl p-4 flex items-center gap-4 shadow-sm">
    <div className={`p-3 rounded-xl ${iconBg}`}>
      <Icon className={`w-5 h-5 ${iconColor}`} />
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5 truncate">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ── Feature Row (chef detail view) ────────────────────────────────────────────
const FeatureRow: React.FC<{ label: string; value: number; unit: string; isNeg?: boolean }> = ({
  label, value, unit, isNeg,
}) => (
  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className={`text-sm font-bold tabular-nums ${
      isNeg === true ? "text-rose-600 dark:text-rose-400" :
      isNeg === false ? "text-emerald-600 dark:text-emerald-400" :
      "text-foreground"
    }`}>
      {unit === "%" ? `${value.toFixed(1)}%` : value.toFixed(3)}
    </span>
  </div>
);

// ── Project Card ──────────────────────────────────────────────────────────────
const ProjectCard: React.FC<{ item: ProjectPrediction }> = ({ item }) => {
  const { prediction } = item;
  const level = getRiskLevel(prediction.risque_retard);
  const risk = RISK[level];
  const RiskIcon = risk.icon;
  const riskPct = Math.round(prediction.risque_retard * 100);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border bg-card shadow-sm hover:shadow-md transition-all duration-200 flex flex-col"
      style={{ borderLeft: `4px solid ${risk.borderLeftColor}` }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-foreground leading-snug line-clamp-2" title={item.projet_nom}>
              {item.projet_nom}
            </p>
            {item.acronyme && (
              <span className="mt-1 inline-block text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {item.acronyme}
              </span>
            )}
          </div>
          <span className={`
            flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0
            ${risk.bgClass} ${risk.textClass} border ${risk.borderClass}
          `}>
            <span className={`w-1.5 h-1.5 rounded-full ${risk.dotClass} ${risk.pulse ? "animate-pulse" : ""}`} />
            {risk.label}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pb-4 flex gap-4 flex-1">
        {/* Circular ring */}
        <div className="flex flex-col items-center gap-1.5">
          <CircularProgress value={prediction.avancement_predit} color={risk.ringColor} size={84} />
          <p className="text-[10px] text-muted-foreground text-center leading-tight">
            Avancement<br />prédit (S+1)
          </p>
        </div>

        {/* Metrics */}
        <div className="flex-1 space-y-3 pt-1">
          {/* Risk bar */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[11px] text-muted-foreground">Risque de retard</span>
              <span className={`text-xs font-bold tabular-nums ${risk.textClass}`}>{riskPct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${risk.barClass}`}
                style={{ width: `${riskPct}%`, transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)" }}
              />
            </div>
          </div>

          {/* Statuses */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              {prediction.finira_a_temps
                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                : <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
              <span className="text-[11px] font-medium text-foreground">
                {prediction.finira_a_temps ? "Finira dans les délais" : "Risque de dépassement"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className={`w-3.5 h-3.5 shrink-0 ${prediction.en_retard ? "text-rose-500" : "text-emerald-500"}`} />
              <span className="text-[11px] text-muted-foreground">
                {prediction.en_retard ? "Retard détecté actuellement" : "Progression dans les délais"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`px-5 py-3 border-t border-border/50 ${risk.bgClass} mt-auto`}>
        <div className="flex items-center gap-2">
          <RiskIcon className={`w-3.5 h-3.5 shrink-0 ${risk.textClass}`} />
          <p className={`text-[11px] font-semibold ${risk.textClass}`}>{prediction.alerte}</p>
        </div>
      </div>
    </div>
  );
};

// ── Filter button ─────────────────────────────────────────────────────────────
type FilterKey = "all" | RiskLevel;

const FilterBtn: React.FC<{
  label: string;
  count: number;
  active: boolean;
  dot?: string;
  onClick: () => void;
}> = ({ label, count, active, dot, onClick }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all
      ${active
        ? "bg-card text-foreground shadow border border-border"
        : "text-muted-foreground hover:text-foreground hover:bg-card/60"
      }
    `}
  >
    {dot && <span className={`w-2 h-2 rounded-full ${dot}`} />}
    {label}
    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${active ? "bg-primary/10 text-primary" : "bg-muted"}`}>
      {count}
    </span>
  </button>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const AIPredictionsPage: React.FC = () => {
  const { user } = useAuth();

  const [items, setItems] = useState<ProjectPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const req = isAdmin
      ? api.get("/api/predictions/all").then(res =>
          setItems((res.data as any[]).filter(i => i.prediction))
        )
      : user.projectId
        ? api.get(`/api/predictions/${user.projectId}`).then(res =>
            setItems([res.data as ProjectPrediction])
          )
        : Promise.reject(new Error("Aucun projet assigné à ce compte."));

    req.catch(err => {
      setError(err.response?.data?.error ?? err.message ?? "Erreur inconnue");
    }).finally(() => setLoading(false));
  }, [user?.id]);

  const counts: Record<FilterKey, number> = {
    all: items.length,
    faible: items.filter(i => getRiskLevel(i.prediction.risque_retard) === "faible").length,
    modere: items.filter(i => getRiskLevel(i.prediction.risque_retard) === "modere").length,
    eleve:  items.filter(i => getRiskLevel(i.prediction.risque_retard) === "eleve").length,
  };

  const filtered = filter === "all"
    ? items
    : items.filter(i => getRiskLevel(i.prediction.risque_retard) === filter);

  const avgAv = items.length
    ? Math.round(items.reduce((s, i) => s + i.prediction.avancement_predit, 0) / items.length)
    : 0;
  const atRisk = counts.modere + counts.eleve;
  const onTime = items.filter(i => i.prediction.finira_a_temps).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader
        title="Prédictions IA"
        subtitle="Analyse prédictive — Green Impact AI"
      />

      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/8 via-background to-emerald-500/5">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-emerald-500/5 blur-2xl" />
        </div>

        <div className="container relative py-10">
          {/* Badge row */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-2 bg-card border rounded-full px-3 py-1.5 shadow-sm">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Green Impact AI</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5">
              <Zap className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Live</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
            Prédictions IA
            <Sparkles className="w-7 h-7 text-primary/60" />
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
            3 modèles <span className="font-semibold text-foreground">RandomForest</span> analysent{" "}
            <span className="font-semibold text-foreground">8 indicateurs</span> clés pour prédire l'avancement
            de chaque projet sur les 6 prochains mois.
          </p>

          {/* Model pills */}
          <div className="flex flex-wrap gap-2 mt-5">
            {[
              { label: "Avancement prédit (S+1)", icon: TrendingUp, color: "text-primary" },
              { label: "Détection de retard", icon: Clock, color: "text-amber-600" },
              { label: "Score de risque", icon: Gauge, color: "text-rose-600" },
            ].map(({ label, icon: Icon, color }) => (
              <div key={label}
                className="flex items-center gap-1.5 bg-card border rounded-full px-3 py-1 text-xs text-muted-foreground shadow-sm">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="container py-8 space-y-6 flex-1">

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-5 rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-rose-700 dark:text-rose-400">Service IA indisponible</p>
              <p className="text-xs text-rose-600/80 dark:text-rose-500 mt-1">{error}</p>
              <p className="text-xs text-rose-600/60 dark:text-rose-600 mt-1">
                Vérifiez que <code className="font-mono bg-rose-100 dark:bg-rose-900/50 px-1 rounded">python predict_api.py</code> est démarré sur le port 5001.
              </p>
            </div>
          </div>
        )}

        {/* Stats (admin) */}
        {isAdmin && !loading && !error && items.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={Target} label="Projets analysés" value={items.length}
              iconBg="bg-primary/10" iconColor="text-primary"
            />
            <StatCard
              icon={AlertTriangle} label="Projets à risque" value={atRisk}
              sub={`${counts.eleve} urgents`}
              iconBg="bg-amber-500/10" iconColor="text-amber-600"
            />
            <StatCard
              icon={TrendingUp} label="Avancement moyen prédit" value={`${avgAv}%`}
              iconBg="bg-emerald-500/10" iconColor="text-emerald-600"
            />
            <StatCard
              icon={ShieldCheck} label="Finira dans les délais" value={onTime}
              sub={`sur ${items.length} projets`}
              iconBg="bg-sky-500/10" iconColor="text-sky-600"
            />
          </div>
        )}

        {/* Filter bar (admin) */}
        {isAdmin && !loading && !error && items.length > 0 && (
          <div className="flex items-center gap-1 p-1.5 bg-muted/60 rounded-2xl w-fit border border-border/40">
            <FilterBtn label="Tous les projets" count={counts.all} active={filter === "all"} onClick={() => setFilter("all")} />
            <FilterBtn label="Faible" count={counts.faible} active={filter === "faible"} dot="bg-emerald-500" onClick={() => setFilter("faible")} />
            <FilterBtn label="Modéré" count={counts.modere} active={filter === "modere"} dot="bg-amber-500" onClick={() => setFilter("modere")} />
            <FilterBtn label="Élevé" count={counts.eleve} active={filter === "eleve"} dot="bg-rose-500" onClick={() => setFilter("eleve")} />
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: isAdmin ? 6 : 1 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty filter state */}
        {!loading && !error && filtered.length === 0 && items.length > 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-4 rounded-2xl bg-muted mb-4">
              <Filter className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="font-semibold text-foreground">Aucun projet dans cette catégorie</p>
            <p className="text-sm text-muted-foreground mt-1">Essayez un autre filtre de risque</p>
          </div>
        )}

        {/* Cards grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className={
            isAdmin
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
              : "max-w-xl mx-auto space-y-5"
          }>
            {filtered.map(item => (
              <ProjectCard key={item.projet_id} item={item} />
            ))}
          </div>
        )}

        {/* Chef: features detail */}
        {!loading && !error && !isAdmin && filtered.length === 1 && filtered[0].features && (
          <div className="max-w-xl mx-auto border rounded-2xl bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Indicateurs analysés par l'IA</h3>
              <span className="ml-auto text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                8 features
              </span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { key: "avancement_actuel_pct",      label: "Avancement actuel",      unit: "%",  sign: true },
                { key: "avancement_prevu_pct",        label: "Avancement prévu",        unit: "%",  sign: false },
                { key: "ecart_avancement_pct",        label: "Écart planning",          unit: "%",  sign: true },
                { key: "budget_consomme_pct",         label: "Budget consommé",         unit: "%",  sign: false },
                { key: "taux_completion_jalons_pct",  label: "Taux jalons",             unit: "%",  sign: true },
                { key: "velocity_score",              label: "Velocity score",          unit: "",   sign: true },
                { key: "ratio_avancement_budget",     label: "Ratio avancement/budget", unit: "",   sign: true },
                { key: "semestre_normalise",          label: "Position cycle de vie",   unit: "",   sign: false },
              ].map(({ key, label, unit, sign }) => {
                const val = filtered[0].features![key] ?? 0;
                return (
                  <FeatureRow
                    key={key} label={label} value={val} unit={unit}
                    isNeg={sign ? val < 0 : undefined}
                  />
                );
              })}
            </div>
            <div className="px-5 pb-5">
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  Ces 8 indicateurs sont calculés automatiquement à partir des données du projet
                  et transmis aux modèles RandomForest entraînés sur 4 000 projets environnementaux.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No project assigned (chef) */}
        {!loading && !error && !isAdmin && !user?.projectId && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="p-5 rounded-2xl bg-muted mb-4">
              <Brain className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <p className="font-semibold text-foreground">Aucun projet assigné</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Contactez un administrateur pour être associé à un projet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPredictionsPage;
