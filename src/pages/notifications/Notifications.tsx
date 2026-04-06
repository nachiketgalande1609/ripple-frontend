import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Container,
  List,
  Typography,
  Skeleton,
  useMediaQuery,
  Tab,
  Tabs,
  Badge,
  useTheme,
} from "@mui/material";
import {
  followUser,
  getNotifications,
  respondToFollowRequest,
} from "../../services/api";
import { useGlobalStore } from "../../store/store";
import NotificationCard from "./NotificationCard";

interface Notification {
  id: number;
  type: string;
  message: string;
  post_id: number | null;
  created_at: string;
  sender_id: string;
  username: string;
  profile_picture: string;
  file_url?: string;
  request_status: string;
  requester_id?: number;
  request_id: number;
}

const NotificationSkeleton = () => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      px: 2,
      py: 1.5,
      mb: 1,
      borderRadius: "14px",
      backgroundColor: (t) => t.palette.background.paper,
      border: "1px solid",
      borderColor: (t) => t.palette.divider,
    }}
  >
    <Skeleton
      variant="circular"
      width={50}
      height={50}
      sx={{ bgcolor: (t) => t.palette.action.hover, flexShrink: 0 }}
    />
    <Box sx={{ flex: 1 }}>
      <Skeleton
        variant="text"
        width="60%"
        height={18}
        sx={{ bgcolor: (t) => t.palette.action.hover }}
      />
      <Skeleton
        variant="text"
        width="30%"
        height={14}
        sx={{ bgcolor: (t) => t.palette.action.hover, mt: 0.5 }}
      />
    </Box>
  </Box>
);

const NotificationsPage = () => {
  const theme = useTheme();
  const { unreadNotificationsCount, resetNotificationsCount } =
    useGlobalStore();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<0 | 1>(0);
  const currentUser = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user") || "")
    : {};
  const isLarge = useMediaQuery("(min-width:1281px)");
  const [followRequestAcceptLoading, setFollowRequestAcceptLoading] =
    useState(false);
  const [followRequestRejectLoading, setFollowRequestRejectLoading] =
    useState(false);

  async function fetchNotifications() {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      const res = await getNotifications();
      setNotifications(res.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
    resetNotificationsCount();
  }, [currentUser?.id, unreadNotificationsCount]);

  const handleFollowBack = async (userId: string) => {
    if (!currentUser?.id || !userId) return;
    try {
      setLoading(true);
      const res = await followUser(currentUser.id.toString(), userId);
      if (res?.success) await fetchNotifications();
    } catch (error) {
      console.error("Failed to follow the user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowRequestResponse = async (
    request_id: number,
    response: "accepted" | "rejected",
  ) => {
    response === "accepted"
      ? setFollowRequestAcceptLoading(true)
      : setFollowRequestRejectLoading(true);
    try {
      setLoading(true);
      const res = await respondToFollowRequest(request_id, response);
      if (res?.success) await fetchNotifications();
    } catch (error) {
      console.error(`Failed to ${response} the follow request:`, error);
    } finally {
      setLoading(false);
      setFollowRequestAcceptLoading(false);
      setFollowRequestRejectLoading(false);
    }
  };

  const allNotifications = useMemo(
    () =>
      notifications.filter(
        (n) => n.type !== "follow_request" || n.request_status === "accepted",
      ),
    [notifications],
  );

  const followRequests = useMemo(
    () =>
      notifications.filter(
        (n) => n.type === "follow_request" && n.request_status === "pending",
      ),
    [notifications],
  );

  const pendingRequestCount = useMemo(
    () => followRequests.filter((n) => n.request_status === "pending").length,
    [followRequests],
  );

  const visibleNotifications =
    activeTab === 0 ? allNotifications : followRequests;

  return (
    <Container
      sx={{
        maxWidth: "100%",
        width: isLarge ? "600px" : "525px",
        mt: 4,
        px: { xs: 1.5, sm: 2 },
        height: {
          xs: "calc(100dvh - 157px - env(safe-area-inset-bottom))",
          sm: "100dvh",
        },
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Typography
        sx={{
          fontSize: "1.05rem",
          fontWeight: 600,
          color: (t) => t.palette.text.primary,
          mb: 2,
          px: 0.5,
        }}
      >
        Notifications
      </Typography>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, val) => setActiveTab(val)}
        sx={{
          mb: 2,
          minHeight: 36,
          "& .MuiTabs-indicator": {
            backgroundColor: theme.palette.text.primary,
            height: "2px",
            borderRadius: "2px",
          },
          "& .MuiTab-root": {
            textTransform: "none",
            fontSize: "0.875rem",
            fontWeight: 500,
            minHeight: 36,
            color: theme.palette.text.disabled,
            px: 0,
            mr: 3,
            "&.Mui-selected": {
              color: theme.palette.text.primary,
              fontWeight: 600,
            },
          },
        }}
        TabIndicatorProps={{ style: { bottom: 0 } }}
      >
        <Tab label="All" value={0} disableRipple />
        <Tab
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              Follow Requests
              {pendingRequestCount > 0 && (
                <Badge
                  badgeContent={pendingRequestCount}
                  sx={{
                    "& .MuiBadge-badge": {
                      position: "static",
                      transform: "none",
                      backgroundColor: theme.palette.text.primary,
                      color: theme.palette.background.default,
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      height: 18,
                      minWidth: 18,
                      borderRadius: "9px",
                      padding: "0 5px",
                    },
                  }}
                />
              )}
            </Box>
          }
          value={1}
          disableRipple
        />
      </Tabs>

      <Box sx={{ flex: 1, overflowY: "auto", pr: 0.5 }}>
        {loading ? (
          [...Array(5)].map((_, i) => <NotificationSkeleton key={i} />)
        ) : visibleNotifications.length === 0 ? (
          <Box
            sx={{
              mt: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography sx={{ fontSize: "2rem" }}>
              {activeTab === 1 ? "👥" : "🔔"}
            </Typography>
            <Typography
              sx={{ color: (t) => t.palette.text.disabled, fontSize: "0.9rem" }}
            >
              {activeTab === 1 ? "No follow requests" : "You're all caught up"}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {visibleNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onFollowBack={handleFollowBack}
                onFollowRequestResponse={handleFollowRequestResponse}
                followRequestAcceptLoading={followRequestAcceptLoading}
                followRequestRejectLoading={followRequestRejectLoading}
              />
            ))}
          </List>
        )}
      </Box>
    </Container>
  );
};

export default NotificationsPage;
