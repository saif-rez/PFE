import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import type { Report, Project } from "@/data/mockData";

const BRAND_GREEN: [number, number, number] = [13, 74, 46];
const LIGHT_GREEN: [number, number, number] = [168, 230, 207];
const TEXT_GRAY: [number, number, number] = [80, 80, 80];

/* ---------- Common helpers ---------- */

const addHeader = (doc: jsPDF, title: string, subtitle?: string) => {
  doc.setFillColor(...BRAND_GREEN);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Green Impact Platform", 14, 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(title, 14, 17);
  if (subtitle) {
    doc.setFontSize(9);
    doc.text(subtitle, doc.internal.pageSize.getWidth() - 14, 17, { align: "right" });
  }
  doc.setTextColor(0, 0, 0);
};

const addFooter = (doc: jsPDF) => {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_GRAY);
    doc.text(`Page ${i} / ${pageCount}`, pw - 14, ph - 6, { align: "right" });
    doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, 14, ph - 6);
  }
};

const sectionTitle = (doc: jsPDF, label: string, y: number): number => {
  doc.setFillColor(...LIGHT_GREEN);
  doc.rect(14, y - 5, doc.internal.pageSize.getWidth() - 28, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_GREEN);
  doc.text(label, 16, y);
  doc.setTextColor(0, 0, 0);
  return y + 6;
};

const captureElement = async (el: HTMLElement): Promise<string> => {
  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: "#ffffff",
    logging: false,
    useCORS: true,
  });
  return canvas.toDataURL("image/png");
};

/* ---------- Report export ---------- */

