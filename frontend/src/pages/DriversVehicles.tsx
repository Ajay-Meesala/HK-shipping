import { useEffect, useState } from 'react';
import {
  UserPlus, Truck, Phone, FileText,
  Filter, Calendar, AlertCircle, CheckCircle2
} from 'lucide-react';
import API_BASE_URL from '../utils/api';

interface Driver { id: number; name: string; phone: string; license_no: string; status: string; created_at: string; }
interface Vehicle { id: number; vehicle_number: string; vehicle_type: string; capacity: string; insurance_expiry: string; permit_expiry: string; pollution_expiry: string; status: string; }

export default function DriversVehicles() {
  const [tab, setTab] = useState<'drivers' | 'vehicles'>('drivers');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [driverFilter, setDriverFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Driver form
  const [dName, setDName] = useState(''); const [dPhone, setDPhone] = useState(''); const [dLicense, setDLicense] = useState(''); const [dStatus, setDStatus] = useState('available');
  // Vehicle form
  const [vNo, setVNo] = useState(''); const [vType, setVType] = useState(''); const [vCap, setVCap] = useState('');
  const [vIns, setVIns] = useState(''); const [vPerm, setVPerm] = useState(''); const [vPoll, setVPoll] = useState(''); const [vStatus, setVStatus] = useState('available');

  const fetchDrivers = async () => {
    try { setLoading(true);
      const r = await fetch(`${API_BASE_URL}/drivers${driverFilter ? `?status=${driverFilter}` : ''}`);
      const d = await r.json(); if (d.success) setDrivers(d.data); else throw new Error(d.error);
    } catch (e: any) { setErrorMsg(e.message); } finally { setLoading(false); }
  };
  const fetchVehicles = async () => {
    try { setLoading(true);
      const r = await fetch(`${API_BASE_URL}/vehicles${vehicleFilter ? `?status=${vehicleFilter}` : ''}`);
      const d = await r.json(); if (d.success) setVehicles(d.data); else throw new Error(d.error);
    } catch (e: any) { setErrorMsg(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { if (tab === 'drivers') fetchDrivers(); else fetchVehicles(); }, [tab, driverFilter, vehicleFilter]);

  const addDriver = async (e: React.FormEvent) => {
    e.preventDefault(); setErrorMsg(''); setSuccessMsg('');
    try {
      const r = await fetch(`${API_BASE_URL}/drivers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: dName, phone: dPhone, license_no: dLicense, status: dStatus }) });
      const d = await r.json();
      if (d.success) { setSuccessMsg(d.message); setShowDriverModal(false); setDName(''); setDPhone(''); setDLicense(''); fetchDrivers(); }
      else throw new Error(d.error);
    } catch (e: any) { setErrorMsg(e.message); }
  };
  const addVehicle = async (e: React.FormEvent) => {
    e.preventDefault(); setErrorMsg(''); setSuccessMsg('');
    try {
      const r = await fetch(`${API_BASE_URL}/vehicles`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vehicle_number: vNo, vehicle_type: vType, capacity: vCap, insurance_expiry: vIns, permit_expiry: vPerm, pollution_expiry: vPoll, status: vStatus }) });
      const d = await r.json();
      if (d.success) { setSuccessMsg(d.message); setShowVehicleModal(false); setVNo(''); setVType(''); setVCap(''); fetchVehicles(); }
      else throw new Error(d.error);
    } catch (e: any) { setErrorMsg(e.message); }
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const Modal = ({ title, icon, onClose, onSubmit, children }: any) => (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" style={{ maxWidth: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: 'var(--color-primary)', fontSize: '1.05rem' }}>{icon}{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}>✕</button>
        </div>
        <form onSubmit={onSubmit}>{children}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Record</button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Fleet Management</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Register and track all drivers and vehicles</p>
        </div>
        {tab === 'drivers'
          ? <button className="btn btn-amber" onClick={() => { setShowDriverModal(true); setErrorMsg(''); setSuccessMsg(''); }}><UserPlus size={16} /> Register Driver</button>
          : <button className="btn btn-amber" onClick={() => { setShowVehicleModal(true); setErrorMsg(''); setSuccessMsg(''); }}><Truck size={16} /> Register Vehicle</button>
        }
      </div>

      {errorMsg && <div className="alert-card critical" style={{ marginBottom: '1rem' }}><AlertCircle size={15} style={{ display: 'inline', marginRight: 6 }} />{errorMsg}</div>}
      {successMsg && <div className="alert-card success-alert" style={{ marginBottom: '1rem' }}><CheckCircle2 size={15} style={{ display: 'inline', marginRight: 6 }} />{successMsg}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border-color)', marginBottom: '1.25rem' }}>
        {(['drivers', 'vehicles'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setErrorMsg(''); setSuccessMsg(''); }} style={{
            background: 'none', border: 'none', borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent',
            marginBottom: '-2px', color: tab === t ? 'var(--color-primary)' : 'var(--text-secondary)',
            padding: '0.75rem 1.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'inherit', transition: 'all 0.15s',
          }}>
            {t === 'drivers' ? `Drivers (${drivers.length})` : `Vehicles (${vehicles.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="card" style={{ padding: 0 }}>
        {/* Filter Bar */}
        <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-surface-container)' }}>
          <Filter size={15} color="var(--text-muted)" />
          <select value={tab === 'drivers' ? driverFilter : vehicleFilter}
            onChange={e => tab === 'drivers' ? setDriverFilter(e.target.value) : setVehicleFilter(e.target.value)}
            style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
            <option value="">All Statuses</option>
            {tab === 'drivers' ? <>
              <option value="available">Available</option>
              <option value="on_trip">On Trip</option>
              <option value="off_duty">Off Duty</option>
            </> : <>
              <option value="available">Available</option>
              <option value="on_trip">On Trip</option>
              <option value="maintenance">Maintenance</option>
            </>}
          </select>
        </div>

        {loading ? (
          <div className="loader-container"><div className="spinner" /></div>
        ) : tab === 'drivers' ? (
          drivers.length === 0 ? <div className="empty-state">No drivers found.</div> : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Name</th><th>Phone</th><th>License No.</th><th>Status</th><th>Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map(d => (
                    <tr key={d.id}>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>#{d.id}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-primary)' }}>
                            {d.name.charAt(0)}
                          </div>
                          <strong>{d.name}</strong>
                        </div>
                      </td>
                      <td><span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.825rem' }}><Phone size={13} color="var(--text-muted)" />{d.phone}</span></td>
                      <td><span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.825rem' }}><FileText size={13} color="var(--text-muted)" />{d.license_no}</span></td>
                      <td><span className={`badge badge-${d.status}`}>{d.status}</span></td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{fmt(d.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          vehicles.length === 0 ? <div className="empty-state">No vehicles found.</div> : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Plate No.</th><th>Type</th><th>Capacity</th>
                    <th>Insurance Exp.</th><th>Permit Exp.</th><th>Pollution Exp.</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map(v => (
                    <tr key={v.id}>
                      <td><strong style={{ color: 'var(--color-primary)' }}>{v.vehicle_number}</strong></td>
                      <td>{v.vehicle_type}</td>
                      <td>{v.capacity}</td>
                      <td style={{ fontSize: '0.8rem' }}><Calendar size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} color="var(--text-muted)" />{fmt(v.insurance_expiry)}</td>
                      <td style={{ fontSize: '0.8rem' }}><Calendar size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} color="var(--text-muted)" />{fmt(v.permit_expiry)}</td>
                      <td style={{ fontSize: '0.8rem' }}><Calendar size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} color="var(--text-muted)" />{fmt(v.pollution_expiry)}</td>
                      <td><span className={`badge badge-${v.status}`}>{v.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Driver Modal */}
      {showDriverModal && (
        <Modal title="Register New Driver" icon={<UserPlus size={20} color="var(--color-primary)" />} onClose={() => setShowDriverModal(false)} onSubmit={addDriver}>
          <div className="form-group"><label>Full Name *</label><input type="text" value={dName} onChange={e => setDName(e.target.value)} placeholder="e.g. John Doe" required /></div>
          <div className="form-row">
            <div className="form-group"><label>Phone Number *</label><input type="tel" value={dPhone} onChange={e => setDPhone(e.target.value)} placeholder="e.g. 9876543210" required /></div>
            <div className="form-group"><label>License No. *</label><input type="text" value={dLicense} onChange={e => setDLicense(e.target.value)} placeholder="e.g. DL-1234567890" required /></div>
          </div>
          <div className="form-group"><label>Status</label>
            <select value={dStatus} onChange={e => setDStatus(e.target.value)}>
              <option value="available">Available</option><option value="on_trip">On Trip</option><option value="off_duty">Off Duty</option>
            </select>
          </div>
        </Modal>
      )}

      {/* Vehicle Modal */}
      {showVehicleModal && (
        <Modal title="Register New Vehicle" icon={<Truck size={20} color="var(--color-primary)" />} onClose={() => setShowVehicleModal(false)} onSubmit={addVehicle}>
          <div className="form-row">
            <div className="form-group"><label>Plate Number *</label><input type="text" value={vNo} onChange={e => setVNo(e.target.value)} placeholder="e.g. MH-12-AB-1234" required /></div>
            <div className="form-group"><label>Vehicle Type *</label><input type="text" value={vType} onChange={e => setVType(e.target.value)} placeholder="e.g. 18-Wheeler" required /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Capacity *</label><input type="text" value={vCap} onChange={e => setVCap(e.target.value)} placeholder="e.g. 20 Tons" required /></div>
            <div className="form-group"><label>Status</label>
              <select value={vStatus} onChange={e => setVStatus(e.target.value)}>
                <option value="available">Available</option><option value="on_trip">On Trip</option><option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Compliance Documents</div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Insurance Expiry *</label><input type="date" value={vIns} onChange={e => setVIns(e.target.value)} required /></div>
            <div className="form-group"><label>Permit Expiry *</label><input type="date" value={vPerm} onChange={e => setVPerm(e.target.value)} required /></div>
          </div>
          <div className="form-group"><label>Pollution Certificate Expiry *</label><input type="date" value={vPoll} onChange={e => setVPoll(e.target.value)} required /></div>
        </Modal>
      )}
    </div>
  );
}
