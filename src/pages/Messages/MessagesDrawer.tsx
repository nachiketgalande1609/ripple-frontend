import React, { useEffect, useState, useMemo } from "react";
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  Box,
  IconButton,
  Skeleton,
  InputBase,
} from "@mui/material";
import {
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import NotificationsOffRoundedIcon from "@mui/icons-material/NotificationsOffRounded";
import { getFollowingUsers } from "../../services/api";
import NewChatUsersList from "./NewChatUsersList";
import BlankProfileImage from "../../static/profile_blank.png";
import { timeAgo } from "../../utils/utils";

type MessagesDrawerProps = {
  users: User[];
  onlineUsers: string[];
  selectedUser: User | null;
  handleUserClick: (userId: number) => void;
  anchorEl: HTMLElement | null;
  setAnchorEl: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  mutedUserIds: Set<number>;
};

type User = {
  id: number;
  username: string;
  profile_picture: string;
  isOnline: boolean;
  latest_message: string;
  latest_message_timestamp: string;
  unread_count: number;
};

const AVATAR_COLORS = [
  { bg: "#E6F1FB", color: "#185FA5" },
  { bg: "#EEEDFE", color: "#534AB7" },
  { bg: "#E1F5EE", color: "#0F6E56" },
  { bg: "#FAEEDA", color: "#854F0B" },
  { bg: "#FAECE7", color: "#993C1D" },
  { bg: "#FBEAF0", color: "#993556" },
  { bg: "#EAF3DE", color: "#3B6D11" },
  { bg: "#FCEBEB", color: "#A32D2D" },
];

const getAvatarColor = (username: string) => {
  const index =
    username.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

const getInitials = (username: string) =>
  username
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const UserSkeleton = () => (
  <Box
    sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1.75, py: 1.25 }}
  >
    <Skeleton
      variant="circular"
      width={42}
      height={42}
      sx={{ bgcolor: (t) => t.palette.action.hover, flexShrink: 0 }}
    />
    <Box sx={{ flex: 1 }}>
      <Skeleton
        variant="text"
        width="45%"
        height={14}
        sx={{ bgcolor: (t) => t.palette.action.hover }}
      />
      <Skeleton
        variant="text"
        width="70%"
        height={12}
        sx={{ bgcolor: (t) => t.palette.action.hover, mt: 0.5 }}
      />
    </Box>
  </Box>
);

