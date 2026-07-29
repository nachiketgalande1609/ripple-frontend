import { useState } from "react";
import {
  Box, Dialog, Typography, IconButton, Backdrop, Fade,
  Button, useTheme, CircularProgress,
} from "@mui/material";
import {
  Close, Visibility, WorkspacePremiumRounded,
  CalendarMonth, BarChart, Star, TrendingUp, Shield,
} from "@mui/icons-material";
import { grantPremium } from "../../services/api";
import { useAppNotifications } from "../../hooks/useNotification";

interface Props {
  open: boolean;
  onClose: () => void;
  onUpgraded?: () => void;
}

const GOLD    = "#f59e0b";
const GOLD_L  = "#fbbf24";
const GOLD_BG = "#fef3c7";
const GOLD_DK = "#78350f";

const features = [
  { icon: WorkspacePremiumRounded, label: "Premium gold badge",    desc: "Stand out with a gold badge next to your name" },
  { icon: Visibility,              label: "See profile viewers",    desc: "Know exactly who's been visiting your profile" },
  { icon: BarChart,                label: "Advanced insights",      desc: "Detailed analytics on reach, saves & engagement" },
  { icon: CalendarMonth,           label: "Unlimited scheduling",   desc: "Schedule as many posts as you want, any time" },
  { icon: TrendingUp,              label: "Priority in suggestions",desc: "Appear higher in follow suggestions for others" },
  { icon: Shield,                  label: "Early access",           desc: "Try new features before everyone else" },
];

