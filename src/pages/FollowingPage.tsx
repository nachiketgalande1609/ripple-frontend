import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Avatar,
  Stack,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Skeleton as MuiSkeleton,
  Fade,
  InputBase,
} from "@mui/material";
import { ArrowBack, Search, PersonOff } from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import BlankProfileImage from "../static/profile_blank.png";
import FollowButton from "./profile/FollowButton";
import {
  getFollowing,
  followUser,
  cancelFollowRequest,
  unfollowUser,
} from "../services/api";

interface FollowingUser {
  id: number;
  username: string;
  profile_picture?: string;
  is_following: boolean;
  is_request_active: boolean;
  is_private?: boolean;
  follow_status?: string;
}

/* ── Following row ────────────────────────────────────────────── */
const FollowingRow = ({
  user,
  currentUserId,
  onFollowChange,
}: {
  user: FollowingUser;
  currentUserId?: number;
  onFollowChange: (
    userId: number,
    following: boolean,
    requestActive: boolean,
  ) => void;
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const isOwnProfile = currentUserId === user.id;

  const handleFollow = async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const res = await followUser(
        currentUserId.toString(),
        user.id.toString(),
      );
      if (res?.success) onFollowChange(user.id, true, true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const res = await cancelFollowRequest(
        currentUserId.toString(),
        user.id.toString(),
      );
      if (res?.success) onFollowChange(user.id, false, false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const res = await unfollowUser(
        currentUserId.toString(),
        user.id.toString(),
      );
      if (res?.success) onFollowChange(user.id, false, false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Fade in timeout={250}>
      <ListItem
        component="div"
        sx={{
          borderRadius: "28px",
          px: 1.5,
          py: 1.25,
          mx: 1,
          mb: 0.5,
          transition: "background-color 0.15s",
          "&:hover": { bgcolor: "action.hover" },
          cursor: "default",
        }}
      >
        <ListItemAvatar
          sx={{ minWidth: 54, cursor: "pointer" }}
          onClick={() => navigate(`/profile/${user.id}`)}
        >
          <Avatar
            src={user.profile_picture || BlankProfileImage}
            sx={{
              width: 42,
              height: 42,
              border: "1px solid",
              borderColor: "divider",
            }}
          />
        </ListItemAvatar>
        <ListItemText
          onClick={() => navigate(`/profile/${user.id}`)}
          sx={{ cursor: "pointer", minWidth: 0 }}
          primary={
            <Typography
              sx={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
                fontSize: "0.845rem",
                color: "text.primary",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.username}
            </Typography>
          }
        />
        {!isOwnProfile && currentUserId && (
          <Box
            sx={{
              flexShrink: 0,
              ml: 1,
              "& button": { marginTop: "0 !important" },
            }}
          >
            <FollowButton
              isFollowing={user.is_following}
              profileData={user}
              followButtonLoading={loading}
              handleFollow={handleFollow}
              handleCancelRequest={handleCancelRequest}
              handleUnfollow={handleUnfollow}
            />
          </Box>
        )}
      </ListItem>
    </Fade>
  );
};

/* ── Page ─────────────────────────────────────────────────────── */
const FollowingPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const currentUser = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user") || "null")
    : {};

  const [following, setFollowing] = useState<FollowingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    const fetch = async () => {
      if (!userId) return;
      try {
        setLoading(true);
        const res = await getFollowing(userId);
        setFollowing(res.data.following || []);
        setUsername(res.data.username || "");
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [userId]);

  const filtered = following.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()),
  );

  const handleFollowChange = (
    uid: number,
    isFollowing: boolean,
    requestActive: boolean,
  ) => {
    setFollowing((prev) =>
      prev.map((u) =>
        u.id === uid
          ? {
              ...u,
              is_following: isFollowing,
              is_request_active: requestActive,
            }
          : u,
      ),
    );
  };

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        minHeight: "100vh",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* ── Sticky header ── */}
      <Box
        sx={{
          position: "sticky",
          top: { xs: "56px", sm: 0 },
          zIndex: 10,
          bgcolor: "background.default",
          px: { xs: 2, sm: 3 },
          py: 1.25,
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <IconButton
          onClick={() => navigate(-1)}
          size="small"
          sx={{
            width: 36,
            height: 36,
            borderRadius: "12px",
            bgcolor: "var(--nav-bg)",
            boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
            color: "text.secondary",
            "&:hover": {
              boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)",
              color: "text.primary",
            },
          }}
        >
          <ArrowBack sx={{ fontSize: 17 }} />
        </IconButton>
        <Box>
          <Typography
            sx={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "1rem",
              fontWeight: 500,
              color: "text.primary",
              lineHeight: 1.3,
            }}
          >
            {t("following.title")}
          </Typography>
          {username && (
            <Typography
              sx={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.75rem",
                color: "text.disabled",
              }}
            >
              @{username}
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ px: { xs: 1, sm: 2 }, pt: 1.5, pb: 3, maxWidth: "sm", mx: "auto" }}>
        {/* ── Search bar ── */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.25,
            py: 0.6,
            bgcolor: "var(--nav-bg)",
            borderRadius: "14px",
            boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
            mb: 1.5,
            transition: "box-shadow 0.15s",
            "&:focus-within": {
              boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)",
            },
            mx: 1,
          }}
        >
          <Search sx={{ fontSize: 17, color: "text.disabled", flexShrink: 0 }} />
          <InputBase
            placeholder={t("following.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              flex: 1,
              fontSize: "0.875rem",
              fontFamily: "'Inter', sans-serif",
              color: "text.primary",
              "& input::placeholder": { color: "text.disabled" },
            }}
          />
        </Box>

        {/* ── List ── */}
        {loading ? (
          <List disablePadding>
            {[...Array(6)].map((_, i) => (
              <ListItem
                key={i}
                component="div"
                sx={{ borderRadius: "28px", px: 1.5, py: 1.25, mx: 1, mb: 0.5 }}
              >
                <ListItemAvatar sx={{ minWidth: 54 }}>
                  <MuiSkeleton
                    variant="circular"
                    width={42}
                    height={42}
                    sx={{ bgcolor: "action.hover" }}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <MuiSkeleton
                      width="42%"
                      height={14}
                      sx={{ borderRadius: "5px", bgcolor: "action.hover" }}
                    />
                  }
                />
                <MuiSkeleton
                  variant="rounded"
                  width={68}
                  height={30}
                  sx={{ borderRadius: "9px", bgcolor: "action.hover" }}
                />
              </ListItem>
            ))}
          </List>
        ) : filtered.length === 0 ? (
          <Box
            sx={{
              py: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "16px",
                bgcolor: "var(--nav-bg)",
                boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PersonOff sx={{ fontSize: 26, color: "text.disabled" }} />
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  color: "text.primary",
                  mb: 0.375,
                }}
              >
                {search ? t("following.noResults") : t("following.notFollowing")}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.8rem",
                  color: "text.disabled",
                }}
              >
                {search
                  ? t("following.tryDifferentSearch")
                  : t("following.notFollowingDesc")}
              </Typography>
            </Box>
          </Box>
        ) : (
          <List disablePadding>
            {filtered.map((user) => (
              <FollowingRow
                key={user.id}
                user={user}
                currentUserId={currentUser?.id}
                onFollowChange={handleFollowChange}
              />
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default FollowingPage;
