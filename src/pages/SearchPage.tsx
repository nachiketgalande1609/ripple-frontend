import { useState, useEffect, useRef } from "react";
import {
    TextField,
    Container,
    List,
    ListItem,
    ListItemText,
    IconButton,
    ListItemButton,
    Avatar,
    ListItemAvatar,
    LinearProgress,
    Box,
    Typography,
    useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useDebounce } from "../utils/utils";
import { getSearchResults, getSearchHistory, addToSearchHistory, deleteSearchHistoryItem } from "../services/api";
import { useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import BlankProfileImage from "../static/profile_blank.png";

import InputAdornment from "@mui/material/InputAdornment";

export default function SearchPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const debouncedQuery = useDebounce(searchQuery, 750);
    const navigate = useNavigate();
    const searchInputRef = useRef<HTMLInputElement>(null);

    const fullPlaceholder = "Search Users";
    const [placeholder, setPlaceholder] = useState("");
    const isLarge = useMediaQuery("(min-width:1281px)");

    useEffect(() => {
        let index = 0;
        let typingInterval: NodeJS.Timeout;

        const startTyping = () => {
            typingInterval = setInterval(() => {
                setPlaceholder(fullPlaceholder.slice(0, index + 1));
                index++;

                if (index === fullPlaceholder.length) {
                    clearInterval(typingInterval);
                    setTimeout(() => {
                        setPlaceholder("");
                        index = 0;
                        startTyping();
                    }, 1500); // Pause after full text before restarting
                }
            }, 100); // Typing speed
        };

        startTyping();

        return () => clearInterval(typingInterval);
    }, []);

    // Load search history
    useEffect(() => {
        const loadHistory = async () => {
            setLoading(true);
            try {
                const response = await getSearchHistory();
                setHistory(response.data);
            } catch (error) {
                console.error("Failed to load history:", error);
            } finally {
                setLoading(false);
            }
        };
        loadHistory();
    }, []);

    // Focus on search input when component mounts
    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, []);

    // Handle user click
    const handleUserClick = (targetUser: any) => {
        // Navigate immediately
        navigate(`/profile/${targetUser.id}`);

        // Fire off background tasks without awaiting
        addToSearchHistory(targetUser.id)
            .then(() => getSearchHistory())
            .then((historyResponse) => {
                setHistory(historyResponse.data.data);
            })
            .catch((error) => {
                console.error("Error saving history:", error);
            });
    };

    // Delete history item
    const handleDeleteHistory = async (historyId: number) => {
        const deletedItem = history.find((item) => item.history_id === historyId);
        setHistory((prev) => prev.filter((item) => item.history_id !== historyId));

        try {
            await deleteSearchHistoryItem(historyId);
        } catch (error) {
            console.error("Delete failed:", error);
            // Re-add item if API call fails
            if (deletedItem) {
                setHistory((prev) => [deletedItem, ...prev]);
            }
        }
    };

    // Search effect remains similar
    useEffect(() => {
        const search = async () => {
            if (!debouncedQuery) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const response = await getSearchResults(debouncedQuery);
                setResults(response.data.users);
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setLoading(false);
            }
        };
        search();
    }, [debouncedQuery]);

    return (
        <Container
            disableGutters
            sx={{
                maxWidth: "100%",
                minHeight: "100vh",
                width: isLarge ? "600px" : "525px",
                borderLeft: "1px solid #202327",
                borderRight: "1px solid #202327",
                p: 0,
            }}
        >
            <Box sx={{ borderBottom: "1px solid #202327", padding: "20px 15px 10px 15px" }}>
                <TextField
                    sx={{
                        "& .MuiInput-underline:before": { borderBottom: "none !important" },
                        "& .MuiInput-underline:after": { borderBottom: "none !important" },
                        "& .MuiInput-underline:hover:before": { borderBottom: "none !important" },
                    }}
                    fullWidth
                    placeholder={placeholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    inputRef={searchInputRef}
                    variant="standard"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: "gray" }} />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            {loading ? (
                <LinearProgress
                    sx={{
                        width: "100%",
                        height: "3px",
                        background: "linear-gradient(90deg, #7a60ff, #ff8800)",
                        "& .MuiLinearProgress-bar": {
                            background: "linear-gradient(90deg, #7a60ff, #ff8800)",
                        },
                    }}
                />
            ) : (
                <Box sx={{ padding: "8px 10px" }}>
                    {/* Search Results */}
                    {results.length > 0 ? (
                        <List sx={{ padding: 0 }}>
                            {results.map((user) => (
                                <ListItem key={user.id} sx={{ padding: "5px 0" }} onClick={() => handleUserClick(user)}>
                                    <ListItemButton
                                        sx={{
                                            padding: "4px 16px",
                                            borderRadius: "20px",
                                            "&:hover": { backgroundColor: "#202327" },
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar src={user.profile_picture || BlankProfileImage} />
                                        </ListItemAvatar>
                                        <ListItemText primary={user.username} secondary={user.email} />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    ) : debouncedQuery ? (
                        // No users found
                        <Box sx={{ padding: "10px", textAlign: "center", color: "gray" }}>
                            <Typography>No users found</Typography>
                        </Box>
                    ) : history?.length > 0 ? (
                        // Search history
                        <List sx={{ padding: 0 }}>
                            {history.map((item) => (
                                <ListItem key={item.history_id} sx={{ padding: "5px 0" }} onClick={() => navigate(`/profile/${item.id}`)}>
                                    <ListItemButton
                                        sx={{
                                            padding: "4px 16px",
                                            borderRadius: "20px",
                                            "&:hover": { backgroundColor: "#202327" },
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar src={item.profile_picture || BlankProfileImage} />
                                        </ListItemAvatar>
                                        <ListItemText primary={item.username} secondary={item.email} />
                                        <IconButton
                                            edge="end"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteHistory(item.history_id);
                                            }}
                                            sx={{
                                                color: "hsl(226, 11%, 40%)",
                                                "&:hover": { backgroundColor: "transparent", color: "#ffffff" },
                                            }}
                                        >
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        // No search input and no history
                        <Box sx={{ padding: "10px", textAlign: "center", color: "gray" }}>
                            <Typography> Search for users</Typography>
                        </Box>
                    )}
                </Box>
            )}
        </Container>
    );
}
