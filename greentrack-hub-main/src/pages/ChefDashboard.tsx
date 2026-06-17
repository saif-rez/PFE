import React, { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useReports } from "@/contexts/ReportsContext";
import { useProjects } from "@/contexts/ProjectsContext";
import type { Report } from "@/data/mockData";
import AppHeader from "@/components/AppHeader";
import KpiCard from "@/components/KpiCard";
import StatusBadge from "@/components/StatusBadge";
import ReportForm from "@/components/ReportForm";
import ReportViewer from "@/components/ReportViewer";
import DashboardSidebar, { type SidebarItem } from "@/components/DashboardSidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  FileText, Eye, BarChart3, Download, FileDown, LayoutDashboard,
  History, Search, Activity, Package, Users, CalendarDays, TrendingUp, Edit2,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { exportReportToPDF, exportMultipleReportsToPDF, exportBIDashboardToPDF } from "@/lib/pdfExport";
import { exportReportToExcel, exportMultipleReportsToExcel } from "@/lib/excelExport";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const GREEN_PALETTE = ["#0D4A2E", "#1D9E75", "#A8E6CF", "#4ECDC4", "#2D8B6F", "#6FCF97"];

const ChefDashboard: React.FC = () => {
  const { user } = useAuth();
  const { projects } = useProjects();
  const { reports, addReport, updateReport } = useReports();
  const [showForm, setShowForm] = useState(false);
  const [editReport, setEditReport] = useState<Report | null>(null);
  const [viewReport, setViewReport] = useState<Report | null>(null);
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState<string>("Tous");

  const project = projects.find(p => p.id === String(user?.projectId));
  const myReports = useMemo(
    () => (project ? reports.filter(r => r.projectId === project.id) : []),
    [reports, project]
  );

  const latestReport = useMemo(
    () => myReports.length > 0
      ? [...myReports].sort((a, b) => b.dateSoumission.localeCompare(a.dateSoumission))[0]
      : null,
    [myReports]
  );

  const kpiStats = useMemo(() => {
    if (!latestReport) return {
      avancementMoyen: 0, activitesTotal: 0, activitesCloturees: 0,
      livrableTotal: 0, livrableTermines: 0, reunions: 0, personnel: 0,
    };
    const t3 = latestReport.tab3;
    const t4 = latestReport.tab4;
    const avancementMoyen = t3.length > 0
      ? Math.round(t3.reduce((s, a) => s + (a.avancement || 0), 0) / t3.length)
      : 0;
    return {
      avancementMoyen,
      activitesTotal: t3.length,
      activitesCloturees: t3.filter(a => a.etat === "Clôturée").length,
      livrableTotal: t4.length,
      livrableTermines: t4.filter(l => l.statut === "Terminé").length,
      reunions: latestReport.tab7.length,
      personnel: latestReport.tab8.length,
    };
  }, [latestReport]);

  const monthlyData = useMemo(() => {
    const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    const counts: Record<string, { soumis: number; approuves: number; year: number; month: number }> = {};
    myReports.forEach(r => {
      const parts = r.dateSoumission.split("-");
      if (parts.length < 2) return;
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      if (monthIdx < 0 || monthIdx > 11) return;
      const key = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
      if (!counts[key]) counts[key] = { soumis: 0, approuves: 0, year, month: monthIdx };
      counts[key].soumis++;
      if (r.statut === "Approuvé") counts[key].approuves++;
    });
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({ mois: `${monthNames[v.month]} ${v.year}`, soumis: v.soumis, approuves: v.approuves }));
  }, [myReports]);

  const statusData = useMemo(() => [
    { name: "En attente", value: myReports.filter(r => r.statut === "En attente").length },
    { name: "Approuvé", value: myReports.filter(r => r.statut === "Approuvé").length },
    { name: "Rejeté", value: myReports.filter(r => r.statut === "Rejeté").length },
  ].filter(d => d.value > 0), [myReports]);

  const livrableData = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    myReports.forEach(r => {
      r.tab4.forEach(l => {
        const t = l.type;
        typeCounts[t] = (typeCounts[t] || 0) + 1;
      });
    });
    return Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  }, [myReports]);

  const genreData = useMemo(() => {
    let hommes = 0;
    let femmes = 0;
    myReports.forEach(r => {
      r.tab8.forEach(p => {
        if (p.genre === "Homme") hommes++;
        else if (p.genre === "Femme") femmes++;
      });
    });
    return [
      { name: "Homme", value: hommes },
      { name: "Femme", value: femmes },
    ].filter(d => d.value > 0);
  }, [myReports]);

  const filteredHistory = useMemo(() => {
    let list = [...myReports].sort((a, b) => b.dateSoumission.localeCompare(a.dateSoumission));
    if (historyFilter !== "Tous") list = list.filter(r => r.statut === historyFilter);
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      list = list.filter(r =>
        r.periodeCouvert.toLowerCase().includes(q) ||
        r.dateSoumission.includes(q)
      );
    }
    return list;
  }, [myReports, historyFilter, historySearch]);

  if (!project) return <div className="p-8">Projet non trouvé.</div>;


  const handleSubmit = async (report: Report) => {
    try {
      await addReport(report);
      setShowForm(false);
      toast.success("Rapport soumis avec succès !");
    } catch {
      toast.error("Erreur lors de la soumission.");
    }
  };

  const handleResubmit = async (report: Report) => {
    try {
      await updateReport(editReport!.id, report);
      setShowForm(false);
      setEditReport(null);
      toast.success("Rapport resoumis avec succès !");
    } catch {
      toast.error("Erreur lors de la resoumission.");
    }
  };

  const hasData = myReports.length > 0;

  const sidebarItems: SidebarItem[] = [
    { key: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
    { key: "bi", label: "Statistiques BI", icon: BarChart3 },
    { key: "historique", label: "Historique", icon: History, badge: myReports.length },
  ];

  const sectionTitle =
    activeSection === "overview" ? "Vue d'ensemble" :
    activeSection === "bi" ? "Statistiques BI" :
    "Historique";

  const FILTER_BUTTONS = ["Tous", "Approuvé", "En attente", "Rejeté"];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar
          items={sidebarItems}
          active={activeSection}
          onSelect={setActiveSection}
          brandSubtitle={user?.name}
        />

        <SidebarInset className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 border-b bg-card/60 backdrop-blur-sm px-3 h-12 sticky top-0 z-30">
            <SidebarTrigger />
            <div className="h-5 w-px bg-border" />
            <span className="text-sm font-medium" style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}>
              {sectionTitle}
            </span>
          </div>

          <AppHeader title={`Bonjour, ${user?.name}`} subtitle={project.nom} />

          <main className="container py-6 space-y-6 animate-fade-in" key={activeSection}>
            {/* Project card (always visible) */}
            <div className="bg-card rounded-lg border p-5 shadow-sm animate-fade-in-up">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl">{project.nom}</h2>
                    <StatusBadge statut={project.statut} />
                  </div>
                  <p className="text-sm text-muted-foreground">{project.categorie} · Démarré le {project.dateDebut}</p>
                </div>
              </div>
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avancement moyen des activités</span>
                  {latestReport
                    ? <span className="font-medium tabular-nums">{kpiStats.avancementMoyen}% <span className="text-muted-foreground font-normal">({latestReport.periodeCouvert})</span></span>
                    : <span className="text-muted-foreground text-xs">Aucun rapport soumis</span>
                  }
                </div>
                <Progress value={latestReport ? kpiStats.avancementMoyen : 0} className="h-2" />
              </div>
            </div>

            {/* KPIs — basés sur le dernier rapport soumis */}
            {latestReport ? (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground px-0.5">
                  Statistiques issues du rapport <span className="font-medium">{latestReport.periodeCouvert}</span>
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 stagger-children">
                  <KpiCard label="Avancement moyen" value={`${kpiStats.avancementMoyen}%`} icon={<TrendingUp className="w-5 h-5" />} delay={0} />
                  <KpiCard label="Activités totales" value={kpiStats.activitesTotal} icon={<Activity className="w-5 h-5" />} delay={50} />
                  <KpiCard label="Activités clôturées" value={kpiStats.activitesCloturees} icon={<Activity className="w-5 h-5" />} highlight="success" delay={100} />
                  <KpiCard label="Livrables terminés" value={`${kpiStats.livrableTermines}/${kpiStats.livrableTotal}`} icon={<Package className="w-5 h-5" />} delay={150} />
                  <KpiCard label="Réunions" value={kpiStats.reunions} icon={<CalendarDays className="w-5 h-5" />} delay={200} />
                  <KpiCard label="Personnel" value={kpiStats.personnel} icon={<Users className="w-5 h-5" />} delay={250} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 stagger-children">
                <KpiCard label="Avancement moyen" value="—" icon={<TrendingUp className="w-5 h-5" />} delay={0} />
                <KpiCard label="Activités totales" value="—" icon={<Activity className="w-5 h-5" />} delay={50} />
                <KpiCard label="Activités clôturées" value="—" icon={<Activity className="w-5 h-5" />} delay={100} />
                <KpiCard label="Livrables terminés" value="—" icon={<Package className="w-5 h-5" />} delay={150} />
                <KpiCard label="Réunions" value="—" icon={<CalendarDays className="w-5 h-5" />} delay={200} />
                <KpiCard label="Personnel" value="—" icon={<Users className="w-5 h-5" />} delay={250} />
              </div>
            )}

            {activeSection === "overview" && (
              <div className="space-y-6 animate-fade-in-up">

                {!showForm && (
                  <Button size="lg" onClick={() => { setEditReport(null); setShowForm(true); }} className="gap-2">
                    <FileText className="w-5 h-5" /> Soumettre un rapport semestriel
                  </Button>
                )}

                {showForm && (
                  <ReportForm
                    projectId={project.id}
                    projectName={project.nom}
                    chefName={project.chefNom}
                    acronyme={project.acronyme}
                    laboratoire={project.laboratoire}
                    initialData={editReport ?? undefined}
                    onSubmit={editReport ? handleResubmit : handleSubmit}
                    onSaveDraft={() => toast.info("Brouillon enregistré.")}
                    onClose={() => { setShowForm(false); setEditReport(null); }}
                  />
                )}

                <div className="bg-card rounded-lg border shadow-sm">
                  <div className="p-5 border-b flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}>Mes soumissions</h3>
                    {myReports.length > 0 && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => {
                            const map = new Map([[project.id, project.nom]]);
                            exportMultipleReportsToPDF(myReports, map, `Mes_rapports_${project.nom.replace(/\s+/g, "_")}.pdf`);
                            toast.success("Export PDF généré !");
                          }}
                        >
                          <FileDown className="w-4 h-4" /> Exporter tous (PDF)
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-700 dark:hover:bg-emerald-950/40"
                          onClick={() => {
                            const map = new Map([[project.id, project.nom]]);
                            exportMultipleReportsToExcel(myReports, map, `Mes_rapports_${project.nom.replace(/\s+/g, "_")}.xlsx`);
                            toast.success("Export Excel généré !");
                          }}
                        >
                          <FileDown className="w-4 h-4" /> Exporter tous (Excel)
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="px-5 py-3 font-medium text-muted-foreground">Date soumission</th>
                          <th className="px-5 py-3 font-medium text-muted-foreground">Période couverte</th>
                          <th className="px-5 py-3 font-medium text-muted-foreground">Statut</th>
                          <th className="px-5 py-3 font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myReports.length === 0 ? (
                          <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">Aucune soumission pour le moment.</td></tr>
                        ) : (
                          myReports.map(r => (
                            <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                              <td className="px-5 py-3">{r.dateSoumission}</td>
                              <td className="px-5 py-3">{r.periodeCouvert}</td>
                              <td className="px-5 py-3">
                                {r.statut === "Rejeté" && r.raisonRejet ? (
                                  <Tooltip>
                                    <TooltipTrigger><StatusBadge statut={r.statut} /></TooltipTrigger>
                                    <TooltipContent className="max-w-xs"><p className="text-sm">{r.raisonRejet}</p></TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <StatusBadge statut={r.statut} />
                                )}
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => setViewReport(r)} className="gap-1.5">
                                    <Eye className="w-4 h-4" /> Détails
                                  </Button>
                                  {r.statut === "Rejeté" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-1.5 border-warning text-warning hover:bg-warning/10"
                                      onClick={() => { setEditReport(r); setShowForm(true); }}
                                    >
                                      <Edit2 className="w-4 h-4" /> Modifier
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1.5"
                                    onClick={() => {
                                      exportReportToPDF(r, project.nom);
                                      toast.success("PDF généré !");
                                    }}
                                  >
                                    <Download className="w-4 h-4" /> PDF
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1.5 text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
                                    onClick={() => {
                                      exportReportToExcel(r, project.nom);
                                      toast.success("Excel généré !");
                                    }}
                                  >
                                    <Download className="w-4 h-4" /> Excel
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "bi" && (
              <div className="space-y-6 animate-fade-in-up">
                {!hasData ? (
                  <div className="bg-card rounded-lg border shadow-sm p-12 text-center">
                    <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Aucune donnée disponible. Soumettez votre premier rapport pour voir les statistiques.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        className="gap-1.5"
                        onClick={async () => {
                          toast.info("Génération du PDF…");
                          await exportBIDashboardToPDF({
                            title: `Statistiques BI — ${project.nom}`,
                            subtitle: `Chef : ${project.chefNom}`,
                            kpis: [
                              { label: "Avancement moyen", value: `${kpiStats.avancementMoyen}%` },
                              { label: "Activités totales", value: String(kpiStats.activitesTotal) },
                              { label: "Activités clôturées", value: String(kpiStats.activitesCloturees) },
                              { label: "Livrables terminés", value: `${kpiStats.livrableTermines}/${kpiStats.livrableTotal}` },
                              { label: "Réunions", value: String(kpiStats.reunions) },
                              { label: "Rapports soumis", value: String(myReports.length) },
                            ],
                            chartElementIds: ["chef-chart-monthly", "chef-chart-status", "chef-chart-livrables", "chef-chart-genre"],
                            filename: `Statistiques_${project.nom.replace(/\s+/g, "_")}.pdf`,
                          });
                          toast.success("PDF généré !");
                        }}
                      >
                        <FileDown className="w-4 h-4" /> Exporter les statistiques (PDF)
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div id="chef-chart-monthly" className="bg-card rounded-lg border shadow-sm p-5 lg:col-span-2">
                        <h4 className="text-sm font-semibold mb-4" style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}>Évolution mensuelle de mes rapports</h4>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="mois" />
                            <YAxis allowDecimals={false} />
                            <ReTooltip />
                            <Line type="monotone" dataKey="soumis" stroke="#0D4A2E" strokeWidth={2} name="Soumis" dot={{ fill: "#0D4A2E" }} />
                            <Line type="monotone" dataKey="approuves" stroke="#1D9E75" strokeWidth={2} name="Approuvés" dot={{ fill: "#1D9E75" }} />
                            <Legend />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div id="chef-chart-status" className="bg-card rounded-lg border shadow-sm p-5 min-h-[440px]">
                        <h4 className="text-sm font-semibold mb-4" style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}>Répartition des statuts de mes rapports</h4>
                        <ResponsiveContainer width="100%" height={360}>
                          <PieChart>
                            <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                              {statusData.map((_, i) => <Cell key={i} fill={GREEN_PALETTE[i]} />)}
                            </Pie>
                            <Legend />
                            <ReTooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div id="chef-chart-livrables" className="bg-card rounded-lg border shadow-sm p-5 min-h-[440px]">
                        <h4 className="text-sm font-semibold mb-4" style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}>Répartition de mes livrables par type</h4>
                        {livrableData.length === 0 ? (
                          <div className="h-[360px] flex items-center justify-center text-sm text-muted-foreground">Aucun livrable enregistré.</div>
                        ) : (
                          <ResponsiveContainer width="100%" height={360}>
                            <PieChart>
                              <Pie data={livrableData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                                {livrableData.map((_, i) => <Cell key={i} fill={GREEN_PALETTE[i % GREEN_PALETTE.length]} />)}
                              </Pie>
                              <Legend />
                              <ReTooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>

                      <div id="chef-chart-genre" className="bg-card rounded-lg border shadow-sm p-5 min-h-[440px]">
                        <h4 className="text-sm font-semibold mb-4" style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}>Répartition du personnel par genre</h4>
                        {genreData.length === 0 ? (
                          <div className="h-[360px] flex items-center justify-center text-sm text-muted-foreground">Aucune donnée de personnel disponible.</div>
                        ) : (
                          <ResponsiveContainer width="100%" height={360}>
                            <PieChart>
                              <Pie
                                data={genreData}
                                cx="50%" cy="50%"
                                innerRadius={60} outerRadius={100}
                                dataKey="value"
                                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                              >
                                <Cell fill="#0D4A2E" />
                                <Cell fill="#A8E6CF" />
                              </Pie>
                              <Legend />
                              <ReTooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeSection === "historique" && (
              <div className="space-y-6 animate-fade-in-up">
                {/* KPI cards historique */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger-children">
                  <KpiCard label="Total soumissions" value={myReports.length} icon={<FileText className="w-5 h-5" />} delay={0} />
                  <KpiCard label="Approuvés" value={myReports.filter(r => r.statut === "Approuvé").length} icon={<Activity className="w-5 h-5" />} highlight="success" delay={60} />
                  <KpiCard label="En attente" value={myReports.filter(r => r.statut === "En attente").length} icon={<Activity className="w-5 h-5" />} highlight="warning" delay={120} />
                  <KpiCard label="Rejetés" value={myReports.filter(r => r.statut === "Rejeté").length} icon={<Activity className="w-5 h-5" />} delay={180} />
                </div>

                {/* Search + filters + export */}
                <div className="flex flex-wrap gap-3 items-center justify-between">
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher par période ou date…"
                        value={historySearch}
                        onChange={e => setHistorySearch(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                    <div className="flex gap-1.5">
                      {FILTER_BUTTONS.map(f => (
                        <Button
                          key={f}
                          size="sm"
                          variant={historyFilter === f ? "default" : "outline"}
                          onClick={() => setHistoryFilter(f)}
                        >
                          {f}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {myReports.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          const map = new Map([[project.id, project.nom]]);
                          exportMultipleReportsToPDF(myReports, map, `Historique_${project.nom.replace(/\s+/g, "_")}.pdf`);
                          toast.success("Historique complet exporté en PDF !");
                        }}
                      >
                        <FileDown className="w-4 h-4" /> Historique complet (PDF)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-700 dark:hover:bg-emerald-950/40"
                        onClick={() => {
                          const map = new Map([[project.id, project.nom]]);
                          exportMultipleReportsToExcel(myReports, map, `Historique_${project.nom.replace(/\s+/g, "_")}.xlsx`);
                          toast.success("Historique complet exporté en Excel !");
                        }}
                      >
                        <FileDown className="w-4 h-4" /> Historique complet (Excel)
                      </Button>
                    </div>
                  )}
                </div>

                {/* Report cards */}
                {filteredHistory.length === 0 ? (
                  <div className="bg-card rounded-lg border shadow-sm p-12 text-center">
                    <History className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      {myReports.length === 0 ? "Aucune soumission pour le moment." : "Aucun résultat pour cette recherche."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredHistory.map(r => (
                      <div key={r.id} className="bg-card rounded-lg border shadow-sm p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-semibold text-sm">{r.periodeCouvert}</span>
                              {r.statut === "Rejeté" && r.raisonRejet ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help"><StatusBadge statut={r.statut} /></span>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p className="text-sm font-medium mb-0.5">Motif du rejet :</p>
                                    <p className="text-sm">{r.raisonRejet}</p>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <StatusBadge statut={r.statut} />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">Soumis le {r.dateSoumission}</p>
                          </div>
                          <div className="flex gap-1 shrink-0 flex-wrap">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setViewReport(r)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 text-xs px-2 h-8"
                              onClick={() => {
                                exportReportToPDF(r, project.nom);
                                toast.success("PDF généré !");
                              }}
                            >
                              <Download className="w-3.5 h-3.5" /> PDF
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 text-xs px-2 h-8 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                              onClick={() => {
                                exportReportToExcel(r, project.nom);
                                toast.success("Excel généré !");
                              }}
                            >
                              <Download className="w-3.5 h-3.5" /> Excel
                            </Button>
                          </div>
                        </div>
                        <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            {r.tab3.length} activité{r.tab3.length !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            {r.tab4.length} livrable{r.tab4.length !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {r.tab7.length} réunion{r.tab7.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        {r.tab3.length > 0 && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>Avancement moyen</span>
                              <span className="font-medium">
                                {Math.round(r.tab3.reduce((s, a) => s + (a.avancement || 0), 0) / r.tab3.length)}%
                              </span>
                            </div>
                            <Progress
                              value={Math.round(r.tab3.reduce((s, a) => s + (a.avancement || 0), 0) / r.tab3.length)}
                              className="h-1.5"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </SidebarInset>
      </div>

      <Dialog open={!!viewReport} onOpenChange={() => setViewReport(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rapport — {viewReport?.periodeCouvert}</DialogTitle>
          </DialogHeader>
          {viewReport && <ReportViewer report={viewReport} />}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default ChefDashboard;
