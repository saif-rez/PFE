import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api, { mapProject, type MappedProject } from "@/lib/api";
import { useAuth } from "./AuthContext";

interface ProjectsContextType {
  projects: MappedProject[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const ProjectsContext = createContext<ProjectsContextType | null>(null);

export const ProjectsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<MappedProject[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/projects');
      setProjects(data.map(mapProject));
    } catch (err) {
      console.error('Failed to fetch projects', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchProjects();
    else setProjects([]);
  }, [user?.id]);

  return (
    <ProjectsContext.Provider value={{ projects, loading, refresh: fetchProjects }}>
      {children}
    </ProjectsContext.Provider>
  );
};

export const useProjects = () => {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error("useProjects must be inside ProjectsProvider");
  return ctx;
};
