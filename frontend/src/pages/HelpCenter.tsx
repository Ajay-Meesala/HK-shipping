import { useState, useMemo } from 'react';
import {
  Search, HelpCircle, Mail, Phone, Clock,
  MessageSquare, BookOpen, ChevronDown, ChevronUp,
  Activity, CheckCircle2, Send, FileText,
  User, Shield
} from 'lucide-react';

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQ[] = [
  {
    id: 'faq-1',
    category: 'dispatch',
    question: 'How do I assign a new driver to a trip?',
    answer: 'Navigate to the "Assign Trip" tab in the sidebar. Fill in the trip details (Origin, Destination, Cargo details). In the "Assign Driver & Vehicle" section, you can select from the available drivers and vehicles listed on the right. Once selected, click the "Create Trip" button to dispatch the driver.'
  },
  {
    id: 'faq-2',
    category: 'compliance',
    question: 'Where can I view expired vehicle documents?',
    answer: 'Go to the "Operational Reports" page, click the "Compliance Log" button. Here, you will find active warning alerts for Pollution, Insurance, and Permits that are nearing expiry or have already expired, including days left and severity indicators.'
  },
  {
    id: 'faq-3',
    category: 'dispatch',
    question: 'How do I complete or cancel an active trip?',
    answer: 'Go to "Active Trips" and click the specific trip card or the "View Details" button. In the Trip Detail view, depending on your role permissions, you can use the action buttons to "Advance Status", "Mark as Completed", or "Cancel Trip". You can also update transit milestones or record issues.'
  },
  {
    id: 'faq-4',
    category: 'billing',
    question: 'How are fuel consumption metrics computed?',
    answer: 'Fuel consumption is recorded at the end of each trip during vehicle check-in. The system tracks mileage logged, cargo weight, and vehicle type to compute the overall fleet fuel efficiency (visible on the Reports dashboard).'
  },
  {
    id: 'faq-5',
    category: 'security',
    question: 'How do I update access roles or reset passwords?',
    answer: 'Access roles (Admin, Dispatcher, Driver, Accounts, Compliance) are assigned during user creation. If you need to change your passcode or reset credentials for a fleet driver, contact the system administrator via the support ticket form below.'
  },
  {
    id: 'faq-6',
    category: 'general',
    question: 'Can I export operational logs as a CSV file?',
    answer: 'Yes! Navigate to the "Reports" page. Apply any date filters or select the log type (Trips, Drivers, or Compliance) and click the "Export CSV / Data" button on the top right. The download will start automatically.'
  }
];

