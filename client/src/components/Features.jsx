import React from 'react';
import { Shield, Zap, BarChart3, Users, Globe, Lock } from 'lucide-react';

const features = [
    {
        icon: <Zap size={20} />,
        title: 'Blazing Delivery Speed',
        desc: 'AWS SES infrastructure ensures your emails hit inboxes in milliseconds — even at millions per day.',
    },
    {
        icon: <BarChart3 size={20} />,
        title: 'Deep Analytics',
        desc: 'Track opens, clicks, and bounces in real time. Know exactly which campaigns drive results.',
        featured: true,
    },
    {
        icon: <Users size={20} />,
        title: 'Personalization at Scale',
        desc: 'Upload lists with first name, last name, and custom fields, and craft emails that feel 1-on-1.',
    },
    {
        icon: <Shield size={20} />,
        title: 'Built-In Compliance',
        desc: 'Automatic spam-score scanning, unsubscribe handling, SPF/DKIM validation — all under the hood.',
    },
    {
        icon: <Globe size={20} />,
        title: 'Global Reach',
        desc: 'Multi-region support ensures your emails are routed through the optimal AWS endpoint worldwide.',
    },
    {
        icon: <Lock size={20} />,
        title: 'Secure by Default',
        desc: 'JWT auth, API key scoping, and rate limiting so your sending infrastructure is never compromised.',
    },
];

const Features = () => {
    return (
        <section className="lp-features" id="features">
            <div className="lp-section-inner">
                <div className="lp-section-header">
                    <span className="lp-section-tag">Why Sendora</span>
                    <h2 className="lp-section-title">Everything you need to<br />send with confidence</h2>
                    <p className="lp-section-sub">
                        Built for developers and marketers who can't afford deliverability to be an afterthought.
                    </p>
                </div>

                <div className="lp-features-grid">
                    {features.map((f) => (
                        <div key={f.title} className={`lp-feature-card${f.featured ? ' featured' : ''}`}>
                            <div className="lp-feature-icon-wrap">
                                {f.icon}
                            </div>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                            <a href="#" className="lp-feature-link">Learn more →</a>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
