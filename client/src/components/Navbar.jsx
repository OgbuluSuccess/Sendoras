import React, { useState } from 'react';
import { Mail, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className={`lp-navbar${isOpen ? ' lp-nav-mobile-open' : ''}`} style={{ position: 'sticky' }}>
            <div className="lp-navbar-inner">
                {/* Logo */}
                <Link to="/" className="lp-logo" onClick={() => setIsOpen(false)}>
                    <Mail size={20} className="lp-logo-icon" />
                    Sendora
                </Link>

                {/* Desktop Nav Links */}
                <ul className="lp-nav-links">
                    <li><a href="#features" onClick={() => setIsOpen(false)}>Features</a></li>
                    <li><a href="#how-it-works" onClick={() => setIsOpen(false)}>How It Works</a></li>
                    <li><a href="#pricing" onClick={() => setIsOpen(false)}>Pricing</a></li>
                    {/* Mobile-only CTAs appear here when open */}
                    {isOpen && (
                        <>
                            <li style={{ borderTop: '1px solid #e2e8f0', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                                <Link to="/login" onClick={() => setIsOpen(false)} style={{ color: '#64748b', fontWeight: 600, padding: '0.75rem 1rem', display: 'block', borderRadius: '8px', textDecoration: 'none' }}>
                                    Login
                                </Link>
                            </li>
                            <li>
                                <Link to="/signup" onClick={() => setIsOpen(false)} style={{ display: 'block', textAlign: 'center', padding: '0.75rem 1rem', background: '#f97316', color: '#fff', fontWeight: 700, borderRadius: '999px', textDecoration: 'none' }}>
                                    Get Started Free
                                </Link>
                            </li>
                        </>
                    )}
                </ul>

                {/* Desktop CTAs */}
                <div className="lp-nav-cta">
                    <Link to="/login" className="lp-btn-ghost">Login</Link>
                    <Link to="/signup" className="lp-btn-primary">Get Started Free</Link>
                </div>

                {/* Mobile hamburger */}
                <button
                    className="lp-hamburger"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle menu"
                >
                    {isOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
