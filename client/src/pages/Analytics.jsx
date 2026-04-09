import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Clock, Send, CheckCircle, Eye, MousePointerClick, BarChart3, PieChart } from 'lucide-react';
import api from '../services/api';

const RANGES = ['7 days', '30 days', '90 days'];

const StatIcon = ({ type }) => {
    switch (type) {
        case 'Total Sent': return <div style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', color: '#ea580c', padding: '0.7rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(234, 88, 12, 0.1)' }}><Send size={18} /></div>;
        case 'Delivery Rate': return <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', color: '#16a34a', padding: '0.7rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(22, 163, 74, 0.1)' }}><CheckCircle size={18} /></div>;
        case 'Avg Open Rate': return <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', color: '#2563eb', padding: '0.7rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.1)' }}><Eye size={18} /></div>;
        case 'Avg Click Rate': return <div style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)', color: '#9333ea', padding: '0.7rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(147, 51, 234, 0.1)' }}><MousePointerClick size={18} /></div>;
        default: return null;
    }
}

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
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '2rem' }}>
            <div className="d-page-header" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div>
                        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.8rem' }}>
                            <BarChart3 size={24} color="#f97316" /> Analytics
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0.3rem 0 0' }}>Detailed insights into your email performance</p>
                    </div>
                    
                    {/* Premium Segmented Control */}
                    <div style={{ display: 'flex', gap: '0.3rem', background: '#f1f5f9', padding: '0.35rem', borderRadius: '12px', overflowX: 'auto', whiteSpace: 'nowrap', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)', maxWidth: '100%' }}>
                        {RANGES.map(r => (
                            <button 
                                key={r} 
                                onClick={() => setRange(r)}
                                style={{ 
                                    padding: '0.5rem 1.25rem', 
                                    border: 'none', 
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    background: range === r ? '#fff' : 'transparent',
                                    color: range === r ? '#0f172a' : '#64748b',
                                    boxShadow: range === r ? '0 2px 5px rgba(0,0,0,0.08), 0 1px 1px rgba(0,0,0,0.04)' : 'none',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    flexShrink: 0
                                }}
                            >{r}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                {stats.map(s => (
                    <div 
                        key={s.label} 
                        style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02)', transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'default' }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.05)'; }} 
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02)'; }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '0.2rem' }}>{s.label}</span>
                            <StatIcon type={s.label} />
                        </div>
                        <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-1px', marginBottom: '0.75rem', lineHeight: '1' }}>{s.val}</div>
                        {s.note ? (
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 500, background: '#f8fafc', padding: '0.4rem 0.6rem', borderRadius: '6px', width: 'fit-content', border: '1px solid #f1f5f9' }}>
                                <Clock size={12} /> {s.note}
                            </div>
                        ) : s.delta ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div className={`d-stat-delta ${s.up ? 'up' : 'down'}`} style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                                    {s.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                    {s.delta}
                                </div>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>vs previous</span>
                            </div>
                        ) : null}
                    </div>
                ))}
            </div>

            {/* Volume chart */}
            <div style={{ background: '#fff', marginBottom: '2rem', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02)' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: '#fff7ed', padding: '0.5rem', borderRadius: '10px' }}>
                        <BarChart3 size={20} color="#f97316" />
                    </div>
                    <div>
                        <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Email Volume</p>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.1rem 0 0 0' }}>Daily breakdown of sent and failed emails over the selected {range}</p>
                    </div>
                </div>
                {totalSent === 0 && totalFailed === 0 ? (
                    <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#94a3b8', fontSize: '0.95rem', background: '#f8fafc', margin: '1.5rem', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                        <div style={{ marginBottom: '1rem' }}><BarChart3 size={36} color="#cbd5e1" style={{ margin: '0 auto' }} /></div>
                        No email activity recorded in this period.
                    </div>
                ) : (
                    <div style={{ padding: '1.5rem 1.5rem 1rem' }}>
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={volumeData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="aSent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#f97316" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="aFail" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} dx={-10} />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                <Area type="monotone" dataKey="sent"   name="Sent"   stroke="#f97316" strokeWidth={3} fill="url(#aSent)" dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#f97316' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#f97316' }} />
                                <Area type="monotone" dataKey="failed" name="Failed" stroke="#ef4444" strokeWidth={2} fill="url(#aFail)" dot={false} strokeDasharray="4 4" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1rem' }}>
                {/* Campaign breakdown */}
                <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02)' }}>
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ background: '#eff6ff', padding: '0.4rem', borderRadius: '8px' }}><PieChart size={16} color="#3b82f6" /></div>
                        <p style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Campaign Breakdown</p>
                    </div>
                    {sentCampaigns.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 2rem', color: '#94a3b8', fontSize: '0.875rem', background: '#f8fafc', margin: '1rem', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                            No sent campaigns in this period.
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="d-table" style={{ margin: 0, border: 'none' }}>
                                <thead>
                                    <tr>
                                        <th style={{ paddingLeft: '1.5rem' }}>Campaign</th>
                                        <th>Sent</th>
                                        <th>Failed</th>
                                        <th style={{ paddingRight: '1.5rem' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sentCampaigns.map(c => {
                                        const sent   = c.sentCount      || 0;
                                        const failed = c.failedCount    || 0;
                                        const total  = c.recipientCount || sent + failed;
                                        return (
                                            <tr key={c._id}>
                                                <td style={{ fontWeight: 600, fontSize: '0.82rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: '1.5rem' }}>{c.name}</td>
                                                <td style={{ color: '#10b981', fontWeight: 600 }}>{sent.toLocaleString()}</td>
                                                <td style={{ color: failed > 0 ? '#ef4444' : '#94a3b8', fontWeight: 600 }}>{failed.toLocaleString()}</td>
                                                <td style={{ fontWeight: 500, paddingRight: '1.5rem' }}>{total.toLocaleString()}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Bounce / failure reasons */}
                <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02)' }}>
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ background: '#fff1f2', padding: '0.4rem', borderRadius: '8px' }}><ArrowDownRight size={16} color="#e11d48" /></div>
                        <p style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Failure Reasons</p>
                    </div>
                    {bounceData.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 2rem', color: '#94a3b8', fontSize: '0.875rem', background: '#f8fafc', margin: '1rem', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎉</div>
                            No failures recorded in this period.
                        </div>
                    ) : (
                        <div style={{ padding: '1.5rem 1.5rem 1rem 0' }}>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={bounceData} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="reason" tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }} axisLine={false} tickLine={false} width={130} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                    <Bar dataKey="count" name="Count" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Analytics;
