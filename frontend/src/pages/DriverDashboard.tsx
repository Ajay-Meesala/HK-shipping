import { useState, useEffect } from 'react';
import {
  Package, MapPin, Weight, Phone, CalendarDays,
  PlusCircle, CheckCircle2, Clock, Truck, AlertTriangle,
  ChevronRight, Send, FileText,
} from 'lucide-react';
import API_BASE_URL from '../utils/api';
import { useAuth } from '../context/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Booking {
  id: number;
  customer_name: string;
  customer_email: string;
  contact_phone: string;
  origin: string;
  destination: string;
  goods_type: string;
  weight: string;
  preferred_date: string | null;
  notes: string | null;
  status: 'pending' | 'confirmed' | 'dispatched' | 'in_transit' | 'delivered' | 'cancelled';
  created_at: string;
}

// ── Timeline step configuration ───────────────────────────────────────────────
const TIMELINE_STEPS: Array<{
  key: Booking['status'];
  label: string;
  desc: string;
  icon: React.ReactNode;
}> = [
  { key: 'pending',    label: 'Booking Received',    desc: 'Request submitted & under review',  icon: <FileText size={14} /> },
  { key: 'confirmed',  label: 'Confirmed',            desc: 'Booking approved by dispatcher',    icon: <CheckCircle2 size={14} /> },
  { key: 'dispatched', label: 'Dispatched',           desc: 'Vehicle & driver assigned',         icon: <Truck size={14} /> },
  { key: 'in_transit', label: 'In Transit',           desc: 'Freight is on the road',            icon: <MapPin size={14} /> },
  { key: 'delivered',  label: 'Delivered',            desc: 'Cargo delivered successfully',      icon: <CheckCircle2 size={14} /> },
];

const STATUS_ORDER: Record<Booking['status'], number> = {
  pending: 0, confirmed: 1, dispatched: 2, in_transit: 3, delivered: 4, cancelled: -1,
};

const STATUS_COLOR: Record<Booking['status'], string> = {
  pending:    '#F59E0B',
  confirmed:  '#3B82F6',
  dispatched: '#8B5CF6',
  in_transit: '#F97316',
  delivered:  '#10B981',
  cancelled:  '#EF4444',
};

const STATUS_BG: Record<Booking['status'], string> = {
  pending:    '#FFFBEB',
  confirmed:  '#EFF6FF',
  dispatched: '#F5F3FF',
  in_transit: '#FFF7ED',
  delivered:  '#ECFDF5',
  cancelled:  '#FEF2F2',
};

