import { useState, useRef, useEffect, useCallback } from "react";
import { Box, IconButton, Typography, Avatar, Tooltip } from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import BlankProfileImage from "../static/profile_blank.png";

interface VideoCallModalProps {
    open: boolean;
    onClose: () => void;
    callerId: number;
    receiverId: number;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    pc: RTCPeerConnection | null;
    handleEndCall: () => void;
    localUsername?: string;
    localProfilePicture?: string;
    remoteUsername?: string;
    remoteProfilePicture?: string;
}

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function VideoCallModal({
    open,
    localStream,
    remoteStream,
    pc,
    handleEndCall,
    localUsername = "You",
    localProfilePicture,
    remoteUsername = "Remote",
    remoteProfilePicture,
}: VideoCallModalProps) {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isSharing, setIsSharing] = useState(false);
    const [isSwapped, setIsSwapped] = useState(false);
    const [callSeconds, setCallSeconds] = useState(0);
    const [showControls, setShowControls] = useState(true);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const screenTrackRef = useRef<MediaStreamTrack | null>(null);
    const originalVideoTrackRef = useRef<MediaStreamTrack | null>(null);
    const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Attach streams to video elements
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // Call duration timer
    useEffect(() => {
        if (!open) { setCallSeconds(0); return; }
        const id = setInterval(() => setCallSeconds((s) => s + 1), 1000);
        return () => clearInterval(id);
    }, [open]);

    // Auto-hide controls after 4s of inactivity
    const resetControlsTimer = useCallback(() => {
        setShowControls(true);
        if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
        hideControlsTimer.current = setTimeout(() => setShowControls(false), 4000);
    }, []);

    useEffect(() => {
        resetControlsTimer();
        return () => { if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current); };
    }, [resetControlsTimer]);

    const toggleMic = () => {
        localStream?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
        setIsMuted((m) => !m);
        resetControlsTimer();
    };

    const toggleVideo = () => {
        localStream?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
        setIsVideoOn((v) => !v);
        resetControlsTimer();
    };

    const restoreCameraTrack = useCallback(async () => {
        if (!originalVideoTrackRef.current) return;
        if (pc) {
            const sender = pc.getSenders().find((s) => s.track?.kind === "video");
            if (sender) await sender.replaceTrack(originalVideoTrackRef.current);
        }
        if (localStream) {
            localStream.getVideoTracks().forEach((t) => localStream.removeTrack(t));
            localStream.addTrack(originalVideoTrackRef.current);
            if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
        }
        originalVideoTrackRef.current = null;
    }, [pc, localStream]);

    const toggleScreenShare = async () => {
        resetControlsTimer();
        if (isSharing) {
            screenTrackRef.current?.stop();
            screenTrackRef.current = null;
            await restoreCameraTrack();
            setIsSharing(false);
        } else {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const screenTrack = screenStream.getVideoTracks()[0];
                screenTrackRef.current = screenTrack;
                originalVideoTrackRef.current = localStream?.getVideoTracks()[0] ?? null;

                if (pc) {
                    const sender = pc.getSenders().find((s) => s.track?.kind === "video");
                    if (sender) await sender.replaceTrack(screenTrack);
                }
                if (localStream) {
                    localStream.getVideoTracks().forEach((t) => localStream.removeTrack(t));
                    localStream.addTrack(screenTrack);
                    if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
                }

                screenTrack.onended = async () => {
                    screenTrackRef.current = null;
                    await restoreCameraTrack();
                    setIsSharing(false);
                };

                setIsSharing(true);
            } catch {
                // User cancelled or denied — do nothing
            }
        }
    };

    const mainVideoRef = isSwapped ? localVideoRef : remoteVideoRef;
    const pipVideoRef = isSwapped ? remoteVideoRef : localVideoRef;
    const mainStream = isSwapped ? localStream : remoteStream;
    const pipStream = isSwapped ? remoteStream : localStream;
    const mainUsername = isSwapped ? localUsername : remoteUsername;
    const pipUsername = isSwapped ? remoteUsername : localUsername;
    const mainPicture = isSwapped ? localProfilePicture : remoteProfilePicture;
    const pipPicture = isSwapped ? remoteProfilePicture : localProfilePicture;

    if (!open) return null;

    return (
        <Box
            onMouseMove={resetControlsTimer}
            onTouchStart={resetControlsTimer}
            sx={{
                position: "fixed",
                inset: 0,
                zIndex: 1400,
                bgcolor: "#0d0d0d",
                display: "flex",
                flexDirection: "column",
                userSelect: "none",
                fontFamily: "'Inter', sans-serif",
            }}
        >
            {/* ── Main video area ── */}
            <Box sx={{ position: "relative", flex: 1, overflow: "hidden", bgcolor: "#111" }}>
                {mainStream ? (
                    <Box
                        component="video"
                        ref={mainVideoRef as any}
                        autoPlay
                        playsInline
                        muted={isSwapped}
                        sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                ) : (
                    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
                        <Avatar
                            src={mainPicture || BlankProfileImage}
                            sx={{ width: { xs: 88, sm: 120 }, height: { xs: 88, sm: 120 }, border: "3px solid rgba(255,255,255,0.1)", boxShadow: "0 0 0 8px rgba(255,255,255,0.04)" }}
                        />
                        <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.9rem", fontWeight: 500 }}>
                            {mainUsername}
                        </Typography>
                    </Box>
                )}

                {/* ── Top gradient + info ── */}
                <Box
                    sx={{
                        position: "absolute",
                        top: 0, left: 0, right: 0,
                        px: { xs: 2.5, sm: 3.5 },
                        pt: { xs: 2, sm: 2.5 },
                        pb: 4,
                        background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        opacity: showControls ? 1 : 0,
                        transition: "opacity 0.35s ease",
                        pointerEvents: "none",
                    }}
                >
                    <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: { xs: "1rem", sm: "1.1rem" }, textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>
                        {mainUsername}
                    </Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.82rem", fontWeight: 500, letterSpacing: "0.06em", textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>
                        {formatDuration(callSeconds)}
                    </Typography>
                </Box>

                {/* ── PiP window ── */}
                <Tooltip title="Tap to swap" placement="left">
                    <Box
                        onClick={() => { setIsSwapped((s) => !s); resetControlsTimer(); }}
                        sx={{
                            position: "absolute",
                            bottom: { xs: 14, sm: 20 },
                            right: { xs: 14, sm: 20 },
                            width: { xs: 86, sm: 116 },
                            height: { xs: 124, sm: 164 },
                            borderRadius: "12px",
                            overflow: "hidden",
                            border: "1.5px solid rgba(255,255,255,0.15)",
                            bgcolor: "#1c1c1c",
                            cursor: "pointer",
                            boxShadow: "0 8px 28px rgba(0,0,0,0.55)",
                            transition: "transform 0.15s, box-shadow 0.15s",
                            "&:hover": { transform: "scale(1.03)", boxShadow: "0 10px 34px rgba(0,0,0,0.65)" },
                            "&:active": { transform: "scale(0.97)" },
                        }}
                    >
                        {pipStream ? (
                            <Box
                                component="video"
                                ref={pipVideoRef as any}
                                autoPlay
                                playsInline
                                muted={!isSwapped}
                                sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            />
                        ) : (
                            <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1, bgcolor: "#1c1c1c" }}>
                                <Avatar src={pipPicture || BlankProfileImage} sx={{ width: 36, height: 36 }} />
                                <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.62rem" }}>
                                    {pipUsername}
                                </Typography>
                            </Box>
                        )}
                        {/* Swap icon overlay on hover */}
                        <Box sx={{
                            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                            opacity: 0, transition: "opacity 0.2s",
                            bgcolor: "rgba(0,0,0,0.3)",
                            ".MuiBox-root:hover &": { opacity: 1 },
                        }}>
                            <SwapHorizIcon sx={{ color: "#fff", fontSize: 22 }} />
                        </Box>
                    </Box>
                </Tooltip>
            </Box>

            {/* ── Controls bar ── */}
            <Box
                sx={{
                    flexShrink: 0,
                    bgcolor: "rgba(0,0,0,0.85)",
                    backdropFilter: "blur(16px)",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    py: { xs: 2, sm: 2.5 },
                    px: { xs: 2, sm: 4 },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: { xs: 1.5, sm: 2.5 },
                    pb: { xs: "max(env(safe-area-inset-bottom, 8px), 16px)", sm: "20px" },
                    opacity: showControls ? 1 : 0,
                    transition: "opacity 0.35s ease",
                }}
            >
                <Tooltip title={isMuted ? "Unmute" : "Mute"} placement="top">
                    <IconButton
                        onClick={toggleMic}
                        sx={{
                            width: { xs: 50, sm: 56 },
                            height: { xs: 50, sm: 56 },
                            bgcolor: isMuted ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)",
                            color: "#fff",
                            border: "1px solid rgba(255,255,255,0.1)",
                            transition: "background 0.2s",
                            "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
                        }}
                    >
                        {isMuted ? <MicOffIcon sx={{ fontSize: { xs: 21, sm: 23 } }} /> : <MicIcon sx={{ fontSize: { xs: 21, sm: 23 } }} />}
                    </IconButton>
                </Tooltip>

                <Tooltip title={isVideoOn ? "Turn off camera" : "Turn on camera"} placement="top">
                    <IconButton
                        onClick={toggleVideo}
                        sx={{
                            width: { xs: 50, sm: 56 },
                            height: { xs: 50, sm: 56 },
                            bgcolor: !isVideoOn ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)",
                            color: "#fff",
                            border: "1px solid rgba(255,255,255,0.1)",
                            transition: "background 0.2s",
                            "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
                        }}
                    >
                        {isVideoOn
                            ? <VideocamIcon sx={{ fontSize: { xs: 21, sm: 23 } }} />
                            : <VideocamOffIcon sx={{ fontSize: { xs: 21, sm: 23 } }} />}
                    </IconButton>
                </Tooltip>

                {/* Screen share — hidden on mobile (not supported in most mobile browsers) */}
                <Tooltip title={isSharing ? "Stop sharing" : "Share screen"} placement="top">
                    <IconButton
                        onClick={toggleScreenShare}
                        sx={{
                            display: { xs: "none", sm: "inline-flex" },
                            width: 56,
                            height: 56,
                            bgcolor: isSharing ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.07)",
                            color: isSharing ? "#a5b4fc" : "#fff",
                            border: isSharing ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.1)",
                            transition: "background 0.2s, border-color 0.2s",
                            "&:hover": { bgcolor: isSharing ? "rgba(99,102,241,0.45)" : "rgba(255,255,255,0.22)" },
                        }}
                    >
                        {isSharing ? <StopScreenShareIcon sx={{ fontSize: 23 }} /> : <ScreenShareIcon sx={{ fontSize: 23 }} />}
                    </IconButton>
                </Tooltip>

                {/* End call */}
                <Tooltip title="End call" placement="top">
                    <IconButton
                        onClick={handleEndCall}
                        sx={{
                            width: { xs: 60, sm: 66 },
                            height: { xs: 60, sm: 66 },
                            bgcolor: "#e53935",
                            color: "#fff",
                            boxShadow: "0 4px 18px rgba(229,57,53,0.4)",
                            transition: "background 0.2s, box-shadow 0.2s",
                            "&:hover": { bgcolor: "#c62828", boxShadow: "0 6px 22px rgba(229,57,53,0.55)" },
                        }}
                    >
                        <CallEndIcon sx={{ fontSize: { xs: 26, sm: 28 } }} />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );
}
