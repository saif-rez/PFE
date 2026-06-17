import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useReports } from "@/contexts/ReportsContext";
import { useProjects } from "@/contexts/ProjectsContext";
import AppHeader from "@/components/AppHeader";
import StatusBadge from "@/components/StatusBadge";
import ReportViewer from "@/components/ReportViewer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, X, Download } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { exportReportToPDF } from "@/lib/pdfExport";

const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { reports, approveReport, rejectReport } = useReports();
  const { projects } = useProjects();

  const report = reports.find(r => r.id === id);
  if (!report) return <div className="p-8 text-center">Rapport non trouvé.</div>;

  const project = projects.find(p => p.id === report.projectId);

  const handleApprove = async () => {
    try {
      await approveReport(report.id);
      toast.success("Rapport approuvé !");
    } catch {
      toast.error("Erreur lors de l'approbation.");
    }
  };

  const handleReject = async () => {
    const reason = prompt("Raison du rejet :");
    if (reason) {
      try {
        await rejectReport(report.id, reason);
        toast.error("Rapport rejeté.");
      } catch {
        toast.error("Erreur lors du rejet.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title={project?.nom || "Rapport"} subtitle={`Rapport — ${report.periodeCouvert}`} />

      <main className="container py-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => navigate("/admin-dashboard")} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Button>
          <div className="flex items-center gap-3">
            <StatusBadge statut={report.statut} size="md" />
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                exportReportToPDF(report, project?.nom || "Projet");
                toast.success("PDF généré !");
              }}
            >
              <Download className="w-4 h-4" /> Exporter PDF
            </Button>
            {report.statut === "En attente" && (
              <>
                <Button size="sm" onClick={handleApprove} className="gap-1 bg-success text-success-foreground hover:bg-success/90">
                  <Check className="w-4 h-4" /> Approuver
                </Button>
                <Button size="sm" variant="destructive" onClick={handleReject} className="gap-1">
                  <X className="w-4 h-4" /> Rejeter
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="bg-card rounded-lg border shadow-sm animate-fade-in-up">
          <div className="p-5 border-b">
            <h2 className="text-xl">{project?.nom}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Soumis le {report.dateSoumission} · Période: {report.periodeCouvert}
            </p>
            {report.raisonRejet && (
              <div className="mt-3 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                <strong>Raison du rejet :</strong> {report.raisonRejet}
              </div>
            )}
          </div>
          <ReportViewer report={report} />
        </div>
      </main>
    </div>
  );
};

export default ReportDetailPage;
