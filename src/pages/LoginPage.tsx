import React, { useState, useEffect } from "react";
import { TextField, Button, Container, Typography, Box, Alert, Link, useMediaQuery, CircularProgress } from "@mui/material";
// import { GoogleLogin } from "@react-oauth/google";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { loginUser, trackTraffic } from "../services/api";
// import { googleLogin } from "../services/api";

import { useNavigate } from "react-router-dom";
import { useGlobalStore } from "../store/store";
import socket from "../services/socket";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Orb from "../component/plasma/Orb";
import LineWaves from "../component/LineWaves/LineWaves";

const LoginPage: React.FC = () => {
    const { setUser } = useGlobalStore();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [checked, setChecked] = useState(false);
    const [loading, setLoading] = useState(false);
    const isLarge = useMediaQuery("(min-width:1281px)");

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const ipResponse = await axios.get("https://api.ipify.org?format=json");
                const locationResponse = await axios.get(`https://ipinfo.io/${ipResponse.data.ip}/json`);

                const data = {
                    ip: ipResponse.data.ip,
                    userAgent: navigator.userAgent,
                    location: locationResponse.data.city || locationResponse.data.country,
                    referrer: document.referrer,
                };

                await trackTraffic(data);
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };

        fetchUserData();
    }, []);

    useEffect(() => {
        setChecked(true);
    }, []);

    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await loginUser({ email, password });

            if (response.success) {
                const { token, user } = response.data;

                localStorage.setItem("token", token);
                localStorage.setItem("user", JSON.stringify(user));

                socket.emit("registerUser", user.id);

                setUser(user);
                navigate("/");
            } else {
                setError(response.error || "Login failed!");
            }
        } catch (err: any) {
            console.error("Login error:", err);
            setError(err.response?.data?.error || "Login failed!");
            setLoading(false);
        }
    };

    // const handleGoogleLogin = async (credentialResponse: any) => {
    //     try {
    //         const response = await googleLogin({ token: credentialResponse.credential });

    //         if (response.success) {
    //             const { token, user } = response.data;

    //             localStorage.setItem("token", token);
    //             localStorage.setItem("user", JSON.stringify(user));
    //             setUser(user);
    //             navigate("/");
    //         } else {
    //             setError(response.error || "Google login failed!");
    //         }
    //     } catch (err: any) {
    //         console.log(err);
    //         setError(err.response?.data?.error || "Google login failed!");
    //     }
    // };

    return (
        <GoogleOAuthProvider clientId={"702353220748-2lmc03lb4tcfnuqds67h8bbupmb1aa0q.apps.googleusercontent.com"}>
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
                    <LineWaves
                        speed={0.3}
                        innerLineCount={32}
                        outerLineCount={36}
                        warpIntensity={1}
                        rotation={-45}
                        edgeFadeWidth={0}
                        colorCycleSpeed={1}
                        brightness={0.2}
                        color1="#ffffff"
                        color2="#ffffff"
                        color3="#ffffff"
                        enableMouseInteraction
                        mouseInfluence={2}
                    />
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
                                            Welcome back to your community
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

                                    <form onSubmit={handleLogin}>
                                        {/* Email Field */}
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                            <TextField
                                                fullWidth
                                                placeholder="Email"
                                                variant="standard"
                                                margin="normal"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
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
                                                }}
                                            />
                                        </motion.div>

                                        {/* Password Field */}
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                                            <TextField
                                                fullWidth
                                                placeholder="Password"
                                                type="password"
                                                variant="standard"
                                                margin="normal"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
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
                                                }}
                                            />
                                        </motion.div>

                                        {/* Login Button */}
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                                            <Button
                                                variant="contained"
                                                disabled={loading || !email || !password}
                                                type="submit"
                                                sx={{
                                                    mt: 3,
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
                                                {loading ? <CircularProgress size={24} thickness={4} sx={{ color: "#fff" }} /> : "Sign In"}
                                            </Button>
                                        </motion.div>
                                    </form>

                                    {/* Forgot Password */}
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                                        <Button
                                            variant="text"
                                            fullWidth
                                            onClick={() => navigate("/reset-password")}
                                            sx={{
                                                mt: 1,
                                                color: "rgba(255, 255, 255, 0.6)",
                                                textTransform: "none",
                                                fontSize: isLarge ? "0.9rem" : "0.8rem",
                                                fontWeight: 400,
                                                "&:hover": {
                                                    color: "rgba(199, 210, 254, 0.9)",
                                                    backgroundColor: "transparent",
                                                },
                                            }}
                                        >
                                            Forgot your password?
                                        </Button>
                                    </motion.div>

                                    {/* Sign Up Link */}
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                                        <Typography
                                            sx={{
                                                mt: 3,
                                                color: "rgba(255, 255, 255, 0.6)",
                                                fontSize: isLarge ? "0.9rem" : "0.8rem",
                                            }}
                                        >
                                            Don't have an account?{" "}
                                            <Link
                                                href="/register"
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
                                                Sign up
                                            </Link>
                                        </Typography>
                                    </motion.div>
                                </Box>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Container>
            </div>
        </GoogleOAuthProvider>
    );
};

export default LoginPage;
