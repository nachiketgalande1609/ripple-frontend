import { useState, useEffect, useCallback } from "react";
import {
  Avatar,
  Button,
  Box,
  TextField,
  IconButton,
  CircularProgress,
  Dialog,
  DialogContent,
  Typography,
  Alert,
  Collapse,
  Fade,
  useTheme,
  Skeleton,
} from "@mui/material";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import { useDropzone } from "react-dropzone";
import { uploadProfilePicture } from "../../services/api";
import { useGlobalStore } from "../../store/store";
import { updateProfileDetails, getProfile } from "../../services/api";
import { useAppNotifications } from "../../hooks/useNotification";
import EmojiPicker, { Theme } from "emoji-picker-react";
import {
  SentimentSatisfiedAlt as EmojiIcon,
  CameraAlt as CameraAltIcon,
  FileUploadOutlined as UploadIcon,
  CheckCircleOutline as SuccessIcon,
  ErrorOutline as ErrorOutlineIcon,
} from "@mui/icons-material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import Popover from "@mui/material/Popover";
import BlankProfileImage from "../../static/profile_blank.png";

const ACCENT = "#7c5cfc";
const BIO_MAX = 160;

interface Profile {
  username: string;
  email: string;
  bio?: string;
  profile_picture?: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_request_active: boolean;
  follow_status: string;
  is_following: boolean;
  is_private: boolean;
  isMobile: boolean;
}

