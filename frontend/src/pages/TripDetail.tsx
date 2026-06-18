import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  User, 
  Truck, 
  Package, 
  Clock, 
  History, 
  FileCheck2, 
  ArrowLeft,
  AlertTriangle,
  Upload,
  Signature
} from 'lucide-react';
import API_BASE_URL, { resolveMediaUrl } from '../utils/api';

interface HistoryLog {
  id: number;
  status_change: string;
  changed_at: string;
}

interface Pod {
  id: number;
  photo_url: string;
  receiver_signature: string;
  delivered_at: string;
}

interface TripDetails {
  id: number;
  driver_id: number;
  vehicle_id: number;
  driver_name: string;
  driver_phone: string;
  driver_license: string;
  vehicle_number: string;
  vehicle_type: string;
  vehicle_capacity: string;
  pickup_location: string;
  drop_location: string;
  goods_type: string;
  weight: string;
  start_time: string;
  end_time: string;
  status: string;
  delivery_status: string;
  created_at: string;
  history: HistoryLog[];
  pod: Pod | null;
}

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // POD form states
  const [signatureText, setSignatureText] = useState('');
  const [podFile, setPodFile] = useState<File | null>(null);
  
  // Canvas signature states
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);

  const fetchTripDetails = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await fetch(`${API_BASE_URL}/trips/${id}`);
      const data = await res.json();
      
      if (data.success) {
        setTrip(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch trip details');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripDetails();
  }, [id]);

  // Initializing canvas drawing context
  useEffect(() => {
    if (trip?.status === 'in_progress' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
      }
    }
  }, [trip?.status]);

  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawnSignature(true);
  };

  const handleDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleStopDraw = () => {
    setIsDrawing(false);
  };

  const clearSignatureCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSignature(false);
  };

  const handleStatusChange = async (newStatus: 'in_progress' | 'cancelled') => {
    if (submitting) return;
    try {
      setSubmitting(true);
      setErrorMsg('');

      const res = await fetch(`${API_BASE_URL}/trips/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();

      if (data.success) {
        fetchTripDetails();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update trip status');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!signatureText.trim()) {
      setErrorMsg('Receiver Name / Verification Text is required');
      return;
    }

    if (!podFile) {
      setErrorMsg('Proof of Delivery photo file is required');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('pod_file', podFile);
      
      // We will combine the typed receiver text with the canvas signature state indicator for reference
      let finalSignature = signatureText.trim();
      if (hasDrawnSignature && canvasRef.current) {
        finalSignature += ' (Digitally Signed on Screen)';
      }
      formData.append('receiver_signature', finalSignature);

      const res = await fetch(`${API_BASE_URL}/trips/${id}/pod`, {
        method: 'POST',
        body: formData // Multer expects multipart/form-data
      });
      const data = await res.json();

      if (data.success) {
        fetchTripDetails();
      } else {
        throw new Error(data.error || 'Failed to submit POD');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Retrieving trip credentials...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="empty-state">
        <p>Trip not found or registry is currently offline.</p>
        <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Back link */}
      <button 
        onClick={() => navigate(-1)} 
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
          fontWeight: 600
        }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <h1 className="page-title" style={{ marginBottom: 0 }}>Trip Ticket #{trip.id}</h1>
            <span className={`badge badge-${trip.status}`}>{trip.status}</span>
          </div>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Created on {formatDate(trip.created_at)}</p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          {trip.status === 'assigned' && (
            <>
              <button 
                className="btn btn-danger" 
                onClick={() => handleStatusChange('cancelled')}
                disabled={submitting}
              >
                Cancel Trip
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => handleStatusChange('in_progress')}
                disabled={submitting}
              >
                Start Trip
              </button>
            </>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="alert-card critical" style={{ marginBottom: '1.5rem' }}>
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} /> {errorMsg}
          </p>
        </div>
      )}

      {/* Grid panels */}
      <div className="responsive-grid-2" style={{ marginBottom: '2rem' }}>
        
        {/* Route & Shipment Info */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Route & Cargo Details
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Route Map pins */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative', paddingLeft: '2rem' }}>
              <div style={{ position: 'absolute', left: '7px', top: '24px', bottom: '24px', width: '2px', borderLeft: '2px dashed var(--border-color)' }}></div>
              
              <div style={{ position: 'relative' }}>
                <MapPin size={18} color="var(--color-primary)" style={{ position: 'absolute', left: '-29px', top: '2px', backgroundColor: 'var(--bg-main)', borderRadius: '50%' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>PICKUP POINT</span>
                <strong style={{ fontSize: '1rem' }}>{trip.pickup_location}</strong>
              </div>

              <div style={{ position: 'relative' }}>
                <MapPin size={18} color="var(--color-error)" style={{ position: 'absolute', left: '-29px', top: '2px', backgroundColor: 'var(--bg-main)', borderRadius: '50%' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>DELIVERY DESTINATION</span>
                <strong style={{ fontSize: '1rem' }}>{trip.drop_location}</strong>
              </div>
            </div>

            <div className="grid-2col-responsive" style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Cargo Classification</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, marginTop: '0.25rem' }}>
                  <Package size={16} color="var(--color-info)" /> {trip.goods_type}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Shipment Net Weight</span>
                <span style={{ fontWeight: 600, marginTop: '0.25rem', display: 'block' }}>{trip.weight}</span>
              </div>
            </div>

            <div className="grid-2col-responsive" style={{ fontSize: '0.9rem' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Departed:</span>
                <p style={{ fontWeight: 500, marginTop: '0.25rem' }}><Clock size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} /> {formatDate(trip.start_time)}</p>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Arrived:</span>
                <p style={{ fontWeight: 500, marginTop: '0.25rem' }}><Clock size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} /> {formatDate(trip.end_time)}</p>
              </div>
            </div>

          </div>
        </div>

        {/* Assigned Fleet Details */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Assigned Personnel & Asset
          </h3>

          <div className="grid-2col-responsive">
            {/* Driver Profile */}
            <div>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <User size={14} /> Driver Credentials
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <strong>{trip.driver_name || 'Driver removed'}</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Phone: {trip.driver_phone || 'N/A'}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>License: {trip.driver_license || 'N/A'}</span>
              </div>
            </div>

            {/* Vehicle Profile */}
            <div>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Truck size={14} /> Transport Vehicle
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <strong>{trip.vehicle_number || 'Vehicle removed'}</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Type: {trip.vehicle_type || 'N/A'}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Capacity: {trip.vehicle_capacity || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Timeline Audit Logs & Proof of Delivery Form */}
      <div className="responsive-grid-2">
        
        {/* Timeline Log */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <History size={18} color="var(--color-primary)" /> Audit Timeline
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', paddingLeft: '1.5rem' }}>
            <div style={{ position: 'absolute', left: '5px', top: '6px', bottom: '6px', width: '2px', backgroundColor: 'rgba(255,255,255,0.06)' }}></div>

            {trip.history && trip.history.map((log) => (
              <div key={log.id} style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '-19px', top: '6px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', border: '2px solid var(--bg-main)' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{log.status_change}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(log.changed_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Proof of Delivery (POD) Panel */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <FileCheck2 size={18} color="var(--color-success)" /> Proof of Delivery (POD)
          </h3>

          {/* Form when trip is active / in progress */}
          {trip.status === 'in_progress' && (
            <form onSubmit={handlePodSubmit}>
              <div className="form-group">
                <label>Receiver Name / Signature Verification *</label>
                <input 
                  type="text" 
                  value={signatureText}
                  onChange={e => setSignatureText(e.target.value)}
                  placeholder="e.g. Received by Warehouse Manager Alice"
                  required
                />
              </div>

              {/* Digital Signature Canvas Drawing Pad */}
              <div className="form-group">
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Draw Digital Signature (Optional)</span>
                  {hasDrawnSignature && (
                    <button type="button" onClick={clearSignatureCanvas} style={{ background: 'none', border: 'none', color: 'var(--color-error)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                      Clear Pad
                    </button>
                  )}
                </label>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(0,0,0,0.45)', overflow: 'hidden' }}>
                  <canvas 
                    ref={canvasRef}
                    width={350}
                    height={100}
                    style={{ width: '100%', display: 'block', cursor: 'crosshair' }}
                    onMouseDown={handleStartDraw}
                    onMouseMove={handleDrawing}
                    onMouseUp={handleStopDraw}
                    onMouseLeave={handleStopDraw}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Upload POD Photo *</label>
                <div style={{
                  border: '1px dashed var(--border-color)',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.01)',
                  position: 'relative',
                  cursor: 'pointer'
                }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => setPodFile(e.target.files ? e.target.files[0] : null)}
                    style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      opacity: 0, cursor: 'pointer'
                    }}
                    required
                  />
                  <Upload size={24} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {podFile ? podFile.name : 'Click to select or drop delivery snapshot image'}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>PNG, JPG or JPEG (Max 5MB)</p>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-success" 
                style={{ width: '100%', marginTop: '1rem' }}
                disabled={submitting}
              >
                {submitting ? 'Completing...' : 'Sign Off & Complete Trip'}
              </button>
            </form>
          )}

          {/* Alert when assigned but not started */}
          {trip.status === 'assigned' && (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <p>Proof of Delivery can only be uploaded once the driver starts the journey.</p>
            </div>
          )}

          {/* Alert when cancelled */}
          {trip.status === 'cancelled' && (
            <div className="empty-state" style={{ padding: '2rem 1rem', color: 'var(--color-error)' }}>
              <p>This trip was cancelled. No delivery documents are registered.</p>
            </div>
          )}

          {/* Render POD ticket when completed */}
          {trip.status === 'completed' && trip.pod && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>VERIFIED RECEIVER / SIGNATURE</span>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
                    <Signature size={16} color="var(--color-success)" /> {trip.pod.receiver_signature}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>DELIVERED DATE & TIME</span>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '0.25rem' }}>{formatDate(trip.pod.delivered_at)}</p>
                </div>
              </div>

              {/* POD Image Photo Snap */}
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>DELIVERY PHOTO SNAPSHOT</span>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', maxHeight: '250px', background: '#000' }}>
                  <img 
                    src={resolveMediaUrl(trip.pod.photo_url)} 
                    alt="Proof of Delivery" 
                    style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
                    onError={(e) => {
                      // Fallback if image doesn't exist or server fails to load
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=600&auto=format&fit=crop';
                    }}
                  />
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
