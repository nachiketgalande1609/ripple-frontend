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
} from "@mui/material";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import { useDropzone } from "react-dropzone";
import { uploadProfilePicture } from "../../services/api";
import { useGlobalStore } from "../../store/store";
import { updateProfileDetails, getProfile } from "../../services/api";
import { useNotifications } from "@toolpad/core/useNotifications";
import EmojiPicker, { Theme } from "emoji-picker-react";
import {
    SentimentSatisfiedAlt as EmojiIcon,
    CameraAlt as CameraAltIcon,
    UploadFileRounded as UploadIcon,
    CheckCircleOutline as SuccessIcon,
    ErrorOutline as ErrorOutlineIcon,
} from "@mui/icons-material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import Popover from "@mui/material/Popover";
import BlankProfileImage from "../../static/profile_blank.png";

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

// ── helpers ──────────────────────────────────────────────────────────────────

const inputSx = {
    "& .MuiOutlinedInput-root": {
        borderRadius: "12px",
        backgroundColor: "rgba(255,255,255,0.04)",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "14px",
        color: "#ffffff",
        transition: "background 0.2s",
        "& fieldset": { borderColor: "rgba(255,255,255,0.09)", transition: "border-color 0.2s" },
        "&:hover": { backgroundColor: "rgba(255,255,255,0.06)" },
        "&:hover fieldset": { borderColor: "rgba(255,255,255,0.22)" },
        "&.Mui-focused": { backgroundColor: "rgba(255,255,255,0.06)" },
        "&.Mui-focused fieldset": { borderColor: "rgba(255,255,255,0.35)", borderWidth: "1px" },
    },
    "& .MuiFormLabel-root": {
        fontFamily: "'DM Sans', sans-serif",
        color: "rgba(255,255,255,0.3)",
        fontSize: "13px",
        "&.Mui-focused": { color: "rgba(255,255,255,0.55)" },
    },
    "& .MuiInputBase-input": { color: "#ffffff" },
};

const LABEL_SX = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "11px",
    fontWeight: 600,
    color: "rgba(255,255,255,0.35)",
    mb: 1,
    letterSpacing: "0.6px",
    textTransform: "uppercase" as const,
};

// ── component ─────────────────────────────────────────────────────────────────

