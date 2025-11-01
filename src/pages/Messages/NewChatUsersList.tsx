import { useState, useEffect, useRef } from "react";
import { Menu, MenuItem, Avatar, TextField, Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import BlankProfileImage from "../../static/profile_blank.png";

interface User {
    id: number;
    username: string;
    profile_picture: string;
    isOnline: boolean;
}

// Define props for the component
interface NewChatUsersListProps {
    anchorEl: HTMLElement | null;
    open: boolean;
    setAnchorEl: (el: HTMLElement | null) => void;
    usersList: User[];
    handleUserClick: (userId: number) => void;
}

const NewChatUsersList = ({ anchorEl, open, setAnchorEl, usersList }: NewChatUsersListProps) => {
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState("");
    const searchInputRef = useRef<HTMLInputElement | null>(null);

    // Focus the input field when the menu opens
    useEffect(() => {
        if (open) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100); // Small delay to ensure menu opens before focusing
        }
    }, [open]);

    // Filter users based on the search term
    const filteredUsers = usersList.filter((user) => user.username.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleUserClick = (user: any) => {
        navigate(`/messages/${user.id}`, { state: user });
        setAnchorEl(null);
    };

    return (
        <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
            }}
            transformOrigin={{
                vertical: "top",
                horizontal: "right",
            }}
            PaperProps={{
                sx: { minWidth: 250, padding: 0, backgroundColor: "#000000", borderRadius: "10px" },
            }}
            MenuListProps={{ sx: { p: 0 } }}
            sx={{ backgroundColor: "rgb(0, 0, 0, 0.5)" }}
        >
            <Box sx={{ padding: "14px 10px 2px 10px", borderBottom: "1px solid #444444" }}>
                <TextField
                    inputRef={(el) => (searchInputRef.current = el)} // Ensure ref captures the input field
                    variant="standard"
                    size="small"
                    placeholder="Search users..."
                    fullWidth
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{
                        "& .MuiInputBase-input": {
                            fontSize: "0.9rem",
                            color: "#ffffff",
                        },
                        "& .MuiInput-underline:before": {
                            borderBottom: "none !important",
                        },
                        "& .MuiInput-underline:after": {
                            borderBottom: "none !important",
                        },
                        "& .MuiInput-underline:hover:before": {
                            borderBottom: "none !important",
                        },
                        mb: 1,
                    }}
                />
            </Box>

            {/* User list */}
            {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                    <MenuItem key={user.id} onClick={() => handleUserClick(user)} sx={{ p: "10px 12px" }}>
                        <Avatar src={user.profile_picture || BlankProfileImage} sx={{ mr: 2 }} />
                        <Typography sx={{ fontSize: "0.9rem" }}>{user.username}</Typography>
                    </MenuItem>
                ))
            ) : (
                <MenuItem disabled sx={{ p: "18px 12px" }}>
                    <Typography sx={{ fontSize: "0.9rem" }}>No users found</Typography>
                </MenuItem>
            )}
        </Menu>
    );
};

export default NewChatUsersList;