const MessagesDrawer: React.FC<MessagesDrawerProps> = ({
  users,
  onlineUsers,
  selectedUser,
  handleUserClick,
  anchorEl,
  setAnchorEl,
  mutedUserIds,
}) => {
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const open = Boolean(anchorEl);

  const fetchUsersList = async () => {
    setLoading(true);
    try {
      const response = await getFollowingUsers();
      if (response.success) setUsersList(response.data);
    } catch (error) {
      console.error("Error fetching users list:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersList();
  }, []);


  const sortedUsers = useMemo(
    () =>
      [...users].sort(
        (a, b) =>
          new Date(b.latest_message_timestamp).getTime() -
          new Date(a.latest_message_timestamp).getTime(),
      ),
    [users],
  );

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sortedUsers;
    return sortedUsers.filter((u) => u.username.toLowerCase().includes(q));
  }, [sortedUsers, search]);

  return (
    <Box
      sx={{
        width: { sm: "250px", md: "300px", lg: "320px" },
        backgroundColor: (t) => t.palette.background.paper,
        color: (t) => t.palette.text.primary,
        borderRight: "1px solid",
        borderColor: (t) => t.palette.divider,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 2,
          py: 1.75,
          borderBottom: "1px solid",
          borderColor: (t) => t.palette.divider,
          flexShrink: 0,
        }}
      >
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: "0.975rem",
            color: (t) => t.palette.text.primary,
          }}
        >
          Messages
        </Typography>
        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          size="small"
          sx={{
            width: 30,
            height: 30,
            border: "1px solid",
            borderColor: (t) => t.palette.divider,
            borderRadius: 1.5,
            color: (t) => t.palette.text.secondary,
            "&:hover": {
              color: (t) => t.palette.text.primary,
              backgroundColor: (t) => t.palette.action.hover,
            },
          }}
        >
          <PersonAddIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Box>

      {/* Search */}
      <Box
        sx={{
          px: 1.5,
          py: 1,
          borderBottom: "1px solid",
          borderColor: (t) => t.palette.divider,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.25,
            py: 0.6,
            borderRadius: 2,
            backgroundColor: (t) => t.palette.action.hover,
            border: "1px solid transparent",
            "&:focus-within": {
              border: "1px solid",
              borderColor: (t) => t.palette.divider,
              backgroundColor: (t) => t.palette.background.paper,
            },
          }}
        >
          <SearchIcon
            sx={{
              fontSize: 15,
              color: (t) => t.palette.text.disabled,
              flexShrink: 0,
            }}
          />
          <InputBase
            placeholder="Search messages…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              flex: 1,
              fontSize: "0.8rem",
              color: (t) => t.palette.text.primary,
              "& input::placeholder": {
                color: (t) => t.palette.text.disabled,
                opacity: 1,
              },
            }}
          />
        </Box>
      </Box>

      <NewChatUsersList
        anchorEl={anchorEl}
        open={open}
        setAnchorEl={setAnchorEl}
        usersList={usersList}
        handleUserClick={handleUserClick}
      />

      {!loading && filteredUsers.length > 0 && (
        <Typography
          sx={{
            fontSize: "0.68rem",
            fontWeight: 600,
            color: (t) => t.palette.text.disabled,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            px: 1.75,
            pt: 1.25,
            pb: 0.5,
            flexShrink: 0,
          }}
        >
          Recent
        </Typography>
      )}

      {/* List */}
      <Box sx={{ overflowY: "auto", flex: 1 }}>
        {loading ? (
          [...Array(6)].map((_, i) => <UserSkeleton key={i} />)
        ) : filteredUsers.length === 0 ? (
          <Box sx={{ mt: 6, textAlign: "center", px: 2 }}>
            <Typography
              sx={{
                color: (t) => t.palette.text.disabled,
                fontSize: "0.82rem",
              }}
            >
              {search ? "No results found" : "No conversations yet"}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {filteredUsers.map((user) => {
              const isOnline = onlineUsers.includes(user.id.toString());
              const unreadCount = user.unread_count || 0;
              const isSelected = selectedUser?.id === user.id;
              const timestamp = timeAgo(user.latest_message_timestamp);
              const avatarColor = getAvatarColor(user.username);
              const initials = getInitials(user.username);
              const isMuted = mutedUserIds.has(user.id);

              return (
                <ListItem
                  component="button"
                  key={user.id}
                  onClick={() => handleUserClick(user.id)}
                  sx={{
                    px: 1.5,
                    py: 1,
                    width: "100%",
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: isSelected
                      ? (t) => t.palette.action.selected
                      : "transparent",
                    borderBottom: "0.5px solid",
                    borderColor: (t) => t.palette.divider,
                    transition: "background-color 0.1s ease",
                    "&:last-of-type": { borderBottom: "none" },
                    "&:hover": {
                      backgroundColor: isSelected
                        ? (t) => t.palette.action.selected
                        : (t) => t.palette.action.hover,
                    },
                    display: "flex",
                    alignItems: "center",
                    gap: 0,
                  }}
                >
                  {/* Avatar */}
                  <ListItemAvatar
                    sx={{ position: "relative", minWidth: "unset", mr: 1.5 }}
                  >
                    {user.profile_picture ? (
                      <Box
                        component="img"
                        src={user.profile_picture || BlankProfileImage}
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: "50%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: "50%",
                          backgroundColor: avatarColor.bg,
                          color: avatarColor.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {initials}
                      </Box>
                    )}
                    {isOnline && (
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          backgroundColor: (t) => t.palette.success.main,
                          position: "absolute",
                          bottom: 1,
                          right: 1,
                          border: "2px solid",
                          borderColor: (t) => t.palette.background.paper,
                        }}
                      />
                    )}
                  </ListItemAvatar>

                  {/* Text */}
                  <ListItemText
                    disableTypography
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          gap: 1,
                          mb: 0.25,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.845rem",
                            fontWeight: unreadCount > 0 ? 600 : 500,
                            color: (t) => t.palette.text.primary,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {user.username}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "0.68rem",
                            color: (t) =>
                              unreadCount > 0
                                ? t.palette.primary.main
                                : t.palette.text.disabled,
                            flexShrink: 0,
                            fontWeight: unreadCount > 0 ? 600 : 400,
                          }}
                        >
                          {timestamp}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.76rem",
                            color: (t) =>
                              unreadCount > 0
                                ? t.palette.text.secondary
                                : t.palette.text.disabled,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            fontWeight: unreadCount > 0 ? 500 : 400,
                            maxWidth:
                              isMuted || unreadCount > 0
                                ? "calc(100% - 28px)"
                                : "100%",
                          }}
                        >
                          {user.latest_message}
                        </Typography>

                        {/* Right-side indicator: muted bell OR unread count, never both */}
                        {isMuted ? (
                          <NotificationsOffRoundedIcon
                            sx={{
                              ml: 1,
                              flexShrink: 0,
                              fontSize: "0.85rem",
                              color: (t) => t.palette.text.disabled,
                            }}
                          />
                        ) : unreadCount > 0 ? (
                          <Box
                            sx={{
                              ml: 1,
                              flexShrink: 0,
                              minWidth: 17,
                              height: 17,
                              borderRadius: "9px",
                              backgroundColor: (t) => t.palette.primary.main,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              px: 0.5,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: "0.62rem",
                                fontWeight: 600,
                                color: "#fff",
                                lineHeight: 1,
                              }}
                            >
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </Typography>
                          </Box>
                        ) : null}
                      </Box>
                    }
                    sx={{ my: 0, overflow: "hidden" }}
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default MessagesDrawer;
