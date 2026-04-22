import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import logoImg from "../assets/logo_transparent_light.svg";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav
      className={`lp-navbar${isOpen ? " lp-nav-mobile-open" : ""}`}
      style={{ position: "sticky" }}
    >
      <div className="lp-navbar-inner">
        {/* Logo */}
        <Link to="/" className="lp-logo" onClick={() => setIsOpen(false)}>
          <img src={logoImg} alt="Sendhiiv" className="lp-logo-img" />
        </Link>

        {/* Desktop Nav Links */}
        <ul className="lp-nav-links">
          <li>
            <a href="#features" onClick={() => setIsOpen(false)}>
              Features
            </a>
          </li>
          <li>
            <a href="#how-it-works" onClick={() => setIsOpen(false)}>
              How It Works
            </a>
          </li>
          <li>
            <a href="#pricing" onClick={() => setIsOpen(false)}>
              Pricing
            </a>
          </li>
          {/* Mobile-only CTAs appear here when open */}
          {isOpen && (
            <>
              <li
                style={{
                  borderTop: "1px solid #e2e8f0",
                  marginTop: "0.5rem",
                  paddingTop: "0.5rem",
                }}
              >
                <a
                  href="https://app.sendhiiv.com/login"
                  onClick={() => setIsOpen(false)}
                  style={{
                    color: "#64748b",
                    fontWeight: 600,
                    padding: "0.75rem 1rem",
                    display: "block",
                    borderRadius: "8px",
                    textDecoration: "none",
                  }}
                >
                  Login
                </a>
              </li>
              <li>
                <a
                  href="https://app.sendhiiv.com/signup"
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "0.75rem 1rem",
                    background: "#f97316",
                    color: "#fff",
                    fontWeight: 700,
                    borderRadius: "999px",
                    textDecoration: "none",
                  }}
                >
                  Get Started Free
                </a>
              </li>
            </>
          )}
        </ul>

        {/* Desktop CTAs */}
        <div className="lp-nav-cta">
          <a href="https://app.sendhiiv.com/login" className="lp-btn-ghost">
            Login
          </a>
          <a href="https://app.sendhiiv.com/signup" className="lp-btn-primary">
            Get Started Free
          </a>
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
