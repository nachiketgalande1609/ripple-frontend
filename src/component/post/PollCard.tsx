import { useState } from "react";
import { Box, Typography, Avatar, Button } from "@mui/material";
import { PollOutlined } from "@mui/icons-material";
import { votePoll } from "../../services/api";
import BlankProfileImage from "../../static/profile_blank.png";

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
    options: PollOption[];
    user_voted_option: number | null;
    total_votes: number;
}

interface PollCardProps {
    poll: Poll;
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

export default function PollCard({ poll }: PollCardProps) {
    const [options, setOptions] = useState<PollOption[]>(poll.options);
    const [votedOption, setVotedOption] = useState<number | null>(poll.user_voted_option);
    const [totalVotes, setTotalVotes] = useState<number>(poll.total_votes);
    const [voting, setVoting] = useState(false);

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
        <Box
            sx={{
                borderRadius: "24px",
                backgroundColor: "var(--nav-bg)",
                boxShadow: "4px 4px 14px var(--nav-neo-shadow1), -4px -4px 14px var(--nav-neo-shadow2)",
                border: "1px solid",
                borderColor: "divider",
                p: 2.5,
                mb: 2,
            }}
        >
            {/* Author row */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Avatar
                    src={poll.profile_picture || BlankProfileImage}
                    sx={{ width: 38, height: 38, border: "2px solid", borderColor: "divider" }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: "text.primary", lineHeight: 1.2 }}>
                            {poll.username}
                        </Typography>
                        <Typography sx={{ fontSize: "0.8rem", color: "text.disabled", lineHeight: 1.2 }}>
                            created a poll
                        </Typography>
                    </Box>
                    <Typography sx={{ fontSize: "0.72rem", color: "text.disabled", mt: 0.2 }}>
                        {timeAgo(poll.created_at)}
                    </Typography>
                </Box>
                <PollOutlined sx={{ color: "#6366f1", fontSize: "1.25rem", flexShrink: 0 }} />
            </Box>

            {/* Question */}
            <Typography
                sx={{
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: "text.primary",
                    mb: 2,
                    lineHeight: 1.4,
                }}
            >
                {poll.question}
            </Typography>

            {/* Options */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                {options.map((opt) => {
                    const pct = totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0;
                    const isVoted = votedOption === opt.id;

                    if (!hasVoted) {
                        // Pre-vote: plain clickable button
                        return (
                            <Button
                                key={opt.id}
                                fullWidth
                                onClick={() => handleVote(opt.id)}
                                disabled={voting}
                                sx={{
                                    textTransform: "none",
                                    borderRadius: "12px",
                                    border: "1px solid",
                                    borderColor: "divider",
                                    backgroundColor: "var(--nav-bg)",
                                    boxShadow:
                                        "inset 2px 2px 6px var(--nav-neo-shadow1), inset -2px -2px 6px var(--nav-neo-shadow2)",
                                    color: "text.primary",
                                    fontWeight: 500,
                                    fontSize: "0.88rem",
                                    py: 1,
                                    justifyContent: "flex-start",
                                    px: 2,
                                    transition: "all 0.2s ease",
                                    "&:hover": {
                                        borderColor: "#6366f1",
                                        color: "#6366f1",
                                        backgroundColor: "rgba(99,102,241,0.05)",
                                    },
                                    "&:disabled": { opacity: 0.6 },
                                }}
                            >
                                {opt.option_text}
                            </Button>
                        );
                    }

                    // Post-vote: bar with percentage
                    return (
                        <Box
                            key={opt.id}
                            sx={{
                                borderRadius: "12px",
                                border: "1px solid",
                                borderColor: isVoted ? "#6366f1" : "divider",
                                backgroundColor: "var(--nav-bg)",
                                overflow: "hidden",
                                position: "relative",
                                px: 2,
                                py: 1,
                                minHeight: 40,
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            {/* Fill bar */}
                            <Box
                                sx={{
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: `${pct}%`,
                                    backgroundColor: isVoted ? "rgba(99,102,241,0.18)" : "rgba(100,116,139,0.1)",
                                    borderRadius: "12px",
                                    transition: "width 0.5s ease",
                                }}
                            />
                            {/* Label row */}
                            <Box sx={{ position: "relative", display: "flex", alignItems: "center", width: "100%", gap: 1 }}>
                                <Typography
                                    sx={{
                                        flex: 1,
                                        fontWeight: isVoted ? 700 : 500,
                                        fontSize: "0.88rem",
                                        color: isVoted ? "#6366f1" : "text.primary",
                                    }}
                                >
                                    {opt.option_text}
                                </Typography>
                                <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", fontWeight: 600, flexShrink: 0 }}>
                                    {pct}%
                                </Typography>
                                <Typography sx={{ fontSize: "0.72rem", color: "text.disabled", flexShrink: 0 }}>
                                    ({opt.vote_count})
                                </Typography>
                            </Box>
                        </Box>
                    );
                })}
            </Box>

            {/* Footer */}
            <Typography sx={{ fontSize: "0.72rem", color: "text.disabled", mt: 1.5 }}>
                {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
                {hasVoted && (
                    <Box component="span" sx={{ ml: 1, color: "#6366f1", fontWeight: 600 }}>
                        · You voted
                    </Box>
                )}
            </Typography>
        </Box>
    );
}
