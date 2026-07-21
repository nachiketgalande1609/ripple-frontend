import { Box, Typography } from "@mui/material";

export default function EndOfFeed({ message = "You're all caught up" }: { message?: string }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1.5,
        py: 5,
        userSelect: "none",
      }}
    >
      {/* Ripple rings illustration */}
      <Box sx={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
        {[48, 34, 20].map((size, i) => (
          <Box
            key={size}
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: size,
              height: size,
              borderRadius: "50%",
              border: "1.5px solid",
              borderColor: (t) =>
                i === 0
                  ? `${t.palette.text.disabled}22`
                  : i === 1
                  ? `${t.palette.text.disabled}44`
                  : `${t.palette.text.disabled}88`,
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
        {/* Center dot */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 6,
            height: 6,
            borderRadius: "50%",
            bgcolor: (t) => t.palette.text.disabled,
            transform: "translate(-50%, -50%)",
          }}
        />
      </Box>

      <Typography
        sx={{
          fontSize: "0.8rem",
          fontWeight: 500,
          color: (t) => t.palette.text.disabled,
          fontFamily: "'Inter', sans-serif",
          letterSpacing: "0.02em",
        }}
      >
        {message}
      </Typography>

      {/* Decorative line */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          width: "100%",
          maxWidth: 180,
        }}
      >
        <Box sx={{ flex: 1, height: "1px", bgcolor: (t) => `${t.palette.text.disabled}22` }} />
        <Box
          sx={{
            width: 4,
            height: 4,
            borderRadius: "50%",
            bgcolor: (t) => `${t.palette.text.disabled}44`,
          }}
        />
        <Box sx={{ flex: 1, height: "1px", bgcolor: (t) => `${t.palette.text.disabled}22` }} />
      </Box>
    </Box>
  );
}
