import { Button, CircularProgress } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

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

const FollowButton: React.FC<FollowButtonProps> = ({ isFollowing, profileData, followButtonLoading, handleFollow, handleCancelRequest }) => {
    const handleClick = () => {
        if (profileData?.is_request_active) {
            handleCancelRequest();
        } else if (!(isFollowing && profileData?.follow_status === "accepted")) {
            handleFollow();
        }
    };

    const label = profileData?.is_request_active
        ? "Request Pending"
        : isFollowing && profileData?.follow_status === "accepted"
          ? "Following"
          : "Follow";

    return (
        <Button
            onClick={handleClick}
            disabled={isFollowing && profileData?.follow_status === "accepted"}
            variant="contained"
            sx={{
                position: "relative",
                padding: profileData?.is_request_active ? "6px 12px 6px 16px" : "6px 16px",
                width: profileData?.is_request_active ? "160px" : isFollowing && profileData?.follow_status === "accepted" ? "115px" : "88.46px",
                mt: 2,
                borderRadius: "15px",
                color: profileData?.is_request_active ? "#606060" : "#000000",
                backgroundColor: profileData?.is_request_active ? "#000000" : "#ffffff",
                ":disabled": {
                    backgroundColor: "#000000",
                    color: "#505050",
                },
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                textAlign: "left",
                transition: "width 0.3s ease-in-out, background-color 0.3s, color 0.3s",
                "&:hover": {
                    "@media (hover: hover) and (pointer: fine)": {
                        "& svg": {
                            opacity: 1,
                        },
                        width: profileData?.is_request_active ? "186.76px" : "88.46px",
                    },
                },
            }}
        >
            {/* Spinner overlay */}
            {followButtonLoading && (
                <CircularProgress
                    size={18}
                    sx={{
                        color: "#606060",
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        marginTop: "-9px",
                        marginLeft: "-9px",
                    }}
                />
            )}

            {/* Always render label */}
            <span style={{ opacity: followButtonLoading ? 0 : 1, display: "flex", alignItems: "center" }}>
                {label}
                {profileData?.is_request_active && (
                    <DeleteIcon
                        sx={{
                            marginLeft: "8px",
                            fontSize: "20px",
                            opacity: 0,
                            transition: "opacity 0.3s ease-in-out",
                            flexShrink: 0,
                        }}
                    />
                )}
            </span>
        </Button>
    );
};

export default FollowButton;
