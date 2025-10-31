import React, { useState, useEffect, useRef } from "react";
import { TextField, Button, Container, Typography, Box, Alert, Link, useMediaQuery, CircularProgress, Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { generatePasswordResetOTP, ResetPassword, verifyPasswordResetOTP } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import futuristicVideo from "../static/login_bg.mp4";
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
    const [videoLoaded, setVideoLoaded] = useState(false);
    const isLarge = useMediaQuery("(min-width:1281px)");
    const navigate = useNavigate();
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        setChecked(true);
    }, []);

    const handleVideoLoad = () => {
        setVideoLoaded(true);
        if (videoRef.current) {
            videoRef.current.playbackRate = 0.7;
        }
    };

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
                height: "100vh",
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
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
                            <Box
                                sx={{
                                    textAlign: "center",
                                    padding: isLarge ? "60px 40px" : "40px 30px",
                                    borderRadius: "16px",
                                    position: "relative",
                                    overflow: "hidden",
                                    backgroundColor: "rgba(15, 15, 25, 0.65)",
                                    backdropFilter: "blur(12px)",
                                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                                    border: "1px solid rgba(122, 96, 255, 0.3)",
                                    width: isLarge ? "440px" : "400px",
                                    boxSizing: "border-box",
                                    "&::before": {
                                        content: '""',
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: "4px",
                                        background: "linear-gradient(to right, rgb(122, 96, 255), rgb(255, 136, 0))",
                                    },
                                }}
                            >
                                {/* Heading with Animation */}
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.2, duration: 0.5 }}
                                >
                                    <Typography
                                        sx={{
                                            backgroundImage: "linear-gradient(to right, rgb(122, 96, 255), rgb(255, 136, 0))",
                                            WebkitBackgroundClip: "text",
                                            WebkitTextFillColor: "transparent",
                                            mb: 3,
                                            fontSize: isLarge ? "52px" : "42px",
                                            fontWeight: 700,
                                            letterSpacing: "1px",
                                            lineHeight: 1.2,
                                            textShadow: "0 0 10px rgba(122, 96, 255, 0.3)",
                                        }}
                                        className="lily-script-one-regular"
                                    >
                                        Ripple
                                    </Typography>
                                </motion.div>

                                {/* Error Alert with Animation */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                                            <Alert
                                                severity="error"
                                                sx={{
                                                    mb: 3,
                                                    backgroundColor: "rgba(255, 50, 50, 0.15)",
                                                    border: "1px solid rgba(255, 50, 50, 0.3)",
                                                    color: "#ff6b6b",
                                                    backdropFilter: "blur(4px)",
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
                                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                                                <TextField
                                                    fullWidth
                                                    placeholder="Email"
                                                    variant="outlined"
                                                    margin="normal"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    size={isLarge ? "medium" : "small"}
                                                    sx={{
                                                        mb: 2,
                                                        "& .MuiOutlinedInput-root": {
                                                            borderRadius: "12px",
                                                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                                                            "& fieldset": {
                                                                borderColor: "rgba(255, 255, 255, 0.1)",
                                                            },
                                                            "&:hover fieldset": {
                                                                borderColor: "rgba(122, 96, 255, 0.5)",
                                                            },
                                                            "&.Mui-focused fieldset": {
                                                                borderColor: "rgba(122, 96, 255, 0.8)",
                                                                boxShadow: "0 0 0 2px rgba(122, 96, 255, 0.2)",
                                                            },
                                                        },
                                                        "& .MuiInputBase-input": {
                                                            color: "#fff",
                                                            fontSize: isLarge ? "1rem" : "0.9rem",
                                                            padding: isLarge ? "14px 16px" : "12px 14px",
                                                        },
                                                    }}
                                                />
                                            </motion.div>
                                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                                                <Button
                                                    variant="contained"
                                                    disabled={loading || !email}
                                                    type="submit"
                                                    sx={{
                                                        mt: 2,
                                                        mb: 2,
                                                        borderRadius: "12px",
                                                        height: "48px",
                                                        fontSize: isLarge ? "1rem" : "0.9rem",
                                                        fontWeight: 600,
                                                        background: loading
                                                            ? "rgba(122, 96, 255, 0.3)"
                                                            : "linear-gradient(45deg, rgb(122, 96, 255) 0%, rgb(160, 96, 255) 100%)",
                                                        color: "#fff",
                                                        textTransform: "none",
                                                        letterSpacing: "0.5px",
                                                        transition: "all 0.3s ease",
                                                        width: "100%",
                                                        "&:hover": {
                                                            transform: "translateY(-2px)",
                                                            boxShadow: "0 8px 20px rgba(122, 96, 255, 0.4)",
                                                            background: "linear-gradient(45deg, rgb(122, 96, 255) 0%, rgb(140, 96, 255) 100%)",
                                                        },
                                                        "&:disabled": {
                                                            background: "rgba(122, 96, 255, 0.1)",
                                                            color: "rgba(255, 255, 255, 0.3)",
                                                        },
                                                    }}
                                                >
                                                    {loading ? (
                                                        <CircularProgress size={24} thickness={4} sx={{ color: "#fff" }} />
                                                    ) : (
                                                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                                                            Send OTP
                                                        </motion.span>
                                                    )}
                                                </Button>
                                            </motion.div>
                                        </form>
                                    </motion.div>
                                )}

                                {/* OTP Step */}
                                {step === "otp" && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                                            <Typography sx={{ mb: 3, color: "rgba(255, 255, 255, 0.7)" }}>
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
                                                                "& .MuiOutlinedInput-root": {
                                                                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                                                                    "& fieldset": {
                                                                        borderColor: "rgba(255, 255, 255, 0.1)",
                                                                    },
                                                                    "&:hover fieldset": {
                                                                        borderColor: "rgba(122, 96, 255, 0.5)",
                                                                    },
                                                                    "&.Mui-focused fieldset": {
                                                                        borderColor: "rgba(122, 96, 255, 0.8)",
                                                                        boxShadow: "0 0 0 2px rgba(122, 96, 255, 0.2)",
                                                                    },
                                                                },
                                                            }}
                                                        />
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </motion.div>
                                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                                            <Button
                                                variant="contained"
                                                disabled={loading}
                                                onClick={handleOTPVerify}
                                                sx={{
                                                    mt: 2,
                                                    mb: 2,
                                                    borderRadius: "12px",
                                                    height: "48px",
                                                    fontSize: isLarge ? "1rem" : "0.9rem",
                                                    fontWeight: 600,
                                                    background: loading
                                                        ? "rgba(122, 96, 255, 0.3)"
                                                        : "linear-gradient(45deg, rgb(122, 96, 255) 0%, rgb(160, 96, 255) 100%)",
                                                    color: "#fff",
                                                    textTransform: "none",
                                                    letterSpacing: "0.5px",
                                                    transition: "all 0.3s ease",
                                                    width: "100%",
                                                    "&:hover": {
                                                        transform: "translateY(-2px)",
                                                        boxShadow: "0 8px 20px rgba(122, 96, 255, 0.4)",
                                                        background: "linear-gradient(45deg, rgb(122, 96, 255) 0%, rgb(140, 96, 255) 100%)",
                                                    },
                                                    "&:disabled": {
                                                        background: "rgba(122, 96, 255, 0.1)",
                                                        color: "rgba(255, 255, 255, 0.3)",
                                                    },
                                                }}
                                            >
                                                {loading ? (
                                                    <CircularProgress size={24} thickness={4} sx={{ color: "#fff" }} />
                                                ) : (
                                                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                                                        Verify OTP
                                                    </motion.span>
                                                )}
                                            </Button>
                                        </motion.div>
                                    </motion.div>
                                )}

                                {/* Reset Step */}
                                {step === "reset" && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                                            <TextField
                                                fullWidth
                                                type="password"
                                                placeholder="New Password"
                                                variant="outlined"
                                                margin="normal"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                size={isLarge ? "medium" : "small"}
                                                sx={{
                                                    mb: 2,
                                                    "& .MuiOutlinedInput-root": {
                                                        borderRadius: "12px",
                                                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                                                        "& fieldset": {
                                                            borderColor: "rgba(255, 255, 255, 0.1)",
                                                        },
                                                        "&:hover fieldset": {
                                                            borderColor: "rgba(122, 96, 255, 0.5)",
                                                        },
                                                        "&.Mui-focused fieldset": {
                                                            borderColor: "rgba(122, 96, 255, 0.8)",
                                                            boxShadow: "0 0 0 2px rgba(122, 96, 255, 0.2)",
                                                        },
                                                    },
                                                    "& .MuiInputBase-input": {
                                                        color: "#fff",
                                                        fontSize: isLarge ? "1rem" : "0.9rem",
                                                        padding: isLarge ? "14px 16px" : "12px 14px",
                                                    },
                                                }}
                                            />
                                        </motion.div>
                                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                                            <TextField
                                                fullWidth
                                                type="password"
                                                placeholder="Confirm Password"
                                                variant="outlined"
                                                margin="normal"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                size={isLarge ? "medium" : "small"}
                                                sx={{
                                                    mb: 2,
                                                    "& .MuiOutlinedInput-root": {
                                                        borderRadius: "12px",
                                                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                                                        "& fieldset": {
                                                            borderColor: "rgba(255, 255, 255, 0.1)",
                                                        },
                                                        "&:hover fieldset": {
                                                            borderColor: "rgba(122, 96, 255, 0.5)",
                                                        },
                                                        "&.Mui-focused fieldset": {
                                                            borderColor: "rgba(122, 96, 255, 0.8)",
                                                            boxShadow: "0 0 0 2px rgba(122, 96, 255, 0.2)",
                                                        },
                                                    },
                                                    "& .MuiInputBase-input": {
                                                        color: "#fff",
                                                        fontSize: isLarge ? "1rem" : "0.9rem",
                                                        padding: isLarge ? "14px 16px" : "12px 14px",
                                                    },
                                                }}
                                            />
                                        </motion.div>
                                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                                            <Button
                                                variant="contained"
                                                disabled={loading}
                                                onClick={handlePasswordReset}
                                                sx={{
                                                    mt: 2,
                                                    mb: 2,
                                                    borderRadius: "12px",
                                                    height: "48px",
                                                    fontSize: isLarge ? "1rem" : "0.9rem",
                                                    fontWeight: 600,
                                                    background: loading
                                                        ? "rgba(122, 96, 255, 0.3)"
                                                        : "linear-gradient(45deg, rgb(122, 96, 255) 0%, rgb(160, 96, 255) 100%)",
                                                    color: "#fff",
                                                    textTransform: "none",
                                                    letterSpacing: "0.5px",
                                                    transition: "all 0.3s ease",
                                                    width: "100%",
                                                    "&:hover": {
                                                        transform: "translateY(-2px)",
                                                        boxShadow: "0 8px 20px rgba(122, 96, 255, 0.4)",
                                                        background: "linear-gradient(45deg, rgb(122, 96, 255) 0%, rgb(140, 96, 255) 100%)",
                                                    },
                                                    "&:disabled": {
                                                        background: "rgba(122, 96, 255, 0.1)",
                                                        color: "rgba(255, 255, 255, 0.3)",
                                                    },
                                                }}
                                            >
                                                {loading ? (
                                                    <CircularProgress size={24} thickness={4} sx={{ color: "#fff" }} />
                                                ) : (
                                                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                                                        Reset Password
                                                    </motion.span>
                                                )}
                                            </Button>
                                        </motion.div>
                                    </motion.div>
                                )}

                                {/* Back to Login Link with Animation */}
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                                    <Typography
                                        sx={{
                                            mt: 4,
                                            color: "rgba(255, 255, 255, 0.6)",
                                            fontSize: isLarge ? "0.95rem" : "0.85rem",
                                        }}
                                    >
                                        Remember your password?{" "}
                                        <Link
                                            href="/login"
                                            sx={{
                                                color: "rgba(122, 96, 255, 0.9)",
                                                fontWeight: 600,
                                                textDecoration: "none",
                                                "&:hover": {
                                                    color: "rgba(160, 96, 255, 0.9)",
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