// ─────────────────────────────────────────────────────────────────────────────
export default function DriverDashboard() {
  const { user } = useAuth();

  // ── State: Bookings ─────────────────────────────────────────────────────────
  const [bookings, setBookings]     = useState<Booking[]>([]);
  const [bookLoading, setBookLoading] = useState(true);

  // ── State: Booking Form ─────────────────────────────────────────────────────
  const [form, setForm] = useState({
    customer_name:  user?.displayName || '',
    customer_email: user?.email || '',
    contact_phone:  '',
    origin:         '',
    destination:    '',
    goods_type:     '',
    weight:         '',
    preferred_date: '',
    notes:          '',
  });
  const [submitting,   setSubmitting]   = useState(false);
  const [formError,    setFormError]    = useState('');
  const [formSuccess,  setFormSuccess]  = useState('');

  // ── State: Track section ────────────────────────────────────────────────────
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // ── Fetch bookings ──────────────────────────────────────────────────────────
  const fetchBookings = async () => {
    try {
      setBookLoading(true);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user?.idToken) headers['Authorization'] = `Bearer ${user.idToken}`;

      const res  = await fetch(`${API_BASE_URL}/bookings`, { headers });
      const data = await res.json();
      if (data.success) {
        setBookings(data.data);
        if (data.data.length > 0) setSelectedBooking(data.data[0]);
      }
    } catch {
      // backend offline — show empty state
    } finally {
      setBookLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  // ── KPI helpers ─────────────────────────────────────────────────────────────
  const totalBookings  = bookings.length;
  const inTransit      = bookings.filter((b) => b.status === 'in_transit' || b.status === 'dispatched').length;
  const delivered      = bookings.filter((b) => b.status === 'delivered').length;
  const pendingCount   = bookings.filter((b) => b.status === 'pending' || b.status === 'confirmed').length;

  // ── Form field helper ───────────────────────────────────────────────────────
  const setField = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  // ── Form submit ─────────────────────────────────────────────────────────────
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const required = ['customer_name', 'contact_phone', 'origin', 'destination', 'goods_type', 'weight'] as const;
    for (const f of required) {
      if (!form[f].trim()) {
        setFormError(`Please fill in: ${f.replace('_', ' ')}`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user?.idToken) headers['Authorization'] = `Bearer ${user.idToken}`;

      const res  = await fetch(`${API_BASE_URL}/bookings`, {
        method:  'POST',
        headers,
        body:    JSON.stringify({ ...form, customer_email: user?.email || form.customer_email }),
      });
      const data = await res.json();

      if (data.success) {
        setFormSuccess(`Booking #${data.data.id} submitted! We'll confirm within 24 hours.`);
        setForm((prev) => ({
          ...prev,
          contact_phone: '', origin: '', destination: '',
          goods_type: '', weight: '', preferred_date: '', notes: '',
        }));
        fetchBookings();
      } else {
        setFormError(data.error || 'Submission failed. Please try again.');
      }
    } catch {
      setFormError('Unable to connect to server. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Timeline renderer ───────────────────────────────────────────────────────
  const renderTimeline = (booking: Booking) => {
    const currentIdx = STATUS_ORDER[booking.status];
    const isCancelled = booking.status === 'cancelled';

    return (
      <div style={{ padding: '0.5rem 0' }}>
        {isCancelled ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#EF4444', fontWeight: 600, fontSize: '0.875rem' }}>
            <AlertTriangle size={16} /> Booking Cancelled
          </div>
        ) : (
          TIMELINE_STEPS.map((step, i) => {
            const stepIdx   = STATUS_ORDER[step.key];
            const isDone    = stepIdx < currentIdx;
            const isCurrent = stepIdx === currentIdx;
            const isPending = stepIdx > currentIdx;
            const isLast    = i === TIMELINE_STEPS.length - 1;

            return (
              <div key={step.key} className="timeline-step">
                {/* Dot + Connector */}
                <div className="timeline-dot-col">
                  <div
                    className={`timeline-dot ${isDone ? 'done' : isCurrent ? 'current' : 'pending'}`}
                    style={isCurrent ? { background: STATUS_COLOR[booking.status], borderColor: STATUS_COLOR[booking.status] } : undefined}
                  >
                    {isDone ? <CheckCircle2 size={12} /> : isCurrent ? step.icon : <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'block' }} />}
                  </div>
                  {!isLast && <div className={`timeline-connector ${isDone ? 'done' : ''}`} />}
                </div>

                {/* Label */}
                <div className="timeline-label" style={{ opacity: isPending ? 0.45 : 1 }}>
                  <div style={{
                    fontWeight: isCurrent ? 700 : 600,
                    fontSize: '0.8rem',
                    color: isCurrent ? STATUS_COLOR[booking.status] : isDone ? 'var(--color-success)' : 'var(--text-secondary)',
                  }}>
                    {step.label}
                    {isCurrent && (
                      <span style={{
                        marginLeft: '0.5rem', fontSize: '0.6rem', fontWeight: 700,
                        background: STATUS_COLOR[booking.status], color: 'white',
                        padding: '1px 6px', borderRadius: 9999,
                      }}>
                        CURRENT
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 1 }}>{step.desc}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Page Header ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Driver Dashboard</h1>
        <p className="page-subtitle" style={{ marginBottom: 0 }}>
          Book, track and manage your freight shipments with HK Shipping
        </p>
      </div>

      {/* ── KPI STRIP ── */}
      <div className="dashboard-grid" style={{ marginBottom: '1.75rem' }}>
        <div className="card stat-card">
          <div className="stat-card-header">
            <div className="stat-icon primary"><FileText size={20} /></div>
          </div>
          <div>
            <div className="stat-value">{bookLoading ? '—' : totalBookings}</div>
            <div className="stat-label">Total Bookings</div>
          </div>
          <div className="stat-sparkbar">
            {[30, 50, 40, 70, 60].map((h, i) => <span key={i} className={i === 3 ? 'active' : ''} style={{ height: `${h}%` }} />)}
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-card-header">
            <div className="stat-icon amber"><Truck size={20} /></div>
            {inTransit > 0 && <span className="stat-trend up" style={{ color: '#F97316' }}>Live</span>}
          </div>
          <div>
            <div className="stat-value" style={{ color: '#F97316' }}>{bookLoading ? '—' : inTransit}</div>
            <div className="stat-label">In Transit</div>
          </div>
          <div className="stat-sparkbar">
            {[60, 40, 80, 50, 70].map((h, i) => <span key={i} className={i === 2 ? 'active' : ''} style={{ height: `${h}%`, background: i === 2 ? 'rgba(249,115,22,0.3)' : 'rgba(249,115,22,0.1)' }} />)}
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-card-header">
            <div className="stat-icon success"><CheckCircle2 size={20} /></div>
          </div>
          <div>
            <div className="stat-value" style={{ color: 'var(--color-success)' }}>{bookLoading ? '—' : delivered}</div>
            <div className="stat-label">Delivered</div>
          </div>
          <div className="stat-sparkbar">
            {[40, 60, 50, 80, 70].map((h, i) => <span key={i} className={i === 3 ? 'active' : ''} style={{ height: `${h}%`, background: i === 3 ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.1)' }} />)}
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-card-header">
            <div className="stat-icon" style={{ background: '#FEF3C7', color: '#D97706' }}><Clock size={20} /></div>
          </div>
          <div>
            <div className="stat-value" style={{ color: '#D97706' }}>{bookLoading ? '—' : pendingCount}</div>
            <div className="stat-label">Awaiting Confirmation</div>
          </div>
          <div className="stat-sparkbar">
            {[70, 50, 40, 60, 50].map((h, i) => <span key={i} style={{ height: `${h}%`, background: 'rgba(217,119,6,0.15)' }} />)}
          </div>
        </div>
      </div>

      {/* ── MAIN GRID: Booking Form + Timeline ── */}
      <div className="responsive-grid-2">

        {/* ── LEFT: Booking Form ── */}
        <div className="card booking-form-card" style={{ padding: 0 }}>
          {/* Header */}
          <div style={{
            padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', gap: '0.625rem',
            background: 'var(--bg-surface-container)',
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PlusCircle size={16} color="#1E3A5F" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.95rem' }}>New Freight Booking</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Road transport request</div>
            </div>
          </div>

          {/* Form Body */}
          <div style={{ padding: '1.25rem' }}>
            {formError && (
              <div className="alert-card critical" style={{ marginBottom: '1rem', fontSize: '0.8rem' }}>
                <AlertTriangle size={13} style={{ display: 'inline', marginRight: 5 }} />{formError}
              </div>
            )}
            {formSuccess && (
              <div className="alert-card success-alert" style={{ marginBottom: '1rem', fontSize: '0.8rem' }}>
                <CheckCircle2 size={13} style={{ display: 'inline', marginRight: 5 }} />{formSuccess}
              </div>
            )}

            <form id="bookingForm" onSubmit={handleBookingSubmit}>
              {/* Contact Info */}
              <div className="form-row">
                <div className="form-group">
                  <label><Package size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />Full Name</label>
                  <input type="text" value={form.customer_name} onChange={setField('customer_name')} placeholder="Your full name" required />
                </div>
                <div className="form-group">
                  <label><Phone size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />Contact Phone</label>
                  <input type="tel" value={form.contact_phone} onChange={setField('contact_phone')} placeholder="+91 98765 XXXXX" required />
                </div>
              </div>

              {/* Route */}
              <div className="form-row">
                <div className="form-group">
                  <label><MapPin size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />Origin City / Hub</label>
                  <input type="text" value={form.origin} onChange={setField('origin')} placeholder="e.g. Mumbai Port" required />
                </div>
                <div className="form-group">
                  <label><MapPin size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />Destination</label>
                  <input type="text" value={form.destination} onChange={setField('destination')} placeholder="e.g. Delhi Warehouse" required />
                </div>
              </div>

              {/* Cargo */}
              <div className="form-row-3col">
                <div className="form-group">
                  <label>Goods Type</label>
                  <input type="text" value={form.goods_type} onChange={setField('goods_type')} placeholder="e.g. Electronics" required />
                </div>
                <div className="form-group">
                  <label><Weight size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />Weight (Tons)</label>
                  <input type="text" value={form.weight} onChange={setField('weight')} placeholder="e.g. 5" required />
                </div>
                <div className="form-group">
                  <label><CalendarDays size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />Preferred Date</label>
                  <input type="date" value={form.preferred_date} onChange={setField('preferred_date')} min={new Date().toISOString().split('T')[0]} />
                </div>
              </div>

              {/* Notes */}
              <div className="form-group">
                <label>Special Instructions</label>
                <textarea
                  value={form.notes}
                  onChange={setField('notes')}
                  placeholder="e.g. Fragile, temperature-sensitive, specific delivery window..."
                  rows={3}
                  style={{ resize: 'none' }}
                />
              </div>
            </form>
          </div>

          {/* Submit */}
          <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
            <button
              form="bookingForm"
              type="submit"
              className="btn btn-amber"
              disabled={submitting}
              style={{ width: '100%', padding: '0.875rem', fontSize: '0.9rem', justifyContent: 'center', borderRadius: 10, opacity: submitting ? 0.7 : 1 }}
            >
              <Send size={16} />
              {submitting ? 'Submitting Request...' : 'Submit Freight Booking'}
              {!submitting && <ChevronRight size={16} />}
            </button>
          </div>
        </div>

        {/* ── RIGHT: Consignment Tracking Timeline ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Timeline Card */}
          <div className="card" style={{ padding: 0 }}>
            {/* Header */}
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface-container)' }}>
              <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                📦 Track Consignment
              </div>
              {/* Booking selector */}
              {bookings.length > 0 ? (
                <select
                  value={selectedBooking?.id || ''}
                  onChange={(e) => {
                    const b = bookings.find((bk) => bk.id === +e.target.value);
                    if (b) setSelectedBooking(b);
                  }}
                  style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                >
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      #{b.id} — {b.origin} → {b.destination} ({b.status})
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No bookings yet</div>
              )}
            </div>

            {/* Timeline Body */}
            <div style={{ padding: '1.25rem' }}>
              {bookLoading ? (
                <div className="loader-container" style={{ minHeight: 120 }}><div className="spinner" /></div>
              ) : selectedBooking ? (
                <>
                  {/* Booking Summary */}
                  <div style={{
                    background: STATUS_BG[selectedBooking.status],
                    border: `1px solid ${STATUS_COLOR[selectedBooking.status]}30`,
                    borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.25rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.07em' }}>Booking #{selectedBooking.id}</div>
                      <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.875rem', marginTop: 2 }}>
                        {selectedBooking.origin} <span style={{ color: 'var(--text-muted)' }}>→</span> {selectedBooking.destination}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 1 }}>
                        {selectedBooking.goods_type} · {selectedBooking.weight}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                      background: STATUS_COLOR[selectedBooking.status], color: 'white',
                      padding: '3px 10px', borderRadius: 9999,
                    }}>
                      {selectedBooking.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Timeline */}
                  {renderTimeline(selectedBooking)}
                </>
              ) : (
                <div className="empty-state" style={{ minHeight: 120, padding: '2rem 1rem' }}>
                  Submit your first booking to track shipments here.
                </div>
              )}
            </div>
          </div>

          {/* Recent Bookings Mini List */}
          {bookings.length > 0 && (
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.875rem' }}>Recent Bookings</div>
              </div>
              <div>
                {bookings.slice(0, 4).map((b, i) => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.75rem 1.25rem',
                      borderBottom: i < Math.min(bookings.length, 4) - 1 ? '1px solid #F1F5F9' : 'none',
                      cursor: 'pointer',
                      background: selectedBooking?.id === b.id ? 'var(--color-primary-glow)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { if (selectedBooking?.id !== b.id) e.currentTarget.style.background = 'var(--bg-surface-container)'; }}
                    onMouseLeave={(e) => { if (selectedBooking?.id !== b.id) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[b.status], flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        #{b.id} — {b.origin} → {b.destination}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{b.goods_type} · {b.weight}</div>
                    </div>
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 700,
                      background: STATUS_BG[b.status], color: STATUS_COLOR[b.status],
                      border: `1px solid ${STATUS_COLOR[b.status]}40`,
                      padding: '2px 8px', borderRadius: 9999, whiteSpace: 'nowrap', flexShrink: 0,
                    }}>
                      {b.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
