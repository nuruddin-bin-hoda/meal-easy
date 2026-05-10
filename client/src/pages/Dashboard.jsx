import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import UserDashboard from '../components/dashboards/UserDashboard';
import ChefDashboard from '../components/dashboards/ChefDashboard';

export default function Dashboard() {
  const { user } = useAuth();

  if (user?.role === 'chef') return <ChefDashboard />;
  if (user?.role === 'user') return <UserDashboard />;
  return <AdminDashboard />;
}
