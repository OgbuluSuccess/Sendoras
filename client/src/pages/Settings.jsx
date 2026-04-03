import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Bell, Trash2, Save, Globe, CheckCircle2, Clock, XCircle, Copy, RefreshCw, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import authService from '../services/auth';
import domainService from '../services/domains';
import ConfirmModal from '../components/ConfirmModal';

const TABS = [
    { id: 'profile', label: 'Profile', icon: <User size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
    { id: 'danger', label: 'Danger Zone', icon: <Trash2 size={16} /> },
];

const StatusBadge = ({ status }) => {
    const map = {
        verified: { color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', icon: <CheckCircle2 size={13} />, label: 'Verified' },
        pending: { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', icon: <Clock size={13} />, label: 'Pending DNS' },
        failed: { color: '#ef4444', bg: '#fff5f5', border: '#fecaca', icon: <XCircle size={13} />, label: 'Failed' },
    };
    const s = map[status] || map.pending;
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 600, color: s.color, background: s.bg, border: `1px solid ${s.border}`, borderRadius: '999px', padding: '0.2rem 0.6rem' }}>
            {s.icon} {s.label}
        </span>
    );
};

const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
};

const RecordRow = ({ type, name, value, ttl = 'Auto' }) => (
    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
        <td style={{ padding: '0.65rem 0.75rem', width: '80px' }}>
            <span style={{ background: type === 'TXT' ? '#fef3c7' : '#e0e7ff', color: type === 'TXT' ? '#92400e' : '#3730a3', padding: '0.2rem 0.4rem', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700, fontFamily: 'monospace' }}>{type}</span>
        </td>
        <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#334155' }}>{name}</td>
        <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#0f172a', wordBreak: 'break-all' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <span>{value}</span>
                <button onClick={() => copyToClipboard(value, `${type} record`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.2rem', display: 'flex' }} title="Copy value">
                    <Copy size={13} />
                </button>
            </div>
        </td>
        <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.72rem', color: '#64748b' }}>{ttl}</td>
    </tr>
);


const Settings = () => {
    const user = authService.getCurrentUser();
    const [tab, setTab] = useState('profile');
    const [name, setName] = useState(user?.name || '');
    const [email] = useState(user?.email || '');
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [notifs, setNotifs] = useState({ campaigns: true, billing: true, product: false });

    const handleSaveProfile = (e) => {
        e.preventDefault();
        toast.success('Profile updated successfully!');
    };

    const handleChangePassword = (e) => {
        e.preventDefault();
        if (newPw.length < 8) { toast.error('Password must be at least 8 characters'); return; }
        toast.success('Password changed successfully!');
        setCurrentPw(''); setNewPw('');
    };

    return (
        <>
            <div className="d-page-header">
                <div>
                    <h1>Settings</h1>
                    <p>Manage your account and preferences</p>
                </div>
            </div>

            <div className="d-grid-1-3" style={{ alignItems: 'start' }}>
                {/* Tab nav */}
                <div className="d-card" style={{ padding: '0.5rem' }}>
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            className={`d-nav-item${tab === t.id ? ' active' : ''}`}
                            onClick={() => setTab(t.id)}
                            style={{ width: '100%', justifyContent: 'flex-start' }}
                        >
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div>
                    {tab === 'profile' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="d-card">
                                <p className="d-card-title" style={{ marginBottom: '1.25rem' }}>Personal Information</p>
                                <form onSubmit={handleSaveProfile} className="d-form">
                                    <div className="d-field">
                                        <label className="d-label">Full Name</label>
                                        <div className="d-input-icon-wrap">
                                            <User size={16} className="d-input-icon" />
                                            <input className="d-input" value={name} onChange={e => setName(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="d-field">
                                        <label className="d-label">Email Address</label>
                                        <div className="d-input-icon-wrap">
                                            <Mail size={16} className="d-input-icon" />
                                            <input className="d-input" value={email} readOnly style={{ background: '#f8fafc', cursor: 'not-allowed' }} />
                                        </div>
                                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.25rem 0 0' }}>Email cannot be changed. Contact support if needed.</p>
                                    </div>
                                    <button type="submit" className="d-btn d-btn-primary" style={{ width: 'fit-content' }}>
                                        <Save size={16} /> Save Changes
                                    </button>
                                </form>
                            </div>

                            <div className="d-card">
                                <p className="d-card-title" style={{ marginBottom: '1.25rem' }}>Change Password</p>
                                <form onSubmit={handleChangePassword} className="d-form">
                                    <div className="d-field">
                                        <label className="d-label">Current Password</label>
                                        <div className="d-input-icon-wrap">
                                            <Lock size={16} className="d-input-icon" />
                                            <input className="d-input" type="password" placeholder="••••••••" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required />
                                        </div>
                                    </div>
                                    <div className="d-field">
                                        <label className="d-label">New Password</label>
                                        <div className="d-input-icon-wrap">
                                            <Lock size={16} className="d-input-icon" />
                                            <input className="d-input" type="password" placeholder="Min. 8 characters" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={8} />
                                        </div>
                                    </div>
                                    <button type="submit" className="d-btn d-btn-primary" style={{ width: 'fit-content' }}>
                                        <Lock size={16} /> Update Password
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}



                    {tab === 'notifications' && (
                        <div className="d-card">
                            <p className="d-card-title" style={{ marginBottom: '1.25rem' }}>Email Notifications</p>
                            {[
                                { key: 'campaigns', label: 'Campaign Reports', desc: 'Receive a summary email after each campaign is sent.' },
                                { key: 'billing', label: 'Billing Alerts', desc: 'Get notified about invoices and plan changes.' },
                                { key: 'product', label: 'Product Updates', desc: 'Stay updated with new features and changelogs.' },
                            ].map(n => (
                                <div key={n.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{n.label}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{n.desc}</div>
                                    </div>
                                    <label style={{ position: 'relative', display: 'inline-block', width: 42, height: 24, cursor: 'pointer' }}>
                                        <input type="checkbox" checked={notifs[n.key]} onChange={e => setNotifs(prev => ({ ...prev, [n.key]: e.target.checked }))} style={{ opacity: 0, width: 0, height: 0 }} />
                                        <span style={{ position: 'absolute', inset: 0, background: notifs[n.key] ? '#f97316' : '#e2e8f0', borderRadius: 999, transition: 'background 0.2s' }}>
                                            <span style={{ position: 'absolute', top: 3, left: notifs[n.key] ? 21 : 3, width: 18, height: 18, background: '#fff', borderRadius: 50, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                                        </span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === 'danger' && (
                        <div className="d-card" style={{ border: '1.5px solid #fca5a5' }}>
                            <p className="d-card-title" style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Danger Zone</p>
                            <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1.5rem' }}>These actions are irreversible. Proceed with caution.</p>
                            <div style={{ padding: '1rem', background: '#fff1f2', border: '1px solid #fca5a5', borderRadius: 12 }}>
                                <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>Delete Account</div>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>Permanently delete your account and all data. This cannot be undone.</p>
                                <button className="d-btn d-btn-danger" onClick={() => toast.error('Account deletion requires confirmation. Please contact support.')}>
                                    <Trash2 size={16} /> Delete My Account
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Settings;
