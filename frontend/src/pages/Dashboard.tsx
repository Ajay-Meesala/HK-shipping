import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Users, Clock, AlertTriangle,
  ChevronRight, RefreshCw, TrendingUp,
  CheckCircle2, PlusCircle, Activity
} from 'lucide-react';
import API_BASE_URL from '../utils/api';
import LiveMap, { type MapMarker } from '../components/Map/LiveMap';

interface Stats {
  activeTrips: number;
  availableDrivers: number;
  pendingDeliveries: number;
  expiringDocuments: number;
}

interface ExpiringVehicle {
  id: number;
  vehicle_number: string;
  vehicle_type: string;
  status: string;
  insurance_expiry: string;
  permit_expiry: string;
  pollution_expiry: string;
  insurance_warn: boolean;
  permit_warn: boolean;
  pollution_warn: boolean;
}

interface Trip {
  id: number;
  driver_name: string;
  vehicle_number: string;
  pickup_location: string;
  drop_location: string;
  status: string;
  goods_type: string;
  created_at: string;
}

const ACTIVITY_FEED = [
  { icon: <CheckCircle2 size={16} />, color: 'var(--color-success)', bg: 'var(--color-success-glow)', title: 'TRP-7719 Completed', desc: 'Delivered safely at Chennai Hub', time: '2 mins ago' },
  { icon: <Clock size={16} />, color: 'var(--color-amber)', bg: 'var(--color-amber-glow)', title: 'TRP-9102 In Progress', desc: 'En route Mumbai → Surat', time: '15 mins ago' },
  { icon: <PlusCircle size={16} />, color: 'var(--color-primary)', bg: 'var(--color-primary-glow)', title: 'New Trip Assigned', desc: 'TRP-8845 → David Chen', time: '45 mins ago' },
  { icon: <AlertTriangle size={16} />, color: 'var(--color-error)', bg: 'var(--color-error-glow)', title: 'Compliance Alert', desc: 'Permit expiring in 5 days', time: '1 hour ago' },
];

// Static India map locations for active trips in Leaflet (with coordinates)
const LEAFLET_MARKERS: MapMarker[] = [
  { city: 'Delhi', position: [28.6139, 77.2090], count: 4, color: '#1E3A5F' },
  { city: 'Mumbai', position: [19.0760, 72.8777], count: 6, color: '#F59E0B' },
  { city: 'Bangalore', position: [12.9716, 77.5946], count: 3, color: '#1E3A5F' },
  { city: 'Kolkata', position: [22.5726, 88.3639], count: 2, color: '#F59E0B' },
];

