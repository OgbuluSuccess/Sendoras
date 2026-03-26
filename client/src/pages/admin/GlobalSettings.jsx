import React, { useState, useEffect } from 'react';
import { Settings, Server, Shield, Mail, CreditCard, AlertTriangle, Check } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import '../../styles/DashboardNew.css';

const GlobalSettings = () => {
    const [settings, setSettings] = useState({
        maintenanceMode: false,
        allowSignups: true,
        emailNotifications: true,
    });

    const [integrations, setIntegrations] = useState({
        awsSes: false, stripe: false, paystack: false, mongodb: true
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/stats').then(res => {
            if (res.data?.integrations) setIntegrations(res.data.integrations);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const handleToggle = (key) => {
        setSettings(prev => {
            const updated = { ...prev, [key]: !prev[key] };
            toast.success(`${key === 'maintenanceMode' ? 'Maintenance mode' : key === 'allowSignups' ? 'New signups' : 'Email notifications'} ${updated[key] ? 'enabled' : 'disabled'}.`);
            return updated;
        });
    };

    return (
        <>
            <div className="d-page-header">
                <div>
                    <h1>Global Settings</h1>
                    <p>Platform-wide configuration and toggles</p>
                </div>
            </div>

            {/* Platform Toggles */}
            <div className="d-card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Settings size={18} /> Platform Controls
                </h3>

                {[
                    { key: 'maintenanceMode', title: 'Maintenance Mode', desc: 'When enabled, all users (except admins) will see a maintenance message.', icon: <Server size={18} />, danger: true },
                    { key: 'allowSignups', title: 'Allow New Signups', desc: 'Disable this to prevent new users from registering on the platform.', icon: <Shield size={18} />, danger: true },
                    { key: 'emailNotifications', title: 'System Email Notifications', desc: 'Send automated emails on key events (welcome, password reset, etc).', icon: <Mail size={18} />, danger: false },
                ].map(item => (
                    <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                            <div style={{ color: item.danger ? '#ef4444' : '#f97316', marginTop: 2 }}>{item.icon}</div>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.title}</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>{item.desc}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => handleToggle(item.key)}
                            style={{
                                width: 48, height: 26, borderRadius: 999,
                                background: settings[item.key] ? '#f97316' : '#e2e8f0',
                                border: 'none', cursor: 'pointer', position: 'relative',
                                transition: 'background 0.2s', flexShrink: 0
                            }}
                        >
                            <span style={{
                                position: 'absolute', top: 3, left: settings[item.key] ? 24 : 3,
                                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                                transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                            }} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Integration Status */}
            <div className="d-card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CreditCard size={18} /> Integration Status
                </h3>
                {loading ? <p className="d-empty" style={{ margin: 0 }}>Loading status…</p> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[
                            { label: 'AWS SES (Email Delivery)', ok: integrations.awsSes, errReason: 'Missing AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY in .env' },
                            { label: 'Stripe (USD Payments)', ok: integrations.stripe, errReason: 'Needs API key in .env → STRIPE_SECRET_KEY' },
                            { label: 'Paystack (NGN Payments)', ok: integrations.paystack, errReason: 'Needs API key in .env → PAYSTACK_SECRET_KEY' },
                            { label: 'MongoDB Atlas', ok: integrations.mongodb, errReason: 'Not connected' },
                        ].map(item => (
                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: 10, background: item.ok ? 'rgba(16,185,129,0.05)' : 'rgba(245,158,11,0.05)', border: `1px solid ${item.ok ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
                                <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{item.label}</span>
                                <span style={{ fontSize: '0.78rem', color: item.ok ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    {item.ok ? <><Check size={13} /> Configured</> : <><AlertTriangle size={13} /> {item.errReason}</>}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Danger Zone */}
            <div className="d-card" style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.02)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={18} /> Danger Zone
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>
                    These actions are irreversible. Proceed with caution.
                </p>
                <button
                    className="d-btn d-btn-danger"
                    onClick={() => toast.error('Not implemented yet — connect to your backend first!')}
                >
                    Purge All Inactive Users
                </button>
            </div>
        </>
    );
};

export default GlobalSettings;
