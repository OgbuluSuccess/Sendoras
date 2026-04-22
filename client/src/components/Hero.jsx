import React from "react";
import { Link } from "react-router-dom";
import { PlayCircle } from "lucide-react";
import { APP_NAME, APP_DOMAIN } from "../config/brand";

const Hero = () => {
  return (
    <section className="lp-hero">
      <div className="lp-hero-inner">
        {/* ── Left: Copy ── */}
        <div className="lp-hero-text">
          <div className="lp-hero-badge">
            <span className="lp-hero-badge-dot"></span>
            Enterprise-Grade Email Infrastructure
          </div>

          <h1 className="lp-hero-title">
            Send Smarter.
            <br />
            Reach <span className="highlight">Every Inbox.</span>
          </h1>

          <p className="lp-hero-sub">
            {APP_NAME} is the email infrastructure built for marketers and
            developers. Upload your lists, craft personalized campaigns, and
            send at scale — with real-time analytics to back every decision.
          </p>

          <div className="lp-hero-actions">
            <a href="https://app.sendhiiv.com/signup" className="lp-btn-hero-primary">
              Start for Free →
            </a>
            <a href="#how-it-works" className="lp-btn-hero-secondary">
              <PlayCircle size={18} />
              See how it works
            </a>
          </div>

          {/* Social proof */}
          <div className="lp-hero-social-proof">
            <div className="lp-avatars">
              <div className="lp-avatar lp-avatar-a">A</div>
              <div className="lp-avatar lp-avatar-b">M</div>
              <div className="lp-avatar lp-avatar-c">K</div>
              <div className="lp-avatar lp-avatar-d">J</div>
            </div>
            <p className="lp-proof-text">
              Trusted by <strong>500+ teams</strong> to deliver over 20M emails
              monthly
            </p>
          </div>
        </div>

        {/* ── Right: Mock Dashboard Visual ── */}
        <div className="lp-hero-visual">
          {/* Floating chips */}
          <div className="lp-hero-chip chip-a">
            <span className="lp-hero-chip-icon">📬</span>
            98.4% Delivery Rate
          </div>
          <div className="lp-hero-chip chip-b">
            <span className="lp-hero-chip-icon">⚡</span>
            12,450 emails sent today
          </div>

          {/* Mock dashboard card */}
          <div className="lp-hero-card">
            <div className="lp-hero-card-topbar">
              <span className="lp-dot lp-dot-red"></span>
              <span className="lp-dot lp-dot-yellow"></span>
              <span className="lp-dot lp-dot-green"></span>
              <span className="lp-card-bar-title">{APP_DOMAIN}/dashboard</span>
            </div>
            <div className="lp-hero-card-body">
              {/* Stats row */}
              <div className="lp-mock-stat-row">
                <div className="lp-mock-stat">
                  <div className="lp-mock-stat-label">Emails Sent</div>
                  <div className="lp-mock-stat-val">124K</div>
                  <div className="lp-mock-stat-delta up">↑ 18% this week</div>
                </div>
                <div className="lp-mock-stat">
                  <div className="lp-mock-stat-label">Open Rate</div>
                  <div className="lp-mock-stat-val">34.2%</div>
                  <div className="lp-mock-stat-delta up">↑ 4.1% vs avg</div>
                </div>
                <div className="lp-mock-stat">
                  <div className="lp-mock-stat-label">Click Rate</div>
                  <div className="lp-mock-stat-val">12.7%</div>
                  <div className="lp-mock-stat-delta up">↑ 2.3% vs avg</div>
                </div>
              </div>

              {/* Engagement bars */}
              <div className="lp-mock-bar-row">
                <div className="lp-mock-bar-item">
                  <span className="lp-mock-bar-label">Opens</span>
                  <div className="lp-mock-bar-track">
                    <div
                      className="lp-mock-bar-fill"
                      style={{ width: "68%" }}
                    ></div>
                  </div>
                  <span>68%</span>
                </div>
                <div className="lp-mock-bar-item">
                  <span className="lp-mock-bar-label">Clicks</span>
                  <div className="lp-mock-bar-track">
                    <div
                      className="lp-mock-bar-fill"
                      style={{ width: "45%", background: "#10b981" }}
                    ></div>
                  </div>
                  <span>45%</span>
                </div>
                <div className="lp-mock-bar-item">
                  <span className="lp-mock-bar-label">Bounces</span>
                  <div className="lp-mock-bar-track">
                    <div
                      className="lp-mock-bar-fill"
                      style={{ width: "3%", background: "#ef4444" }}
                    ></div>
                  </div>
                  <span>3%</span>
                </div>
              </div>

              {/* Recent campaigns */}
              <div className="lp-mock-campaign-row">
                <div>
                  <div className="lp-mock-camp-name">Black Friday Promo</div>
                  <div className="lp-mock-camp-sub">
                    8,200 recipients · 2h ago
                  </div>
                </div>
                <span className="lp-mock-camp-badge">Sent ✓</span>
              </div>
              <div className="lp-mock-campaign-row">
                <div>
                  <div className="lp-mock-camp-name">Monthly Newsletter</div>
                  <div className="lp-mock-camp-sub">
                    24,550 recipients · Yesterday
                  </div>
                </div>
                <span className="lp-mock-camp-badge">Sent ✓</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
