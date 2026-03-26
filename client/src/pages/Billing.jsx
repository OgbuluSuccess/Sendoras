import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Zap, CreditCard, ArrowUpRight } from 'lucide-react';
import billingService from '../services/billing';
import authService from '../services/auth';
import toast from 'react-hot-toast';
import '../styles/DashboardNew.css';

const PLANS = [
    {
        id: 'free',
        name: 'Free',
        price: '$0',
        period: '/month',
        desc: 'Perfect for getting started',
        color: '#64748b',
        features: ['1,000 emails / month', 'Basic analytics', '1 API key', 'Community support'],
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '$29',
        period: '/month',
        desc: 'For growing businesses',
        color: '#f97316',
        popular: true,
        features: ['50,000 emails / month', 'Advanced analytics', '5 API keys', 'Priority support', 'Custom sender domains'],
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: '$99',
        period: '/month',
        desc: 'For large-scale sending',
        color: '#8b5cf6',
        features: ['Unlimited emails', 'Dedicated IP address', 'Unlimited API keys', '24/7 dedicated support', 'SLA guarantee'],
    },
];

const Billing = () => {
    const [user] = useState(authService.getCurrentUser());
    const [loading, setLoading] = useState(null); // plan id being processed
    const [searchParams] = useSearchParams();

    useEffect(() => {
        if (searchParams.get('success')) toast.success('Payment successful! Your plan has been upgraded.');
        if (searchParams.get('canceled')) toast.error('Payment cancelled.');
    }, [searchParams]);

    const handleStripe = async (planId) => {
        setLoading(planId);
        try {
            const { url } = await billingService.createStripeSession(planId);
            window.location.href = url;
        } catch {
            toast.error('Failed to start Stripe checkout');
            setLoading(null);
        }
    };

    const handlePaystack = async (planId) => {
        setLoading(planId);
        try {
            const { authorization_url } = await billingService.initializePaystack(planId);
            window.location.href = authorization_url;
        } catch {
            toast.error('Failed to start Paystack checkout');
            setLoading(null);
        }
    };

    const currentTier = user?.tier || 'free';

    return (
        <>
            <div className="d-page-header">
                <div>
                    <h1>Billing & Plans</h1>
                    <p>Manage your subscription and upgrade your plan</p>
                </div>
            </div>

            {/* Current plan banner */}
            <div className="d-card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: '#fff7ed', border: '1px solid #fed7aa' }}>
                <div style={{ width: 42, height: 42, borderRadius: '12px', background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Zap size={20} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>
                        Current Plan: <span style={{ color: '#f97316', textTransform: 'uppercase' }}>{currentTier}</span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#92400e' }}>
                        You are currently on the {currentTier} tier.
                    </div>
                </div>
                <div className="d-badge d-badge-primary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
                    Active
                </div>
            </div>

            {/* Plan cards */}
            <div className="d-grid-3">
                {PLANS.map(plan => {
                    const isCurrent = currentTier === plan.id;
                    return (
                        <div
                            key={plan.id}
                            className="d-card"
                            style={{
                                position: 'relative',
                                border: plan.popular ? `2px solid ${plan.color}` : undefined,
                                overflow: 'hidden',
                            }}
                        >
                            {plan.popular && (
                                <div style={{
                                    position: 'absolute', top: 0, right: 0,
                                    background: plan.color, color: '#fff',
                                    fontSize: '0.7rem', fontWeight: 700,
                                    padding: '0.2rem 0.8rem', borderBottomLeftRadius: 10,
                                    letterSpacing: '0.5px', textTransform: 'uppercase',
                                }}>
                                    Most Popular
                                </div>
                            )}

                            <div style={{ marginBottom: '1.25rem' }}>
                                <div style={{ fontWeight: 800, fontSize: '1rem', color: plan.color, marginBottom: '0.2rem' }}>{plan.name}</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>{plan.desc}</div>
                                <div>
                                    <span style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-1.5px', color: '#0f172a' }}>{plan.price}</span>
                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{plan.period}</span>
                                </div>
                            </div>

                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                {plan.features.map(f => (
                                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.86rem', color: '#334155' }}>
                                        <Check size={15} style={{ color: '#10b981', flexShrink: 0 }} /> {f}
                                    </li>
                                ))}
                            </ul>

                            {isCurrent ? (
                                <button className="d-btn d-btn-secondary" style={{ width: '100%', justifyContent: 'center', cursor: 'default' }} disabled>
                                    Current Plan
                                </button>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <button
                                        className="d-btn d-btn-primary"
                                        style={{ width: '100%', justifyContent: 'center' }}
                                        onClick={() => handleStripe(plan.id)}
                                        disabled={loading === plan.id}
                                    >
                                        <CreditCard size={15} />
                                        {loading === plan.id ? 'Redirecting…' : 'Pay with Stripe'}
                                    </button>
                                    <button
                                        className="d-btn d-btn-secondary"
                                        style={{ width: '100%', justifyContent: 'center' }}
                                        onClick={() => handlePaystack(plan.id)}
                                        disabled={loading === plan.id}
                                    >
                                        <ArrowUpRight size={15} />
                                        Pay with Paystack
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export default Billing;