export const exportReportToPDF = (report: Report, projectName: string) => {
  const doc = new jsPDF("p", "mm", "a4");
  const pw = doc.internal.pageSize.getWidth();
  addHeader(doc, `Rapport semestriel — ${projectName}`, report.periodeCouvert);

  let y = 32;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_GRAY);
  doc.text(`Soumis le : ${report.dateSoumission}`, 14, y);
  doc.text(`Statut : ${report.statut}`, pw - 14, y, { align: "right" });
  doc.setTextColor(0, 0, 0);
  y += 6;

  if (report.raisonRejet) {
    doc.setFillColor(254, 226, 226);
    doc.rect(14, y, pw - 28, 10, "F");
    doc.setFontSize(9);
    doc.setTextColor(185, 28, 28);
    doc.text(`Raison du rejet : ${report.raisonRejet}`, 16, y + 6);
    doc.setTextColor(0, 0, 0);
    y += 14;
  }

  // Tab 1 — Identification
  y = sectionTitle(doc, "1. Identification du projet", y + 4);
  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: BRAND_GREEN, textColor: 255 },
    body: [
      ["N°", report.tab1.numero],
      ["Acronyme", report.tab1.acronyme],
      ["Intitulé", report.tab1.intitule],
      ["Chef de projet", report.tab1.chefNomPrenom],
      ["Laboratoire", report.tab1.laboratoire],
      ["Réseaux sociaux", report.tab1.reseauxSociaux || "—"],
    ],
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 40, fillColor: [245, 250, 247] } },
  });
  // @ts-expect-error: lastAutoTable injected by autoTable
  y = doc.lastAutoTable.finalY + 8;

  // Tab 2 — MCL
  if (report.tab2.length) {
    y = sectionTitle(doc, "2. Matrice du cadre logique", y);
    autoTable(doc, {
      startY: y,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: BRAND_GREEN, textColor: 255 },
      head: [["Objectif Spécifique", "Résultats attendus", "Activités", "Livrables"]],
      body: report.tab2.map(r => [r.objectifSpecifique, r.resultatsAttendus, r.activites, r.livrables]),
    });
    // @ts-expect-error: lastAutoTable
    y = doc.lastAutoTable.finalY + 8;
  }

  // Tab 3 — Activités
  if (report.tab3.length) {
    y = sectionTitle(doc, "3. Activités", y);
    autoTable(doc, {
      startY: y,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: BRAND_GREEN, textColor: 255 },
      head: [["OS", "Activité prévue", "Tâches réalisées", "État", "Avancement"]],
      body: report.tab3.map(r => [r.objectifSpecifique, r.activitePrevue, r.tachesRealisees, r.etat, `${r.avancement}%`]),
    });
    // @ts-expect-error: lastAutoTable
    y = doc.lastAutoTable.finalY + 8;
  }

  // Tab 4 — Livrables
  if (report.tab4.length) {
    y = sectionTitle(doc, "4. Livrables", y);
    autoTable(doc, {
      startY: y,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: BRAND_GREEN, textColor: 255 },
      head: [["Livrable", "Type", "Statut", "Dissémination"]],
      body: report.tab4.map(r => [r.livrable, r.type, r.statut, r.dissemination]),
    });
    // @ts-expect-error: lastAutoTable
    y = doc.lastAutoTable.finalY + 8;
  }

  // Tab 5 — Événements
  if (report.tab5.length) {
    y = sectionTitle(doc, "5. Événements", y);
    autoTable(doc, {
      startY: y,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: BRAND_GREEN, textColor: 255 },
      head: [["Intitulé", "Date", "Lieu", "Participants", "Public cible"]],
      body: report.tab5.map(r => [r.intitule, r.date, r.lieu, String(r.nombreParticipants), r.publicCible]),
    });
    // @ts-expect-error: lastAutoTable
    y = doc.lastAutoTable.finalY + 8;
  }

  // Tab 6 — Communication
  if (report.tab6.length) {
    y = sectionTitle(doc, "6. Communication", y);
    autoTable(doc, {
      startY: y,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: BRAND_GREEN, textColor: 255 },
      head: [["Action", "Activité concernée", "Cible"]],
      body: report.tab6.map(r => [r.action, r.activiteConcernee, r.cible]),
    });
    // @ts-expect-error: lastAutoTable
    y = doc.lastAutoTable.finalY + 8;
  }

  // Tab 7 — Réunions
  if (report.tab7.length) {
    y = sectionTitle(doc, "7. Réunions", y);
    autoTable(doc, {
      startY: y,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: BRAND_GREEN, textColor: 255 },
      head: [["Date", "Lieu", "Objet", "Partenaires"]],
      body: report.tab7.map(r => [r.date, r.lieu, r.objet, r.partenaires]),
    });
    // @ts-expect-error: lastAutoTable
    y = doc.lastAutoTable.finalY + 8;
  }

  // Tab 8 — Personnel
  if (report.tab8.length) {
    y = sectionTitle(doc, "8. Personnel contractuel", y);
    autoTable(doc, {
      startY: y,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: BRAND_GREEN, textColor: 255 },
      head: [["Nom", "Genre", "Type", "Partenaire"]],
      body: report.tab8.map(r => [r.nomPrenom, r.genre, r.typePersonnel, r.partenaire]),
    });
    // @ts-expect-error: lastAutoTable
    y = doc.lastAutoTable.finalY + 8;
  }

  // Tab 9 — Équipements
  if (report.tab9.length) {
    y = sectionTitle(doc, "9. Équipements", y);
    autoTable(doc, {
      startY: y,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: BRAND_GREEN, textColor: 255 },
      head: [["Équipement", "Type", "Laboratoire"]],
      body: report.tab9.map(r => [r.equipement, r.type, r.laboratoire]),
    });
  }

  addFooter(doc);
  doc.save(`Rapport_${projectName.replace(/\s+/g, "_")}_${report.periodeCouvert.replace(/\s+/g, "_")}.pdf`);
};

/* ---------- Multiple reports export (one PDF, page per report) ---------- */

