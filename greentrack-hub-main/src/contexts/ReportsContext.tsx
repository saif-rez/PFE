import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api, { mapSubmission } from "@/lib/api";
import type { Report } from "@/data/mockData";
import { useAuth } from "./AuthContext";

interface ReportsContextType {
  reports: Report[];
  loading: boolean;
  addReport: (report: Report) => Promise<void>;
  updateReport: (id: string, report: Report) => Promise<void>;
  approveReport: (id: string) => Promise<void>;
  rejectReport: (id: string, reason: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const ReportsContext = createContext<ReportsContextType | null>(null);

export const ReportsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/submissions');
      setReports(data.map(mapSubmission));
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchReports();
    else setReports([]);
  }, [user?.id]);

  const addReport = useCallback(async (report: Report) => {
    await api.post('/api/submissions', {
      periode: report.periodeCouvert,
      rapport_data: {
        tab1: report.tab1, tab2: report.tab2, tab3: report.tab3,
        tab4: report.tab4, tab5: report.tab5, tab6: report.tab6,
        tab7: report.tab7, tab8: report.tab8, tab9: report.tab9,
      }
    });
    await fetchReports();
  }, [fetchReports]);

  const updateReport = useCallback(async (id: string, report: Report) => {
    await api.put(`/api/submissions/${id}`, {
      periode: report.periodeCouvert,
      rapport_data: {
        tab1: report.tab1, tab2: report.tab2, tab3: report.tab3,
        tab4: report.tab4, tab5: report.tab5, tab6: report.tab6,
        tab7: report.tab7, tab8: report.tab8, tab9: report.tab9,
      }
    });
    await fetchReports();
  }, [fetchReports]);

  const approveReport = useCallback(async (id: string) => {
    await api.patch(`/api/submissions/${id}/approve`);
    setReports(prev => prev.map(r => r.id === id ? { ...r, statut: 'Approuvé' as const } : r));
  }, []);

  const rejectReport = useCallback(async (id: string, reason: string) => {
    await api.patch(`/api/submissions/${id}/reject`, { commentaire_rejet: reason });
    setReports(prev => prev.map(r => r.id === id ? { ...r, statut: 'Rejeté' as const, raisonRejet: reason } : r));
  }, []);

  return (
    <ReportsContext.Provider value={{ reports, loading, addReport, updateReport, approveReport, rejectReport, refresh: fetchReports }}>
      {children}
    </ReportsContext.Provider>
  );
};

export const useReports = () => {
  const ctx = useContext(ReportsContext);
  if (!ctx) throw new Error("useReports must be inside ReportsProvider");
  return ctx;
};