const PremiumUpgradeModal: React.FC<Props> = ({ open, onClose, onUpgraded }) => {
  const theme = useTheme();
  const notifications = useAppNotifications();
  const isDark = theme.palette.mode === "dark";
  const bc = theme.palette.divider;
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<"monthly" | "yearly">("yearly");

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const months = plan === "yearly" ? 12 : 1;
      const res = await grantPremium(months);
      if (res.success) {
        notifications.show("Welcome to Ripple Premium! 🎉", { severity: "success", autoHideDuration: 3500 });
        onUpgraded?.();
        onClose();
      }
    } catch {
      notifications.show("Something went wrong. Please try again.", { severity: "error", autoHideDuration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{ timeout: 200, sx: { backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" } }}
      PaperProps={{
        sx: {
          borderRadius: "24px",
          width: "100%",
          maxWidth: 420,
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: bc,
          boxShadow: isDark ? "0 32px 80px rgba(0,0,0,0.7)" : "0 24px 64px rgba(0,0,0,0.16)",
          overflow: "hidden",
        },
      }}
    >
      <Fade in={open} timeout={220}>
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>

          {/* Hero */}
          <Box sx={{
            background: isDark
              ? "linear-gradient(145deg, #1c1407 0%, #292009 60%, #1c1407 100%)"
              : "linear-gradient(145deg, #fffbeb 0%, #fef3c7 60%, #fde68a 100%)",
            px: 3, pt: 3.5, pb: 2.5, flexShrink: 0, position: "relative",
          }}>
            <IconButton onClick={onClose} size="small" sx={{
              position: "absolute", top: 12, right: 12,
              width: 28, height: 28, borderRadius: "8px",
              color: isDark ? "rgba(251,191,36,0.6)" : GOLD_DK,
              "&:hover": { bgcolor: isDark ? "rgba(245,158,11,0.1)" : "rgba(245,158,11,0.12)" },
            }}>
              <Close sx={{ fontSize: 14 }} />
            </IconButton>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: "14px", bgcolor: isDark ? "rgba(245,158,11,0.15)" : "rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <WorkspacePremiumRounded sx={{ fontSize: 24, color: GOLD }} />
              </Box>
              <Box>
                <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: GOLD, lineHeight: 1 }}>
                  Ripple
                </Typography>
                <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "1.25rem", fontWeight: 800, color: isDark ? GOLD_L : GOLD_DK, lineHeight: 1.15, letterSpacing: "-0.3px" }}>
                  Premium
                </Typography>
              </Box>
            </Box>

            <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.875rem", color: isDark ? "rgba(251,191,36,0.75)" : "#92400e", lineHeight: 1.5 }}>
              Unlock exclusive features and stand out from the crowd.
            </Typography>
          </Box>

          {/* Features list */}
          <Box sx={{ flex: 1, overflowY: "auto", "&::-webkit-scrollbar": { width: 3 }, "&::-webkit-scrollbar-thumb": { bgcolor: (t) => t.palette.action.selected, borderRadius: 4 } }}>
            <Box sx={{ px: 2.5, pt: 2, pb: 1 }}>
              {features.map(({ icon: Icon, label, desc }) => (
                <Box key={label} sx={{ display: "flex", gap: 1.5, py: 1.1, "&:not(:last-child)": { borderBottom: "1px solid", borderColor: bc } }}>
                  <Box sx={{ width: 34, height: 34, borderRadius: "10px", bgcolor: isDark ? "rgba(245,158,11,0.1)" : GOLD_BG, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.1 }}>
                    <Icon sx={{ fontSize: 17, color: GOLD }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.855rem", fontWeight: 600, color: (t) => t.palette.text.primary, lineHeight: 1.3 }}>
                      {label}
                    </Typography>
                    <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.78rem", color: (t) => t.palette.text.secondary, lineHeight: 1.45, mt: 0.2 }}>
                      {desc}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Plan toggle */}
            <Box sx={{ px: 2.5, pt: 1.5, pb: 2 }}>
              <Box sx={{ display: "flex", gap: 1 }}>
                {(["monthly", "yearly"] as const).map((p) => (
                  <Box
                    key={p}
                    onClick={() => setPlan(p)}
                    sx={{
                      flex: 1, py: 1.25, px: 1, borderRadius: "14px", cursor: "pointer",
                      border: "1.5px solid",
                      borderColor: plan === p ? GOLD : bc,
                      bgcolor: plan === p ? (isDark ? "rgba(245,158,11,0.08)" : GOLD_BG) : "transparent",
                      transition: "all 0.15s",
                      textAlign: "center",
                    }}
                  >
                    <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.82rem", fontWeight: 700, color: plan === p ? GOLD : (t: any) => t.palette.text.secondary }}>
                      {p === "monthly" ? "$4.99 / mo" : "$39.99 / yr"}
                    </Typography>
                    {p === "yearly" && (
                      <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.68rem", fontWeight: 600, color: "#16a34a", mt: 0.3 }}>
                        Save 33%
                      </Typography>
                    )}
                    {p === "monthly" && (
                      <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.68rem", color: (t: any) => t.palette.text.disabled, mt: 0.3 }}>
                        Billed monthly
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
              <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.72rem", color: (t) => t.palette.text.disabled, mt: 1.25, textAlign: "center" }}>
                Payment setup coming soon. Subscribe now to lock in your rate.
              </Typography>
            </Box>
          </Box>

          {/* Footer CTA */}
          <Box sx={{ px: 2.5, py: 2, borderTop: "1px solid", borderColor: bc, flexShrink: 0 }}>
            <Button
              fullWidth
              onClick={handleUpgrade}
              disabled={loading}
              sx={{
                borderRadius: "14px",
                py: 1.2,
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.9rem",
                fontWeight: 700,
                textTransform: "none",
                background: loading ? undefined : `linear-gradient(135deg, ${GOLD} 0%, #d97706 100%)`,
                color: "#fff",
                boxShadow: loading ? "none" : `0 4px 20px rgba(245,158,11,0.4)`,
                "&:hover": { background: `linear-gradient(135deg, ${GOLD_L} 0%, ${GOLD} 100%)`, boxShadow: `0 6px 24px rgba(245,158,11,0.5)` },
                "&.Mui-disabled": { bgcolor: (t: any) => t.palette.action.disabledBackground, color: "rgba(255,255,255,0.5)", boxShadow: "none" },
              }}
              startIcon={loading ? <CircularProgress size={15} sx={{ color: "#fff" }} /> : <Star sx={{ fontSize: 17 }} />}
            >
              {loading ? "Activating…" : `Get Premium · ${plan === "yearly" ? "$39.99/yr" : "$4.99/mo"}`}
            </Button>
          </Box>
        </Box>
      </Fade>
    </Dialog>
  );
};

export default PremiumUpgradeModal;
