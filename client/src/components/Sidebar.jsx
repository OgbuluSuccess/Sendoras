import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Key, Mail, Send, Settings, LogOut } from 'lucide-react';
import '../styles/DashboardNew.css';

const Sidebar = () => {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <Mail className="logo-icon" />
                <span className="logo-text">Sendora</span>
            </div>

            <nav className="sidebar-nav">
                <ul>
                    <li>
                        <NavLink to="/dashboard" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                            <LayoutDashboard size={20} />
                            <span>Overview</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/dashboard/campaigns" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                            <Send size={20} />
                            <span>Campaigns</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/dashboard/api-keys" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                            <Key size={20} />
                            <span>API Keys</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/dashboard/settings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                            <Settings size={20} />
                            <span>Settings</span>
                        </NavLink>
                    </li>
                </ul>
            </nav>

            <div className="sidebar-footer">
                <button className="btn-logout">
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
