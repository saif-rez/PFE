import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useReports } from "@/contexts/ReportsContext";
import { useProjects } from "@/contexts/ProjectsContext";
import AppHeader from "@/components/AppHeader";
import KpiCard from "@/components/KpiCard";
import UserManagement from "@/components/UserManagement";
import ProjectsManagement from "@/components/ProjectsManagement";
import StatusBadge from "@/components/StatusBadge";
import DashboardSidebar, { type SidebarItem } from "@/components/DashboardSidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FolderKanban, Clock, CheckCircle2, Wallet, Search, Check, X, Eye, Users, FileDown, BarChart3, List } from "lucide-react";
import type { MappedProject } from "@/lib/api";
import { toast } from "@/components/ui/sonner";
import { exportProjectsToPDF, exportBIDashboardToPDF } from "@/lib/pdfExport";
import { exportProjectsToExcel, exportReportToExcel } from "@/lib/excelExport";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";

const GREEN_PALETTE = ["#0D4A2E", "#1D9E75", "#A8E6CF", "#4ECDC4", "#2D8B6F", "#6FCF97"];

const AdminDashboard: React.FC = () => {
  const { reports, approveReport, rejectReport } = useReports();
  const { projects } = useProjects();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [activeSection, setActiveSection] = useState<string>("projects");
  const [selectedProject, setSelectedProject] = useState<MappedProject | null>(null);

  const pendingReports = reports.filter(r => r.statut === "En attente");
  const approvedThisSemester = reports.filter(r => r.statut === "Approuvé").length;
  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);

  const filteredProjects = useMemo(() => {
    let list = projects;
    if (search) list = list.filter(p => p.nom.toLowerCase().includes(search.toLowerCase()) || p.chefNom.toLowerCase().includes(search.toLowerCase()));
    if (filterStatus !== "all") {
      list = list.filter(p => {
        const lastReport = reports.filter(r => r.projectId === p.id).sort((a, b) => b.dateSoumission.localeCompare(a.dateSoumission))[0];
        return lastReport?.statut === filterStatus;
      });
    }
    return list;
  }, [search, filterStatus, reports, projects]);

  const handleApprove = async (id: string) => {
    try {
      await approveReport(id);
      toast.success("Rapport approuvé avec succès !");
    } catch {
      toast.error("Erreur lors de l'approbation.");
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) return;
    try {
      await rejectReport(id, rejectReason);
      setRejectingId(null);
      setRejectReason("");
      toast.error("Rapport rejeté.");
    } catch {
      toast.error("Erreur lors du rejet.");
    }
  };

  const budgetData = projects.slice(0, 8).map(p => ({
    name: p.nom.length > 18 ? p.nom.slice(0, 18) + "…" : p.nom,
    budget: Math.round(p.budget / 1000),
    depenses: Math.round(p.depenses / 1000),
  }));

  const monthlyData = useMemo(() => {
    const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    const counts: Record<string, { soumis: number; approuves: number; year: number; month: number }> = {};
    reports.forEach(r => {
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
      .map(([, v]) => ({
        mois: `${monthNames[v.month]} ${v.year}`,
        soumis: v.soumis,
        approuves: v.approuves,
      }));
  }, [reports]);

  const statusData = [
    { name: "En attente", value: reports.filter(r => r.statut === "En attente").length },
    { name: "Approuvé", value: reports.filter(r => r.statut === "Approuvé").length },
    { name: "Rejeté", value: reports.filter(r => r.statut === "Rejeté").length },
  ];

  const livrableData = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    reports.forEach(r => {
      r.tab4.forEach(l => {
        const t = l.type;
        typeCounts[t] = (typeCounts[t] || 0) + 1;
      });
    });
    return Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  }, [reports]);

  const genreData = useMemo(() => {
    let hommes = 0;
    let femmes = 0;
    reports.forEach(r => {
      r.tab8.forEach(p => {
        if (p.genre === "Homme") hommes++;
        else if (p.genre === "Femme") femmes++;
      });
    });
    return [
      { name: "Homme", value: hommes },
      { name: "Femme", value: femmes },
    ].filter(d => d.value > 0);
  }, [reports]);

  const sidebarItems: SidebarItem[] = [
    { key: "projects", label: "Vue d'ensemble", icon: FolderKanban, badge: pendingReports.length },
    { key: "bi", label: "Tableau BI", icon: BarChart3 },
    { key: "projets", label: "Projets", icon: List },
    { key: "users", label: "Utilisateurs", icon: Users },
  ];

  const sectionTitle =
    activeSection === "projects" ? "Vue d'ensemble" :
    activeSection === "bi" ? "Tableau BI" :
    activeSection === "projets" ? "Projets" :
    "Utilisateurs";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar
          items={sidebarItems}
          active={activeSection}
          onSelect={setActiveSection}
          brandSubtitle="Admin"
        />

        <SidebarInset className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 border-b bg-card/60 backdrop-blur-sm px-3 h-12 sticky top-0 z-30">
            <SidebarTrigger />
            <div className="h-5 w-px bg-border" />
            <span className="text-sm font-medium" style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}>
              {sectionTitle}
            </span>
          </div>

          <AppHeader title="Tableau de bord — Green Impact" subtitle={`Connecté en tant qu'admin`} />

          <main className="container py-6 space-y-6 animate-fade-in" key={activeSection}>
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
              <KpiCard label="Projets suivis" value={projects.length} icon={<FolderKanban className="w-5 h-5" />} delay={0} />
              <KpiCard label="Rapport en attente d'approbation" value={pendingReports.length} icon={<Clock className="w-5 h-5" />} highlight="warning" delay={80} />
              <KpiCard label="Rapports approuvés" value={approvedThisSemester} icon={<CheckCircle2 className="w-5 h-5" />} highlight="success" delay={160} />
              <KpiCard label="Budget total engagé" value={`${(totalBudget / 1000000).toFixed(1)}M TND`} icon={<Wallet className="w-5 h-5" />} delay={240} />
            </div>

            {activeSection === "projects" && (
              <div className="space-y-6 animate-fade-in-up">
                {/* Projects table */}
                <div className="bg-card rounded-lg border shadow-sm">
                  <div className="p-5 border-b flex flex-wrap gap-3 items-center justify-between">
                    <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}>Vue d'ensemble des projets</h3>
                    <div className="flex gap-2 items-center flex-wrap">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-56" />
                      </div>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous</SelectItem>
                          <SelectItem value="En attente">En attente</SelectItem>
                          <SelectItem value="Approuvé">Approuvé</SelectItem>
                          <SelectItem value="Rejeté">Rejeté</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          exportProjectsToPDF(filteredProjects, reports);
                          toast.success("PDF généré !");
                        }}
                      >
                        <FileDown className="w-4 h-4" /> Exporter (PDF)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-700 dark:hover:bg-emerald-950/40"
                        onClick={() => {
                          exportProjectsToExcel(filteredProjects, reports);
                          toast.success("Excel généré !");
                        }}
                      >
                        <FileDown className="w-4 h-4" /> Exporter (Excel)
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="px-5 py-3 font-medium text-muted-foreground">Projet</th>
                          <th className="px-5 py-3 font-medium text-muted-foreground">Chef de projet</th>
                          <th className="px-5 py-3 font-medium text-muted-foreground">Avancement (rapports)</th>
                          <th className="px-5 py-3 font-medium text-muted-foreground">Dernier rapport</th>
                          <th className="px-5 py-3 font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProjects.map(p => {
                          const lastReport = reports.filter(r => r.projectId === p.id).sort((a, b) => b.dateSoumission.localeCompare(a.dateSoumission))[0];
                          return (
                            <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                              <td className="px-5 py-3 font-medium">{p.nom}</td>
                              <td className="px-5 py-3 text-muted-foreground">{p.chefNom}</td>
                              <td className="px-5 py-3">
                                {(() => {
                                  const latest = reports
                                    .filter(r => r.projectId === p.id)
                                    .sort((a, b) => b.dateSoumission.localeCompare(a.dateSoumission))[0];
                                  if (!latest || latest.tab3.length === 0) {
                                    return <span className="text-xs text-muted-foreground">Aucun rapport</span>;
                                  }
                                  const avg = Math.round(latest.tab3.reduce((s, a) => s + (a.avancement || 0), 0) / latest.tab3.length);
                                  return (
                                    <div className="flex items-center gap-2">
                                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full" style={{ width: `${avg}%` }} />
                                      </div>
                                      <span className="tabular-nums text-muted-foreground">{avg}%</span>
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="px-5 py-3">
                                {lastReport ? <StatusBadge statut={lastReport.statut} /> : <span className="text-muted-foreground text-xs">Aucun</span>}
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-1">
                                  {lastReport && (
                                    <Button variant="ghost" size="sm" onClick={() => navigate(`/rapport/${lastReport.id}`)} className="gap-1.5">
                                      <Eye className="w-4 h-4" /> Voir rapport
                                    </Button>
                                  )}
                                  <Button variant="ghost" size="sm" onClick={() => setSelectedProject(p)} className="gap-1.5">
                                    <List className="w-4 h-4" /> Soumissions
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pending approvals */}
                {pendingReports.length > 0 && (
                  <div className="bg-card rounded-lg border shadow-sm">
                    <div className="p-5 border-b">
                      <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}>
                        Approbations en attente
                        <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-warning/10 text-warning text-xs font-bold">{pendingReports.length}</span>
                      </h3>
                    </div>
                    <div className="divide-y">
                      {pendingReports.map(r => {
                        const proj = projects.find(p => p.id === r.projectId);
                        return (
                          <div key={r.id} className="p-5 flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-medium">{proj?.nom}</p>
                              <p className="text-sm text-muted-foreground">{r.dateSoumission} · {r.periodeCouvert}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {rejectingId === r.id ? (
                                <div className="flex items-center gap-2">
                                  <Textarea
                                    placeholder="Raison du rejet…"
                                    value={rejectReason}
                                    onChange={e => setRejectReason(e.target.value)}
                                    className="w-64 h-20"
                                  />
                                  <Button size="sm" variant="destructive" onClick={() => handleReject(r.id)}>Confirmer</Button>
                                  <Button size="sm" variant="ghost" onClick={() => { setRejectingId(null); setRejectReason(""); }}>Annuler</Button>
                                </div>
                              ) : (
                                <>
                                  <Button size="sm" onClick={() => navigate(`/rapport/${r.id}`)} variant="ghost" className="gap-1"><Eye className="w-4 h-4" /></Button>
                                  <Button size="sm" onClick={() => handleApprove(r.id)} className="gap-1 bg-success text-success-foreground hover:bg-success/90"><Check className="w-4 h-4" /> Approuver</Button>
                                  <Button size="sm" variant="destructive" onClick={() => setRejectingId(r.id)} className="gap-1"><X className="w-4 h-4" /> Rejeter</Button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSection === "bi" && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    className="gap-1.5"
                    onClick={async () => {
                      toast.info("Génération du PDF…");
                      await exportBIDashboardToPDF({
                        title: "Tableau BI — Vue globale",
                        subtitle: `${projects.length} projets · ${reports.length} rapports`,
                        kpis: [
                          { label: "Projets suivis", value: String(projects.length) },
                          { label: "En attente", value: String(pendingReports.length) },
                          { label: "Approuvés", value: String(approvedThisSemester) },
                          { label: "Budget total", value: `${(totalBudget / 1000000).toFixed(1)}M TND` },
                        ],
                        chartElementIds: ["admin-chart-budget", "admin-chart-monthly", "admin-chart-status", "admin-chart-livrables", "admin-chart-genre"],
                        filename: "Tableau_BI_global.pdf",
                      });
                      toast.success("PDF généré !");
                    }}
                  >
                    <FileDown className="w-4 h-4" /> Exporter le tableau BI (PDF)
                  </Button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div id="admin-chart-budget" className="bg-card rounded-lg border shadow-sm p-5">
                    <h4 className="text-sm font-semibold mb-4" style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}>Budget alloué vs Dépenses (k TND)</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={budgetData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <ReTooltip />
                        <Bar dataKey="budget" fill="#0D4A2E" name="Budget" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="depenses" fill="#A8E6CF" name="Dépenses" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div id="admin-chart-monthly" className="bg-card rounded-lg border shadow-sm p-5">
                    <h4 className="text-sm font-semibold mb-4" style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}>Rapports soumis / approuvés par mois</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="mois" />
                        <YAxis />
                        <ReTooltip />
                        <Line type="monotone" dataKey="soumis" stroke="#0D4A2E" strokeWidth={2} name="Soumis" dot={{ fill: "#0D4A2E" }} />
                        <Line type="monotone" dataKey="approuves" stroke="#1D9E75" strokeWidth={2} name="Approuvés" dot={{ fill: "#1D9E75" }} />
                        <Legend />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div id="admin-chart-status" className="bg-card rounded-lg border shadow-sm p-5 min-h-[440px]">
                    <h4 className="text-sm font-semibold mb-4" style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}>Répartition par statut des rapports</h4>
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

                  <div id="admin-chart-livrables" className="bg-card rounded-lg border shadow-sm p-5 min-h-[440px]">
                    <h4 className="text-sm font-semibold mb-4" style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}>Répartition des livrables par type</h4>
                    <ResponsiveContainer width="100%" height={360}>
                      <PieChart>
                        <Pie data={livrableData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                          {livrableData.map((_, i) => <Cell key={i} fill={GREEN_PALETTE[i % GREEN_PALETTE.length]} />)}
                        </Pie>
                        <Legend />
                        <ReTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div id="admin-chart-genre" className="bg-card rounded-lg border shadow-sm p-5 min-h-[440px]">
                    <h4 className="text-sm font-semibold mb-4" style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}>Répartition du personnel par genre</h4>
                    {genreData.length === 0 ? (
                      <div className="h-[360px] flex items-center justify-center text-sm text-muted-foreground">
                        Aucune donnée de personnel disponible.
                      </div>
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
              </div>
            )}

            {activeSection === "projets" && (
              <div className="animate-fade-in-up">
                <ProjectsManagement />
              </div>
            )}

            {activeSection === "users" && (
              <div className="animate-fade-in-up">
                <UserManagement />
              </div>
            )}
          </main>
        </SidebarInset>
      </div>

      {/* Dialog — toutes les soumissions d'un projet */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-heading)", fontStyle: "italic" }}>
              Soumissions — {selectedProject?.nom}
            </DialogTitle>
          </DialogHeader>
          {selectedProject && (() => {
            const projectReports = reports
              .filter(r => r.projectId === selectedProject.id)
              .sort((a, b) => b.dateSoumission.localeCompare(a.dateSoumission));
            return projectReports.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Aucune soumission pour ce projet.</p>
            ) : (
              <table className="w-full text-sm mt-2">
                <thead>
                  <tr className="border-b text-left">
                    <th className="px-4 py-2 font-medium text-muted-foreground">Période</th>
                    <th className="px-4 py-2 font-medium text-muted-foreground">Date soumission</th>
                    <th className="px-4 py-2 font-medium text-muted-foreground">Statut</th>
                    <th className="px-4 py-2 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {projectReports.map(r => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2 font-medium">{r.periodeCouvert}</td>
                      <td className="px-4 py-2 text-muted-foreground">{r.dateSoumission}</td>
                      <td className="px-4 py-2"><StatusBadge statut={r.statut} /></td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedProject(null); navigate(`/rapport/${r.id}`); }} className="gap-1.5">
                            <Eye className="w-4 h-4" /> Voir
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                            onClick={() => {
                              exportReportToExcel(r, selectedProject!.nom);
                              toast.success("Excel généré !");
                            }}
                          >
                            <FileDown className="w-4 h-4" /> Excel
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default AdminDashboard;
