import { Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

        @keyframes floatUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%       { opacity: 0.8; transform: scale(1.06); }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes dashDraw {
          from { stroke-dashoffset: 600; }
          to   { stroke-dashoffset: 0; }
        }

        .nf-root {
          min-height: 100vh;
          background: #08080f;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
          font-family: 'DM Sans', sans-serif;
        }

        /* Ambient background blobs */
        .nf-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }
        .nf-blob-1 {
          width: 420px; height: 420px;
          background: radial-gradient(circle, rgba(124,92,252,0.18) 0%, transparent 70%);
          top: -80px; left: -100px;
          animation: glowPulse 6s ease-in-out infinite;
        }
        .nf-blob-2 {
          width: 360px; height: 360px;
          background: radial-gradient(circle, rgba(255,107,53,0.12) 0%, transparent 70%);
          bottom: -60px; right: -80px;
          animation: glowPulse 8s ease-in-out infinite reverse;
        }

        /* Grid lines */
        .nf-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 100%);
          pointer-events: none;
        }

        .nf-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 32px 24px;
          max-width: 480px;
        }

        /* Big 404 number */
        .nf-number {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: clamp(96px, 20vw, 160px);
          line-height: 1;
          letter-spacing: -6px;
          background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.25) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0;
          opacity: 0;
          animation: floatUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s forwards;
          position: relative;
          user-select: none;
        }

        /* Decorative ring around 404 */
        .nf-ring-wrap {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }
        .nf-ring {
          position: absolute;
          width: clamp(180px, 38vw, 280px);
          height: clamp(180px, 38vw, 280px);
          animation: spinSlow 18s linear infinite;
          opacity: 0;
          animation: spinSlow 18s linear infinite, floatUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s forwards;
        }
        .nf-ring circle {
          fill: none;
          stroke: url(#ringGrad);
          stroke-width: 1.5;
          stroke-dasharray: 8 18;
          stroke-linecap: round;
        }

        .nf-divider {
          width: 40px;
          height: 2px;
          background: linear-gradient(90deg, #7c5cfc, #ff6b35);
          border-radius: 2px;
          margin: 20px 0;
          opacity: 0;
          animation: floatUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.4s forwards;
        }

        .nf-title {
          font-family: 'Syne', sans-serif !important;
          font-size: clamp(18px, 4vw, 22px) !important;
          font-weight: 700 !important;
          color: rgba(255,255,255,0.85) !important;
          letter-spacing: -0.3px;
          margin-bottom: 10px !important;
          opacity: 0;
          animation: floatUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.5s forwards;
        }

        .nf-sub {
          font-family: 'DM Sans', sans-serif !important;
          font-size: 0.88rem !important;
          color: rgba(255,255,255,0.32) !important;
          line-height: 1.65 !important;
          max-width: 320px;
          opacity: 0;
          animation: floatUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.6s forwards;
        }

        .nf-btn {
          margin-top: 32px !important;
          font-family: 'DM Sans', sans-serif !important;
          font-size: 0.875rem !important;
          font-weight: 600 !important;
          text-transform: none !important;
          border-radius: 14px !important;
          padding: 12px 32px !important;
          background: linear-gradient(135deg, #7c5cfc, #ff6b35) !important;
          color: #fff !important;
          border: none !important;
          box-shadow: 0 8px 24px rgba(124,92,252,0.3) !important;
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease !important;
          opacity: 0;
          animation: floatUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.75s forwards;
        }
        .nf-btn:hover {
          transform: translateY(-2px) scale(1.02) !important;
          box-shadow: 0 12px 32px rgba(124,92,252,0.45) !important;
        }
        .nf-btn:active {
          transform: translateY(0) scale(0.98) !important;
        }

        /* Decorative dots */
        .nf-dots {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
        }
        .nf-dot {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(255,255,255,0.12);
        }
      `}</style>

            <div className="nf-root">
                <div className="nf-blob nf-blob-1" />
                <div className="nf-blob nf-blob-2" />
                <div className="nf-grid" />

                {/* Decorative scattered dots */}
                <div className="nf-dots">
                    {[
                        { top: "18%", left: "12%" },
                        { top: "72%", left: "8%" },
                        { top: "40%", left: "88%" },
                        { top: "85%", left: "78%" },
                        { top: "12%", left: "60%" },
                        { top: "60%", left: "92%" },
                    ].map((pos, i) => (
                        <div key={i} className="nf-dot" style={pos} />
                    ))}
                </div>

                <div className="nf-content">
                    {/* 404 with orbiting ring */}
                    <div className="nf-ring-wrap">
                        <svg className="nf-ring" viewBox="0 0 280 280">
                            <defs>
                                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#7c5cfc" stopOpacity="0.8" />
                                    <stop offset="100%" stopColor="#ff6b35" stopOpacity="0.4" />
                                </linearGradient>
                            </defs>
                            <circle cx="140" cy="140" r="132" />
                        </svg>
                        <div className="nf-number">404</div>
                    </div>

                    <div className="nf-divider" />

                    <Typography className="nf-title">Page not found</Typography>
                    <Typography className="nf-sub">The page you're looking for doesn't exist or has been moved somewhere else.</Typography>

                    <Button className="nf-btn" onClick={() => navigate("/")}>
                        Back to home
                    </Button>
                </div>
            </div>
        </>
    );
};

export default NotFoundPage;
