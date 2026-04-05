import React, { useState, useEffect, useRef } from "react";
import { CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  generatePasswordResetOTP,
  ResetPassword,
  verifyPasswordResetOTP,
} from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "../static/logo-transparent.png";

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Figtree:wght@300;400;500;600&display=swap');

  .ig-fp-root * { box-sizing: border-box; margin: 0; padding: 0; }

  .ig-fp-root {
    font-family: 'Figtree', sans-serif;
    width: 100%;
    min-height: 100dvh;
    display: flex;
    overflow: hidden;
    background: #0e0a08;
  }

  /* ── Left visual panel ───────────────────────────── */
  .ig-fp-visual {
    flex: 1;
    position: relative;
    overflow: hidden;
    display: none;
  }

  @media (min-width: 860px) {
    .ig-fp-visual { display: block; }
  }

  .ig-fp-visual-bg {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 55% at 20% 60%, rgba(255,177,100,0.38) 0%, transparent 65%),
      radial-gradient(ellipse 55% 60% at 75% 30%, rgba(234,100,120,0.32) 0%, transparent 65%),
      radial-gradient(ellipse 65% 50% at 50% 50%, rgba(255,130,80,0.16) 0%, transparent 60%),
      linear-gradient(160deg, #1a0f08 0%, #2a1510 40%, #1e0d14 100%);
  }

  .ig-fp-photo-grid {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr 1fr;
    gap: 10px;
    padding: 32px;
    opacity: 0.48;
  }

  .ig-fp-photo-card {
    border-radius: 16px;
    overflow: hidden;
    position: relative;
  }

  .ig-fp-photo-card:nth-child(1) { background: linear-gradient(135deg, #e8a87c, #c4644a); }
  .ig-fp-photo-card:nth-child(2) { background: linear-gradient(135deg, #c87b8a, #a05070); grid-row: 1 / 3; }
  .ig-fp-photo-card:nth-child(3) { background: linear-gradient(135deg, #f5c07a, #e8866a); grid-row: 2 / 4; }
  .ig-fp-photo-card:nth-child(4) { background: linear-gradient(135deg, #d4756b, #b5506a); }
  .ig-fp-photo-card:nth-child(5) { background: linear-gradient(135deg, #f0956a, #d4557a); }

  .ig-fp-photo-card::after {
    content: '';
    position: absolute;
    inset: 0;
    background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E");
    opacity: 0.3;
    mix-blend-mode: overlay;
  }

  .ig-fp-visual-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent 55%, #0e0a08 100%);
  }

  .ig-fp-visual-brand {
    position: absolute;
    bottom: 48px;
    left: 44px;
    right: 44px;
  }

  .ig-fp-visual-tagline {
    font-family: 'Fraunces', serif;
    font-size: 38px;
    font-weight: 300;
    line-height: 1.15;
    color: rgba(255,255,255,0.92);
    letter-spacing: -0.5px;
    text-shadow: 0 2px 20px rgba(0,0,0,0.4);
  }

  .ig-fp-visual-tagline em {
    font-style: italic;
    color: #f4a96a;
  }

  .ig-fp-visual-sub {
    margin-top: 10px;
    font-size: 15px;
    font-weight: 300;
    color: rgba(255,255,255,0.4);
  }

  /* ── Right form panel ────────────────────────────── */
  .ig-fp-panel {
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
    .ig-fp-panel { width: 460px; flex-shrink: 0; }
  }

  @media (max-width: 520px) {
    .ig-fp-panel { padding: 40px 28px; }
  }

  .ig-fp-panel::before {
    content: '';
    position: absolute;
    top: -80px; right: -80px;
    width: 320px; height: 320px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(234,100,80,0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  /* ── Logo ────────────────────────────────────────── */
  .ig-fp-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 44px;
  }

  .ig-fp-logo-mark {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .ig-fp-logo-mark img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .ig-fp-logo-name {
    font-family: 'Fraunces', serif;
    font-size: 24px;
    font-weight: 400;
    color: #fff;
    letter-spacing: -0.3px;
  }

  /* ── Progress bar ────────────────────────────────── */
  .ig-fp-progress {
    display: flex;
    gap: 6px;
    margin-bottom: 36px;
  }

  .ig-fp-prog-step {
    flex: 1; height: 3px; border-radius: 99px;
    background: rgba(255,255,255,0.07);
    transition: background 0.4s ease;
  }

  .ig-fp-prog-step.active { background: linear-gradient(90deg, #f4a96a, #e05c7e); }
  .ig-fp-prog-step.done   { background: rgba(244,169,106,0.35); }

  /* ── Step icon badge ─────────────────────────────── */
  .ig-fp-step-icon {
    width: 48px; height: 48px; border-radius: 14px;
    background: rgba(244,169,106,0.1);
    border: 1px solid rgba(244,169,106,0.2);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 20px;
  }

  .ig-fp-step-icon svg {
    width: 22px; height: 22px;
    fill: none; stroke: #f4a96a;
    stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round;
  }

  /* ── Greeting / headline ─────────────────────────── */
  .ig-fp-greeting {
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #e07a60;
    margin-bottom: 6px;
  }

  .ig-fp-headline {
    font-family: 'Fraunces', serif;
    font-size: 32px;
    font-weight: 300;
    color: #fff;
    line-height: 1.15;
    letter-spacing: -0.5px;
    margin-bottom: 10px;
  }

  .ig-fp-headline em {
    font-style: italic;
    color: #f5b88a;
  }

  .ig-fp-subtext {
    font-size: 14px;
    color: rgba(255,255,255,0.36);
    font-weight: 300;
    line-height: 1.6;
    margin-bottom: 32px;
  }

  .ig-fp-subtext strong {
    color: rgba(255,255,255,0.62);
    font-weight: 500;
  }

  /* ── Fields ──────────────────────────────────────── */
  .ig-fp-fields {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 4px;
  }

  .ig-fp-field label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.3);
    margin-bottom: 8px;
  }

  .ig-fp-field input {
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

  .ig-fp-field input::placeholder { color: rgba(255,255,255,0.18); }

  .ig-fp-field input:hover {
    border-color: rgba(244,169,106,0.25);
    background: rgba(255,255,255,0.06);
  }

  .ig-fp-field input:focus {
    border-color: rgba(244,169,106,0.55);
    background: rgba(244,169,106,0.05);
    box-shadow: 0 0 0 4px rgba(244,169,106,0.08);
  }

  /* ── OTP grid ────────────────────────────────────── */
  .ig-fp-otp-grid {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-bottom: 28px;
  }

  .ig-fp-otp-input {
    width: 48px; height: 56px;
    background: rgba(255,255,255,0.04);
    border: 1.5px solid rgba(255,255,255,0.09);
    border-radius: 14px;
    font-size: 22px; font-weight: 600;
    font-family: 'Figtree', sans-serif;
    color: #fff; text-align: center;
    outline: none; caret-color: #f4a96a;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
    -webkit-appearance: none;
  }

  .ig-fp-otp-input:focus {
    border-color: rgba(244,169,106,0.6);
    background: rgba(244,169,106,0.06);
    box-shadow: 0 0 0 4px rgba(244,169,106,0.1);
  }

  .ig-fp-otp-input.filled {
    border-color: rgba(244,169,106,0.35);
    background: rgba(244,169,106,0.05);
  }

  /* ── CTA button ──────────────────────────────────── */
  .ig-fp-btn {
    width: 100%;
    height: 52px;
    margin-top: 20px;
    border-radius: 14px;
    border: none;
    background: linear-gradient(135deg, #f4a96a 0%, #e05c7e 100%);
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    font-family: 'Figtree', sans-serif;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 6px 28px rgba(224,92,126,0.35);
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
  }

  .ig-fp-btn:hover:not(:disabled) {
    opacity: 0.92;
    transform: translateY(-1px);
    box-shadow: 0 10px 36px rgba(224,92,126,0.45);
  }

  .ig-fp-btn:active:not(:disabled) { transform: translateY(0); }

  .ig-fp-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* ── Error ───────────────────────────────────────── */
  .ig-fp-error {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: rgba(220,80,80,0.08);
    border: 1px solid rgba(220,80,80,0.2);
    border-radius: 12px;
    padding: 12px 16px;
    margin-bottom: 22px;
  }

  .ig-fp-error-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
  .ig-fp-error span { font-size: 13.5px; color: #f9a8a8; line-height: 1.5; }

  /* ── Back link ───────────────────────────────────── */
  .ig-fp-back {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 13px;
    font-family: 'Figtree', sans-serif;
    color: rgba(255,255,255,0.28);
    padding: 0;
    margin-top: 18px;
    display: block;
    width: 100%;
    text-align: center;
    transition: color 0.2s;
  }

  .ig-fp-back:hover { color: #f4a96a; }

  /* ── Success state ───────────────────────────────── */
  .ig-fp-success {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 8px 0 4px;
  }

  .ig-fp-success-ring {
    width: 68px; height: 68px;
    border-radius: 50%;
    background: rgba(52,211,153,0.09);
    border: 1px solid rgba(52,211,153,0.22);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 22px;
    animation: igFpPop 0.5s cubic-bezier(0.22,1,0.36,1) both;
  }

  .ig-fp-success-ring svg {
    width: 28px; height: 28px;
    fill: none; stroke: #34d399;
    stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round;
  }

  @keyframes igFpPop {
    from { transform: scale(0.6); opacity: 0; }
    to   { transform: scale(1); opacity: 1; }
  }

  /* ── Footer ──────────────────────────────────────── */
  .ig-fp-footer {
    text-align: center;
    font-size: 14px;
    color: rgba(255,255,255,0.3);
    font-weight: 300;
    margin-top: 28px;
  }

  .ig-fp-footer a {
    color: #f4a96a;
    font-weight: 500;
    text-decoration: none;
    transition: color 0.2s;
  }

  .ig-fp-footer a:hover { color: #f5c094; }

  @media (max-width: 440px) {
    .ig-fp-otp-input { width: 40px; height: 48px; font-size: 18px; }
    .ig-fp-headline { font-size: 27px; }
  }
`;

// ─── Step config ──────────────────────────────────────────────────────────────
type Step = "email" | "otp" | "reset" | "success";
const stepIndex: Record<Step, number> = {
  email: 0,
  otp: 1,
  reset: 2,
  success: 3,
};

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
    const id = "ig-fp-styles";
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

  const handleOTPKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOTPPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(paste)) {
      setOtp(paste.split(""));
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
        setTimeout(
          () => navigate("/login", { state: { resetSuccess: true } }),
          2500,
        );
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

  const stepVariants = {
    enter: { opacity: 0, x: 20 },
    center: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.35, ease: "easeOut" },
    },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
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

  const currentIdx = stepIndex[step];

  // ── Step label for greeting ────────────────────────────────────────────────
  const greetingLabel: Record<Step, string> = {
    email: "Account recovery",
    otp: "Verification",
    reset: "New password",
    success: "All done",
  };

  return (
    <div className="ig-fp-root">
      {/* ── Left: Visual panel ── */}
      <AnimatePresence>
        {mounted && (
          <motion.div
            className="ig-fp-visual"
            variants={visualVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="ig-fp-visual-bg" />
            <div className="ig-fp-photo-grid">
              <div className="ig-fp-photo-card">
                <img
                  src="https://plus.unsplash.com/premium_photo-1663099908294-e235675ca558?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
              <div className="ig-fp-photo-card">
                <img
                  src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
              <div className="ig-fp-photo-card">
                <img
                  src="https://images.unsplash.com/photo-1475403614135-5f1aa0eb5015?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
              <div className="ig-fp-photo-card">
                <img
                  src="https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
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
            <div className="ig-fp-visual-overlay" />
            <div className="ig-fp-visual-brand">
              <p className="ig-fp-visual-tagline">
                Don't lose
                <br />
                <em>your place.</em>
              </p>
              <p className="ig-fp-visual-sub">We'll get you back in no time.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Right: Form panel ── */}
      <AnimatePresence>
        {mounted && (
          <motion.div
            className="ig-fp-panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Logo */}
            <motion.div variants={fade(0)} initial="hidden" animate="visible">
              <div className="ig-fp-logo">
                <div className="ig-fp-logo-mark">
                  <img src={Logo} alt="Ripple logo" />
                </div>
                <span className="ig-fp-logo-name">Ripple</span>
              </div>
            </motion.div>

            {/* Progress bar */}
            <motion.div variants={fade(1)} initial="hidden" animate="visible">
              <div className="ig-fp-progress">
                {["email", "otp", "reset"].map((s, i) => (
                  <div
                    key={s}
                    className={`ig-fp-prog-step ${i < currentIdx ? "done" : i === currentIdx ? "active" : ""}`}
                  />
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
                  <div className="ig-fp-error">
                    <span className="ig-fp-error-icon">⚠</span>
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── STEP: EMAIL ── */}
            <AnimatePresence mode="wait">
              {step === "email" && (
                <motion.div
                  key="email"
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  <p className="ig-fp-greeting">{greetingLabel.email}</p>
                  <div className="ig-fp-step-icon">
                    <svg viewBox="0 0 24 24">
                      <rect x="2" y="4" width="20" height="16" rx="3" />
                      <path d="M2 8l10 6 10-6" />
                    </svg>
                  </div>
                  <h1 className="ig-fp-headline">
                    Forgot your
                    <br />
                    <em>password?</em>
                  </h1>
                  <p className="ig-fp-subtext">
                    Enter your email and we'll send you a verification code.
                  </p>

                  <form onSubmit={handleEmailSend} noValidate>
                    <div className="ig-fp-fields">
                      <div className="ig-fp-field">
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
                    <button
                      type="submit"
                      className="ig-fp-btn"
                      disabled={loading || !email}
                    >
                      {loading ? (
                        <CircularProgress
                          size={18}
                          thickness={4}
                          sx={{ color: "#fff" }}
                        />
                      ) : (
                        <>
                          Send code{" "}
                          <span style={{ fontSize: 16, opacity: 0.75 }}>→</span>
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ── STEP: OTP ── */}
              {step === "otp" && (
                <motion.div
                  key="otp"
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  <p className="ig-fp-greeting">{greetingLabel.otp}</p>
                  <div className="ig-fp-step-icon">
                    <svg viewBox="0 0 24 24">
                      <rect x="5" y="11" width="14" height="10" rx="2" />
                      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                    </svg>
                  </div>
                  <h1 className="ig-fp-headline">
                    Check your
                    <br />
                    <em>inbox.</em>
                  </h1>
                  <p className="ig-fp-subtext">
                    We sent a 6-digit code to
                    <br />
                    <strong>{email}</strong>
                  </p>

                  <div className="ig-fp-otp-grid">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (inputRefs.current[i] = el)}
                        className={`ig-fp-otp-input${digit ? " filled" : ""}`}
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
                    className="ig-fp-btn"
                    style={{ marginTop: 0 }}
                    disabled={loading || otp.join("").length < 6}
                    onClick={handleOTPVerify}
                  >
                    {loading ? (
                      <CircularProgress
                        size={18}
                        thickness={4}
                        sx={{ color: "#fff" }}
                      />
                    ) : (
                      <>
                        Verify code{" "}
                        <span style={{ fontSize: 16, opacity: 0.75 }}>→</span>
                      </>
                    )}
                  </button>

                  <button
                    className="ig-fp-back"
                    onClick={() => {
                      setStep("email");
                      setOtp(Array(6).fill(""));
                      setError(null);
                    }}
                  >
                    ← Change email
                  </button>
                </motion.div>
              )}

              {/* ── STEP: RESET ── */}
              {step === "reset" && (
                <motion.div
                  key="reset"
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  <p className="ig-fp-greeting">{greetingLabel.reset}</p>
                  <div className="ig-fp-step-icon">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <h1 className="ig-fp-headline">
                    Set a new
                    <br />
                    <em>password.</em>
                  </h1>
                  <p className="ig-fp-subtext">
                    Choose something strong — at least 6 characters.
                  </p>

                  <div className="ig-fp-fields">
                    <div className="ig-fp-field">
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
                    <div className="ig-fp-field">
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
                    className="ig-fp-btn"
                    disabled={loading || !newPassword || !confirmPassword}
                    onClick={handlePasswordReset}
                  >
                    {loading ? (
                      <CircularProgress
                        size={18}
                        thickness={4}
                        sx={{ color: "#fff" }}
                      />
                    ) : (
                      <>
                        Reset password{" "}
                        <span style={{ fontSize: 16, opacity: 0.75 }}>→</span>
                      </>
                    )}
                  </button>
                </motion.div>
              )}

              {/* ── STEP: SUCCESS ── */}
              {step === "success" && (
                <motion.div
                  key="success"
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  <div className="ig-fp-success">
                    <div className="ig-fp-success-ring">
                      <svg viewBox="0 0 24 24">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <h1 className="ig-fp-headline" style={{ marginBottom: 10 }}>
                      All <em>done!</em>
                    </h1>
                    <p className="ig-fp-subtext" style={{ marginBottom: 0 }}>
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
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="ig-fp-footer">
                  Remember it? <a href="/login">Back to sign in</a>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ForgotPasswordPage;
