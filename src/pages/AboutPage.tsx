import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Box, Container, Grid } from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import ChatIcon from "@mui/icons-material/Chat";
import BarChartIcon from "@mui/icons-material/BarChart";
import LanguageIcon from "@mui/icons-material/Language";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "../hooks/usePageTitle";
import AuthLanguageSelector from "../component/auth/AuthLanguageSelector";

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,200;0,9..144,300;1,9..144,200;1,9..144,300&family=Inter:wght@300;400;500;600&display=swap');

  html.ab-active, html.ab-active body {
    background: #06040a; margin: 0; padding: 0; scroll-behavior: smooth;
  }
  .ab-root {
    font-family: 'Inter', sans-serif;
    background: #06040a;
    min-height: 100vh;
    color: #fff;
    overflow-x: hidden;
  }
  .ab-root * { box-sizing: border-box; }

  /* ── Floating header ── */
  .ab-header {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 32px;
    pointer-events: none;
  }
  .ab-header > * { pointer-events: auto; }
  .ab-back-btn {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 50px;
    padding: 8px 16px;
    color: rgba(255,255,255,0.55);
    font-size: 13px; font-weight: 500;
    cursor: pointer; text-decoration: none;
    backdrop-filter: blur(12px);
    transition: color 0.2s, border-color 0.2s, background 0.2s;
  }
  .ab-back-btn:hover { color: #fff; border-color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.1); }

  /* ── Grid overlay ── */
  .ab-grid-bg {
    position: absolute; inset: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
    background-size: 72px 72px;
    mask-image: radial-gradient(ellipse 90% 70% at 50% 30%, black 20%, transparent 80%);
  }

  /* ── Orbs ── */
  .ab-orb { position: absolute; border-radius: 50%; filter: blur(90px); pointer-events: none; }
  .ab-orb-a { width:700px; height:700px; top:-200px; left:50%; transform:translateX(-50%);
    background: radial-gradient(circle, rgba(244,169,106,0.16) 0%, transparent 70%);
    animation: of1 9s ease-in-out infinite; }
  .ab-orb-b { width:450px; height:450px; bottom:0; left:-100px;
    background: radial-gradient(circle, rgba(224,92,126,0.14) 0%, transparent 70%);
    animation: of2 11s ease-in-out infinite; }
  .ab-orb-c { width:380px; height:380px; top:20%; right:-80px;
    background: radial-gradient(circle, rgba(100,60,220,0.12) 0%, transparent 70%);
    animation: of3 13s ease-in-out infinite; }
  @keyframes of1 { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(-28px)} }
  @keyframes of2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(22px,-22px)} }
  @keyframes of3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-18px,26px)} }

  /* ── Hero ── */
  .ab-hero {
    position: relative; min-height: 100vh;
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    text-align: center; padding: 140px 24px 80px;
    overflow: hidden;
  }
  .ab-live-pill {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 7px 16px; border-radius: 50px;
    border: 1px solid rgba(244,169,106,0.28);
    background: rgba(244,169,106,0.07);
    font-size: 12px; font-weight: 500;
    color: #f4a96a; letter-spacing: 0.4px;
    margin-bottom: 36px;
  }
  .ab-pulse { width:7px; height:7px; border-radius:50%; background:#f4a96a; animation: pulse 2s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.65)} }

  .ab-brand-name {
    font-family: "Momo Signature", cursive !important;
    font-size: clamp(52px, 9vw, 110px);
    font-weight: 400; line-height: 1.1;
    color: #fff; margin: 0 auto 20px;
    display: inline-block;
    background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 0 60px rgba(244,169,106,0.25));
    padding: 0.05em 0.25em 0.25em;
  }
  .ab-hero-tagline {
    font-family: 'Fraunces', serif;
    font-size: clamp(16px, 2.5vw, 22px);
    font-weight: 200; font-style: italic;
    color: rgba(255,255,255,0.45);
    letter-spacing: 0.2px; margin-bottom: 52px;
  }
  .ab-hero-ctas { display:flex; gap:14px; flex-wrap:wrap; justify-content:center; }

  .ab-btn-glow {
    height: 54px; padding: 0 42px; border-radius: 16px; border: none;
    background: linear-gradient(135deg, #f4a96a, #e05c7e, #a855f7);
    background-size: 200% 200%;
    color: #fff; font-size: 15px; font-weight: 600;
    font-family: 'Inter', sans-serif; cursor: pointer;
    display: inline-flex; align-items: center; gap: 8px;
    box-shadow: 0 8px 32px rgba(224,92,126,0.45), 0 0 0 1px rgba(255,255,255,0.08);
    transition: transform 0.15s, box-shadow 0.2s;
    text-decoration: none;
    animation: gradShift 4s ease infinite;
  }
  @keyframes gradShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
  .ab-btn-glow:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(224,92,126,0.6), 0 0 0 1px rgba(255,255,255,0.12); }

  .ab-btn-outline {
    height: 54px; padding: 0 42px; border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.6); font-size: 15px; font-weight: 500;
    font-family: 'Inter', sans-serif; cursor: pointer;
    display: inline-flex; align-items: center; gap: 8px;
    backdrop-filter: blur(8px);
    transition: border-color 0.2s, color 0.2s, background 0.2s, transform 0.15s;
    text-decoration: none;
  }
  .ab-btn-outline:hover { border-color: rgba(244,169,106,0.4); color: #f4a96a; background: rgba(244,169,106,0.06); transform: translateY(-3px); }

  /* ── Stats ── */
  .ab-stats {
    display: flex; justify-content: center; flex-wrap: wrap;
    border-top: 1px solid rgba(255,255,255,0.05);
    border-bottom: 1px solid rgba(255,255,255,0.05);
    background: rgba(255,255,255,0.015);
    padding: 40px 24px;
  }
  .ab-stat { flex:1; min-width:130px; text-align:center; padding:16px 24px; position:relative; }
  .ab-stat + .ab-stat::before {
    content:''; position:absolute; left:0; top:20%; bottom:20%;
    width:1px; background:rgba(255,255,255,0.06);
  }
  .ab-stat-num {
    font-family:'Fraunces',serif; font-size:40px; font-weight:200;
    letter-spacing:-1.5px; display:block; margin-bottom:6px;
    background: linear-gradient(135deg, #f4a96a, #e05c7e);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }
  .ab-stat-lbl { font-size:11px; font-weight:400; color:rgba(255,255,255,0.3); letter-spacing:0.8px; text-transform:uppercase; }

  /* ── Features ── */
  .ab-features { padding: 120px 0; position: relative; overflow: hidden; }
  .ab-features-glow {
    position:absolute; inset:0; pointer-events:none;
    background: radial-gradient(ellipse 60% 50% at 50% 50%, rgba(100,60,220,0.06) 0%, transparent 65%);
  }
  .ab-section-eyebrow {
    font-size:11px; font-weight:600; letter-spacing:2.5px;
    text-transform:uppercase; color:#f4a96a; margin-bottom:14px; display:block;
  }
  .ab-section-h {
    font-family:'Fraunces',serif;
    font-size:clamp(28px, 4.5vw, 52px);
    font-weight:200; line-height:1.1; letter-spacing:-1.2px;
    color:#fff; margin:0 0 16px;
  }
  .ab-section-h em {
    font-style:italic;
    background: linear-gradient(135deg,#f4a96a,#e05c7e);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    padding-right: 0.08em;
  }
  .ab-section-p { font-size:15px; font-weight:300; color:rgba(255,255,255,0.33); line-height:1.75; max-width:440px; }
  .ab-feat-card {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 24px; padding: 36px 28px; height:100%;
    position:relative; overflow:hidden;
    transition: border-color 0.3s, background 0.3s, transform 0.2s;
  }
  .ab-feat-card:hover { border-color:rgba(244,169,106,0.2); background:rgba(244,169,106,0.03); transform:translateY(-4px); }
  .ab-feat-num {
    position:absolute; top:20px; right:22px;
    font-family:'Fraunces',serif; font-size:52px; font-weight:200;
    color:rgba(255,255,255,0.035); line-height:1; letter-spacing:-2px;
    user-select:none; pointer-events:none;
  }
  .ab-feat-icon {
    width:52px; height:52px; border-radius:16px;
    display:flex; align-items:center; justify-content:center;
    margin-bottom:24px;
  }
  .ab-feat-title { font-family:'Fraunces',serif; font-size:20px; font-weight:300; color:#fff; margin-bottom:10px; letter-spacing:-0.3px; }
  .ab-feat-desc { font-size:13.5px; font-weight:300; color:rgba(255,255,255,0.38); line-height:1.72; }

  /* ── Manifesto ── */
  .ab-manifesto {
    padding:120px 24px; text-align:center;
    background: linear-gradient(180deg, #06040a 0%, #0e0816 50%, #06040a 100%);
    position:relative; overflow:hidden;
  }
  .ab-manifesto-glow {
    position:absolute; inset:0; pointer-events:none;
    background: radial-gradient(ellipse 80% 70% at 50% 50%, rgba(168,85,247,0.08) 0%, transparent 65%);
  }
  .ab-mline {
    font-family:'Fraunces',serif;
    font-size:clamp(24px, 4.5vw, 58px);
    font-weight:200; line-height:1.25;
    letter-spacing:-1.2px; color:rgba(255,255,255,0.12);
    transition:color 0.35s; cursor:default;
    max-width:880px; margin:0 auto 4px;
  }
  .ab-mline.lit { color:#fff; }
  .ab-mline em {
    font-style:italic;
    background:linear-gradient(135deg,#f4a96a,#e05c7e);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }

  /* ── Values ── */
  .ab-values { padding:100px 0; background:#0b0810; border-top:1px solid rgba(255,255,255,0.04); }
  .ab-val-card {
    background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.06);
    border-radius:24px; padding:40px 32px; height:100%; text-align:center;
    transition: border-color 0.3s, transform 0.2s;
  }
  .ab-val-card:hover { border-color:rgba(255,255,255,0.12); transform:translateY(-4px); }
  .ab-val-icon { width:64px; height:64px; border-radius:20px; background:rgba(255,255,255,0.045); border:1px solid rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center; font-size:28px; margin:0 auto 24px; }
  .ab-val-title { font-family:'Fraunces',serif; font-size:21px; font-weight:300; color:#fff; margin-bottom:12px; letter-spacing:-0.3px; }
  .ab-val-desc { font-size:13.5px; font-weight:300; color:rgba(255,255,255,0.36); line-height:1.75; }

  /* ── CTA ── */
  .ab-cta {
    padding:140px 24px; text-align:center; position:relative; overflow:hidden;
  }
  .ab-cta-glow {
    position:absolute; inset:0; pointer-events:none;
    background:
      radial-gradient(ellipse 70% 60% at 50% 50%, rgba(244,169,106,0.12) 0%, transparent 65%),
      radial-gradient(ellipse 40% 40% at 15% 80%, rgba(224,92,126,0.1) 0%, transparent 60%),
      radial-gradient(ellipse 40% 40% at 85% 20%, rgba(168,85,247,0.09) 0%, transparent 60%);
  }
  .ab-cta-h {
    font-family:'Fraunces',serif;
    font-size:clamp(36px, 6vw, 76px);
    font-weight:200; letter-spacing:-2px; line-height:1.08;
    color:#fff; max-width:700px; margin:0 auto 24px;
  }
  .ab-cta-h em {
    font-style:italic;
    background:linear-gradient(135deg,#f4a96a,#e05c7e,#a855f7);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    padding-right: 0.08em;
  }
  .ab-cta-sub { font-size:16px; font-weight:300; color:rgba(255,255,255,0.33); margin-bottom:52px; }

  /* ── Footer ── */
  .ab-footer {
    padding:32px 24px; display:flex; flex-direction:column;
    align-items:center; gap:16px;
    border-top:1px solid rgba(255,255,255,0.05); background:#06040a;
  }
  .ab-footer-brand { font-family:"Momo Signature",cursive!important; font-size:22px; font-weight:400; color:rgba(255,255,255,0.35); text-decoration:none; }
  .ab-footer-links { display:flex; gap:24px; }
  .ab-footer-links a { font-size:12px; color:rgba(255,255,255,0.25); text-decoration:none; transition:color 0.2s; }
  .ab-footer-links a:hover { color:#f4a96a; }
  .ab-footer-copy { font-size:11px; color:rgba(255,255,255,0.14); }

  /* ── Scroll indicator ── */
  .ab-scroll {
    position:absolute; bottom:36px; left:50%; transform:translateX(-50%);
    display:flex; flex-direction:column; align-items:center; gap:8px;
    color:rgba(255,255,255,0.18); font-size:10px; letter-spacing:2px; text-transform:uppercase;
    animation:scrl 3s ease-in-out infinite;
  }
  @keyframes scrl { 0%,100%{opacity:0.35;transform:translateX(-50%) translateY(0)} 50%{opacity:0.8;transform:translateX(-50%) translateY(7px)} }
  .ab-scroll-line { width:1px; height:36px; background:linear-gradient(to bottom, transparent, rgba(255,255,255,0.28)); }

  @media(max-width:600px) {
    .ab-header { padding:14px 18px; }
    .ab-stat+.ab-stat::before { display:none; }
  }
`;

// ─── Animations ────────────────────────────────────────────────────────────────
const fu = (i = 0) => ({
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { delay: 0.04 + i * 0.08, duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
});
const fv = (i = 0) => ({
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
});

// ─── Manifesto ─────────────────────────────────────────────────────────────────
const ManifestoSection = ({ lines }: { lines: { text: string; em: boolean }[] }) => {
  const { t } = useTranslation();
  const [lit, setLit] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-30% 0px -30% 0px" });
  return (
    <section className="ab-manifesto">
      <div className="ab-manifesto-glow" />
      <Container maxWidth="md">
        <motion.span className="ab-section-eyebrow" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          {t("about.manifestoEyebrow")}
        </motion.span>
        <div ref={ref} style={{ marginTop: 32 }}>
          {lines.map((line, i) => (
            <motion.p
              key={i}
              className={`ab-mline${inView || lit === i ? " lit" : ""}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              onHoverStart={() => setLit(i)}
              onHoverEnd={() => setLit(null)}
            >
              {line.em ? <em>{line.text}</em> : line.text}
            </motion.p>
          ))}
        </div>
      </Container>
    </section>
  );
};

// ─── Counter ───────────────────────────────────────────────────────────────────
const CountUp = ({ target, suffix = "" }: { target: number; suffix?: string }) => {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / 60;
    const t = setInterval(() => {
      start = Math.min(start + step, target);
      setVal(Math.round(start));
      if (start >= target) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [inView, target]);
  return <span ref={ref}>{val}{suffix}</span>;
};

// ─── Main ──────────────────────────────────────────────────────────────────────
const AboutPage: React.FC = () => {
  usePageTitle("About Ripple");
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  const features = [
    { icon: <PhotoCameraIcon />, g: "linear-gradient(135deg,#f4a96a,#e05c7e)", title: t("about.feat1Title"), desc: t("about.feat1Desc") },
    { icon: <AutoAwesomeIcon />, g: "linear-gradient(135deg,#a78bfa,#a855f7)", title: t("about.feat2Title"), desc: t("about.feat2Desc") },
    { icon: <HowToVoteIcon />, g: "linear-gradient(135deg,#34d399,#059669)", title: t("about.feat3Title"), desc: t("about.feat3Desc") },
    { icon: <ChatIcon />, g: "linear-gradient(135deg,#60a5fa,#3b82f6)", title: t("about.feat4Title"), desc: t("about.feat4Desc") },
    { icon: <BarChartIcon />, g: "linear-gradient(135deg,#f4a96a,#f59e0b)", title: t("about.feat5Title"), desc: t("about.feat5Desc") },
    { icon: <LanguageIcon />, g: "linear-gradient(135deg,#e05c7e,#a855f7)", title: t("about.feat6Title"), desc: t("about.feat6Desc") },
  ];

  const values = [
    { emoji: "🔒", title: t("about.val1Title"), desc: t("about.val1Desc") },
    { emoji: "❤️", title: t("about.val2Title"), desc: t("about.val2Desc") },
    { emoji: "🌍", title: t("about.val3Title"), desc: t("about.val3Desc") },
    { emoji: "⚡", title: t("about.val4Title"), desc: t("about.val4Desc") },
  ];

  const manifesto = [
    { text: t("about.manifesto1"), em: false },
    { text: t("about.manifesto2"), em: true },
    { text: t("about.manifesto3"), em: false },
    { text: t("about.manifesto4"), em: true },
    { text: t("about.manifesto5"), em: false },
  ];

  useEffect(() => {
    const id = "ab-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id; el.textContent = styles;
      document.head.appendChild(el);
    }
    document.documentElement.classList.add("ab-active");
    setMounted(true);
    return () => {
      document.documentElement.classList.remove("ab-active");
      document.getElementById(id)?.remove();
    };
  }, []);

  if (!mounted) return null;

  return (
    <div className="ab-root">

      {/* ── Floating header ───────────────────────────────────────────────── */}
      <header className="ab-header">
        <button className="ab-back-btn" onClick={() => window.history.back()}>
          ← {t("common.back")}
        </button>
        <AuthLanguageSelector />
      </header>

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section className="ab-hero">
        <div className="ab-grid-bg" />
        <div className="ab-orb ab-orb-a" />
        <div className="ab-orb ab-orb-b" />
        <div className="ab-orb ab-orb-c" />

        <div style={{ position: "relative", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <motion.div variants={fu(0)} initial="hidden" animate="visible">
            <span className="ab-live-pill">
              <span className="ab-pulse" />
              {t("about.pill")}
            </span>
          </motion.div>

          <motion.span variants={fu(1)} initial="hidden" animate="visible" className="ab-brand-name">
            Ripple
          </motion.span>

          <motion.p variants={fu(2)} initial="hidden" animate="visible" className="ab-hero-tagline">
            {t("about.tagline")}
          </motion.p>

          <motion.div variants={fu(3)} initial="hidden" animate="visible" className="ab-hero-ctas">
            <a href="/register" className="ab-btn-glow">{t("about.getStarted")} →</a>
            <a href="/login" className="ab-btn-outline">{t("auth.signIn")}</a>
          </motion.div>

        </div>

        <div className="ab-scroll">
          <div className="ab-scroll-line" />
          {t("about.scroll")}
        </div>
      </section>

      {/* ══ STATS ═════════════════════════════════════════════════════════════ */}
      <div className="ab-stats">
        {[
          { num: 7, suffix: "", label: t("about.statsLanguages") },
          { num: 0, suffix: " ads", label: t("about.statsAdsSub") },
          { num: 100, suffix: "%", label: t("about.statsOpenSource") },
          { num: 24, suffix: "/7", label: t("about.statsAvailable") },
        ].map((s, i) => (
          <motion.div key={i} className="ab-stat"
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }}>
            <span className="ab-stat-num">
              <CountUp target={s.num} suffix={s.suffix} />
            </span>
            <span className="ab-stat-lbl">{s.label}</span>
          </motion.div>
        ))}
      </div>

      {/* ══ FEATURES ══════════════════════════════════════════════════════════ */}
      <section className="ab-features">
        <div className="ab-features-glow" />
        <Container maxWidth="lg">
          <Box sx={{ mb: 8 }}>
            <motion.span className="ab-section-eyebrow" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>{t("about.featEyebrow")}</motion.span>
            <motion.h2 className="ab-section-h" variants={fv(0)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              {t("about.featHeading1")}<br /><em>{t("about.featHeading2")}</em>
            </motion.h2>
            <motion.p className="ab-section-p" variants={fv(1)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              {t("about.featDesc")}
            </motion.p>
          </Box>

          <Grid container spacing={3}>
            {features.map((f, i) => (
              <Grid item xs={12} sm={6} md={4} key={f.title}>
                <motion.div variants={fv(i % 3)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} style={{ height: "100%" }}>
                  <div className="ab-feat-card">
                    <span className="ab-feat-num">0{i + 1}</span>
                    <div className="ab-feat-icon" style={{ background: f.g }}>
                      {React.cloneElement(f.icon as React.ReactElement, { sx: { color: "#fff", fontSize: 22 } })}
                    </div>
                    <p className="ab-feat-title">{f.title}</p>
                    <p className="ab-feat-desc">{f.desc}</p>
                  </div>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </section>

      {/* ══ MANIFESTO ═════════════════════════════════════════════════════════ */}
      <ManifestoSection lines={manifesto} />

      {/* ══ VALUES ════════════════════════════════════════════════════════════ */}
      <section className="ab-values">
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 7 }}>
            <motion.span className="ab-section-eyebrow" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>{t("about.valEyebrow")}</motion.span>
            <motion.h2 className="ab-section-h" style={{ textAlign: "center" }} variants={fv(0)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              {t("about.valHeading")}
            </motion.h2>
          </Box>
          <Grid container spacing={3}>
            {values.map((v, i) => (
              <Grid item xs={12} sm={6} md={3} key={v.title}>
                <motion.div variants={fv(i)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} style={{ height: "100%" }}>
                  <div className="ab-val-card">
                    <div className="ab-val-icon">{v.emoji}</div>
                    <p className="ab-val-title">{v.title}</p>
                    <p className="ab-val-desc">{v.desc}</p>
                  </div>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════════════════════════ */}
      <section className="ab-cta">
        <div className="ab-cta-glow" />
        <Container maxWidth="md" sx={{ position: "relative" }}>
          <motion.h2 className="ab-cta-h" variants={fv(0)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            {t("about.ctaHeading1")}<br /><em>{t("about.ctaHeading2")}</em>
          </motion.h2>
          <motion.p className="ab-cta-sub" variants={fv(1)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            {t("about.ctaSub")}
          </motion.p>
          <motion.div variants={fv(2)} initial="hidden" whileInView="visible" viewport={{ once: true }}
            style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/register" className="ab-btn-glow" style={{ fontSize: 16, height: 58, padding: "0 52px" }}>{t("about.ctaCreate")} →</a>
            <a href="/login" className="ab-btn-outline" style={{ fontSize: 16, height: 58, padding: "0 52px" }}>{t("auth.signIn")}</a>
          </motion.div>
        </Container>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════════════════ */}
      <footer className="ab-footer">
        <a href="/" className="ab-footer-brand">Ripple</a>
        <div className="ab-footer-links">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/login">{t("auth.signIn")}</a>
          <a href="/register">{t("auth.signUp")}</a>
        </div>
        <p className="ab-footer-copy">{t("about.footerCopy")}</p>
      </footer>
    </div>
  );
};

export default AboutPage;
