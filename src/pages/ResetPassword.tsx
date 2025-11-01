import React, { useState, useEffect, useRef } from "react";
import { TextField, Button, Container, Typography, Box, Alert, Link, useMediaQuery, CircularProgress, Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { generatePasswordResetOTP, ResetPassword, verifyPasswordResetOTP } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import Orb from "../component/plasma/Orb";

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [checked, setChecked] = useState(false);
    const [step, setStep] = useState<"email" | "otp" | "reset">("email");
    const isLarge = useMediaQuery("(min-width:1281px)");
    const navigate = useNavigate();
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        setChecked(true);
    }, []);

    const handleEmailSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await generatePasswordResetOTP(email);
            if (response.success) {
                setError(null);
                setStep("otp");
            } else {
                setError(response.error || "Failed to send OTP!");
            }
        } catch (err: any) {
            console.error("Error:", err);
            setError(err.response?.data?.error || "Failed to send OTP!");
        } finally {
            setLoading(false);
        }
    };

    const handleOTPChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOTPVerify = async () => {
        const fullOTP = otp.join("");
        if (fullOTP.length < 6) {
            setError("Please enter the full 6-digit OTP.");
            return;
        }

        setLoading(true);
        try {
            const response = await verifyPasswordResetOTP(email, fullOTP);
            if (response.success) {
                setError(null);
                setStep("reset");
            } else {
                setError(response.error || "Invalid OTP!");
            }
        } catch (err: any) {
            console.error("Error:", err);
            setError(err.response?.data?.error || "OTP verification failed!");
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
            const fullOTP = otp.join("");
            const response = await ResetPassword(email, fullOTP, newPassword);

            if (response.success) {
                setTimeout(() => {
                    navigate("/login", { state: { resetSuccess: true } });
                }, 2000);
            } else {
                setError(response.error || "Password reset failed.");
            }
        } catch (err: any) {
            console.error("Error:", err);
            setError(err.message || "Password reset failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleOTPPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const paste = e.clipboardData.getData("text").trim();
        if (/^\d{6}$/.test(paste)) {
            const otpArray = paste.split("");
            setOtp(otpArray);
            otpArray.forEach((digit: string, i: number) => {
                if (inputRefs.current[i]) {
                    inputRefs.current[i].value = digit;
                }
            });
            const lastIndex = Math.min(otpArray.length - 1, inputRefs.current.length - 1);
            if (inputRefs.current[lastIndex]) {
                inputRefs.current[lastIndex].focus();
            }
        }
    };

    return (
        <div
            style={{
                width: "100%",
                height: "100dvh",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Plasma Background Layer */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: 0,
                }}
            >
                <Orb hoverIntensity={0.5} rotateOnHover={true} hue={0} forceHoverState={false} />
            </div>
            <Container
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100svh",
                }}
            >
                <AnimatePresence>
                    {checked && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        >
                            <Box
                                sx={{
                                    textAlign: "center",
                                    padding: isLarge ? "50px 40px" : "35px 25px",
                                    borderRadius: "24px",
                                    position: "relative",
                                    overflow: "hidden",
                                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                                    backdropFilter: "blur(20px)",
                                    boxShadow: `
                                        0 8px 32px rgba(0, 0, 0, 0.2),
                                        inset 0 1px 0 rgba(255, 255, 255, 0.1),
                                        inset 0 -1px 0 rgba(0, 0, 0, 0.1)
                                    `,
                                    border: "1px solid rgba(255, 255, 255, 0.15)",
                                    width: isLarge ? "420px" : "380px",
                                    boxSizing: "border-box",
                                }}
                            >
                                {/* Glassmorphic border effect */}
                                <Box
                                    sx={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: "1px",
                                        background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
                                    }}
                                />

                                {/* Title */}
                                <motion.div
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.1, duration: 0.5 }}
                                >
                                    <Typography
                                        sx={{
                                            mb: 2,
                                            fontSize: isLarge ? "42px" : "36px",
                                            fontWeight: 700,
                                            letterSpacing: "-0.5px",
                                            backgroundImage: "linear-gradient(to right, #7a60ff, #ff8800)",
                                            WebkitBackgroundClip: "text",
                                            WebkitTextFillColor: "transparent",
                                        }}
                                        className="brand-text"
                                    >
                                        Ripple
                                    </Typography>
                                </motion.div>

                                {/* Subtitle */}
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                                    <Typography
                                        gutterBottom
                                        sx={{
                                            fontSize: isLarge ? "0.95rem" : "0.85rem",
                                            color: "rgba(255, 255, 255, 0.7)",
                                            mb: 4,
                                            fontWeight: 300,
                                        }}
                                    >
                                        Reset your password
                                    </Typography>
                                </motion.div>

                                {/* Error Alert */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                        >
                                            <Alert
                                                severity="error"
                                                sx={{
                                                    mb: 3,
                                                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                                                    border: "1px solid rgba(239, 68, 68, 0.2)",
                                                    color: "#fca5a5",
                                                    backdropFilter: "blur(10px)",
                                                    borderRadius: "12px",
                                                }}
                                            >
                                                {error}
                                            </Alert>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Email Step */}
                                {step === "email" && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                                        <form onSubmit={handleEmailSend}>
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                                                <TextField
                                                    fullWidth
                                                    placeholder="Email"
                                                    variant="standard"
                                                    margin="normal"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    sx={{
                                                        mb: 3,
                                                        "& .MuiInput-root": {
                                                            "&:before": {
                                                                borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
                                                            },
                                                            "&:hover:not(.Mui-disabled):before": {
                                                                borderBottom: "1px solid rgba(255, 255, 255, 0.5)",
                                                            },
                                                            "&:after": {
                                                                borderBottom: "2px solid rgba(99, 102, 241, 0.8)",
                                                            },
                                                        },
                                                        "& .MuiInput-input": {
                                                            color: "#fff",
                                                            fontSize: isLarge ? "1rem" : "0.9rem",
                                                            padding: "8px 0",
                                                            "&::placeholder": {
                                                                color: "rgba(255, 255, 255, 0.4)",
                                                                opacity: 1,
                                                            },
                                                        },
                                                    }}
                                                />
                                            </motion.div>
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                                                <Button
                                                    variant="contained"
                                                    disabled={loading || !email}
                                                    type="submit"
                                                    sx={{
                                                        mt: 1,
                                                        mb: 2,
                                                        borderRadius: "14px",
                                                        height: "52px",
                                                        fontSize: isLarge ? "1rem" : "0.9rem",
                                                        fontWeight: 500,
                                                        background: loading
                                                            ? "rgba(99, 102, 241, 0.4)"
                                                            : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                                        color: "#fff",
                                                        textTransform: "none",
                                                        letterSpacing: "0.5px",
                                                        transition: "all 0.3s ease",
                                                        width: "100%",
                                                        boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)",
                                                        "&:hover": {
                                                            transform: "translateY(-1px)",
                                                            boxShadow: "0 6px 20px rgba(99, 102, 241, 0.4)",
                                                            background: "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                                                        },
                                                        "&:active": {
                                                            transform: "translateY(0)",
                                                        },
                                                        "&:disabled": {
                                                            background: "rgba(255, 255, 255, 0.05)",
                                                            color: "rgba(255, 255, 255, 0.3)",
                                                            boxShadow: "none",
                                                            transform: "none",
                                                        },
                                                    }}
                                                >
                                                    {loading ? <CircularProgress size={24} thickness={4} sx={{ color: "#fff" }} /> : "Send OTP"}
                                                </Button>
                                            </motion.div>
                                        </form>
                                    </motion.div>
                                )}

                                {/* OTP Step */}
                                {step === "otp" && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                                            <Typography sx={{ mb: 3, color: "rgba(255, 255, 255, 0.7)", fontSize: isLarge ? "0.95rem" : "0.85rem" }}>
                                                Enter the 6-digit OTP sent to <b>{email}</b>
                                            </Typography>
                                        </motion.div>
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                                            <Grid container spacing={1} justifyContent="center" mb={3}>
                                                {otp.map((digit, index) => (
                                                    <Grid item key={index}>
                                                        <TextField
                                                            inputRef={(ref) => (inputRefs.current[index] = ref)}
                                                            value={digit}
                                                            onChange={(e) => handleOTPChange(index, e.target.value)}
                                                            onPaste={handleOTPPaste}
                                                            variant="standard"
                                                            InputProps={{
                                                                inputProps: {
                                                                    maxLength: 1,
                                                                    style: {
                                                                        textAlign: "center",
                                                                        fontSize: "1.5rem",
                                                                        color: "#fff",
                                                                    },
                                                                },
                                                            }}
                                                            sx={{
                                                                width: "2.65rem",
                                                                "& .MuiInput-root": {
                                                                    "&:before": {
                                                                        borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
                                                                    },
                                                                    "&:hover:not(.Mui-disabled):before": {
                                                                        borderBottom: "1px solid rgba(255, 255, 255, 0.5)",
                                                                    },
                                                                    "&:after": {
                                                                        borderBottom: "2px solid rgba(99, 102, 241, 0.8)",
                                                                    },
                                                                },
                                                            }}
                                                        />
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </motion.div>
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                                            <Button
                                                variant="contained"
                                                disabled={loading}
                                                onClick={handleOTPVerify}
                                                sx={{
                                                    mt: 1,
                                                    mb: 2,
                                                    borderRadius: "14px",
                                                    height: "52px",
                                                    fontSize: isLarge ? "1rem" : "0.9rem",
                                                    fontWeight: 500,
                                                    background: loading
                                                        ? "rgba(99, 102, 241, 0.4)"
                                                        : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                                    color: "#fff",
                                                    textTransform: "none",
                                                    letterSpacing: "0.5px",
                                                    transition: "all 0.3s ease",
                                                    width: "100%",
                                                    boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)",
                                                    "&:hover": {
                                                        transform: "translateY(-1px)",
                                                        boxShadow: "0 6px 20px rgba(99, 102, 241, 0.4)",
                                                        background: "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                                                    },
                                                    "&:active": {
                                                        transform: "translateY(0)",
                                                    },
                                                    "&:disabled": {
                                                        background: "rgba(255, 255, 255, 0.05)",
                                                        color: "rgba(255, 255, 255, 0.3)",
                                                        boxShadow: "none",
                                                        transform: "none",
                                                    },
                                                }}
                                            >
                                                {loading ? <CircularProgress size={24} thickness={4} sx={{ color: "#fff" }} /> : "Verify OTP"}
                                            </Button>
                                        </motion.div>
                                    </motion.div>
                                )}

                                {/* Reset Step */}
                                {step === "reset" && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                                            <TextField
                                                fullWidth
                                                type="password"
                                                placeholder="New Password"
                                                variant="standard"
                                                margin="normal"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                sx={{
                                                    mb: 3,
                                                    "& .MuiInput-root": {
                                                        "&:before": {
                                                            borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
                                                        },
                                                        "&:hover:not(.Mui-disabled):before": {
                                                            borderBottom: "1px solid rgba(255, 255, 255, 0.5)",
                                                        },
                                                        "&:after": {
                                                            borderBottom: "2px solid rgba(99, 102, 241, 0.8)",
                                                        },
                                                    },
                                                    "& .MuiInput-input": {
                                                        color: "#fff",
                                                        fontSize: isLarge ? "1rem" : "0.9rem",
                                                        padding: "8px 0",
                                                        "&::placeholder": {
                                                            color: "rgba(255, 255, 255, 0.4)",
                                                            opacity: 1,
                                                        },
                                                    },
                                                }}
                                            />
                                        </motion.div>
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                                            <TextField
                                                fullWidth
                                                type="password"
                                                placeholder="Confirm Password"
                                                variant="standard"
                                                margin="normal"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                sx={{
                                                    mb: 3,
                                                    "& .MuiInput-root": {
                                                        "&:before": {
                                                            borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
                                                        },
                                                        "&:hover:not(.Mui-disabled):before": {
                                                            borderBottom: "1px solid rgba(255, 255, 255, 0.5)",
                                                        },
                                                        "&:after": {
                                                            borderBottom: "2px solid rgba(99, 102, 241, 0.8)",
                                                        },
                                                    },
                                                    "& .MuiInput-input": {
                                                        color: "#fff",
                                                        fontSize: isLarge ? "1rem" : "0.9rem",
                                                        padding: "8px 0",
                                                        "&::placeholder": {
                                                            color: "rgba(255, 255, 255, 0.4)",
                                                            opacity: 1,
                                                        },
                                                    },
                                                }}
                                            />
                                        </motion.div>
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                                            <Button
                                                variant="contained"
                                                disabled={loading}
                                                onClick={handlePasswordReset}
                                                sx={{
                                                    mt: 1,
                                                    mb: 2,
                                                    borderRadius: "14px",
                                                    height: "52px",
                                                    fontSize: isLarge ? "1rem" : "0.9rem",
                                                    fontWeight: 500,
                                                    background: loading
                                                        ? "rgba(99, 102, 241, 0.4)"
                                                        : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                                    color: "#fff",
                                                    textTransform: "none",
                                                    letterSpacing: "0.5px",
                                                    transition: "all 0.3s ease",
                                                    width: "100%",
                                                    boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)",
                                                    "&:hover": {
                                                        transform: "translateY(-1px)",
                                                        boxShadow: "0 6px 20px rgba(99, 102, 241, 0.4)",
                                                        background: "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                                                    },
                                                    "&:active": {
                                                        transform: "translateY(0)",
                                                    },
                                                    "&:disabled": {
                                                        background: "rgba(255, 255, 255, 0.05)",
                                                        color: "rgba(255, 255, 255, 0.3)",
                                                        boxShadow: "none",
                                                        transform: "none",
                                                    },
                                                }}
                                            >
                                                {loading ? <CircularProgress size={24} thickness={4} sx={{ color: "#fff" }} /> : "Reset Password"}
                                            </Button>
                                        </motion.div>
                                    </motion.div>
                                )}

                                {/* Back to Login Link */}
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                                    <Typography
                                        sx={{
                                            mt: 3,
                                            color: "rgba(255, 255, 255, 0.6)",
                                            fontSize: isLarge ? "0.9rem" : "0.8rem",
                                        }}
                                    >
                                        Remember your password?{" "}
                                        <Link
                                            href="/login"
                                            sx={{
                                                color: "rgba(199, 210, 254, 0.9)",
                                                fontWeight: 500,
                                                textDecoration: "none",
                                                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                                WebkitBackgroundClip: "text",
                                                WebkitTextFillColor: "transparent",
                                                "&:hover": {
                                                    textDecoration: "underline",
                                                },
                                            }}
                                        >
                                            Back to Login
                                        </Link>
                                    </Typography>
                                </motion.div>
                            </Box>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Container>
        </div>
    );
};

export default ForgotPasswordPage;
