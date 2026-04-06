import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, Typography, Box, useMediaQuery, useTheme, IconButton, Dialog, Button, DialogContent, Grid } from "@mui/material";
import { ChevronLeft, MoreVert, Videocam } from "@mui/icons-material";
import WallpaperRoundedIcon from "@mui/icons-material/WallpaperRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import bg1 from "../../static/bg1.jpg";
import bg2 from "../../static/bg2.jpg";
import bg3 from "../../static/bg3.png";
import bg4 from "../../static/bg4.jpg";
import BlankProfileImage from "../../static/profile_blank.png";

type Message = {
    message_id: number;
    receiver_id: number;
    sender_id: number;
    message_text: string;
    timestamp: string;
    delivered?: boolean;
    read?: boolean;
    saved?: boolean;
    file_url: string;
    delivered_timestamp?: string | null;
    read_timestamp?: string | null;
    file_name: string | null;
    file_size: string | null;
    reply_to: number | null;
    media_height: number | null;
    media_width: number | null;
    reactions: ReactionDetail[];
    post?: {
        post_id: number;
        file_url: string;
        media_width: number;
        media_height: number;
        content: string;
        owner: {
            user_id: number;
            username: string;
            profile_picture: string;
        };
    } | null;
};

interface ReactionDetail {
    user_id: string;
    reaction: string;
    username: string;
    profile_picture: string;
}

interface MessagesTopBarProps {
    selectedUser: User | null;
    chatTheme: string;
    setChatTheme: (theme: string) => void;
    openVideoCall: () => void;
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

type User = {
    id: number;
    username: string;
    profile_picture: string;
    isOnline: boolean;
    latest_message: string;
    latest_message_timestamp: string;
    unread_count: number;
};

const themeBackgrounds = [
    { value: "black", label: "Default" },
    { value: `url(${bg1})`, label: "" },
    { value: `url(${bg2})`, label: "" },
    { value: `url(${bg3})`, label: "" },
    { value: `url(${bg4})`, label: "" },
];

/* ─── Shared dialog styles ──────────────────────────────────────── */
const dialogBackdrop = {
    sx: { backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.6)" },
};

const dialogPaperSx = {
    borderRadius: "20px",
    background: "linear-gradient(160deg, #13131c 0%, #0e0e16 100%)",
    border: "1px solid rgba(255,255,255,0.07)",
    boxShadow: "0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,92,252,0.08)",
    color: "white",
    overflow: "hidden",
    padding: "6px",
};

/* ─── Reusable icon wrap ────────────────────────────────────────── */
function DialogIconWrap({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
    return (
        <Box
            sx={{
                width: 34,
                height: 34,
                borderRadius: "10px",
                background: muted ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: muted ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.5)",
                transition: "all 0.2s ease",
                flexShrink: 0,
            }}
        >
            {children}
        </Box>
    );
}

/* ─── Reusable dialog button ────────────────────────────────────── */
function DialogButton({ icon, label, onClick, muted = false }: { icon: React.ReactNode; label: string; onClick: () => void; muted?: boolean }) {
    return (
        <Button
            fullWidth
            onClick={onClick}
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 2,
                py: 1.4,
                borderRadius: "12px",
                textTransform: "none",
                justifyContent: "flex-start",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
                fontSize: "0.875rem",
                color: muted ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.8)",
                transition: "all 0.2s ease",
                "&:hover": {
                    background: muted ? "rgba(255,255,255,0.04)" : "rgba(124,92,252,0.12)",
                    color: muted ? "rgba(255,255,255,0.55)" : "#fff",
                },
            }}
        >
            <DialogIconWrap muted={muted}>{icon}</DialogIconWrap>
            {label}
        </Button>
    );
}

/* ─── Gradient divider ──────────────────────────────────────────── */
function DialogDivider() {
    return (
        <Box
            sx={{
                height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)",
                mx: 1,
                my: 0.5,
            }}
        />
    );
}

const iconButtonSx = {
    color: "#9aa0a6",
    width: 34,
    height: 34,
    "&:hover": {
        color: "#e8eaed",
        backgroundColor: "rgba(255,255,255,0.07)",
    },
};

