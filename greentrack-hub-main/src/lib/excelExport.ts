import * as XLSX from "xlsx";
import type { Report } from "@/data/mockData";
import type { MappedProject } from "@/lib/api";

// ── Style helpers ──────────────────────────────────────────────────────────────

const HEADER_STYLE = {
  font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
  fill: { fgColor: { rgb: "0D4A2E" }, patternType: "solid" },
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
  border: {
    top: { style: "thin", color: { rgb: "CCCCCC" } },
    bottom: { style: "thin", color: { rgb: "CCCCCC" } },
    left: { style: "thin", color: { rgb: "CCCCCC" } },
    right: { style: "thin", color: { rgb: "CCCCCC" } },
  },
};

const LABEL_STYLE = {
  font: { bold: true, sz: 10, color: { rgb: "0D4A2E" } },
  fill: { fgColor: { rgb: "F0FAF5" }, patternType: "solid" },
  alignment: { vertical: "center", wrapText: true },
};

const VALUE_STYLE = {
  font: { sz: 10 },
  alignment: { vertical: "center", wrapText: true },
};

const ALT_ROW_STYLE = {
  font: { sz: 10 },
  fill: { fgColor: { rgb: "F7FAF8" }, patternType: "solid" },
  alignment: { vertical: "center", wrapText: true },
};

function applyStyle(ws: XLSX.WorkSheet, ref: string, style: object) {
  if (!ws[ref]) ws[ref] = { v: "", t: "s" };
  ws[ref].s = style;
}

function styleRange(ws: XLSX.WorkSheet, range: XLSX.Range, isHeader: boolean, altRows = false) {
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const ref = XLSX.utils.encode_cell({ r: R, c: C });
      const style = isHeader
        ? HEADER_STYLE
        : altRows && R % 2 === 0
          ? ALT_ROW_STYLE
          : VALUE_STYLE;
      applyStyle(ws, ref, style);
    }
  }
}

function autoWidths(ws: XLSX.WorkSheet, data: (string | number)[][]): { wch: number }[] {
  const cols: number[] = [];
  data.forEach(row =>
    row.forEach((cell, c) => {
      const len = String(cell ?? "").length;
      cols[c] = Math.min(60, Math.max(cols[c] ?? 8, len + 2));
    })
  );
  return cols.map(w => ({ wch: w }));
}

function makeSheet(headers: string[], rows: (string | number)[][]): XLSX.WorkSheet {
  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Header row style
  const headerRange: XLSX.Range = { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } };
  styleRange(ws, headerRange, true);

  // Data rows style (alternating)
  if (rows.length > 0) {
    const dataRange: XLSX.Range = { s: { r: 1, c: 0 }, e: { r: rows.length, c: headers.length - 1 } };
    styleRange(ws, dataRange, false, true);
  }

  // Auto column widths
  ws["!cols"] = autoWidths(ws, data);

  // Freeze header row
  ws["!freeze"] = { xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft", state: "frozen" };

  return ws;
}

function makeIdentificationSheet(report: Report): XLSX.WorkSheet {
  const rows: [string, string][] = [
    ["N° Projet", report.tab1.numero],
    ["Acronyme", report.tab1.acronyme],
    ["Intitulé", report.tab1.intitule],
    ["Chef de projet", report.tab1.chefNomPrenom],
    ["Laboratoire", report.tab1.laboratoire],
    ["Réseaux sociaux", report.tab1.reseauxSociaux || "—"],
    ["Période couverte", report.periodeCouvert],
    ["Date de soumission", report.dateSoumission],
    ["Statut", report.statut],
  ];

  const ws = XLSX.utils.aoa_to_sheet([["Champ", "Valeur"], ...rows]);

  // Style header
  applyStyle(ws, "A1", HEADER_STYLE);
  applyStyle(ws, "B1", HEADER_STYLE);

  // Style data rows
  rows.forEach((_, i) => {
    applyStyle(ws, XLSX.utils.encode_cell({ r: i + 1, c: 0 }), LABEL_STYLE);
    applyStyle(ws, XLSX.utils.encode_cell({ r: i + 1, c: 1 }), VALUE_STYLE);
  });

  ws["!cols"] = [{ wch: 22 }, { wch: 55 }];
  return ws;
}

// ── Single report export ───────────────────────────────────────────────────────

