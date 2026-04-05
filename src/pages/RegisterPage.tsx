import React, { useState, useEffect } from "react";
import { CircularProgress } from "@mui/material";
import { registerUser } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "../static/logo-transparent.png";

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Figtree:wght@300;400;500;600&display=swap');

  .ig-reg-root * { box-sizing: border-box; margin: 0; padding: 0; }

  .ig-reg-root {
    font-family: 'Figtree', sans-serif;
    width: 100%;
    min-height: 100dvh;
    display: flex;
    overflow: hidden;
    background: #0e0a08;
  }

  /* ── Left visual panel ───────────────────────────── */
  .ig-reg-visual {
    flex: 1;
    position: relative;
    overflow: hidden;
    display: none;
  }

  @media (min-width: 860px) {
    .ig-reg-visual { display: block; }
  }

  .ig-reg-visual-bg {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 55% 60% at 25% 70%, rgba(255,177,100,0.4) 0%, transparent 65%),
      radial-gradient(ellipse 60% 55% at 70% 25%, rgba(234,100,120,0.35) 0%, transparent 65%),
      radial-gradient(ellipse 65% 50% at 50% 50%, rgba(255,130,80,0.18) 0%, transparent 60%),
      linear-gradient(160deg, #1a0f08 0%, #2a1510 40%, #1e0d14 100%);
  }

  .ig-reg-photo-grid {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 10px;
    padding: 32px;
    opacity: 0.5;
  }

  .ig-reg-photo-card {
    border-radius: 16px;
    overflow: hidden;
    position: relative;
  }

  .ig-reg-photo-card:nth-child(1) { background: linear-gradient(135deg, #f5c07a, #e8866a); }
  .ig-reg-photo-card:nth-child(2) { background: linear-gradient(135deg, #d4756b, #b5506a); grid-row: 1 / 3; }
  .ig-reg-photo-card:nth-child(3) { background: linear-gradient(135deg, #e8a87c, #c4644a); }
  .ig-reg-photo-card:nth-child(4) { background: linear-gradient(135deg, #c87b8a, #a05070); }
  .ig-reg-photo-card:nth-child(5) { background: linear-gradient(135deg, #f0956a, #d4557a); }

  .ig-reg-photo-card::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(14, 10, 8, 0.18);
    mix-blend-mode: multiply;
    pointer-events: none;
  }

  .ig-reg-visual-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent 55%, #0e0a08 100%);
  }

  .ig-reg-visual-brand {
    position: absolute;
    bottom: 48px;
    left: 44px;
    right: 44px;
  }

  .ig-reg-visual-tagline {
    font-family: 'Fraunces', serif;
    font-size: 38px;
    font-weight: 300;
    line-height: 1.15;
    color: rgba(255,255,255,0.92);
    letter-spacing: -0.5px;
    text-shadow: 0 2px 20px rgba(0,0,0,0.4);
  }

  .ig-reg-visual-tagline em {
    font-style: italic;
    color: #f4a96a;
  }

  .ig-reg-visual-sub {
    margin-top: 10px;
    font-size: 15px;
    font-weight: 300;
    color: rgba(255,255,255,0.4);
  }

  /* ── Right form panel ────────────────────────────── */
  .ig-reg-panel {
    width: 100%;
    max-width: 480px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 48px 52px;
    position: relative;
    background: #0e0a08;
    overflow-y: auto;
    overflow-x: hidden;
  }

  @media (min-width: 860px) {
    .ig-reg-panel { width: 480px; flex-shrink: 0; }
  }

  @media (max-width: 520px) {
    .ig-reg-panel { padding: 40px 28px; }
  }

  .ig-reg-panel::before {
    content: '';
    position: absolute;
    top: -80px; right: -80px;
    width: 320px; height: 320px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(234,100,80,0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  /* ── Logo ────────────────────────────────────────── */
  .ig-reg-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 40px;
  }

  .ig-reg-logo-mark {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .ig-reg-logo-mark img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .ig-reg-logo-name {
    font-family: 'Fraunces', serif;
    font-size: 24px;
    font-weight: 400;
    color: #fff;
    letter-spacing: -0.3px;
  }

  /* ── Greeting / headline ─────────────────────────── */
  .ig-reg-greeting {
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #e07a60;
    margin-bottom: 6px;
  }

  .ig-reg-headline {
    font-family: 'Fraunces', serif;
    font-size: 32px;
    font-weight: 300;
    color: #fff;
    line-height: 1.15;
    letter-spacing: -0.5px;
    margin-bottom: 10px;
  }

  .ig-reg-headline em {
    font-style: italic;
    color: #f5b88a;
  }

  .ig-reg-subtext {
    font-size: 14px;
    color: rgba(255,255,255,0.36);
    font-weight: 300;
    line-height: 1.6;
    margin-bottom: 32px;
  }

  /* ── Fields ──────────────────────────────────────── */
  .ig-reg-fields {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .ig-reg-field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  @media (max-width: 400px) {
    .ig-reg-field-row { grid-template-columns: 1fr; }
  }

  .ig-reg-field label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.3);
    margin-bottom: 8px;
  }

  .ig-reg-field input {
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

  .ig-reg-field input::placeholder { color: rgba(255,255,255,0.18); }

  .ig-reg-field input:hover {
    border-color: rgba(244,169,106,0.25);
    background: rgba(255,255,255,0.06);
  }

  .ig-reg-field input:focus {
    border-color: rgba(244,169,106,0.55);
    background: rgba(244,169,106,0.05);
    box-shadow: 0 0 0 4px rgba(244,169,106,0.08);
  }

  /* ── Password strength bar ───────────────────────── */
  .ig-reg-strength {
    display: flex;
    gap: 5px;
    margin-top: 7px;
  }

  .ig-reg-strength-seg {
    flex: 1;
    height: 3px;
    border-radius: 2px;
    background: rgba(255,255,255,0.07);
    transition: background 0.3s;
  }

  .ig-reg-strength-seg.weak   { background: #f87171; }
  .ig-reg-strength-seg.fair   { background: #fbbf24; }
  .ig-reg-strength-seg.good   { background: #f4a96a; }
  .ig-reg-strength-seg.strong { background: #34d399; }

  /* ── Password match ──────────────────────────────── */
  .ig-reg-match {
    font-size: 11.5px;
    margin-top: 6px;
    font-weight: 500;
    transition: color 0.2s;
  }
  .ig-reg-match.ok  { color: #34d399; }
  .ig-reg-match.bad { color: #f87171; }

  /* ── Submit button ───────────────────────────────── */
  .ig-reg-btn {
    width: 100%;
    height: 52px;
    margin-top: 24px;
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
    justify-content: center;
    gap: 8px;
    box-shadow: 0 6px 28px rgba(224,92,126,0.35);
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
  }

  .ig-reg-btn:hover:not(:disabled) {
    opacity: 0.92;
    transform: translateY(-1px);
    box-shadow: 0 10px 36px rgba(224,92,126,0.45);
  }

  .ig-reg-btn:active:not(:disabled) { transform: translateY(0); }

  .ig-reg-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* ── Alerts ──────────────────────────────────────── */
  .ig-reg-alert {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    border-radius: 12px;
    padding: 12px 16px;
    margin-bottom: 22px;
  }

  .ig-reg-alert.error {
    background: rgba(220,80,80,0.08);
    border: 1px solid rgba(220,80,80,0.2);
  }

  .ig-reg-alert.success {
    background: rgba(52,211,153,0.07);
    border: 1px solid rgba(52,211,153,0.2);
  }

  .ig-reg-alert-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }

  .ig-reg-alert.error   span { font-size: 13.5px; color: #f9a8a8; line-height: 1.5; }
  .ig-reg-alert.success span { font-size: 13.5px; color: #6ee7b7; line-height: 1.5; }

  /* ── Terms ───────────────────────────────────────── */
  .ig-reg-terms {
    font-size: 12px;
    color: rgba(255,255,255,0.22);
    text-align: center;
    margin-top: 16px;
    line-height: 1.6;
  }

  .ig-reg-terms a {
    color: rgba(244,169,106,0.7);
    text-decoration: none;
    transition: color 0.2s;
  }

  .ig-reg-terms a:hover { color: #f4a96a; }

  /* ── Divider ─────────────────────────────────────── */
  .ig-reg-divider {
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 24px 0 20px;
  }

  .ig-reg-divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.07); }

  .ig-reg-divider-text {
    font-size: 12px;
    color: rgba(255,255,255,0.22);
    white-space: nowrap;
  }

  /* ── Footer ──────────────────────────────────────── */
  .ig-reg-footer {
    text-align: center;
    font-size: 14px;
    color: rgba(255,255,255,0.3);
    font-weight: 300;
  }

  .ig-reg-footer a {
    color: #f4a96a;
    font-weight: 500;
    text-decoration: none;
    transition: color 0.2s;
  }

  .ig-reg-footer a:hover { color: #f5c094; }

  .ig-reg-footer .ig-reg-about {
    color: rgba(255,255,255,0.22);
    font-weight: 400;
  }
`;

// ─── Password strength helper ─────────────────────────────────────────────────
function getStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) || /[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  return Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
}

const strengthClass = ["", "weak", "fair", "good", "strong"];

// ─── Component ────────────────────────────────────────────────────────────────
const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const strength = getStrength(password);
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  useEffect(() => {
    const id = "ig-reg-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = styles;
      document.head.appendChild(el);
    }
    setMounted(true);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError(
        "Only letters, numbers and underscores are allowed in the username.",
      );
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const response = await registerUser({ email, username, password });
      if (response.success) {
        setSuccess(
          "Account created! Check your email for a verification link.",
        );
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      } else {
        setError(response.error || "Registration failed.");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    !loading && !!email && !!username && !!password && !!confirmPassword;

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
    <div className="ig-reg-root">
      {/* ── Left: Visual panel ── */}
      <AnimatePresence>
        {mounted && (
          <motion.div
            className="ig-reg-visual"
            variants={visualVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="ig-reg-visual-bg" />
            <div className="ig-reg-photo-grid">
              <div className="ig-reg-photo-card">
                <img
                  src="https://images.unsplash.com/photo-1530047139082-5435ca3c4614?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
              <div className="ig-reg-photo-card">
                <img
                  src="https://images.unsplash.com/photo-1500027014421-46ccc843776a?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
              <div className="ig-reg-photo-card">
                <img
                  src="https://plus.unsplash.com/premium_photo-1664874602639-977e8c682917?q=80&w=765&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
              <div className="ig-reg-photo-card">
                <img
                  src="https://images.unsplash.com/photo-1600265360004-c16515250359?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
              <div className="ig-reg-photo-card">
                <img
                  src="https://plus.unsplash.com/premium_photo-1664874603199-bd8f0f671227?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
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
            <div className="ig-reg-visual-overlay" />
            <div className="ig-reg-visual-brand">
              <p className="ig-reg-visual-tagline">
                Your story
                <br />
                <em>starts here.</em>
              </p>
              <p className="ig-reg-visual-sub">
                Join millions sharing life's best moments.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Right: Form panel ── */}
      <AnimatePresence>
        {mounted && (
          <motion.div
            className="ig-reg-panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Logo */}
            <motion.div variants={fade(0)} initial="hidden" animate="visible">
              <div className="ig-reg-logo">
                <div className="ig-reg-logo-mark">
                  <img src={Logo} alt="Ripple logo" />
                </div>
                <span className="ig-reg-logo-name">Ripple</span>
              </div>
            </motion.div>

            {/* Greeting + headline */}
            <motion.div variants={fade(1)} initial="hidden" animate="visible">
              <p className="ig-reg-greeting">Create account</p>
            </motion.div>

            {/* Alerts */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="ig-reg-alert error">
                    <span className="ig-reg-alert-icon">⚠</span>
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="ig-reg-alert success">
                    <span className="ig-reg-alert-icon">✓</span>
                    <span>{success}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleRegister} noValidate>
              <motion.div variants={fade(2)} initial="hidden" animate="visible">
                <div className="ig-reg-fields">
                  {/* Username + Email row */}
                  <div className="ig-reg-field-row">
                    <div className="ig-reg-field">
                      <label htmlFor="ig-reg-username">Username</label>
                      <input
                        id="ig-reg-username"
                        type="text"
                        placeholder="john_doe"
                        value={username}
                        autoComplete="username"
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                    <div className="ig-reg-field">
                      <label htmlFor="ig-reg-email">Email</label>
                      <input
                        id="ig-reg-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        autoComplete="email"
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="ig-reg-field">
                    <label htmlFor="ig-reg-password">Password</label>
                    <input
                      id="ig-reg-password"
                      type="password"
                      placeholder="Min. 6 characters"
                      value={password}
                      autoComplete="new-password"
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    {password.length > 0 && (
                      <div className="ig-reg-strength">
                        {[1, 2, 3, 4].map((seg) => (
                          <div
                            key={seg}
                            className={`ig-reg-strength-seg ${seg <= strength ? strengthClass[strength] : ""}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div className="ig-reg-field">
                    <label htmlFor="ig-reg-confirm">Confirm Password</label>
                    <input
                      id="ig-reg-confirm"
                      type="password"
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      autoComplete="new-password"
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    {passwordsMatch && (
                      <p className="ig-reg-match ok">✓ Passwords match</p>
                    )}
                    {passwordsMismatch && (
                      <p className="ig-reg-match bad">
                        ✗ Passwords don't match
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Submit */}
              <motion.div variants={fade(3)} initial="hidden" animate="visible">
                <button
                  type="submit"
                  className="ig-reg-btn"
                  disabled={!canSubmit}
                >
                  {loading ? (
                    <CircularProgress
                      size={18}
                      thickness={4}
                      sx={{ color: "#fff" }}
                    />
                  ) : (
                    <>
                      Create account{" "}
                      <span style={{ fontSize: 16, opacity: 0.75 }}>→</span>
                    </>
                  )}
                </button>
              </motion.div>
            </form>

            {/* Terms */}
            <motion.div variants={fade(4)} initial="hidden" animate="visible">
              <p className="ig-reg-terms">
                By signing up you agree to our{" "}
                <a href="/terms">Terms of Service</a> and{" "}
                <a href="/privacy">Privacy Policy</a>.
              </p>
            </motion.div>

            {/* Divider */}
            <motion.div variants={fade(5)} initial="hidden" animate="visible">
              <div className="ig-reg-divider">
                <div className="ig-reg-divider-line" />
                <span className="ig-reg-divider-text">Have an account?</span>
                <div className="ig-reg-divider-line" />
              </div>
            </motion.div>

            {/* Footer */}
            <motion.div variants={fade(6)} initial="hidden" animate="visible">
              <div className="ig-reg-footer">
                <a href="/login">Sign in instead</a>
                <span style={{ margin: "0 10px", opacity: 0.25 }}>·</span>
                <a href="/about" className="ig-reg-about">
                  About Ripple
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RegisterPage;
