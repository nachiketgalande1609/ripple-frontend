import { useState, useEffect, useRef } from "react";
import { VolumeOff, VolumeUp } from "@mui/icons-material";

const VideoPlayer = ({ src }: { src: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = true;
    vid.crossOrigin = "anonymous";
    vid.src = src;
    vid.load();
    return () => {
      vid.pause();
      vid.removeAttribute("src");
      vid.load();
    };
  }, [src]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play().catch((err) => {
        if (err.name !== "AbortError") console.error(err);
      });
    } else {
      vid.pause();
    }
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 300,
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        playsInline
        preload="metadata"
        crossOrigin="anonymous"
        loop
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
          pointerEvents: "none",
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={(e) => {
          const vid = e.currentTarget;
          if (vid.duration) setProgress((vid.currentTime / vid.duration) * 100);
        }}
        onError={(e) => {
          const err = e.currentTarget.error;
          console.error("Video error:", err?.code, err?.message);
        }}
      />

      {!isPlaying && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "rgba(0,0,0,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 20, color: "#fff", marginLeft: 4 }}>▶</span>
          </div>
        </div>
      )}

      <div style={{
        position: "absolute", bottom: 0, left: 0,
        height: 2, width: `${progress}%`,
        background: "rgba(255,255,255,0.85)",
        pointerEvents: "none",
        transition: "width 0.1s linear",
      }} />

      <button
        onClick={(e) => {
          e.stopPropagation();
          const newMuted = !isMuted;
          setIsMuted(newMuted);
          if (videoRef.current) videoRef.current.muted = newMuted;
        }}
        style={{
          position: "absolute", bottom: 14, right: 14,
          width: 32, height: 32, borderRadius: "50%",
          background: "rgba(0,0,0,0.5)",
          border: "0.5px solid rgba(255,255,255,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", padding: 0, zIndex: 2,
        }}
      >
        {isMuted
          ? <VolumeOff style={{ fontSize: 15, color: "#fff" }} />
          : <VolumeUp style={{ fontSize: 15, color: "#fff" }} />}
      </button>
    </div>
  );
};

export default VideoPlayer;