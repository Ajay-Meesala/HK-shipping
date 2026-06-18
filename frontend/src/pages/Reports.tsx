import { useState } from 'react';
import { 
  TrendingUp, Users, Fuel, 
  FileText, Download, Calendar, Filter,
  DollarSign, CheckCircle2, ChevronRight
} from 'lucide-react';

interface ReportData {
  id: string;
  field1: string;
  field2: string;
  field3: string;
  field4: string;
  status: string;
}

const TRIP_REPORT: ReportData[] = [
  { id: 'RPT-TRP-01', field1: 'Mumbai → Delhi', field2: 'Electronics', field3: '₹1,45,000', field4: '12 Tons', status: 'completed' },
  { id: 'RPT-TRP-02', field1: 'Chennai → Bangalore', field2: 'Auto Parts', field3: '₹85,000', field4: '8 Tons', status: 'completed' },
  { id: 'RPT-TRP-03', field1: 'Kolkata → Patna', field2: 'Grains', field3: '₹1,20,000', field4: '18 Tons', status: 'in_progress' },
  { id: 'RPT-TRP-04', field1: 'Delhi → Jaipur', field2: 'Textiles', field3: '₹62,000', field4: '5 Tons', status: 'completed' },
  { id: 'RPT-TRP-05', field1: 'Pune → Hyderabad', field2: 'Chemicals', field3: '₹1,80,000', field4: '22 Tons', status: 'cancelled' },
];

const DRIVER_REPORT: ReportData[] = [
  { id: 'RPT-DRV-01', field1: 'John Doe', field2: '94% Efficiency', field3: '14 Trips completed', field4: 'Active (DL-1234)', status: 'available' },
  { id: 'RPT-DRV-02', field1: 'Jane Smith', field2: '98% Efficiency', field3: '18 Trips completed', field4: 'On Trip (DL-2345)', status: 'on_trip' },
  { id: 'RPT-DRV-03', field1: 'Mike Johnson', field2: '89% Efficiency', field3: '11 Trips completed', field4: 'Active (DL-3456)', status: 'available' },
  { id: 'RPT-DRV-04', field1: 'David Lee', field2: '92% Efficiency', field3: '8 Trips completed', field4: 'Off Duty (DL-4567)', status: 'off_duty' },
];

const COMPLIANCE_REPORT: ReportData[] = [
  { id: 'RPT-CMP-01', field1: 'MH-12-AB-1234', field2: 'Pollution Expiring soon', field3: 'Expires 25-Jun-2026', field4: '7 Days Left', status: 'warning' },
  { id: 'RPT-CMP-02', field1: 'DL-01-XY-5678', field2: 'Insurance Expiring soon', field3: 'Expires 30-Jun-2026', field4: '12 Days Left', status: 'warning' },
  { id: 'RPT-CMP-03', field1: 'KA-03-CD-9012', field2: 'Permit Expiring soon', field3: 'Expires 05-Jul-2026', field4: '17 Days Left', status: 'warning' },
  { id: 'RPT-CMP-04', field1: 'HR-55-EF-3456', field2: 'Documents Expired', field3: 'Expired 15-May-2026', field4: 'Critical Alert', status: 'critical' },
];