export const exportReportToExcel = (report: Report, projectName: string) => {
  const wb = XLSX.utils.book_new();

  // Metadata
  wb.Props = {
    Title: `Rapport ${projectName} — ${report.periodeCouvert}`,
    Subject: "Green Impact Platform",
    Author: "Green Impact Platform",
    CreatedDate: new Date(),
  };

  // Sheet 1 — Identification
  XLSX.utils.book_append_sheet(wb, makeIdentificationSheet(report), "1. Identification");

  // Sheet 2 — MCL
  if (report.tab2.length) {
    XLSX.utils.book_append_sheet(
      wb,
      makeSheet(
        ["Objectif Spécifique", "Résultats attendus", "Activités", "Livrables"],
        report.tab2.map(r => [r.objectifSpecifique, r.resultatsAttendus, r.activites, r.livrables])
      ),
      "2. MCL"
    );
  }

  // Sheet 3 — Activités
  if (report.tab3.length) {
    XLSX.utils.book_append_sheet(
      wb,
      makeSheet(
        ["Obj. Spécifique", "Activité prévue", "Tâches réalisées", "État", "Avancement (%)"],
        report.tab3.map(r => [r.objectifSpecifique, r.activitePrevue, r.tachesRealisees, r.etat, r.avancement])
      ),
      "3. Activités"
    );
  }

  // Sheet 4 — Livrables
  if (report.tab4.length) {
    XLSX.utils.book_append_sheet(
      wb,
      makeSheet(
        ["Livrable", "Type", "Statut", "Dissémination"],
        report.tab4.map(r => [r.livrable, r.type, r.statut, r.dissemination])
      ),
      "4. Livrables"
    );
  }

  // Sheet 5 — Événements
  if (report.tab5.length) {
    XLSX.utils.book_append_sheet(
      wb,
      makeSheet(
        ["Intitulé", "Objectifs", "Date", "Lieu", "Participants", "Public cible"],
        report.tab5.map(r => [r.intitule, r.objectifs, r.date, r.lieu, r.nombreParticipants, r.publicCible])
      ),
      "5. Événements"
    );
  }

  // Sheet 6 — Communication
  if (report.tab6.length) {
    XLSX.utils.book_append_sheet(
      wb,
      makeSheet(
        ["Action", "Activité concernée", "Cible"],
        report.tab6.map(r => [r.action, r.activiteConcernee, r.cible])
      ),
      "6. Communication"
    );
  }

  // Sheet 7 — Réunions
  if (report.tab7.length) {
    XLSX.utils.book_append_sheet(
      wb,
      makeSheet(
        ["Date", "Lieu", "Objet", "Partenaires"],
        report.tab7.map(r => [r.date, r.lieu, r.objet, r.partenaires])
      ),
      "7. Réunions"
    );
  }

  // Sheet 8 — Personnel
  if (report.tab8.length) {
    XLSX.utils.book_append_sheet(
      wb,
      makeSheet(
        ["Nom & Prénom", "Genre", "Type de personnel", "Partenaire"],
        report.tab8.map(r => [r.nomPrenom, r.genre, r.typePersonnel, r.partenaire])
      ),
      "8. Personnel"
    );
  }

  // Sheet 9 — Équipements
  if (report.tab9.length) {
    XLSX.utils.book_append_sheet(
      wb,
      makeSheet(
        ["Équipement", "Type", "Laboratoire"],
        report.tab9.map(r => [r.equipement, r.type, r.laboratoire])
      ),
      "9. Équipements"
    );
  }

  const filename = `Rapport_${projectName.replace(/\s+/g, "_")}_${report.periodeCouvert.replace(/\s+/g, "_")}.xlsx`;
  XLSX.writeFile(wb, filename);
};

// ── Multiple reports export ────────────────────────────────────────────────────

