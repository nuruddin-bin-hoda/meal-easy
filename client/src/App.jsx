import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import MealTogglePage from './pages/MealTogglePage';
import MenuPage from './pages/MenuPage';
import SetMenuPage from './pages/SetMenuPage';
import PurchasesPage from './pages/PurchasesPage';
import OtherCostsPage from './pages/OtherCostsPage';
import DepositsPage from './pages/DepositsPage';
import BillingPage from './pages/BillingPage';
import StockPage from './pages/StockPage';
import ChefsPage from './pages/ChefsPage';
import ChefProfilePage from './pages/ChefProfilePage';
import ReportPage from './pages/ReportPage';
import AuditLogsPage from './pages/AuditLogsPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';

function P({ children }) {
  return <PrivateRoute>{children}</PrivateRoute>;
}

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const isBn = (i18n.language || 'en').startsWith('bn');
    document.body.style.fontFamily = isBn
      ? "'Hind Siliguri', sans-serif"
      : "'Roboto', sans-serif";
  }, [i18n.language]);

  return (
    <Routes>
      {/* ── Public ── */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ── Shared / all roles ── */}
      <Route path="/dashboard"      element={<P><Dashboard /></P>} />
      <Route path="/meals"          element={<P><MealTogglePage /></P>} />
      <Route path="/menu"           element={<P><MenuPage /></P>} />
      <Route path="/stock"          element={<P><StockPage /></P>} />
      <Route path="/notifications"  element={<P><NotificationsPage /></P>} />
      <Route path="/profile"        element={<P><ProfilePage /></P>} />

      {/* ── Reports ── */}
      <Route
        path="/reports"
        element={<P><Navigate to={`/reports/${new Date().toISOString().slice(0, 7)}`} replace /></P>}
      />
      <Route path="/reports/:month" element={<P><ReportPage /></P>} />

      {/* ── Admin — clean paths (used by sidebar nav) ── */}
      <Route path="/users"          element={<P><UsersPage /></P>} />
      <Route path="/menu/set"       element={<P><SetMenuPage /></P>} />
      <Route path="/purchases"      element={<P><PurchasesPage /></P>} />
      <Route path="/costs"          element={<P><OtherCostsPage /></P>} />
      <Route path="/deposits"       element={<P><DepositsPage /></P>} />
      <Route path="/billing"        element={<P><BillingPage /></P>} />
      <Route path="/chefs"          element={<P><ChefsPage /></P>} />
      <Route path="/chefs/:id"      element={<P><ChefProfilePage /></P>} />
      <Route path="/audit-logs"     element={<P><AuditLogsPage /></P>} />
      <Route path="/settings"       element={<P><SettingsPage /></P>} />

      {/* ── Legacy /admin/* paths — kept for backward compatibility ── */}
      <Route path="/admin/menu"        element={<P><SetMenuPage /></P>} />
      <Route path="/admin/purchases"   element={<P><PurchasesPage /></P>} />
      <Route path="/admin/costs"       element={<P><OtherCostsPage /></P>} />
      <Route path="/admin/deposits"    element={<P><DepositsPage /></P>} />
      <Route path="/admin/billing"     element={<P><BillingPage /></P>} />
      <Route path="/admin/chefs"       element={<P><ChefsPage /></P>} />
      <Route path="/admin/chefs/:id"   element={<P><ChefProfilePage /></P>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