const ProfileDetails = () => {
  const theme = useTheme();
  const { setUser } = useGlobalStore();
  const notifications = useAppNotifications();
  const isDark = theme.palette.mode === "dark";

  const user = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user") || "")
    : {};

  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newProfilePic, setNewProfilePic] = useState<File | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [newBio, setNewBio] = useState("");
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [cropper, setCropper] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isModified, setIsModified] = useState(false);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState<null | HTMLElement>(null);
  const [usernameError, setUsernameError] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const handleEmojiClick = (emojiData: any) => {
    if ((newBio?.length ?? 0) < BIO_MAX) setNewBio((p) => p + emojiData.emoji);
  };

  useEffect(() => {
    if (profileData) {
      setIsModified(
        newUsername !== profileData.username ||
          newBio !== (profileData.bio ?? ""),
      );
      setSaveSuccess(false);
      setSaveError("");
    }
  }, [newUsername, newBio, profileData]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type.startsWith("image/")) {
      setUploadError("");
      setNewProfilePic(file);
    }
    setIsDragActive(false);
  }, []);

  const {
    getRootProps,
    getInputProps,
    open: openFilePicker,
  } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: { "image/jpeg": [], "image/png": [], "image/gif": [] },
    noClick: false,
    multiple: false,
  });

  async function fetchProfile() {
    try {
      setProfileLoading(true);
      if (user?.id) {
        const res = await getProfile(user?.id);
        setProfileData(res.data);
        setNewUsername(res.data.username);
        setNewBio(res.data.bio ?? "");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProfileLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, [user?.id]);

  const handleUploadProfilePic = () => {
    if (cropper && user?.id) {
      setUploading(true);
      setUploadError("");
      const croppedDataUrl = cropper.getCroppedCanvas().toDataURL();
      const file = dataURItoFile(croppedDataUrl);
      uploadProfilePicture(user.id, file)
        .then((response) => {
          const updatedUser = {
            ...user,
            profile_picture_url: response.fileUrl,
          };
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
          notifications.show("Profile picture updated!", {
            severity: "success",
            autoHideDuration: 3000,
          });
          setOpenDialog(false);
          setNewProfilePic(null);
        })
        .catch((err) =>
          setUploadError(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to upload photo.",
          ),
        )
        .finally(() => setUploading(false));
    }
  };

  const dataURItoFile = (dataURI: string): File => {
    const byteString = atob(dataURI.split(",")[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++)
      ia[i] = byteString.charCodeAt(i);
    return new File(
      [new Blob([ab], { type: "image/jpeg" })],
      "profile_picture.jpg",
      { type: "image/jpeg", lastModified: Date.now() },
    );
  };

  const handleUpdateProfile = async () => {
    if (!user?.id) return;
    setProfileUpdating(true);
    setSaveSuccess(false);
    setSaveError("");
    try {
      await updateProfileDetails({ username: newUsername, bio: newBio });
      const updatedUser = { ...user, username: newUsername };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setProfileData((p) =>
        p ? { ...p, username: newUsername, bio: newBio } : p,
      );
      setSaveSuccess(true);
    } catch (error: any) {
      setSaveError(
        error?.response?.data?.error ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setProfileUpdating(false);
    }
  };

  const handleCloseDialog = () => {
    if (uploading) return;
    setOpenDialog(false);
    setNewProfilePic(null);
    setUploadError("");
  };

  const bioLen = newBio?.length ?? 0;
  const bioNearLimit = bioLen >= BIO_MAX * 0.85;
  const bioAtLimit = bioLen >= BIO_MAX;

  // ── shared styles ──────────────────────────────────────────────────────
  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      backgroundColor: (t: any) => t.palette.action.hover,
      fontSize: "0.875rem",
      color: (t: any) => t.palette.text.primary,
      transition: "border-color 0.15s",
      "& fieldset": { borderColor: (t: any) => t.palette.divider },
      "&:hover fieldset": { borderColor: (t: any) => t.palette.text.disabled },
      "&.Mui-focused fieldset": {
        borderColor: `${ACCENT}80`,
        borderWidth: "1px",
      },
    },
    "& .MuiFormLabel-root": {
      fontSize: "0.875rem",
      color: (t: any) => t.palette.text.disabled,
    },
  };

  const labelSx = {
    fontFamily: "'Inter', -apple-system, sans-serif",
    fontSize: "0.7rem",
    fontWeight: 500,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    color: (t: any) => t.palette.text.disabled,
    mb: 0.875,
    display: "block",
  };

  const errorAlertSx = {
    borderRadius: "10px",
    backgroundColor: (t: any) => `${t.palette.error.main}14`,
    color: (t: any) => t.palette.error.main,
    border: "1px solid",
    borderColor: (t: any) => `${t.palette.error.main}30`,
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.82rem",
    py: 0.5,
    "& .MuiAlert-icon": { color: (t: any) => t.palette.error.main },
    "& .MuiAlert-message": {
      fontFamily: "'Inter', sans-serif",
      fontSize: "0.82rem",
    },
    "& .MuiAlert-action .MuiIconButton-root": {
      color: (t: any) => t.palette.error.main,
    },
  };

  const successAlertSx = {
    borderRadius: "10px",
    backgroundColor: (t: any) => `${t.palette.success.main}14`,
    color: (t: any) => t.palette.success.main,
    border: "1px solid",
    borderColor: (t: any) => `${t.palette.success.main}30`,
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.82rem",
    py: 0.5,
    "& .MuiAlert-icon": { color: (t: any) => t.palette.success.main },
    "& .MuiAlert-message": {
      fontFamily: "'Inter', sans-serif",
      fontSize: "0.82rem",
    },
  };

  const dialogPaperSx = {
    borderRadius: "16px",
    backgroundColor: (t: any) => t.palette.background.paper,
    border: "1px solid",
    borderColor: (t: any) => t.palette.divider,
    boxShadow: "0 16px 40px rgba(0,0,0,0.2)",
    color: (t: any) => t.palette.text.primary,
    overflow: "hidden",
    width: "calc(100% - 32px)",
    m: 2,
    transform: "translateZ(0)",
    willChange: "transform",
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 620,
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* ── Page header ── */}
      <Box sx={{ mb: 0.25 }}>
        <Typography
          sx={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "1rem",
            fontWeight: 500,
            color: (t) => t.palette.text.primary,
            lineHeight: 1.3,
          }}
        >
          Profile details
        </Typography>
        <Typography
          sx={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.8rem",
            color: (t) => t.palette.text.disabled,
            mt: 0.375,
          }}
        >
          Manage your public-facing identity
        </Typography>
      </Box>

      {/* ── Avatar card ── */}
      <Box
        sx={{
          borderRadius: "14px",
          border: "1px solid",
          borderColor: (t) => t.palette.divider,
          backgroundColor: (t) => t.palette.background.paper,
          px: 2.5,
          py: 2,
          display: "flex",
          alignItems: "center",
          gap: 2.5,
        }}
      >
        {profileLoading ? (
          <Skeleton
            variant="circular"
            width={58}
            height={58}
            sx={{ flexShrink: 0, bgcolor: (t) => t.palette.action.hover }}
          />
        ) : (
          <Box
            onClick={() => setOpenDialog(true)}
            sx={{
              position: "relative",
              flexShrink: 0,
              cursor: "pointer",
              "& .overlay": { opacity: 0, transition: "opacity 0.15s" },
              "&:hover .overlay": { opacity: 1 },
            }}
          >
            <Avatar
              src={
                user?.profile_picture_url
                  ? `${user.profile_picture_url}?t=${Date.now()}`
                  : BlankProfileImage
              }
              sx={{
                width: 58,
                height: 58,
                border: "1px solid",
                borderColor: (t) => t.palette.divider,
              }}
            />
            <Box
              className="overlay"
              sx={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CameraAltIcon sx={{ color: "#fff", fontSize: 18 }} />
            </Box>
          </Box>
        )}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {profileLoading ? (
            <>
              <Skeleton
                width="45%"
                height={16}
                sx={{
                  borderRadius: "6px",
                  bgcolor: (t) => t.palette.action.hover,
                }}
              />
              <Skeleton
                width="62%"
                height={12}
                sx={{
                  borderRadius: "6px",
                  mt: "6px",
                  bgcolor: (t) => t.palette.action.hover,
                }}
              />
            </>
          ) : (
            <>
              <Typography
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: (t) => t.palette.text.primary,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {newUsername || "—"}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.75rem",
                  color: (t) => t.palette.text.disabled,
                  mt: 0.25,
                }}
              >
                Click your photo to change it
              </Typography>
            </>
          )}
        </Box>

        {profileLoading ? (
          <Skeleton
            width={96}
            height={32}
            sx={{
              borderRadius: "9px",
              flexShrink: 0,
              bgcolor: (t) => t.palette.action.hover,
            }}
          />
        ) : (
          <Button
            onClick={() => setOpenDialog(true)}
            variant="outlined"
            size="small"
            sx={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.78rem",
              fontWeight: 500,
              textTransform: "none",
              borderRadius: "9px",
              px: 1.75,
              py: 0.625,
              color: (t) => t.palette.text.secondary,
              borderColor: (t) => t.palette.divider,
              flexShrink: 0,
              "&:hover": {
                borderColor: (t) => t.palette.text.disabled,
                backgroundColor: (t) => t.palette.action.hover,
                color: (t) => t.palette.text.primary,
              },
            }}
          >
            Change photo
          </Button>
        )}
      </Box>

      {/* ── Form card ── */}
      <Box
        sx={{
          borderRadius: "14px",
          border: "1px solid",
          borderColor: (t) => t.palette.divider,
          backgroundColor: (t) => t.palette.background.paper,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: 2.5,
            pt: 2.5,
            pb: 2.5,
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
          }}
        >
          {/* Username */}
          <Box>
            <Typography component="label" sx={labelSx}>
              Username
            </Typography>
            {profileLoading ? (
              <Skeleton
                variant="rounded"
                height={42}
                sx={{
                  borderRadius: "10px",
                  bgcolor: (t) => t.palette.action.hover,
                }}
              />
            ) : (
              <>
                <TextField
                  variant="outlined"
                  fullWidth
                  value={newUsername}
                  onChange={(e) => {
                    const v = e.target.value;
                    setNewUsername(v);
                    setUsernameError(
                      !v
                        ? "Username cannot be empty."
                        : /^[a-zA-Z0-9_]+$/.test(v)
                          ? ""
                          : "Only letters, numbers, and underscores.",
                    );
                  }}
                  sx={inputSx}
                />
                <Collapse in={!!usernameError}>
                  <Alert
                    severity="error"
                    icon={<ErrorOutlineIcon sx={{ fontSize: 15 }} />}
                    sx={{ ...errorAlertSx, mt: 0.875 }}
                  >
                    {usernameError}
                  </Alert>
                </Collapse>
              </>
            )}
          </Box>

          {/* Bio */}
          <Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 0.875,
              }}
            >
              <Typography component="label" sx={{ ...labelSx, mb: 0 }}>
                Bio
              </Typography>
              {!profileLoading && (
                <Typography
                  sx={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.68rem",
                    color: bioAtLimit
                      ? (t: any) => t.palette.error.main
                      : bioNearLimit
                        ? (t: any) => t.palette.warning.main
                        : (t: any) => t.palette.text.disabled,
                    transition: "color 0.15s",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {bioLen} / {BIO_MAX}
                </Typography>
              )}
            </Box>
            {profileLoading ? (
              <Skeleton
                variant="rounded"
                height={88}
                sx={{
                  borderRadius: "10px",
                  bgcolor: (t) => t.palette.action.hover,
                }}
              />
            ) : (
              <Box sx={{ position: "relative" }}>
                <TextField
                  variant="outlined"
                  fullWidth
                  multiline
                  rows={3}
                  value={newBio}
                  inputProps={{ maxLength: BIO_MAX }}
                  onChange={(e) => setNewBio(e.target.value)}
                  sx={{
                    ...inputSx,
                    "& .MuiOutlinedInput-root fieldset": {
                      ...(bioAtLimit && {
                        borderColor: (t: any) =>
                          `${t.palette.error.main} !important`,
                      }),
                    },
                  }}
                />
                <IconButton
                  onClick={(e) => setEmojiAnchorEl(e.currentTarget)}
                  size="small"
                  sx={{
                    position: "absolute",
                    top: 12,
                    right: 24,
                    width: 26,
                    height: 26,
                    borderRadius: "7px",
                    color: (t) => t.palette.text.disabled,
                    "&:hover": {
                      color: ACCENT,
                      backgroundColor: (t) => t.palette.action.hover,
                    },
                  }}
                >
                  <EmojiIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Box>
            )}
          </Box>
        </Box>

        {/* Status banners */}
        <Collapse in={!!saveError || saveSuccess}>
          <Box sx={{ px: 2.5, pb: 2 }}>
            {saveError && (
              <Alert
                severity="error"
                onClose={() => setSaveError("")}
                icon={<ErrorOutlineIcon sx={{ fontSize: 15 }} />}
                sx={errorAlertSx}
              >
                {saveError}
              </Alert>
            )}
            {saveSuccess && !saveError && (
              <Alert
                severity="success"
                icon={<SuccessIcon sx={{ fontSize: 15 }} />}
                sx={successAlertSx}
              >
                Your profile has been updated.
              </Alert>
            )}
          </Box>
        </Collapse>

        {/* Footer */}
        <Box
          sx={{
            borderTop: "1px solid",
            borderColor: (t) => t.palette.divider,
            px: 2.5,
            py: 1.5,
            backgroundColor: (t) => t.palette.action.hover,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Collapse
            in={isModified && !profileUpdating && !profileLoading}
            orientation="horizontal"
          >
            <Typography
              sx={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.75rem",
                color: (t) => t.palette.text.disabled,
                whiteSpace: "nowrap",
              }}
            >
              Unsaved changes
            </Typography>
          </Collapse>
          <Button
            variant="contained"
            onClick={handleUpdateProfile}
            disabled={
              !isModified ||
              profileUpdating ||
              !!usernameError ||
              profileLoading
            }
            sx={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
              fontSize: "0.84rem",
              borderRadius: "10px",
              px: 2.5,
              py: 0.875,
              textTransform: "none",
              backgroundColor: ACCENT,
              color: "#fff",
              boxShadow: "none",
              minWidth: 120,
              transition: "background-color 0.15s, transform 0.1s",
              "&:hover": { backgroundColor: "#6b4de0", boxShadow: "none" },
              "&:active": { transform: "scale(0.97)" },
              "&.Mui-disabled": {
                backgroundColor: (t) => t.palette.action.disabledBackground,
                color: (t) => t.palette.action.disabled,
              },
            }}
          >
            {profileUpdating ? (
              <CircularProgress size={14} sx={{ color: "#fff" }} />
            ) : (
              "Save changes"
            )}
          </Button>
        </Box>
      </Box>

      {/* ── Upload / Crop dialog ── */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
        BackdropProps={{ sx: { backgroundColor: "rgba(0,0,0,0.4)" } }}
        TransitionComponent={Fade}
        transitionDuration={200}
        sx={{ "& .MuiDialog-paper": dialogPaperSx }}
      >
        {/* Dialog header */}
        <Box
          sx={{
            px: 2,
            py: 1.375,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            borderBottom: "1px solid",
            borderColor: (t) => t.palette.divider,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.9rem",
                fontWeight: 500,
                color: (t) => t.palette.text.primary,
                lineHeight: 1.3,
              }}
            >
              {newProfilePic ? "Crop your photo" : "Upload a photo"}
            </Typography>
            <Typography
              sx={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.72rem",
                color: (t) => t.palette.text.disabled,
                mt: 0.25,
              }}
            >
              {newProfilePic
                ? "Drag to reposition · scroll to zoom"
                : "Drop an image or click to browse"}
            </Typography>
          </Box>
          <IconButton
            onClick={handleCloseDialog}
            disabled={uploading}
            size="small"
            sx={{
              width: 30,
              height: 30,
              borderRadius: "9px",
              border: "1px solid",
              borderColor: (t) => t.palette.divider,
              color: (t) => t.palette.text.disabled,
              "&:hover": {
                color: (t) => t.palette.text.primary,
                backgroundColor: (t) => t.palette.action.hover,
              },
            }}
          >
            <CloseRoundedIcon sx={{ fontSize: "1rem" }} />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 2, overflowX: "hidden" }}>
          <Collapse in={!!uploadError}>
            <Alert
              severity="error"
              onClose={() => setUploadError("")}
              icon={<ErrorOutlineIcon sx={{ fontSize: 15 }} />}
              sx={{ ...errorAlertSx, mb: 1.5 }}
            >
              {uploadError}
            </Alert>
          </Collapse>

          {uploading ? (
            <Box
              sx={{
                width: "100%",
                height: 280,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1.5,
              }}
            >
              <CircularProgress size={28} sx={{ color: ACCENT }} />
              <Typography
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.8rem",
                  color: (t) => t.palette.text.disabled,
                }}
              >
                Uploading your photo…
              </Typography>
            </Box>
          ) : newProfilePic ? (
            <Box
              sx={{
                width: "100%",
                height: { xs: 240, sm: 320 },
                borderRadius: "10px",
                overflow: "hidden",
                border: "1px solid",
                borderColor: (t) => t.palette.divider,
              }}
            >
              <Cropper
                src={URL.createObjectURL(newProfilePic)}
                style={{ height: "100%", width: "100%" }}
                initialAspectRatio={1}
                aspectRatio={1}
                guides={false}
                viewMode={1}
                background={false}
                responsive
                autoCropArea={1}
                checkOrientation={false}
                onInitialized={(instance) => setCropper(instance)}
              />
            </Box>
          ) : (
            <Box
              {...getRootProps()}
              sx={{
                width: "100%",
                height: { xs: 180, sm: 240 },
                borderRadius: "12px",
                border: "1px dashed",
                borderColor: isDragActive ? ACCENT : (t) => t.palette.divider,
                backgroundColor: isDragActive
                  ? `${ACCENT}0a`
                  : (t) => t.palette.action.hover,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1.25,
                cursor: "pointer",
                transition: "border-color 0.15s, background-color 0.15s",
                "&:hover": {
                  borderColor: (t) => t.palette.text.disabled,
                  backgroundColor: (t) => t.palette.action.selected,
                },
              }}
            >
              <input {...getInputProps()} />
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "11px",
                  backgroundColor: (t) => t.palette.background.paper,
                  border: "1px solid",
                  borderColor: (t) => t.palette.divider,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <UploadIcon
                  sx={{
                    fontSize: "1.2rem",
                    color: isDragActive
                      ? ACCENT
                      : (t) => t.palette.text.disabled,
                  }}
                />
              </Box>
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  sx={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.84rem",
                    fontWeight: 500,
                    color: isDragActive
                      ? ACCENT
                      : (t) => t.palette.text.primary,
                  }}
                >
                  {isDragActive ? "Drop it here" : "Drop an image here"}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.75rem",
                    color: (t) => t.palette.text.disabled,
                    mt: 0.25,
                  }}
                >
                  or{" "}
                  <Box
                    component="span"
                    onClick={(e) => {
                      e.stopPropagation();
                      openFilePicker();
                    }}
                    sx={{
                      color: ACCENT,
                      cursor: "pointer",
                      textDecoration: "underline",
                      textUnderlineOffset: 2,
                    }}
                  >
                    browse your files
                  </Box>
                </Typography>
              </Box>
              <Typography
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.68rem",
                  color: (t) => t.palette.text.disabled,
                  letterSpacing: "0.04em",
                }}
              >
                JPEG · PNG · GIF
              </Typography>
            </Box>
          )}
        </DialogContent>

        {/* Dialog footer */}
        <Box
          sx={{
            px: 2,
            py: 1.25,
            borderTop: "1px solid",
            borderColor: (t) => t.palette.divider,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 0.75,
          }}
        >
          {newProfilePic && !uploading && (
            <Button
              onClick={() => {
                setNewProfilePic(null);
                setUploadError("");
              }}
              sx={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.8rem",
                fontWeight: 500,
                textTransform: "none",
                borderRadius: "9px",
                px: 1.75,
                color: (t) => t.palette.text.disabled,
                "&:hover": {
                  backgroundColor: (t) => t.palette.action.hover,
                  color: (t) => t.palette.text.secondary,
                },
              }}
            >
              Choose different
            </Button>
          )}
          <Button
            onClick={handleCloseDialog}
            disabled={uploading}
            sx={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.8rem",
              fontWeight: 500,
              textTransform: "none",
              borderRadius: "9px",
              px: 1.75,
              border: "1px solid",
              borderColor: (t) => t.palette.divider,
              color: (t) => t.palette.text.secondary,
              "&:hover": {
                backgroundColor: (t) => t.palette.action.hover,
                color: (t) => t.palette.text.primary,
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUploadProfilePic}
            disabled={uploading || !newProfilePic}
            startIcon={
              !uploading && <CheckRoundedIcon sx={{ fontSize: "0.95rem" }} />
            }
            sx={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.8rem",
              fontWeight: 500,
              textTransform: "none",
              borderRadius: "9px",
              px: 2,
              backgroundColor: ACCENT,
              color: "#fff",
              boxShadow: "none",
              transition: "background-color 0.15s, transform 0.1s",
              "&:hover": { backgroundColor: "#6b4de0", boxShadow: "none" },
              "&:active": { transform: "scale(0.97)" },
              "&.Mui-disabled": {
                backgroundColor: (t) => t.palette.action.disabledBackground,
                color: (t) => t.palette.action.disabled,
              },
            }}
          >
            {uploading ? (
              <CircularProgress size={14} sx={{ color: "#fff" }} />
            ) : (
              "Upload photo"
            )}
          </Button>
        </Box>
      </Dialog>

      {/* ── Emoji popover ── */}
      <Popover
        open={Boolean(emojiAnchorEl)}
        anchorEl={emojiAnchorEl}
        onClose={() => setEmojiAnchorEl(null)}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        PaperProps={{
          sx: {
            borderRadius: "16px",
            border: "1px solid",
            borderColor: (t) => t.palette.divider,
            overflow: "hidden",
          },
        }}
      >
        <EmojiPicker
          theme={isDark ? Theme.DARK : Theme.LIGHT}
          onEmojiClick={handleEmojiClick}
        />
      </Popover>
    </Box>
  );
};

export default ProfileDetails;