export default function Reports() {
  const [reportType, setReportType] = useState<'trips' | 'drivers' | 'compliance'>('trips');
  const [dateRange, setDateRange] = useState('30days');
  const [exporting, setExporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const getActiveData = () => {
    switch (reportType) {
      case 'trips': return { data: TRIP_REPORT, headers: ['Report ID', 'Route Path', 'Cargo Type', 'Revenue', 'Weight', 'Status'] };
      case 'drivers': return { data: DRIVER_REPORT, headers: ['Report ID', 'Driver Name', 'Avg Score', 'Performance Metric', 'Status Code', 'Status'] };
      case 'compliance': return { data: COMPLIANCE_REPORT, headers: ['Report ID', 'Asset Number', 'Compliance Check', 'Deadline Date', 'Alert Window', 'Severity'] };
    }
  };

  const handleExport = () => {
    setExporting(true);
    setSuccessMsg('');
    setTimeout(() => {
      setExporting(false);
      setSuccessMsg(`Successfully generated and downloaded ${reportType}_report_${dateRange}.csv`);
    }, 1500);
  };

  const activeData = getActiveData();

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Operational Reports</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Export logistics statistics, driver performance logs, and compliance audits</p>
        </div>
        <button className="btn btn-amber" onClick={handleExport} disabled={exporting}>
          <Download size={16} /> {exporting ? 'Generating Report...' : 'Export CSV / Data'}
        </button>
      </div>

      {successMsg && (
        <div className="alert-card success-alert" style={{ marginBottom: '1.5rem' }}>
          <CheckCircle2 size={15} style={{ display: 'inline', marginRight: 6 }} />
          {successMsg}
        </div>
      )}

      {/* ── KPI GRID ── */}
      <div className="dashboard-grid">
        {/* Revenue Card */}
        <div className="card stat-card">
          <div className="stat-card-header">
            <div className="stat-icon success"><DollarSign size={20} /></div>
            <span className="stat-trend up"><TrendingUp size={12} /> 8%</span>
          </div>
          <div>
            <div className="stat-value">₹42.5L</div>
            <div className="stat-label">Estimated Revenue</div>
          </div>
        </div>

        {/* Efficiency Card */}
        <div className="card stat-card">
          <div className="stat-card-header">
            <div className="stat-icon primary"><TrendingUp size={20} /></div>
            <span className="stat-trend up"><TrendingUp size={12} /> 2%</span>
          </div>
          <div>
            <div className="stat-value">94.2%</div>
            <div className="stat-label">Fleet Efficiency</div>
          </div>
        </div>

        {/* Drivers utilization */}
        <div className="card stat-card">
          <div className="stat-card-header">
            <div className="stat-icon primary"><Users size={20} /></div>
            <span className="stat-trend neutral">Steady</span>
          </div>
          <div>
            <div className="stat-value">24 Active</div>
            <div className="stat-label">Drivers Assigned</div>
          </div>
        </div>

        {/* Fuel Card */}
        <div className="card stat-card">
          <div className="stat-card-header">
            <div className="stat-icon amber"><Fuel size={20} /></div>
            <span className="stat-trend down" style={{ color: 'var(--color-error)' }}>+4%</span>
          </div>
          <div>
            <div className="stat-value">1,480L</div>
            <div className="stat-label">Fuel Consumption</div>
          </div>
        </div>
      </div>

      {/* ── REPORT VIEWPORT CONTAINER ── */}
      <div className="card" style={{ padding: 0 }}>
        {/* Control Bar */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-container)', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Left Selection */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['trips', 'drivers', 'compliance'] as const).map(t => (
              <button 
                key={t} 
                onClick={() => { setReportType(t); setSuccessMsg(''); }} 
                className={`btn ${reportType === t ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.9rem' }}
              >
                <FileText size={13} /> {t.charAt(0).toUpperCase() + t.slice(1)} Log
              </button>
            ))}
          </div>

          {/* Right Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Calendar size={15} color="var(--text-muted)" />
            <select 
              value={dateRange} 
              onChange={e => { setDateRange(e.target.value); setSuccessMsg(''); }}
              style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8rem', background: '#fff' }}
            >
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="quarter">This Quarter</option>
            </select>

            <Filter size={15} color="var(--text-muted)" style={{ marginLeft: '0.5rem' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Filters</span>
          </div>
        </div>

        {/* Report Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                {activeData.headers.map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {activeData.data.map(row => (
                <tr key={row.id}>
                  <td><strong style={{ color: 'var(--color-primary)' }}>{row.id}</strong></td>
                  <td><strong>{row.field1}</strong></td>
                  <td>{row.field2}</td>
                  <td>{row.field3}</td>
                  <td>{row.field4}</td>
                  <td>
                    <span className={`badge badge-${row.status}`}>
                      {row.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-surface-container)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Showing live operational records for {dateRange.replace('days', ' Days')} interval
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            Reports are synced with database metrics <ChevronRight size={12} />
          </span>
        </div>
      </div>
    </div>
  );
}
