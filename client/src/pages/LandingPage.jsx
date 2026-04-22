import React from "react";
import { Link } from "react-router-dom";
import { Upload, Pencil, SendHorizonal, Mail } from "lucide-react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Pricing from "../components/Pricing";
import { APP_NAME } from "../config/brand";
import logoLightImg from "../assets/logo_transparent_dark.svg";
import "../styles/Landing.css";

/* ── Trust strip ─────────────────────────────── */
const Trust = () => (
  <div className="lp-trust">
    <div className="lp-trust-inner">
      <span className="lp-trust-label">Trusted by teams at</span>
      <div className="lp-trust-logos">
        {["Acme Corp", "LaunchBase", "Growthly", "Nexus HQ", "Vantex"].map(
          (name) => (
            <span key={name} className="lp-trust-name">
              {name}
            </span>
          ),
        )}
      </div>
    </div>
  </div>
);

/* ── How It Works ────────────────────────────── */
const steps = [
  {
    num: "1",
    icon: <Upload size={20} />,
    title: "Upload Your List",
    desc: "Import recipients from Excel or CSV — with email, first name, and last name for full personalization.",
  },
  {
    num: "2",
    icon: <Pencil size={20} />,
    title: "Craft Your Campaign",
    desc: "Write your email content with HTML support. Use merge tags like {firstName} to personalize at scale.",
  },
  {
    num: "3",
    icon: <SendHorizonal size={20} />,
    title: "Send & Track",
    desc: "Fire off your campaign and watch opens, clicks, and bounce rates update in real time.",
  },
];

const HowItWorks = () => (
  <section className="lp-steps" id="how-it-works">
    <div className="lp-section-inner">
      <div className="lp-section-header">
        <span className="lp-section-tag">How It Works</span>
        <h2 className="lp-section-title">
          From list to inbox
          <br />
          in three steps
        </h2>
        <p className="lp-section-sub">
          No complicated setup. Start your first campaign in under five minutes.
        </p>
      </div>
      <div className="lp-steps-grid">
        {steps.map((s) => (
          <div key={s.num} className="lp-step-card">
            <div className="lp-step-num">{s.num}</div>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ── Footer ──────────────────────────────────── */
const Footer = () => (
  <footer className="lp-footer">
    <div className="lp-footer-inner">
      <div className="lp-footer-top">
        <div className="lp-footer-brand">
          <div
            className="lp-logo"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.75rem",
            }}
          >
            <img src={logoLightImg} alt={APP_NAME} style={{ height: 28 }} />
          </div>
          <p>
            Email infrastructure built for scale. Send smarter, reach every
            inbox.
          </p>
        </div>
        <div className="lp-footer-col">
          <h4>Product</h4>
          <ul>
            <li>
              <a href="#features">Features</a>
            </li>
            <li>
              <a href="#pricing">Pricing</a>
            </li>
            <li>
              <a href="#how-it-works">How it works</a>
            </li>
            <li>
              <Link to="/signup">Get started</Link>
            </li>
          </ul>
        </div>
        <div className="lp-footer-col">
          <h4>Developers</h4>
          <ul>
            <li>
              <a href="#">API Docs</a>
            </li>
            <li>
              <a href="#">Webhooks</a>
            </li>
            <li>
              <a href="#">Status</a>
            </li>
            <li>
              <a href="#">Changelog</a>
            </li>
          </ul>
        </div>
        <div className="lp-footer-col">
          <h4>Company</h4>
          <ul>
            <li>
              <a href="#">About</a>
            </li>
            <li>
              <a href="#">Blog</a>
            </li>
            <li>
              <a href="#">Privacy</a>
            </li>
            <li>
              <a href="#">Terms</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="lp-footer-bottom">
        <span>
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </span>
        <span>Built with ❤️ for deliverability-obsessed teams.</span>
      </div>
    </div>
  </footer>
);

/* ── Main Page ───────────────────────────────── */
const LandingPage = () => {
  return (
    <div className="landing-page">
      <Navbar />
      <Hero />
      <Trust />
      <Features />
      <HowItWorks />
      <Pricing />
      <Footer />
    </div>
  );
};

export default LandingPage;