const CATEGORIES = [
  { id: 'all', label: 'All Topics', icon: BookOpen },
  { id: 'dispatch', label: 'Trips & Dispatch', icon: Activity },
  { id: 'compliance', label: 'Compliance & Safety', icon: Shield },
  { id: 'billing', label: 'Fuel & Billing', icon: FileText }
];

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  // Ticket Form state
  const [ticketName, setTicketName] = useState('');
  const [ticketEmail, setTicketEmail] = useState('');
  const [ticketCategory, setTicketCategory] = useState('trip');
  const [ticketPriority, setTicketPriority] = useState('medium');
  const [ticketMsg, setTicketMsg] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState('');

  // Toggle FAQ expansion
  const toggleFaq = (id: string) => {
    setExpandedFaq(prev => (prev === id ? null : id));
  };

  // Filter FAQs based on search and category
  const filteredFaqs = useMemo(() => {
    return FAQ_ITEMS.filter(faq => {
      const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
      const matchesSearch =
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketName || !ticketEmail || !ticketMsg) return;

    setSubmittingTicket(true);
    setTicketSuccess('');

    setTimeout(() => {
      setSubmittingTicket(false);
      setTicketSuccess(`Support ticket submitted successfully! Reference ID: ticket-${Math.floor(1000 + Math.random() * 9000)}. We will email you at ${ticketEmail} shortly.`);
      setTicketName('');
      setTicketEmail('');
      setTicketMsg('');
    }, 1200);
  };

  return (
    <div>
      {/* Hero Header Area */}
      <div 
        style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
          borderRadius: '16px',
          padding: '2.5rem 2rem',
          color: '#ffffff',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div style={{ maxWidth: '640px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-amber)' }}>
            Support Portal
          </span>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0.25rem 0 0.5rem', color: '#ffffff' }}>
            How can we help you today?
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Search the knowledge base for instant answers or raise a ticket directly to our fleet operations support desk.
          </p>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search 
              size={18} 
              color="var(--text-secondary)" 
              style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} 
            />
            <input 
              type="text" 
              placeholder="Search guides, FAQs, rules, and procedures..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                background: '#ffffff',
                color: 'var(--text-primary)',
                paddingLeft: '2.75rem',
                height: '46px',
                borderRadius: '10px',
                fontSize: '0.95rem',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Left FAQs / Ticket, Right System Status & Direct Contact */}
      <div className="responsive-grid-2" style={{ gap: '1.5rem' }}>
        
        {/* LEFT COLUMN: FAQ & Help Desk Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* FAQ section */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HelpCircle size={20} color="var(--color-primary)" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Frequently Asked Questions</h2>
              </div>
              
              {/* Category Filter buttons */}
              <div style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto', paddingBottom: '2px' }}>
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.25rem', borderRadius: '6px' }}
                    >
                      <Icon size={12} />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FAQs List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map(faq => {
                  const isExpanded = expandedFaq === faq.id;
                  return (
                    <div 
                      key={faq.id} 
                      style={{
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        background: isExpanded ? 'var(--bg-main)' : 'var(--bg-surface)',
                        transition: 'all var(--transition-speed)'
                      }}
                    >
                      <button
                        onClick={() => toggleFaq(faq.id)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          padding: '1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          color: isExpanded ? 'var(--color-primary)' : 'var(--text-primary)'
                        }}
                      >
                        <span>{faq.question}</span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      
                      {isExpanded && (
                        <div 
                          style={{
                            padding: '0 1rem 1rem',
                            fontSize: '0.85rem',
                            color: 'var(--text-secondary)',
                            lineHeight: '1.5',
                            borderTop: '1px solid var(--border-color)',
                            paddingTop: '0.75rem'
                          }}
                        >
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                  No matching FAQs found for "{searchQuery}". Try adjusting your filters.
                </div>
              )}
            </div>
          </div>

          {/* Raise a Support Ticket Form */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <MessageSquare size={20} color="var(--color-primary)" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Open a Support Ticket</h2>
            </div>

            {ticketSuccess && (
              <div className="alert-card success-alert" style={{ marginBottom: '1.25rem' }}>
                <CheckCircle2 size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                {ticketSuccess}
              </div>
            )}

            <form onSubmit={handleSubmitTicket}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ticket-name">Your Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      id="ticket-name"
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={ticketName}
                      onChange={e => setTicketName(e.target.value)}
                      style={{ paddingLeft: '2.25rem' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="ticket-email">Work Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      id="ticket-email"
                      type="email"
                      required
                      placeholder="johndoe@hkshipping.com"
                      value={ticketEmail}
                      onChange={e => setTicketEmail(e.target.value)}
                      style={{ paddingLeft: '2.25rem' }}
                    />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ticket-category">Category</label>
                  <select
                    id="ticket-category"
                    value={ticketCategory}
                    onChange={e => setTicketCategory(e.target.value)}
                  >
                    <option value="trip">Active Trip & Dispatch Errors</option>
                    <option value="fleet">Fleet Vehicles / Driver Registry</option>
                    <option value="permissions">Login, Access, & Roles</option>
                    <option value="reports">Data Export & Reports</option>
                    <option value="billing">Diesel Bills & Transit Charges</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="ticket-priority">Priority Level</label>
                  <select
                    id="ticket-priority"
                    value={ticketPriority}
                    onChange={e => setTicketPriority(e.target.value)}
                  >
                    <option value="low">Low (General Question)</option>
                    <option value="medium">Medium (Issue Needs Fixing)</option>
                    <option value="high">High (Trips Blocked)</option>
                    <option value="emergency">Emergency (Breakdown/Accident)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="ticket-msg">Detailed Message</label>
                <textarea
                  id="ticket-msg"
                  required
                  rows={4}
                  placeholder="Describe your issue or request in detail. Please provide Trip IDs or Truck numbers if applicable..."
                  value={ticketMsg}
                  onChange={e => setTicketMsg(e.target.value)}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submittingTicket}
                  style={{ gap: '0.5rem' }}
                >
                  <Send size={15} />
                  {submittingTicket ? 'Submitting...' : 'Submit Support Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: System Status & Direct Support */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Real-time System Status Dashboard */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={20} color="var(--color-success)" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>System Health Status</h2>
              </div>
              <span 
                className="badge badge-completed" 
                style={{ 
                  background: 'var(--color-success-glow)', 
                  color: 'var(--color-success)',
                  borderColor: 'rgba(16, 185, 129, 0.3)'
                }}
              >
                All Systems Operational
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              
              {/* Service item: database */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.65rem', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Mock Database Link</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Local sqlite/in-memory active</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-success)', fontSize: '0.8rem', fontWeight: 700 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)' }}></span>
                  Online
                </div>
              </div>

              {/* Service item: backend api */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.65rem', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Backend Server API (Port 5000)</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Active dispatcher endpoints</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-success)', fontSize: '0.8rem', fontWeight: 700 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)' }}></span>
                  Online (14ms)
                </div>
              </div>

              {/* Service item: Vercel edge routes */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.65rem', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Vite Frontend Assets</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Vercel edge caching</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-success)', fontSize: '0.8rem', fontWeight: 700 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)' }}></span>
                  Deployed (100%)
                </div>
              </div>

              {/* Service item: GPS tracking gateway */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>SMS / GPS Tracker Gateway</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Telemetry ping active</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-success)', fontSize: '0.8rem', fontWeight: 700 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)' }}></span>
                  Active
                </div>
              </div>

            </div>
          </div>

          {/* Contact support details */}
          <div className="card" style={{ background: 'var(--bg-surface-container)', border: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--color-primary)' }}>Direct Support Details</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              If you are facing immediate operational emergencies (e.g. accidents, breakdowns, custom clearance delay), call our 24/7 hotline.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              
              {/* Emergency Hotline */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div 
                  style={{ 
                    background: 'var(--color-amber-glow)', 
                    color: 'var(--color-amber)', 
                    padding: '0.5rem', 
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Phone size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Emergency Hotline</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)' }}>+91 98765 43210</div>
                </div>
              </div>

              {/* Email Support */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div 
                  style={{ 
                    background: 'var(--color-primary-glow)', 
                    color: 'var(--color-primary)', 
                    padding: '0.5rem', 
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Mail size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Email Help Desk</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)' }}>ops-support@hkshipping.com</div>
                </div>
              </div>

              {/* Operations Hours */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div 
                  style={{ 
                    background: 'rgba(0, 0, 0, 0.05)', 
                    color: 'var(--text-secondary)', 
                    padding: '0.5rem', 
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Clock size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Operating Hours</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>24 / 7 / 365 Operations</div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
