import { useState } from "react";
import { Box, Typography, Avatar, Button, Tooltip, IconButton, Dialog } from "@mui/material";
import { PollOutlined, MoreHoriz, DeleteOutlineRounded, CloseRounded } from "@mui/icons-material";
import { formatDateInUserTz } from "../../utils/utils";
import { votePoll, deletePoll } from "../../services/api";
import BlankProfileImage from "../../static/profile_blank.png";
import { useNavigate } from "react-router-dom";

interface PollOption {
    id: number;
    option_text: string;
    vote_count: number;
}

interface Poll {
    id: number;
    question: string;
    username: string;
    profile_picture: string;
    created_at: string;
    user_id: number;
    options: PollOption[];
    user_voted_option: number | null;
    total_votes: number;
}

interface PollCardProps {
    poll: Poll;
    onDeleted?: (pollId: number) => void;
    borderRadius?: string;
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
}

export default function PollCard({ poll, onDeleted, borderRadius = "14px" }: PollCardProps) {
    const navigate = useNavigate();
    const [options, setOptions] = useState<PollOption[]>(poll.options);
    const [votedOption, setVotedOption] = useState<number | null>(poll.user_voted_option);
    const [totalVotes, setTotalVotes] = useState<number>(poll.total_votes);
    const [voting, setVoting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null;
    const isOwner = currentUser?.id && Number(currentUser.id) === Number(poll.user_id);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deletePoll(poll.id);
            onDeleted?.(poll.id);
        } catch {
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    const hasVoted = votedOption !== null;

    const handleVote = async (optionId: number) => {
        if (hasVoted || voting) return;
        setVoting(true);
        try {
            await votePoll(poll.id, optionId);
            setOptions((prev) =>
                prev.map((o) => (o.id === optionId ? { ...o, vote_count: o.vote_count + 1 } : o))
            );
            setVotedOption(optionId);
            setTotalVotes((prev) => prev + 1);
        } catch (err) {
            console.error("Vote failed:", err);
        } finally {
            setVoting(false);
        }
    };

    return (
        <>
        <Box
            sx={{
                width: "100%",
                backgroundColor: "background.paper",
                borderRadius,
                overflow: "hidden",
                border: "1px solid",
                borderColor: "divider",
            }}
        >
            {/* ── Header ── */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 1.75, py: 1.25 }}>
                <Box
                    sx={{ display: "flex", alignItems: "center", gap: 1.125, cursor: "pointer" }}
                    onClick={() => navigate(`/profile/${poll.user_id}`)}
                >
                    <Avatar
                        src={poll.profile_picture || BlankProfileImage}
                        sx={{ width: 34, height: 34, border: "1px solid", borderColor: "divider" }}
                    />
                    <Box>
                        <Typography
                            sx={{
                                fontFamily: "'Inter', -apple-system, sans-serif",
                                fontWeight: 500,
                                fontSize: "0.85rem",
                                color: "text.primary",
                                lineHeight: 1.25,
                            }}
                        >
                            {poll.username}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: "1px" }}>
                            <PollOutlined sx={{ fontSize: "0.72rem", color: "#6366f1" }} />
                            <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.68rem", color: "text.disabled" }}>
                                created a poll
                            </Typography>
                        </Box>
                    </Box>
                </Box>
                {isOwner && (
                    <Tooltip title="More options">
                        <IconButton
                            onClick={() => setConfirmDelete(true)}
                            size="small"
                            sx={{
                                width: 30,
                                height: 30,
                                borderRadius: "8px",
                                color: "text.disabled",
                                "&:hover": { backgroundColor: "action.hover", color: "text.primary" },
                            }}
                        >
                            <MoreHoriz sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>

            {/* ── Content ── */}
            <Box sx={{ px: 1.75, pb: 1.75, pt: 0.25 }}>
                {/* Question */}
                <Typography
                    sx={{
                        fontWeight: 600,
                        fontSize: "0.88rem",
                        color: "text.primary",
                        mb: 1.5,
                        lineHeight: 1.4,
                    }}
                >
                    {poll.question}
                </Typography>

                {/* Options */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {options.map((opt) => {
                        const pct = totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0;
                        const isVoted = votedOption === opt.id;

                        if (!hasVoted) {
                            return (
                                <Button
                                    key={opt.id}
                                    fullWidth
                                    onClick={() => handleVote(opt.id)}
                                    disabled={voting}
                                    sx={{
                                        textTransform: "none",
                                        borderRadius: "10px",
                                        border: "none",
                                        backgroundColor: "action.hover",
                                        boxShadow: "none",
                                        color: "text.primary",
                                        fontWeight: 500,
                                        fontSize: "0.84rem",
                                        py: 0.875,
                                        justifyContent: "flex-start",
                                        px: 1.75,
                                        transition: "all 0.2s ease",
                                        "&:hover": {
                                            backgroundColor: "rgba(99,102,241,0.08)",
                                            color: "#6366f1",
                                        },
                                        "&:disabled": { opacity: 0.6 },
                                    }}
                                >
                                    {opt.option_text}
                                </Button>
                            );
                        }

                        return (
                            <Box
                                key={opt.id}
                                sx={{
                                    borderRadius: "10px",
                                    border: isVoted ? "1px solid #6366f1" : "1px solid transparent",
                                    backgroundColor: "action.hover",
                                    overflow: "hidden",
                                    position: "relative",
                                    px: 1.75,
                                    py: 0.875,
                                    minHeight: 38,
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                <Box
                                    sx={{
                                        position: "absolute",
                                        left: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: `${pct}%`,
                                        backgroundColor: isVoted ? "rgba(99,102,241,0.15)" : "rgba(100,116,139,0.08)",
                                        borderRadius: "10px",
                                        transition: "width 0.5s ease",
                                    }}
                                />
                                <Box sx={{ position: "relative", display: "flex", alignItems: "center", width: "100%", gap: 1 }}>
                                    <Typography
                                        sx={{
                                            flex: 1,
                                            fontWeight: isVoted ? 600 : 500,
                                            fontSize: "0.84rem",
                                            color: isVoted ? "#6366f1" : "text.primary",
                                        }}
                                    >
                                        {opt.option_text}
                                    </Typography>
                                    <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", fontWeight: 600, flexShrink: 0 }}>
                                        {pct}%
                                    </Typography>
                                    <Typography sx={{ fontSize: "0.7rem", color: "text.disabled", flexShrink: 0 }}>
                                        ({opt.vote_count})
                                    </Typography>
                                </Box>
                            </Box>
                        );
                    })}
                </Box>

                {/* Footer */}
                <Tooltip title={formatDateInUserTz(poll.created_at)} placement="bottom-start">
                    <Typography sx={{ fontSize: "0.72rem", color: "text.disabled", mt: 1.25, cursor: "default" }}>
                        {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
                        {hasVoted && (
                            <Box component="span" sx={{ ml: 1, color: "#6366f1", fontWeight: 600 }}>
                                · You voted
                            </Box>
                        )}
                        {" · "}
                        {timeAgo(poll.created_at)}
                    </Typography>
                </Tooltip>
            </Box>
        </Box>

        {/* Delete confirm dialog */}
        <Dialog
            open={confirmDelete}
            onClose={() => !deleting && setConfirmDelete(false)}
            maxWidth="xs"
            fullWidth
            sx={{ "& .MuiDialog-paper": { borderRadius: "36px", backgroundColor: "background.paper", border: "1px solid", borderColor: "divider", boxShadow: "0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(100,116,139,0.08)", overflow: "hidden", padding: "6px" } }}
            BackdropProps={{ sx: { backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" } }}
        >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.75, mb: 0.5 }}>
                <Box sx={{ width: 38, height: 38, borderRadius: "50%", backgroundColor: "rgba(211,47,47,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <DeleteOutlineRounded sx={{ fontSize: "1.2rem", color: "error.main" }} />
                </Box>
                <Box>
                    <Box sx={{ fontWeight: 600, fontSize: "0.9rem", color: "text.primary", lineHeight: 1.3 }}>
                        Delete this poll?
                    </Box>
                    <Box sx={{ fontSize: "0.75rem", color: "text.disabled" }}>
                        This action cannot be undone.
                    </Box>
                </Box>
            </Box>
            <Box sx={{ "& button": { borderRadius: "0 !important" }, "& button:first-of-type": { borderRadius: "32px 32px 0 0 !important" }, "& button:last-of-type": { borderRadius: "0 0 32px 32px !important", marginBottom: "0 !important" } }}>
                <Button fullWidth onClick={handleDelete} disabled={deleting}
                    sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.4, borderRadius: "18px", textTransform: "none", justifyContent: "flex-start", fontWeight: 500, fontSize: "0.875rem", color: "error.main", border: "none", backgroundColor: "var(--nav-bg)", boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)", transition: "box-shadow 0.35s cubic-bezier(0.4,0,0.2,1)", mb: 0.75, "&:hover": { backgroundColor: "var(--nav-bg)", boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)", color: "error.light" } }}>
                    <Box sx={{ width: 34, height: 34, borderRadius: "10px", backgroundColor: "rgba(211,47,47,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "error.main", flexShrink: 0 }}>
                        <DeleteOutlineRounded sx={{ fontSize: "1.1rem" }} />
                    </Box>
                    {deleting ? "Deleting…" : "Delete poll"}
                </Button>
                <Button fullWidth onClick={() => setConfirmDelete(false)} disabled={deleting}
                    sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.4, borderRadius: "18px", textTransform: "none", justifyContent: "flex-start", fontWeight: 500, fontSize: "0.875rem", color: "text.disabled", border: "none", backgroundColor: "var(--nav-bg)", boxShadow: "inset 2px 2px 8px var(--nav-neo-shadow1), inset -2px -2px 8px var(--nav-neo-shadow2)", transition: "box-shadow 0.35s cubic-bezier(0.4,0,0.2,1)", mb: 0.75, "&:hover": { backgroundColor: "var(--nav-bg)", boxShadow: "inset 3px 3px 10px var(--nav-neo-shadow1), inset -3px -3px 10px var(--nav-neo-shadow2)", color: "text.secondary" } }}>
                    <Box sx={{ width: 34, height: 34, borderRadius: "10px", backgroundColor: "action.hover", display: "flex", alignItems: "center", justifyContent: "center", color: "text.disabled", flexShrink: 0 }}>
                        <CloseRounded sx={{ fontSize: "1.1rem" }} />
                    </Box>
                    Cancel
                </Button>
            </Box>
        </Dialog>
        </>
    );
}
