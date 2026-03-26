import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import api from '../services/api';

const RANGES = ['7 days', '30 days', '90 days'];

// ── Helpers ────────────────────────────────────────────────────────────────────
function getDaysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(0, 0, 0, 0);
    return d;
}

function buildVolumeData(campaigns, days) {
    // Generate one bucket per ~(days/8) days for a smooth chart (max 8 points)
    const buckets = 8;
    const msPerBucket = (days * 86400000) / buckets;
    const now = Date.now();
    const cutoff = getDaysAgo(days).getTime();

    const slots = Array.from({ length: buckets }, (_, i) => {
        const start = cutoff + i * msPerBucket;
        const end = start + msPerBucket;
        const label = new Date(start + msPerBucket / 2);
        return {
            day: label.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            sent: 0,
            failed: 0,
        };
    });

    campaigns.forEach(c => {
        const ts = new Date(c.createdAt).getTime();
        if (ts < cutoff || ts > now) return;
        const idx = Math.min(
            Math.floor((ts - cutoff) / msPerBucket),
            buckets - 1
        );
        slots[idx].sent   += c.sentCount    || 0;
        slots[idx].failed += c.failedCount  || 0;
    });

    return slots;
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
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

// ── Component ──────────────────────────────────────────────────────────────────
const Analytics = () => {
    const [range, setRange]           = useState('30 days');
    const [campaigns, setCampaigns]   = useState([]);
    const [loading, setLoading]       = useState(true);

    useEffect(() => {
        api.get('/campaigns')
            .then(r => setCampaigns(Array.isArray(r.data) ? r.data : []))
            .catch(() => setCampaigns([]))
            .finally(() => setLoading(false));
    }, []);

    // ── Derived stats ─────────────────────────────────────────────────────────
    const rangeDays  = range === '7 days' ? 7 : range === '30 days' ? 30 : 90;
    const cutoff     = getDaysAgo(rangeDays);

    const inRange = campaigns.filter(c => new Date(c.createdAt) >= cutoff);

    const totalSent   = inRange.reduce((a, c) => a + (c.sentCount    || 0), 0);
    const totalFailed = inRange.reduce((a, c) => a + (c.failedCount  || 0), 0);
    const totalQueued = inRange.reduce((a, c) => a + (c.recipientCount || 0), 0);
    const deliveryRate = totalQueued > 0
        ? ((totalSent / totalQueued) * 100).toFixed(1) + '%'
        : '—';
    const failureRate = totalQueued > 0
        ? ((totalFailed / totalQueued) * 100).toFixed(1) + '%'
        : '—';

    // ── Volume chart data ─────────────────────────────────────────────────────
    const volumeData = buildVolumeData(campaigns, rangeDays);

    // ── Campaign breakdown (only sent campaigns in range) ─────────────────────
    const sentCampaigns = inRange
        .filter(c => (c.sentCount || 0) > 0 || (c.status || '').toLowerCase() === 'sent')
        .sort((a, b) => (b.sentCount || 0) - (a.sentCount || 0))
        .slice(0, 6);

    // ── Bounce reasons from deliveryLogs ──────────────────────────────────────
    const reasonMap = {};
    inRange.forEach(c => {
        (c.deliveryLogs || []).forEach(log => {
            if (log.status === 'failed') {
                const key = log.message || 'Unknown';
                const short = key.length > 28 ? key.slice(0, 28) + '…' : key;
                reasonMap[short] = (reasonMap[short] || 0) + 1;
            }
        });
    });
    const bounceData = Object.entries(reasonMap)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // ── Stat cards config ─────────────────────────────────────────────────────
    const stats = [
        {
            label: 'Total Sent',
            val: totalSent.toLocaleString(),
            delta: null,
            up: true,
            real: true,
        },
        {
            label: 'Delivery Rate',
            val: deliveryRate,
            delta: null,
            up: true,
            real: true,
        },
        {
            label: 'Avg Open Rate',
            val: '—',
            note: 'Tracking coming soon',
            real: false,
        },
        {
            label: 'Avg Click Rate',
            val: '—',
            note: 'Tracking coming soon',
            real: false,
        },
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#94a3b8', gap: 10 }}>
                <Clock size={20} /> Loading analytics…
            </div>
        );
    }

    return (
        <>
            <div className="d-page-header">
                <div>
                    <h1>Analytics</h1>
                    <p>Track your email performance over time</p>
                </div>
                <div className="d-filter-tabs">
                    {RANGES.map(r => (
                        <button key={r} className={`d-filter-tab${range === r ? ' active' : ''}`} onClick={() => setRange(r)}>{r}</button>
                    ))}
                </div>
            </div>

            {/* Summary stats */}
            <div className="d-stats-grid" style={{ marginBottom: '1.5rem' }}>
                {stats.map(s => (
                    <div key={s.label} className="d-stat-card">
                        <span className="d-stat-label">{s.label}</span>
                        <div className="d-stat-val">{s.val}</div>
                        {s.note ? (
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={11} /> {s.note}
                            </div>
                        ) : s.delta ? (
                            <div className={`d-stat-delta ${s.up ? 'up' : 'down'}`}>
                                {s.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {s.delta}
                            </div>
                        ) : null}
                    </div>
                ))}
            </div>

            {/* Volume chart */}
            <div className="d-card" style={{ marginBottom: '1rem' }}>
                <div className="d-card-header">
                    <div>
                        <p className="d-card-title">Email Volume</p>
                        <p className="d-card-sub">Emails sent and failed over {range}</p>
                    </div>
                </div>
                {totalSent === 0 && totalFailed === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                        No emails sent in this period yet.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={volumeData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="aSent" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor="#f97316" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="aFail" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.12} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="sent"   name="Sent"   stroke="#f97316" strokeWidth={2} fill="url(#aSent)" dot={false} />
                            <Area type="monotone" dataKey="failed" name="Failed" stroke="#ef4444" strokeWidth={2} fill="url(#aFail)" dot={false} strokeDasharray="4 4" />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className="d-grid-2" style={{ marginBottom: '1rem' }}>
                {/* Campaign breakdown */}
                <div className="d-card" style={{ padding: 0 }}>
                    <div className="d-card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                        <p className="d-card-title">Campaign Breakdown</p>
                    </div>
                    {sentCampaigns.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                            No sent campaigns in this period.
                        </div>
                    ) : (
                        <table className="d-table">
                            <thead>
                                <tr>
                                    <th>Campaign</th>
                                    <th>Sent</th>
                                    <th>Failed</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sentCampaigns.map(c => {
                                    const sent   = c.sentCount      || 0;
                                    const failed = c.failedCount    || 0;
                                    const total  = c.recipientCount || sent + failed;
                                    return (
                                        <tr key={c._id}>
                                            <td style={{ fontWeight: 600, fontSize: '0.82rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</td>
                                            <td style={{ color: '#10b981', fontWeight: 600 }}>{sent.toLocaleString()}</td>
                                            <td style={{ color: failed > 0 ? '#ef4444' : '#94a3b8', fontWeight: 600 }}>{failed.toLocaleString()}</td>
                                            <td>{total.toLocaleString()}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Bounce / failure reasons */}
                <div className="d-card">
                    <div className="d-card-header">
                        <p className="d-card-title">Failure Reasons</p>
                    </div>
                    {bounceData.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                            🎉 No failures recorded in this period.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={bounceData} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="reason" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={110} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="count" name="Count" fill="#ef4444" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </>
    );
};

export default Analytics;