export const exportMultipleReportsToExcel = (
  reports: Report[],
  projectsMap: Map<string, string>,
  filename = "Rapports.xlsx"
) => {
  const wb = XLSX.utils.book_new();

  wb.Props = {
    Title: "Compilation de rapports",
    Subject: "Green Impact Platform",
    Author: "Green Impact Platform",
    CreatedDate: new Date(),
  };

  // Summary sheet
  const summaryRows = reports.map((r, i) => [
    i + 1,
    projectsMap.get(r.projectId) || r.projectId,
    r.periodeCouvert,
    r.dateSoumission,
    r.statut,
    r.tab3.length > 0
      ? Math.round(r.tab3.reduce((s, a) => s + (a.avancement || 0), 0) / r.tab3.length)
      : 0,
    r.tab3.length,
    r.tab4.length,
    r.tab7.length,
    r.tab8.length,
  ]);

  XLSX.utils.book_append_sheet(
    wb,
    makeSheet(
      ["#", "Projet", "Période", "Date soumission", "Statut", "Avancement moy. (%)", "Activités", "Livrables", "Réunions", "Personnel"],
      summaryRows
    ),
    "Résumé"
  );

  // One sheet per report (condensed)
  reports.forEach((r, i) => {
    const projName = projectsMap.get(r.projectId) || `Projet ${i + 1}`;
    const sheetName = `${i + 1}. ${projName}`.slice(0, 31); // Excel sheet name max 31 chars

    const infoRows: (string | number)[][] = [
      ["Projet", projName],
      ["Période", r.periodeCouvert],
      ["Soumis le", r.dateSoumission],
      ["Statut", r.statut],
      ["", ""],
      ["Section", "Nb d'éléments"],
      ["Activités", r.tab3.length],
      ["Livrables", r.tab4.length],
      ["Événements", r.tab5.length],
      ["Réunions", r.tab7.length],
      ["Personnel", r.tab8.length],
      ["Équipements", r.tab9.length],
    ];

    const ws = XLSX.utils.aoa_to_sheet(infoRows);

    // Style info labels
    [0, 1, 2, 3].forEach(row => {
      applyStyle(ws, XLSX.utils.encode_cell({ r: row, c: 0 }), LABEL_STYLE);
      applyStyle(ws, XLSX.utils.encode_cell({ r: row, c: 1 }), VALUE_STYLE);
    });

    // Style section header
    applyStyle(ws, XLSX.utils.encode_cell({ r: 5, c: 0 }), HEADER_STYLE);
    applyStyle(ws, XLSX.utils.encode_cell({ r: 5, c: 1 }), HEADER_STYLE);

    [6, 7, 8, 9, 10, 11].forEach((row, idx) => {
      applyStyle(ws, XLSX.utils.encode_cell({ r: row, c: 0 }), LABEL_STYLE);
      applyStyle(ws, XLSX.utils.encode_cell({ r: row, c: 1 }), idx % 2 === 0 ? ALT_ROW_STYLE : VALUE_STYLE);
    });

    ws["!cols"] = [{ wch: 20 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  XLSX.writeFile(wb, filename);
};

// ── Projects table export (admin) ─────────────────────────────────────────────

export const exportProjectsToExcel = (
  projects: MappedProject[],
  reports: Report[],
  filename = "Tableau_projets.xlsx"
) => {
  const wb = XLSX.utils.book_new();

  wb.Props = {
    Title: "Vue d'ensemble des projets",
    Subject: "Green Impact Platform",
    Author: "Green Impact Platform",
    CreatedDate: new Date(),
  };

  const rows = projects.map(p => {
    const last = reports
      .filter(r => r.projectId === p.id)
      .sort((a, b) => b.dateSoumission.localeCompare(a.dateSoumission))[0];
    const pct = p.jalonsTotal > 0 ? Math.round((p.jalonsCompletes / p.jalonsTotal) * 100) : 0;
    return [
      p.nom,
      p.acronyme,
      p.chefNom,
      p.chefEmail,
      p.categorie,
      p.laboratoire,
      p.statut,
      Math.round(p.budget),
      Math.round(p.depenses),
      `${p.jalonsCompletes}/${p.jalonsTotal} (${pct}%)`,
      p.dateDebut || "—",
      last ? last.statut : "Aucun",
      last ? last.dateSoumission : "—",
      last ? last.periodeCouvert : "—",
    ];
  });

  XLSX.utils.book_append_sheet(
    wb,
    makeSheet(
      ["Projet", "Acronyme", "Chef", "Email chef", "Catégorie", "Laboratoire", "Statut", "Budget (TND)", "Dépenses (TND)", "Jalons", "Date début", "Dernier rapport", "Date rapport", "Période"],
      rows
    ),
    "Projets"
  );

  XLSX.writeFile(wb, filename);
};
