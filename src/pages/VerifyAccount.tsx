import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CircularProgress, Box, Typography, Button } from "@mui/material";
import { CheckCircleOutline, ErrorOutline } from "@mui/icons-material";
import { verifyUser } from "../services/api";
import { useTranslation } from "react-i18next";
import AuthLanguageSelector from "../component/auth/AuthLanguageSelector";

const ACCENT = "#64748B";

const VerifyAccount: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setError(t("auth.invalidToken"));
      setLoading(false);
      return;
    }
    const verify = async () => {
      try {
        const response = await verifyUser(token);
        if (response.success) {
          setSuccess(t("auth.accountVerifiedSuccess"));
        } else {
          setError(response.error || t("auth.verificationFailedError"));
        }
      } catch (err: any) {
        setError(
          err.response?.data?.error || t("auth.verificationError"),
        );
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [searchParams, t]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: (t) => t.palette.background.default,
        fontFamily: "'Inter', -apple-system, sans-serif",
        px: 2,
        position: "relative",
      }}
    >
      <Box sx={{ position: "absolute", top: 16, right: 16 }}>
        <AuthLanguageSelector />
      </Box>

      <Box
        sx={{
          width: "100%",
          maxWidth: 400,
          backgroundColor: (t) => t.palette.background.paper,
          border: "1px solid",
          borderColor: (t) => t.palette.divider,
          borderRadius: "16px",
          p: 4,
          textAlign: "center",
          boxShadow: (t) =>
            t.palette.mode === "dark"
              ? "0 16px 40px rgba(0,0,0,0.4)"
              : "0 16px 40px rgba(0,0,0,0.08)",
        }}
      >
        {/* Brand */}
        <Typography className="brand-text" sx={{mb:3}}>Ripple</Typography>

        {/* ── Loading ── */}
        {loading && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <CircularProgress size={36} sx={{ color: ACCENT }} />
            <Typography
              sx={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: (t) => t.palette.text.primary,
              }}
            >
              {t("auth.verifyingAccount")}
            </Typography>
            <Typography
              sx={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.78rem",
                color: (t) => t.palette.text.disabled,
              }}
            >
              {t("auth.onlyAMoment")}
            </Typography>
          </Box>
        )}

        {/* ── Success ── */}
        {!loading && success && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "16px",
                backgroundColor: (t) => `${t.palette.success.main}14`,
                border: "1px solid",
                borderColor: (t) => `${t.palette.success.main}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 0.5,
              }}
            >
              <CheckCircleOutline
                sx={{ fontSize: 28, color: (t) => t.palette.success.main }}
              />
            </Box>
            <Typography
              sx={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.95rem",
                fontWeight: 500,
                color: (t) => t.palette.text.primary,
              }}
            >
              {t("auth.accountVerified")}
            </Typography>
            <Typography
              sx={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.8rem",
                color: (t) => t.palette.text.disabled,
                lineHeight: 1.6,
              }}
            >
              {success}
            </Typography>
            <Button
              fullWidth
              onClick={() => navigate("/login")}
              sx={{
                mt: 1,
                textTransform: "none",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
                fontSize: "0.875rem",
                borderRadius: "10px",
                py: 1,
                backgroundColor: ACCENT,
                color: "#fff",
                boxShadow: "none",
                "&:hover": { backgroundColor: "#6b4de0", boxShadow: "none" },
                "&:active": { transform: "scale(0.97)" },
              }}
            >
              {t("auth.goToLogin")}
            </Button>
          </Box>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "16px",
                backgroundColor: (t) => `${t.palette.error.main}14`,
                border: "1px solid",
                borderColor: (t) => `${t.palette.error.main}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 0.5,
              }}
            >
              <ErrorOutline
                sx={{ fontSize: 28, color: (t) => t.palette.error.main }}
              />
            </Box>
            <Typography
              sx={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.95rem",
                fontWeight: 500,
                color: (t) => t.palette.text.primary,
              }}
            >
              {t("auth.verificationFailed")}
            </Typography>
            <Typography
              sx={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.8rem",
                color: (t) => t.palette.text.disabled,
                lineHeight: 1.6,
              }}
            >
              {error}
            </Typography>
            <Button
              fullWidth
              onClick={() => navigate("/")}
              sx={{
                mt: 3,
                textTransform: "none",
                fontWeight: 500,
                fontSize: "0.875rem",
                borderRadius: "10px",
                py: 1,
                border: "1px solid",
                borderColor: (t) => t.palette.divider,
                color: (t) => t.palette.text.secondary,
                "&:hover": {
                  backgroundColor: (t) => t.palette.action.hover,
                  borderColor: (t) => t.palette.text.disabled,
                  color: (t) => t.palette.text.primary,
                },
              }}
            >
              {t("notFound.backToHome")}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default VerifyAccount;
