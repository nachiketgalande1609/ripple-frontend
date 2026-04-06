import { CircularProgress } from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";

interface Profile {
    username: string;
    follow_status: string;
    is_following: boolean;
    is_private: boolean;
    is_request_active: boolean;
    bio?: string;
    profile_picture?: string;
    isMobile?: boolean;
    email?: string;
    followers_count?: number;
    following_count?: number;
    posts_count?: number;
}

interface FollowButtonProps {
    isFollowing: boolean;
    profileData: Pick<Profile, "is_request_active"> | null;
    followButtonLoading: boolean;
    handleFollow: () => void;
    handleCancelRequest: () => void;
    handleUnfollow?: () => void;
}
type ButtonState = "follow" | "pending" | "following";

function getState(isFollowing: boolean, profileData: Pick<Profile, "is_request_active"> | null): ButtonState {
    if (profileData?.is_request_active) return "pending";
    if (isFollowing) return "following";
    return "follow";
}

const stateConfig: Record<
    ButtonState,
    {
        label: string;
        hoverLabel: string;
        icon: React.ReactNode;
        hoverIcon: React.ReactNode;
        bg: string;
        color: string;
        hoverBg: string;
        hoverColor: string;
        border: string;
        hoverBorder: string;
    }
> = {
    follow: {
        label: "Follow",
        hoverLabel: "Follow",
        icon: <PersonAddIcon sx={{ fontSize: 14 }} />,
        hoverIcon: <PersonAddIcon sx={{ fontSize: 14 }} />,
        bg: "#ffffff",
        color: "#0a0a0a",
        hoverBg: "#e8e8e8",
        hoverColor: "#0a0a0a",
        border: "1.5px solid transparent",
        hoverBorder: "1.5px solid transparent",
    },
    pending: {
        label: "Requested",
        hoverLabel: "Cancel",
        icon: <HourglassTopIcon sx={{ fontSize: 14 }} />,
        hoverIcon: <CloseIcon sx={{ fontSize: 14 }} />,
        bg: "transparent",
        color: "#888",
        hoverBg: "rgba(255,80,80,0.08)",
        hoverColor: "#ff5050",
        border: "1.5px solid #2a2a2a",
        hoverBorder: "1.5px solid rgba(255,80,80,0.25)",
    },
    following: {
        label: "Following",
        hoverLabel: "Unfollow",
        icon: <CheckIcon sx={{ fontSize: 14 }} />,
        hoverIcon: <CloseIcon sx={{ fontSize: 14 }} />,
        bg: "transparent",
        color: "#555",
        hoverBg: "rgba(255,80,80,0.08)",
        hoverColor: "#ff5050",
        border: "1.5px solid #222",
        hoverBorder: "1.5px solid rgba(255,80,80,0.25)",
    },
};

const FollowButton: React.FC<FollowButtonProps> = ({
    isFollowing,
    profileData,
    followButtonLoading,
    handleFollow,
    handleCancelRequest,
    handleUnfollow,
}) => {
    const [hovered, setHovered] = useState(false);
    const state = getState(isFollowing, profileData);
    const config = stateConfig[state];
    const isInteractive = state === "pending" || state === "following";
    const showHoverState = hovered && isInteractive;

    const handleClick = () => {
        if (followButtonLoading) return;
        if (state === "pending") handleCancelRequest();
        else if (state === "following") handleUnfollow?.();
        else handleFollow();
    };

    return (
        <button
            onClick={handleClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            disabled={followButtonLoading}
            style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "7px 16px",
                minWidth: "100px",
                borderRadius: "20px",
                border: showHoverState ? config.hoverBorder : config.border,
                background: showHoverState ? config.hoverBg : config.bg,
                color: showHoverState ? config.hoverColor : config.color,
                fontSize: "13px",
                fontWeight: 500,
                letterSpacing: "0.01em",
                cursor: followButtonLoading ? "default" : "pointer",
                transition: "all 0.2s ease",
                outline: "none",
                whiteSpace: "nowrap",
                userSelect: "none",
            }}
        >
            {followButtonLoading ? (
                <CircularProgress size={14} sx={{ color: "#555" }} />
            ) : (
                <>
                    <span
                        style={{
                            display: "flex",
                            alignItems: "center",
                            transition: "color 0.2s ease",
                            color: showHoverState ? config.hoverColor : config.color,
                        }}
                    >
                        {showHoverState ? config.hoverIcon : config.icon}
                    </span>
                    <span style={{ transition: "color 0.2s ease" }}>{showHoverState ? config.hoverLabel : config.label}</span>
                </>
            )}
        </button>
    );
};

export default FollowButton;
