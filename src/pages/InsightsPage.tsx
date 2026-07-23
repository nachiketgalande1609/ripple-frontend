import { useEffect, useState, useMemo } from "react";
import { Box, Typography, CircularProgress, useTheme, Select, MenuItem } from "@mui/material";
import {
    AreaChart, Area, BarChart, Bar, RadialBarChart, RadialBar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded";
import GridOnRoundedIcon from "@mui/icons-material/GridOnRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { getInsights } from "../services/api";

interface PostMonth { month: string; posts: number; likes: number; }
interface TopPost { id: number; content: string; file_url: string; first_media_url: string; like_count: number; comment_count: number; save_count: number; }

interface InsightData {
    total_posts: number;
    total_likes_received: number;
    total_comments_received: number;
    total_saves: number;
    followers_count: number;
    following_count: number;
    avg_likes_per_post: string;
    top_posts: TopPost[];
    story_count: number;
    story_total_views: number;
    posts_by_month: PostMonth[];
    profile_views: number;
    profile_views_by_month: { month: string; year: number; month_num: number; views: number }[];
}

const InsightsPage = () => {
    const [data, setData] = useState<InsightData | null>(null);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<"like_count" | "comment_count" | "save_count">("like_count");
    const [activityPeriod, setActivityPeriod] = useState<number>(6);
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    useEffect(() => {
        getInsights().then(setData).catch(console.error).finally(() => setLoading(false));
    }, []);

    const sortedPosts = useMemo(() =>
        data ? [...data.top_posts].sort((a, b) => b[sortBy] - a[sortBy]).slice(0, 5) : [],
        [data, sortBy]
    );

    const filteredActivity = useMemo(() => {
        if (!data) return [];
        const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const now = new Date();
        const result: { month: string; posts: number; likes: number; views: number }[] = [];
        for (let i = activityPeriod - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const label = MONTHS[d.getMonth()];
            const yr = d.getFullYear();
            const found = data.posts_by_month.find((r) => r.month === label && Number(r.year ?? yr) === yr);
            const vFound = data.profile_views_by_month.find((r) => r.month === label && Number(r.year ?? yr) === yr);
            result.push({ month: label, posts: found ? Number(found.posts) : 0, likes: found ? Number(found.likes) : 0, views: vFound ? Number(vFound.views) : 0 });
        }
        return result;
    }, [data, activityPeriod]);

    if (loading) return (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
            <CircularProgress size={28} />
        </Box>
    );
    if (!data) return (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
            <Typography color="text.disabled">Failed to load insights.</Typography>
        </Box>
    );

    const axisColor = theme.palette.text.disabled;
    const gridColor = theme.palette.divider;
    const tooltipBg = theme.palette.background.paper;
    const tooltipBorder = theme.palette.divider;

    const engagementRate = data.followers_count > 0
        ? parseFloat((((data.total_likes_received + data.total_comments_received) / data.followers_count) * 100).toFixed(1))
        : 0;

    const engagementBreakdown = [
        { name: "Likes", value: data.total_likes_received, color: "#ef4444" },
        { name: "Comments", value: data.total_comments_received, color: "#3b82f6" },
        { name: "Saves", value: data.total_saves, color: "#f97316" },
        { name: "Story Views", value: data.story_total_views, color: "#14b8a6" },
    ];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null;
        return (
            <Box sx={{ bgcolor: tooltipBg, border: "1px solid", borderColor: tooltipBorder, borderRadius: "12px", px: 1.75, py: 1.25 }}>
                {label && <Typography sx={{ fontSize: "0.72rem", color: "text.disabled", mb: 0.5 }}>{label}</Typography>}
                {payload.map((p: any) => (
                    <Typography key={p.name} sx={{ fontSize: "0.8rem", fontWeight: 600, color: p.color || "text.primary" }}>
                        {p.name}: {p.value}
                    </Typography>
                ))}
            </Box>
        );
    };

    return (
        <Box sx={{ maxWidth: 720, mx: "auto", px: { xs: 2, sm: 3 }, py: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 3.5 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "1.3rem", letterSpacing: "-0.4px", color: "text.primary" }}>
                    Account Insights
                </Typography>
                <Typography sx={{ fontSize: "0.78rem", color: "text.disabled", mt: 0.3 }}>
                    Performance overview for your account
                </Typography>
            </Box>

            {/* Top KPI row */}
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1.5, mb: 3 }}>
                {[
                    { label: "Followers", value: data.followers_count, icon: <GroupRoundedIcon sx={{ fontSize: 16 }} />, color: "#6366f1" },
                    { label: "Profile Views", value: data.profile_views, icon: <VisibilityRoundedIcon sx={{ fontSize: 16 }} />, color: "#10b981" },
                    { label: "Total Posts", value: data.total_posts, icon: <GridOnRoundedIcon sx={{ fontSize: 16 }} />, color: "#0ea5e9" },
                    { label: "Likes", value: data.total_likes_received, icon: <FavoriteRoundedIcon sx={{ fontSize: 16 }} />, color: "#ef4444" },
                    { label: "Saves", value: data.total_saves, icon: <BookmarkRoundedIcon sx={{ fontSize: 16 }} />, color: "#f97316" },
                ].map((kpi) => (
                    <Box key={kpi.label} sx={{ borderRadius: "18px", border: "1px solid", borderColor: "divider", bgcolor: "background.paper", p: 2 }}>
                        <Box sx={{ color: kpi.color, mb: 1 }}>{kpi.icon}</Box>
                        <Typography sx={{ fontWeight: 700, fontSize: "1.45rem", color: "text.primary", lineHeight: 1 }}>{kpi.value}</Typography>
                        <Typography sx={{ fontSize: "0.67rem", color: "text.disabled", mt: 0.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{kpi.label}</Typography>
                    </Box>
                ))}
            </Box>

            {/* Activity chart – posts & likes per month */}
            {data.posts_by_month.length > 0 && (
                <Box sx={{ borderRadius: "20px", border: "1px solid", borderColor: "divider", bgcolor: "background.paper", p: 2.5, mb: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.4 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: "text.primary" }}>Activity</Typography>
                        <Select
                            value={activityPeriod}
                            onChange={(e) => setActivityPeriod(Number(e.target.value))}
                            size="small"
                            variant="outlined"
                            sx={{
                                fontSize: "0.72rem",
                                height: 28,
                                borderRadius: "10px",
                                bgcolor: "var(--nav-bg)",
                                boxShadow: "inset 2px 2px 6px var(--nav-neo-shadow1), inset -2px -2px 6px var(--nav-neo-shadow2)",
                                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                                "& .MuiSelect-select": { py: "4px", px: "10px" },
                            }}
                        >
                            <MenuItem value={3} sx={{ fontSize: "0.78rem" }}>Last 3 months</MenuItem>
                            <MenuItem value={6} sx={{ fontSize: "0.78rem" }}>Last 6 months</MenuItem>
                            <MenuItem value={12} sx={{ fontSize: "0.78rem" }}>Last 12 months</MenuItem>
                        </Select>
                    </Box>
                    <Typography sx={{ fontSize: "0.72rem", color: "text.disabled", mb: 2 }}>Posts published & likes received</Typography>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={filteredActivity} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gLikes" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gPosts" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="views" name="Profile Views" stroke="#10b981" strokeWidth={2} fill="url(#gViews)" dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                            <Area type="monotone" dataKey="likes" name="Likes" stroke="#6366f1" strokeWidth={2} fill="url(#gLikes)" dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                            <Area type="monotone" dataKey="posts" name="Posts" stroke="#0ea5e9" strokeWidth={2} fill="url(#gPosts)" dot={{ r: 3, fill: "#0ea5e9", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                    {/* Legend */}
                    <Box sx={{ display: "flex", gap: 2.5, mt: 1.5, justifyContent: "center" }}>
                        {[{ color: "#10b981", label: "Profile views" }, { color: "#6366f1", label: "Likes received" }, { color: "#0ea5e9", label: "Posts published" }].map((l) => (
                            <Box key={l.label} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: l.color }} />
                                <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>{l.label}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

            {/* Profile Views chart */}
            <Box sx={{ borderRadius: "20px", border: "1px solid", borderColor: "divider", bgcolor: "background.paper", p: 2.5, mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.4 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: "text.primary" }}>Profile Views</Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#10b981" }} />
                        <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", fontWeight: 600 }}>
                            {data.profile_views.toLocaleString()} total
                        </Typography>
                    </Box>
                </Box>
                <Typography sx={{ fontSize: "0.72rem", color: "text.disabled", mb: 2 }}>
                    Unique visits to your profile each month
                </Typography>
                <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={filteredActivity} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={20}>
                        <defs>
                            <linearGradient id="gViewsBar" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#10b981" stopOpacity={0.4} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", radius: 8 }} />
                        <Bar dataKey="views" name="Profile Views" fill="url(#gViewsBar)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </Box>

            {/* Bottom 2-col row */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5, mb: 3 }}>
                {/* Engagement breakdown bar chart */}
                <Box sx={{ borderRadius: "20px", border: "1px solid", borderColor: "divider", bgcolor: "background.paper", p: 2.5 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: "text.primary", mb: 0.4 }}>Engagement</Typography>
                    <Typography sx={{ fontSize: "0.72rem", color: "text.disabled", mb: 2 }}>Total interactions received</Typography>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={engagementBreakdown} margin={{ top: 0, right: 4, left: -24, bottom: 0 }} barSize={28}>
                            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", radius: 8 }} />
                            <Bar dataKey="value" name="Count" radius={[6, 6, 0, 0]}>
                                {engagementBreakdown.map((e) => <Cell key={e.name} fill={e.color} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Box>

                {/* Engagement rate + story stats */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {/* Engagement rate radial */}
                    <Box sx={{ borderRadius: "20px", border: "1px solid", borderColor: "divider", bgcolor: "background.paper", p: 2.5, flex: 1 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: "text.primary", mb: 0.3 }}>Engagement rate</Typography>
                        <Typography sx={{ fontSize: "0.72rem", color: "text.disabled", mb: 1 }}>(Likes + Comments) ÷ Followers</Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Box sx={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadialBarChart
                                        innerRadius="70%"
                                        outerRadius="100%"
                                        data={[{ value: Math.min(engagementRate, 100), fill: "#6366f1" }]}
                                        startAngle={90}
                                        endAngle={90 - (Math.min(engagementRate, 100) / 100) * 360}
                                    >
                                        <RadialBar dataKey="value" background={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }} />
                                    </RadialBarChart>
                                </ResponsiveContainer>
                                <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "text.primary" }}>{engagementRate}%</Typography>
                                </Box>
                            </Box>
                            <Box>
                                <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", lineHeight: 1.6 }}>
                                    Avg <strong style={{ color: theme.palette.text.primary }}>{data.avg_likes_per_post}</strong> likes per post
                                </Typography>
                                <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                                    <strong style={{ color: theme.palette.text.primary }}>{data.total_comments_received}</strong> comments received
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* Stories */}
                    <Box sx={{ borderRadius: "20px", border: "1px solid", borderColor: "divider", bgcolor: "background.paper", p: 2.5 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: "text.primary", mb: 1.5 }}>Stories</Typography>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Box>
                                <Typography sx={{ fontWeight: 700, fontSize: "1.5rem", color: "text.primary", lineHeight: 1 }}>{data.story_count}</Typography>
                                <Typography sx={{ fontSize: "0.67rem", color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.05em", mt: 0.4 }}>Posted</Typography>
                            </Box>
                            <Box sx={{ textAlign: "right" }}>
                                <Typography sx={{ fontWeight: 700, fontSize: "1.5rem", color: "#14b8a6", lineHeight: 1 }}>{data.story_total_views}</Typography>
                                <Typography sx={{ fontSize: "0.67rem", color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.05em", mt: 0.4 }}>Views</Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Top posts */}
            {data.top_posts.length > 0 && (
                <Box sx={{ borderRadius: "20px", border: "1px solid", borderColor: "divider", bgcolor: "background.paper", p: 2.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.4 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: "text.primary" }}>Top posts</Typography>
                        <Select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            size="small"
                            variant="outlined"
                            sx={{
                                fontSize: "0.72rem",
                                height: 28,
                                borderRadius: "10px",
                                bgcolor: "var(--nav-bg)",
                                boxShadow: "inset 2px 2px 6px var(--nav-neo-shadow1), inset -2px -2px 6px var(--nav-neo-shadow2)",
                                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                                "& .MuiSelect-select": { py: "4px", px: "10px" },
                            }}
                        >
                            <MenuItem value="like_count" sx={{ fontSize: "0.78rem" }}>By likes</MenuItem>
                            <MenuItem value="comment_count" sx={{ fontSize: "0.78rem" }}>By comments</MenuItem>
                            <MenuItem value="save_count" sx={{ fontSize: "0.78rem" }}>By saves</MenuItem>
                        </Select>
                    </Box>
                    <Typography sx={{ fontSize: "0.72rem", color: "text.disabled", mb: 2 }}>
                        {sortBy === "like_count" ? "Ranked by likes" : sortBy === "comment_count" ? "Ranked by comments" : "Ranked by saves"}
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {sortedPosts.map((post, idx) => {
                            const thumb = post.first_media_url || post.file_url;
                            const max = sortedPosts[0]?.[sortBy] || 1;
                            return (
                                <Box key={post.id} component="a" href={`/posts/${post.id}`} sx={{ display: "flex", alignItems: "center", gap: 2, textDecoration: "none", p: 1, borderRadius: "12px", "&:hover": { bgcolor: "action.hover" }, transition: "background 0.2s" }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", color: "text.disabled", width: 20, flexShrink: 0 }}>#{idx + 1}</Typography>
                                    {thumb
                                        ? <Box component="img" src={thumb} sx={{ width: 40, height: 40, borderRadius: "10px", objectFit: "cover", flexShrink: 0 }} />
                                        : <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: "action.hover", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><GridOnRoundedIcon sx={{ fontSize: 18, color: "text.disabled" }} /></Box>
                                    }
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography noWrap sx={{ fontSize: "0.8rem", color: "text.primary", fontWeight: 500 }}>{post.content || "No caption"}</Typography>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                                            <Box sx={{ flex: 1, height: 4, borderRadius: 99, bgcolor: "action.hover", overflow: "hidden" }}>
                                                <Box sx={{ height: "100%", width: `${(post[sortBy] / max) * 100}%`, bgcolor: "#6366f1", borderRadius: 99, transition: "width 0.4s ease" }} />
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: "flex", gap: 1.5, flexShrink: 0 }}>
                                        <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", display: "flex", alignItems: "center", gap: 0.4 }}>
                                            <FavoriteRoundedIcon sx={{ fontSize: 12, color: "#ef4444" }} />{post.like_count}
                                        </Typography>
                                        <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", display: "flex", alignItems: "center", gap: 0.4 }}>
                                            <ChatBubbleRoundedIcon sx={{ fontSize: 12, color: "#3b82f6" }} />{post.comment_count}
                                        </Typography>
                                        <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", display: "flex", alignItems: "center", gap: 0.4 }}>
                                            <BookmarkRoundedIcon sx={{ fontSize: 12, color: "#f97316" }} />{post.save_count}
                                        </Typography>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default InsightsPage;