const ProfileDetails = () => {
    const { setUser } = useGlobalStore();
    const notifications = useNotifications();

    const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "") : {};

    const [profileData, setProfileData] = useState<Profile | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [newProfilePic, setNewProfilePic] = useState<File | null>(null);
    const [newUsername, setNewUsername] = useState("");
    const [newBio, setNewBio] = useState("");
    const [profileUpdating, setProfileUpdating] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState<string>("");
    const [cropper, setCropper] = useState<any>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string>("");
    const [isModified, setIsModified] = useState(false);
    const [emojiAnchorEl, setEmojiAnchorEl] = useState<null | HTMLElement>(null);
    const [usernameError, setUsernameError] = useState("");
    const [isDragActive, setIsDragActive] = useState(false);

    const BIO_MAX = 160;

    const handleEmojiClick = (emojiData: any) => {
        if ((newBio?.length ?? 0) < BIO_MAX) {
            setNewBio((prev) => prev + emojiData.emoji);
        }
    };

    useEffect(() => {
        if (profileData) {
            setIsModified(newUsername !== profileData.username || newBio !== (profileData.bio ?? ""));
            // clear status banners when user edits again
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
            if (user?.id) {
                const res = await getProfile(user?.id);
                setProfileData(res.data);
                setNewUsername(res.data.username);
                setNewBio(res.data.bio ?? "");
            }
        } catch (error) {
            console.log(error);
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
                    const updatedUser = { ...user, profile_picture_url: response.fileUrl };
                    setUser(updatedUser);
                    localStorage.setItem("user", JSON.stringify(updatedUser));
                    notifications.show("Profile picture updated!", { severity: "success", autoHideDuration: 3000 });
                    setOpenDialog(false);
                    setNewProfilePic(null);
                })
                .catch((err) => {
                    const msg = err?.response?.data?.message || err?.message || "Failed to upload photo. Please try again.";
                    setUploadError(msg);
                })
                .finally(() => setUploading(false));
        }
    };

    const dataURItoFile = (dataURI: string): File => {
        const byteString = atob(dataURI.split(",")[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        const blob = new Blob([ab], { type: "image/jpeg" });
        return new File([blob], "profile_picture.jpg", { type: "image/jpeg", lastModified: Date.now() });
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
            // reflect saved values so isModified resets
            setProfileData((prev) => (prev ? { ...prev, username: newUsername, bio: newBio } : prev));
            setSaveSuccess(true);
        } catch (error: any) {
            console.log(error);

            const msg = error?.response?.data?.error || "Something went wrong. Please try again.";
            setSaveError(msg);
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

    return (
        <Box
            sx={{
                width: "100%",
                maxWidth: 680,
                display: "flex",
                flexDirection: "column",
                gap: 3,
                fontFamily: "'DM Sans', sans-serif",
            }}
        >
            {/* ── Page header ───────────────────────────────────────────────────── */}
            <Box sx={{ mb: 0.5 }}>
                <Typography
                    sx={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "20px",
                        fontWeight: 700,
                        color: "#ffffff",
                        letterSpacing: "-0.5px",
                        lineHeight: 1.2,
                    }}
                >
                    Profile Details
                </Typography>
                <Typography
                    sx={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "13px",
                        color: "rgba(255,255,255,0.3)",
                        mt: 0.5,
                    }}
                >
                    Manage your public-facing identity
                </Typography>
            </Box>

            {/* ── Avatar card ───────────────────────────────────────────────────── */}
            <Box
                sx={{
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.07)",
                    backgroundColor: "rgba(255,255,255,0.025)",
                    px: 3,
                    py: 2.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                }}
            >
                {/* Avatar with camera overlay on hover */}
                <Box
                    onClick={() => setOpenDialog(true)}
                    sx={{
                        position: "relative",
                        flexShrink: 0,
                        cursor: "pointer",
                        "& .overlay": { opacity: 0, transition: "opacity 0.2s" },
                        "&:hover .overlay": { opacity: 1 },
                    }}
                >
                    <Avatar
                        src={user?.profile_picture_url ? `${user.profile_picture_url}?t=${new Date().getTime()}` : BlankProfileImage}
                        sx={{
                            width: 72,
                            height: 72,
                            border: "2px solid rgba(255,255,255,0.1)",
                        }}
                    />
                    {/* Hover overlay */}
                    <Box
                        className="overlay"
                        sx={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: "50%",
                            backgroundColor: "rgba(0,0,0,0.55)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <CameraAltIcon sx={{ color: "#fff", fontSize: 20 }} />
                    </Box>
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        sx={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "15px",
                            fontWeight: 600,
                            color: "#ffffff",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {newUsername || "—"}
                    </Typography>
                    <Typography
                        sx={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "12px",
                            color: "rgba(255,255,255,0.28)",
                            mt: 0.3,
                        }}
                    >
                        Hover your photo to change it
                    </Typography>
                </Box>

                <Button
                    onClick={() => setOpenDialog(true)}
                    variant="outlined"
                    size="small"
                    sx={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "12px",
                        fontWeight: 500,
                        textTransform: "none",
                        borderRadius: "8px",
                        px: 2,
                        py: 0.75,
                        color: "rgba(255,255,255,0.5)",
                        borderColor: "rgba(255,255,255,0.1)",
                        flexShrink: 0,
                        "&:hover": {
                            borderColor: "rgba(255,255,255,0.3)",
                            backgroundColor: "rgba(255,255,255,0.04)",
                            color: "#fff",
                        },
                    }}
                >
                    Change photo
                </Button>
            </Box>

            {/* ── Form card ─────────────────────────────────────────────────────── */}
            <Box
                sx={{
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.07)",
                    backgroundColor: "rgba(255,255,255,0.025)",
                    overflow: "hidden",
                }}
            >
                <Box sx={{ px: 3, pt: 3, pb: 3, display: "flex", flexDirection: "column", gap: 3 }}>
                    {/* Username */}
                    <Box>
                        <Typography sx={LABEL_SX}>Username</Typography>
                        <TextField
                            variant="outlined"
                            fullWidth
                            value={newUsername}
                            onChange={(e) => {
                                const value = e.target.value;
                                setNewUsername(value);
                                setUsernameError(
                                    !value
                                        ? "Username cannot be empty."
                                        : /^[a-zA-Z0-9_]+$/.test(value)
                                          ? ""
                                          : "Only letters, numbers, and underscores are allowed.",
                                );
                            }}
                            sx={inputSx}
                        />
                        <Collapse in={!!usernameError}>
                            <Alert
                                severity="error"
                                icon={<ErrorOutlineIcon sx={{ fontSize: 16 }} />}
                                sx={{
                                    mt: 1,
                                    borderRadius: "10px",
                                    backgroundColor: "rgba(239,68,68,0.08)",
                                    color: "#f87171",
                                    border: "1px solid rgba(239,68,68,0.18)",
                                    fontSize: "12px",
                                    fontFamily: "'DM Sans', sans-serif",
                                    py: 0.5,
                                    "& .MuiAlert-icon": { color: "#f87171" },
                                    "& .MuiAlert-message": { fontFamily: "'DM Sans', sans-serif", fontSize: "12px" },
                                }}
                            >
                                {usernameError}
                            </Alert>
                        </Collapse>
                    </Box>

                    {/* Bio */}
                    <Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                            <Typography sx={LABEL_SX}>Bio</Typography>
                            <Typography
                                sx={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: "11px",
                                    color: bioAtLimit ? "#f87171" : bioNearLimit ? "rgba(251,191,36,0.7)" : "rgba(255,255,255,0.2)",
                                    transition: "color 0.2s",
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                {bioLen} / {BIO_MAX}
                            </Typography>
                        </Box>
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
                                        ...(bioAtLimit && { borderColor: "rgba(239,68,68,0.4) !important" }),
                                    },
                                }}
                            />
                            <IconButton
                                onClick={(e) => setEmojiAnchorEl(e.currentTarget)}
                                size="small"
                                title="Add emoji"
                                sx={{
                                    position: "absolute",
                                    top: 8,
                                    right: 8,
                                    color: "rgba(255,255,255,0.2)",
                                    "&:hover": {
                                        color: "rgba(255,255,255,0.6)",
                                        backgroundColor: "rgba(255,255,255,0.06)",
                                    },
                                }}
                            >
                                <EmojiIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    </Box>
                </Box>

                {/* ── Status banners ─────────────────────────────────────────────── */}
                <Collapse in={!!saveError || saveSuccess}>
                    <Box sx={{ px: 3, pb: 2 }}>
                        {saveError && (
                            <Alert
                                severity="error"
                                onClose={() => setSaveError("")}
                                icon={<ErrorOutlineIcon sx={{ fontSize: 16 }} />}
                                sx={{
                                    borderRadius: "10px",
                                    backgroundColor: "rgba(239,68,68,0.08)",
                                    color: "#f87171",
                                    border: "1px solid rgba(239,68,68,0.18)",
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: "13px",
                                    py: 0.5,
                                    "& .MuiAlert-icon": { color: "#f87171" },
                                    "& .MuiAlert-message": { fontFamily: "'DM Sans', sans-serif", fontSize: "13px" },
                                    "& .MuiAlert-action .MuiIconButton-root": { color: "rgba(248,113,113,0.6)" },
                                }}
                            >
                                {saveError}
                            </Alert>
                        )}
                        {saveSuccess && !saveError && (
                            <Alert
                                severity="success"
                                icon={<SuccessIcon sx={{ fontSize: 16 }} />}
                                sx={{
                                    borderRadius: "10px",
                                    backgroundColor: "rgba(34,197,94,0.08)",
                                    color: "#4ade80",
                                    border: "1px solid rgba(34,197,94,0.18)",
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: "13px",
                                    py: 0.5,
                                    "& .MuiAlert-icon": { color: "#4ade80" },
                                    "& .MuiAlert-message": { fontFamily: "'DM Sans', sans-serif", fontSize: "13px" },
                                }}
                            >
                                Your profile has been updated.
                            </Alert>
                        )}
                    </Box>
                </Collapse>

                {/* ── Footer ─────────────────────────────────────────────────────── */}
                <Box
                    sx={{
                        borderTop: "1px solid rgba(255,255,255,0.05)",
                        px: 3,
                        py: 2,
                        backgroundColor: "rgba(255,255,255,0.01)",
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        gap: 2,
                    }}
                >
                    <Collapse in={isModified && !profileUpdating} orientation="horizontal">
                        <Typography
                            sx={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: "12px",
                                color: "rgba(255,255,255,0.22)",
                                whiteSpace: "nowrap",
                            }}
                        >
                            Unsaved changes
                        </Typography>
                    </Collapse>
                    <Button
                        variant="contained"
                        onClick={handleUpdateProfile}
                        disabled={!isModified || profileUpdating || !!usernameError}
                        sx={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 600,
                            fontSize: "13px",
                            borderRadius: "9px",
                            px: 3,
                            py: 1,
                            textTransform: "none",
                            backgroundColor: "#ffffff",
                            color: "#000000",
                            boxShadow: "none",
                            minWidth: 128,
                            transition: "background 0.18s, opacity 0.18s",
                            "&:hover": { backgroundColor: "#e8e8e8", boxShadow: "none" },
                            "&.Mui-disabled": {
                                backgroundColor: "rgba(255,255,255,0.07)",
                                color: "rgba(255,255,255,0.18)",
                            },
                        }}
                    >
                        {profileUpdating ? <CircularProgress size={15} sx={{ color: "rgba(0,0,0,0.4)" }} /> : "Save Changes"}
                    </Button>
                </Box>
            </Box>

            {/* ── Upload / Crop dialog ──────────────────────────────────────────── */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                fullWidth
                maxWidth="sm"
                BackdropProps={{
                    sx: { backdropFilter: "blur(10px)", backgroundColor: "rgba(0,0,0,0.65)" },
                }}
                TransitionComponent={Fade}
                transitionDuration={200}
                sx={{
                    "& .MuiDialog-paper": {
                        borderRadius: "20px",
                        background: "linear-gradient(160deg, #14141e 0%, #0f0f18 100%)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "0 32px 72px rgba(0,0,0,0.8)",
                        color: "white",
                        overflow: "hidden",
                        overflowX: "hidden",
                        width: "calc(100% - 32px)",
                        m: 2,
                    },
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        px: 2.5,
                        pt: 2.5,
                        pb: 2,
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                >
                    <Box>
                        <Typography
                            sx={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: "0.95rem",
                                fontWeight: 700,
                                color: "#fff",
                                lineHeight: 1.3,
                            }}
                        >
                            {newProfilePic ? "Crop your photo" : "Upload a photo"}
                        </Typography>
                        <Typography
                            sx={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: "0.75rem",
                                color: "rgba(255,255,255,0.3)",
                                mt: 0.25,
                            }}
                        >
                            {newProfilePic ? "Drag to reposition · scroll to zoom" : "Drop an image or click to browse"}
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={handleCloseDialog}
                        disabled={uploading}
                        size="small"
                        sx={{
                            color: "rgba(255,255,255,0.3)",
                            mt: -0.25,
                            "&:hover": { color: "#fff", backgroundColor: "rgba(255,255,255,0.06)" },
                        }}
                    >
                        <CloseRoundedIcon sx={{ fontSize: "1.1rem" }} />
                    </IconButton>
                </Box>

                <DialogContent sx={{ p: 2.5, overflowX: "hidden" }}>
                    {/* Upload error */}
                    <Collapse in={!!uploadError}>
                        <Alert
                            severity="error"
                            onClose={() => setUploadError("")}
                            sx={{
                                mb: 2,
                                borderRadius: "10px",
                                backgroundColor: "rgba(239,68,68,0.08)",
                                color: "#f87171",
                                border: "1px solid rgba(239,68,68,0.18)",
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: "13px",
                                py: 0.5,
                                "& .MuiAlert-icon": { color: "#f87171" },
                                "& .MuiAlert-message": { fontFamily: "'DM Sans', sans-serif", fontSize: "13px" },
                                "& .MuiAlert-action .MuiIconButton-root": { color: "rgba(248,113,113,0.6)" },
                            }}
                        >
                            {uploadError}
                        </Alert>
                    </Collapse>

                    {uploading ? (
                        <Box
                            sx={{
                                width: "100%",
                                height: 300,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 2,
                            }}
                        >
                            <CircularProgress size={32} sx={{ color: "rgba(180,180,255,0.5)" }} />
                            <Typography
                                sx={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: "0.82rem",
                                    color: "rgba(255,255,255,0.3)",
                                }}
                            >
                                Uploading your photo…
                            </Typography>
                        </Box>
                    ) : newProfilePic ? (
                        <Box
                            sx={{
                                width: "100%",
                                height: { xs: 240, sm: 340 },
                                borderRadius: "12px",
                                overflow: "hidden",
                                border: "1px solid rgba(255,255,255,0.07)",
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
                                height: { xs: 200, sm: 260 },
                                borderRadius: "14px",
                                border: isDragActive ? "2px dashed rgba(160,150,255,0.6)" : "2px dashed rgba(255,255,255,0.09)",
                                backgroundColor: isDragActive ? "rgba(160,150,255,0.05)" : "rgba(255,255,255,0.015)",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 1.5,
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                boxSizing: "border-box",
                                "&:hover": {
                                    borderColor: "rgba(255,255,255,0.2)",
                                    backgroundColor: "rgba(255,255,255,0.03)",
                                },
                            }}
                        >
                            <input {...getInputProps()} />
                            <Box
                                sx={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: "14px",
                                    background: isDragActive ? "rgba(160,150,255,0.15)" : "rgba(255,255,255,0.06)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.2s ease",
                                }}
                            >
                                <UploadIcon
                                    sx={{
                                        fontSize: "1.4rem",
                                        color: isDragActive ? "rgba(160,150,255,0.9)" : "rgba(255,255,255,0.35)",
                                        transition: "color 0.2s ease",
                                    }}
                                />
                            </Box>
                            <Box sx={{ textAlign: "center" }}>
                                <Typography
                                    sx={{
                                        fontFamily: "'DM Sans', sans-serif",
                                        fontSize: "0.875rem",
                                        fontWeight: 500,
                                        color: isDragActive ? "rgba(160,150,255,0.9)" : "rgba(255,255,255,0.65)",
                                    }}
                                >
                                    {isDragActive ? "Drop it here" : "Drop an image here"}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontFamily: "'DM Sans', sans-serif",
                                        fontSize: "0.75rem",
                                        color: "rgba(255,255,255,0.28)",
                                        mt: 0.3,
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
                                            color: "rgba(160,150,255,0.8)",
                                            cursor: "pointer",
                                            textDecoration: "underline",
                                            textUnderlineOffset: 2,
                                            "&:hover": { color: "#b8b0ff" },
                                        }}
                                    >
                                        browse your files
                                    </Box>
                                </Typography>
                            </Box>
                            <Typography
                                sx={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: "0.7rem",
                                    color: "rgba(255,255,255,0.18)",
                                    mt: 0.5,
                                    letterSpacing: "0.4px",
                                }}
                            >
                                JPEG · PNG · GIF
                            </Typography>
                        </Box>
                    )}
                </DialogContent>

                {/* Footer */}
                <Box
                    sx={{
                        px: 2.5,
                        py: 2,
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        gap: 1,
                    }}
                >
                    {newProfilePic && !uploading && (
                        <Button
                            onClick={() => {
                                setNewProfilePic(null);
                                setUploadError("");
                            }}
                            sx={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: "0.82rem",
                                fontWeight: 500,
                                textTransform: "none",
                                borderRadius: "10px",
                                px: 2,
                                color: "rgba(255,255,255,0.3)",
                                "&:hover": {
                                    backgroundColor: "rgba(255,255,255,0.05)",
                                    color: "rgba(255,255,255,0.65)",
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
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "0.82rem",
                            fontWeight: 500,
                            textTransform: "none",
                            borderRadius: "10px",
                            px: 2,
                            color: "rgba(255,255,255,0.3)",
                            "&:hover": {
                                backgroundColor: "rgba(255,255,255,0.05)",
                                color: "rgba(255,255,255,0.65)",
                            },
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUploadProfilePic}
                        disabled={uploading || !newProfilePic}
                        startIcon={!uploading && <CheckRoundedIcon sx={{ fontSize: "1rem" }} />}
                        sx={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            textTransform: "none",
                            borderRadius: "10px",
                            px: 2.5,
                            backgroundColor: "#ffffff",
                            color: "#000000",
                            "&:hover": { backgroundColor: "#e8e8e8" },
                            "&.Mui-disabled": {
                                backgroundColor: "rgba(255,255,255,0.07)",
                                color: "rgba(255,255,255,0.2)",
                            },
                        }}
                    >
                        {uploading ? <CircularProgress size={15} sx={{ color: "rgba(0,0,0,0.4)" }} /> : "Upload Photo"}
                    </Button>
                </Box>
            </Dialog>

            {/* ── Emoji popover ─────────────────────────────────────────────────── */}
            <Popover
                open={Boolean(emojiAnchorEl)}
                anchorEl={emojiAnchorEl}
                onClose={() => setEmojiAnchorEl(null)}
                anchorOrigin={{ vertical: "top", horizontal: "left" }}
                transformOrigin={{ vertical: "bottom", horizontal: "left" }}
                PaperProps={{
                    sx: {
                        borderRadius: "14px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        overflow: "hidden",
                        boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
                    },
                }}
            >
                <EmojiPicker theme={Theme.DARK} onEmojiClick={handleEmojiClick} />
            </Popover>
        </Box>
    );
};

export default ProfileDetails;
