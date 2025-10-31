import React, { useState, useEffect } from "react";
import { TextField, Button, Container, Typography, Box, Alert, Link, useMediaQuery, CircularProgress } from "@mui/material";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { loginUser, googleLogin, trackTraffic } from "../services/api";
import { useNavigate } from "react-router-dom";
import { useGlobalStore } from "../store/store";
import socket from "../services/socket";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Orb from "../component/plasma/Orb";

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

    const handleGoogleLogin = async (credentialResponse: any) => {
        try {
            const response = await googleLogin({ token: credentialResponse.credential });

            if (response.success) {
                const { token, user } = response.data;

                localStorage.setItem("token", token);
                localStorage.setItem("user", JSON.stringify(user));
                setUser(user);
                navigate("/");
            } else {
                setError(response.error || "Google login failed!");
            }
        } catch (err: any) {
            console.log(err);
            setError(err.response?.data?.error || "Google login failed!");
        }
    };

    return (
        <GoogleOAuthProvider clientId={"702353220748-2lmc03lb4tcfnuqds67h8bbupmb1aa0q.apps.googleusercontent.com"}>
            {/* Plasma Background */}
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

                {/* Content Layer */}
                <Container
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100svh",
                        position: "relative",
                        zIndex: 1,
                        pointerEvents: "none",
                    }}
                >
                    <AnimatePresence>
                        {checked && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                style={{ pointerEvents: "auto" }}
                            >
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

                                    <form onSubmit={handleLogin}>
                                        {/* Email Field with Animation */}
                                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
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

                                        {/* Password Field with Animation */}
                                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                                            <TextField
                                                fullWidth
                                                placeholder="Password"
                                                type="password"
                                                variant="outlined"
                                                margin="normal"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
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

                                        {/* Login Button with Animation */}
                                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                                            <Button
                                                variant="contained"
                                                disabled={loading || !email || !password}
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
                                                        Login
                                                    </motion.span>
                                                )}
                                            </Button>
                                        </motion.div>
                                    </form>

                                    {/* Forgot Password with Animation */}
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                                        <Button
                                            variant="text"
                                            fullWidth
                                            onClick={() => navigate("/reset-password")}
                                            sx={{
                                                mt: 1,
                                                color: "rgba(255, 255, 255, 0.7)",
                                                textTransform: "none",
                                                fontSize: isLarge ? "0.95rem" : "0.85rem",
                                                "&:hover": {
                                                    color: "rgba(122, 96, 255, 0.9)",
                                                    backgroundColor: "transparent",
                                                },
                                            }}
                                        >
                                            Forgot Password?
                                        </Button>
                                    </motion.div>

                                    {/* Sign Up Link with Animation */}
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                                        <Typography
                                            sx={{
                                                mt: 4,
                                                color: "rgba(255, 255, 255, 0.6)",
                                                fontSize: isLarge ? "0.95rem" : "0.85rem",
                                            }}
                                        >
                                            Don't have an account?{" "}
                                            <Link
                                                href="/register"
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
