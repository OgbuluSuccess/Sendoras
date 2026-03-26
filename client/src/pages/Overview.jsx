import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Mail, MousePointerClick, TrendingUp, Activity,
    Plus, Clock, CheckCircle2, SendHorizonal
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import campaignService from '../services/campaigns';
import api from '../services/api';

const STATUS_BADGE = {
    sent: { cls: 'd-badge-success', label: 'Sent' },
    draft: { cls: 'd-badge-neutral', label: 'Draft' },
    sending: { cls: 'd-badge-info', label: 'Sending' },
    failed: { cls: 'd-badge-danger', label: 'Failed' },
    queued: { cls: 'd-badge-warning', label: 'Queued' },
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#0f172a', borderRadius: 10, padding: '0.75rem 1rem' }}>
            <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: '0 0 0.5rem' }}>{label}</p>
            {payload.map(p => (
                <p key={p.name} style={{ color: p.color, fontSize: '0.82rem', margin: '0.2rem 0', fontWeight: 600 }}>
                    {p.name}: {p.value.toLocaleString()}
                </p>
            ))}
        </div>
    );
};

// Build chart data from real campaigns — last 6 months
const buildChartData = (campaigns) => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            month: d.toLocaleString('default', { month: 'short' }),
            year: d.getFullYear(),
            monthIdx: d.getMonth(),
            sent: 0, opens: 0, clicks: 0,
        });
    }
    campaigns.forEach(c => {
        if (c.status !== 'sent') return;
        const d = new Date(c.createdAt);
        const bucket = months.find(m => m.monthIdx === d.getMonth() && m.year === d.getFullYear());
        if (!bucket) return;
        const count = c.recipients?.length || 0;
        bucket.sent += count;
        bucket.opens += Math.round(count * ((c.analytics?.openRate || 0) / 100));
        bucket.clicks += Math.round(count * ((c.analytics?.clickRate || 0) / 100));
    });
    return months;
};

const fmt = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
const pct = (n) => n > 0 ? `${n.toFixed(1)}%` : '—';

