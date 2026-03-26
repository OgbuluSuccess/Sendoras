import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, AlertCircle, Rocket, Shield, UserCheck } from 'lucide-react';
import authService from '../services/auth';
import '../styles/Auth.css';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await authService.register({ name, email, password });
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.msg || 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            {/* ── Left Brand Panel ── */}
            <div className="auth-brand-panel">
                <Link to="/" className="auth-brand-logo">
                    <Mail size={20} className="auth-brand-logo-icon" />
                    Sendora
                </Link>

                <div className="auth-brand-headline">
                    <h2>Your first campaign<br />starts here.</h2>
                    <p>
                        Join 500+ teams using Sendora to send personalized,
                        high-deliverability campaigns at scale — for free.
                    </p>
                </div>

                <div className="auth-brand-stats">
                    <div className="auth-stat-chip">
                        <Rocket size={16} className="auth-stat-icon" />
                        <div className="auth-stat-text">
                            <strong>Free to start</strong>
                            <span>5,000 emails/month included</span>
                        </div>
                    </div>
                    <div className="auth-stat-chip">
                        <Shield size={16} className="auth-stat-icon" />
                        <div className="auth-stat-text">
                            <strong>Secure by default</strong>
                            <span>SPF, DKIM & compliance built-in</span>
                        </div>
                    </div>
                    <div className="auth-stat-chip">
                        <UserCheck size={16} className="auth-stat-icon" />
                        <div className="auth-stat-text">
                            <strong>Personalization</strong>
                            <span>First name, last name & more</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Right Form Panel ── */}
            <div className="auth-form-panel">
                <div className="auth-form-inner">
                    <div className="auth-form-header">
                        <h1>Create your account</h1>
                        <p>Get started free — no credit card required.</p>
                    </div>

                    {error && (
                        <div className="auth-error-banner">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="auth-field">
                            <label htmlFor="name">Full Name</label>
                            <div className="auth-input-wrap">
                                <User className="auth-input-icon" size={17} />
                                <input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    autoComplete="name"
                                />
                            </div>
                        </div>

                        <div className="auth-field">
                            <label htmlFor="email">Email Address</label>
                            <div className="auth-input-wrap">
                                <Mail className="auth-input-icon" size={17} />
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="auth-field">
                            <label htmlFor="password">Password</label>
                            <div className="auth-input-wrap">
                                <Lock className="auth-input-icon" size={17} />
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="Min. 8 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? 'Creating Account…' : <><span>Create Free Account</span><ArrowRight size={18} /></>}
                        </button>

                        <p style={{ fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center', margin: 0 }}>
                            By signing up you agree to our{' '}
                            <a href="#" style={{ color: '#64748b' }}>Terms</a> and{' '}
                            <a href="#" style={{ color: '#64748b' }}>Privacy Policy</a>.
                        </p>
                    </form>

                    <div className="auth-switch">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
