import React, { useState, useEffect, useRef } from "react";
import { CircularProgress } from "@mui/material";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { loginUser, trackTraffic } from "../services/api";
import { useNavigate } from "react-router-dom";
import { useGlobalStore } from "../store/store";
import socket from "../services/socket";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import LineWaves from "../component/LineWaves/LineWaves";

// ─── Minimal CSS injected once ────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&display=swap');

  .rpl-root * { box-sizing: border-box; margin: 0; padding: 0; }

  .rpl-root {
    font-family: 'DM Sans', sans-serif;
    width: 100%;
    height: 100dvh;
    position: relative;
    overflow: hidden;
    background: #080810;
  }

  .rpl-bg {
    position: absolute;
    inset: 0;
    z-index: 0;
  }

  /* Subtle radial vignette over the wave bg */
  .rpl-vignette {
    position: absolute;
    inset: 0;
    z-index: 1;
    background: radial-gradient(ellipse 80% 70% at 50% 50%, transparent 30%, #080810 100%);
    pointer-events: none;
  }

  .rpl-center {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 24px;
  }

  /* ── Card ──────────────────────────────────────── */
  .rpl-card {
    width: 100%;
    max-width: 400px;
    background: rgba(12, 12, 22, 0.72);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 28px;
    padding: 48px 44px 40px;
    position: relative;
    overflow: hidden;
    -webkit-backdrop-filter: blur(28px);
    backdrop-filter: blur(28px);
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.04) inset,
      0 32px 80px rgba(0,0,0,0.6),
      0 0 60px rgba(111,76,255,0.06);
  }

  /* Top shimmer line */
  .rpl-card::before {
    content: '';
    position: absolute;
    top: 0; left: 16px; right: 16px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
  }

  /* ── Wordmark ──────────────────────────────────── */
  .rpl-wordmark {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 32px;
  }

  .rpl-wordmark-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, #7B5FFF 0%, #E040FB 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 4px 16px rgba(123, 95, 255, 0.35);
  }

  .rpl-wordmark-icon svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: #fff;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .rpl-wordmark-name {
    font-family: 'Instrument Serif', serif;
    font-size: 22px;
    color: #fff;
    letter-spacing: -0.3px;
  }

  /* ── Headline ──────────────────────────────────── */
  .rpl-headline {
    font-family: 'Instrument Serif', serif;
    font-size: 32px;
    color: #fff;
    line-height: 1.15;
    letter-spacing: -0.5px;
    margin-bottom: 8px;
  }

  .rpl-headline em {
    font-style: italic;
    background: linear-gradient(90deg, #A78BFA, #F472B6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .rpl-subline {
    font-size: 14px;
    color: rgba(255,255,255,0.42);
    font-weight: 300;
    margin-bottom: 36px;
    line-height: 1.5;
  }

  /* ── Form Fields ────────────────────────────────── */
  .rpl-field-group {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-bottom: 8px;
  }

  .rpl-field {
    position: relative;
  }

  .rpl-field label {
    display: block;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.35);
    margin-bottom: 6px;
  }

  .rpl-field input {
    width: 100%;
    height: 48px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 0 16px;
    font-size: 15px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 400;
    color: #fff;
    outline: none;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
    -webkit-appearance: none;
  }

  .rpl-field input::placeholder {
    color: rgba(255,255,255,0.2);
  }

  .rpl-field input:hover {
    border-color: rgba(255,255,255,0.14);
    background: rgba(255,255,255,0.07);
  }

  .rpl-field input:focus {
    border-color: rgba(167,139,250,0.5);
    background: rgba(167,139,250,0.06);
    box-shadow: 0 0 0 3px rgba(167,139,250,0.1);
  }

  /* ── Forgot + Submit row ────────────────────────── */
  .rpl-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 22px;
    margin-bottom: 22px;
  }

  .rpl-forgot {
    font-size: 13px;
    color: rgba(255,255,255,0.35);
    background: none;
    border: none;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    padding: 0;
    transition: color 0.2s;
  }

  .rpl-forgot:hover {
    color: rgba(167,139,250,0.85);
  }

  /* ── Primary Button ─────────────────────────────── */
  .rpl-btn-primary {
    height: 48px;
    padding: 0 28px;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, #7B5FFF 0%, #C026D3 100%);
    color: #fff;
    font-size: 15px;
    font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 4px 20px rgba(123, 95, 255, 0.35);
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .rpl-btn-primary:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: 0 6px 28px rgba(123, 95, 255, 0.45);
  }

  .rpl-btn-primary:active:not(:disabled) {
    transform: translateY(0);
  }

  .rpl-btn-primary:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* ── Divider ────────────────────────────────────── */
  .rpl-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }

  .rpl-divider-line {
    flex: 1;
    height: 1px;
    background: rgba(255,255,255,0.07);
  }

  .rpl-divider-text {
    font-size: 12px;
    color: rgba(255,255,255,0.25);
    font-weight: 400;
  }

  /* ── Footer ─────────────────────────────────────── */
  .rpl-footer {
    text-align: center;
    font-size: 13.5px;
    color: rgba(255,255,255,0.35);
    margin-top: 24px;
  }

  .rpl-footer a {
    color: rgba(167,139,250,0.9);
    font-weight: 500;
    text-decoration: none;
    transition: color 0.2s;
  }

  .rpl-footer a:hover {
    color: #c4b5fd;
  }

  /* ── Error ──────────────────────────────────────── */
  .rpl-error {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.18);
    border-radius: 10px;
    padding: 12px 14px;
    margin-bottom: 20px;
  }

  .rpl-error-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #f87171;
    flex-shrink: 0;
    margin-top: 5px;
  }

  .rpl-error span {
    font-size: 13px;
    color: #fca5a5;
    line-height: 1.5;
  }

  @media (max-width: 440px) {
    .rpl-card {
      padding: 36px 28px 32px;
      border-radius: 24px;
    }
    .rpl-headline { font-size: 27px; }
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

    // Inject styles once
    useEffect(() => {
        const id = "rpl-styles";
        if (!document.getElementById(id)) {
            const el = document.createElement("style");
            el.id = id;
            el.textContent = styles;
            document.head.appendChild(el);
        }
        setMounted(true);
    }, []);

    // Traffic tracking
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

    const containerVariants = {
        hidden: { opacity: 0, y: 24, scale: 0.97 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
        },
    };

    const stagger = (i: number) => ({
        hidden: { opacity: 0, y: 12 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { delay: 0.1 + i * 0.07, duration: 0.4, ease: "easeOut" },
        },
    });

    return (
        <GoogleOAuthProvider clientId="702353220748-2lmc03lb4tcfnuqds67h8bbupmb1aa0q.apps.googleusercontent.com">
            <div className="rpl-root">
                {/* Animated background */}
                <div className="rpl-bg">
                    <LineWaves
                        speed={0.3}
                        innerLineCount={28}
                        outerLineCount={32}
                        warpIntensity={0.8}
                        rotation={-40}
                        edgeFadeWidth={0}
                        colorCycleSpeed={0.8}
                        brightness={0.15}
                        color1="#7B5FFF"
                        color2="#C026D3"
                        color3="#ffffff"
                        enableMouseInteraction
                        mouseInfluence={1.5}
                    />
                </div>
                <div className="rpl-vignette" />

                {/* Centered card */}
                <div className="rpl-center">
                    <AnimatePresence>
                        {mounted && (
                            <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ width: "100%", maxWidth: 400 }}>
                                <div className="rpl-card">
                                    {/* Wordmark */}
                                    <motion.div variants={stagger(0)} initial="hidden" animate="visible">
                                        <div className="rpl-wordmark">
                                            <div className="rpl-wordmark-icon">
                                                {/* Ripple / wave icon */}
                                                <svg viewBox="0 0 24 24">
                                                    <path d="M2 12c2-4 4-6 6-6s4 4 8 4 4-6 6-6" />
                                                </svg>
                                            </div>
                                            <span className="rpl-wordmark-name">Ripple</span>
                                        </div>
                                    </motion.div>

                                    {/* Headline */}
                                    <motion.div variants={stagger(1)} initial="hidden" animate="visible">
                                        <h1 className="rpl-headline">
                                            Good to see you
                                            <br />
                                            <em>again.</em>
                                        </h1>
                                        <p className="rpl-subline">Sign in to pick up where you left off.</p>
                                    </motion.div>

                                    {/* Error */}
                                    <AnimatePresence>
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                                animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
                                                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                                transition={{ duration: 0.25 }}
                                            >
                                                <div className="rpl-error">
                                                    <div className="rpl-error-dot" />
                                                    <span>{error}</span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Form */}
                                    <form onSubmit={handleLogin} noValidate>
                                        <motion.div variants={stagger(3)} initial="hidden" animate="visible">
                                            <div className="rpl-field-group">
                                                <div className="rpl-field">
                                                    <label htmlFor="rpl-email">Email</label>
                                                    <input
                                                        id="rpl-email"
                                                        type="email"
                                                        placeholder="you@example.com"
                                                        value={email}
                                                        autoComplete="email"
                                                        onChange={(e) => setEmail(e.target.value)}
                                                    />
                                                </div>
                                                <div className="rpl-field">
                                                    <label htmlFor="rpl-password">Password</label>
                                                    <input
                                                        id="rpl-password"
                                                        type="password"
                                                        placeholder="••••••••"
                                                        value={password}
                                                        autoComplete="current-password"
                                                        onChange={(e) => setPassword(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>

                                        <motion.div variants={stagger(4)} initial="hidden" animate="visible">
                                            <div className="rpl-actions">
                                                <button type="button" className="rpl-forgot" onClick={() => navigate("/reset-password")}>
                                                    Forgot password?
                                                </button>
                                                <button type="submit" className="rpl-btn-primary" disabled={loading || !email || !password}>
                                                    {loading ? (
                                                        <CircularProgress size={18} thickness={4} sx={{ color: "#fff" }} />
                                                    ) : (
                                                        <>
                                                            Sign in <span style={{ opacity: 0.7, fontSize: 17, marginLeft: 2 }}>→</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </motion.div>
                                    </form>

                                    {/* Divider */}
                                    <motion.div variants={stagger(5)} initial="hidden" animate="visible">
                                        <div className="rpl-divider">
                                            <div className="rpl-divider-line" />
                                            <span className="rpl-divider-text">New to Ripple?</span>
                                            <div className="rpl-divider-line" />
                                        </div>
                                    </motion.div>

                                    {/* Sign up footer */}
                                    <motion.div variants={stagger(6)} initial="hidden" animate="visible">
                                        <div className="rpl-footer">
                                            <a href="/register">Create an account</a>
                                            <span style={{ margin: "0 8px", opacity: 0.25 }}>·</span>
                                            <a href="/about" style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>
                                                About Ripple
                                            </a>
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </GoogleOAuthProvider>
    );
};

export default LoginPage;
