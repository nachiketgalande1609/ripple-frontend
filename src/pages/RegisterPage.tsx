import React, { useState, useEffect, useRef } from "react";
import { TextField, Button, Container, Typography, Box, Alert, Link, useMediaQuery, CircularProgress } from "@mui/material";
import { registerUser } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import futuristicVideo from "../static/login_bg.mp4"; // Replace with your video path
import Orb from "../component/plasma/Orb";

const RegisterPage: React.FC = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [checked, setChecked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [videoLoaded, setVideoLoaded] = useState(false);
    const isLarge = useMediaQuery("(min-width:1281px)");
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        setChecked(true);
    }, []);

    const handleVideoLoad = () => {
        setVideoLoaded(true);
        if (videoRef.current) {
            videoRef.current.playbackRate = 0.7; // Slow down the video slightly
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        const validUsername = /^[a-zA-Z0-9_]+$/.test(username);
        if (!validUsername) {
            setError("Only letters, numbers, underscores (_) are allowed in username.");
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            setLoading(false);
            return;
        }

        try {
            const response = await registerUser({
                email,
                username,
                password,
            });

            if (response.success) {
                setSuccess("Registration successful! A verification link has been sent to your email.");
                setUsername("");
                setEmail("");
                setPassword("");
                setConfirmPassword("");
            } else {
                setError(response.error || "Registration failed!");
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "Registration failed!");
        } finally {
            setLoading(false);
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
                                {/* Title with Animation */}
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

                                {/* Subtitle with Animation */}
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                                    <Typography
                                        gutterBottom
                                        sx={{
                                            fontSize: isLarge ? "1rem" : "0.9rem",
                                            color: "rgba(255, 255, 255, 0.7)",
                                            mb: 3,
                                        }}
                                    >
                                        Sign up to see photos and videos from your friends.
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

                                {/* Success Alert with Animation */}
                                <AnimatePresence>
                                    {success && (
                                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                                            <Alert
                                                severity="success"
                                                sx={{
                                                    mb: 3,
                                                    backgroundColor: "rgba(50, 255, 50, 0.15)",
                                                    border: "1px solid rgba(50, 255, 50, 0.3)",
                                                    color: "#6bff6b",
                                                    backdropFilter: "blur(4px)",
                                                }}
                                            >
                                                {success}
                                            </Alert>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <form onSubmit={handleRegister}>
                                    {/* Form Fields with Staggered Animation */}
                                    {["Username", "Email", "Password", "Confirm Password"].map((field, index) => {
                                        const value = [username, email, password, confirmPassword][index];
                                        const setValue = [setUsername, setEmail, setPassword, setConfirmPassword][index];

                                        return (
                                            <motion.div
                                                key={field}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.4 + index * 0.1 }}
                                            >
                                                <TextField
                                                    fullWidth
                                                    placeholder={field}
                                                    type={field.toLowerCase().includes("password") ? "password" : "text"}
                                                    variant="outlined"
                                                    margin="normal"
                                                    value={value}
                                                    onChange={(e) => setValue(e.target.value)}
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
                                        );
                                    })}

                                    {/* Register Button with Animation */}
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
                                        <Button
                                            variant="contained"
                                            type="submit"
                                            disabled={loading || !email || !username || !password || !confirmPassword}
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
                                                    Sign Up
                                                </motion.span>
                                            )}
                                        </Button>
                                    </motion.div>
                                </form>

                                {/* Login Link with Animation */}
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
                                    <Typography
                                        sx={{
                                            mt: 4,
                                            color: "rgba(255, 255, 255, 0.6)",
                                            fontSize: isLarge ? "0.95rem" : "0.85rem",
                                        }}
                                    >
                                        Already have an account?{" "}
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
                                            Log in
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

export default RegisterPage;
