import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "@/lib/api";

interface User {
  id: number;
  email: string;
  role: "chef" | "admin";
  name: string;
  projectId: number | null;
  projectNom?: string;
}

export interface ApiUser {
  id: number;
  nom: string;
  email: string;
  role: string;
  projet_id: number | null;
  created_at: string;
  project?: { nom: string };
}

interface AuthContextType {
  user: User | null;
  allUsers: ApiUser[];
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  addUser: (data: { nom: string; email: string; password: string; projet_id?: number | null }) => Promise<void>;
  removeUser: (id: number) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    try { return JSON.parse(stored); } catch { return null; }
  });
  const [allUsers, setAllUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await api.get('/api/users');
      setAllUsers(data);
    } catch { /* non-admin silently fails */ }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') fetchUsers();
  }, [user?.id]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      const mappedUser: User = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role === 'admin' ? 'admin' : 'chef',
        name: data.user.nom,
        projectId: data.user.projet_id ?? null,
        projectNom: data.user.projet_nom,
      };
      localStorage.setItem('user', JSON.stringify(mappedUser));
      setUser(mappedUser);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setAllUsers([]);
  }, []);

  const addUser = useCallback(async (data: { nom: string; email: string; password: string; projet_id?: number | null }) => {
    await api.post('/api/users', { ...data, role: 'chef_projet' });
    await fetchUsers();
  }, [fetchUsers]);

  const removeUser = useCallback(async (id: number) => {
    await api.delete(`/api/users/${id}`);
    setAllUsers(prev => prev.filter(u => u.id !== id));
  }, []);

  return (
    <AuthContext.Provider value={{ user, allUsers, loading, login, logout, addUser, removeUser, refreshUsers: fetchUsers }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
