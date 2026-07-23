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
        hoverColor: string;
    }
> = {
    follow: {
        label: "Follow",
        hoverLabel: "Follow",
        icon: <PersonAddIcon sx={{ fontSize: 14 }} />,
        hoverIcon: <PersonAddIcon sx={{ fontSize: 14 }} />,
        hoverColor: "inherit",
    },
    pending: {
        label: "Requested",
        hoverLabel: "Cancel",
        icon: <HourglassTopIcon sx={{ fontSize: 14 }} />,
        hoverIcon: <CloseIcon sx={{ fontSize: 14 }} />,
        hoverColor: "#ff5050",
    },
    following: {
        label: "Following",
        hoverLabel: "Unfollow",
        icon: <CheckIcon sx={{ fontSize: 14 }} />,
        hoverIcon: <CloseIcon sx={{ fontSize: 14 }} />,
        hoverColor: "#ff5050",
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
                padding: "0 16px",
                height: "34px",
                minWidth: "100px",
                borderRadius: "14px",
                border: "none",
                background: "var(--nav-bg)",
                boxShadow: showHoverState
                    ? "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)"
                    : "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                color: showHoverState ? config.hoverColor : "inherit",
                fontSize: "13px",
                fontWeight: 500,
                letterSpacing: "0.01em",
                cursor: followButtonLoading ? "default" : "pointer",
                transition: "box-shadow 0.35s cubic-bezier(0.4,0,0.2,1), color 0.2s ease",
                outline: "none",
                whiteSpace: "nowrap",
                userSelect: "none",
            }}
        >
            {followButtonLoading ? (
                <CircularProgress size={14} sx={{ color: "inherit" }} />
            ) : (
                <>
                    <span style={{ display: "flex", alignItems: "center" }}>
                        {showHoverState ? config.hoverIcon : config.icon}
                    </span>
                    <span>{showHoverState ? config.hoverLabel : config.label}</span>
                </>
            )}
        </button>
    );
};

export default FollowButton;
