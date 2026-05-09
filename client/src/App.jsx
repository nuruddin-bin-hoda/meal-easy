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
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
