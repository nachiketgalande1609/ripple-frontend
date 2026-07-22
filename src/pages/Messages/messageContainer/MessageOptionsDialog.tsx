import { Dialog, Box, Button, useTheme } from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

interface MessageOptionsDialogProps {
    open: boolean;
    onClose: () => void;
    onDelete: () => void;
    onInfo: () => void;
}

const dialogBackdrop = {
    sx: { backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.4)" },
};

function DialogIconWrap({ children, danger = false, muted = false }: { children: React.ReactNode; danger?: boolean; muted?: boolean }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const bg = danger
        ? "rgba(255,59,48,0.08)"
        : muted
          ? isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"
          : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
    const color = danger
        ? "rgba(255,80,80,0.7)"
        : muted
          ? theme.palette.text.disabled
          : theme.palette.text.secondary;
    return (
        <Box sx={{ width: 34, height: 34, borderRadius: "10px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", color, transition: "all 0.2s ease", flexShrink: 0 }}>
            {children}
        </Box>
    );
}

function DialogButton({ icon, label, onClick, danger = false, muted = false }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean; muted?: boolean }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    return (
        <Button
            fullWidth
            onClick={onClick}
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 2,
                py: 1.4,
                borderRadius: "12px",
                textTransform: "none",
                justifyContent: "flex-start",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
                fontSize: "0.875rem",
                color: danger ? (isDark ? "rgba(255,100,100,0.85)" : "#d32f2f") : muted ? theme.palette.text.disabled : theme.palette.text.primary,
                transition: "all 0.2s ease",
                "&:hover": {
                    background: danger ? "rgba(255,59,48,0.1)" : theme.palette.action.hover,
                    color: danger ? "#ff4444" : theme.palette.text.primary,
                },
            }}
        >
            <DialogIconWrap danger={danger} muted={muted}>{icon}</DialogIconWrap>
            {label}
        </Button>
    );
}

function DialogDivider() {
    return <Box sx={{ height: "1px", backgroundColor: (t) => t.palette.divider, mx: 1, my: 0.5 }} />;
}

const MessageOptionsDialog = ({ open, onClose, onDelete, onInfo }: MessageOptionsDialogProps) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    const dialogPaperSx = {
        borderRadius: "20px",
        background: isDark
            ? "linear-gradient(160deg, #13131c 0%, #0e0e16 100%)"
            : theme.palette.background.paper,
        border: "1px solid",
        borderColor: theme.palette.divider,
        boxShadow: isDark
            ? "0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(100,116,139,0.08)"
            : "0 8px 32px rgba(0,0,0,0.12)",
        overflow: "hidden",
        padding: "6px",
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" BackdropProps={dialogBackdrop} sx={{ "& .MuiDialog-paper": dialogPaperSx }}>
            <DialogButton icon={<DeleteRoundedIcon sx={{ fontSize: "1.1rem" }} />} label="Delete Message" onClick={onDelete} danger />
            <DialogButton icon={<InfoRoundedIcon sx={{ fontSize: "1.1rem" }} />} label="Message Info" onClick={onInfo} />
            <DialogDivider />
            <DialogButton icon={<CloseRoundedIcon sx={{ fontSize: "1.1rem" }} />} label="Cancel" onClick={onClose} muted />
        </Dialog>
    );
};

export default MessageOptionsDialog;