const Overview = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [allCampaigns, setAllCampaigns] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            campaignService.getCampaigns(),
            api.get('/auth/me').then(r => r.data).catch(() => null),
        ]).then(([data, prof]) => {
            const list = Array.isArray(data) ? data : [];
            setAllCampaigns(list);
            setCampaigns(list.slice(0, 5));
            setProfile(prof);
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    // Real aggregate stats from sent campaigns only
    const sentCampaigns = allCampaigns.filter(c => c.status === 'sent');
    const totalSent = sentCampaigns.reduce((s, c) => s + (c.recipients?.length || 0), 0);
    const avgOpen = sentCampaigns.length ? sentCampaigns.reduce((s, c) => s + (c.analytics?.openRate || 0), 0) / sentCampaigns.length : 0;
    const avgClick = sentCampaigns.length ? sentCampaigns.reduce((s, c) => s + (c.analytics?.clickRate || 0), 0) / sentCampaigns.length : 0;
    const avgBounce = sentCampaigns.length ? sentCampaigns.reduce((s, c) => s + (c.analytics?.bounceRate || 0), 0) / sentCampaigns.length : 0;

    // Usage from profile (real plan data)
    const emailsUsed = profile?.emailsUsedThisMonth ?? profile?.emailsSentThisMonth ?? 0;
    const emailsLimit = profile?.planLimit ?? profile?.monthlyEmailLimit ?? null;
    const planName = profile?.planName ?? profile?.plan?.name ?? null;
    const usagePct = emailsLimit ? Math.min(100, Math.round((emailsUsed / emailsLimit) * 100)) : 0;

    const chartData = buildChartData(allCampaigns);
    const hasChartData = chartData.some(m => m.sent > 0);

    const STAT_CARDS = [
        { label: 'Total Sent', value: fmt(totalSent), icon: <SendHorizonal size={18} />, iconBg: '#fff7ed', iconColor: '#f97316' },
        { label: 'Avg Open Rate', value: pct(avgOpen), icon: <Mail size={18} />, iconBg: '#f0fdf4', iconColor: '#10b981' },
        { label: 'Avg Click Rate', value: pct(avgClick), icon: <MousePointerClick size={18} />, iconBg: '#eff6ff', iconColor: '#3b82f6' },
        { label: 'Avg Bounce Rate', value: pct(avgBounce), icon: <Activity size={18} />, iconBg: '#fff1f2', iconColor: '#ef4444' },
    ];

    const subText = sentCampaigns.length > 0
        ? `from ${sentCampaigns.length} campaign${sentCampaigns.length > 1 ? 's' : ''}`
        : 'No sent campaigns yet';

    return (
        <>
            {/* ── Stat Cards ── */}
            <div className="d-stats-grid">
                {STAT_CARDS.map(s => (
                    <div key={s.label} className="d-stat-card">
                        <div className="d-stat-header">
                            <span className="d-stat-label">{s.label}</span>
                            <div className="d-stat-icon" style={{ background: s.iconBg, color: s.iconColor }}>{s.icon}</div>
                        </div>
                        <div className="d-stat-val">{s.value}</div>
                        <div className="d-stat-delta" style={{ color: '#94a3b8' }}>{subText}</div>
                    </div>
                ))}
            </div>

            {/* ── Main grid: chart + sidebar ── */}
            <div className="d-grid-2-3" style={{ marginBottom: '1.5rem' }}>

                {/* Area Chart */}
                <div className="d-card" style={{ padding: '1.5rem' }}>
                    <div className="d-card-header">
                        <div>
                            <p className="d-card-title">Email Performance</p>
                            <p className="d-card-sub">Sent, opens &amp; clicks — last 6 months</p>
                        </div>
                    </div>
                    {hasChartData ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gSent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gOpens" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="sent" name="Sent" stroke="#f97316" strokeWidth={2} fill="url(#gSent)" dot={false} />
                                <Area type="monotone" dataKey="opens" name="Opens" stroke="#10b981" strokeWidth={2} fill="url(#gOpens)" dot={false} />
                                <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#3b82f6" strokeWidth={2} fill="none" dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="d-empty" style={{ height: 220 }}>
                            <Mail size={28} color="#cbd5e1" />
                            <p style={{ color: '#94a3b8', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                                No data yet — send your first campaign to see performance
                            </p>
                        </div>
                    )}
                </div>

                {/* Right sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Monthly usage — real data */}
                    <div className="d-card">
                        <div className="d-card-header">
                            <p className="d-card-title">Monthly Usage</p>
                            {planName && <span className="d-badge d-badge-neutral">{planName}</span>}
                        </div>
                        {emailsLimit ? (
                            <>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: '0.4rem' }}>
                                    {emailsUsed.toLocaleString()}{' '}
                                    <span style={{ fontSize: '1rem', fontWeight: 500, color: '#64748b' }}>/ {emailsLimit.toLocaleString()}</span>
                                </div>
                                <div className="d-progress-bar" style={{ marginBottom: '0.5rem' }}>
                                    <div className="d-progress-fill" style={{ width: `${usagePct}%` }} />
                                </div>
                                <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>
                                    {usagePct}% of your monthly limit used
                                </p>
                            </>
                        ) : (
                            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 0.5rem' }}>
                                {emailsUsed > 0
                                    ? `${emailsUsed.toLocaleString()} emails sent this month`
                                    : 'No emails sent this month'}
                            </p>
                        )}
                        <Link to="/billing" className="d-btn d-btn-primary" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}>
                            Upgrade Plan
                        </Link>
                    </div>

                    {/* Quick actions */}
                    <div className="d-card">
                        <p className="d-card-title" style={{ marginBottom: '0.85rem' }}>Quick Actions</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <Link to="/campaigns/new" className="d-btn d-btn-primary" style={{ justifyContent: 'center' }}><Plus size={16} /> New Campaign</Link>
                            <Link to="/validation" className="d-btn d-btn-secondary" style={{ justifyContent: 'center' }}><CheckCircle2 size={16} /> Validate Email</Link>
                            <Link to="/contacts" className="d-btn d-btn-ghost" style={{ justifyContent: 'center' }}><TrendingUp size={16} /> Upload Contacts</Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Recent Campaigns ── */}
            <div className="d-card" style={{ padding: 0 }}>
                <div className="d-card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                    <div>
                        <p className="d-card-title">Recent Campaigns</p>
                        <p className="d-card-sub">Your last 5 email campaigns</p>
                    </div>
                    <Link to="/campaigns" className="d-btn d-btn-ghost d-btn-sm">View All →</Link>
                </div>

                {loading ? (
                    <div className="d-empty"><Clock size={24} style={{ color: '#94a3b8' }} /><p>Loading…</p></div>
                ) : campaigns.length === 0 ? (
                    <div className="d-empty">
                        <div className="d-empty-icon"><Mail size={24} /></div>
                        <h3>No campaigns yet</h3>
                        <p>Create your first email campaign to get started.</p>
                        <Link to="/campaigns/new" className="d-btn d-btn-primary"><Plus size={16} /> New Campaign</Link>
                    </div>
                ) : (
                    <div className="d-table-wrap" style={{ borderRadius: 0, border: 'none' }}>
                        <table className="d-table">
                            <thead>
                                <tr>
                                    <th>Campaign</th>
                                    <th>Status</th>
                                    <th>Recipients</th>
                                    <th>Open Rate</th>
                                    <th>Click Rate</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.map(c => {
                                    const badge = STATUS_BADGE[c.status] || STATUS_BADGE.draft;
                                    return (
                                        <tr key={c._id}>
                                            <td style={{ fontWeight: 600 }}>{c.name}</td>
                                            <td><span className={`d-badge ${badge.cls}`}>{badge.label}</span></td>
                                            <td>{(c.recipients?.length ?? 0).toLocaleString()}</td>
                                            <td>{c.analytics?.openRate ? `${c.analytics.openRate.toFixed(1)}%` : '—'}</td>
                                            <td>{c.analytics?.clickRate ? `${c.analytics.clickRate.toFixed(1)}%` : '—'}</td>
                                            <td style={{ color: '#64748b', fontSize: '0.82rem' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
};

export default Overview;
