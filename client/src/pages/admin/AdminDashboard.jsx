import React, { useState, useEffect } from 'react';
import { Users, Mail, DollarSign, Activity, TrendingUp, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import adminService from '../../services/admin';
import '../../styles/DashboardNew.css';

// ── Provider health tile ─────────────────────────────────────────────────────
const HealthTile = ({ name, active, detail }) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: '0.85rem',
        padding: '0.9rem 1.1rem',
        background: active ? '#f0fdf4' : '#f8fafc',
        border: `1px solid ${active ? '#86efac' : '#e2e8f0'}`,
        borderRadius: 12, flex: '1 1 200px'
    }}>
        <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: active ? '#dcfce7' : '#f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            {active
                ? <CheckCircle2 size={18} color="#16a34a" />
                : <XCircle size={18} color="#94a3b8" />}
        </div>
        <div>
            <p style={{ fontWeight: 700, fontSize: '0.85rem', color: active ? '#15803d' : '#64748b', margin: 0 }}>{name}</p>
            <p style={{ fontSize: '0.72rem', color: active ? '#4ade80' : '#94a3b8', margin: 0 }}>{detail}</p>
        </div>
    </div>
);

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = async () => {
        try {
            const data = await adminService.getSystemStats();
            setStats(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    };

    useEffect(() => { load(); }, []);

    const refresh = () => { setRefreshing(true); load(); };

    const STAT_CARDS = [
        { label: 'Total Users', value: stats?.users ?? '—', icon: <Users size={18} />, iconBg: '#f0fdf4', iconColor: '#10b981' },
        { label: 'Total Campaigns', value: stats?.campaigns ?? '—', icon: <Mail size={18} />, iconBg: '#eff6ff', iconColor: '#3b82f6' },
        { label: 'Total Revenue', value: `$${stats?.revenue ?? 0}`, icon: <DollarSign size={18} />, iconBg: '#fffbeb', iconColor: '#f59e0b' },
        { label: 'Transactions', value: stats?.transactions ?? '—', icon: <Activity size={18} />, iconBg: '#faf5ff', iconColor: '#8b5cf6' },
    ];

    // Derive provider health from stats
    const providers = stats?.integrations?.activeProviders || [];
    const sesActive = providers.includes('ses');
    const resendActive = providers.includes('resend');
    const redisActive = stats?.integrations?.redis !== false;

    return (
        <>
            <div className="d-page-header">
                <div>
                    <h1>Admin Overview</h1>
                    <p>System-wide statistics and management</p>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                    <button
                        className="d-btn d-btn-secondary d-btn-sm"
                        onClick={refresh}
                        disabled={refreshing}
                        style={{ gap: '0.35rem' }}
                    >
                        <RefreshCw size={13} className={refreshing ? 'spin' : ''} />
                        Refresh
                    </button>
                    <span className="d-badge d-badge-danger" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>Admin</span>
                </div>
            </div>

            {loading ? (
                <div className="d-empty"><p>Loading stats…</p></div>
            ) : (
                <>
                    {/* Stat cards */}
                    <div className="d-stats-grid">
                        {STAT_CARDS.map(s => (
                            <div key={s.label} className="d-stat-card">
                                <div className="d-stat-header">
                                    <span className="d-stat-label">{s.label}</span>
                                    <div className="d-stat-icon" style={{ background: s.iconBg, color: s.iconColor }}>{s.icon}</div>
                                </div>
                                <div className="d-stat-val">{s.value}</div>
                                <div className="d-stat-delta up"><TrendingUp size={13} /> All time</div>
                            </div>
                        ))}
                    </div>

                    {/* Sending Infrastructure Health */}
                    <div className="d-card" style={{ marginTop: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>Sending Infrastructure</h3>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Live status of your email sending services</p>
                            </div>
                            {!sesActive && !resendActive && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>
                                    <AlertCircle size={14} /> No active sending provider
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <HealthTile
                                name="Primary Email Service"
                                active={sesActive}
                                detail={sesActive ? 'Connected & ready' : 'Not configured'}
                            />
                            <HealthTile
                                name="Backup Email Service"
                                active={resendActive}
                                detail={resendActive ? 'Connected & ready' : 'Not configured — add API key'}
                            />
                            <HealthTile
                                name="Message Queue (Redis)"
                                active={redisActive}
                                detail={redisActive ? 'Connected' : 'Disconnected — check REDIS_URL'}
                            />
                        </div>
                        <p style={{ marginTop: '0.85rem', fontSize: '0.72rem', color: '#94a3b8' }}>
                            Active providers: <strong style={{ color: '#334155' }}>{providers.length > 0 ? providers.join(', ').toUpperCase() : 'None'}</strong>
                            &nbsp;·&nbsp; Configure in <code style={{ background: '#f1f5f9', padding: '0.1rem 0.3rem', borderRadius: 4 }}>server/.env</code> → <code style={{ background: '#f1f5f9', padding: '0.1rem 0.3rem', borderRadius: 4 }}>EMAIL_PROVIDER</code>
                        </p>
                    </div>
                </>
            )}
        </>
    );
};

export default AdminDashboard;

