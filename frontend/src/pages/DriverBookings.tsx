import { useState, useEffect } from 'react';
import { ClipboardList, RefreshCw, AlertTriangle } from 'lucide-react';
import API_BASE_URL from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface Booking {
  id: number;
  customer_name: string;
  origin: string;
  destination: string;
  goods_type: string;
  weight: string;
  preferred_date: string | null;
  status: 'pending' | 'confirmed' | 'dispatched' | 'in_transit' | 'delivered' | 'cancelled';
  created_at: string;
}

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  pending:    { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  confirmed:  { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  dispatched: { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
  in_transit: { bg: '#FFF7ED', color: '#EA580C', border: '#FDBA74' },
  delivered:  { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
  cancelled:  { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
};

const ALL_STATUSES = ['all', 'pending', 'confirmed', 'dispatched', 'in_transit', 'delivered', 'cancelled'];

export default function DriverBookings() {
  const { user } = useAuth();
  const [bookings,  setBookings]  = useState<Booking[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('all');
  const [error,     setError]     = useState('');

  const fetchBookings = async () => {
    try {
      setLoading(true); setError('');
      const headers: Record<string, string> = {};
      if (user?.idToken) headers['Authorization'] = `Bearer ${user.idToken}`;
      const res  = await fetch(`${API_BASE_URL}/bookings`, { headers });
      const data = await res.json();
      if (data.success) setBookings(data.data);
      else setError('Failed to load bookings.');
    } catch {
      setError('Backend is offline — connect a database to see live data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">My Bookings</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>All your freight booking requests with HK Shipping</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchBookings} style={{ fontSize: '0.8rem', gap: '0.4rem' }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {error && (
        <div className="alert-card" style={{ marginBottom: '1.5rem' }}>
          <AlertTriangle size={14} style={{ display: 'inline', marginRight: 5 }} />
          <strong>{error}</strong>
        </div>
      )}

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              fontSize: '0.75rem', fontWeight: 600, padding: '0.35rem 0.875rem',
              borderRadius: 9999, border: '1px solid',
              cursor: 'pointer', transition: 'all 0.15s',
              ...(filter === s
                ? { background: 'var(--color-primary)', color: 'white', borderColor: 'var(--color-primary)' }
                : { background: 'white', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }),
            }}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            {s !== 'all' && (
              <span style={{ marginLeft: 5, opacity: 0.7 }}>
                ({bookings.filter((b) => b.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loader-container"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={36} color="var(--text-muted)" style={{ marginBottom: '0.75rem' }} />
            <p>No bookings found{filter !== 'all' ? ` with status "${filter}"` : ''}.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Route</th>
                  <th>Cargo</th>
                  <th>Weight</th>
                  <th>Preferred Date</th>
                  <th>Submitted</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const s = STATUS_STYLES[b.status] || STATUS_STYLES.pending;
                  return (
                    <tr key={b.id}>
                      <td><strong style={{ color: 'var(--color-primary)' }}>BKG-{String(b.id).padStart(4, '0')}</strong></td>
                      <td style={{ maxWidth: 220 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.origin}</span>
                        <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>→</span>
                        <span>{b.destination}</span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{b.goods_type}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{b.weight}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {b.preferred_date ? fmt(b.preferred_date) : '—'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{fmt(b.created_at)}</td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center',
                          fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                          padding: '2px 8px', borderRadius: 9999,
                          background: s.bg, color: s.color, border: `1px solid ${s.border}`,
                        }}>
                          {b.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-surface-container)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Showing {filtered.length} of {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
