import { useState, useEffect, useRef } from "react";
import {
  Box, Button, Modal, TextField, Typography, Backdrop, Fade,
  IconButton, CircularProgress, useTheme, useMediaQuery,
  InputAdornment, Avatar, Chip,
} from "@mui/material";
import { useDropzone } from "react-dropzone";
import { createPost, getSearchResults } from "../../services/api";
import { useGlobalStore } from "../../store/store";
import { useNavigate } from "react-router-dom";
import EmojiPicker, { Theme } from "emoji-picker-react";
import {
  SentimentSatisfiedAlt as EmojiIcon, LocationOn, Close,
  AddPhotoAlternate, ArrowForward as ArrowIcon,
  EditOutlined as EditIcon, DeleteOutline as DeleteIcon,
  PersonAdd as TagIcon,
} from "@mui/icons-material";
import Popover from "@mui/material/Popover";
import { useAppNotifications } from "../../hooks/useNotification";

interface TaggedUser { id: number; username: string; profile_picture?: string; }

interface CreatePostModalProps {
  open: boolean;
  handleClose: () => void;
}

const ACCENT = "#7c5cfc";
const CAPTION_LIMIT = 2200;

const CreatePostModal: React.FC<CreatePostModalProps> = ({ open, handleClose }) => {
  const navigate = useNavigate();
  const currentUser = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user") || "null") : {};

  const [postContent, setPostContent] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState<null | HTMLElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPreviewHovered, setIsPreviewHovered] = useState(false);
  const [posted, setPosted] = useState(false);
  // keep backward-compat alias
  const imageFile = imageFiles[0] ?? null;
  const [taggedUsers, setTaggedUsers] = useState<TaggedUser[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [tagResults, setTagResults] = useState<TaggedUser[]>([]);
  const [tagSearchLoading, setTagSearchLoading] = useState(false);
  const tagSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notifications = useAppNotifications();
  const { user, setPostUploading } = useGlobalStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isDark = theme.palette.mode === "dark";

  const hasCaption = postContent.trim().length > 0;
  const hasFile = imageFiles.length > 0;
  const isReady = hasCaption && hasFile;

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setImageFiles([]); setActiveIndex(0); setPostContent(""); setLocation("");
        setIsDragging(false); setPosted(false);
        setTaggedUsers([]); setTagSearch(""); setTagResults([]);
      }, 300);
    }
  }, [open]);

  useEffect(() => {
    if (!tagSearch.trim()) { setTagResults([]); return; }
    if (tagSearchRef.current) clearTimeout(tagSearchRef.current);
    tagSearchRef.current = setTimeout(async () => {
      setTagSearchLoading(true);
      try {
        const res = await getSearchResults(tagSearch);
        const users = (res?.data?.users || []).filter((u: TaggedUser) =>
          u.id !== Number(currentUser?.id) && !taggedUsers.some((t) => t.id === u.id)
        );
        setTagResults(users);
      } catch { setTagResults([]); }
      finally { setTagSearchLoading(false); }
    }, 300);
  }, [tagSearch]);

  const onDrop = (acceptedFiles: File[]) => {
    setIsDragging(false);
    if (acceptedFiles.length > 0) {
      setImageFiles((prev) => {
        const merged = [...prev, ...acceptedFiles].slice(0, 10);
        setActiveIndex(merged.length - 1);
        return merged;
      });
    }
  };

  const handleModalClose = () => {
    setImageFiles([]); setActiveIndex(0); setPostContent(""); setLocation(""); handleClose();
  };

  const { getRootProps, getInputProps, open: openFileDialog } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "video/*": [".mp4", ".mov", ".webm"],
    },
    multiple: true,
    noClick: imageFiles.length > 0,
  });

  const handleEmojiClick = (emojiData: any) => setPostContent((p) => p + emojiData.emoji);

  const handleSubmit = async () => {
    if (!isReady) return;
    try {
      setLoading(true); setPostUploading(true);
      navigate(`/profile/${currentUser?.id}`);
      if (postContent.trim() && user) {
        const res = await createPost({ user_id: user.id, content: postContent, media: imageFiles.length > 0 ? imageFiles : undefined, location, taggedUsers: taggedUsers.map((u) => u.id) });
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

  const bc = (t: any) => t.palette.divider;

  return (
    <Modal
      open={open} onClose={handleModalClose} closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{ timeout: 300, sx: { backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)" } }}
      sx={{ display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", p: isMobile ? 0 : 2 }}
    >
      <Fade in={open} timeout={220}>
        <Box sx={{
          bgcolor: "background.paper",
          width: "100%", maxWidth: 780,
          maxHeight: isMobile ? "96vh" : "86vh",
          display: "flex", flexDirection: "column", overflow: "hidden",
          borderRadius: isMobile ? "20px 20px 0 0" : "20px",
          border: "1px solid", borderColor: bc,
          boxShadow: isDark ? "0 32px 80px rgba(0,0,0,0.6)" : "0 20px 60px rgba(0,0,0,0.14)",
          isolation: "isolate",
          willChange: "transform",
        }}>

          {/* ── Header ── */}
          <Box sx={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            px: 2.5, py: 1.5,
            borderBottom: "1px solid", borderColor: bc, flexShrink: 0,
          }}>
            <Typography sx={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "1rem", fontWeight: 600,
              color: (t) => t.palette.text.primary,
              letterSpacing: "-0.2px",
            }}>
              Create post
            </Typography>
            <IconButton onClick={handleModalClose} size="small" sx={{
              width: 32, height: 32, borderRadius: "10px",
              color: (t) => t.palette.text.secondary,
              "&:hover": { backgroundColor: (t) => t.palette.action.hover, color: (t) => t.palette.text.primary },
            }}>
              <Close sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>

          {/* ── Body ── */}
          <Box sx={{ display: "flex", flex: 1, overflow: "hidden", flexDirection: { xs: "column", md: "row" } }}>

            {/* Left — media */}
            <Box sx={{
              flex: "1.1 1 0", display: "flex", flexDirection: "column",
              borderBottom: { xs: "1px solid", md: "none" }, borderBottomColor: { xs: bc },
              backgroundColor: (t) => t.palette.action.hover,
              minWidth: 0,
            }}>
              <Box
                {...getRootProps()}
                sx={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: imageFile ? "default" : "pointer",
                  position: "relative", overflow: "hidden",
                  minHeight: { xs: 200, md: 320 },
                  backgroundColor: isDragging ? `${ACCENT}0d` : (t) => t.palette.action.hover,
                  transition: "background-color 0.15s",
                  outline: isDragging ? `2px dashed ${ACCENT}60` : "none",
                  outlineOffset: "-8px",
                  ...(!imageFile && { "&:hover": { backgroundColor: `${ACCENT}07` } }),
                }}
                onMouseEnter={() => setIsPreviewHovered(true)}
                onMouseLeave={() => setIsPreviewHovered(false)}
              >
                <input {...getInputProps()} />

                {imageFiles.length > 0 ? (
                  <>
                    {/* Current slide */}
                    {imageFiles[activeIndex]?.type.startsWith("video/") ? (
                      <Box component="video"
                        key={activeIndex}
                        src={URL.createObjectURL(imageFiles[activeIndex])}
                        autoPlay muted loop playsInline
                        sx={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0, transition: "filter 0.2s", filter: isPreviewHovered ? "brightness(0.55)" : "brightness(1)" }}
                      />
                    ) : (
                      <Box component="img"
                        key={activeIndex}
                        src={URL.createObjectURL(imageFiles[activeIndex])} alt="Preview"
                        sx={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0, transition: "filter 0.2s", filter: isPreviewHovered ? "brightness(0.55)" : "brightness(1)" }}
                      />
                    )}

                    {/* Slide counter badge */}
                    {imageFiles.length > 1 && (
                      <Box sx={{ position: "absolute", top: 10, right: 10, bgcolor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", borderRadius: "20px", px: 1, py: 0.35, zIndex: 4 }}>
                        <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "#fff", fontFamily: "'Inter', sans-serif" }}>
                          {activeIndex + 1}/{imageFiles.length}
                        </Typography>
                      </Box>
                    )}

                    {/* Prev/Next arrows */}
                    {imageFiles.length > 1 && activeIndex > 0 && (
                      <IconButton onClick={(e) => { e.stopPropagation(); setActiveIndex((i) => i - 1); }}
                        sx={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", bgcolor: "rgba(0,0,0,0.45)", color: "#fff", width: 28, height: 28, zIndex: 4, "&:hover": { bgcolor: "rgba(0,0,0,0.7)" } }}>
                        <ArrowIcon sx={{ fontSize: 14, transform: "rotate(180deg)" }} />
                      </IconButton>
                    )}
                    {imageFiles.length > 1 && activeIndex < imageFiles.length - 1 && (
                      <IconButton onClick={(e) => { e.stopPropagation(); setActiveIndex((i) => i + 1); }}
                        sx={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", bgcolor: "rgba(0,0,0,0.45)", color: "#fff", width: 28, height: 28, zIndex: 4, "&:hover": { bgcolor: "rgba(0,0,0,0.7)" } }}>
                        <ArrowIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    )}

                    {/* Dot indicators */}
                    {imageFiles.length > 1 && (
                      <Box sx={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 0.5, zIndex: 4 }}>
                        {imageFiles.map((_, i) => (
                          <Box key={i} onClick={(e) => { e.stopPropagation(); setActiveIndex(i); }}
                            sx={{ width: i === activeIndex ? 14 : 6, height: 6, borderRadius: "3px", bgcolor: i === activeIndex ? "#fff" : "rgba(255,255,255,0.5)", cursor: "pointer", transition: "all 0.2s" }} />
                        ))}
                      </Box>
                    )}

                    {/* Hover controls */}
                    <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 1, opacity: isPreviewHovered ? 1 : 0, transition: "opacity 0.2s" }}>
                      <IconButton onClick={(e) => { e.stopPropagation(); openFileDialog(); }}
                        sx={{ backgroundColor: "rgba(255,255,255,0.92)", color: "#111", width: 38, height: 38, "&:hover": { backgroundColor: "#fff" } }}>
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageFiles((prev) => {
                            const next = prev.filter((_, i) => i !== activeIndex);
                            setActiveIndex((idx) => Math.min(idx, next.length - 1));
                            return next;
                          });
                        }}
                        sx={{ backgroundColor: "rgba(255,255,255,0.92)", color: "#dc2626", width: 38, height: 38, "&:hover": { backgroundColor: "#fff" } }}>
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </>
                ) : (
                  <Box sx={{ textAlign: "center", p: 3, userSelect: "none" }}>
                    <Box sx={{
                      width: 52, height: 52,
                      borderRadius: "14px",
                      backgroundColor: `${ACCENT}12`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      mx: "auto", mb: 1.5,
                    }}>
                      <AddPhotoAlternate sx={{ fontSize: 22, color: isDragging ? ACCENT : `${ACCENT}99` }} />
                    </Box>
                    <Typography sx={{
                      fontFamily: "'Inter', sans-serif", fontSize: "0.9rem",
                      fontWeight: 600, color: (t) => t.palette.text.primary, mb: 0.4,
                      letterSpacing: "-0.1px",
                    }}>
                      {isDragging ? "Drop to upload" : "Drop photo or video"}
                    </Typography>
                    <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.78rem", color: (t) => t.palette.text.disabled, mb: 1.5 }}>
                      or click to browse
                    </Typography>
                    <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center", flexWrap: "wrap" }}>
                      {["JPG", "PNG", "GIF", "MP4", "MOV"].map((ext) => (
                        <Typography key={ext} sx={{
                          fontFamily: "'Inter', sans-serif", fontSize: "0.65rem", fontWeight: 600,
                          color: (t) => t.palette.text.disabled,
                          backgroundColor: (t) => t.palette.background.paper,
                          border: "1px solid", borderColor: bc,
                          borderRadius: "6px", px: 0.875, py: "2px",
                          letterSpacing: "0.04em",
                        }}>
                          {ext}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Thumbnail strip */}
              {imageFiles.length > 0 && (
                <Box sx={{ px: 1.5, py: 1, borderTop: "1px solid", borderColor: bc, display: "flex", gap: 0.75, alignItems: "center", flexShrink: 0, overflowX: "auto", "&::-webkit-scrollbar": { height: 3 } }}>
                  {imageFiles.map((f, i) => (
                    <Box
                      key={i}
                      onClick={() => setActiveIndex(i)}
                      sx={{
                        width: 44, height: 44, borderRadius: "8px", flexShrink: 0, overflow: "hidden", cursor: "pointer",
                        border: "2px solid", borderColor: i === activeIndex ? ACCENT : "transparent",
                        transition: "border-color 0.15s", position: "relative",
                      }}
                    >
                      <Box component="img" src={URL.createObjectURL(f)} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </Box>
                  ))}
                  {imageFiles.length < 10 && (
                    <Box onClick={(e) => { e.stopPropagation(); openFileDialog(); }}
                      sx={{ width: 44, height: 44, borderRadius: "8px", flexShrink: 0, border: "1.5px dashed", borderColor: bc, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", "&:hover": { borderColor: ACCENT, bgcolor: `${ACCENT}08` } }}>
                      <AddPhotoAlternate sx={{ fontSize: 18, color: (t) => t.palette.text.disabled }} />
                    </Box>
                  )}
                </Box>
              )}
            </Box>

            {/* Right — caption + location */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", minWidth: 0 }}>

              {/* User row */}
              <Box sx={{
                display: "flex", alignItems: "center", gap: 1.25,
                px: 2.25, pt: 2, pb: 1.5,
                borderBottom: "1px solid", borderColor: bc,
              }}>
                <Box sx={{
                  width: 34, height: 34, borderRadius: "50%",
                  backgroundColor: ACCENT, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "11px", fontWeight: 700, color: "#fff",
                }}>
                  {(currentUser?.username || "U").slice(0, 2).toUpperCase()}
                </Box>
                <Box>
                  <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", fontWeight: 600, color: (t) => t.palette.text.primary, lineHeight: 1.2 }}>
                    {currentUser?.username || "You"}
                  </Typography>
                  <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.72rem", color: (t) => t.palette.text.disabled }}>
                    Posting now
                  </Typography>
                </Box>
              </Box>

              {/* Caption */}
              <Box sx={{ px: 2.25, pt: 1.75, pb: 1.5, flex: 1, display: "flex", flexDirection: "column" }}>
                <Box sx={{ position: "relative", flex: 1, display: "flex", flexDirection: "column" }}>
                  <TextField
                    fullWidth multiline rows={isMobile ? 3 : 6}
                    variant="standard"
                    placeholder="Write a caption… use #hashtags"
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    inputProps={{ maxLength: CAPTION_LIMIT, spellCheck: false }}
                    sx={{
                      flex: 1,
                      "& .MuiInput-root": {
                        fontSize: "0.875rem",
                        fontFamily: "'Inter', sans-serif",
                        color: (t) => t.palette.text.primary,
                        "&:before, &:after": { display: "none" },
                        alignItems: "flex-start",
                        pr: "32px",
                      },
                      "& textarea::placeholder": { color: (t: any) => t.palette.text.disabled, opacity: 1 },
                    }}
                  />
                  <IconButton
                    onClick={(e) => setEmojiAnchorEl(e.currentTarget)}
                    size="small"
                    sx={{
                      position: "absolute", top: 0, right: 0,
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
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
                    {[...new Set(postContent.match(/#([a-zA-Z0-9_]+)/g))].map((tag) => (
                      <Box key={tag} sx={{
                        fontFamily: "'Inter', sans-serif", fontSize: "0.72rem", fontWeight: 500,
                        color: ACCENT, backgroundColor: `${ACCENT}12`,
                        border: `1px solid ${ACCENT}28`,
                        borderRadius: "20px", px: 1, py: "2px",
                      }}>
                        {tag}
                      </Box>
                    ))}
                  </Box>
                )}

                <Typography sx={{
                  fontFamily: "'Inter', sans-serif", fontSize: "0.67rem",
                  color: (t) => t.palette.text.disabled, textAlign: "right", mt: 0.75,
                }}>
                  {postContent.length} / {CAPTION_LIMIT}
                </Typography>
              </Box>

              {/* Location */}
              <Box sx={{ px: 2.25, pb: 1.75, borderTop: "1px solid", borderColor: bc, pt: 1.5 }}>
                <TextField
                  fullWidth variant="standard"
                  placeholder="Add a location…"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn sx={{ fontSize: 15, color: (t) => t.palette.text.disabled, mb: "2px" }} />
                      </InputAdornment>
                    ),
                    disableUnderline: true,
                    sx: { fontSize: "0.855rem", fontFamily: "'Inter', sans-serif", color: (t: any) => t.palette.text.primary },
                  }}
                  sx={{ "& textarea::placeholder, & input::placeholder": { color: (t: any) => t.palette.text.disabled, opacity: 1 } }}
                />
              </Box>

              {/* Tag people */}
              <Box sx={{ px: 2.25, pb: 1.75, borderTop: "1px solid", borderColor: bc, pt: 1.5 }}>
                <TextField
                  fullWidth variant="standard"
                  placeholder="Tag people…"
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <TagIcon sx={{ fontSize: 15, color: (t) => t.palette.text.disabled, mb: "2px" }} />
                      </InputAdornment>
                    ),
                    endAdornment: tagSearchLoading ? (
                      <InputAdornment position="end">
                        <CircularProgress size={12} sx={{ color: ACCENT }} />
                      </InputAdornment>
                    ) : null,
                    disableUnderline: true,
                    sx: { fontSize: "0.855rem", fontFamily: "'Inter', sans-serif", color: (t: any) => t.palette.text.primary },
                  }}
                  sx={{ "& input::placeholder": { color: (t: any) => t.palette.text.disabled, opacity: 1 } }}
                />

                {/* Search results dropdown */}
                {tagResults.length > 0 && (
                  <Box sx={{
                    mt: 0.75, border: "1px solid", borderColor: bc,
                    borderRadius: "10px", overflow: "hidden",
                    maxHeight: 160, overflowY: "auto",
                  }}>
                    {tagResults.map((u) => (
                      <Box key={u.id}
                        onClick={() => { setTaggedUsers((p) => [...p, u]); setTagSearch(""); setTagResults([]); }}
                        sx={{
                          display: "flex", alignItems: "center", gap: 1,
                          px: 1.5, py: 0.875, cursor: "pointer",
                          "&:hover": { backgroundColor: (t) => t.palette.action.hover },
                          "&:not(:last-child)": { borderBottom: "1px solid", borderColor: bc },
                        }}
                      >
                        <Avatar src={u.profile_picture} sx={{ width: 28, height: 28, fontSize: "0.7rem" }}>
                          {u.username.slice(0, 2).toUpperCase()}
                        </Avatar>
                        <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.82rem", fontWeight: 500 }}>
                          {u.username}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Tagged chips */}
                {taggedUsers.length > 0 && (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
                    {taggedUsers.map((u) => (
                      <Chip
                        key={u.id}
                        label={`@${u.username}`}
                        size="small"
                        onDelete={() => setTaggedUsers((p) => p.filter((t) => t.id !== u.id))}
                        avatar={<Avatar src={u.profile_picture} sx={{ width: 20, height: 20 }}>{u.username.slice(0, 1).toUpperCase()}</Avatar>}
                        sx={{
                          fontFamily: "'Inter', sans-serif", fontSize: "0.73rem",
                          backgroundColor: `${ACCENT}12`, color: ACCENT,
                          border: `1px solid ${ACCENT}28`,
                          "& .MuiChip-deleteIcon": { color: `${ACCENT}80`, "&:hover": { color: ACCENT } },
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

          {/* ── Footer ── */}
          <Box sx={{
            display: "flex", alignItems: "center", justifyContent: "flex-end",
            gap: 1.5, px: 2.5, py: 1.375,
            borderTop: "1px solid", borderColor: bc, flexShrink: 0,
          }}>
            {!isReady && (
              <Typography sx={{
                fontFamily: "'Inter', sans-serif", fontSize: "0.78rem",
                color: (t) => t.palette.text.disabled, mr: "auto",
              }}>
                {!hasFile && !hasCaption ? "Add a photo and caption" : !hasFile ? "Add a photo to continue" : "Write a caption to continue"}
              </Typography>
            )}

            <Button
              variant="text"
              onClick={handleModalClose}
              sx={{
                borderRadius: "10px",
                color: (t) => t.palette.text.secondary,
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.84rem", fontWeight: 500,
                textTransform: "none", px: 2, py: 0.75,
                "&:hover": { backgroundColor: (t) => t.palette.action.hover, color: (t) => t.palette.text.primary },
              }}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!isReady || loading || posted}
              endIcon={
                loading
                  ? <CircularProgress size={13} thickness={4} sx={{ color: "#fff" }} />
                  : posted ? null
                  : <ArrowIcon sx={{ fontSize: "14px !important" }} />
              }
              sx={{
                borderRadius: "10px",
                backgroundColor: posted ? "#16a34a" : ACCENT,
                color: "#fff",
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.84rem", fontWeight: 600,
                textTransform: "none",
                px: 2.25, py: 0.75,
                boxShadow: "none",
                letterSpacing: "-0.1px",
                transition: "background-color 0.15s, transform 0.1s",
                "&:hover": { backgroundColor: posted ? "#16a34a" : "#6b4de0", boxShadow: "none" },
                "&:active": { transform: "scale(0.97)" },
                "&.Mui-disabled": { backgroundColor: `${ACCENT}35`, color: "rgba(255,255,255,0.5)" },
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
            PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden", border: "1px solid", borderColor: bc } }}
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