const MessagesTopBar: React.FC<MessagesTopBarProps> = ({ selectedUser, chatTheme, setChatTheme, openVideoCall, setMessages }) => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const [openThemeDialog, setOpenThemeDialog] = useState(false);
    const [openColorDialog, setOpenColorDialog] = useState(false);

    return (
        <Box
            sx={{
                backgroundColor: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(8px)",
                px: isMobile ? 2 : 1.5,
                py: 1.25,
                display: "flex",
                alignItems: "center",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                justifyContent: "space-between",
                height: 60,
            }}
        >
            {/* Left: back + avatar + username */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, overflow: "hidden" }}>
                {!isMobile && (
                    <IconButton
                        onClick={() => {
                            navigate("/messages");
                            setMessages([]);
                        }}
                        sx={{ ...iconButtonSx, ml: -0.5 }}
                    >
                        <ChevronLeft fontSize="small" />
                    </IconButton>
                )}
                <Avatar
                    sx={{ width: 36, height: 36, cursor: "pointer", ml: isMobile ? 3 : 0, border: "2px solid rgba(255,255,255,0.08)" }}
                    src={selectedUser?.profile_picture || BlankProfileImage}
                    onClick={() => navigate(`/profile/${selectedUser?.id}`)}
                />
                <Typography
                    onClick={() => navigate(`/profile/${selectedUser?.id}`)}
                    sx={{
                        cursor: "pointer",
                        color: "#e8eaed",
                        fontWeight: 500,
                        fontSize: "0.92rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        "&:hover": { color: "#fff" },
                    }}
                >
                    {selectedUser?.username}
                </Typography>
            </Box>

            {/* Right: actions */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
                <IconButton onClick={openVideoCall} sx={iconButtonSx}>
                    <Videocam sx={{ fontSize: 20 }} />
                </IconButton>
                <IconButton onClick={() => setOpenThemeDialog(true)} sx={iconButtonSx}>
                    <MoreVert sx={{ fontSize: 20 }} />
                </IconButton>
            </Box>

            {/* ── Theme options dialog ── */}
            <Dialog
                open={openThemeDialog}
                onClose={() => setOpenThemeDialog(false)}
                fullWidth
                maxWidth="xs"
                BackdropProps={dialogBackdrop}
                sx={{ "& .MuiDialog-paper": dialogPaperSx }}
            >
                <DialogButton
                    icon={<WallpaperRoundedIcon sx={{ fontSize: "1.1rem" }} />}
                    label="Set Chat Background"
                    onClick={() => {
                        setOpenColorDialog(true);
                        setOpenThemeDialog(false);
                    }}
                />

                <DialogDivider />

                <DialogButton
                    icon={<CloseRoundedIcon sx={{ fontSize: "1.1rem" }} />}
                    label="Cancel"
                    onClick={() => setOpenThemeDialog(false)}
                    muted
                />
            </Dialog>

            {/* ── Background picker dialog ── */}
            <Dialog
                open={openColorDialog}
                onClose={() => setOpenColorDialog(false)}
                BackdropProps={dialogBackdrop}
                sx={{
                    "& .MuiDialog-paper": {
                        ...dialogPaperSx,
                        padding: 0,
                    },
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        px: 2.5,
                        pt: 2,
                        pb: 1.5,
                        borderBottom: "1px solid rgba(255,255,255,0.07)",
                    }}
                >
                    <Typography
                        sx={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 600,
                            fontSize: "0.95rem",
                            color: "#e8eaed",
                        }}
                    >
                        Chat Background
                    </Typography>
                    <Typography
                        sx={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "0.75rem",
                            color: "rgba(255,255,255,0.35)",
                            mt: 0.25,
                        }}
                    >
                        Choose a background for this conversation
                    </Typography>
                </Box>

                {/* Grid */}
                <DialogContent sx={{ pt: 2, pb: 1.5 }}>
                    <Grid container spacing={1.5}>
                        {themeBackgrounds.map(({ value, label }, index) => {
                            const isSelected = chatTheme === value;
                            return (
                                <Grid item xs={3} key={index}>
                                    <Box
                                        onClick={() => {
                                            localStorage.setItem("chatTheme", value);
                                            setChatTheme(value);
                                            setOpenColorDialog(false);
                                            setOpenThemeDialog(false);
                                        }}
                                        sx={{
                                            width: isMobile ? 58 : 72,
                                            height: isMobile ? 58 : 72,
                                            background: value === "black" ? "#0d0d0d" : value,
                                            backgroundSize: "cover",
                                            backgroundPosition: "center",
                                            cursor: "pointer",
                                            borderRadius: "12px",
                                            border: isSelected ? "2px solid rgba(124,92,252,0.9)" : "2px solid rgba(255,255,255,0.08)",
                                            boxShadow: isSelected ? "0 0 0 3px rgba(124,92,252,0.2)" : "none",
                                            transition: "all 0.15s ease",
                                            "&:hover": {
                                                borderColor: "rgba(255,255,255,0.3)",
                                                transform: "scale(1.05)",
                                            },
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            position: "relative",
                                            overflow: "hidden",
                                        }}
                                    >
                                        {/* Selected checkmark */}
                                        {isSelected && (
                                            <Box
                                                sx={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    backgroundColor: "rgba(124,92,252,0.3)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    borderRadius: "10px",
                                                }}
                                            >
                                                <CheckRoundedIcon sx={{ fontSize: "1.1rem", color: "#fff" }} />
                                            </Box>
                                        )}
                                        {label && !isSelected && (
                                            <Typography
                                                sx={{
                                                    fontFamily: "'DM Sans', sans-serif",
                                                    fontSize: "0.7rem",
                                                    color: "rgba(255,255,255,0.5)",
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {label}
                                            </Typography>
                                        )}
                                    </Box>
                                </Grid>
                            );
                        })}
                    </Grid>
                </DialogContent>

                {/* Footer cancel */}
                <Box
                    sx={{
                        borderTop: "1px solid rgba(255,255,255,0.07)",
                        px: 1,
                        py: 0.75,
                    }}
                >
                    <DialogButton
                        icon={<CloseRoundedIcon sx={{ fontSize: "1.1rem" }} />}
                        label="Cancel"
                        onClick={() => setOpenColorDialog(false)}
                        muted
                    />
                </Box>
            </Dialog>
        </Box>
    );
};

export default MessagesTopBar;
