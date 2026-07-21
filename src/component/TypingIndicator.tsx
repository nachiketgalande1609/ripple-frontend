import React from "react";
import { Box, Typography, keyframes } from "@mui/material";

const blink = keyframes`
  0% { opacity: 0.2; }
  50% { opacity: 1; }
  100% { opacity: 0.2; }
`;

const TypingIndicator: React.FC = () => {
    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
                mb: "6px",
            }}
        >
            <Box
                sx={{
                    backgroundColor: (t) => t.palette.background.paper,
                    padding: "4px 8px",
                    borderRadius: "8px",
                    maxWidth: "50%",
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <Typography
                    sx={{
                        fontSize: "2rem",
                        color: (t) => t.palette.text.primary,
                        display: "flex",
                        alignItems: "center",
                        lineHeight: "20px",
                        marginBottom: 1.5,
                    }}
                >
                    <Box component="span" sx={{ animation: `${blink} 1.4s infinite`, animationDelay: "0s" }}>.</Box>
                    <Box component="span" sx={{ animation: `${blink} 1.4s infinite`, animationDelay: "0.2s" }}>.</Box>
                    <Box component="span" sx={{ animation: `${blink} 1.4s infinite`, animationDelay: "0.4s" }}>.</Box>
                </Typography>
            </Box>
        </Box>
    );
};

export default TypingIndicator;
