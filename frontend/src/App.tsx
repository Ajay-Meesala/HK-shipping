import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Route as RouteIcon,
  Users,
  Truck,
  LogOut,
  Compass,
  PlusCircle,
  ClipboardList,
  Menu,
  X,
} from 'lucide-react';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TripBoard from './pages/TripBoard';
import Trips from './pages/Trips';
import TripDetail from './pages/TripDetail';
import DriversVehicles from './pages/DriversVehicles';
import Reports from './pages/Reports';
import HelpCenter from './pages/HelpCenter';

// Driver pages & layout
import DriverDashboard from './pages/DriverDashboard';
import DriverBookings from './pages/DriverBookings';
import DriverLayout from './components/DriverLayout';

// Auth
import { useAuth } from './context/AuthContext';

// ─── Role label map ─────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  admin:      'Admin',
  dispatcher: 'Dispatcher',
  driver:     'Driver',
  accounts:   'Accounts Staff',
  compliance: 'Compliance Manager',
  driver:     'Driver / Trader',
};

// ─── Local "mock" user state for demo-mode logins ──────────────────────────
// When Firebase Auth is not configured (no real user account), the Login page
// falls back to demo-mode and calls onLogin with local state.
interface LocalUser {
  email: string;
  role: string;
  name: string;
}

// ─── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const { user: firebaseUser, loading: authLoading, logout } = useAuth();

  // local user is used when Firebase auth falls back to demo mode
  const [localUser, setLocalUser] = useState<LocalUser | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ── Derive active user ───────────────────────────────────────────────────
  // Firebase user takes precedence; localUser is the demo-mode fallback.
  const activeEmail = firebaseUser?.email || localUser?.email || null;
  const activeRole  = firebaseUser?.role  || localUser?.role  || null;
  const activeName  = firebaseUser?.displayName || localUser?.name || null;
  const isLoggedIn  = !!(activeEmail && activeRole);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleLogin = (email: string, role: string, name: string) => {
    // Firebase AuthContext already has the user; this callback sets localUser
    // for demo-mode sessions where Firebase returned an error.
    if (!firebaseUser) {
      setLocalUser({ email, role, name });
    }
  };

  const handleLogout = async () => {
    await logout();
    setLocalUser(null);
    setIsSidebarOpen(false);
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  // ── Auth loading splash ──────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Loading HK Shipping…</div>
        </div>
      </div>
    );
  }

  // ── Not logged in ────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  // ── DRIVER ROLE ────────────────────────────────────────────────────────
  if (activeRole === 'driver') {
    return (
      <BrowserRouter>
        <DriverLayout onLogout={handleLogout}>
          <Routes>
            <Route path="/"            element={<DriverDashboard />} />
            <Route path="/my-bookings" element={<DriverBookings />} />
            <Route path="/track"       element={<DriverDashboard />} />
            <Route path="/trips"       element={<Trips />} />
            <Route path="/trips/:id"   element={<TripDetail />} />
            <Route path="/help-center" element={<HelpCenter />} />
            <Route path="*"            element={<Navigate to="/" replace />} />
          </Routes>
        </DriverLayout>
      </BrowserRouter>
    );
  }

  // ── ADMIN / DISPATCHER ROLE (original layout — unchanged) ────────────────
  const name     = activeName || 'Admin';
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <BrowserRouter>
      <div className="app-container">

        {/* Backdrop for mobile drawer */}
        {isSidebarOpen && (
          <div className="sidebar-backdrop" onClick={closeSidebar}></div>
        )}

        {/* ── SIDEBAR ── */}
        <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
          {/* Brand */}
          <div className="sidebar-brand" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="sidebar-brand-icon">
                <Truck size={22} color="#1E3A5F" />
              </div>
              <span className="sidebar-brand-name">HK Shipping</span>
            </div>
            <button className="sidebar-close-btn" onClick={closeSidebar} title="Close Menu">
              <X size={20} color="white" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="sidebar-nav">
            <ul className="nav-links">
              <li>
                <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeSidebar}>
                  <LayoutDashboard size={18} /><span>Dashboard</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/trips" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeSidebar}>
                  <RouteIcon size={18} /><span>Active Trips</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/trip-board" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeSidebar}>
                  <PlusCircle size={18} /><span>Assign Trip</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/drivers-vehicles" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeSidebar}>
                  <Users size={18} /><span>Fleet Board</span>
                </NavLink>
              </li>
            </ul>

            <div className="sidebar-section-label">Support</div>
            <ul className="nav-links">
              <li>
                <NavLink to="/reports" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeSidebar}>
                  <ClipboardList size={18} /><span>Reports</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/help-center" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeSidebar}>
                  <Compass size={18} /><span>Help Center</span>
                </NavLink>
              </li>
            </ul>
          </nav>

          {/* User Profile */}
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initials}</div>
            <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <div className="sidebar-user-name">{name}</div>
              <div className="sidebar-user-role">{ROLE_LABELS[activeRole] || activeRole}</div>
            </div>
            <button className="sidebar-signout-btn" onClick={handleLogout} title="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="main-content">
          {/* Top Bar */}
          <header className="topbar">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button className="sidebar-toggle-btn" onClick={() => setIsSidebarOpen(true)} title="Open Menu">
                <Menu size={22} />
              </button>
              <div>
                <div className="topbar-title">Command Center</div>
                <div className="topbar-subtitle">Fleet Overview — HK Shipping</div>
              </div>
            </div>
            <div className="topbar-right">
              <button
                className="btn btn-amber"
                onClick={() => window.location.href = '/trip-board'}
                style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
              >
                <PlusCircle size={16} /> Create Trip
              </button>
            </div>
          </header>

          {/* Pages */}
          <div className="page-area">
            <Routes>
              <Route path="/"                   element={<Dashboard />} />
              <Route path="/trip-board"         element={<TripBoard />} />
              <Route path="/trips"              element={<Trips />} />
              <Route path="/trips/:id"          element={<TripDetail />} />
              <Route path="/drivers-vehicles"   element={<DriversVehicles />} />
              <Route path="/reports"            element={<Reports />} />
              <Route path="/help-center"        element={<HelpCenter />} />
              <Route path="*"                   element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>

      </div>
    </BrowserRouter>
  );
}
