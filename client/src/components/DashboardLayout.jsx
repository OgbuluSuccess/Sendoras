import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Mail, Users, BarChart2, CheckCircle,
    Key, CreditCard, Settings, LogOut, Menu, X, Bell, Globe
} from 'lucide-react';
import authService from '../services/auth';
import '../styles/DashboardNew.css';

const NAV_MAIN = [
    { to: '/dashboard', end: true, icon: <LayoutDashboard size={18} />, label: 'Overview' },
    { to: '/campaigns', end: false, icon: <Mail size={18} />, label: 'Campaigns' },
    { to: '/contacts', end: false, icon: <Users size={18} />, label: 'Contacts' },
    { to: '/analytics', end: false, icon: <BarChart2 size={18} />, label: 'Analytics' },
    { to: '/domains', end: false, icon: <Globe size={18} />, label: 'Domains' },
    { to: '/validation', end: false, icon: <CheckCircle size={18} />, label: 'Email Validation' },
];

const NAV_ACCOUNT = [
    { to: '/api-keys', end: false, icon: <Key size={18} />, label: 'API Keys' },
    { to: '/billing', end: false, icon: <CreditCard size={18} />, label: 'Billing' },
    { to: '/settings', end: false, icon: <Settings size={18} />, label: 'Settings' },
];

const PAGE_TITLES = {
    '/dashboard': { title: 'Overview', sub: 'Your campaign command center' },
    '/campaigns': { title: 'Campaigns', sub: 'Manage your email campaigns' },
    '/contacts': { title: 'Contacts', sub: 'Your recipient lists' },
    '/analytics': { title: 'Analytics', sub: 'Campaign performance insights' },
    '/validation': { title: 'Email Validation', sub: 'Check email deliverability' },
    '/domains': { title: 'Custom Domains', sub: 'Send from your own domain' },
    '/api-keys': { title: 'API Keys', sub: 'Manage developer access' },
    '/billing': { title: 'Billing', sub: 'Subscription & payments' },
    '/settings': { title: 'Settings', sub: 'Account preferences' },
};

const DashboardLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const user = authService.getCurrentUser();
    const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

    // Lock body scroll when mobile sidebar is open
    useEffect(() => {
        document.body.style.overflow = sidebarOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [sidebarOpen]);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const pageInfo = PAGE_TITLES[location.pathname] || { title: 'Dashboard', sub: '' };

    return (
        <div className="d-layout">
            {/* Sidebar overlay on mobile — only visible ≤768px */}
            {sidebarOpen && (
                <div
                    className="d-sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ── Sidebar ── */}
            <aside className={`d-sidebar${sidebarOpen ? ' open' : ''}`}>
                {/* Logo */}
                <div className="d-sidebar-logo">
                    <Mail size={20} className="d-logo-icon" />
                    Sendora
                </div>

                {/* Main Nav */}
                <nav className="d-nav">
                    <div className="d-sidebar-section-label">Main</div>
                    {NAV_MAIN.map(({ to, end, icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) => `d-nav-item${isActive ? ' active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            {icon}
                            {label}
                        </NavLink>
                    ))}

                    <div className="d-nav-divider" />
                    <div className="d-sidebar-section-label">Account</div>

                    {NAV_ACCOUNT.map(({ to, end, icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) => `d-nav-item${isActive ? ' active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            {icon}
                            {label}
                        </NavLink>
                    ))}

                    {/* Admin links if admin role */}
                    {user?.role === 'admin' && (
                        <>
                            <div className="d-nav-divider" />
                            <div className="d-sidebar-section-label">Admin</div>
                            <NavLink to="/admin" end className={({ isActive }) => `d-nav-item${isActive ? ' active' : ''}`} onClick={() => setSidebarOpen(false)}>
                                <LayoutDashboard size={18} /> Admin Home
                            </NavLink>
                            <NavLink to="/admin/users" end className={({ isActive }) => `d-nav-item${isActive ? ' active' : ''}`} onClick={() => setSidebarOpen(false)}>
                                <Users size={18} /> Users
                            </NavLink>
                            <NavLink to="/admin/transactions" end className={({ isActive }) => `d-nav-item${isActive ? ' active' : ''}`} onClick={() => setSidebarOpen(false)}>
                                <CreditCard size={18} /> Transactions
                            </NavLink>
                            <NavLink to="/admin/campaigns" end className={({ isActive }) => `d-nav-item${isActive ? ' active' : ''}`} onClick={() => setSidebarOpen(false)}>
                                <Mail size={18} /> System Campaigns
                            </NavLink>
                            <NavLink to="/admin/plans" end className={({ isActive }) => `d-nav-item${isActive ? ' active' : ''}`} onClick={() => setSidebarOpen(false)}>
                                <CreditCard size={18} /> Plans & Pricing
                            </NavLink>
                            <NavLink to="/admin/settings" end className={({ isActive }) => `d-nav-item${isActive ? ' active' : ''}`} onClick={() => setSidebarOpen(false)}>
                                <Settings size={18} /> Global Settings
                            </NavLink>
                        </>
                    )}
                </nav>

                {/* Footer */}
                <div className="d-sidebar-footer">
                    <div className="d-user-row">
                        <div className="d-user-avatar">{initials}</div>
                        <div>
                            <div className="d-user-name">{user?.name || 'User'}</div>
                            <div className="d-user-plan">Free Plan</div>
                        </div>
                    </div>
                    <button className="d-nav-item" onClick={handleLogout} style={{ color: '#ef4444' }}>
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* ── Main ── */}
            <div className="d-main">
                {/* Topbar */}
                <header className="d-topbar">
                    <div className="d-topbar-left">
                        {/* Mobile menu toggle — left side */}
                        <button
                            className="d-topbar-btn d-menu-toggle"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            aria-label="Toggle menu"
                        >
                            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                        <div>
                            <div className="d-topbar-title">{pageInfo.title}</div>
                            {pageInfo.sub && <div className="d-topbar-breadcrumb">{pageInfo.sub}</div>}
                        </div>
                    </div>
                    <div className="d-topbar-right">
                        <button className="d-topbar-btn" aria-label="Notifications">
                            <Bell size={18} />
                        </button>
                        <div className="d-topbar-avatar">{initials}</div>
                    </div>
                </header>

                {/* Page content */}
                <div className="d-page">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;
