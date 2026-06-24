import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight, Filter, Download } from 'lucide-react';
import API_BASE_URL from '../utils/api';

interface Trip {
  id: number; driver_name: string; vehicle_number: string;
  pickup_location: string; drop_location: string;
  goods_type: string; weight: string;
  status: string; delivery_status: string; created_at: string;
}

export default function Trips() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchTrips = async () => {
    try {
      setLoading(true); setErrorMsg('');
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (startDate) params.append('start_date', `${startDate}T00:00:00.000Z`);
      if (endDate) params.append('end_date', `${endDate}T23:59:59.999Z`);
      const res = await fetch(`${API_BASE_URL}/trips?${params}`);
      const data = await res.json();
      if (data.success) setTrips(data.data);
      else throw new Error(data.error);
    } catch (err: any) { setErrorMsg(err.message || 'Failed to load trips'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTrips(); }, [statusFilter, startDate, endDate]);

  const fmt = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' +
           date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const exportToCSV = () => {
    if (trips.length === 0) return;
    const headers = ['Trip ID', 'Date', 'Driver', 'Vehicle', 'Pickup', 'Destination', 'Cargo', 'Weight', 'Status', 'Delivery Status'];
    const csvContent = [
      headers.join(','),
      ...trips.map(t => [
        `TRP-${String(t.id).padStart(4, '0')}`,
        `"${fmt(t.created_at)}"`,
        `"${t.driver_name || ''}"`,
        `"${t.vehicle_number || ''}"`,
        `"${t.pickup_location}"`,
        `"${t.drop_location}"`,
        `"${t.goods_type}"`,
        `"${t.weight}"`,
        t.status,
        t.delivery_status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'trips_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Trip Ledger</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Historical registry of all freight movements and assignments</p>
        </div>
        <button className="btn btn-amber" onClick={() => navigate('/trip-board')}>
          + Create Trip
        </button>
      </div>

      {errorMsg && <div className="alert-card critical" style={{ marginBottom: '1rem' }}>{errorMsg}</div>}

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '0.875rem 1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 160 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Filter size={11} />Filter Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '0.5rem' }}>
              <option value="">All Statuses</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} />From Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '0.45rem' }} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} />To Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '0.45rem' }} />
          </div>
          <button className="btn btn-secondary" onClick={() => { setStatusFilter(''); setStartDate(''); setEndDate(''); }} style={{ fontSize: '0.8rem' }}>
            Clear
          </button>
          <button className="btn btn-secondary" onClick={exportToCSV} style={{ fontSize: '0.8rem', marginLeft: 'auto' }}>
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      {/* Trips Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loader-container"><div className="spinner" /></div>
        ) : trips.length === 0 ? (
          <div className="empty-state">No trips found matching the selected filters.</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Trip ID</th><th>Date & Time</th><th>Driver</th><th>Vehicle</th>
                  <th>Route</th><th>Cargo / Weight</th><th>Status</th><th>POD</th><th></th>
                </tr>
              </thead>
              <tbody>
                {trips.map(trip => (
                  <tr key={trip.id} onClick={() => navigate(`/trips/${trip.id}`)} style={{ cursor: 'pointer' }}>
                    <td><strong style={{ color: 'var(--color-primary)' }}>TRP-{String(trip.id).padStart(4, '0')}</strong></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{fmt(trip.created_at)}</td>
                    <td>{trip.driver_name || '—'}</td>
                    <td style={{ fontSize: '0.8rem' }}>{trip.vehicle_number || '—'}</td>
                    <td>
                      <div style={{ fontSize: '0.825rem' }}>
                        {trip.pickup_location}
                        <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>→</span>
                        {trip.drop_location}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {trip.goods_type}<br />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{trip.weight}</span>
                    </td>
                    <td><span className={`badge badge-${trip.status}`}>{trip.status.replace('_', ' ')}</span></td>
                    <td>
                      {trip.delivery_status === 'delivered'
                        ? <span style={{ color: 'var(--color-success)', fontSize: '0.8rem', fontWeight: 600 }}>✓ Verified</span>
                        : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                          {trip.status === 'cancelled' ? 'N/A' : 'Pending'}
                        </span>
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
            Showing 1–{trips.length} of {trips.length} trips
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
