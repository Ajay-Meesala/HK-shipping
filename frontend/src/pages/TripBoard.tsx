import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Package, Weight, User, Truck,
  AlertTriangle, ArrowRight, FileEdit
} from 'lucide-react';
import API_BASE_URL from '../utils/api';

interface AvailableDriver { id: number; name: string; phone: string; license_no: string; }
interface AvailableVehicle { id: number; vehicle_number: string; vehicle_type: string; capacity: string; }

export default function TripBoard() {
  const navigate = useNavigate();
  const [availableDrivers, setAvailableDrivers] = useState<AvailableDriver[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<AvailableVehicle[]>([]);
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [goods, setGoods] = useState('');
  const [weight, setWeight] = useState('');
  const [charges, setCharges] = useState('');
  const [dispatchDate, setDispatchDate] = useState('');
  const [priority, setPriority] = useState('mid');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchResources = async () => {
    try {
      setLoading(true);
      const [dr, vr] = await Promise.all([
        fetch(`${API_BASE_URL}/drivers?status=available`),
        fetch(`${API_BASE_URL}/vehicles?status=available`),
      ]);
      const dd = await dr.json(); const vd = await vr.json();
      if (dd.success) setAvailableDrivers(dd.data);
      if (vd.success) setAvailableVehicles(vd.data);
    } catch { setErrorMsg('Could not load fleet data. Backend may be offline.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchResources(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setErrorMsg('');
    if (!driverId || !vehicleId || !pickup || !drop || !goods || !weight) {
      setErrorMsg('Please fill in all required fields.'); return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driver_id: +driverId, vehicle_id: +vehicleId, pickup_location: pickup, drop_location: drop, goods_type: goods, weight }),
      });
      const data = await res.json();
      if (data.success) navigate('/');
      else throw new Error(data.error);
    } catch (err: any) { setErrorMsg(err.message); }
    finally { setSubmitting(false); }
  };

  const outOfStock = availableDrivers.length === 0 || availableVehicles.length === 0;

  return (
    <div className="trip-board-container">

      {/* ── LEFT: Create Trip Form ── */}
      <section className="trip-board-form-section">
        {/* Header */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-container)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
            <FileEdit size={18} />
            <strong style={{ fontSize: '0.95rem' }}>Create New Trip</strong>
          </div>
          <span style={{ background: '#DBEAFE', color: '#1E40AF', fontSize: '0.65rem', fontWeight: 700, padding: '2px 10px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            New Entry
          </span>
        </div>

        {/* Form */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
          {errorMsg && <div className="alert-card critical" style={{ marginBottom: '1rem' }}><AlertTriangle size={15} style={{ display: 'inline', marginRight: 6 }} />{errorMsg}</div>}
          {outOfStock && !errorMsg && (
            <div className="alert-card" style={{ marginBottom: '1rem' }}>
              <strong>Resource Alert:</strong> No available drivers or vehicles at this time.
              <button className="btn btn-secondary" onClick={() => navigate('/drivers-vehicles')} style={{ fontSize: '0.75rem', marginTop: '0.5rem', display: 'block' }}>
                Manage Fleet →
              </button>
            </div>
          )}

          <form id="tripForm" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label><User size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />Driver Select</label>
                <select value={driverId} onChange={e => setDriverId(e.target.value)} required disabled={availableDrivers.length === 0}>
                  <option value="">Assign Driver</option>
                  {availableDrivers.map(d => <option key={d.id} value={d.id}>{d.name} (Available)</option>)}
                </select>
              </div>
              <div className="form-group">
                <label><Truck size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />Vehicle</label>
                <select value={vehicleId} onChange={e => setVehicleId(e.target.value)} required disabled={availableVehicles.length === 0}>
                  <option value="">Select Unit</option>
                  {availableVehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number} ({v.vehicle_type})</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label><MapPin size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />Pickup Point</label>
                <input type="text" value={pickup} onChange={e => setPickup(e.target.value)} placeholder="Origin City / Hub" required />
              </div>
              <div className="form-group">
                <label><MapPin size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />Destination</label>
                <input type="text" value={drop} onChange={e => setDrop(e.target.value)} placeholder="Target City / Facility" required />
              </div>
            </div>

            <div className="form-row-3col">
              <div className="form-group">
                <label><Package size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />Goods Type</label>
                <input type="text" value={goods} onChange={e => setGoods(e.target.value)} placeholder="Cargo" required />
              </div>
              <div className="form-group">
                <label><Weight size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />Weight (T)</label>
                <input type="text" value={weight} onChange={e => setWeight(e.target.value)} placeholder="0.0" required />
              </div>
              <div className="form-group">
                <label>Charges (₹)</label>
                <input type="number" value={charges} onChange={e => setCharges(e.target.value)} placeholder="Total" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Dispatch Date</label>
                <input type="date" value={dispatchDate} onChange={e => setDispatchDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Priority</label>
                <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.15rem' }}>
                  {['low', 'mid', 'high'].map(p => (
                    <label key={p} style={{ flex: 1, cursor: 'pointer' }}>
                      <input type="radio" name="priority" value={p} checked={priority === p} onChange={() => setPriority(p)} style={{ display: 'none' }} />
                      <div style={{
                        textAlign: 'center', padding: '0.5rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700,
                        border: `1px solid ${priority === p ? (p === 'high' ? 'var(--color-error)' : 'var(--color-primary)') : 'var(--border-color)'}`,
                        background: priority === p ? (p === 'high' ? 'var(--color-error-glow)' : 'var(--color-primary-glow)') : 'var(--bg-surface-container)',
                        color: priority === p ? (p === 'high' ? 'var(--color-error)' : 'var(--color-primary)') : 'var(--text-secondary)',
                        transition: 'all 0.15s',
                      }}>
                        {p.charAt(0).toUpperCase()}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Submit */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
          <button form="tripForm" type="submit" className="btn btn-amber" disabled={outOfStock || submitting}
            style={{ width: '100%', padding: '0.875rem', fontSize: '0.9rem', justifyContent: 'center', borderRadius: 10, opacity: (outOfStock || submitting) ? 0.6 : 1 }}>
            <Truck size={18} />
            {submitting ? 'Assigning...' : 'ASSIGN TRIP'}
            {!submitting && <ArrowRight size={16} />}
          </button>
        </div>
      </section>

      {/* ── RIGHT: Driver Availability Board ── */}
      <section className="trip-board-avail-section">
        {/* Header */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
            <User size={18} />
            <strong style={{ fontSize: '0.95rem' }}>Driver Availability Board</strong>
          </div>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)' }} />Available</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-amber)' }} />On Trip</span>
          </div>
        </div>

        {/* Driver Cards */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {loading ? (
            <div className="loader-container"><div className="spinner" /></div>
          ) : availableDrivers.length === 0 ? (
            <div className="empty-state">No available drivers. All drivers are on trips or off duty.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {availableDrivers.map(driver => (
                <div key={driver.id} style={{
                  background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 10,
                  padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem',
                  transition: 'all 0.2s', cursor: 'pointer',
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                  onClick={() => setDriverId(String(driver.id))}
                >
                  {/* Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 10,
                      background: 'var(--color-primary-glow)',
                      border: `2px solid ${driverId === String(driver.id) ? 'var(--color-primary)' : '#BFDBFE'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '1rem', color: 'var(--color-primary)'
                    }}>
                      {driver.name.charAt(0)}
                    </div>
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderRadius: '50%', background: 'var(--color-success)', border: '2px solid white' }} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.875rem' }}>{driver.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>📞 {driver.phone}</div>
                      </div>
                      {driverId === String(driver.id) && (
                        <span style={{ background: 'var(--color-primary)', color: 'white', fontSize: '0.6rem', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>SELECTED</span>
                      )}
                    </div>
                    <div className="grid-2col-compact" style={{ marginTop: '0.625rem' }}>
                      <div>
                        <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>License</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{driver.license_no}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>Status</div>
                        <span className="badge badge-available">Available</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
