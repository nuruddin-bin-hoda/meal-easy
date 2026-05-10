import { Routes, Route, Navigate } from 'react-router-dom';
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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/meals"
        element={
          <PrivateRoute>
            <MealTogglePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/menu"
        element={
          <PrivateRoute>
            <MenuPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/menu"
        element={
          <PrivateRoute>
            <SetMenuPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/purchases"
        element={
          <PrivateRoute>
            <PurchasesPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/costs"
        element={
          <PrivateRoute>
            <OtherCostsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/deposits"
        element={
          <PrivateRoute>
            <DepositsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/billing"
        element={
          <PrivateRoute>
            <BillingPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/stock"
        element={
          <PrivateRoute>
            <StockPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/chefs"
        element={
          <PrivateRoute>
            <ChefsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/chefs/:id"
        element={
          <PrivateRoute>
            <ChefProfilePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/reports/:month"
        element={
          <PrivateRoute>
            <ReportPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <PrivateRoute>
            <AuditLogsPage />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
