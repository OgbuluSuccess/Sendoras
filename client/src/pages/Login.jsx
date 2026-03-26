import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle, MailCheck, Zap, BarChart3 } from 'lucide-react';
import authService from '../services/auth';
import '../styles/Auth.css';

const Login = () => {
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
            await authService.login({ email, password });
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.msg || 'Login failed. Please check your credentials.');
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
                    <h2>Send smarter.<br />Reach every inbox.</h2>
                    <p>
                        The email platform built for marketers and developers
                        who can't afford to miss an inbox.
                    </p>
                </div>

                <div className="auth-brand-stats">
                    <div className="auth-stat-chip">
                        <MailCheck size={16} className="auth-stat-icon" />
                        <div className="auth-stat-text">
                            <strong>98.4% Delivery Rate</strong>
                            <span>Enterprise-grade infrastructure</span>
                        </div>
                    </div>
                    <div className="auth-stat-chip">
                        <Zap size={16} className="auth-stat-icon" />
                        <div className="auth-stat-text">
                            <strong>20M+ Emails Sent</strong>
                            <span>Trusted by 500+ teams</span>
                        </div>
                    </div>
                    <div className="auth-stat-chip">
                        <BarChart3 size={16} className="auth-stat-icon" />
                        <div className="auth-stat-text">
                            <strong>Real-Time Analytics</strong>
                            <span>Opens, clicks & bounces</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Right Form Panel ── */}
            <div className="auth-form-panel">
                <div className="auth-form-inner">
                    <div className="auth-form-header">
                        <h1>Welcome back</h1>
                        <p>Sign in to your Sendora account to continue.</p>
                    </div>

                    {error && (
                        <div className="auth-error-banner">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
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
                            <div className="auth-field-row">
                                <label htmlFor="password">Password</label>
                                <Link to="/forgot-password" className="auth-forgot">Forgot password?</Link>
                            </div>
                            <div className="auth-input-wrap">
                                <Lock className="auth-input-icon" size={17} />
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? 'Signing In…' : <><span>Sign In</span><ArrowRight size={18} /></>}
                        </button>
                    </form>

                    <div className="auth-switch">
                        Don't have an account? <Link to="/signup">Create one free</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
