import { CircularProgress } from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";

interface Profile {
    username: string;
    email: string;
    bio?: string;
    profile_picture?: string;
    followers_count: number;
    following_count: number;
    posts_count: number;
    is_request_active: boolean;
    follow_status: string;
    is_following: boolean;
    is_private: boolean;
    isMobile?: boolean;
}

interface FollowButtonProps {
    isFollowing: boolean;
    profileData: Profile | null;
    followButtonLoading: boolean;
    handleFollow: () => void;
    handleCancelRequest: () => void;
}

type ButtonState = "follow" | "pending" | "following";

function getState(isFollowing: boolean, profileData: Profile | null): ButtonState {
    if (profileData?.is_request_active) return "pending";
    if (isFollowing && profileData?.follow_status === "accepted") return "following";
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
    },
    following: {
        label: "Following",
        hoverLabel: "Following",
        icon: <CheckIcon sx={{ fontSize: 14 }} />,
        hoverIcon: <CheckIcon sx={{ fontSize: 14 }} />,
        bg: "transparent",
        color: "#555",
        hoverBg: "transparent",
        hoverColor: "#555",
        border: "1.5px solid #222",
    },
};

const FollowButton: React.FC<FollowButtonProps> = ({
    isFollowing,
    profileData,
    followButtonLoading,
    handleFollow,
    handleCancelRequest,
}) => {
    const [hovered, setHovered] = useState(false);
    const state = getState(isFollowing, profileData);
    const config = stateConfig[state];
    const isDisabled = state === "following" || followButtonLoading;

    const handleClick = () => {
        if (isDisabled) return;
        if (state === "pending") handleCancelRequest();
        else handleFollow();
    };

    const displayLabel = hovered && state === "pending" ? config.hoverLabel : config.label;
    const displayIcon = hovered && state === "pending" ? config.hoverIcon : config.icon;
    const displayColor = hovered && state === "pending" ? config.hoverColor : config.color;
    const displayBg = hovered && state === "pending" ? config.hoverBg : config.bg;
    const displayBorder = hovered && state === "pending" ? "1.5px solid rgba(255,80,80,0.25)" : config.border;

    return (
        <button
            onClick={handleClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            disabled={isDisabled}
            style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "7px 16px",
                minWidth: "100px",
                marginTop: "16px",
                borderRadius: "20px",
                border: displayBorder,
                background: displayBg,
                color: displayColor,
                fontSize: "13px",
                fontWeight: 500,
                letterSpacing: "0.01em",
                cursor: isDisabled ? "default" : "pointer",
                transition: "all 0.2s ease",
                outline: "none",
                whiteSpace: "nowrap",
                userSelect: "none",
            }}
        >
            {followButtonLoading ? (
                <CircularProgress
                    size={14}
                    sx={{ color: "#555" }}
                />
            ) : (
                <>
                    <span
                        style={{
                            display: "flex",
                            alignItems: "center",
                            transition: "color 0.2s ease",
                            color: displayColor,
                        }}
                    >
                        {displayIcon}
                    </span>
                    <span style={{ transition: "color 0.2s ease" }}>{displayLabel}</span>
                </>
            )}
        </button>
    );
};

export default FollowButton;