import { useState, useEffect } from "react";
import {
  Box, Button, Modal, TextField, Typography, Backdrop, Fade,
  IconButton, CircularProgress, useTheme, useMediaQuery,
  InputAdornment, LinearProgress,
} from "@mui/material";
import { useDropzone } from "react-dropzone";
import { createPost } from "../../services/api";
import { useGlobalStore } from "../../store/store";
import { useNavigate } from "react-router-dom";
import EmojiPicker, { Theme } from "emoji-picker-react";
import {
  SentimentSatisfiedAlt as EmojiIcon, LocationOn, Close,
  AddPhotoAlternate, Send as SendIcon,
  EditOutlined as EditIcon, DeleteOutline as DeleteIcon,
} from "@mui/icons-material";
import Popover from "@mui/material/Popover";
import { useAppNotifications } from "../../hooks/useNotification";

interface CreatePostModalProps {
  open: boolean;
  handleClose: () => void;
}

const ACCENT = "#7c5cfc";
const CAPTION_LIMIT = 2200;

const CreatePostModal: React.FC<CreatePostModalProps> = ({ open, handleClose }) => {
  const navigate = useNavigate();
  const currentUser = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user") || "") : {};

  const [postContent, setPostContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState<null | HTMLElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPreviewHovered, setIsPreviewHovered] = useState(false);
  const [posted, setPosted] = useState(false);

  const notifications = useAppNotifications();
  const { user, setPostUploading } = useGlobalStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isDark = theme.palette.mode === "dark";

  const hasCaption = postContent.trim().length > 0;
  const hasFile = imageFile !== null;
  const isReady = hasCaption && hasFile;
  const progress = (hasFile ? 50 : 0) + (hasCaption ? 50 : 0);

  const metaText = !hasFile && !hasCaption ? "Add a photo and caption to share"
    : !hasFile ? "Add a photo to continue"
    : !hasCaption ? "Write a caption to continue"
    : "Ready to share!";

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setImageFile(null); setPostContent(""); setLocation("");
        setIsDragging(false); setPosted(false);
      }, 300);
    }
  }, [open]);

  const onDrop = (acceptedFiles: File[]) => {
    setIsDragging(false);
    if (acceptedFiles.length > 0) setImageFile(acceptedFiles[0]);
  };

  const handleModalClose = () => {
    setImageFile(null); setPostContent(""); setLocation(""); handleClose();
  };

  const { getRootProps, getInputProps, open: openFileDialog } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "video/*": [".mp4", ".mov", ".webm"],
    },
    multiple: false,
    noClick: !!imageFile,
  });

  const handleEmojiClick = (emojiData: any) => setPostContent((p) => p + emojiData.emoji);

  const handleSubmit = async () => {
    if (!isReady) return;
    try {
      setLoading(true); setPostUploading(true);
      navigate(`/profile/${currentUser?.id}`);
      if (postContent.trim() && user) {
        const res = await createPost({ user_id: user.id, content: postContent, media: imageFile || undefined, location });
        if (res?.success) {
          setPosted(true);
          setTimeout(() => {
            handleModalClose();
            notifications.show("Post shared!", { severity: "success", autoHideDuration: 3000 });
          }, 800);
        }
      }
    } catch {
      notifications.show("Error uploading post. Please try again.", { severity: "error", autoHideDuration: 3000 });
    } finally {
      setLoading(false); setPostUploading(false);
    }
  };

  const borderColor = (t: any) => t.palette.divider;
  const successGreen = "#16a34a";

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      fontSize: "0.875rem",
      backgroundColor: (t: any) => t.palette.action.hover,
      transition: "border-color 0.15s",
      "& fieldset": { borderColor: (t: any) => t.palette.divider },
      "&:hover fieldset": { borderColor: (t: any) => t.palette.text.disabled },
      "&.Mui-focused fieldset": { borderColor: `${ACCENT}80`, borderWidth: "1px" },
    },
  };

  const labelSx = {
    fontSize: "0.7rem", fontWeight: 500, letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    color: (t: any) => t.palette.text.disabled, mb: 0.875, display: "block",
  };

  return (
    <Modal
      open={open} onClose={handleModalClose} closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{ timeout: 300, sx: { backgroundColor: "rgba(0,0,0,0.4)" } }}
      sx={{ display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", p: isMobile ? 0 : 2 }}
    >
      <Fade in={open} timeout={250}>
        <Box sx={{
          bgcolor: "background.paper",
          width: "100%", maxWidth: "760px",
          maxHeight: isMobile ? "96vh" : "88vh",
          display: "flex", flexDirection: "column", overflow: "hidden",
          borderRadius: isMobile ? "16px 16px 0 0" : "16px",
          border: "1px solid", borderColor,
          boxShadow: isDark ? "0 24px 60px rgba(0,0,0,0.5)" : "0 16px 40px rgba(0,0,0,0.12)",
          transform: "translateZ(0)",
          willChange: "transform",
        }}>

          {/* ── Header ── */}
          <Box sx={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            px: 2, py: 1.375,
            borderBottom: "1px solid", borderColor,
            flexShrink: 0,
          }}>
            <Typography sx={{
              fontFamily: "'Inter', -apple-system, sans-serif",
              fontSize: "0.95rem", fontWeight: 500,
              color: (t) => t.palette.text.primary,
            }}>
              New post
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {/* User chip */}
              <Box sx={{
                display: "flex", alignItems: "center", gap: 0.875,
                backgroundColor: (t) => t.palette.action.hover,
                border: "1px solid", borderColor,
                borderRadius: "20px", py: "4px", pr: 1.25, pl: "4px",
              }}>
                <Box sx={{
                  width: 22, height: 22, borderRadius: "50%",
                  backgroundColor: ACCENT,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "9px", fontWeight: 600, color: "#fff",
                  flexShrink: 0,
                }}>
                  {(currentUser?.username || "U").slice(0, 2).toUpperCase()}
                </Box>
                <Typography sx={{ fontSize: "0.8rem", color: (t) => t.palette.text.secondary, fontFamily: "'Inter', sans-serif" }}>
                  {currentUser?.username || "You"}
                </Typography>
              </Box>

              {/* Close */}
              <IconButton onClick={handleModalClose} size="small" sx={{
                width: 30, height: 30, borderRadius: "9px",
                border: "1px solid", borderColor,
                color: (t) => t.palette.text.disabled,
                "&:hover": { color: (t) => t.palette.text.primary, backgroundColor: (t) => t.palette.action.hover },
              }}>
                <Close sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          </Box>

          {/* ── Progress bar ── */}
          <LinearProgress
            variant="determinate"
            value={posted ? 100 : progress}
            sx={{
              height: 2, flexShrink: 0,
              backgroundColor: (t) => t.palette.divider,
              "& .MuiLinearProgress-bar": {
                backgroundColor: posted ? successGreen : ACCENT,
                transition: "width 0.3s ease, background-color 0.25s ease",
              },
            }}
          />

          {/* ── Body ── */}
          <Box sx={{ display: "flex", flex: 1, overflow: "hidden", flexDirection: { xs: "column", md: "row" } }}>

            {/* Left — media upload */}
            <Box sx={{
              flex: "1.1 1 0",
              display: "flex", flexDirection: "column",
              borderBottom: { xs: "1px solid", md: "none" }, borderBottomColor: { xs: borderColor },
              minWidth: 0,
            }}>
              <Box
                {...getRootProps()}
                sx={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: imageFile ? "default" : "pointer",
                  position: "relative", overflow: "hidden",
                  backgroundColor: isDragging
                    ? `${ACCENT}0e`
                    : (t) => t.palette.action.hover,
                  minHeight: { xs: 200, md: 300 },
                  transition: "background-color 0.15s",
                  ...(!imageFile && { "&:hover": { backgroundColor: `${ACCENT}08` } }),
                }}
                onMouseEnter={() => setIsPreviewHovered(true)}
                onMouseLeave={() => setIsPreviewHovered(false)}
              >
                <input {...getInputProps()} />

                {imageFile ? (
                  <>
                    {imageFile.type.startsWith("video/") ? (
                      <Box component="video"
                        src={URL.createObjectURL(imageFile)}
                        autoPlay muted loop playsInline
                        sx={{
                          width: "100%", height: "100%", objectFit: "cover",
                          position: "absolute", inset: 0,
                          transition: "filter 0.2s",
                          filter: isPreviewHovered ? "brightness(0.6)" : "brightness(1)",
                        }}
                      />
                    ) : (
                      <Box component="img"
                        src={URL.createObjectURL(imageFile)} alt="Preview"
                        sx={{
                          width: "100%", height: "100%", objectFit: "cover",
                          position: "absolute", inset: 0,
                          transition: "filter 0.2s",
                          filter: isPreviewHovered ? "brightness(0.6)" : "brightness(1)",
                        }}
                      />
                    )}
                    {/* Hover actions */}
                    <Box sx={{
                      position: "absolute", inset: 0,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 1,
                      opacity: isPreviewHovered ? 1 : 0, transition: "opacity 0.2s",
                    }}>
                      <Button size="small"
                        onClick={(e) => { e.stopPropagation(); openFileDialog(); }}
                        startIcon={<EditIcon sx={{ fontSize: "12px !important" }} />}
                        sx={{
                          background: "rgba(255,255,255,0.9)", color: "#111",
                          borderRadius: "9px", px: 1.75, py: 0.625,
                          fontSize: "0.8rem", fontWeight: 500, textTransform: "none",
                          boxShadow: "none", fontFamily: "'Inter', sans-serif",
                          "&:hover": { background: "#fff" },
                        }}
                      >
                        Change
                      </Button>
                      <Button size="small"
                        onClick={(e) => { e.stopPropagation(); setImageFile(null); }}
                        startIcon={<DeleteIcon sx={{ fontSize: "12px !important" }} />}
                        sx={{
                          background: "rgba(255,255,255,0.9)", color: "#dc2626",
                          borderRadius: "9px", px: 1.75, py: 0.625,
                          fontSize: "0.8rem", fontWeight: 500, textTransform: "none",
                          boxShadow: "none", fontFamily: "'Inter', sans-serif",
                          "&:hover": { background: "#fff" },
                        }}
                      >
                        Remove
                      </Button>
                    </Box>
                  </>
                ) : (
                  <Box sx={{ textAlign: "center", p: 3, userSelect: "none" }}>
                    <Box sx={{
                      width: 48, height: 48,
                      border: "1px solid", borderColor,
                      borderRadius: "12px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      mx: "auto", mb: 1.25,
                      backgroundColor: (t) => t.palette.background.paper,
                    }}>
                      <AddPhotoAlternate sx={{
                        fontSize: 20,
                        color: isDragging ? ACCENT : (t) => t.palette.text.disabled,
                      }} />
                    </Box>
                    <Typography sx={{
                      fontFamily: "'Inter', sans-serif", fontSize: "0.875rem",
                      fontWeight: 500, color: (t) => t.palette.text.primary, mb: 0.375,
                    }}>
                      Drop your photo or video here
                    </Typography>
                    <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", color: (t) => t.palette.text.disabled, mb: 1.25 }}>
                      or click to browse
                    </Typography>
                    <Box sx={{ display: "flex", gap: 0.625, justifyContent: "center", flexWrap: "wrap" }}>
                      {["JPG", "PNG", "GIF", "WEBP", "MP4", "MOV"].map((ext) => (
                        <Box key={ext} sx={{
                          fontSize: "0.68rem", fontWeight: 500,
                          backgroundColor: (t) => t.palette.background.paper,
                          border: "1px solid", borderColor,
                          borderRadius: "20px", px: 1, py: "2px",
                          color: (t) => t.palette.text.disabled,
                        }}>
                          {ext}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>

              {/* File name footer */}
              <Box sx={{
                px: 1.75, py: 1,
                borderTop: "1px solid", borderColor,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                flexShrink: 0, minHeight: 40,
              }}>
                <Typography sx={{
                  fontFamily: "'Inter', sans-serif", fontSize: "0.75rem",
                  color: (t) => t.palette.text.disabled, fontStyle: "italic",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180,
                }}>
                  {imageFile ? imageFile.name : "No file selected"}
                </Typography>
                {imageFile && (
                  <Typography
                    component="button"
                    onClick={() => setImageFile(null)}
                    sx={{
                      fontFamily: "'Inter', sans-serif", fontSize: "0.75rem",
                      color: (t) => t.palette.error.main,
                      background: "none", border: "none", cursor: "pointer", p: 0,
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    Remove
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Right — fields */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", minWidth: 0 }}>

              {/* Caption */}
              <Box sx={{ px: 2, pt: 1.75, pb: 1.75, borderBottom: "1px solid", borderColor }}>
                <Typography component="label" sx={labelSx}>Caption</Typography>
                <Box sx={{ position: "relative" }}>
                  <TextField
                    fullWidth multiline rows={isMobile ? 3 : 5}
                    variant="outlined"
                    placeholder="Write a caption… use #hashtags"
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    inputProps={{ maxLength: CAPTION_LIMIT, spellCheck: false }}
                    sx={{
                      ...inputSx,
                      "& .MuiOutlinedInput-root": {
                        ...inputSx["& .MuiOutlinedInput-root"],
                        pr: "38px",
                      },
                    }}
                  />
                  <IconButton
                    onClick={(e) => setEmojiAnchorEl(e.currentTarget)}
                    size="small"
                    sx={{
                      position: "absolute", bottom: 8, right: 8,
                      width: 26, height: 26, borderRadius: "7px",
                      color: (t) => t.palette.text.disabled,
                      "&:hover": { color: ACCENT, backgroundColor: (t) => t.palette.action.hover },
                    }}
                  >
                    <EmojiIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Box>

                {/* Hashtag chips */}
                {postContent.match(/#([a-zA-Z0-9_]+)/g) && (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.625, mt: 0.875 }}>
                    {[...new Set(postContent.match(/#([a-zA-Z0-9_]+)/g))].map((tag) => (
                      <Box key={tag} sx={{
                        fontFamily: "'Inter', sans-serif", fontSize: "0.72rem", fontWeight: 500,
                        color: ACCENT, backgroundColor: `${ACCENT}12`,
                        border: `1px solid ${ACCENT}30`,
                        borderRadius: "20px", px: 1, py: "2px",
                      }}>
                        {tag}
                      </Box>
                    ))}
                  </Box>
                )}

                <Typography sx={{
                  fontFamily: "'Inter', sans-serif", fontSize: "0.68rem",
                  color: (t) => t.palette.text.disabled, textAlign: "right", mt: 0.625,
                }}>
                  {postContent.length} / {CAPTION_LIMIT}
                </Typography>
              </Box>

              {/* Location */}
              <Box sx={{ px: 2, py: 1.75 }}>
                <Typography component="label" sx={labelSx}>Location</Typography>
                <TextField
                  fullWidth variant="outlined"
                  placeholder="Add a location…"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  sx={inputSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn sx={{ fontSize: 15, color: (t) => t.palette.text.disabled }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* ── Footer ── */}
          <Box sx={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 1.5, px: 2, py: 1.25,
            borderTop: "1px solid", borderColor,
            flexShrink: 0,
          }}>
            <Typography sx={{
              fontFamily: "'Inter', sans-serif", fontSize: "0.78rem",
              color: isReady ? successGreen : (t) => t.palette.text.disabled,
              transition: "color 0.25s",
            }}>
              {posted ? "Post shared!" : metaText}
            </Typography>

            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!isReady || loading || posted}
              endIcon={
                loading
                  ? <CircularProgress size={13} thickness={4} sx={{ color: "#fff" }} />
                  : posted ? null
                  : <SendIcon sx={{ fontSize: "13px !important" }} />
              }
              sx={{
                borderRadius: "10px",
                backgroundColor: posted ? successGreen : ACCENT,
                color: "#fff",
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.84rem", fontWeight: 500,
                textTransform: "none",
                px: 2.25, py: 0.875,
                boxShadow: "none",
                transition: "background-color 0.15s, transform 0.1s",
                "&:hover": { backgroundColor: posted ? successGreen : "#6b4de0", boxShadow: "none" },
                "&:active": { transform: "scale(0.97)" },
                "&.Mui-disabled": { backgroundColor: `${ACCENT}40`, color: "rgba(255,255,255,0.6)" },
              }}
            >
              {posted ? "Shared!" : loading ? "Sharing…" : "Share"}
            </Button>
          </Box>

          {/* ── Emoji picker ── */}
          <Popover
            open={Boolean(emojiAnchorEl)} anchorEl={emojiAnchorEl}
            onClose={() => setEmojiAnchorEl(null)}
            anchorOrigin={{ vertical: "top", horizontal: "left" }}
            transformOrigin={{ vertical: "bottom", horizontal: "left" }}
            PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden", border: "1px solid", borderColor } }}
          >
            <EmojiPicker
              theme={isDark ? Theme.DARK : Theme.LIGHT}
              onEmojiClick={handleEmojiClick}
              height={350} width={isMobile ? 300 : 340}
            />
          </Popover>
        </Box>
      </Fade>
    </Modal>
  );
};

export default CreatePostModal;