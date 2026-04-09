import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Mail, MoreHorizontal, Edit2, Trash2, Copy, SendHorizonal, AlertTriangle, RefreshCw, Terminal, X, CheckCircle2, XCircle } from 'lucide-react';
import campaignService from '../services/campaigns';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

import { createPortal } from 'react-dom';

const STATUS_BADGE = {
    sent: { cls: 'd-badge-success', label: 'Sent' },
    draft: { cls: 'd-badge-neutral', label: 'Draft' },
    sending: { cls: 'd-badge-info', label: 'Sending' },
    failed: { cls: 'd-badge-danger', label: 'Failed' },
    queued: { cls: 'd-badge-warning', label: 'Queued' },
};

const FILTERS = ['All', 'Draft', 'Sent', 'Sending', 'Failed'];

/* Small row-actions dropdown */
const RowMenu = ({ campaign, onDelete, onSend, onResend, onDuplicate, onEdit, onViewLog }) => {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const ref = useRef(null);
    const menuRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (open && ref.current && !ref.current.contains(e.target) && menuRef.current && !menuRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        const scrollHandler = () => setOpen(false);

        if (open) {
            document.addEventListener('mousedown', handler);
            window.addEventListener('scroll', scrollHandler, true);
        }
        return () => {
            document.removeEventListener('mousedown', handler);
            window.removeEventListener('scroll', scrollHandler, true);
        };
    }, [open]);

    const toggleMenu = (e) => {
        e.stopPropagation();
        if (!open) {
            const rect = ref.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY + 4,
                left: rect.right + window.scrollX - 170
            });
        }
        setOpen(!open);
    };

    const status = campaign.status?.toLowerCase();
    const isSentOrFailed = status === 'sent' || status === 'failed';

    const menuItem = (icon, label, onClick, color) => (
        <button
            onClick={() => { setOpen(false); onClick(); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', padding: '0.65rem 1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: color || '#334155', fontWeight: color ? 600 : 400 }}
        >
            {icon} {label}
        </button>
    );

    return (
        <div ref={ref} style={{ display: 'inline-block' }}>
            <button
                className="d-btn d-btn-ghost d-btn-sm"
                style={{ padding: '0.35rem', borderRadius: '8px' }}
                onClick={toggleMenu}
                aria-label="Actions"
            >
                <MoreHorizontal size={16} />
            </button>
            {open && createPortal(
                <div ref={menuRef} style={{
                    position: 'absolute', left: coords.left, top: coords.top,
                    background: '#fff', border: '1px solid #e2e8f0',
                    borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,.15)',
                    zIndex: 9999, minWidth: 170, overflow: 'hidden',
                }}>
                    {/* Edit — always available */}
                    {menuItem(<Edit2 size={14} />, 'Edit', () => onEdit(campaign._id))}

                    {/* Duplicate — always available */}
                    {menuItem(<Copy size={14} />, 'Duplicate', () => onDuplicate(campaign._id, campaign.name))}

                    <div style={{ height: 1, background: '#f1f5f9', margin: '0.15rem 0' }} />

                    {/* Send Now — only drafts */}
                    {status === 'draft' &&
                        menuItem(<SendHorizonal size={14} />, 'Send Now', () => onSend(campaign._id, campaign.name), '#f97316')
                    }

                    {/* Resend — sent or failed campaigns */}
                    {isSentOrFailed &&
                        menuItem(<RefreshCw size={14} />, 'Resend Campaign', () => onResend(campaign._id, campaign.name), '#3b82f6')
                    }

                    {/* View Logs — if sending, sent, or failed */}
                    {(status === 'sending' || isSentOrFailed) &&
                        menuItem(<Terminal size={14} />, 'View Logs', () => onViewLog(campaign._id), '#10b981')
                    }

                    <div style={{ height: 1, background: '#f1f5f9', margin: '0.15rem 0' }} />

                    {/* Delete */}
                    {menuItem(<Trash2 size={14} />, 'Delete', () => onDelete(campaign._id, campaign.name), '#ef4444')}
                </div>,
                document.body
            )}
        </div>
    );
};

