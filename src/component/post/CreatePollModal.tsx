import { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    IconButton,
    Typography,
    CircularProgress,
} from "@mui/material";
import { Close as CloseIcon, Add as AddIcon, PollOutlined } from "@mui/icons-material";
import { createPoll } from "../../services/api";

interface CreatePollModalProps {
    open: boolean;
    onClose: () => void;
}

const inputSx = {
    "& .MuiOutlinedInput-root": {
        borderRadius: "14px",
        backgroundColor: "var(--nav-bg)",
        boxShadow:
            "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
        "& fieldset": { border: "none" },
        "&.Mui-focused fieldset": { border: "none" },
    },
};

export default function CreatePollModal({ open, onClose }: CreatePollModalProps) {
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState(["", ""]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleOptionChange = (index: number, value: string) => {
        setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
    };

    const handleAddOption = () => {
        if (options.length < 4) setOptions((prev) => [...prev, ""]);
    };

    const handleRemoveOption = (index: number) => {
        if (options.length > 2) setOptions((prev) => prev.filter((_, i) => i !== index));
    };

    const handleClose = () => {
        setQuestion("");
        setOptions(["", ""]);
        setError("");
        setSuccess(false);
        onClose();
    };

    const handleSubmit = async () => {
        setError("");
        if (!question.trim()) {
            setError("Poll question is required.");
            return;
        }
        const filled = options.filter((o) => o.trim());
        if (filled.length < 2) {
            setError("At least 2 options must be filled.");
            return;
        }

        setLoading(true);
        try {
            const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null;
            await createPoll(question.trim(), filled);
            setSuccess(true);
            setTimeout(() => {
                handleClose();
            }, 1200);
        } catch (err: any) {
            setError(err?.response?.data?.error || "Failed to create poll. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="xs"
            fullWidth
            BackdropProps={{ sx: { backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" } }}
            sx={{
                "& .MuiDialog-paper": {
                    borderRadius: "28px",
                    backgroundColor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
                    backdropFilter: "blur(8px)",
                    overflow: "hidden",
                    px: 0.5,
                },
            }}
        >
            {/* Header */}
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1, pt: 2.5, px: 3 }}>
                <Box
                    sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    <PollOutlined sx={{ color: "#fff", fontSize: "1.15rem" }} />
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", color: "text.primary", flex: 1 }}>
                    Create a Poll
                </Typography>
                <IconButton size="small" onClick={handleClose} sx={{ color: "text.disabled" }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ px: 3, pb: 1 }}>
                {/* Question */}
                <TextField
                    label="Poll question"
                    fullWidth
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    multiline
                    minRows={2}
                    sx={{ ...inputSx, mb: 2.5, mt: 0.5 }}
                    inputProps={{ maxLength: 300 }}
                    disabled={loading || success}
                />

                {/* Options */}
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, letterSpacing: 0.5, mb: 1, display: "block" }}>
                    OPTIONS
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {options.map((opt, i) => (
                        <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <TextField
                                placeholder={`Option ${i + 1}`}
                                fullWidth
                                value={opt}
                                onChange={(e) => handleOptionChange(i, e.target.value)}
                                sx={inputSx}
                                inputProps={{ maxLength: 120 }}
                                disabled={loading || success}
                                size="small"
                            />
                            {options.length > 2 && (
                                <IconButton
                                    size="small"
                                    onClick={() => handleRemoveOption(i)}
                                    disabled={loading || success}
                                    sx={{
                                        color: "text.disabled",
                                        "&:hover": { color: "error.main" },
                                        flexShrink: 0,
                                    }}
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            )}
                        </Box>
                    ))}
                </Box>

                {/* Add option */}
                {options.length < 4 && (
                    <Button
                        startIcon={<AddIcon />}
                        onClick={handleAddOption}
                        disabled={loading || success}
                        size="small"
                        sx={{
                            mt: 1.5,
                            textTransform: "none",
                            color: "#6366f1",
                            fontWeight: 600,
                            fontSize: "0.82rem",
                            px: 0,
                            "&:hover": { backgroundColor: "transparent", opacity: 0.8 },
                        }}
                    >
                        Add option ({options.length}/4)
                    </Button>
                )}

                {/* Error / success */}
                {error && (
                    <Typography sx={{ color: "error.main", fontSize: "0.8rem", mt: 1.5 }}>{error}</Typography>
                )}
                {success && (
                    <Typography sx={{ color: "success.main", fontSize: "0.8rem", mt: 1.5, fontWeight: 600 }}>
                        Poll created successfully!
                    </Typography>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
                <Button
                    fullWidth
                    onClick={handleSubmit}
                    disabled={loading || success}
                    sx={{
                        borderRadius: "14px",
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        py: 1.2,
                        background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
                        color: "#fff",
                        boxShadow: "0 4px 18px rgba(99,102,241,0.35)",
                        "&:hover": {
                            background: "linear-gradient(135deg, #4f52d3 0%, #6366f1 100%)",
                            boxShadow: "0 6px 22px rgba(99,102,241,0.45)",
                        },
                        "&:disabled": { opacity: 0.6 },
                    }}
                >
                    {loading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Create Poll"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
