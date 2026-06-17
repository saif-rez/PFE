import React from "react";
import type { Report } from "@/data/mockData";
import { cn } from "@/lib/utils";

const TAB_NAMES = [
  "Identification", "MCL", "Activités", "Livrables",
  "Événements", "Communication", "Réunions", "Contractuels", "Équipements",
];

interface ReportViewerProps {
  report: Report;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-3">
    <h4 className="font-semibold text-foreground not-italic text-sm" style={{ fontFamily: "var(--font-body)" }}>{title}</h4>
    {children}
  </div>
);

const Cell: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap">{value || "—"}</p>
  </div>
);

const ReportViewer: React.FC<ReportViewerProps> = ({ report }) => {
  const [activeTab, setActiveTab] = React.useState(0);

  const renderTab = () => {
    switch (activeTab) {
      case 0:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Cell label="N°" value={report.tab1.numero} />
            <Cell label="Acronyme" value={report.tab1.acronyme} />
            <Cell label="Intitulé" value={report.tab1.intitule} />
            <Cell label="Chef de projet" value={report.tab1.chefNomPrenom} />
            <Cell label="Laboratoire" value={report.tab1.laboratoire} />
            <Cell label="Réseaux sociaux" value={report.tab1.reseauxSociaux} />
          </div>
        );
      case 1:
        return (
          <div className="space-y-3">
            {report.tab2.map((r, i) => (
              <div key={i} className="border rounded-lg p-3 space-y-2">
                <Cell label="Objectif Spécifique" value={r.objectifSpecifique} />
                <Cell label="Résultats attendus" value={r.resultatsAttendus} />
                <Cell label="Activités" value={r.activites} />
                <Cell label="Livrables" value={r.livrables} />
              </div>
            ))}
          </div>
        );
      case 2:
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left">
                <th className="pb-2 pr-3 font-medium text-muted-foreground">OS</th>
                <th className="pb-2 pr-3 font-medium text-muted-foreground">Activité</th>
                <th className="pb-2 pr-3 font-medium text-muted-foreground">Tâches</th>
                <th className="pb-2 pr-3 font-medium text-muted-foreground">État</th>
                <th className="pb-2 font-medium text-muted-foreground">Avancement</th>
              </tr></thead>
              <tbody>
                {report.tab3.map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 pr-3">{r.objectifSpecifique}</td>
                    <td className="py-2 pr-3">{r.activitePrevue}</td>
                    <td className="py-2 pr-3">{r.tachesRealisees}</td>
                    <td className="py-2 pr-3">{r.etat}</td>
                    <td className="py-2">{r.avancement}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 3:
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left">
                <th className="pb-2 pr-3 font-medium text-muted-foreground">Livrable</th>
                <th className="pb-2 pr-3 font-medium text-muted-foreground">Type</th>
                <th className="pb-2 pr-3 font-medium text-muted-foreground">Statut</th>
                <th className="pb-2 font-medium text-muted-foreground">Dissémination</th>
              </tr></thead>
              <tbody>
                {report.tab4.map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 pr-3">{r.livrable}</td>
                    <td className="py-2 pr-3">{r.type}</td>
                    <td className="py-2 pr-3">{r.statut}</td>
                    <td className="py-2">{r.dissemination}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 4:
        return (
          <div className="space-y-3">
            {report.tab5.map((r, i) => (
              <div key={i} className="border rounded-lg p-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                <Cell label="Événement" value={r.intitule} />
                <Cell label="Date" value={r.date} />
                <Cell label="Lieu" value={r.lieu} />
                <Cell label="Participants" value={r.nombreParticipants} />
                <div className="col-span-2"><Cell label="Objectifs" value={r.objectifs} /></div>
                <Cell label="Public cible" value={r.publicCible} />
              </div>
            ))}
          </div>
        );
      case 5:
        return (
          <div className="space-y-3">
            {report.tab6.map((r, i) => (
              <div key={i} className="border rounded-lg p-3 space-y-2">
                <Cell label="Action" value={r.action} />
                <div className="grid grid-cols-2 gap-2">
                  <Cell label="Activité" value={r.activiteConcernee} />
                  <Cell label="Cible" value={r.cible} />
                </div>
              </div>
            ))}
          </div>
        );
      case 6:
        return (
          <div className="space-y-3">
            {report.tab7.map((r, i) => (
              <div key={i} className="border rounded-lg p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Cell label="Date" value={r.date} />
                  <Cell label="Lieu" value={r.lieu} />
                </div>
                <Cell label="Objet" value={r.objet} />
                <Cell label="Partenaires" value={r.partenaires} />
              </div>
            ))}
          </div>
        );
      case 7:
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left">
                <th className="pb-2 pr-3 font-medium text-muted-foreground">Nom</th>
                <th className="pb-2 pr-3 font-medium text-muted-foreground">Genre</th>
                <th className="pb-2 pr-3 font-medium text-muted-foreground">Type</th>
                <th className="pb-2 font-medium text-muted-foreground">Partenaire</th>
              </tr></thead>
              <tbody>
                {report.tab8.map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 pr-3">{r.nomPrenom}</td>
                    <td className="py-2 pr-3">{r.genre}</td>
                    <td className="py-2 pr-3">{r.typePersonnel}</td>
                    <td className="py-2">{r.partenaire}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 8:
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left">
                <th className="pb-2 pr-3 font-medium text-muted-foreground">Équipement</th>
                <th className="pb-2 pr-3 font-medium text-muted-foreground">Type</th>
                <th className="pb-2 font-medium text-muted-foreground">Laboratoire</th>
              </tr></thead>
              <tbody>
                {report.tab9.map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 pr-3">{r.equipement}</td>
                    <td className="py-2 pr-3">{r.type}</td>
                    <td className="py-2">{r.laboratoire}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div>
      <div className="border-b overflow-x-auto">
        <div className="flex min-w-max">
          {TAB_NAMES.map((name, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={cn(
                "px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                activeTab === i ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4">{renderTab()}</div>
    </div>
  );
};

export default ReportViewer;