const Campaigns = () => {
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const limit = 10;
    const [confirm, setConfirm] = useState({ open: false, type: null, id: null, name: '' });
    const [actionLoading, setActionLoading] = useState(false);
    const [logModal, setLogModal] = useState({ open: false, id: null, data: null, loading: false });

    const fetchCampaigns = () => {
        campaignService.getCampaigns()
            .then(data => setCampaigns(Array.isArray(data) ? data : []))
            .catch(() => setCampaigns([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    // Polling logic: if any campaign is 'sending', refresh every 3 seconds
    useEffect(() => {
        const isSending = campaigns.some(c => c.status === 'sending');
        if (!isSending) return;

        const interval = setInterval(() => {
            campaignService.getCampaigns()
                .then(data => setCampaigns(Array.isArray(data) ? data : []))
                .catch(() => { });
        }, 3000);

        return () => clearInterval(interval);
    }, [campaigns]);

    const handleSend = (id, name) => setConfirm({ open: true, type: 'send', id, name });
    const handleDelete = (id, name) => setConfirm({ open: true, type: 'delete', id, name });
    const handleResend = (id, name) => setConfirm({ open: true, type: 'resend', id, name });
    const handleEdit = (id) => navigate(`/campaigns/${id}/edit`);

    const handleViewLog = async (id) => {
        setLogModal({ open: true, id, data: null, loading: true });
        try {
            const data = await campaignService.getCampaign(id);
            setLogModal({ open: true, id, data, loading: false });
        } catch {
            toast.error('Failed to load logs');
            setLogModal({ open: false, id: null, data: null, loading: false });
        }
    };

    const handleDuplicate = async (id, name) => {
        const tid = toast.loading(`Duplicating "${name}"…`);
        try {
            const copy = await campaignService.duplicateCampaign(id);
            setCampaigns(prev => [copy, ...prev]);
            toast.success(`"${copy.name}" created as a draft!`, { id: tid });
        } catch {
            toast.error('Failed to duplicate campaign.', { id: tid });
        }
    };

    const executeConfirm = async () => {
        setActionLoading(true);
        const { type, id, name } = confirm;
        try {
            if (type === 'send') {
                await campaignService.sendCampaign(id);
                setCampaigns(prev => prev.map(c => c._id === id ? { ...c, status: 'sending' } : c));
                toast.success(`"${name}" campaign queued for sending!`);
            } else if (type === 'resend') {
                await campaignService.resendCampaign(id);
                setCampaigns(prev => prev.map(c => c._id === id ? { ...c, status: 'sending', sentCount: 0, failedCount: 0 } : c));
                toast.success(`"${name}" campaign re-queued!`);
            } else if (type === 'delete') {
                await campaignService.deleteCampaign(id);
                setCampaigns(prev => prev.filter(c => c._id !== id));
                toast.success(`"${name}" campaign deleted.`);
            }
        } catch (err) {
            toast.error(err?.response?.data?.msg || `Failed to ${type} campaign.`);
        } finally {
            setActionLoading(false);
            setConfirm({ open: false, type: null, id: null, name: '' });
        }
    };


    const visible = campaigns.filter(c => {
        const matchFilter = filter === 'All' || c.status?.toLowerCase() === filter.toLowerCase();
        const matchSearch = c.name?.toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
    });

    const totalPages = Math.ceil(visible.length / limit) || 1;
    const paginatedCampaigns = visible.slice((page - 1) * limit, page * limit);

    return (
        <>
            <ConfirmModal
                open={confirm.open}
                title={
                    confirm.type === 'send' ? 'Send Campaign' :
                        confirm.type === 'resend' ? 'Resend Campaign' :
                            'Delete Campaign'
                }
                message={
                    confirm.type === 'send'
                        ? `Are you sure you want to send "${confirm.name}" now? This will queue emails for all recipients immediately.`
                        : confirm.type === 'resend'
                            ? `This will re-queue "${confirm.name}" and send to ALL recipients again (including those who already received it). Continue?`
                            : `Are you sure you want to permanently delete "${confirm.name}"? This cannot be undone.`
                }
                confirmLabel={
                    confirm.type === 'send' ? 'Yes, Send Now' :
                        confirm.type === 'resend' ? 'Yes, Resend' :
                            'Delete'
                }
                danger={confirm.type === 'delete'}
                loading={actionLoading}
                onConfirm={executeConfirm}
                onCancel={() => setConfirm({ open: false, type: null, id: null, name: '' })}
            />

            {/* Delivery Log Modal */}
            {logModal.open && createPortal(
                <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setLogModal({ open: false, id: null, data: null, loading: false })}>
                    <div style={{ background: '#fff', borderRadius: '16px', width: '90%', maxWidth: 750, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: 36, height: 36, borderRadius: '10px', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Terminal size={18} />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>Delivery Logs</h2>
                                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.1rem 0 0' }}>{logModal.data?.name || 'Loading…'}</p>
                                </div>
                            </div>
                            <button onClick={() => setLogModal({ open: false, id: null, data: null, loading: false })} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.4rem', borderRadius: '8px', display: 'flex' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#fff' }}>
                            {logModal.loading ? (
                                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b', fontSize: '0.9rem' }}>Fetching secure logs…</div>
                            ) : logModal.data ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {logModal.data.failureReason && (
                                        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '1rem', borderRadius: '10px', color: '#991b1b', fontSize: '0.85rem', display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.5rem' }}>
                                            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                                            <div>
                                                <strong style={{ display: 'block', marginBottom: '0.15rem' }}>Critical Error Hit:</strong>
                                                {logModal.data.failureReason}
                                            </div>
                                        </div>
                                    )}

                                    {logModal.data.recipients?.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No logs generated yet.</div>}

                                    {logModal.data.recipients?.map((r, i) => (
                                        <div key={i} style={{ padding: '0.8rem 1rem', background: r.status === 'failed' ? '#fff5f5' : r.status === 'queued' ? '#fef3c7' : '#f8fafc', borderRadius: '12px', border: `1px solid ${r.status === 'failed' ? '#fecaca' : r.status === 'queued' ? '#fde68a' : '#e2e8f0'}`, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>
                                                    {r.status === 'sent' ? <CheckCircle2 size={16} color="#10b981" /> : r.status === 'queued' ? <RefreshCw size={15} color="#f59e0b" /> : <XCircle size={16} color="#ef4444" />}
                                                    {r.email}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: r.status === 'sent' ? '#059669' : r.status === 'queued' ? '#d97706' : '#dc2626', fontWeight: 600 }}>
                                                    {r.status?.toUpperCase()}
                                                </div>
                                            </div>

                                            {r.status === 'failed' && r.error && (
                                                <div style={{ fontSize: '0.75rem', color: '#b91c1c', background: '#fef2f2', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>{r.error}</div>
                                            )}

                                            {r.status === 'sent' && (r.provider || r.messageId) && (
                                                <div style={{ background: '#0f172a', color: '#10b981', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.7rem', fontFamily: 'monospace', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                                                    Email to {r.email} sent successfully
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>, document.body
            )}
            <div className="d-page-header">
                <div>
                    <h1>Campaigns</h1>
                    <p>Manage and track all your email campaigns</p>
                </div>
                <Link to="/campaigns/new" className="d-btn d-btn-primary">
                    <Plus size={16} /> New Campaign
                </Link>
            </div>

            {/* Filters + Search */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div className="d-filter-tabs">
                    {FILTERS.map(f => (
                        <button key={f} className={`d-filter-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
                    ))}
                </div>
                <div className="d-search-wrap">
                    <Search size={15} className="d-search-icon" />
                    <input
                        className="d-search-input"
                        placeholder="Search campaigns…"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="d-table-wrap">
                {loading ? (
                    <div className="d-empty"><p>Loading…</p></div>
                ) : visible.length === 0 ? (
                    <div className="d-empty">
                        <div className="d-empty-icon"><Mail size={24} /></div>
                        <h3>No campaigns found</h3>
                        <p>{search || filter !== 'All' ? 'Try adjusting your search or filter.' : 'Create your first campaign to get started.'}</p>
                        <Link to="/campaigns/new" className="d-btn d-btn-primary"><Plus size={16} /> New Campaign</Link>
                    </div>
                ) : (
                    <table className="d-table">
                        <thead>
                            <tr>
                                <th>Campaign Name</th>
                                <th>Status</th>
                                <th>Subject</th>
                                <th>Recipients</th>
                                <th>Created</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedCampaigns.map(c => {
                                const badge = STATUS_BADGE[c.status?.toLowerCase()] || STATUS_BADGE.draft;
                                return (
                                    <tr key={c._id}>
                                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                                        <td><span className={`d-badge ${badge.cls}`}>{badge.label}</span></td>
                                        <td style={{ color: '#64748b', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {c.subject || '—'}
                                        </td>
                                        <td>
                                            {(c.status === 'sending' || c.status === 'sent') && c.progress ? (
                                                <div style={{ paddingRight: '1rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem', color: '#64748b' }}>
                                                        <span>{c.progress.percentage}%</span>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                            {c.progress.sent.toLocaleString()} sent
                                                            {c.progress.failed > 0 && (
                                                                <span
                                                                    style={{ color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', cursor: 'help' }}
                                                                    title={c.progress.errorLogs?.length > 0 ? c.progress.errorLogs.slice(0, 3).map(e => `${e.email}: ${e.message}`).join(' | ') + (c.progress.errorLogs.length > 3 ? '...' : '') : 'Failed to send'}
                                                                >
                                                                    , {c.progress.failed.toLocaleString()} failed <AlertTriangle size={12} />
                                                                </span>
                                                            )}
                                                            {' '}/ {c.progress.total.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', height: 6, width: '100%', background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${c.progress.total ? (c.progress.sent / c.progress.total) * 100 : 0}%`, background: c.status === 'sent' && c.progress.failed === 0 ? '#10b981' : '#3b82f6', transition: 'width 0.5s ease-out' }} />
                                                        {c.progress.failed > 0 && (
                                                            <div style={{ height: '100%', width: `${(c.progress.failed / c.progress.total) * 100}%`, background: '#ef4444', transition: 'width 0.5s ease-out' }} />
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                c.listId ? `${(c.listId.contactCount || 0).toLocaleString()} (List)` : (c.recipients?.length?.toLocaleString() ?? 0)
                                            )}
                                        </td>
                                        <td style={{ color: '#64748b', fontSize: '0.82rem' }}>
                                            {new Date(c.createdAt).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <RowMenu
                                                campaign={c}
                                                onEdit={handleEdit}
                                                onDelete={(id) => handleDelete(id, c.name)}
                                                onSend={(id) => handleSend(id, c.name)}
                                                onResend={(id) => handleResend(id, c.name)}
                                                onDuplicate={(id) => handleDuplicate(id, c.name)}
                                                onViewLog={handleViewLog}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}

                {/* Pagination Controls */}
                {totalPages > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginTop: '1.5rem', alignItems: 'center' }}>
                        <button
                            className="d-btn d-btn-secondary d-btn-sm"
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            style={{ flex: 1, width: 'auto', padding: '0.6rem 0.5rem', justifyContent: 'center' }}
                        >
                            Previous
                        </button>
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '0 0.25rem' }}>
                            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                Page {page} of {totalPages}
                            </span>
                        </div>
                        <button
                            className="d-btn d-btn-secondary d-btn-sm"
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            style={{ flex: 1, width: 'auto', padding: '0.6rem 0.5rem', justifyContent: 'center' }}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default Campaigns;
