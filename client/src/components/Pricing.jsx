import React from 'react';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const plans = [
    {
        name: 'Free Starter',
        price: '0',
        desc: 'Perfect for side projects and testing the platform.',
        features: [
            '5,000 emails / month',
            'Basic analytics dashboard',
            '1 sender domain',
            'Community support',
            'API access',
        ],
        ctaText: 'Get Started Free',
        ctaLink: '/signup',
        ctaClass: '',
    },
    {
        name: 'Pro Growth',
        price: '49',
        desc: 'For growing businesses and serious email campaigns.',
        features: [
            'Unlimited emails',
            'Advanced analytics & reports',
            'Dedicated IP address',
            'Priority email support',
            'Multiple sender domains',
            'Personalization variables',
            'Team members (up to 5)',
        ],
        ctaText: 'Start Pro Trial',
        ctaLink: '/signup',
        ctaClass: 'plan-btn-primary',
        popular: true,
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        desc: 'For high-volume senders, agencies, and complex needs.',
        features: [
            'Custom email volume',
            'Managed deliverability',
            'Dedicated account manager',
            '24/7 phone & chat support',
            'Custom integrations',
            'SLA Guarantee',
        ],
        ctaText: 'Contact Sales',
        ctaLink: 'mailto:sales@sendora.io',
        ctaClass: '',
    },
];

const Pricing = () => {
    return (
        <section className="lp-pricing" id="pricing">
            <div className="lp-section-inner">
                <div className="lp-section-header">
                    <span className="lp-section-tag">Pricing</span>
                    <h2 className="lp-section-title">Simple, transparent pricing</h2>
                    <p className="lp-section-sub">
                        Start free, upgrade when you're ready. No hidden fees, no lock-in.
                    </p>
                </div>

                <div className="lp-pricing-grid">
                    {plans.map((plan) => (
                        <div key={plan.name} className={`lp-pricing-card${plan.popular ? ' popular' : ''}`}>
                            {plan.popular && <span className="lp-popular-badge">Most Popular</span>}

                            <div>
                                <div className="lp-plan-name">{plan.name}</div>
                                <div className="lp-plan-desc">{plan.desc}</div>
                            </div>

                            <div className="lp-plan-price">
                                {plan.price !== 'Custom' && (
                                    <span className="lp-price-currency">$</span>
                                )}
                                <span className="lp-price-val">{plan.price}</span>
                                {plan.price !== 'Custom' && (
                                    <span className="lp-price-per">/mo</span>
                                )}
                            </div>

                            <ul className="lp-plan-features">
                                {plan.features.map((feat) => (
                                    <li key={feat} className="lp-plan-feature">
                                        <Check size={15} className="lp-check-icon" />
                                        {feat}
                                    </li>
                                ))}
                            </ul>

                            <Link
                                to={plan.ctaLink}
                                className={`lp-plan-btn ${plan.ctaClass}`}
                            >
                                {plan.ctaText}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Pricing;
