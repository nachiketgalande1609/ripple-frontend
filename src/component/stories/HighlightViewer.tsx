import { useState, useEffect, useRef, useCallback } from "react";
import { Box, Dialog, IconButton, Typography, LinearProgress } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

export interface HighlightItem {
    id: number;
    media_url: string;
    media_type: "image" | "video";
    order_index: number;
    created_at?: string;
}

export interface Highlight {
    id: number;
    title: string;
    cover_url: string | null;
    items: HighlightItem[];
}

interface Props {
    open: boolean;
    onClose: () => void;
    highlight: Highlight | null;
}

const ITEM_DURATION = 5000;

export default function HighlightViewer({ open, onClose, highlight }: Props) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(0);

    const items = highlight?.items ?? [];

    const goNext = useCallback(() => {
        setCurrentIndex(i => {
            if (i + 1 >= items.length) { onClose(); return i; }
            return i + 1;
        });
    }, [items.length, onClose]);

    const goPrev = () => setCurrentIndex(i => Math.max(0, i - 1));

    const startTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setProgress(0);
        startTimeRef.current = Date.now();
        timerRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            const pct = Math.min(100, (elapsed / ITEM_DURATION) * 100);
            setProgress(pct);
            if (pct >= 100) goNext();
        }, 50);
    }, [goNext]);

    useEffect(() => {
        if (open && items.length > 0) startTimer();
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [open, currentIndex, startTimer, items.length]);

    useEffect(() => {
        if (!open) setCurrentIndex(0);
    }, [open]);

    if (!highlight) return null;
    const item = items[currentIndex];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen
            sx={{ "& .MuiDialog-paper": { background: "#000", borderRadius: 0 } }}
        >
            <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
                {/* Progress bars */}
                <Box sx={{ display: "flex", gap: 0.5, p: 1.5, pt: 2, position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}>
                    {items.map((_, i) => (
                        <Box key={i} sx={{ flex: 1, height: 2.5, borderRadius: 2, overflow: "hidden", bgcolor: "rgba(255,255,255,0.3)" }}>
                            <LinearProgress
                                variant="determinate"
                                value={i < currentIndex ? 100 : i === currentIndex ? progress : 0}
                                sx={{
                                    height: "100%", borderRadius: 2,
                                    backgroundColor: "transparent",
                                    "& .MuiLinearProgress-bar": { backgroundColor: "#fff", transition: "none" },
                                }}
                            />
                        </Box>
                    ))}
                </Box>

                {/* Header */}
                <Box sx={{
                    position: "absolute", top: 28, left: 0, right: 0, zIndex: 10,
                    display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, pt: 1,
                }}>
                    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1rem", textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}>
                        {highlight.title}
                    </Typography>
                    <IconButton onClick={onClose} sx={{ color: "#fff" }}>
                        <CloseRoundedIcon />
                    </IconButton>
                </Box>

                {/* Media */}
                <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    {item && (
                        item.media_type === "video" ? (
                            <video
                                key={item.id}
                                src={item.media_url}
                                autoPlay
                                playsInline
                                muted
                                style={{ maxWidth: "100%", maxHeight: "100vh", objectFit: "contain" }}
                            />
                        ) : (
                            <img
                                key={item.id}
                                src={item.media_url}
                                alt=""
                                style={{ maxWidth: "100%", maxHeight: "100vh", objectFit: "contain" }}
                            />
                        )
                    )}

                    {/* Tap zones */}
                    <Box sx={{ position: "absolute", left: 0, top: 0, width: "40%", height: "100%", cursor: "pointer" }} onClick={goPrev} />
                    <Box sx={{ position: "absolute", right: 0, top: 0, width: "40%", height: "100%", cursor: "pointer" }} onClick={goNext} />

                    {/* Nav arrows on desktop */}
                    {currentIndex > 0 && (
                        <IconButton onClick={goPrev} sx={{ position: "absolute", left: 8, color: "rgba(255,255,255,0.8)", bgcolor: "rgba(0,0,0,0.3)", "&:hover": { bgcolor: "rgba(0,0,0,0.5)" } }}>
                            <ChevronLeftRoundedIcon />
                        </IconButton>
                    )}
                    {currentIndex < items.length - 1 && (
                        <IconButton onClick={goNext} sx={{ position: "absolute", right: 8, color: "rgba(255,255,255,0.8)", bgcolor: "rgba(0,0,0,0.3)", "&:hover": { bgcolor: "rgba(0,0,0,0.5)" } }}>
                            <ChevronRightRoundedIcon />
                        </IconButton>
                    )}
                </Box>
            </Box>
        </Dialog>
    );
}
