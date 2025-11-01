import React, { useState, useEffect } from "react";
import { TextField, Button, Container, Typography, Box, Alert, Link, useMediaQuery, CircularProgress } from "@mui/material";
import { registerUser } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
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
    const isLarge = useMediaQuery("(min-width:1281px)");

    useEffect(() => {
        setChecked(true);
    }, []);

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
                                        Join our community today
                                    </Typography>
                                </motion.div>

                                {/* Alerts */}
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

                                <AnimatePresence>
                                    {success && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                        >
                                            <Alert
                                                severity="success"
                                                sx={{
                                                    mb: 3,
                                                    backgroundColor: "rgba(34, 197, 94, 0.1)",
                                                    border: "1px solid rgba(34, 197, 94, 0.2)",
                                                    color: "#86efac",
                                                    backdropFilter: "blur(10px)",
                                                    borderRadius: "12px",
                                                }}
                                            >
                                                {success}
                                            </Alert>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <form onSubmit={handleRegister}>
                                    {/* Form Fields */}
                                    {["Username", "Email", "Password", "Confirm Password"].map((field, index) => {
                                        const value = [username, email, password, confirmPassword][index];
                                        const setValue = [setUsername, setEmail, setPassword, setConfirmPassword][index];

                                        return (
                                            <motion.div
                                                key={field}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3 + index * 0.1 }}
                                            >
                                                <TextField
                                                    fullWidth
                                                    placeholder={field}
                                                    type={field.toLowerCase().includes("password") ? "password" : "text"}
                                                    variant="standard"
                                                    margin="normal"
                                                    value={value}
                                                    onChange={(e) => setValue(e.target.value)}
                                                    sx={{
                                                        mb: 1,
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
                                                        "& .MuiInputLabel-root": {
                                                            color: "rgba(255, 255, 255, 0.6)",
                                                        },
                                                    }}
                                                />
                                            </motion.div>
                                        );
                                    })}

                                    {/* Register Button */}
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                                        <Button
                                            variant="contained"
                                            type="submit"
                                            disabled={loading || !email || !username || !password || !confirmPassword}
                                            sx={{
                                                mt: 3,
                                                mb: 2,
                                                borderRadius: "14px",
                                                height: "52px",
                                                fontSize: isLarge ? "1rem" : "0.9rem",
                                                fontWeight: 500,
                                                background: loading ? "rgba(99, 102, 241, 0.4)" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
                                            {loading ? <CircularProgress size={24} thickness={4} sx={{ color: "#fff" }} /> : "Create Account"}
                                        </Button>
                                    </motion.div>
                                </form>

                                {/* Login Link */}
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                                    <Typography
                                        sx={{
                                            mt: 3,
                                            color: "rgba(255, 255, 255, 0.6)",
                                            fontSize: isLarge ? "0.9rem" : "0.8rem",
                                        }}
                                    >
                                        Already have an account?{" "}
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
                                            Sign in
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
