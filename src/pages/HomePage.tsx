import {
  Container,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
  Skeleton,
} from "@mui/material";
import { SentimentDissatisfied, Add } from "@mui/icons-material";
import Post from "../component/post/Post";
import StoryDialog from "../component/stories/StoryDialog";
import UploadStoryDialog from "../component/stories/UploadStoryDialog";
import { useEffect, useState } from "react";
import { getPosts, getStories } from "../services/api";
import BlankProfileImage from "../static/profile_blank.png";

/* ─────────────────────────────────────────────
   Keyframe injection (runs once)
───────────────────────────────────────────── */
const injectStyles = () => {
  if (document.getElementById("hp-styles")) return;
  const style = document.createElement("style");
  style.id = "hp-styles";
  style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        :root {
            --accent-1: #b84a1e;
            --accent-2: #7a2d8a;
            --accent-3: #1e3a8a;
            --ring-gradient: conic-gradient(from 0deg,#b84a1e,#7a2d8a,#b84a1e);
            --surface: rgba(255,255,255,0.03);
            --surface-hover: rgba(255,255,255,0.06);
            --border: rgba(255,255,255,0.07);
            --text-primary: #f0ede8;
            --text-muted: #7a7775;
        }

        @keyframes spin360 {
            to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
            0%   { background-position: -400px 0; }
            100% { background-position:  400px 0; }
        }
        @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(18px); }
            to   { opacity: 1; transform: translateY(0);     }
        }
        @keyframes popIn {
            0%   { opacity: 0; transform: scale(.88); }
            70%  { transform: scale(1.04);             }
            100% { opacity: 1; transform: scale(1);    }
        }
        @keyframes pulseGlow {
            0%,100% { box-shadow: 0 0 0 0 rgba(184,74,30,.35); }
            50%      { box-shadow: 0 0 0 8px rgba(184,74,30,0);  }
        }

        .hp-root { font-family: 'DM Sans', sans-serif; }

        /* Story ring */
        .story-ring {
            position: relative;
            border-radius: 50%;
            padding: 3px;
            background: var(--ring-gradient);
            animation: none;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .story-ring::before {
            content: '';
            position: absolute;
            inset: -2px;
            border-radius: 50%;
            background: var(--ring-gradient);
            filter: blur(6px);
            opacity: 0;
            transition: opacity .3s ease;
            z-index: -1;
        }
        .story-ring:hover::before { opacity: .6; }

        .story-ring-inner {
            border-radius: 50%;
            background: #0e0e0f;
            overflow: hidden;
            width: 100%;
            height: 100%;
        }

        /* Loading spinner ring */
        .spin-ring {
            border-radius: 50%;
            position: relative;
        }
        .spin-ring::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 50%;
            border: 3px solid transparent;
            border-top-color: #b84a1e;
            border-right-color: #7a2d8a;
            animation: spin360 .9s linear infinite;
        }

        /* Skeleton shimmer */
        .sk-shimmer {
            background: linear-gradient(90deg, rgba(255,255,255,.04) 25%, rgba(255,255,255,.09) 50%, rgba(255,255,255,.04) 75%);
            background-size: 400px 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 50%;
        }

        /* Post card */
        .post-card {
            animation: fadeSlideUp .4s ease both;
        }

        /* Add button */
        .add-btn {
            position: absolute;
            bottom: 10px;
            right: -4px;
            background: linear-gradient(135deg, var(--accent-1), var(--accent-2));
            border-radius: 50%;
            width: 26px;
            height: 26px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border: 2px solid #0e0e0f;
            transition: transform .2s ease, box-shadow .2s ease;
            animation: pulseGlow 2.4s ease infinite;
        }
        .add-btn:hover {
            transform: scale(1.15) rotate(90deg);
            box-shadow: 0 0 12px rgba(184,74,30,.6);
        }

        /* Story avatar hover */
        .story-avatar-wrap:hover .story-ring::before { opacity: .7; }
        .story-avatar-wrap { cursor: pointer; }

        /* Section divider */
        .section-divider {
            display: flex;
            align-items: center;
            gap: 12px;
            margin: 6px 0 16px;
        }
        .section-divider-line {
            flex: 1;
            height: 1px;
            background: var(--border);
        }
        .section-divider-label {
            font-family: 'Syne', sans-serif;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 2.5px;
            text-transform: uppercase;
            color: var(--text-muted);
        }
    `;
  document.head.appendChild(style);
};

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

/** Animated story ring */
const StoryRing = ({
  src,
  size = 76,
  onClick,
  username,
  noLabel,
  delay = 0,
}: {
  src?: string;
  size?: number;
  onClick?: () => void;
  username?: string;
  noLabel?: boolean;
  delay?: number;
}) => (
  <Box
    className="story-avatar-wrap"
    onClick={onClick}
    display="flex"
    flexDirection="column"
    alignItems="center"
    gap="6px"
    sx={{ animation: `popIn .35s ease ${delay}ms both`, flexShrink: 0 }}
  >
    <Box className="story-ring" sx={{ width: size, height: size + 1 }}>
      <Box className="story-ring-inner" sx={{ width: size, height: size }}>
        <img
          src={src || BlankProfileImage}
          alt={username || "user"}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = BlankProfileImage;
          }}
        />
      </Box>
    </Box>
    {!noLabel && username && (
      <Typography
        sx={{
          fontSize: "0.68rem",
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 500,
          color: "var(--text-primary)",
          maxWidth: size + 6,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          textAlign: "center",
          letterSpacing: "0.01em",
        }}
      >
        {username}
      </Typography>
    )}
  </Box>
);

/** Skeleton loading placeholder for stories */
const StorySkeleton = ({ size = 76 }: { size?: number }) => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    gap="6px"
    sx={{ flexShrink: 0 }}
  >
    <Box
      className="sk-shimmer spin-ring"
      sx={{ width: size + 6, height: size + 6 }}
    />
    <Box
      className="sk-shimmer"
      sx={{ width: 48, height: 10, borderRadius: "4px" }}
    />
  </Box>
);

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const HomePage = () => {
  injectStyles();

  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState<boolean>(true);
  const currentUser = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user") || "")
    : {};

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [openStoryDialog, setOpenStoryDialog] = useState(false);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  const [selfStories, setSelfStories] = useState<any[]>([]);
  const [followingStories, setFollowingStories] = useState<any[]>([]);
  const [fetchingStories, setFetchingStories] = useState<boolean>(true);

  // ── CHANGED: increased avatar sizes (was 58/64)
  const avatarSize = isMobile ? 76 : 84;

  const fetchPosts = async () => {
    try {
      if (currentUser?.id) {
        const res = await getPosts();
        setPosts(res.data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchStories = async () => {
    try {
      setFetchingStories(true);
      const res = await getStories();

      const group = (arr: any[]) =>
        Object.values(
          arr.reduce((acc: any, story: any) => {
            const uid = story.user_id;
            if (!acc[uid])
              acc[uid] = {
                user_id: uid,
                username: story.username,
                profile_picture: story.profile_picture,
                stories: [],
              };
            acc[uid].stories.push(story);
            return acc;
          }, {}),
        );

      setSelfStories(group(res.data.selfStory || []));
      setFollowingStories(group(res.data.stories || []));
    } catch (error) {
      console.error("Error fetching stories:", error);
    } finally {
      setFetchingStories(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchStories();
  }, []);

  return (
    <Box
      className="hp-root"
      sx={{
        minHeight: "100vh",
        background: "#000000",
        color: "var(--text-primary)",
        maxWidth: isMobile ? "100%" : "480px",
        margin: "0 auto",
      }}
    >
      <Container
        disableGutters
        sx={{
          maxWidth: isMobile ? "100%" : "480px",
          margin: "0 auto",
          paddingBottom: isMobile ? "70px" : "40px",
          minHeight: "100vh",
        }}
      >
        {/* ── Stories bar ───────────────────────────── */}
        <Box
          sx={{
            px: isMobile ? "12px" : "20px",
            pt: isMobile ? "14px" : "18px",
            pb: "14px",
            position: "relative",
            top: 0,
            zIndex: 10,
            backdropFilter: "blur(16px)",
          }}
        >
          {/* Scrollable story strip */}
          <Box
            sx={{
              display: "flex",
              gap: "20px",
              overflowX: "auto",
              pb: "4px",
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
            }}
          >
            {/* Self / Add-story bubble */}
            <Box position="relative" sx={{ flexShrink: 0 }}>
              <Box
                sx={{
                  // ── CHANGED: match increased avatarSize
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: "50%",
                  padding: "3px",
                  background: selfStories.length
                    ? "var(--ring-gradient)"
                    : "rgba(255,255,255,0.08)",
                  cursor: "pointer",
                  transition: "filter .25s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  "&:hover": { filter: "brightness(1.15)" },
                }}
                onClick={() =>
                  selfStories.length > 0
                    ? (setSelectedStoryIndex(0), setOpenStoryDialog(true))
                    : setOpenUploadDialog(true)
                }
              >
                <Box
                  sx={{
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: "50%",
                    overflow: "hidden",
                    background: "#0e0e0f",
                  }}
                >
                  <img
                    src={currentUser?.profile_picture_url || BlankProfileImage}
                    alt="me"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = BlankProfileImage;
                    }}
                  />
                </Box>
              </Box>
              <Box
                className="add-btn"
                onClick={() => setOpenUploadDialog(true)}
              >
                <Add sx={{ fontSize: 14, color: "#fff" }} />
              </Box>
            </Box>

            {/* Following stories or skeletons */}
            {fetchingStories
              ? Array.from({ length: 5 }).map((_, i) => (
                  <StorySkeleton key={i} size={avatarSize} />
                ))
              : followingStories.map((us, idx) => (
                  <StoryRing
                    key={us.user_id}
                    src={us.profile_picture}
                    size={avatarSize}
                    username={us.username}
                    delay={idx * 55}
                    onClick={() => {
                      setSelectedStoryIndex(selfStories.length + idx);
                      setOpenStoryDialog(true);
                    }}
                  />
                ))}
          </Box>
        </Box>

        {/* ── Posts ─────────────────────────────────── */}
        <Box px={isMobile ? 0 : "0px"}>
          {loadingPosts ? (
            /* Loading state */
            <Box px={isMobile ? "12px" : "20px"}>
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  sx={{
                    mb: "20px",
                    borderRadius: "20px",
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    animation: `fadeSlideUp .4s ease ${i * 120}ms both`,
                  }}
                >
                  {/* Post header skeleton */}
                  <Box display="flex" alignItems="center" gap="12px" p="16px">
                    <Skeleton
                      variant="circular"
                      width={42}
                      height={42}
                      sx={{ bgcolor: "rgba(255,255,255,.06)" }}
                    />
                    <Box flex={1}>
                      <Skeleton
                        width="35%"
                        height={14}
                        sx={{
                          bgcolor: "rgba(255,255,255,.06)",
                          borderRadius: "6px",
                        }}
                      />
                      <Skeleton
                        width="20%"
                        height={10}
                        sx={{
                          bgcolor: "rgba(255,255,255,.04)",
                          borderRadius: "6px",
                          mt: "6px",
                        }}
                      />
                    </Box>
                  </Box>
                  {/* Image skeleton */}
                  <Skeleton
                    variant="rectangular"
                    height={280}
                    sx={{ bgcolor: "rgba(255,255,255,.05)" }}
                  />
                  {/* Action bar skeleton */}
                  <Box display="flex" gap="16px" p="14px 16px">
                    {[60, 50, 40].map((w, j) => (
                      <Skeleton
                        key={j}
                        width={w}
                        height={12}
                        sx={{
                          bgcolor: "rgba(255,255,255,.05)",
                          borderRadius: "6px",
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          ) : posts.length > 0 ? (
            <Box px={isMobile ? 0 : "0px"}>
              {posts.map((post, index) => (
                <Box
                  key={post.id}
                  className="post-card"
                  sx={{
                    padding: "4px",
                    animationDelay: `${index * 80}ms`,
                    mb: index !== posts.length - 1 ? "16px" : 0,
                    mx: isMobile ? 0 : "0px",
                  }}
                >
                  <Post
                    post={post}
                    fetchPosts={fetchPosts}
                    borderRadius={isMobile ? "20px" : "20px"}
                  />
                </Box>
              ))}
            </Box>
          ) : (
            /* Empty state */
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              sx={{
                minHeight: "40vh",
                animation: "fadeSlideUp .5s ease both",
                px: 4,
                textAlign: "center",
              }}
            >
              <Box
                sx={{
                  width: 88,
                  height: 88,
                  borderRadius: "50%",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: "24px",
                }}
              >
                <SentimentDissatisfied
                  sx={{ fontSize: 44, color: "var(--text-muted)" }}
                />
              </Box>
              <Typography
                sx={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: "1.2rem",
                  color: "var(--text-primary)",
                  mb: "8px",
                }}
              >
                Nothing here yet
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  lineHeight: 1.6,
                  maxWidth: 260,
                }}
              >
                Follow some people or be the first to share something with the
                world.
              </Typography>
              <Box
                onClick={() => setOpenUploadDialog(true)}
                sx={{
                  mt: "24px",
                  px: "24px",
                  py: "10px",
                  borderRadius: "100px",
                  background:
                    "linear-gradient(135deg, var(--accent-3), var(--accent-2), var(--accent-1))",
                  color: "#fff",
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  letterSpacing: "0.03em",
                  cursor: "pointer",
                  transition: "transform .2s, box-shadow .2s",
                  "&:hover": {
                    transform: "scale(1.05)",
                    boxShadow: "0 8px 24px rgba(122,45,138,.35)",
                  },
                }}
              >
                Share a Story
              </Box>
            </Box>
          )}
        </Box>
      </Container>

      {/* ── Dialogs ───────────────────────────────── */}
      <StoryDialog
        open={openStoryDialog}
        onClose={() => setOpenStoryDialog(false)}
        stories={[...selfStories, ...followingStories]}
        selectedStoryIndex={selectedStoryIndex}
      />
      <UploadStoryDialog
        open={openUploadDialog}
        onClose={() => setOpenUploadDialog(false)}
        fetchStories={fetchStories}
      />
    </Box>
  );
};

export default HomePage;