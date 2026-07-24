import { Dialog, Box, Button } from "@mui/material";
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
    return (
        <Box sx={{ width: 34, height: 34, borderRadius: "10px", backgroundColor: danger ? "rgba(211,47,47,0.08)" : "action.hover", display: "flex", alignItems: "center", justifyContent: "center", color: danger ? "error.main" : muted ? "text.disabled" : "text.secondary", transition: "all 0.2s ease", flexShrink: 0 }}>
            {children}
        </Box>
    );
}

function DialogButton({ icon, label, onClick, danger = false, muted = false }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean; muted?: boolean }) {
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
                borderRadius: "18px",
                textTransform: "none",
                justifyContent: "flex-start",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
                fontSize: "0.875rem",
                color: danger ? "error.main" : muted ? "text.disabled" : "text.primary",
                border: "none",
                backgroundColor: "var(--nav-bg)",
                boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)",
                transition: "box-shadow 0.35s cubic-bezier(0.4,0,0.2,1), color 0.2s ease",
                mb: 0.75,
                "&:hover": {
                    backgroundColor: "var(--nav-bg)",
                    boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)",
                    color: danger ? "error.light" : muted ? "text.secondary" : "text.primary",
                },
            }}
        >
            <DialogIconWrap danger={danger} muted={muted}>{icon}</DialogIconWrap>
            {label}
        </Button>
    );
}

const MessageOptionsDialog = ({ open, onClose, onDelete, onInfo }: MessageOptionsDialogProps) => {
    const dialogPaperSx = {
        borderRadius: "36px",
        backgroundColor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(100,116,139,0.08)",
        overflow: "hidden",
        padding: "6px",
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" BackdropProps={dialogBackdrop} sx={{ "& .MuiDialog-paper": dialogPaperSx }}>
            <Box sx={{ "& button": { borderRadius: "0 !important" }, "& button:first-of-type": { borderRadius: "32px 32px 0 0 !important" }, "& button:last-of-type": { borderRadius: "0 0 32px 32px !important", marginBottom: "0 !important" } }}>
                <DialogButton icon={<DeleteRoundedIcon sx={{ fontSize: "1.1rem" }} />} label="Delete Message" onClick={onDelete} danger />
                <DialogButton icon={<InfoRoundedIcon sx={{ fontSize: "1.1rem" }} />} label="Message Info" onClick={onInfo} />
                <DialogButton icon={<CloseRoundedIcon sx={{ fontSize: "1.1rem" }} />} label="Cancel" onClick={onClose} muted />
            </Box>
        </Dialog>
    );
};

export default MessageOptionsDialog;
