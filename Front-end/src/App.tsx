import { AppProvider, useApp } from './contexts/AppContext';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import StockPage from './pages/StockPage';
import POSPage from './pages/POSPage';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Unauthorized from './pages/Unauthorized';

function AppContent() {
  const { currentPage, currentUser } = useApp();

  // Public pages
  if (currentPage === 'home') return <Home />;
  if (currentPage === 'login') return <Login />;
  if (currentPage === 'register') return <Register />;
  if (currentPage === 'onboarding') return <Onboarding />;
  if (currentPage === 'forgot-password') return <ForgotPassword />;
  if (currentPage === 'verify-email') return <ForgotPassword />;
  if (currentPage === 'reset-password') return <ForgotPassword />;
  if (currentPage === 'reset-success') return <ForgotPassword />;

  // Redirect to login if not authenticated
  if (!currentUser) return <Login />;

  // Authenticated pages (logout-confirm shows modal overlay on the default page)
  const isAdmin = currentUser.role === 'admin';
  const defaultPage = isAdmin ? <Dashboard /> : <POSPage />;

  if (currentPage === 'unauthorized') return <Unauthorized />;
  if (currentPage === 'dashboard') return isAdmin ? <Dashboard /> : <Unauthorized />;
  if (currentPage === 'clients') return <Clients />;
  if (currentPage === 'stock') return <StockPage />;
  if (currentPage === 'pos') return <POSPage />;
  if (currentPage === 'reports') return isAdmin ? <Reports /> : <Unauthorized />;
  if (currentPage === 'users') return isAdmin ? <Users /> : <Unauthorized />;
  if (currentPage === 'settings') return <Settings />;
  if (currentPage === 'notifications') return <Notifications />;
  if (currentPage === 'logout-confirm') return defaultPage; // LogoutConfirm modal renders on top in AuthLayout

  return defaultPage;
}

export default function App() {
  return (
    <AppProvider>
      <div className="size-full">
        <AppContent />
      </div>
    </AppProvider>
  );
}
