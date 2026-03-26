import React, { useState, useEffect, useCallback } from 'react';
import {
    Mail, Search, User2, X, CheckCircle2, XCircle, ChevronRight,
    Copy, AlertTriangle
} from 'lucide-react';
import adminService from '../../services/admin';
import toast from 'react-hot-toast';
import '../../styles/DashboardNew.css';

const statusColors = {
    sent: 'd-badge-success',
    draft: 'd-badge-neutral',
    scheduled: 'd-badge-info',
    failed: 'd-badge-danger',
};

// Hook to detect mobile
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);
    return isMobile;
};

const SystemCampaigns = () => {
    const isMobile = useIsMobile();
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [emailFilter, setEmailFilter] = useState('all');
    const [emailSearch, setEmailSearch] = useState('');

    useEffect(() => { fetchCampaigns(); }, []);

    // Prevent body scroll when modal open on mobile
    useEffect(() => {
        if (isMobile && selectedCampaign) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMobile, selectedCampaign]);

    const fetchCampaigns = async () => {
        try {
            const data = await adminService.getAllSystemCampaigns();
            setCampaigns(Array.isArray(data) ? data : []);
        } catch {
            toast.error('Failed to load campaigns.');
        } finally {
            setLoading(false);
        }
    };

    const openDetail = async (campaign) => {
        setSelectedCampaign(campaign);
        setDetail(null);
        setDetailLoading(true);
        setEmailFilter('all');
        setEmailSearch('');
        try {
            const data = await adminService.getCampaignDetail(campaign._id);
            setDetail(data);
        } catch {
            toast.error('Failed to load campaign details.');
        } finally {
            setDetailLoading(false);
        }
    };

    const closeDetail = () => {
        setSelectedCampaign(null);
        setDetail(null);
    };

    const copyFailedEmails = () => {
        if (!detail?.recipients) return;
        const failed = detail.recipients.filter(r => r.status === 'failed').map(r => r.email).join('\n');
        if (!failed) return toast('No failed emails to copy');
        navigator.clipboard.writeText(failed);
        toast.success('Copied failed emails to clipboard!');
    };

    const filtered = campaigns.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.user?.email?.toLowerCase().includes(search.toLowerCase())
    );

    const sentCount = detail?.sentCount || 0;
    const failedCount = detail?.failedCount || 0;
    const total = detail?.recipientCount || 0;
    const deliveryRate = total > 0 ? Math.round((sentCount / total) * 100) : 0;

    const allCount = detail?.recipients?.length || 0;
    const sentCountR = (detail?.recipients || []).filter(r => r.status === 'sent').length;
    const failedCountR = (detail?.recipients || []).filter(r => r.status === 'failed').length;

    const visibleRecipients = (detail?.recipients || []).filter(r => {
        const matchFilter = emailFilter === 'all' || r.status === emailFilter;
        const matchSearch = !emailSearch || r.email?.toLowerCase().includes(emailSearch.toLowerCase()) ||
            `${r.firstName} ${r.lastName}`.toLowerCase().includes(emailSearch.toLowerCase());
        return matchFilter && matchSearch;
    });

    // ─── Shared Detail Panel Content ───
    const DetailPanelContent = (
        <>
            {/* Panel Header */}
            <div style={{ padding: '1.25rem 1.5rem', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', position: 'relative', flexShrink: 0 }}>
                <button onClick={closeDetail} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', color: '#fff', padding: '0.35rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={17} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', paddingRight: '2rem' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #fb923c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                        {(selectedCampaign?.user?.name || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                        <h2 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#fff' }}>{selectedCampaign?.name}</h2>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                            {selectedCampaign?.user?.name} · {new Date(selectedCampaign?.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>
                {!detailLoading && detail && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem' }}>
                        {[
                            { label: 'Total', value: total, color: '#94a3b8' },
                            { label: 'Delivered', value: sentCount, color: '#34d399' },
                            { label: 'Failed', value: failedCount, color: '#f87171' },
                            { label: 'Rate', value: `${deliveryRate}%`, color: deliveryRate === 100 ? '#34d399' : deliveryRate > 50 ? '#60a5fa' : '#f87171' },
                        ].map(s => (
                            <div key={s.label} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '10px', padding: '0.6rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                                <div style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '0.2rem' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {detailLoading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
                    Loading email details…
                </div>
            ) : detail && (
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {/* Progress Bar */}
                    <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ height: 8, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden', display: 'flex' }}>
                            <div style={{ width: `${total ? (sentCount / total) * 100 : 0}%`, background: 'linear-gradient(90deg, #10b981, #34d399)', transition: 'width 0.8s ease' }} />
                            <div style={{ width: `${total ? (failedCount / total) * 100 : 0}%`, background: 'linear-gradient(90deg, #ef4444, #f87171)', transition: 'width 0.8s ease' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.7rem', color: '#94a3b8' }}>
                            <span>{sentCount + failedCount} of {total} processed</span>
                            {failedCount > 0 && (
                                <button onClick={copyFailedEmails} style={{ background: 'none', border: 'none', color: '#f97316', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0, fontWeight: 600 }}>
                                    <Copy size={11} /> Copy failed emails
                                </button>
                            )}
                        </div>
                        {/* ── Failure Reason Banner ── */}
                        {failedCount > 0 && detail?.failureReason && (
                            <div style={{ marginTop: '0.65rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', background: '#fff1f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.6rem 0.75rem' }}>
                                <AlertTriangle size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                                <div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ef4444', marginBottom: '0.15rem' }}>Delivery Failure Reason</div>
                                    <div style={{ fontSize: '0.7rem', color: '#991b1b', lineHeight: 1.5, wordBreak: 'break-word' }}>{detail.failureReason}</div>
                                </div>
                            </div>
                        )}
                        {/* ── No failure reason but still failed ── */}
                        {failedCount > 0 && !detail?.failureReason && (
                            <div style={{ marginTop: '0.65rem', display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#fff1f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.5rem 0.75rem' }}>
                                <AlertTriangle size={13} color="#ef4444" style={{ flexShrink: 0 }} />
                                <span style={{ fontSize: '0.7rem', color: '#991b1b' }}>
                                    {failedCount} email(s) failed. No error detail was captured — this usually means the email queue (Redis/BullMQ) was offline when the campaign ran.
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Meta */}
                    <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}><span style={{ color: '#94a3b8', minWidth: 55 }}>Subject</span><span style={{ color: '#0f172a', fontWeight: 500, wordBreak: 'break-word' }}>{detail.subject}</span></div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}><span style={{ color: '#94a3b8', minWidth: 55 }}>Sender</span><span style={{ color: '#0f172a', fontWeight: 500, wordBreak: 'break-word' }}>{detail.sender}</span></div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><span style={{ color: '#94a3b8', minWidth: 55 }}>Source</span><span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '0.15rem 0.4rem', borderRadius: '4px', background: detail.source === 'api' ? '#e0e7ff' : '#f1f5f9', color: detail.source === 'api' ? '#4f46e5' : '#64748b' }}>{detail.source === 'api' ? 'API' : 'Dashboard'}</span></div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><span style={{ color: '#94a3b8', minWidth: 55 }}>Status</span><span className={`d-badge ${statusColors[detail.status?.toLowerCase()] || 'd-badge-neutral'}`} style={{ fontSize: '0.68rem' }}>{detail.status}</span></div>
                    </div>

                    {/* Filter + Search */}
                    <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                            {[
                                { key: 'all', label: `All (${allCount})` },
                                { key: 'sent', label: `✓ Delivered (${sentCountR})` },
                                { key: 'failed', label: `✗ Failed (${failedCountR})` },
                            ].map(f => (
                                <button key={f.key} onClick={() => setEmailFilter(f.key)} style={{ fontSize: '0.7rem', padding: '0.3rem 0.65rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600, background: emailFilter === f.key ? '#0f172a' : '#f1f5f9', color: emailFilter === f.key ? '#fff' : '#64748b', transition: 'all 0.15s' }}>
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        <div style={{ position: 'relative' }}>
                            <Search size={13} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input style={{ width: '100%', padding: '0.35rem 0.6rem 0.35rem 1.8rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.78rem', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }} placeholder="Search email or name…" value={emailSearch} onChange={e => setEmailSearch(e.target.value)} />
                        </div>
                    </div>

                    {/* Email List */}
                    <div style={{ padding: '0.75rem 1.5rem' }}>
                        {visibleRecipients.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.82rem' }}>No emails match your filter.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {visibleRecipients.map((r, i) => (
                                    <div key={i} style={{ padding: '0.65rem 0.8rem', background: r.status === 'failed' ? '#fff5f5' : r.status === 'queued' ? '#fef3c7' : '#f0fdf9', borderRadius: '10px', border: `1px solid ${r.status === 'failed' ? '#fecaca' : r.status === 'queued' ? '#fde68a' : '#bbf7d0'}` }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                                            <div style={{ paddingTop: '0.05rem', flexShrink: 0 }}>
                                                {r.status === 'sent' ? <CheckCircle2 size={15} color="#10b981" /> : r.status === 'queued' ? <RefreshCw size={14} color="#f59e0b" style={{ marginTop: '0.1rem' }} /> : <XCircle size={15} color="#ef4444" />}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                {(r.firstName || r.lastName) && (
                                                    <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#0f172a' }}>{`${r.firstName} ${r.lastName}`.trim()}</div>
                                                )}
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.email}</div>
                                                {r.status === 'failed' && r.error && (
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.3rem', marginTop: '0.3rem', padding: '0.35rem 0.5rem', background: 'rgba(239,68,68,0.08)', borderRadius: '6px' }}>
                                                        <AlertTriangle size={11} color="#ef4444" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                                                        <span style={{ fontSize: '0.68rem', color: '#ef4444', lineHeight: 1.4 }}>{r.error}</span>
                                                    </div>
                                                )}
                                                {r.status === 'sent' && (r.provider || r.messageId) && (
                                                    <div style={{ marginTop: '0.3rem', padding: '0.35rem 0.5rem', background: 'rgba(16,185,129,0.08)', borderRadius: '6px', overflowX: 'auto' }}>
                                                        <div style={{ fontSize: '0.65rem', color: '#059669', lineHeight: 1.4, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                                                            Email to {r.email} sent successfully
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.65rem', flexShrink: 0, textAlign: 'right', lineHeight: 1.4 }}>
                                                <span style={{ color: r.status === 'sent' ? '#10b981' : r.status === 'queued' ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>{r.status === 'sent' ? 'Delivered' : r.status === 'queued' ? 'Queued' : 'Failed'}</span>
                                                {r.timestamp && <div style={{ color: '#94a3b8', marginTop: '0.1rem' }}>{new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );

    return (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', position: 'relative' }}>

            {/* ─── Main Table ─── */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div className="d-page-header">
                    <div>
                        <h1>System Campaigns</h1>
                        <p>All campaigns across all accounts. {isMobile ? 'Tap' : 'Click'} a row to inspect delivery.</p>
                    </div>
                </div>

                {/* Search */}
                <div className="d-card" style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input className="d-input" style={{ paddingLeft: '2.25rem' }} placeholder="Search by campaign name or user email…" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>

                {loading ? (
                    <div className="d-empty"><p>Loading campaigns…</p></div>
                ) : filtered.length === 0 ? (
                    <div className="d-card">
                        <div className="d-empty" style={{ padding: '3rem' }}>
                            <div className="d-empty-icon"><Mail size={22} /></div>
                            <h3>No campaigns found</h3>
                            <p>Users haven't created any campaigns yet.</p>
                        </div>
                    </div>
                ) : isMobile ? (
                    /* ─ Mobile: Card List ─ */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {filtered.map(c => {
                            const t = c.recipientCount || c.recipients?.length || 0;
                            const s = c.sentCount || 0;
                            const f = c.failedCount || 0;
                            const rate = t > 0 ? Math.round((s / t) * 100) : null;
                            return (
                                <div key={c._id} onClick={() => openDetail(c)} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #fb923c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>
                                        {(c.user?.name || 'U')[0].toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.user?.email}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                                            <span className={`d-badge ${statusColors[c.status?.toLowerCase()] || 'd-badge-neutral'}`} style={{ fontSize: '0.65rem' }}>{c.status}</span>
                                            <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '4px', background: c.source === 'api' ? '#e0e7ff' : '#f1f5f9', color: c.source === 'api' ? '#4f46e5' : '#64748b', fontWeight: 600 }}>{c.source === 'api' ? 'API' : 'UI'}</span>
                                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{t} recipients</span>
                                            {rate !== null && <span style={{ fontSize: '0.72rem', color: rate === 100 ? '#10b981' : rate > 50 ? '#3b82f6' : '#ef4444', fontWeight: 600 }}>{rate}% delivered</span>}
                                            {f > 0 && <span style={{ fontSize: '0.72rem', color: '#ef4444' }}>{f} failed</span>}
                                        </div>
                                    </div>
                                    <ChevronRight size={18} style={{ color: '#94a3b8', flexShrink: 0 }} />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* ─ Desktop: Table ─ */
                    <div className="d-table-wrap">
                        <table className="d-table">
                            <thead>
                                <tr>
                                    <th>Campaign</th>
                                    <th>Owner</th>
                                    <th>Source</th>
                                    <th>Status</th>
                                    <th>Recipients</th>
                                    <th>Delivery Rate</th>
                                    <th>Created</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(c => {
                                    const t = c.recipientCount || c.recipients?.length || 0;
                                    const s = c.sentCount || 0;
                                    const f = c.failedCount || 0;
                                    const rate = t > 0 ? Math.round((s / t) * 100) : null;
                                    return (
                                        <tr key={c._id} onClick={() => openDetail(c)} style={{ cursor: 'pointer' }} className={`d-tr-hover${selectedCampaign?._id === c._id ? ' active' : ''}`}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{c.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.subject}</div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #fb923c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                                                        {(c.user?.name || 'U')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{c.user?.name || 'Unknown'}</div>
                                                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{c.user?.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '6px', background: c.source === 'api' ? '#e0e7ff' : '#f1f5f9', color: c.source === 'api' ? '#4f46e5' : '#64748b' }}>
                                                    {c.source === 'api' ? 'API' : 'Dashboard'}
                                                </span>
                                            </td>
                                            <td><span className={`d-badge ${statusColors[c.status?.toLowerCase()] || 'd-badge-neutral'}`}>{c.status}</span></td>
                                            <td style={{ fontWeight: 600 }}>{t}</td>
                                            <td>
                                                {rate !== null ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <div style={{ width: 60, height: 6, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden', display: 'flex' }}>
                                                            <div style={{ width: `${rate}%`, background: rate === 100 ? '#10b981' : rate > 50 ? '#3b82f6' : '#ef4444', borderRadius: 999 }} />
                                                        </div>
                                                        <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{rate}%</span>
                                                        {f > 0 && <span style={{ fontSize: '0.72rem', color: '#ef4444' }}>{f}✗</span>}
                                                    </div>
                                                ) : '—'}
                                            </td>
                                            <td style={{ color: '#64748b', fontSize: '0.82rem' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                                            <td><ChevronRight size={16} style={{ color: selectedCampaign?._id === c._id ? '#f97316' : '#94a3b8', transition: 'color 0.2s' }} /></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ─── Desktop: Side Panel ─── */}
            {!isMobile && selectedCampaign && (
                <div style={{ width: 440, flexShrink: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 120px)', position: 'sticky', top: '1rem', overflow: 'hidden' }}>
                    {DetailPanelContent}
                </div>
            )}

            {/* ─── Mobile: Full-Screen Modal ─── */}
            {isMobile && selectedCampaign && (
                <>
                    {/* Backdrop */}
                    <div onClick={closeDetail} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, backdropFilter: 'blur(2px)' }} />
                    {/* Bottom Sheet */}
                    <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, top: '10vh', zIndex: 1000, background: '#fff', borderRadius: '20px 20px 0 0', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}>
                        {/* Drag Handle */}
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '0.6rem 0 0' }}>
                            <div style={{ width: 40, height: 4, background: '#e2e8f0', borderRadius: 999 }} />
                        </div>
                        {DetailPanelContent}
                    </div>
                </>
            )}
        </div>
    );
};

export default SystemCampaigns;
