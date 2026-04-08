import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CircularProgress, Box, Typography, Button } from "@mui/material";
import { CheckCircleOutline, ErrorOutline } from "@mui/icons-material";
import { verifyUser } from "../services/api";

const ACCENT = "#7c5cfc";

const VerifyAccount: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setError("Invalid or missing verification token.");
      setLoading(false);
      return;
    }
    const verify = async () => {
      try {
        const response = await verifyUser(token);
        if (response.success) {
          setSuccess("Your account has been successfully verified!");
        } else {
          setError(response.error || "Verification failed.");
        }
      } catch (err: any) {
        setError(
          err.response?.data?.error || "An error occurred during verification.",
        );
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [searchParams]);

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
      }}
    >
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
              Verifying your account…
            </Typography>
            <Typography
              sx={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.78rem",
                color: (t) => t.palette.text.disabled,
              }}
            >
              This will only take a moment
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
              Account verified
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
              Go to login
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
              Verification failed
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
              Back to home
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default VerifyAccount;
