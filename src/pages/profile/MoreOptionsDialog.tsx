import { Dialog, Button, Box, useMediaQuery, useTheme } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppNotifications } from "../../hooks/useNotification";
import socket from "../../services/socket";
import { unfollowUser, blockUser, unblockUser } from "../../services/api";

import EditRoundedIcon from "@mui/icons-material/EditRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PersonRemoveRoundedIcon from "@mui/icons-material/PersonRemoveRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";

import BlankProfileImage from "../../static/profile_blank.png";

interface MoreOptionsDialogProps {
    openDialog: boolean;
    handleCloseDialog: () => void;
    userId: string | undefined;
    fetchProfile: () => void;
    fetchUserPosts: () => void;
    isFollowing: boolean | undefined;
    isBlocked: boolean;
    onBlockToggle: () => void;
}

/* Reusable icon container */
function DialogIconWrap({ children, danger = false, muted = false }: { children: React.ReactNode; danger?: boolean; muted?: boolean }) {
    return (
        <Box
            sx={{
                width: 34,
                height: 34,
                borderRadius: "10px",
                backgroundColor: danger ? "rgba(211,47,47,0.08)" : "action.hover",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: danger ? "error.main" : muted ? "text.disabled" : "text.secondary",
                transition: "all 0.2s ease",
                flexShrink: 0,
            }}
        >
            {children}
        </Box>
    );
}

/* Reusable dialog button */
function DialogButton({
    icon,
    label,
    onClick,
    danger = false,
    muted = false,
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    danger?: boolean;
    muted?: boolean;
}) {
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
                borderRadius: "30px",
                textTransform: "none",
                justifyContent: "flex-start",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
                fontSize: "0.875rem",
                color: danger ? "error.main" : muted ? "text.disabled" : "text.primary",
                border: "none",
                backgroundColor: "var(--nav-bg)",
                boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                transition: "box-shadow 0.35s cubic-bezier(0.4,0,0.2,1), color 0.2s ease",
                mb: 0.75,
                "&:hover": {
                    backgroundColor: "var(--nav-bg)",
                    boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)",
                    color: danger ? "error.light" : muted ? "text.secondary" : "text.primary",
                },
            }}
        >
            <DialogIconWrap danger={danger} muted={muted}>
                {icon}
            </DialogIconWrap>
            {label}
        </Button>
    );
}


