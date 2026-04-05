import React, { useState, useEffect } from "react";
import { CircularProgress } from "@mui/material";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { loginUser, trackTraffic } from "../services/api";
import { useNavigate } from "react-router-dom";
import { useGlobalStore } from "../store/store";
import socket from "../services/socket";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "../static/logo-transparent.png"

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Figtree:wght@300;400;500;600&display=swap');

  .ig-root * { box-sizing: border-box; margin: 0; padding: 0; }

  .ig-root {
    font-family: 'Figtree', sans-serif;
    width: 100%;
    height: 100dvh;
    display: flex;
    overflow: hidden;
    background: #0e0a08;
  }

  /* ── Left panel — immersive visual ───────────────── */
  .ig-visual {
    flex: 1;
    position: relative;
    overflow: hidden;
    display: none;
  }

  @media (min-width: 860px) {
    .ig-visual { display: block; }
  }

  /* Warm collage-style background */
  .ig-visual-bg {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 55% at 30% 25%, rgba(255,177,100,0.45) 0%, transparent 65%),
      radial-gradient(ellipse 55% 60% at 75% 70%, rgba(234,100,120,0.38) 0%, transparent 65%),
      radial-gradient(ellipse 70% 50% at 55% 45%, rgba(255,130,80,0.22) 0%, transparent 60%),
      linear-gradient(160deg, #1a0f08 0%, #2a1510 40%, #1e0d14 100%);
  }

  /* Floating photo-card mockups */
  .ig-photo-grid {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr 1fr;
    gap: 10px;
    padding: 32px;
    opacity: 0.55;
  }

  .ig-photo-card {
    border-radius: 16px;
    overflow: hidden;
    position: relative;
  }

  .ig-photo-card:nth-child(1) { background: linear-gradient(135deg, #f5c07a, #e8866a); grid-row: 1 / 3; }
  .ig-photo-card:nth-child(2) { background: linear-gradient(135deg, #d4756b, #b5506a); }
  .ig-photo-card:nth-child(3) { background: linear-gradient(135deg, #e8a87c, #d46b5a); }
  .ig-photo-card:nth-child(4) { background: linear-gradient(135deg, #c87b8a, #a05070); grid-column: 1 / 3; }

  /* Scatter texture */
  .ig-photo-card::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(14, 10, 8, 0.18);
    mix-blend-mode: multiply;
    pointer-events: none;
  }

  /* Overlay gradient for readability */
  .ig-visual-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent 60%, #0e0a08 100%);
  }

  /* Left panel branding */
  .ig-visual-brand {
    position: absolute;
    bottom: 48px;
    left: 44px;
    right: 44px;
  }

  .ig-visual-tagline {
    font-family: 'Fraunces', serif;
    font-size: 40px;
    font-weight: 300;
    line-height: 1.15;
    color: rgba(255,255,255,0.92);
    letter-spacing: -0.5px;
    text-shadow: 0 2px 20px rgba(0,0,0,0.4);
  }

  .ig-visual-tagline em {
    font-style: italic;
    color: #f4a96a;
  }

  .ig-visual-sub {
    margin-top: 10px;
    font-size: 15px;
    font-weight: 300;
    color: rgba(255,255,255,0.42);
    letter-spacing: 0.2px;
  }

  /* ── Right panel — login form ────────────────────── */
  .ig-panel {
    width: 100%;
    max-width: 480px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 48px 52px;
    position: relative;
    background: #0e0a08;
  }

  @media (min-width: 860px) {
    .ig-panel { width: 460px; flex-shrink: 0; }
  }

  @media (max-width: 520px) {
    .ig-panel { padding: 40px 28px; }
  }

  /* Subtle warm ambient glow behind form */
  .ig-panel::before {
    content: '';
    position: absolute;
    top: -80px; right: -80px;
    width: 320px; height: 320px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(234,100,80,0.09) 0%, transparent 70%);
    pointer-events: none;
  }

  /* ── Logo / wordmark ────────────────────────────── */
  .ig-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 44px;
  }

  .ig-logo-mark {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .ig-logo-mark img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .ig-logo-name {
    font-family: 'Fraunces', serif;
    font-size: 24px;
    font-weight: 400;
    color: #fff;
    letter-spacing: -0.3px;
  }

  /* ── Greeting ────────────────────────────────────── */
  .ig-greeting {
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #e07a60;
  }

  .ig-headline {
    font-family: 'Fraunces', serif;
    font-size: 34px;
    font-weight: 300;
    color: #fff;
    line-height: 1.15;
    letter-spacing: -0.5px;
    margin-bottom: 10px;
  }

  .ig-headline em {
    font-style: italic;
    color: #f5b88a;
  }

  .ig-subtext {
    font-size: 14px;
    color: rgba(255,255,255,0.38);
    font-weight: 300;
    line-height: 1.6;
    margin-bottom: 40px;
  }

  /* ── Fields ─────────────────────────────────────── */
  .ig-fields {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 4px;
  }

  .ig-field {
    position: relative;
  }

  .ig-field label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.3);
    margin-bottom: 8px;
  }

  .ig-field input {
    width: 100%;
    height: 52px;
    background: rgba(255,255,255,0.04);
    border: 1.5px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    padding: 0 18px;
    font-size: 15px;
    font-family: 'Figtree', sans-serif;
    font-weight: 400;
    color: #fff;
    outline: none;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
    -webkit-appearance: none;
  }

  .ig-field input::placeholder {
    color: rgba(255,255,255,0.18);
  }

  .ig-field input:hover {
    border-color: rgba(244,169,106,0.25);
    background: rgba(255,255,255,0.06);
  }

  .ig-field input:focus {
    border-color: rgba(244,169,106,0.55);
    background: rgba(244,169,106,0.05);
    box-shadow: 0 0 0 4px rgba(244,169,106,0.08);
  }

  /* ── Row: forgot + submit ────────────────────────── */
  .ig-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 28px;
    margin-bottom: 32px;
  }

  .ig-forgot {
    font-size: 13px;
    color: rgba(255,255,255,0.3);
    background: none;
    border: none;
    cursor: pointer;
    font-family: 'Figtree', sans-serif;
    padding: 0;
    transition: color 0.2s;
  }

  .ig-forgot:hover { color: #f4a96a; }

  /* ── CTA button ──────────────────────────────────── */
  .ig-btn {
    height: 52px;
    padding: 0 32px;
    border-radius: 14px;
    border: none;
    background: linear-gradient(135deg, #f4a96a 0%, #e05c7e 100%);
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    font-family: 'Figtree', sans-serif;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 6px 28px rgba(224,92,126,0.35);
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    white-space: nowrap;
  }

  .ig-btn:hover:not(:disabled) {
    opacity: 0.92;
    transform: translateY(-1px);
    box-shadow: 0 10px 36px rgba(224,92,126,0.45);
  }

  .ig-btn:active:not(:disabled) { transform: translateY(0); }

  .ig-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* ── Social proof strip ──────────────────────────── */
  .ig-avatars {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 32px;
  }

  .ig-avatar-stack {
    display: flex;
  }

  .ig-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid #0e0a08;
    margin-left: -8px;
    font-size: 11px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    flex-shrink: 0;
  }

  .ig-avatar:first-child { margin-left: 0; }
  .ig-avatar:nth-child(1) { background: linear-gradient(135deg, #f4a96a, #e05c7e); }
  .ig-avatar:nth-child(2) { background: linear-gradient(135deg, #e05c7e, #b0366a); }
  .ig-avatar:nth-child(3) { background: linear-gradient(135deg, #c47a5a, #f4a96a); }

  .ig-social-text {
    font-size: 12.5px;
    color: rgba(255,255,255,0.32);
    font-weight: 300;
    line-height: 1.45;
  }

  .ig-social-text strong {
    color: rgba(255,255,255,0.6);
    font-weight: 500;
  }

  /* ── Divider ─────────────────────────────────────── */
  .ig-divider {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 28px;
  }

  .ig-divider-line {
    flex: 1;
    height: 1px;
    background: rgba(255,255,255,0.07);
  }

  .ig-divider-text {
    font-size: 12px;
    color: rgba(255,255,255,0.22);
    font-weight: 400;
    white-space: nowrap;
  }

  /* ── Footer ──────────────────────────────────────── */
  .ig-footer {
    text-align: center;
    font-size: 14px;
    color: rgba(255,255,255,0.3);
    font-weight: 300;
  }

  .ig-footer a {
    color: #f4a96a;
    font-weight: 500;
    text-decoration: none;
    transition: color 0.2s;
  }

  .ig-footer a:hover { color: #f5c094; }

  .ig-footer .ig-about {
    color: rgba(255,255,255,0.22);
    font-weight: 400;
  }

  /* ── Error ───────────────────────────────────────── */
  .ig-error {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: rgba(220, 80, 80, 0.08);
    border: 1px solid rgba(220,80,80,0.2);
    border-radius: 12px;
    padding: 12px 16px;
    margin-bottom: 22px;
  }

  .ig-error-icon {
    font-size: 14px;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .ig-error span {
    font-size: 13.5px;
    color: #f9a8a8;
    line-height: 1.5;
  }
`;

// ─── Component ────────────────────────────────────────────────────────────────
const LoginPage: React.FC = () => {
  const { setUser } = useGlobalStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const id = "ig-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = styles;
      document.head.appendChild(el);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    const track = async () => {
      try {
        const ip = await axios.get("https://api.ipify.org?format=json");
        const loc = await axios.get(`https://ipinfo.io/${ip.data.ip}/json`);
        await trackTraffic({
          ip: ip.data.ip,
          userAgent: navigator.userAgent,
          location: loc.data.city || loc.data.country,
          referrer: document.referrer,
        });
      } catch {}
    };
    track();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await loginUser({ email, password });
      if (response.success) {
        const { token, user } = response.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        socket.emit("registerUser", user.id);
        setUser(user);
        navigate("/");
      } else {
        setError(response.error || "Login failed!");
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed!");
      setLoading(false);
    }
  };

  const fade = (i: number) => ({
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.08 + i * 0.07,
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  });

  const panelVariants = {
    hidden: { opacity: 0, x: 30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const visualVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.9, ease: "easeOut" } },
  };

  return (
    <GoogleOAuthProvider clientId="702353220748-2lmc03lb4tcfnuqds67h8bbupmb1aa0q.apps.googleusercontent.com">
      <div className="ig-root">
        {/* ── Left: Visual panel ── */}
        <AnimatePresence>
          {mounted && (
            <motion.div
              className="ig-visual"
              variants={visualVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="ig-visual-bg" />
              <div className="ig-photo-grid">
                <div className="ig-photo-card">
                  <img
                    src="https://plus.unsplash.com/premium_photo-1683143646126-df3a3f3739f3?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
                <div className="ig-photo-card">
                  <img
                    src="https://plus.unsplash.com/premium_photo-1682401101972-5dc0756ece88?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
                <div className="ig-photo-card">
                  <img
                    src="https://plus.unsplash.com/premium_photo-1663051303500-c85bef3f05f6?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
                <div className="ig-photo-card">
                  <img
                    src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
              </div>
              <div className="ig-visual-overlay" />
              <div className="ig-visual-brand">
                <p className="ig-visual-tagline">
                  Every moment
                  <br />
                  <em>worth sharing.</em>
                </p>
                <p className="ig-visual-sub">
                  Connect, create, and be inspired daily.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Right: Form panel ── */}
        <AnimatePresence>
          {mounted && (
            <motion.div
              className="ig-panel"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Logo */}
              <motion.div variants={fade(0)} initial="hidden" animate="visible">
                <div className="ig-logo">
                  <div className="ig-logo-mark">
                    <img src={Logo} alt="Ripple logo" />
                  </div>
                  <span className="ig-logo-name">Ripple</span>
                </div>
              </motion.div>

              {/* Greeting + headline */}
              <motion.div variants={fade(1)} initial="hidden" animate="visible">
                <p className="ig-greeting">Welcome back</p>
                <h1 className="ig-headline">
                  Sign in to your
                  <br />
                  <em>world.</em>
                </h1>
                <p className="ig-subtext">
                  Your feed, your stories, your people — all waiting.
                </p>
              </motion.div>

              {/* Social proof */}
              <motion.div variants={fade(2)} initial="hidden" animate="visible">
                <div className="ig-avatars">
                  <div className="ig-avatar-stack">
                    <div className="ig-avatar">A</div>
                    <div className="ig-avatar">J</div>
                    <div className="ig-avatar">M</div>
                  </div>
                  <p className="ig-social-text">
                    <strong>2.4M people</strong> shared moments today
                  </p>
                </div>
              </motion.div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="ig-error">
                      <span className="ig-error-icon">⚠</span>
                      <span>{error}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleLogin} noValidate>
                <motion.div
                  variants={fade(3)}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="ig-fields">
                    <div className="ig-field">
                      <label htmlFor="ig-email">Email</label>
                      <input
                        id="ig-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        autoComplete="email"
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="ig-field">
                      <label htmlFor="ig-password">Password</label>
                      <input
                        id="ig-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        autoComplete="current-password"
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  variants={fade(4)}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="ig-row">
                    <button
                      type="button"
                      className="ig-forgot"
                      onClick={() => navigate("/reset-password")}
                    >
                      Forgot password?
                    </button>
                    <button
                      type="submit"
                      className="ig-btn"
                      disabled={loading || !email || !password}
                    >
                      {loading ? (
                        <CircularProgress
                          size={18}
                          thickness={4}
                          sx={{ color: "#fff" }}
                        />
                      ) : (
                        <>
                          Sign in{" "}
                          <span style={{ fontSize: 16, opacity: 0.75 }}>→</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </form>

              {/* Divider */}
              <motion.div variants={fade(5)} initial="hidden" animate="visible">
                <div className="ig-divider">
                  <div className="ig-divider-line" />
                  <span className="ig-divider-text">New to Ripple?</span>
                  <div className="ig-divider-line" />
                </div>
              </motion.div>

              {/* Footer */}
              <motion.div variants={fade(6)} initial="hidden" animate="visible">
                <div className="ig-footer">
                  <a href="/register">Create your account</a>
                  <span style={{ margin: "0 10px", opacity: 0.25 }}>·</span>
                  <a href="/about" className="ig-about">
                    About Ripple
                  </a>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GoogleOAuthProvider>
  );
};

export default LoginPage;
