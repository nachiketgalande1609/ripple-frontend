import { useState, useEffect, useRef } from "react";
import { Box, Skeleton } from "@mui/material";

const VideoThumbnail = ({ src }: { src: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.preload = "metadata";
    video.src = src;

    video.addEventListener("loadeddata", () => {
      video.currentTime = 0.1;
    });

    video.addEventListener("seeked", () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      setReady(true);
      video.src = "";
    });

    video.load();

    return () => {
      video.src = "";
    };
  }, [src]);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: ready ? "block" : "none",
          position: "absolute",
          inset: 0,
        }}
      />

      {!ready && (
        <Skeleton
          variant="rectangular"
          sx={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
        />
      )}

      {/* Play badge */}
      <Box
        sx={{
          position: "absolute",
          top: 6,
          right: 6,
          bgcolor: "rgba(0,0,0,0.55)",
          borderRadius: "6px",
          px: 0.75,
          py: 0.3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box component="span" sx={{ fontSize: 10, color: "#fff", lineHeight: 1 }}>
          ▶
        </Box>
      </Box>
    </>
  );
};

export default VideoThumbnail;