export default function MoreOptionsDialog({
    openDialog,
    handleCloseDialog,
    userId,
    fetchProfile,
    fetchUserPosts,
    isFollowing,
    isBlocked,
    onBlockToggle,
}: MoreOptionsDialogProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const notifications = useAppNotifications();

    const profileUrl = `${window.location.origin}${location.pathname}`;
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "null") : {};

    const isOwnProfile = currentUser?.id == userId;

    const handleEditProfile = () => {
        navigate(isMobile ? "/settings" : "/settings?setting=profiledetails");
        handleCloseDialog();
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(profileUrl);
            notifications.show("Profile link copied to clipboard!", {
                severity: "success",
                autoHideDuration: 3000,
            });
            handleCloseDialog();
        } catch (err) {
            console.error("Failed to copy:", err);
            notifications.show("Failed to copy link. Please try again later.", {
                severity: "error",
                autoHideDuration: 3000,
            });
        }
    };

    const handleLogout = () => {
        if (currentUser) socket.disconnect();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("privateKey");
        handleCloseDialog();
        navigate("/login");
    };

    const handleUnfollow = async () => {
        try {
            const res = await unfollowUser(currentUser.id, userId || "");
            if (res.success) {
                handleCloseDialog();
                notifications.show("User Unfollowed", {
                    severity: "success",
                    autoHideDuration: 3000,
                });
                fetchProfile();
                fetchUserPosts();
            }
        } catch (err) {
            console.error("Unfollow request failed:", err);
            notifications.show("Failed to unfollow user. Please try again later.", {
                severity: "error",
                autoHideDuration: 3000,
            });
        }
    };

    const handleBlockToggle = async () => {
        try {
            if (isBlocked) {
                await unblockUser(Number(userId));
                notifications.show("User unblocked", { severity: "success", autoHideDuration: 3000 });
            } else {
                await blockUser(Number(userId));
                notifications.show("User blocked", { severity: "success", autoHideDuration: 3000 });
            }
            handleCloseDialog();
            onBlockToggle();
        } catch (err) {
            console.error("Block/unblock failed:", err);
            notifications.show("Action failed. Please try again.", { severity: "error", autoHideDuration: 3000 });
        }
    };

    return (
        <Dialog
            open={openDialog}
            onClose={handleCloseDialog}
            fullWidth
            maxWidth="xs"
            sx={{
                "& .MuiDialog-paper": {
                    borderRadius: "36px",
                    backgroundColor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: "0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(100,116,139,0.08)",
                    overflow: "hidden",
                    padding: "6px",
                },
            }}
            BackdropProps={{
                sx: {
                    backgroundColor: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(8px)",
                },
            }}
        >
            {/* User info header */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 2,
                    py: 1.75,
                    mb: 0.5,
                }}
            >
                <img
                    src={currentUser?.profile_picture_url || BlankProfileImage}
                    alt="Profile"
                    style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid rgba(100,116,139,0.35)",
                    }}
                />
                <Box>
                    <Box
                        sx={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            color: "text.primary",
                            lineHeight: 1.3,
                        }}
                    >
                        {currentUser?.username || "User"}
                    </Box>
                    <Box
                        sx={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "0.75rem",
                            color: "text.disabled",
                        }}
                    >
                        {isOwnProfile ? "Manage your profile" : "Profile options"}
                    </Box>
                </Box>
            </Box>


            <Box
                sx={{
                    "& button": { borderRadius: "0 !important" },
                    "& button:first-of-type": { borderRadius: "32px 32px 0 0 !important" },
                    "& button:last-of-type": { borderRadius: "0 0 32px 32px !important", marginBottom: "0 !important" },
                }}
            >
                {/* Unfollow — shown to non-owners who follow this user */}
                {!isOwnProfile && isFollowing && (
                    <DialogButton icon={<PersonRemoveRoundedIcon sx={{ fontSize: "1.1rem" }} />} label="Unfollow" onClick={handleUnfollow} danger />
                )}

                {/* Block / Unblock — shown to non-owners */}
                {!isOwnProfile && (
                    <DialogButton
                        icon={isBlocked
                            ? <BlockOutlinedIcon sx={{ fontSize: "1.1rem" }} />
                            : <BlockRoundedIcon sx={{ fontSize: "1.1rem" }} />
                        }
                        label={isBlocked ? "Unblock" : "Block"}
                        onClick={handleBlockToggle}
                        danger={!isBlocked}
                    />
                )}

                {/* Edit Profile — own profile only */}
                {isOwnProfile && <DialogButton icon={<EditRoundedIcon sx={{ fontSize: "1.1rem" }} />} label="Edit Profile" onClick={handleEditProfile} />}

                {/* Copy Profile Link — always visible */}
                <DialogButton icon={<LinkRoundedIcon sx={{ fontSize: "1.1rem" }} />} label="Copy Profile Link" onClick={handleCopyLink} />

                {/* Settings — mobile + own profile only */}
                {isMobile && isOwnProfile && (
                    <DialogButton
                        icon={<SettingsRoundedIcon sx={{ fontSize: "1.1rem" }} />}
                        label="Settings"
                        onClick={() => {
                            navigate("/settings");
                            handleCloseDialog();
                        }}
                    />
                )}

                {/* Logout — own profile only */}
                {isOwnProfile && <DialogButton icon={<LogoutRoundedIcon sx={{ fontSize: "1.1rem" }} />} label="Log out" onClick={handleLogout} danger />}

                {/* Cancel */}
                <DialogButton icon={<CloseRoundedIcon sx={{ fontSize: "1.1rem" }} />} label="Cancel" onClick={handleCloseDialog} muted />
            </Box>
        </Dialog>
    );
}
