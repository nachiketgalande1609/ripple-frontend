import React, { useEffect, useRef, useState, useCallback } from "react";
import { Box, Modal, IconButton, Tooltip, useMediaQuery, useTheme } from "@mui/material";
import {
    CallEnd,
    Mic,
    MicOff,
    Videocam,
    VideocamOff,
    ScreenShare,
    StopScreenShare,
    People,
    Chat,
    SignalCellularAlt,
    BackHand,
    MoreVert,
    Send,
    Close,
} from "@mui/icons-material";
import { styled, keyframes } from "@mui/material/styles";

// ─── Animations ──────────────────────────────────────────────────────────────

const fadeSlideUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const handPop = keyframes`
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
  40%  { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
  70%  { transform: translate(-50%, -50%) scale(0.95); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Participant {
    id: number;
    initials: string;
    name: string;
    role?: string;
    isMuted?: boolean;
    isSpeaking?: boolean;
}

interface ChatMessage {
    id: number;
    sender: string;
    text: string;
    isSelf?: boolean;
    timestamp: string;
}

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

// ─── Styled Components ────────────────────────────────────────────────────────

const ModalRoot = styled(Box)({
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "stretch",
    justifyContent: "stretch",
    backgroundColor: "#000",
    zIndex: 1300,
});

const CallContainer = styled(Box)({
    position: "relative",
    width: "100vw",
    height: "100dvh",
    background: "#0e0e0e",
    borderRadius: 0,
    overflow: "hidden",
    border: "none",
    display: "flex",
    flexDirection: "column",
    margin: 0,
    flex: 1,
});

const RemoteVideo = styled("video")({
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
});

const VideoPlaceholder = styled(Box)({
    width: "100%",
    height: "100%",
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
});

const AvatarCircle = styled(Box)<{ size?: number; color?: string }>(({ size = 72, color = "#378ADD" }) => ({
    width: size,
    height: size,
    borderRadius: "50%",
    background: `${color}22`,
    border: `2px solid ${color}44`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: size * 0.33,
    color,
    fontWeight: 600,
    flexShrink: 0,
    fontFamily: "'DM Mono', monospace",
}));

const PiPWrapper = styled(Box)(({ theme }) => ({
    position: "absolute",
    width: 160,
    height: 110,
    borderRadius: 10,
    overflow: "hidden",
    border: "2px solid rgba(55,138,221,0.45)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
    background: "#1e2a38",
    zIndex: 10,
    userSelect: "none",
    [theme.breakpoints.down("sm")]: {
        width: 100,
        height: 70,
        borderRadius: 6,
    },
}));

const PiPVideo = styled("video")({
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: "scaleX(-1)",
});

const TopBar = styled(Box)({
    position: "absolute",
    top: 16,
    left: 0,
    right: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    zIndex: 20,
    pointerEvents: "none",
});

const Badge = styled(Box)({
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(6px)",
    borderRadius: 8,
    padding: "5px 10px",
    display: "flex",
    alignItems: "center",
    gap: 6,
    pointerEvents: "auto",
});

const CallerName = styled(Box)({
    position: "absolute",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(6px)",
    borderRadius: 8,
    padding: "5px 14px",
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: "nowrap",
    zIndex: 20,
    fontFamily: "'DM Mono', monospace",
    letterSpacing: "0.02em",
});

const BottomBar = styled(Box)(({ theme }) => ({
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    minHeight: 76,
    height: "auto",
    background: "rgba(5,5,5,0.88)",
    backdropFilter: "blur(12px)",
    borderTop: "0.5px solid rgba(255,255,255,0.07)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
    padding: "12px 16px",
    paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
    zIndex: 20,
    [theme.breakpoints.down("sm")]: {
        justifyContent: "center",
        gap: 6,
        padding: "10px 12px",
        paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
    },
}));

const ControlGroup = styled(Box)(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    gap: 6,
    [theme.breakpoints.down("sm")]: {
        gap: 4,
    },
}));

const ControlBtn = styled(IconButton)<{ active?: boolean }>(({ active }) => ({
    width: 40,
    height: 40,
    borderRadius: 8,
    background: active ? "rgba(55,138,221,0.25)" : "rgba(255,255,255,0.08)",
    border: active ? "0.5px solid rgba(55,138,221,0.4)" : "0.5px solid rgba(255,255,255,0.12)",
    color: active ? "#378ADD" : "rgba(255,255,255,0.75)",
    transition: "all 0.15s ease",
    "&:hover": {
        background: active ? "rgba(55,138,221,0.35)" : "rgba(255,255,255,0.14)",
    },
}));

const RoundBtn = styled(IconButton)<{ danger?: boolean; off?: boolean }>(({ danger, off }) => ({
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: danger ? "#E24B4A" : off ? "#E24B4A" : "rgba(255,255,255,0.1)",
    border: danger ? "none" : off ? "none" : "0.5px solid rgba(255,255,255,0.15)",
    color: "#fff",
    transition: "all 0.15s ease",
    "&:hover": {
        background: danger ? "#c73a39" : off ? "#c73a39" : "rgba(255,255,255,0.18)",
        transform: "scale(1.05)",
    },
    "&:active": { transform: "scale(0.95)" },
}));

const EndBtn = styled(IconButton)({
    width: 52,
    height: 52,
    borderRadius: "50%",
    background: "#E24B4A",
    border: "none",
    color: "#fff",
    transition: "all 0.15s ease",
    "&:hover": {
        background: "#c73a39",
        transform: "scale(1.05)",
    },
    "&:active": { transform: "scale(0.95)" },
});

const SidePanel = styled(Box)(({ theme }) => ({
    position: "absolute",
    top: 0,
    right: 0,
    width: 240,
    height: "100%",
    background: "rgba(8,8,8,0.96)",
    backdropFilter: "blur(10px)",
    borderLeft: "0.5px solid rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
    zIndex: 15,
    animation: `${fadeSlideUp} 0.2s ease`,
    [theme.breakpoints.down("sm")]: {
        width: "100%",
        top: "auto",
        bottom: 0,
        right: 0,
        height: "60%",
        borderLeft: "none",
        borderTop: "0.5px solid rgba(255,255,255,0.1)",
        borderRadius: "12px 12px 0 0",
    },
}));

const PanelHeader = styled(Box)({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 14px 10px",
    borderBottom: "0.5px solid rgba(255,255,255,0.07)",
});

const PanelTitle = styled(Box)({
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontFamily: "'DM Mono', monospace",
});

const ParticipantRow = styled(Box)<{ speaking?: boolean }>(({ speaking }) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 10px",
    borderRadius: 8,
    background: speaking ? "rgba(55,138,221,0.08)" : "rgba(255,255,255,0.03)",
    border: speaking ? "0.5px solid rgba(55,138,221,0.2)" : "0.5px solid transparent",
    marginBottom: 6,
    transition: "all 0.2s",
}));

const MessageBubble = styled(Box)<{ isSelf?: boolean }>(({ isSelf }) => ({
    maxWidth: "85%",
    alignSelf: isSelf ? "flex-end" : "flex-start",
    background: isSelf ? "rgba(55,138,221,0.15)" : "rgba(255,255,255,0.06)",
    borderRadius: isSelf ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
    padding: "8px 10px",
    animation: `${fadeSlideUp} 0.18s ease`,
}));

const ChatInput = styled("input")({
    flex: 1,
    background: "rgba(255,255,255,0.06)",
    border: "0.5px solid rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: "7px 12px",
    color: "#fff",
    fontSize: 12,
    fontFamily: "inherit",
    outline: "none",
    "&:focus": { borderColor: "rgba(55,138,221,0.5)" },
    "&::placeholder": { color: "rgba(255,255,255,0.3)" },
});

const Toast = styled(Box)({
    position: "absolute",
    top: 54,
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(20,20,20,0.95)",
    border: "0.5px solid rgba(255,255,255,0.12)",
    borderRadius: 8,
    padding: "7px 16px",
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    whiteSpace: "nowrap",
    zIndex: 50,
    pointerEvents: "none",
    animation: `${fadeSlideUp} 0.15s ease`,
    fontFamily: "'DM Mono', monospace",
});

const HandOverlay = styled(Box)({
    position: "absolute",
    top: "50%",
    left: "50%",
    fontSize: 72,
    zIndex: 40,
    pointerEvents: "none",
    animation: `${handPop} 1.6s ease forwards`,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
}

function now(): string {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getInitials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");
}

// ─── Component ────────────────────────────────────────────────────────────────

const VideoCallModal: React.FC<VideoCallModalProps> = ({
    open,
    onClose,
    localStream,
    remoteStream,
    handleEndCall,
    localUsername = "You",
    localProfilePicture,
    remoteUsername = "Remote",
    remoteProfilePicture,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const chatBottomRef = useRef<HTMLDivElement>(null);
    const chatInputRef = useRef<HTMLInputElement>(null);

    const localInitials = getInitials(localUsername);
    const remoteInitials = getInitials(remoteUsername);

    const participants: Participant[] = [
        { id: 1, initials: remoteInitials, name: remoteUsername, role: "Host" },
        { id: 2, initials: localInitials, name: localUsername },
    ];

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isSharing, setIsSharing] = useState(false);
    const [isHandRaised, setIsHandRaised] = useState(false);
    const [activePanel, setActivePanel] = useState<"participants" | "chat" | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatText, setChatText] = useState("");
    const [callSeconds, setCallSeconds] = useState(0);
    const [toast, setToast] = useState<string | null>(null);
    const [showHandOverlay, setShowHandOverlay] = useState(false);

    type Corner = "bottom-right" | "bottom-left" | "top-right" | "top-left";
    const [pipCorner, setPipCorner] = useState<Corner>("bottom-right");
    const [isDragging, setIsDragging] = useState(false);
    const [isSwapped, setIsSwapped] = useState(false);
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Responsive PiP dimensions\
    const MARGIN = isMobile ? 8 : 16;

    // Bottom bar height — accounts for safe area dynamically via CSS but we
    // need a JS number for the snap-corner calculation.
    const BAR_H = isMobile ? 88 : 76;

    const cornerStyles: Record<Corner, React.CSSProperties> = {
        "bottom-right": { bottom: BAR_H + MARGIN, right: MARGIN, top: "auto", left: "auto" },
        "bottom-left": { bottom: BAR_H + MARGIN, left: MARGIN, top: "auto", right: "auto" },
        "top-right": { top: 56, right: MARGIN, bottom: "auto", left: "auto" },
        "top-left": { top: 56, left: MARGIN, bottom: "auto", right: "auto" },
    };

    const snapToCorner = useCallback((clientX: number, clientY: number) => {
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const relX = clientX - rect.left;
        const relY = clientY - rect.top;
        const midX = rect.width / 2;
        const midY = rect.height / 2;
        const isRight = relX > midX;
        const isBottom = relY > midY;
        const corner: Corner =
            isBottom && isRight ? "bottom-right" : isBottom && !isRight ? "bottom-left" : !isBottom && isRight ? "top-right" : "top-left";
        setPipCorner(corner);
    }, []);

    const showToast = useCallback((msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 2200);
    }, []);

    const handlePipMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            dragStartRef.current = { x: e.clientX, y: e.clientY };
            setIsDragging(false);

            const onMouseMove = (me: MouseEvent) => {
                if (!dragStartRef.current) return;
                const dx = Math.abs(me.clientX - dragStartRef.current.x);
                const dy = Math.abs(me.clientY - dragStartRef.current.y);
                if (dx > 6 || dy > 6) setIsDragging(true);
                snapToCorner(me.clientX, me.clientY);
            };

            const onMouseUp = (me: MouseEvent) => {
                window.removeEventListener("mousemove", onMouseMove);
                window.removeEventListener("mouseup", onMouseUp);
                const wasDragging =
                    dragStartRef.current && (Math.abs(me.clientX - dragStartRef.current.x) > 6 || Math.abs(me.clientY - dragStartRef.current.y) > 6);
                dragStartRef.current = null;
                setIsDragging(false);
                if (!wasDragging) {
                    setIsSwapped((v) => !v);
                    showToast("Views swapped");
                }
            };

            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);
        },
        [snapToCorner, showToast],
    );

    const handlePipTouchStart = useCallback(
        (e: React.TouchEvent) => {
            const touch = e.touches[0];
            dragStartRef.current = { x: touch.clientX, y: touch.clientY };
            setIsDragging(false);

            const onTouchMove = (te: TouchEvent) => {
                const t = te.touches[0];
                if (!dragStartRef.current) return;
                const dx = Math.abs(t.clientX - dragStartRef.current.x);
                const dy = Math.abs(t.clientY - dragStartRef.current.y);
                if (dx > 6 || dy > 6) setIsDragging(true);
                snapToCorner(t.clientX, t.clientY);
            };

            const onTouchEnd = (te: TouchEvent) => {
                window.removeEventListener("touchmove", onTouchMove);
                window.removeEventListener("touchend", onTouchEnd);
                const lastTouch = te.changedTouches[0];
                const wasDragging =
                    dragStartRef.current &&
                    (Math.abs(lastTouch.clientX - dragStartRef.current.x) > 6 || Math.abs(lastTouch.clientY - dragStartRef.current.y) > 6);
                dragStartRef.current = null;
                setIsDragging(false);
                if (!wasDragging) {
                    setIsSwapped((v) => !v);
                    showToast("Views swapped");
                }
            };

            window.addEventListener("touchmove", onTouchMove, { passive: true });
            window.addEventListener("touchend", onTouchEnd);
        },
        [snapToCorner, showToast],
    );

    // Timer
    useEffect(() => {
        if (!open) return;
        const interval = setInterval(() => setCallSeconds((s) => s + 1), 1000);
        return () => clearInterval(interval);
    }, [open]);

    // Reset state when modal opens
    useEffect(() => {
        if (open) {
            setCallSeconds(0);
            setIsMuted(false);
            setIsVideoOn(true);
            setIsSharing(false);
            setIsHandRaised(false);
            setActivePanel(null);
            setMessages([]);
            setChatText("");
            setToast(null);
            setShowHandOverlay(false);
            setIsSwapped(false);
            setPipCorner("bottom-right");
        }
    }, [open]);

    // Stream binding
    useEffect(() => {
        if (localStream && localVideoRef.current) localVideoRef.current.srcObject = localStream;
    }, [localStream, open]);

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
    }, [remoteStream, open]);

    // Scroll chat to bottom
    useEffect(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const toggleMic = () => {
        localStream?.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
        setIsMuted((v) => !v);
        showToast(isMuted ? "Mic on" : "Mic muted");
    };

    const toggleVideo = () => {
        localStream?.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
        setIsVideoOn((v) => !v);
        showToast(isVideoOn ? "Camera off" : "Camera on");
    };

    const toggleShare = () => {
        setIsSharing((v) => !v);
        showToast(isSharing ? "Screen sharing stopped" : "Screen sharing started");
    };

    const toggleHand = () => {
        setIsHandRaised((v) => !v);
        if (!isHandRaised) {
            setShowHandOverlay(true);
            setTimeout(() => setShowHandOverlay(false), 1600);
        }
        showToast(isHandRaised ? "Hand lowered" : "Hand raised");
    };

    const togglePanel = (panel: "participants" | "chat") => {
        setActivePanel((prev) => (prev === panel ? null : panel));
    };

    const sendMessage = () => {
        const text = chatText.trim();
        if (!text) return;
        setMessages((prev) => [...prev, { id: Date.now(), sender: "You", text, isSelf: true, timestamp: now() }]);
        setChatText("");
        chatInputRef.current?.focus();
    };

    if (!open) return null;

    return (
        <Modal
            open={open}
            onClose={onClose}
            closeAfterTransition
            slotProps={{
                backdrop: {
                    style: { touchAction: "none", backgroundColor: "#000" },
                },
            }}
            sx={{ margin: 0, padding: 0 }}
        >
            <ModalRoot>
                <CallContainer ref={containerRef}>
                    {/* ── Main Video Area ── */}
                    <Box sx={{ flex: 1, position: "relative", overflow: "hidden" }}>
                        {/* Main feed */}
                        {isSwapped ? (
                            localStream ? (
                                <RemoteVideo ref={localVideoRef} autoPlay muted playsInline style={{ transform: "scaleX(-1)" }} />
                            ) : (
                                <VideoPlaceholder>
                                    {localProfilePicture ? (
                                        <Box
                                            component="img"
                                            src={localProfilePicture}
                                            sx={{
                                                width: { xs: 64, sm: 80 },
                                                height: { xs: 64, sm: 80 },
                                                borderRadius: "50%",
                                                objectFit: "cover",
                                                border: "2px solid rgba(74,222,128,0.4)",
                                            }}
                                        />
                                    ) : (
                                        <AvatarCircle size={isMobile ? 64 : 80} color="#4ade80">
                                            {localInitials}
                                        </AvatarCircle>
                                    )}
                                    <Box
                                        sx={{
                                            color: "rgba(255,255,255,0.4)",
                                            fontSize: { xs: 12, sm: 13 },
                                            fontFamily: "'DM Mono', monospace",
                                        }}
                                    >
                                        {localUsername} · Camera {isVideoOn ? "on" : "off"}
                                    </Box>
                                </VideoPlaceholder>
                            )
                        ) : remoteStream ? (
                            <RemoteVideo ref={remoteVideoRef} autoPlay playsInline style={{ transform: "scaleX(-1)" }} />
                        ) : (
                            <VideoPlaceholder>
                                {remoteProfilePicture ? (
                                    <Box
                                        component="img"
                                        src={remoteProfilePicture}
                                        sx={{
                                            width: { xs: 64, sm: 80 },
                                            height: { xs: 64, sm: 80 },
                                            borderRadius: "50%",
                                            objectFit: "cover",
                                            border: "2px solid rgba(55,138,221,0.4)",
                                        }}
                                    />
                                ) : (
                                    <AvatarCircle size={isMobile ? 64 : 80}>{remoteInitials}</AvatarCircle>
                                )}
                                <Box
                                    sx={{
                                        color: "rgba(255,255,255,0.4)",
                                        fontSize: { xs: 12, sm: 13 },
                                        fontFamily: "'DM Mono', monospace",
                                    }}
                                >
                                    {remoteUsername} · Camera off
                                </Box>
                            </VideoPlaceholder>
                        )}

                        {/* ── Top Bar ── */}
                        <TopBar>
                            <Box sx={{ display: "flex", gap: 1, pointerEvents: "auto" }}>
                                <Badge>
                                    <Box
                                        component="span"
                                        sx={{
                                            color: "rgba(255,255,255,0.5)",
                                            fontSize: 11,
                                            fontFamily: "'DM Mono', monospace",
                                        }}
                                    >
                                        {formatTime(callSeconds)}
                                    </Box>
                                </Badge>
                            </Box>

                            <Box sx={{ display: "flex", gap: 1, pointerEvents: "auto" }}>
                                {/* Hide HD badge on very small screens */}
                                <Badge sx={{ display: { xs: "none", sm: "flex" } }}>
                                    <Box
                                        component="span"
                                        sx={{
                                            color: "#4ade80",
                                            fontSize: 11,
                                            fontWeight: 600,
                                            fontFamily: "'DM Mono', monospace",
                                        }}
                                    >
                                        HD · 1080p
                                    </Box>
                                </Badge>
                                <Badge>
                                    <SignalCellularAlt sx={{ fontSize: 14, color: "#4ade80" }} />
                                    <Box
                                        component="span"
                                        sx={{
                                            color: "#4ade80",
                                            fontSize: 11,
                                            fontFamily: "'DM Mono', monospace",
                                            display: { xs: "none", sm: "inline" },
                                        }}
                                    >
                                        Strong
                                    </Box>
                                </Badge>
                            </Box>
                        </TopBar>

                        {/* Center name */}
                        <CallerName>{isSwapped ? localUsername : remoteUsername}</CallerName>

                        {/* Hand overlay */}
                        {showHandOverlay && <HandOverlay>✋</HandOverlay>}

                        {/* PiP */}
                        <Tooltip title={isDragging ? "" : "Drag to move · Click to swap"} placement="top">
                            <PiPWrapper
                                onMouseDown={handlePipMouseDown}
                                onTouchStart={handlePipTouchStart}
                                sx={{
                                    ...cornerStyles[pipCorner],
                                    opacity: isVideoOn ? 1 : 0.45,
                                    cursor: isDragging ? "grabbing" : "grab",
                                    transition: isDragging
                                        ? "none"
                                        : "top 0.22s cubic-bezier(.4,0,.2,1), bottom 0.22s cubic-bezier(.4,0,.2,1), left 0.22s cubic-bezier(.4,0,.2,1), right 0.22s cubic-bezier(.4,0,.2,1), opacity 0.2s",
                                    "&:hover": {
                                        border: "2px solid rgba(55,138,221,0.75)",
                                        boxShadow: "0 0 0 3px rgba(55,138,221,0.15)",
                                    },
                                }}
                            >
                                {isSwapped ? (
                                    remoteStream ? (
                                        <PiPVideo ref={remoteVideoRef} autoPlay playsInline />
                                    ) : (
                                        <Box
                                            sx={{
                                                width: "100%",
                                                height: "100%",
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: 1,
                                                background: "linear-gradient(135deg, #1e3a5f, #1a2a40)",
                                            }}
                                        >
                                            {remoteProfilePicture ? (
                                                <Box
                                                    component="img"
                                                    src={remoteProfilePicture}
                                                    sx={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
                                                />
                                            ) : (
                                                <AvatarCircle size={32}>{remoteInitials}</AvatarCircle>
                                            )}
                                        </Box>
                                    )
                                ) : localStream ? (
                                    <PiPVideo ref={localVideoRef} autoPlay muted playsInline />
                                ) : (
                                    <Box
                                        sx={{
                                            width: "100%",
                                            height: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 1,
                                            background: "linear-gradient(135deg, #1e3a5f, #1a2a40)",
                                        }}
                                    >
                                        {localProfilePicture ? (
                                            <Box
                                                component="img"
                                                src={localProfilePicture}
                                                sx={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
                                            />
                                        ) : (
                                            <AvatarCircle size={32} color="#4ade80">
                                                {localInitials}
                                            </AvatarCircle>
                                        )}
                                    </Box>
                                )}

                                {/* Label */}
                                <Box
                                    sx={{
                                        position: "absolute",
                                        bottom: 4,
                                        left: 6,
                                        background: "rgba(0,0,0,0.65)",
                                        borderRadius: 1,
                                        px: 0.6,
                                        py: 0.3,
                                        fontSize: 10,
                                        color: "rgba(255,255,255,0.7)",
                                        fontFamily: "'DM Mono', monospace",
                                        pointerEvents: "none",
                                    }}
                                >
                                    {isSwapped ? remoteUsername : localUsername}
                                </Box>
                            </PiPWrapper>
                        </Tooltip>

                        {/* Toast */}
                        {toast && <Toast>{toast}</Toast>}
                    </Box>

                    {/* ── Bottom Controls ── */}
                    <BottomBar>
                        {/* Left group */}
                        <ControlGroup>
                            <Tooltip title="Participants" placement="top">
                                <ControlBtn active={activePanel === "participants"} onClick={() => togglePanel("participants")} size="small">
                                    <People sx={{ fontSize: 18 }} />
                                </ControlBtn>
                            </Tooltip>
                            <Tooltip title="Chat" placement="top">
                                <ControlBtn active={activePanel === "chat"} onClick={() => togglePanel("chat")} size="small">
                                    <Chat sx={{ fontSize: 18 }} />
                                </ControlBtn>
                            </Tooltip>
                            {/* Hide screen share on mobile (not meaningful) */}
                            <Tooltip title={isSharing ? "Stop sharing" : "Share screen"} placement="top">
                                <ControlBtn active={isSharing} onClick={toggleShare} size="small" sx={{ display: { xs: "none", sm: "flex" } }}>
                                    {isSharing ? <StopScreenShare sx={{ fontSize: 18 }} /> : <ScreenShare sx={{ fontSize: 18 }} />}
                                </ControlBtn>
                            </Tooltip>
                        </ControlGroup>

                        {/* Center group */}
                        <ControlGroup sx={{ gap: "10px" }}>
                            <Tooltip title={isMuted ? "Unmute" : "Mute"} placement="top">
                                <RoundBtn off={isMuted} onClick={toggleMic}>
                                    {isMuted ? <MicOff sx={{ fontSize: 20 }} /> : <Mic sx={{ fontSize: 20 }} />}
                                </RoundBtn>
                            </Tooltip>

                            <Tooltip title="End call" placement="top">
                                <EndBtn onClick={handleEndCall}>
                                    <CallEnd sx={{ fontSize: 22 }} />
                                </EndBtn>
                            </Tooltip>

                            <Tooltip title={isVideoOn ? "Turn off camera" : "Turn on camera"} placement="top">
                                <RoundBtn off={!isVideoOn} onClick={toggleVideo}>
                                    {isVideoOn ? <Videocam sx={{ fontSize: 20 }} /> : <VideocamOff sx={{ fontSize: 20 }} />}
                                </RoundBtn>
                            </Tooltip>
                        </ControlGroup>

                        {/* Right group */}
                        <ControlGroup>
                            <Tooltip title={isHandRaised ? "Lower hand" : "Raise hand"} placement="top">
                                <ControlBtn
                                    active={isHandRaised}
                                    onClick={toggleHand}
                                    size="small"
                                    sx={
                                        isHandRaised
                                            ? {
                                                  background: "rgba(239,159,39,0.2)",
                                                  border: "0.5px solid rgba(239,159,39,0.4)",
                                                  color: "#EF9F27",
                                              }
                                            : {}
                                    }
                                >
                                    <BackHand sx={{ fontSize: 18 }} />
                                </ControlBtn>
                            </Tooltip>
                            <Tooltip title="More options" placement="top">
                                <ControlBtn size="small">
                                    <MoreVert sx={{ fontSize: 18 }} />
                                </ControlBtn>
                            </Tooltip>
                        </ControlGroup>
                    </BottomBar>

                    {/* ── Participants Panel ── */}
                    {activePanel === "participants" && (
                        <SidePanel>
                            <PanelHeader>
                                <PanelTitle>Participants ({participants.length})</PanelTitle>
                                <IconButton size="small" onClick={() => setActivePanel(null)} sx={{ color: "rgba(255,255,255,0.4)", p: 0.4 }}>
                                    <Close sx={{ fontSize: 16 }} />
                                </IconButton>
                            </PanelHeader>
                            <Box sx={{ flex: 1, overflowY: "auto", padding: "10px" }}>
                                {participants.map((p) => (
                                    <ParticipantRow key={p.id} speaking={p.isSpeaking}>
                                        {(p.id === 1 ? remoteProfilePicture : localProfilePicture) ? (
                                            <Box
                                                component="img"
                                                src={p.id === 1 ? remoteProfilePicture : localProfilePicture}
                                                sx={{
                                                    width: 34,
                                                    height: 34,
                                                    borderRadius: "50%",
                                                    objectFit: "cover",
                                                    flexShrink: 0,
                                                }}
                                            />
                                        ) : (
                                            <AvatarCircle size={34} color={p.id === 2 ? "#4ade80" : "#378ADD"}>
                                                {p.initials}
                                            </AvatarCircle>
                                        )}
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Box
                                                sx={{
                                                    color: "#fff",
                                                    fontSize: 13,
                                                    fontWeight: 500,
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                }}
                                            >
                                                {p.name}
                                            </Box>
                                            <Box
                                                sx={{
                                                    fontSize: 11,
                                                    color: p.isSpeaking ? "#4ade80" : "rgba(255,255,255,0.35)",
                                                }}
                                            >
                                                {p.role ?? (p.isMuted ? "Muted" : p.isSpeaking ? "Speaking" : "")}
                                            </Box>
                                        </Box>
                                        {p.isMuted && (
                                            <MicOff
                                                sx={{
                                                    fontSize: 14,
                                                    color: "rgba(226,75,74,0.7)",
                                                }}
                                            />
                                        )}
                                        {!p.isMuted && !p.isSpeaking && (
                                            <Mic
                                                sx={{
                                                    fontSize: 14,
                                                    color: "rgba(255,255,255,0.3)",
                                                }}
                                            />
                                        )}
                                    </ParticipantRow>
                                ))}
                            </Box>
                        </SidePanel>
                    )}

                    {/* ── Chat Panel ── */}
                    {activePanel === "chat" && (
                        <SidePanel>
                            <PanelHeader>
                                <PanelTitle>Chat</PanelTitle>
                                <IconButton size="small" onClick={() => setActivePanel(null)} sx={{ color: "rgba(255,255,255,0.4)", p: 0.4 }}>
                                    <Close sx={{ fontSize: 16 }} />
                                </IconButton>
                            </PanelHeader>

                            <Box
                                sx={{
                                    flex: 1,
                                    overflowY: "auto",
                                    padding: "10px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 1,
                                }}
                            >
                                {messages.map((msg) => (
                                    <MessageBubble key={msg.id} isSelf={msg.isSelf}>
                                        {!msg.isSelf && (
                                            <Box
                                                sx={{
                                                    color: "#378ADD",
                                                    fontSize: 10,
                                                    fontWeight: 600,
                                                    mb: 0.4,
                                                    fontFamily: "'DM Mono', monospace",
                                                }}
                                            >
                                                {msg.sender}
                                            </Box>
                                        )}
                                        <Box
                                            sx={{
                                                color: "rgba(255,255,255,0.85)",
                                                fontSize: 12,
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            {msg.text}
                                        </Box>
                                        <Box
                                            sx={{
                                                color: "rgba(255,255,255,0.25)",
                                                fontSize: 10,
                                                mt: 0.5,
                                                textAlign: msg.isSelf ? "right" : "left",
                                                fontFamily: "'DM Mono', monospace",
                                            }}
                                        >
                                            {msg.timestamp}
                                        </Box>
                                    </MessageBubble>
                                ))}
                                <div ref={chatBottomRef} />
                            </Box>

                            <Box
                                sx={{
                                    display: "flex",
                                    gap: 1,
                                    alignItems: "center",
                                    padding: "10px",
                                    paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
                                    borderTop: "0.5px solid rgba(255,255,255,0.07)",
                                }}
                            >
                                <ChatInput
                                    ref={chatInputRef}
                                    placeholder="Message..."
                                    value={chatText}
                                    onChange={(e) => setChatText(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                                />
                                <IconButton
                                    onClick={sendMessage}
                                    size="small"
                                    sx={{
                                        width: 30,
                                        height: 30,
                                        background: "#378ADD",
                                        borderRadius: "50%",
                                        color: "#fff",
                                        flexShrink: 0,
                                        "&:hover": { background: "#2d74c0" },
                                    }}
                                >
                                    <Send sx={{ fontSize: 14 }} />
                                </IconButton>
                            </Box>
                        </SidePanel>
                    )}
                </CallContainer>
            </ModalRoot>
        </Modal>
    );
};

export default VideoCallModal;
