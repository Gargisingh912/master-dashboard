import { useAuth } from './hooks/useAuth'
import LoginPage   from './components/auth/LoginPage'
import { useOrg } from './hooks/useOrg';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/Dashboard'; 

import AgencyOverview from './components/pages/agency/overview'; // Assumes you have an index.jsx or Overview.jsx inside
import RestaurantOverview from './components/pages/kitchen/overview'; 
import SalonAppointments from './components/pages/salon/Appointments';
import SportsStudents from './components/pages/academy/Students';
export default function App() {
  const { user, org, role, niche, loading, error, login, logout } = useAuth();

  if (loading) return <div style={{ color: 'white', padding: 20 }}>Initializing...</div>;

  if (!user) return (
    <LoginPage
      onLogin={login}
      error={error}
      loading={loading}
    />
  );

  return (
    <Dashboard
      org={org}
      role={role}
      niche={niche}
      onLogout={logout}
    />
  );
}