// Active logistics routes displayed as lines on the map
const MAP_POLYLINES = [
  {
    positions: [
      [28.6139, 77.2090], // Delhi
      [22.3072, 73.1812], // Vadodara
      [19.0760, 72.8777], // Mumbai
      [15.3647, 75.1240], // Hubli
      [12.9716, 77.5946], // Bangalore
    ] as [number, number][],
    color: '#3B82F6'
  },
  {
    positions: [
      [22.5726, 88.3639], // Kolkata
      [23.3441, 85.3096], // Ranchi
      [25.3176, 82.9739], // Varanasi
      [28.6139, 77.2090], // Delhi
    ] as [number, number][],
    color: '#F59E0B'
  }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ activeTrips: 0, availableDrivers: 0, pendingDeliveries: 0, expiringDocuments: 0 });
  const [expiringVehicles, setExpiringVehicles] = useState<ExpiringVehicle[]>([]);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [error, setError] = useState('');
  const [mapView, setMapView] = useState<'standard' | 'satellite'>('standard');

  const fetchData = async () => {
    try {
      setLoading(true); setError('');
      const [dashRes, tripsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/dashboard`),
        fetch(`${API_BASE_URL}/trips`),
      ]);
      const dashJson = await dashRes.json();
      const tripsJson = await tripsRes.json();
      if (dashJson.success) { setStats(dashJson.data.stats); setExpiringVehicles(dashJson.data.expiringVehicles); }
      if (tripsJson.success) setRecentTrips(tripsJson.data.slice(0, 5));
    } catch (e: any) {
      setError('Backend is offline — connect a database to see live data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const fmt = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' +
           date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Operations Dashboard</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Real-time logistics overview for HK Shipping fleet</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchData} style={{ fontSize: '0.8rem', gap: '0.4rem' }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {error && (
        <div className="alert-card" style={{ marginBottom: '1.5rem' }}>
          <strong>⚠ {error}</strong>
          <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
            The UI is fully rendered. Connect a PostgreSQL database to populate live data.
          </div>
        </div>
      )}

      {/* ── KPI CARDS ── */}
      <div className="dashboard-grid">
        {/* Active Trips */}
        <div className="card stat-card" onClick={() => navigate('/trips')} style={{ cursor: 'pointer' }}>
          <div className="stat-card-header">
            <div className="stat-icon primary"><Truck size={20} /></div>
            <span className="stat-trend up"><TrendingUp size={12} /> 4%</span>
          </div>
          <div>
            <div className="stat-value">{loading ? '—' : stats.activeTrips}</div>
            <div className="stat-label">Active Trips</div>
          </div>
          <div className="stat-sparkbar">
            {[40, 60, 50, 80, 60].map((h, i) => (
              <span key={i} className={i === 3 ? 'active' : ''} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        {/* Available Drivers */}
        <div className="card stat-card" onClick={() => navigate('/drivers-vehicles')} style={{ cursor: 'pointer' }}>
          <div className="stat-card-header">
            <div className="stat-icon primary"><Users size={20} /></div>
            <span className="stat-trend neutral">Stable</span>
          </div>
          <div>
            <div className="stat-value">{loading ? '—' : stats.availableDrivers}</div>
            <div className="stat-label">Available Drivers</div>
          </div>
          <div className="stat-sparkbar">
            {[60, 80, 70, 50, 60].map((h, i) => (
              <span key={i} className={i === 1 ? 'active' : ''} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        {/* Vehicles On Road */}
        <div className="card stat-card">
          <div className="stat-card-header">
            <div className="stat-icon primary"><Activity size={20} /></div>
            <span className="stat-trend up"><TrendingUp size={12} /> 12%</span>
          </div>
          <div>
            <div className="stat-value">{loading ? '—' : stats.activeTrips > 0 ? stats.activeTrips : '—'}</div>
            <div className="stat-label">Vehicles On Road</div>
          </div>
          <div className="stat-sparkbar">
            {[40, 50, 80, 70, 60].map((h, i) => (
              <span key={i} className={i === 2 ? 'active' : ''} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        {/* Pending Deliveries */}
        <div className="card stat-card" onClick={() => navigate('/trips')} style={{ cursor: 'pointer' }}>
          <div className="stat-card-header">
            <div className="stat-icon amber"><Clock size={20} /></div>
            <span className="stat-trend down" style={{ color: 'var(--color-error)' }}>+2</span>
          </div>
          <div>
            <div className="stat-value" style={{ color: '#D97706' }}>{loading ? '—' : stats.pendingDeliveries}</div>
            <div className="stat-label">Pending Deliveries</div>
          </div>
          <div className="stat-sparkbar" style={{ '--spark-color': 'var(--color-amber-glow)' } as any}>
            {[80, 60, 40, 50, 60].map((h, i) => (
              <span key={i} className={i === 0 ? 'active' : ''} style={{ height: `${h}%`, background: i === 0 ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.12)' }} />
            ))}
          </div>
        </div>

        {/* Compliance Alerts */}
        <div className="card stat-card" style={{ borderLeft: `3px solid ${stats.expiringDocuments > 0 ? 'var(--color-error)' : 'var(--border-color)'}`, background: stats.expiringDocuments > 0 ? '#FEF2F2' : undefined }}>
          <div className="stat-card-header">
            <div className="stat-icon error"><AlertTriangle size={20} /></div>
            {stats.expiringDocuments > 0 && (
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-error)', animation: 'ping 1.5s infinite' }} />
            )}
          </div>
          <div>
            <div className="stat-value" style={{ color: stats.expiringDocuments > 0 ? 'var(--color-error)' : undefined }}>{loading ? '—' : stats.expiringDocuments}</div>
            <div className="stat-label" style={{ color: stats.expiringDocuments > 0 ? '#B91C1C' : undefined }}>Compliance Alerts</div>
          </div>
          {stats.expiringDocuments > 0 && (
            <div style={{ fontSize: '0.7rem', color: '#B91C1C', marginTop: '0.5rem', fontWeight: 600 }}>
              Critical update required
            </div>
          )}
        </div>
      </div>

      {/* ── MAP + ACTIVITY FEED ── */}
      <div className="dashboard-split-grid">

        {/* India Map */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', minHeight: 380 }}>
          {/* Map Header */}
          <div style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'linear-gradient(to bottom, white, transparent)',
            position: 'relative', zIndex: 2
          }}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.95rem' }}>Live Fleet Tracking</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Real-time distribution across India</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => setMapView('satellite')} 
                className={`btn ${mapView === 'satellite' ? 'btn-primary' : 'btn-secondary'}`} 
                style={{ fontSize: '0.7rem', padding: '0.3rem 0.75rem', borderRadius: '6px' }}
              >
                Satellite
              </button>
              <button 
                onClick={() => setMapView('standard')} 
                className={`btn ${mapView === 'standard' ? 'btn-primary' : 'btn-secondary'}`} 
                style={{ fontSize: '0.7rem', padding: '0.3rem 0.75rem', borderRadius: '6px' }}
              >
                Standard
              </button>
            </div>
          </div>

          {/* Map Body */}
          <div 
            style={{ 
              background: mapView === 'standard' ? '#EFF6FF' : '#0B132B', 
              position: 'relative', 
              height: 300, 
              overflow: 'hidden',
              transition: 'all 0.5s ease',
              borderRadius: '0 0 12px 12px'
            }}
          >
            <LiveMap 
              markers={LEAFLET_MARKERS} 
              polylines={MAP_POLYLINES} 
              mapView={mapView} 
            />
          </div>
        </div>

        {/* Activity Feed */}
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', minHeight: 380 }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.95rem' }}>Recent Activity</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
            {ACTIVITY_FEED.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.875rem', padding: '0.75rem 0.5rem', borderBottom: i < ACTIVITY_FEED.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: item.color }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--text-primary)', marginBottom: '0.15rem' }}>{item.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{item.desc}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{item.time}</div>
                </div>
              </div>
            ))}

            {/* Live alerts from backend */}
            {expiringVehicles.slice(0, 2).map((v) => (
              <div key={v.id} style={{ display: 'flex', gap: '0.875rem', padding: '0.75rem 0.5rem', borderTop: '1px solid #F1F5F9' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-error-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--color-error)' }}>
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--text-primary)', marginBottom: '0.15rem' }}>Compliance Alert</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{v.vehicle_number} — document expiring</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RECENT TRIPS TABLE ── */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1rem' }}>Recent Trips</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Manage and monitor all active freight movements</div>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/trips')} style={{ fontSize: '0.8rem' }}>
            View All <ChevronRight size={15} />
          </button>
        </div>

        {loading ? (
          <div className="loader-container"><div className="spinner" /></div>
        ) : recentTrips.length === 0 ? (
          <div className="empty-state">
            <p>No trips yet. <button className="btn btn-amber" onClick={() => navigate('/trip-board')} style={{ marginLeft: '0.5rem', fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}>Assign First Trip</button></p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Trip ID</th><th>Driver</th><th>Vehicle</th>
                  <th>Pickup → Destination</th><th>Cargo</th>
                  <th>Date & Time</th><th>Status</th><th>POD</th><th></th>
                </tr>
              </thead>
              <tbody>
                {recentTrips.map(trip => (
                  <tr key={trip.id} onClick={() => navigate(`/trips/${trip.id}`)} style={{ cursor: 'pointer' }}>
                    <td><strong style={{ color: 'var(--color-primary)' }}>TRP-{String(trip.id).padStart(4, '0')}</strong></td>
                    <td>{trip.driver_name || '—'}</td>
                    <td>{trip.vehicle_number || '—'}</td>
                    <td style={{ maxWidth: 200 }}>
                      <span style={{ color: 'var(--text-primary)' }}>{trip.pickup_location}</span>
                      <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>→</span>
                      <span>{trip.drop_location}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{trip.goods_type}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{fmt(trip.created_at)}</td>
                    <td><span className={`badge badge-${trip.status}`}>{trip.status.replace('_', ' ')}</span></td>
                    <td>
                      {trip.status === 'completed'
                        ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-success)', fontSize: '0.8rem', fontWeight: 600 }}><CheckCircle2 size={14} /> Verified</span>
                        : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>Pending</span>
                      }
                    </td>
                    <td><ChevronRight size={16} color="var(--text-muted)" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Showing 1–{recentTrips.length} of {recentTrips.length} trips
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" disabled style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', opacity: 0.5 }}>Previous</button>
            <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