export const exportMultipleReportsToPDF = (
  reports: Report[],
  projectsMap: Map<string, string>,
  filename = "Rapports.pdf"
) => {
  const doc = new jsPDF("p", "mm", "a4");
  addHeader(doc, "Compilation de rapports", `${reports.length} rapport(s)`);

  let y = 32;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Sommaire", 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  reports.forEach((r, i) => {
    doc.text(`${i + 1}. ${projectsMap.get(r.projectId) || r.projectId} — ${r.periodeCouvert} (${r.statut})`, 16, y);
    y += 5;
    if (y > 270) { doc.addPage(); y = 20; }
  });

  reports.forEach(r => {
    doc.addPage();
    const projName = projectsMap.get(r.projectId) || "Projet";
    addHeader(doc, projName, r.periodeCouvert);
    let yy = 32;
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_GRAY);
    doc.text(`Soumis le : ${r.dateSoumission}  ·  Statut : ${r.statut}`, 14, yy);
    doc.setTextColor(0, 0, 0);
    yy += 6;

    autoTable(doc, {
      startY: yy,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: BRAND_GREEN, textColor: 255 },
      head: [["Section", "Nb d'éléments"]],
      body: [
        ["MCL", String(r.tab2.length)],
        ["Activités", String(r.tab3.length)],
        ["Livrables", String(r.tab4.length)],
        ["Événements", String(r.tab5.length)],
        ["Communication", String(r.tab6.length)],
        ["Réunions", String(r.tab7.length)],
        ["Personnel", String(r.tab8.length)],
        ["Équipements", String(r.tab9.length)],
      ],
    });
  });

  addFooter(doc);
  doc.save(filename);
};

/* ---------- Projects table export (admin) ---------- */

export const exportProjectsToPDF = (
  projects: Project[],
  reports: Report[],
  filename = "Tableau_projets.pdf"
) => {
  const doc = new jsPDF("l", "mm", "a4");
  addHeader(doc, "Vue d'ensemble des projets", `${projects.length} projet(s)`);

  const rows = projects.map(p => {
    const last = reports
      .filter(r => r.projectId === p.id)
      .sort((a, b) => b.dateSoumission.localeCompare(a.dateSoumission))[0];
    const pct = Math.round((p.jalonsCompletes / p.jalonsTotal) * 100);
    return [
      p.nom,
      p.chefNom,
      p.categorie,
      `${(p.budget / 1000).toFixed(0)}k TND`,
      `${(p.depenses / 1000).toFixed(0)}k TND`,
      `${p.jalonsCompletes}/${p.jalonsTotal} (${pct}%)`,
      last ? last.statut : "Aucun",
      last ? last.dateSoumission : "—",
    ];
  });

  autoTable(doc, {
    startY: 28,
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: BRAND_GREEN, textColor: 255 },
    head: [["Projet", "Chef", "Catégorie", "Budget", "Dépenses", "Jalons", "Dernier rapport", "Date"]],
    body: rows,
  });

  addFooter(doc);
  doc.save(filename);
};

/* ---------- BI dashboard export ---------- */

export interface BIExportConfig {
  title: string;
  subtitle?: string;
  kpis: { label: string; value: string }[];
  chartElementIds: string[];
  filename: string;
}

export const exportBIDashboardToPDF = async (cfg: BIExportConfig) => {
  const doc = new jsPDF("p", "mm", "a4");
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  addHeader(doc, cfg.title, cfg.subtitle);

  let y = 32;

  // KPIs
  if (cfg.kpis.length) {
    y = sectionTitle(doc, "Indicateurs clés", y + 2);
    autoTable(doc, {
      startY: y,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 3, halign: "center" },
      headStyles: { fillColor: BRAND_GREEN, textColor: 255 },
      head: [cfg.kpis.map(k => k.label)],
      body: [cfg.kpis.map(k => k.value)],
    });
    // @ts-expect-error: lastAutoTable
    y = doc.lastAutoTable.finalY + 8;
  }

  // Charts
  for (const id of cfg.chartElementIds) {
    const el = document.getElementById(id);
    if (!el) continue;
    try {
      const img = await captureElement(el);
      const imgWidth = pw - 28;
      // Get natural ratio from the canvas image
      const tmp = new Image();
      tmp.src = img;
      await new Promise(res => { tmp.onload = res; });
      const ratio = tmp.height / tmp.width;
      const imgHeight = imgWidth * ratio;

      if (y + imgHeight > ph - 15) {
        doc.addPage();
        y = 20;
      }
      doc.addImage(img, "PNG", 14, y, imgWidth, imgHeight);
      y += imgHeight + 6;
    } catch (e) {
      console.warn("Capture failed for", id, e);
    }
  }

  addFooter(doc);
  doc.save(cfg.filename);
};
