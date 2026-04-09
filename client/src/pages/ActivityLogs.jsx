import React, { useState, useEffect } from 'react';
import { Activity, Search, RefreshCw, Send, Terminal, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import '../styles/DashboardNew.css';

const BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/api\/v1|\/api/g, '') || window.location.origin;

const ActivityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchLogs();
    }, [page]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${BASE_URL}/api/logs?page=${page}&limit=10`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setLogs(res.data.data);
                setTotalPages(res.data.pagination.totalPages);
            }
        } catch (error) {
            toast.error('Failed to load activity logs');
        } finally {
            setLoading(false);
        }
    };

    const statusColors = {
        delivered: { bg: '#dcfce7', text: '#166534', icon: <Send size={13} /> },
        queued: { bg: '#fef08a', text: '#854d0e', icon: <RefreshCw size={13} /> },
        failed: { bg: '#fee2e2', text: '#991b1b', icon: <AlertCircle size={13} /> },
    };

    const filteredLogs = filter === 'all' 
        ? logs 
        : logs.filter(l => l.source === filter);

    return (
        <div className="d-fade-in">
            <div className="d-page-header">
                <div>
                    <h1>Activity Logs</h1>
                    <p>Global monitor for all email sending operations</p>
                </div>
                <button className="d-btn d-btn-secondary" onClick={fetchLogs} disabled={loading}>
                    <RefreshCw size={14} className={loading ? 'spinning' : ''} /> Refresh
                </button>
            </div>

            <div className="d-card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="d-input-icon-wrap" style={{ flex: 1, minWidth: 'min(100%, 200px)' }}>
                        <Search className="d-input-icon" size={18} />
                        <input type="text" placeholder="Search by email..." className="d-input" disabled style={{ width: '100%' }} />
                    </div>
                    
                    <div className="d-filter-tabs" style={{ maxWidth: '100%', overflowX: 'auto' }}>
                        <button 
                            className={`d-filter-tab ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All Sources
                        </button>
                        <button 
                            className={`d-filter-tab ${filter === 'api' ? 'active' : ''}`}
                            onClick={() => setFilter('api')}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                            <Terminal size={14} /> API
                        </button>
                        <button 
                            className={`d-filter-tab ${filter === 'app' ? 'active' : ''}`}
                            onClick={() => setFilter('app')}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                            <Activity size={14} /> App
                        </button>
                    </div>
                </div>
            </div>

            {loading && logs.length === 0 ? (
                <div className="d-empty"><p>Loading logs...</p></div>
            ) : filteredLogs.length === 0 ? (
                <div className="d-card">
                    <div className="d-empty" style={{ padding: '4rem 2rem' }}>
                        <div className="d-empty-icon"><Activity size={24} /></div>
                        <h3>No Activity Found</h3>
                        <p>Emails sent via the App or API will appear here.</p>
                    </div>
                </div>
            ) : (
                <div className="d-table-wrap">
                    <table className="d-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Recipient</th>
                                <th>Subject</th>
                                <th>Source</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map(log => {
                                const st = statusColors[log.status] || { bg: '#f1f5f9', text: '#475569' };
                                return (
                                    <tr key={log._id}>
                                        <td style={{ color: '#64748b', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{log.to}</td>
                                        <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {log.subject}
                                        </td>
                                        <td>
                                            <span style={{ 
                                                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                                padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.72rem',
                                                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                                                background: log.source === 'api' ? '#e0e7ff' : '#fce7f3',
                                                color: log.source === 'api' ? '#4338ca' : '#be185d'
                                            }}>
                                                {log.source === 'api' ? <Terminal size={12} /> : <Activity size={12} />}
                                                {log.source}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                <span style={{ 
                                                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                                    padding: '0.2rem 0.5rem', borderRadius: 99, fontSize: '0.75rem',
                                                    fontWeight: 600, background: st.bg, color: st.text,
                                                    width: 'fit-content'
                                                }}>
                                                    {st.icon} {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                                                </span>
                                                {log.error && (
                                                    <span style={{ fontSize: '0.7rem', color: '#ef4444', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.error}>
                                                        {log.error}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

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
                        Page {page} of {Math.max(1, totalPages)}
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
        </div>
    );
};

export default ActivityLogs;
