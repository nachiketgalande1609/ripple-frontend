import { useEffect, useRef, useState } from "react";
import { Dialog, Box, Typography, Avatar, InputBase, IconButton } from "@mui/material";
import { Close as CloseIcon, Search as SearchIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import BlankProfileImage from "../../static/profile_blank.png";

interface User {
    id: number;
    username: string;
    profile_picture: string;
    isOnline: boolean;
}

interface NewChatUsersListProps {
    anchorEl: HTMLElement | null; // add this
    open: boolean;
    setAnchorEl: (el: HTMLElement | null) => void;
    usersList: User[];
    handleUserClick: (userId: number) => void;
}

const NewChatUsersList = ({ open, setAnchorEl, usersList }: NewChatUsersListProps) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const searchInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (open) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        } else {
            setSearchTerm("");
        }
    }, [open]);

    const filteredUsers = usersList.filter((u) => u.username.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleClose = () => setAnchorEl(null);

    const handleUserClick = (user: User) => {
        navigate(`/messages/${user.id}`, { state: user });
        handleClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            PaperProps={{
                sx: {
                    backgroundColor: (t) => t.palette.background.paper,
                    border: "1px solid",
                    borderColor: (t) => t.palette.divider,
                    borderRadius: "16px",
                    width: 380,
                    maxWidth: "95vw",
                    overflow: "hidden",
                    boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
                },
            }}
            BackdropProps={{ sx: { backgroundColor: "rgba(0,0,0,0.6)" } }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2.25,
                    pt: 2,
                    pb: 1.5,
                }}
            >
                <Typography
                    sx={{
                        fontSize: "0.94rem",
                        fontWeight: 500,
                        color: (t) => t.palette.text.primary,
                    }}
                >
                    New message
                </Typography>
                <IconButton
                    size="small"
                    onClick={handleClose}
                    sx={{
                        color: (t) => t.palette.text.secondary,
                        backgroundColor: (t) => t.palette.action.hover,
                        width: 28,
                        height: 28,
                        "&:hover": {
                            backgroundColor: (t) => t.palette.action.selected,
                            color: (t) => t.palette.text.primary,
                        },
                    }}
                >
                    <CloseIcon sx={{ fontSize: 15 }} />
                </IconButton>
            </Box>

            {/* Search */}
            <Box sx={{ px: 1.75, pb: 1.5 }}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        backgroundColor: (t) => t.palette.action.hover,
                        border: "1px solid",
                        borderColor: (t) => t.palette.divider,
                        borderRadius: "10px",
                        px: 1.25,
                        py: 0.75,
                    }}
                >
                    <SearchIcon
                        sx={{
                            fontSize: 16,
                            color: (t) => t.palette.text.disabled,
                            flexShrink: 0,
                        }}
                    />
                    <InputBase
                        inputRef={searchInputRef}
                        placeholder="Search people..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{
                            flex: 1,
                            fontSize: "0.88rem",
                            color: (t) => t.palette.text.primary,
                            "& input::placeholder": { color: (t) => t.palette.text.disabled },
                        }}
                    />
                </Box>
            </Box>

            {/* User list */}
            <Box
                sx={{
                    borderTop: "1px solid",
                    borderColor: (t) => t.palette.divider,
                    maxHeight: 320,
                    overflowY: "auto",
                }}
            >
                {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                        <Box
                            key={user.id}
                            onClick={() => handleUserClick(user)}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                px: 2,
                                py: 1.25,
                                cursor: "pointer",
                                "&:hover": { backgroundColor: (t) => t.palette.action.hover },
                            }}
                        >
                            <Box sx={{ position: "relative", flexShrink: 0 }}>
                                <Avatar src={user.profile_picture || BlankProfileImage} sx={{ width: 38, height: 38 }} />
                                {user.isOnline && (
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            bottom: 1,
                                            right: 1,
                                            width: 9,
                                            height: 9,
                                            borderRadius: "50%",
                                            backgroundColor: (t) => t.palette.success.main,
                                            border: "2px solid",
                                            borderColor: (t) => t.palette.background.paper,
                                        }}
                                    />
                                )}
                            </Box>
                            <Typography
                                sx={{
                                    fontSize: "0.88rem",
                                    color: (t) => t.palette.text.primary,
                                }}
                            >
                                {user.username}
                            </Typography>
                        </Box>
                    ))
                ) : (
                    <Box sx={{ px: 2, py: 3, textAlign: "center" }}>
                        <Typography
                            sx={{
                                fontSize: "0.85rem",
                                color: (t) => t.palette.text.disabled,
                            }}
                        >
                            No users found
                        </Typography>
                    </Box>
                )}
            </Box>
        </Dialog>
    );
};

export default NewChatUsersList;
