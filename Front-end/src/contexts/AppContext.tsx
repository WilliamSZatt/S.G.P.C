import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

export type UserRole = 'admin' | 'operator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type Page =
  | 'home' | 'login' | 'register' | 'onboarding'
  | 'forgot-password' | 'verify-email' | 'reset-password' | 'reset-success'
  | 'dashboard' | 'clients' | 'stock' | 'pos'
  | 'fiscal' | 'reports' | 'users' | 'settings'
  | 'notifications' | 'unauthorized' | 'logout-confirm';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface AppContextType {
  currentUser: User | null;
  currentPage: Page;
  navigate: (page: Page) => void;
  login: (role: UserRole) => void;
  logout: () => void;
  toast: ToastMessage | null;
  showToast: (t: Omit<ToastMessage, 'id'>) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const ADMIN_ONLY: Page[] = ['dashboard', 'fiscal', 'reports', 'users', 'settings'];

const USERS: Record<UserRole, User> = {
  admin: { id: '1', name: 'Letícia Souza', email: 'leticia.souza@mercadosilva.com.br', role: 'admin' },
  operator: { id: '2', name: 'Carlos Oliveira', email: 'carlos.oliveira@mercadosilva.com.br', role: 'operator' },
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useCallback((page: Page) => {
    if (currentUser?.role === 'operator' && ADMIN_ONLY.includes(page)) {
      setCurrentPage('unauthorized');
      return;
    }
    setCurrentPage(page);
    window.scrollTo(0, 0);
    setSidebarOpen(false);
  }, [currentUser]);

  const login = useCallback((role: UserRole) => {
    setCurrentUser(USERS[role]);
    setCurrentPage(role === 'admin' ? 'dashboard' : 'pos');
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setCurrentPage('login');
  }, []);

  const showToast = useCallback((t: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToast({ ...t, id });
    setTimeout(() => setToast(null), 4000);
  }, []);

  return (
    <AppContext.Provider value={{ currentUser, currentPage, navigate, login, logout, toast, showToast, sidebarOpen, setSidebarOpen }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be within AppProvider');
  return ctx;
}
