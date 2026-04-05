import React, { useState, useEffect, useRef } from "react";
import { CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { generatePasswordResetOTP, ResetPassword, verifyPasswordResetOTP } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import LineWaves from "../component/LineWaves/LineWaves";

// ─── Styles (shared with LoginPage — inject once via id) ──────────────────────
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

  .rpl-bg { position: absolute; inset: 0; z-index: 0; }

  .rpl-vignette {
    position: absolute; inset: 0; z-index: 1; pointer-events: none;
    background: radial-gradient(ellipse 80% 70% at 50% 50%, transparent 30%, #080810 100%);
  }

  .rpl-center {
    position: relative; z-index: 2;
    display: flex; align-items: center; justify-content: center;
    height: 100%; padding: 24px;
  }

  .rpl-card {
    width: 100%; max-width: 400px;
    background: rgba(12, 12, 22, 0.72);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 28px;
    padding: 44px 40px 36px;
    position: relative; overflow: hidden;
    -webkit-backdrop-filter: blur(28px);
    backdrop-filter: blur(28px);
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.04) inset,
      0 32px 80px rgba(0,0,0,0.6),
      0 0 60px rgba(111,76,255,0.06);
  }

  .rpl-card::before {
    content: ''; position: absolute;
    top: 0; left: 16px; right: 16px; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
  }

  /* ── Wordmark ── */
  .rpl-wordmark { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }

  .rpl-wordmark-icon {
    width: 36px; height: 36px; border-radius: 10px;
    background: linear-gradient(135deg, #7B5FFF, #E040FB);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; box-shadow: 0 4px 16px rgba(123,95,255,0.4);
  }

  .rpl-wordmark-icon svg { width: 18px; height: 18px; }
  .rpl-wordmark-name { font-family: 'Instrument Serif', serif; font-size: 21px; color: #fff; letter-spacing: -0.3px; }

  /* ── Step header ── */
  .rpl-step-icon {
    width: 48px; height: 48px; border-radius: 14px;
    background: rgba(123,95,255,0.12);
    border: 1px solid rgba(123,95,255,0.2);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 20px;
  }

  .rpl-step-icon svg { width: 22px; height: 22px; }

  .rpl-headline {
    font-family: 'Instrument Serif', serif;
    font-size: 28px; color: #fff; line-height: 1.2;
    letter-spacing: -0.4px; margin-bottom: 7px;
  }

  .rpl-headline em {
    font-style: italic;
    background: linear-gradient(90deg, #A78BFA, #F472B6);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }

  .rpl-subline {
    font-size: 13.5px; color: rgba(255,255,255,0.38);
    font-weight: 300; margin-bottom: 30px; line-height: 1.6;
  }

  .rpl-subline strong { color: rgba(255,255,255,0.65); font-weight: 500; }

  /* ── Progress bar ── */
  .rpl-progress {
    display: flex; gap: 6px; margin-bottom: 32px;
  }

  .rpl-prog-step {
    flex: 1; height: 3px; border-radius: 99px;
    background: rgba(255,255,255,0.08);
    transition: background 0.4s ease;
  }

  .rpl-prog-step.active { background: linear-gradient(90deg, #7B5FFF, #C026D3); }
  .rpl-prog-step.done   { background: rgba(123,95,255,0.4); }

  /* ── Fields ── */
  .rpl-field-group { display: flex; flex-direction: column; gap: 14px; margin-bottom: 8px; }

  .rpl-field label {
    display: block; font-size: 10.5px; font-weight: 500;
    letter-spacing: 0.8px; text-transform: uppercase;
    color: rgba(255,255,255,0.32); margin-bottom: 6px;
  }

  .rpl-field input {
    width: 100%; height: 46px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 12px; padding: 0 15px;
    font-size: 14.5px; font-family: 'DM Sans', sans-serif;
    color: #fff; outline: none;
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

  /* ── OTP grid ── */
  .rpl-otp-grid {
    display: flex; gap: 10px; justify-content: center;
    margin-bottom: 28px;
  }

  .rpl-otp-input {
    width: 46px; height: 54px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    font-size: 22px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    color: #fff; text-align: center;
    outline: none; caret-color: #A78BFA;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
    -webkit-appearance: none;
  }

  .rpl-otp-input:focus {
    border-color: rgba(167,139,250,0.6);
    background: rgba(167,139,250,0.08);
    box-shadow: 0 0 0 3px rgba(167,139,250,0.12);
  }

  .rpl-otp-input.filled {
    border-color: rgba(167,139,250,0.35);
    background: rgba(167,139,250,0.06);
  }

  /* ── Buttons ── */
  .rpl-btn-primary {
    width: 100%; height: 48px;
    border-radius: 12px; border: none;
    background: linear-gradient(135deg, #7B5FFF 0%, #C026D3 100%);
    color: #fff; font-size: 14.5px; font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; margin-top: 20px;
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 4px 20px rgba(123,95,255,0.35);
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }

  .rpl-btn-primary:hover:not(:disabled) {
    opacity: 0.9; transform: translateY(-1px);
    box-shadow: 0 6px 28px rgba(123,95,255,0.45);
  }

  .rpl-btn-primary:active:not(:disabled) { transform: translateY(0); }

  .rpl-btn-primary:disabled {
    opacity: 0.32; cursor: not-allowed;
    transform: none; box-shadow: none;
  }

  /* ── Success state ── */
  .rpl-success {
    display: flex; flex-direction: column;
    align-items: center; text-align: center; padding: 8px 0 4px;
  }

  .rpl-success-ring {
    width: 64px; height: 64px; border-radius: 50%;
    background: rgba(52,211,153,0.1);
    border: 1px solid rgba(52,211,153,0.25);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 20px;
    animation: popIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
  }

  .rpl-success-ring svg { width: 28px; height: 28px; }

  @keyframes popIn {
    from { transform: scale(0.6); opacity: 0; }
    to   { transform: scale(1); opacity: 1; }
  }

  /* ── Error ── */
  .rpl-error {
    display: flex; align-items: flex-start; gap: 10px;
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.18);
    border-radius: 10px; padding: 12px 14px; margin-bottom: 20px;
  }

  .rpl-error-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #f87171; flex-shrink: 0; margin-top: 5px;
  }

  .rpl-error span { font-size: 13px; color: #fca5a5; line-height: 1.5; }

  /* ── Footer ── */
  .rpl-footer {
    text-align: center; font-size: 13px;
    color: rgba(255,255,255,0.32); margin-top: 24px;
  }

  .rpl-footer a {
    color: rgba(167,139,250,0.9); font-weight: 500;
    text-decoration: none; transition: color 0.2s;
  }

  .rpl-footer a:hover { color: #c4b5fd; }

  @media (max-width: 440px) {
    .rpl-card { padding: 36px 24px 32px; border-radius: 24px; }
    .rpl-headline { font-size: 25px; }
    .rpl-otp-input { width: 40px; height: 48px; font-size: 18px; }
  }
`;

// ─── Step config ──────────────────────────────────────────────────────────────
type Step = "email" | "otp" | "reset" | "success";

const stepIndex: Record<Step, number> = { email: 0, otp: 1, reset: 2, success: 3 };

// ─── Component ────────────────────────────────────────────────────────────────
const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [step, setStep] = useState<Step>("email");
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const navigate = useNavigate();

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

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleEmailSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const response = await generatePasswordResetOTP(email);
            if (response.success) {
                setStep("otp");
            } else {
                setError(response.error || "Failed to send OTP!");
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to send OTP!");
        } finally {
            setLoading(false);
        }
    };

    const handleOTPChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const next = [...otp];
        next[index] = value.slice(-1);
        setOtp(next);
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleOTPKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleOTPPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const paste = e.clipboardData.getData("text").trim();
        if (/^\d{6}$/.test(paste)) {
            const digits = paste.split("");
            setOtp(digits);
            inputRefs.current[5]?.focus();
        }
    };

    const handleOTPVerify = async () => {
        const fullOTP = otp.join("");
        if (fullOTP.length < 6) {
            setError("Please enter the full 6-digit code.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await verifyPasswordResetOTP(email, fullOTP);
            if (response.success) {
                setStep("reset");
            } else {
                setError(response.error || "Invalid code. Please try again.");
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "Verification failed.");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        setError(null);
        if (!newPassword || !confirmPassword) {
            setError("Please fill in both fields.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        setLoading(true);
        try {
            const response = await ResetPassword(email, otp.join(""), newPassword);
            if (response.success) {
                setStep("success");
                setTimeout(() => navigate("/login", { state: { resetSuccess: true } }), 2500);
            } else {
                setError(response.error || "Password reset failed.");
            }
        } catch (err: any) {
            setError(err.message || "Password reset failed.");
        } finally {
            setLoading(false);
        }
    };

    // ── Animations ────────────────────────────────────────────────────────────
    const cardVariants = {
        hidden: { opacity: 0, y: 24, scale: 0.97 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
    };

    const stepVariants = {
        enter: { opacity: 0, x: 20 },
        center: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" } },
        exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
    };

    const s = (i: number) => ({
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { delay: 0.08 + i * 0.06, duration: 0.35, ease: "easeOut" } },
    });

    const currentIdx = stepIndex[step];

    return (
        <div className="rpl-root">
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
                        <motion.div variants={cardVariants} initial="hidden" animate="visible" style={{ width: "100%", maxWidth: 400 }}>
                            <div className="rpl-card">
                                {/* Wordmark */}
                                <motion.div variants={s(0)} initial="hidden" animate="visible">
                                    <div className="rpl-wordmark">
                                        <div className="rpl-wordmark-icon">
                                            <svg
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="white"
                                                strokeWidth="2.2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M2 12 C4 7 6 5 9 5 S13 9 16 9 S20 5 22 5" />
                                            </svg>
                                        </div>
                                        <span className="rpl-wordmark-name">Ripple</span>
                                    </div>
                                </motion.div>

                                {/* Progress steps */}
                                <motion.div variants={s(1)} initial="hidden" animate="visible">
                                    <div className="rpl-progress">
                                        {["email", "otp", "reset"].map((s, i) => (
                                            <div key={s} className={`rpl-prog-step ${i < currentIdx ? "done" : i === currentIdx ? "active" : ""}`} />
                                        ))}
                                    </div>
                                </motion.div>

                                {/* Error */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.22 }}
                                        >
                                            <div className="rpl-error">
                                                <div className="rpl-error-dot" />
                                                <span>{error}</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* ── STEP: EMAIL ── */}
                                <AnimatePresence mode="wait">
                                    {step === "email" && (
                                        <motion.div key="email" variants={stepVariants} initial="enter" animate="center" exit="exit">
                                            <div className="rpl-step-icon">
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="#A78BFA"
                                                    strokeWidth="1.8"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <rect x="2" y="4" width="20" height="16" rx="3" />
                                                    <path d="M2 8l10 6 10-6" />
                                                </svg>
                                            </div>
                                            <h1 className="rpl-headline">
                                                Forgot your
                                                <br />
                                                <em>password?</em>
                                            </h1>
                                            <p className="rpl-subline">Enter your email and we'll send you a verification code.</p>

                                            <form onSubmit={handleEmailSend} noValidate>
                                                <div className="rpl-field-group">
                                                    <div className="rpl-field">
                                                        <label htmlFor="fp-email">Email address</label>
                                                        <input
                                                            id="fp-email"
                                                            type="email"
                                                            placeholder="you@example.com"
                                                            value={email}
                                                            autoComplete="email"
                                                            onChange={(e) => setEmail(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <button type="submit" className="rpl-btn-primary" disabled={loading || !email}>
                                                    {loading ? (
                                                        <CircularProgress size={18} thickness={4} sx={{ color: "#fff" }} />
                                                    ) : (
                                                        <>
                                                            Send code <span style={{ opacity: 0.7, fontSize: 17 }}>→</span>
                                                        </>
                                                    )}
                                                </button>
                                            </form>
                                        </motion.div>
                                    )}

                                    {/* ── STEP: OTP ── */}
                                    {step === "otp" && (
                                        <motion.div key="otp" variants={stepVariants} initial="enter" animate="center" exit="exit">
                                            <div className="rpl-step-icon">
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="#A78BFA"
                                                    strokeWidth="1.8"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <rect x="5" y="11" width="14" height="10" rx="2" />
                                                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                                                </svg>
                                            </div>
                                            <h1 className="rpl-headline">
                                                Check your
                                                <br />
                                                <em>inbox.</em>
                                            </h1>
                                            <p className="rpl-subline">
                                                We sent a 6-digit code to
                                                <br />
                                                <strong>{email}</strong>
                                            </p>

                                            <div className="rpl-otp-grid">
                                                {otp.map((digit, i) => (
                                                    <input
                                                        key={i}
                                                        ref={(el) => (inputRefs.current[i] = el)}
                                                        className={`rpl-otp-input${digit ? " filled" : ""}`}
                                                        type="text"
                                                        inputMode="numeric"
                                                        maxLength={1}
                                                        value={digit}
                                                        onChange={(e) => handleOTPChange(i, e.target.value)}
                                                        onKeyDown={(e) => handleOTPKeyDown(i, e)}
                                                        onPaste={i === 0 ? handleOTPPaste : undefined}
                                                    />
                                                ))}
                                            </div>

                                            <button
                                                className="rpl-btn-primary"
                                                style={{ marginTop: 0 }}
                                                disabled={loading || otp.join("").length < 6}
                                                onClick={handleOTPVerify}
                                            >
                                                {loading ? (
                                                    <CircularProgress size={18} thickness={4} sx={{ color: "#fff" }} />
                                                ) : (
                                                    <>
                                                        Verify code <span style={{ opacity: 0.7, fontSize: 17 }}>→</span>
                                                    </>
                                                )}
                                            </button>

                                            <div style={{ textAlign: "center", marginTop: 16 }}>
                                                <button
                                                    style={{
                                                        background: "none",
                                                        border: "none",
                                                        cursor: "pointer",
                                                        fontSize: 13,
                                                        color: "rgba(255,255,255,0.3)",
                                                        fontFamily: "'DM Sans', sans-serif",
                                                        padding: 0,
                                                        transition: "color 0.2s",
                                                    }}
                                                    onClick={() => {
                                                        setStep("email");
                                                        setOtp(Array(6).fill(""));
                                                        setError(null);
                                                    }}
                                                    onMouseOver={(e) => (e.currentTarget.style.color = "rgba(167,139,250,0.8)")}
                                                    onMouseOut={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                                                >
                                                    ← Change email
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* ── STEP: RESET ── */}
                                    {step === "reset" && (
                                        <motion.div key="reset" variants={stepVariants} initial="enter" animate="center" exit="exit">
                                            <div className="rpl-step-icon">
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="#A78BFA"
                                                    strokeWidth="1.8"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                                </svg>
                                            </div>
                                            <h1 className="rpl-headline">
                                                Set a new
                                                <br />
                                                <em>password.</em>
                                            </h1>
                                            <p className="rpl-subline">Choose something strong. At least 6 characters.</p>

                                            <div className="rpl-field-group">
                                                <div className="rpl-field">
                                                    <label htmlFor="fp-newpw">New password</label>
                                                    <input
                                                        id="fp-newpw"
                                                        type="password"
                                                        placeholder="••••••••"
                                                        value={newPassword}
                                                        autoComplete="new-password"
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                    />
                                                </div>
                                                <div className="rpl-field">
                                                    <label htmlFor="fp-confirmpw">Confirm password</label>
                                                    <input
                                                        id="fp-confirmpw"
                                                        type="password"
                                                        placeholder="••••••••"
                                                        value={confirmPassword}
                                                        autoComplete="new-password"
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                className="rpl-btn-primary"
                                                disabled={loading || !newPassword || !confirmPassword}
                                                onClick={handlePasswordReset}
                                            >
                                                {loading ? (
                                                    <CircularProgress size={18} thickness={4} sx={{ color: "#fff" }} />
                                                ) : (
                                                    <>
                                                        Reset password <span style={{ opacity: 0.7, fontSize: 17 }}>→</span>
                                                    </>
                                                )}
                                            </button>
                                        </motion.div>
                                    )}

                                    {/* ── STEP: SUCCESS ── */}
                                    {step === "success" && (
                                        <motion.div key="success" variants={stepVariants} initial="enter" animate="center" exit="exit">
                                            <div className="rpl-success">
                                                <div className="rpl-success-ring">
                                                    <svg
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="#34d399"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <path d="M20 6L9 17l-5-5" />
                                                    </svg>
                                                </div>
                                                <h1 className="rpl-headline" style={{ marginBottom: 10 }}>
                                                    All <em>done!</em>
                                                </h1>
                                                <p className="rpl-subline" style={{ marginBottom: 0 }}>
                                                    Your password has been reset.
                                                    <br />
                                                    Redirecting you to sign in…
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Footer */}
                                {step !== "success" && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                                        <div className="rpl-footer">
                                            Remember it? <a href="/login">Back to sign in</a>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
