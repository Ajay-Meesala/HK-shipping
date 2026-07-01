import { useState } from 'react';
import { Truck, Mail, Lock, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ── Role definitions ──────────────────────────────────────────────────────────
const ROLES = [
  { value: 'admin',    label: 'Admin / Dispatcher' },
  { value: 'driver',   label: 'Driver / Trader'    },
];

// Demo passcodes used when Firebase login fails (offline / emulator mode)
const DEMO_PASSCODES: Record<string, string> = {
  admin:    'admin123',
  driver:   'driver123',
};

// Demo credentials so the app works without a real Firebase user
const DEMO_EMAILS: Record<string, string> = {
  admin:    'admin@hkshipping.com',
  driver:   'driver@hkshipping.com',
};

interface LoginProps {
  /** Called after successful login with the resolved user information */
  onLogin: (email: string, role: string, name: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const { login } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState<'admin' | 'driver'>('admin');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // ── Submit handler ──────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all credentials.');
      return;
    }

    setLoading(true);

    try {
      // ── Attempt real Firebase Auth ──────────────────────────────────────────
      const appUser = await login(email.trim(), password.trim());
      onLogin(appUser.email, appUser.role, appUser.displayName);
    } catch (firebaseErr: any) {
      // ── Firebase Auth failed — fall back to demo passcode mode ─────────────
      // This keeps the app functional when Firebase Auth is not yet configured
      // with actual user accounts.
      const demoPassword = DEMO_PASSCODES[role];
      const demoEmail    = DEMO_EMAILS[role];

      if (
        password === demoPassword &&
        (email.trim() === demoEmail || email.trim().includes('@'))
      ) {
        // Simulate auth delay
        await new Promise((r) => setTimeout(r, 900));
        const displayName = email.split('@')[0]
          .split('.')
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(' ') || (role === 'admin' ? 'Admin Manager' : 'Driver User');
        onLogin(email.trim(), role, displayName);
      } else {
        // Show friendly error
        const code = firebaseErr?.code as string | undefined;
        if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
          const roleLabel = ROLES.find((r) => r.value === role)?.label || role;
          setError(
            `Incorrect credentials for ${roleLabel}. ` +
            `Demo mode: use "${DEMO_EMAILS[role]}" and passcode "${DEMO_PASSCODES[role]}".`
          );
        } else if (code === 'auth/invalid-email') {
          setError('Please enter a valid email address.');
        } else {
          setError('Login failed. Please check your credentials and try again.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Render — identical visual structure & class names as before ─────────────
  return (
    <div className="login-page">
      <main style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '440px' }}>
        <div className="login-card">

          {/* Logo & Header */}
          <div className="login-logo-wrap">
            <div className="login-logo-icon">
              <Truck size={32} color="#1E3A5F" />
            </div>
            <h1 className="login-title">Welcome back</h1>
            <p className="login-subtitle">HK Shipping Command Center</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert-card critical" style={{ marginBottom: '1.25rem', fontSize: '0.8rem' }}>
              <strong>Authentication Error:</strong> {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Role Selector */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Access Role</label>
              <div style={{ position: 'relative' }}>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'driver')}
                  style={{ appearance: 'none', paddingRight: '2.5rem' }}
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <ChevronDown size={16} color="#94A3B8" style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Email */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Corporate Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#94A3B8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'admin' ? 'admin@hkshipping.com' : 'yourname@company.com'}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ margin: 0 }}>Security Password</label>
                <a href="#" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#F59E0B', textDecoration: 'none' }}>
                  Forgot Password?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#94A3B8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
            </div>

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" id="remember" style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              <label htmlFor="remember" style={{ fontSize: '0.8rem', color: '#64748B', textTransform: 'none', letterSpacing: 'normal', fontWeight: 400, cursor: 'pointer' }}>
                Remember me
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-amber"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.875rem',
                fontSize: '0.9rem',
                borderRadius: '10px',
                marginTop: '0.5rem',
                opacity: loading ? 0.8 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: '#1E3A5F' }} />
                  Authenticating...
                </>
              ) : (
                <>
                  <Lock size={18} />
                  Secure Login
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', marginBottom: '0.75rem' }}>
              <a href="#" style={{ fontSize: '0.7rem', color: '#94A3B8', textDecoration: 'none' }}>IT Support</a>
              <span style={{ color: '#CBD5E1' }}>·</span>
              <a href="#" style={{ fontSize: '0.7rem', color: '#94A3B8', textDecoration: 'none' }}>Legal Policy</a>
            </div>
            <p style={{ fontSize: '0.6rem', color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Proprietary Fleet Software © 2026
            </p>
          </div>
        </div>

        {/* Status Bar */}
        <div className="login-status-bar">
          <div className="login-status-dot">
            <span className="ping"></span>
            <span className="dot"></span>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>
            Regional Cloud Sync Active
          </span>
        </div>
      </main>
    </div>
  );
}
