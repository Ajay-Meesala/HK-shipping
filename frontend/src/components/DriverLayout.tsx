import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Truck,
  LayoutDashboard,
  ClipboardList,
  Compass,
  LogOut,
  Menu,
  X,
  Package,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DriverLayout({ children, onLogout }: { children: React.ReactNode; onLogout: () => void }) {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const closeSidebar = () => setIsSidebarOpen(false);

  // Build initials from displayName
  const name = user?.displayName || 'Customer';
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="app-container">

      {/* Backdrop */}
      {isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={closeSidebar} />
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

        {/* Customer Portal Badge */}
        <div style={{ padding: '0.5rem 1.25rem' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            background: 'rgba(245,158,11,0.18)', color: '#F59E0B',
            fontSize: '0.65rem', fontWeight: 700, padding: '3px 10px',
            borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.08em',
            border: '1px solid rgba(245,158,11,0.3)',
          }}>
            <Package size={10} /> Driver Portal
          </span>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <ul className="nav-links">
            <li>
              <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeSidebar}>
                <LayoutDashboard size={18} /><span>My Dashboard</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/my-bookings" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeSidebar}>
                <ClipboardList size={18} /><span>My Bookings</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/track" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={() => setIsSidebarOpen(false)}>
                <MapPin size={18} /><span>Track Consignment</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/trips" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={() => setIsSidebarOpen(false)}>
                <Truck size={18} /><span>My Trips (POD)</span>
              </NavLink>
            </li>
          </ul>

          <div className="sidebar-section-label">Support</div>
          <ul className="nav-links">
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
            <div className="sidebar-user-role">Driver / Trader</div>
          </div>
          <button className="sidebar-signout-btn" onClick={onLogout} title="Sign out">
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
              <div className="topbar-title">Driver Portal</div>
              <div className="topbar-subtitle">Freight Bookings & Tracking — HK Shipping</div>
            </div>
          </div>
          <div className="topbar-right">
            <span style={{
              fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)',
              background: 'var(--color-primary-glow)', padding: '0.3rem 0.75rem',
              borderRadius: '9999px', border: '1px solid rgba(30,58,95,0.15)',
            }}>
              👋 {name.split(' ')[0]}
            </span>
          </div>
        </header>

        {/* Page Area */}
        <div className="page-area">
          {children}
        </div>
      </main>
    </div>
  );
}
