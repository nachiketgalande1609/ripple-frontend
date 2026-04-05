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
    Box,
    Typography,
    Skeleton,
    Divider,
    Fade,
    Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import HistoryIcon from "@mui/icons-material/History";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import InputAdornment from "@mui/material/InputAdornment";
import { useDebounce } from "../utils/utils";
import { getSearchResults, getSearchHistory, addToSearchHistory, deleteSearchHistoryItem } from "../services/api";
import { useNavigate } from "react-router-dom";
import BlankProfileImage from "../static/profile_blank.png";

export default function SearchPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(true);
    const debouncedQuery = useDebounce(searchQuery, 750);
    const navigate = useNavigate();
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Load search history
    useEffect(() => {
        const loadHistory = async () => {
            setHistoryLoading(true);
            try {
                const response = await getSearchHistory();
                setHistory(response.data);
            } catch (error) {
                console.error("Failed to load history:", error);
            } finally {
                setHistoryLoading(false);
            }
        };
        loadHistory();
    }, []);

    // Focus search input on mount
    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);

    const handleUserClick = (targetUser: any) => {
        navigate(`/profile/${targetUser.id}`);
        addToSearchHistory(targetUser.id)
            .then(() => getSearchHistory())
            .then((res) => setHistory(res.data.data))
            .catch((err) => console.error("Error saving history:", err));
    };

    const handleDeleteHistory = async (historyId: number) => {
        const deletedItem = history.find((item) => item.history_id === historyId);
        setHistory((prev) => prev.filter((item) => item.history_id !== historyId));
        try {
            await deleteSearchHistoryItem(historyId);
        } catch (error) {
            console.error("Delete failed:", error);
            if (deletedItem) setHistory((prev) => [deletedItem, ...prev]);
        }
    };

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

    const isSearching = !!debouncedQuery;
    const showResults = isSearching && results.length > 0;
    const showNoResults = isSearching && !loading && results.length === 0;
    const showHistory = !isSearching && history.length > 0;
    const showEmpty = !isSearching && !historyLoading && history.length === 0;

    const SkeletonRow = () => (
        <ListItem sx={{ px: 2, py: 0.75 }}>
            <ListItemAvatar>
                <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: "#2a2d31" }} />
            </ListItemAvatar>
            <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="45%" height={18} sx={{ bgcolor: "#2a2d31", mb: 0.5 }} />
                <Skeleton variant="text" width="60%" height={14} sx={{ bgcolor: "#2a2d31" }} />
            </Box>
        </ListItem>
    );

    const UserRow = ({ user, onDelete }: { user: any; onDelete?: () => void }) => (
        <Fade in timeout={200}>
            <ListItem
                disablePadding
                sx={{ px: 1 }}
                secondaryAction={
                    onDelete ? (
                        <IconButton
                            edge="end"
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            sx={{
                                color: "hsl(226, 11%, 45%)",
                                width: 28,
                                height: 28,
                                "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.06)" },
                            }}
                        >
                            <CloseIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                    ) : undefined
                }
            >
                <ListItemButton
                    onClick={() => handleUserClick(user)}
                    sx={{
                        borderRadius: "10px",
                        px: 1.5,
                        py: 1,
                        gap: 0,
                        "&:hover": { bgcolor: "rgba(255,255,255,0.04)" },
                        transition: "background 0.15s ease",
                    }}
                >
                    <ListItemAvatar sx={{ minWidth: 48 }}>
                        <Avatar
                            src={user.profile_picture || BlankProfileImage}
                            sx={{ width: 38, height: 38 }}
                        />
                    </ListItemAvatar>
                    <ListItemText
                        primary={
                            <Typography
                                variant="body2"
                                fontWeight={500}
                                sx={{ color: "#e7e9ea", fontSize: "0.875rem", lineHeight: 1.4 }}
                            >
                                {user.username}
                            </Typography>
                        }
                        secondary={
                            <Typography
                                variant="caption"
                                sx={{ color: "hsl(226, 11%, 50%)", fontSize: "0.78rem" }}
                            >
                                {user.email}
                            </Typography>
                        }
                        sx={{ my: 0 }}
                    />
                </ListItemButton>
            </ListItem>
        </Fade>
    );

    return (
        <Container
            disableGutters
            sx={{
                minHeight: "100vh",
                width: { xs: "100%", sm: "520px", lg: "600px" },
                maxWidth: "100%",
                borderLeft: { sm: "1px solid #202327" },
                borderRight: { sm: "1px solid #202327" },
            }}
        >
            {/* Sticky search bar */}
            <Box
                sx={{
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    bgcolor: "#000",
                    borderBottom: "1px solid #202327",
                    px: 2,
                    pt: 2,
                    pb: 1.5,
                }}
            >
                <TextField
                    fullWidth
                    placeholder="Search users"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    inputRef={searchInputRef}
                    variant="outlined"
                    size="small"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: "hsl(226, 11%, 45%)", fontSize: 20 }} />
                            </InputAdornment>
                        ),
                        endAdornment: searchQuery ? (
                            <InputAdornment position="end">
                                <IconButton
                                    size="small"
                                    onClick={() => setSearchQuery("")}
                                    sx={{ color: "hsl(226, 11%, 45%)", p: 0.25 }}
                                >
                                    <CloseIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </InputAdornment>
                        ) : null,
                    }}
                    sx={{
                        "& .MuiOutlinedInput-root": {
                            bgcolor: "#16191c",
                            borderRadius: "10px",
                            fontSize: "0.9rem",
                            color: "#e7e9ea",
                            "& fieldset": { borderColor: "#2e3338" },
                            "&:hover fieldset": { borderColor: "#3e4348" },
                            "&.Mui-focused fieldset": { borderColor: "#1d9bf0", borderWidth: 1 },
                        },
                        "& input::placeholder": { color: "hsl(226, 11%, 45%)", opacity: 1 },
                    }}
                />

                {/* Loading bar */}
                {loading && (
                    <Box
                        sx={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: "2px",
                            overflow: "hidden",
                        }}
                    >
                        <Box
                            sx={{
                                height: "100%",
                                background: "linear-gradient(90deg, #1d9bf0, #7a60ff)",
                                animation: "slide 1.2s ease-in-out infinite",
                                "@keyframes slide": {
                                    "0%": { transform: "translateX(-100%)", width: "60%" },
                                    "100%": { transform: "translateX(200%)", width: "60%" },
                                },
                            }}
                        />
                    </Box>
                )}
            </Box>

            {/* Content area */}
            <Box sx={{ py: 1 }}>
                {/* Search results */}
                {showResults && (
                    <List disablePadding>
                        {results.map((user) => (
                            <UserRow key={user.id} user={user} />
                        ))}
                    </List>
                )}

                {/* Search loading skeletons */}
                {loading && isSearching && (
                    <List disablePadding>
                        {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
                    </List>
                )}

                {/* No results */}
                {showNoResults && (
                    <Fade in timeout={300}>
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                py: 6,
                                gap: 1,
                            }}
                        >
                            <PersonSearchIcon sx={{ fontSize: 40, color: "#2e3338" }} />
                            <Typography sx={{ color: "hsl(226, 11%, 45%)", fontSize: "0.9rem" }}>
                                No results for{" "}
                                <Box component="span" sx={{ color: "#e7e9ea", fontWeight: 500 }}>
                                    "{debouncedQuery}"
                                </Box>
                            </Typography>
                            <Typography sx={{ color: "hsl(226, 11%, 35%)", fontSize: "0.8rem" }}>
                                Try a different username or email
                            </Typography>
                        </Box>
                    </Fade>
                )}

                {/* History */}
                {showHistory && (
                    <Fade in timeout={200}>
                        <Box>
                            <Box sx={{ px: 2.5, pt: 1, pb: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
                                <HistoryIcon sx={{ fontSize: 15, color: "hsl(226, 11%, 40%)" }} />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: "hsl(226, 11%, 40%)",
                                        fontSize: "0.73rem",
                                        fontWeight: 600,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.06em",
                                    }}
                                >
                                    Recent
                                </Typography>
                            </Box>
                            <List disablePadding sx={{ mt: 0.5 }}>
                                {history.map((item) => (
                                    <UserRow
                                        key={item.history_id}
                                        user={item}
                                        onDelete={() => handleDeleteHistory(item.history_id)}
                                    />
                                ))}
                            </List>
                        </Box>
                    </Fade>
                )}

                {/* History loading */}
                {historyLoading && !isSearching && (
                    <List disablePadding sx={{ mt: 1 }}>
                        {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
                    </List>
                )}

                {/* Empty state */}
                {showEmpty && (
                    <Fade in timeout={300}>
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                py: 8,
                                gap: 1,
                            }}
                        >
                            <SearchIcon sx={{ fontSize: 36, color: "#2e3338" }} />
                            <Typography sx={{ color: "hsl(226, 11%, 45%)", fontSize: "0.9rem" }}>
                                Search for people
                            </Typography>
                        </Box>
                    </Fade>
                )}
            </Box>
        </Container>
    );
}