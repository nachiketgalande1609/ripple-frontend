import React from "react";
import { Box, keyframes } from "@mui/material";

const blink = keyframes`
  0% { opacity: 0.3; }
  50% { opacity: 1; }
  100% { opacity: 0.3; }
`;

interface TypingIndicatorProps {
  profilePicture?: string;
  isDark?: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ profilePicture, isDark }) => (
  <Box sx={{ display: "flex", mb: "6px", flexDirection: "row", justifyContent: "flex-start", alignItems: "flex-start", gap: 0.75 }}>
    {profilePicture && (
      <Box
        component="img"
        src={profilePicture}
        sx={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover", flexShrink: 0, mb: "2px", mt: "4px", opacity: 0.9 }}
      />
    )}
    <Box
      sx={{
        backgroundColor: (t) => t.palette.background.paper,
        padding: "14px 14px",
        borderRadius: "4px 14px 14px 14px",
        border: "1px solid",
        borderColor: (t) => t.palette.divider,
        boxShadow: isDark ? "0 1px 3px rgba(0,0,0,0.2)" : "0 1px 3px rgba(0,0,0,0.06)",
        display: "flex",
        alignItems: "center",
        gap: "5px",
      }}
    >
      {[0, 0.2, 0.4].map((delay, i) => (
        <Box
          key={i}
          component="span"
          sx={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            backgroundColor: (t) => t.palette.text.disabled,
            display: "inline-block",
            animation: `${blink} 1.4s infinite`,
            animationDelay: `${delay}s`,
          }}
        />
      ))}
    </Box>
  </Box>
);

export default TypingIndicator;
