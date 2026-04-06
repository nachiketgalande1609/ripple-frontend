import { useState, useEffect, useRef } from "react";
import {
  TextField,
  Container,
  List,
  ListItem,
  IconButton,
  ListItemButton,
  Avatar,
  ListItemAvatar,
  Box,
  Typography,
  Skeleton,
  Fade,
  Tabs,
  Tab,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import HistoryIcon from "@mui/icons-material/History";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import TagIcon from "@mui/icons-material/Tag";
import InputAdornment from "@mui/material/InputAdornment";
import { useDebounce } from "../utils/utils";
import {
  getSearchResults,
  getSearchHistory,
  addToSearchHistory,
  deleteSearchHistoryItem,
  searchByHashtag,
  getHashtagSearchHistory,
  addToHashtagSearchHistory,
  deleteHashtagSearchHistoryItem,
} from "../services/api";
import { useNavigate } from "react-router-dom";
import BlankProfileImage from "../static/profile_blank.png";
import VideoThumbnail from "../component/post/VideoThumbnail";

export default function SearchPage() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<0 | 1>(0);

  // People tab
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<any[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Hashtag tab
  const [tagQuery, setTagQuery] = useState("");
  const [tagResults, setTagResults] = useState<any[]>([]);
  const [tagLoading, setTagLoading] = useState(false);
  const [tagHistory, setTagHistory] = useState<any[]>([]);
  const [tagHistoryLoading, setTagHistoryLoading] = useState(true);

  const debouncedUserQuery = useDebounce(userQuery, 750);
  const debouncedTagQuery = useDebounce(tagQuery, 750);
  const navigate = useNavigate();
  const userInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 0) userInputRef.current?.focus();
    else tagInputRef.current?.focus();
  }, [activeTab]);

  useEffect(() => {
    const load = async () => {
      setHistoryLoading(true);
      setTagHistoryLoading(true);
      try {
        const [userHist, tagHist] = await Promise.all([
          getSearchHistory(),
          getHashtagSearchHistory(),
        ]);
        setHistory(userHist.data || []);
        setTagHistory(tagHist.data || []);
      } catch (e) {
        console.error("Failed to load history:", e);
      } finally {
        setHistoryLoading(false);
        setTagHistoryLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!debouncedUserQuery) {
        setUserResults([]);
        return;
      }
      setUserLoading(true);
      try {
        const res = await getSearchResults(debouncedUserQuery);
        setUserResults(res.data.users || []);
      } catch (e) {
        console.error("User search error:", e);
      } finally {
        setUserLoading(false);
      }
    };
    run();
  }, [debouncedUserQuery]);

  useEffect(() => {
    const run = async () => {
      const raw = tagQuery.startsWith("#") ? tagQuery.slice(1) : tagQuery;
      if (!raw.trim()) {
        setTagResults([]);
        return;
      }
      setTagLoading(true);
      try {
        const res = await searchByHashtag(raw.trim());
        const posts = res.data.posts || [];
        setTagResults(posts);
        if (posts.length > 0) {
          addToHashtagSearchHistory(raw.trim())
            .then(() => getHashtagSearchHistory())
            .then((r) => setTagHistory(r.data || []))
            .catch(() => {});
        }
      } catch (e) {
        console.error("Hashtag search error:", e);
      } finally {
        setTagLoading(false);
      }
    };
    run();
  }, [debouncedTagQuery]);

  const handleUserClick = (targetUser: any) => {
    navigate(`/profile/${targetUser.id}`);
    addToSearchHistory(targetUser.id)
      .then(() => getSearchHistory())
      .then((res) => setHistory(res.data.data || []))
      .catch((err) => console.error("Error saving history:", err));
  };

  const handleDeleteUserHistory = async (historyId: number) => {
    const deleted = history.find((item) => item.history_id === historyId);
    setHistory((prev) => prev.filter((item) => item.history_id !== historyId));
    try {
      await deleteSearchHistoryItem(historyId);
    } catch {
      if (deleted) setHistory((prev) => [deleted, ...prev]);
    }
  };

  const handleDeleteTagHistory = async (historyId: number) => {
    const deleted = tagHistory.find((item) => item.history_id === historyId);
    setTagHistory((prev) =>
      prev.filter((item) => item.history_id !== historyId),
    );
    try {
      await deleteHashtagSearchHistoryItem(historyId);
    } catch {
      if (deleted) setTagHistory((prev) => [deleted, ...prev]);
    }
  };

  // ── Style tokens (theme-aware) ───────────────────────────────

  const baseInputSx = {
    "& .MuiOutlinedInput-root": {
      bgcolor: theme.palette.background.paper,
      borderRadius: "10px",
      fontSize: "0.9rem",
      color: theme.palette.text.primary,
      "& fieldset": { borderColor: theme.palette.divider },
      "&:hover fieldset": { borderColor: theme.palette.text.disabled },
      "&.Mui-focused fieldset": {
        borderColor: theme.palette.primary.main,
        borderWidth: 1,
      },
    },
    "& input::placeholder": { color: theme.palette.text.disabled, opacity: 1 },
  };

  const tagInputSx = {
    ...baseInputSx,
    "& .MuiOutlinedInput-root": {
      ...baseInputSx["& .MuiOutlinedInput-root"],
      "& fieldset": { borderColor: `${theme.palette.primary.main}40` },
      "&:hover fieldset": { borderColor: theme.palette.primary.main },
    },
  };

  // ── Shared components ────────────────────────────────────────

  const LoadingBar = () => (
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
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, #7a60ff)`,
          animation: "slide 1.2s ease-in-out infinite",
          "@keyframes slide": {
            "0%": { transform: "translateX(-100%)", width: "60%" },
            "100%": { transform: "translateX(200%)", width: "60%" },
          },
        }}
      />
    </Box>
  );

  const SkeletonRow = () => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1 }}>
      <Skeleton
        variant="circular"
        width={40}
        height={40}
        sx={{ bgcolor: (t) => t.palette.action.hover, flexShrink: 0 }}
      />
      <Box sx={{ flex: 1 }}>
        <Skeleton
          variant="text"
          width="40%"
          height={16}
          sx={{ bgcolor: (t) => t.palette.action.hover, mb: 0.5 }}
        />
        <Skeleton
          variant="text"
          width="55%"
          height={13}
          sx={{ bgcolor: (t) => t.palette.action.hover }}
        />
      </Box>
    </Box>
  );

  const SectionHeader = ({
    icon,
    label,
  }: {
    icon: React.ReactNode;
    label: string;
  }) => (
    <Box
      sx={{
        px: 2.5,
        pt: 1,
        pb: 0.5,
        display: "flex",
        alignItems: "center",
        gap: 1,
      }}
    >
      {icon}
      <Typography
        variant="caption"
        sx={{
          color: (t) => t.palette.text.disabled,
          fontSize: "0.73rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </Typography>
    </Box>
  );

  const EmptyState = ({
    icon,
    primary,
    secondary,
  }: {
    icon: React.ReactNode;
    primary: string;
    secondary: string;
  }) => (
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
        {icon}
        <Typography
          sx={{ color: (t) => t.palette.text.secondary, fontSize: "0.9rem" }}
        >
          {primary}
        </Typography>
        <Typography
          sx={{ color: (t) => t.palette.text.disabled, fontSize: "0.8rem" }}
        >
          {secondary}
        </Typography>
      </Box>
    </Fade>
  );

  const UserRow = ({
    user,
    onDelete,
  }: {
    user: any;
    onDelete?: () => void;
  }) => (
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
                color: (t) => t.palette.text.disabled,
                width: 28,
                height: 28,
                "&:hover": {
                  color: (t) => t.palette.text.primary,
                  bgcolor: (t) => t.palette.action.hover,
                },
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
            "&:hover": { bgcolor: (t) => t.palette.action.hover },
            transition: "background 0.15s ease",
          }}
        >
          <ListItemAvatar sx={{ minWidth: 48 }}>
            <Avatar
              src={user.profile_picture || BlankProfileImage}
              sx={{ width: 38, height: 38 }}
            />
          </ListItemAvatar>
          <Box>
            <Typography
              sx={{
                color: (t) => t.palette.text.primary,
                fontSize: "0.875rem",
                fontWeight: 500,
                lineHeight: 1.4,
              }}
            >
              {user.username}
            </Typography>
            <Typography
              sx={{
                color: (t) => t.palette.text.secondary,
                fontSize: "0.78rem",
              }}
            >
              {user.email}
            </Typography>
          </Box>
        </ListItemButton>
      </ListItem>
    </Fade>
  );

  const TagHistoryRow = ({
    item,
    onDelete,
  }: {
    item: any;
    onDelete: () => void;
  }) => (
    <Fade in timeout={200}>
      <ListItem
        disablePadding
        sx={{ px: 1 }}
        secondaryAction={
          <IconButton
            edge="end"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            sx={{
              color: (t) => t.palette.text.disabled,
              width: 28,
              height: 28,
              "&:hover": {
                color: (t) => t.palette.text.primary,
                bgcolor: (t) => t.palette.action.hover,
              },
            }}
          >
            <CloseIcon sx={{ fontSize: 15 }} />
          </IconButton>
        }
      >
        <ListItemButton
          onClick={() => setTagQuery(item.tag)}
          sx={{
            borderRadius: "10px",
            px: 1.5,
            py: 1,
            "&:hover": { bgcolor: (t) => t.palette.action.hover },
            transition: "background 0.15s ease",
          }}
        >
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              flexShrink: 0,
              mr: 1.5,
              bgcolor: (t) => t.palette.background.paper,
              border: "1px solid",
              borderColor: (t) => t.palette.divider,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TagIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
          </Box>
          <Typography
            sx={{
              color: (t) => t.palette.text.primary,
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            #{item.tag}
          </Typography>
        </ListItemButton>
      </ListItem>
    </Fade>
  );

  const HashtagPostGrid = ({ posts }: { posts: any[] }) => (
    <Fade in timeout={200}>
      <Box>
        <Box sx={{ px: 2.5, pt: 1.5, pb: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: (t) => t.palette.text.disabled,
              fontSize: "0.73rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {posts.length} post{posts.length !== 1 ? "s" : ""}
          </Typography>
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "2px",
            px: "2px",
          }}
        >
          {posts.map((post) => (
            <Box
              key={post.id}
              onClick={() => navigate(`/posts/${post.id}`)}
              sx={{
                aspectRatio: "1",
                overflow: "hidden",
                cursor: "pointer",
                position: "relative",
                bgcolor: (t) => t.palette.background.paper,
              }}
            >
              {post.file_url?.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                <VideoThumbnail src={post.file_url} />
              ) : (
                <Box
                  component="img"
                  src={post.file_url}
                  alt=""
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              )}
            </Box>
          ))}
        </Box>
      </Box>
    </Fade>
  );

  // ── Tab panels ───────────────────────────────────────────────

  const PeopleTab = () => {
    const isSearching = !!debouncedUserQuery;
    const showResults = isSearching && userResults.length > 0 && !userLoading;
    const showNoResults =
      isSearching && !userLoading && userResults.length === 0;
    const showHistory = !isSearching && history.length > 0;
    const showEmpty = !isSearching && !historyLoading && history.length === 0;

    return (
      <Box sx={{ py: 1 }}>
        {showResults && (
          <List disablePadding>
            {userResults.map((user) => (
              <UserRow key={user.id} user={user} />
            ))}
          </List>
        )}
        {userLoading &&
          isSearching &&
          [1, 2, 3].map((i) => <SkeletonRow key={i} />)}
        {showNoResults && (
          <EmptyState
            icon={
              <PersonSearchIcon
                sx={{
                  fontSize: 40,
                  color: (t: any) => t.palette.action.disabled,
                }}
              />
            }
            primary={`No results for "${debouncedUserQuery}"`}
            secondary="Try a different username or email"
          />
        )}
        {showHistory && (
          <Fade in timeout={200}>
            <Box>
              <SectionHeader
                icon={
                  <HistoryIcon
                    sx={{
                      fontSize: 15,
                      color: (t: any) => t.palette.text.disabled,
                    }}
                  />
                }
                label="Recent"
              />
              <List disablePadding sx={{ mt: 0.5 }}>
                {history.map((item) => (
                  <UserRow
                    key={item.history_id}
                    user={item}
                    onDelete={() => handleDeleteUserHistory(item.history_id)}
                  />
                ))}
              </List>
            </Box>
          </Fade>
        )}
        {historyLoading &&
          !isSearching &&
          [1, 2, 3].map((i) => <SkeletonRow key={i} />)}
        {showEmpty && (
          <EmptyState
            icon={
              <SearchIcon
                sx={{
                  fontSize: 36,
                  color: (t: any) => t.palette.action.disabled,
                }}
              />
            }
            primary="Search for people"
            secondary="Find users by username or email"
          />
        )}
      </Box>
    );
  };

  const HashtagsTab = () => {
    const raw = tagQuery.startsWith("#") ? tagQuery.slice(1) : tagQuery;
    const isSearching = !!debouncedTagQuery && !!raw.trim();
    const showResults = isSearching && tagResults.length > 0 && !tagLoading;
    const showNoResults = isSearching && !tagLoading && tagResults.length === 0;
    const showHistory = !isSearching && tagHistory.length > 0;
    const showEmpty =
      !isSearching && !tagHistoryLoading && tagHistory.length === 0;

    return (
      <Box sx={{ py: 1 }}>
        {showResults && <HashtagPostGrid posts={tagResults} />}
        {tagLoading &&
          isSearching &&
          [1, 2, 3].map((i) => <SkeletonRow key={i} />)}
        {showNoResults && (
          <EmptyState
            icon={
              <TagIcon
                sx={{
                  fontSize: 40,
                  color: (t: any) => t.palette.action.disabled,
                }}
              />
            }
            primary={`No posts for #${raw}`}
            secondary="Try a different hashtag"
          />
        )}
        {showHistory && (
          <Fade in timeout={200}>
            <Box>
              <SectionHeader
                icon={
                  <HistoryIcon
                    sx={{
                      fontSize: 15,
                      color: (t: any) => t.palette.text.disabled,
                    }}
                  />
                }
                label="Recent"
              />
              <List disablePadding sx={{ mt: 0.5 }}>
                {tagHistory.map((item) => (
                  <TagHistoryRow
                    key={item.history_id}
                    item={item}
                    onDelete={() => handleDeleteTagHistory(item.history_id)}
                  />
                ))}
              </List>
            </Box>
          </Fade>
        )}
        {tagHistoryLoading &&
          !isSearching &&
          [1, 2, 3].map((i) => <SkeletonRow key={i} />)}
        {showEmpty && (
          <EmptyState
            icon={
              <TagIcon
                sx={{
                  fontSize: 36,
                  color: (t: any) => t.palette.action.disabled,
                }}
              />
            }
            primary="Search by hashtag"
            secondary="Find posts tagged with a specific topic"
          />
        )}
      </Box>
    );
  };

  // ── Render ───────────────────────────────────────────────────

  return (
    <Container
      disableGutters
      sx={{
        minHeight: "100vh",
        width: { xs: "100%", sm: "520px", lg: "600px" },
        maxWidth: "100%",
      }}
    >
      {/* Sticky header */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: (t) => t.palette.background.default,
          borderBottom: "1px solid",
          borderColor: (t) => t.palette.divider,
        }}
      >
        <Box sx={{ px: 2, pt: 2, pb: 1.5, position: "relative" }}>
          {activeTab === 0 ? (
            <TextField
              fullWidth
              placeholder="Search people…"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              inputRef={userInputRef}
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      sx={{
                        color: (t) => t.palette.text.disabled,
                        fontSize: 20,
                      }}
                    />
                  </InputAdornment>
                ),
                endAdornment: userQuery ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setUserQuery("")}
                      sx={{ color: (t) => t.palette.text.disabled, p: 0.25 }}
                    >
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={baseInputSx}
            />
          ) : (
            <TextField
              fullWidth
              placeholder="Search #hashtags…"
              value={tagQuery}
              onChange={(e) => setTagQuery(e.target.value)}
              inputRef={tagInputRef}
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <TagIcon
                      sx={{ color: theme.palette.primary.main, fontSize: 20 }}
                    />
                  </InputAdornment>
                ),
                endAdornment: tagQuery ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setTagQuery("")}
                      sx={{ color: (t) => t.palette.text.disabled, p: 0.25 }}
                    >
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={tagInputSx}
            />
          )}
          {(userLoading || tagLoading) && <LoadingBar />}
        </Box>

        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            minHeight: 40,
            px: 1,
            "& .MuiTabs-indicator": {
              backgroundColor: theme.palette.primary.main,
              height: "1.5px",
            },
            "& .MuiTab-root": {
              minHeight: 40,
              fontSize: "0.85rem",
              fontWeight: 500,
              textTransform: "none",
              color: theme.palette.text.disabled,
              "&.Mui-selected": { color: theme.palette.text.primary },
            },
          }}
        >
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <SearchIcon sx={{ fontSize: 15 }} />
                People
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <TagIcon sx={{ fontSize: 15 }} />
                Hashtags
              </Box>
            }
          />
        </Tabs>
      </Box>

      {activeTab === 0 ? <PeopleTab /> : <HashtagsTab />}
    </Container>
  );
}
