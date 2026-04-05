import React, { useState, useEffect } from "react";
import { CircularProgress } from "@mui/material";
import { registerUser } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import LineWaves from "../component/LineWaves/LineWaves";

// ─── Styles (same sheet as LoginPage — injected once, shared) ─────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&family=Instrument+Serif:ital@0;1&display=swap');

  .rpl-root * { box-sizing: border-box; margin: 0; padding: 0; }

  .rpl-root {
    font-family: 'DM Sans', sans-serif;
    width: 100%;
    height: 100dvh;
    position: relative;
    overflow: hidden;
    background: #080810;
  }

  .rpl-bg { position: absolute; inset: 0; z-index: 0; }

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
    overflow-y: auto;
  }

  .rpl-card {
    width: 100%;
    max-width: 400px;
    background: rgba(12, 12, 22, 0.72);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 28px;
    padding: 44px 40px 36px;
    position: relative;
    overflow: hidden;
    -webkit-backdrop-filter: blur(28px);
    backdrop-filter: blur(28px);
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.04) inset,
      0 32px 80px rgba(0,0,0,0.6),
      0 0 60px rgba(111,76,255,0.06);
    margin: auto;
  }

  .rpl-card::before {
    content: '';
    position: absolute;
    top: 0; left: 16px; right: 16px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.13), transparent);
  }

  .rpl-wordmark {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 28px;
  }

  .rpl-wordmark-icon {
    width: 36px; height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, #7B5FFF, #E040FB);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 16px rgba(123,95,255,0.4);
    flex-shrink: 0;
  }

  .rpl-wordmark-icon svg {
    width: 18px; height: 18px;
    fill: none; stroke: #fff;
    stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round;
  }

  .rpl-wordmark-name {
    font-family: 'Instrument Serif', serif;
    font-size: 21px;
    color: #fff;
    letter-spacing: -0.3px;
  }

  .rpl-headline {
    font-family: 'Instrument Serif', serif;
    font-size: 31px;
    color: #fff;
    line-height: 1.2;
    letter-spacing: -0.5px;
    margin-bottom: 7px;
  }

  .rpl-headline em {
    font-style: italic;
    background: linear-gradient(90deg, #A78BFA, #F472B6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .rpl-subline {
    font-size: 13.5px;
    color: rgba(255,255,255,0.38);
    font-weight: 300;
    margin-bottom: 28px;
    line-height: 1.5;
  }

  .rpl-field-group {
    display: flex;
    flex-direction: column;
    gap: 13px;
  }

  /* Two-column row for name fields */
  .rpl-field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 13px;
  }

  .rpl-field label {
    display: block;
    font-size: 10.5px;
    font-weight: 500;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.32);
    margin-bottom: 6px;
  }

  .rpl-field input {
    width: 100%;
    height: 46px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 12px;
    padding: 0 15px;
    font-size: 14.5px;
    font-family: 'DM Sans', sans-serif;
    color: #fff;
    outline: none;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
    -webkit-appearance: none;
  }

  .rpl-field input::placeholder { color: rgba(255,255,255,0.2); }

  .rpl-field input:hover {
    border-color: rgba(255,255,255,0.14);
    background: rgba(255,255,255,0.07);
  }

  .rpl-field input:focus {
    border-color: rgba(167,139,250,0.55);
    background: rgba(167,139,250,0.07);
    box-shadow: 0 0 0 3px rgba(167,139,250,0.1);
  }

  /* Password strength bar */
  .rpl-strength {
    margin-top: 6px;
    display: flex;
    gap: 4px;
  }

  .rpl-strength-seg {
    flex: 1;
    height: 3px;
    border-radius: 2px;
    background: rgba(255,255,255,0.08);
    transition: background 0.3s;
  }

  .rpl-strength-seg.weak   { background: #f87171; }
  .rpl-strength-seg.fair   { background: #fbbf24; }
  .rpl-strength-seg.good   { background: #a78bfa; }
  .rpl-strength-seg.strong { background: #34d399; }

  /* Password match indicator */
  .rpl-match {
    font-size: 11px;
    margin-top: 5px;
    transition: color 0.2s;
  }
  .rpl-match.ok  { color: #34d399; }
  .rpl-match.bad { color: #f87171; }

  /* Submit button — full width on register */
  .rpl-btn-primary {
    width: 100%;
    height: 48px;
    margin-top: 22px;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, #7B5FFF 0%, #C026D3 100%);
    color: #fff;
    font-size: 15px;
    font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 4px 20px rgba(123,95,255,0.38);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .rpl-btn-primary:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: 0 6px 28px rgba(123,95,255,0.48);
  }

  .rpl-btn-primary:active:not(:disabled) { transform: translateY(0); }

  .rpl-btn-primary:disabled {
    opacity: 0.32;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* Alerts */
  .rpl-alert {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    border-radius: 10px;
    padding: 12px 14px;
    margin-bottom: 18px;
  }

  .rpl-alert.error {
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.18);
  }

  .rpl-alert.success {
    background: rgba(52,211,153,0.07);
    border: 1px solid rgba(52,211,153,0.18);
  }

  .rpl-alert-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 5px;
  }

  .rpl-alert.error   .rpl-alert-dot { background: #f87171; }
  .rpl-alert.success .rpl-alert-dot { background: #34d399; }

  .rpl-alert.error   span { font-size: 13px; color: #fca5a5; line-height: 1.5; }
  .rpl-alert.success span { font-size: 13px; color: #6ee7b7; line-height: 1.5; }

  /* Divider + Footer */
  .rpl-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 22px 0 18px;
  }

  .rpl-divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.07); }

  .rpl-divider-text {
    font-size: 11.5px;
    color: rgba(255,255,255,0.22);
  }

  .rpl-footer {
    text-align: center;
    font-size: 13px;
    color: rgba(255,255,255,0.32);
  }

  .rpl-footer a {
    color: rgba(167,139,250,0.9);
    font-weight: 500;
    text-decoration: none;
    transition: color 0.2s;
  }

  .rpl-footer a:hover { color: #c4b5fd; }

  /* Terms note */
  .rpl-terms {
    font-size: 11.5px;
    color: rgba(255,255,255,0.22);
    text-align: center;
    margin-top: 14px;
    line-height: 1.6;
  }

  .rpl-terms a {
    color: rgba(167,139,250,0.6);
    text-decoration: none;
  }

  .rpl-terms a:hover { color: rgba(167,139,250,0.9); }

  @media (max-width: 440px) {
    .rpl-card { padding: 36px 28px 32px; border-radius: 24px; }
    .rpl-headline { font-size: 27px; }
    .rpl-field-row { grid-template-columns: 1fr; }
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

const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
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
    const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
    const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

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

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            setError("Only letters, numbers and underscores are allowed in the username.");
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
                setSuccess("Account created! Check your email for a verification link.");
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

    const canSubmit = !loading && !!email && !!username && !!password && !!confirmPassword;

    const containerVariants = {
        hidden: { opacity: 0, y: 24, scale: 0.97 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
    };

    const stagger = (i: number) => ({
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { delay: 0.1 + i * 0.07, duration: 0.4, ease: "easeOut" } },
    });

    return (
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

            <div className="rpl-center">
                <AnimatePresence>
                    {mounted && (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            style={{ width: "100%", maxWidth: 400, padding: "24px 0" }}
                        >
                            <div className="rpl-card">
                                {/* Wordmark */}
                                <motion.div variants={stagger(0)} initial="hidden" animate="visible">
                                    <div className="rpl-wordmark">
                                        <div className="rpl-wordmark-icon">
                                            <svg viewBox="0 0 24 24">
                                                <path d="M2 12 C4 7 6 5 9 5 S13 9 16 9 S20 5 22 5" />
                                            </svg>
                                        </div>
                                        <span className="rpl-wordmark-name">Ripple</span>
                                    </div>
                                </motion.div>

                                {/* Headline */}
                                <motion.div variants={stagger(1)} initial="hidden" animate="visible">
                                    <h1 className="rpl-headline">
                                        Start something
                                        <br />
                                        <em>new.</em>
                                    </h1>
                                    <p className="rpl-subline">Create your account — it only takes a minute.</p>
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
                                            <div className="rpl-alert error">
                                                <div className="rpl-alert-dot" />
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
                                            <div className="rpl-alert success">
                                                <div className="rpl-alert-dot" />
                                                <span>{success}</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Form */}
                                <form onSubmit={handleRegister} noValidate>
                                    <motion.div variants={stagger(2)} initial="hidden" animate="visible">
                                        <div className="rpl-field-group">
                                            {/* Username + Email side by side on wider screens */}
                                            <div className="rpl-field-row">
                                                <div className="rpl-field">
                                                    <label htmlFor="rpl-username">Username</label>
                                                    <input
                                                        id="rpl-username"
                                                        type="text"
                                                        placeholder="john_doe"
                                                        value={username}
                                                        autoComplete="username"
                                                        onChange={(e) => setUsername(e.target.value)}
                                                    />
                                                </div>
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
                                            </div>

                                            {/* Password */}
                                            <div className="rpl-field">
                                                <label htmlFor="rpl-password">Password</label>
                                                <input
                                                    id="rpl-password"
                                                    type="password"
                                                    placeholder="Min. 6 characters"
                                                    value={password}
                                                    autoComplete="new-password"
                                                    onChange={(e) => setPassword(e.target.value)}
                                                />
                                                {/* Strength bar */}
                                                {password.length > 0 && (
                                                    <div className="rpl-strength">
                                                        {[1, 2, 3, 4].map((seg) => (
                                                            <div
                                                                key={seg}
                                                                className={`rpl-strength-seg ${seg <= strength ? strengthClass[strength] : ""}`}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Confirm Password */}
                                            <div className="rpl-field">
                                                <label htmlFor="rpl-confirm">Confirm Password</label>
                                                <input
                                                    id="rpl-confirm"
                                                    type="password"
                                                    placeholder="Re-enter password"
                                                    value={confirmPassword}
                                                    autoComplete="new-password"
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                />
                                                {passwordsMatch && <p className="rpl-match ok">Passwords match</p>}
                                                {passwordsMismatch && <p className="rpl-match bad">Passwords don't match</p>}
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Submit */}
                                    <motion.div variants={stagger(3)} initial="hidden" animate="visible">
                                        <button type="submit" className="rpl-btn-primary" disabled={!canSubmit}>
                                            {loading ? (
                                                <CircularProgress size={18} thickness={4} sx={{ color: "#fff" }} />
                                            ) : (
                                                <>
                                                    Create account <span style={{ opacity: 0.7, fontSize: 17 }}>→</span>
                                                </>
                                            )}
                                        </button>
                                    </motion.div>
                                </form>

                                {/* Terms */}
                                <motion.div variants={stagger(4)} initial="hidden" animate="visible">
                                    <p className="rpl-terms">
                                        By signing up you agree to our <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>
                                        .
                                    </p>
                                </motion.div>

                                {/* Divider */}
                                <motion.div variants={stagger(5)} initial="hidden" animate="visible">
                                    <div className="rpl-divider">
                                        <div className="rpl-divider-line" />
                                        <span className="rpl-divider-text">Have an account?</span>
                                        <div className="rpl-divider-line" />
                                    </div>
                                </motion.div>

                                {/* Footer */}
                                <motion.div variants={stagger(6)} initial="hidden" animate="visible">
                                    <div className="rpl-footer">
                                        <a href="/login">Sign in instead</a>
                                        <span style={{ margin: "0 8px", opacity: 0.22 }}>·</span>
                                        <a href="/about" style={{ color: "rgba(255,255,255,0.28)", fontWeight: 400 }}>
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
    );
};

export default RegisterPage;
