import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import socket from "../../services/socket";
import CreatePostModal from "../../component/post/CreatePostModal";
import Logo from "../../static/logo-transparent.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComment } from "@fortawesome/free-regular-svg-icons";
import { faComment as faCommentSolid, faSearch } from "@fortawesome/free-solid-svg-icons";

import { faSignIn } from "@fortawesome/free-solid-svg-icons";
import { faUserPlus } from "@fortawesome/free-solid-svg-icons";

import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    Typography,
    IconButton,
    useMediaQuery,
    useTheme,
    BottomNavigation,
    BottomNavigationAction,
    Badge,
    Dialog,
    Button,
    Fade,
} from "@mui/material";
import {
    HomeOutlined as HomeOutlined,
    Home as HomeFilled,
    Menu as MenuIcon,
    Add as AddIcon,
    FavoriteBorder,
    Favorite,
    ChevronLeft,
    BookmarkBorderOutlined,
    Bookmark,
} from "@mui/icons-material";

const DrawerWidth = 240;
const CollapsedDrawerWidth = 72.67;

interface NavDrawerProps {
    unreadMessagesCount: number | null;
    unreadNotificationsCount: number | null;
    setUnreadMessagesCount: (count: number) => void;
}

export default function NavDrawer({ unreadMessagesCount, unreadNotificationsCount, setUnreadMessagesCount }: NavDrawerProps) {
    const theme = useTheme();
    const navigate = useNavigate();
    const hideDrawer = location.pathname === "/login" || location.pathname === "/register";

    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const isMdOrLarger = useMediaQuery((theme) => theme.breakpoints.up("md"));
    const [open, setOpen] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const handleClose = () => setModalOpen(false);
    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null;
    const [openDialog, setOpenDialog] = useState(false);

    const toggleDrawer = () => setOpen(!open);
    const handleOpen = () => setModalOpen(true);

    type NavigationItem =
        | { kind: "header"; title: string; segment?: string }
        | { kind: "item"; segment?: string; title: string; icon: JSX.Element; filledIcon?: JSX.Element };

    const NAVIGATION: NavigationItem[] = currentUser
        ? [
              { kind: "header", title: "Link" },
              {
                  kind: "item",
                  segment: "",
                  title: "Home",
                  icon: <HomeOutlined sx={{ fontSize: "2rem" }} />,
                  filledIcon: <HomeFilled sx={{ fontSize: "2rem", color: "#000000" }} />,
              },
              {
                  kind: "item",
                  segment: "search",
                  title: "Search",
                  icon: <FontAwesomeIcon icon={faSearch} style={{ fontSize: "26.67px", paddingLeft: "1px" }} />,
                  filledIcon: <FontAwesomeIcon icon={faSearch} style={{ fontSize: "26.67px", paddingLeft: "1px", color: "#000000" }} />,
              },
              {
                  kind: "item",
                  segment: "messages",
                  title: "Messages",
                  icon: (
                      <Badge badgeContent={unreadMessagesCount} color="error">
                          <FontAwesomeIcon icon={faComment} style={{ fontSize: "30px", paddingLeft: "1px" }} />
                      </Badge>
                  ),
                  filledIcon: (
                      <Badge badgeContent={unreadMessagesCount} color="error">
                          <FontAwesomeIcon icon={faCommentSolid} style={{ fontSize: "30px", color: "#000000", paddingLeft: "1px" }} />
                      </Badge>
                  ),
              },
              {
                  kind: "item",
                  segment: "notifications",
                  title: "Notifications",
                  icon: (
                      <Badge badgeContent={unreadNotificationsCount} color="error">
                          <FavoriteBorder sx={{ fontSize: "2rem" }} />
                      </Badge>
                  ),
                  filledIcon: (
                      <Badge badgeContent={unreadNotificationsCount} color="error">
                          <Favorite sx={{ fontSize: "2rem", color: "#000000" }} />
                      </Badge>
                  ),
              },
              {
                  kind: "item",
                  segment: "saved",
                  title: "Saved",
                  icon: <BookmarkBorderOutlined sx={{ fontSize: "2rem" }} />,
                  filledIcon: <Bookmark sx={{ fontSize: "2rem", color: "#000000" }} />,
              },
              {
                  kind: "item",
                  segment: `profile/${currentUser.id}`,
                  title: "Profile",
                  icon: (
                      <img
                          src={
                              currentUser?.profile_picture_url ||
                              "https://static.vecteezy.com/system/resources/previews/005/544/718/non_2x/profile-icon-design-free-vector.jpg"
                          }
                          alt="Profile"
                          style={{
                              width: "33px",
                              height: "33px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              outline: "2px solid #ffffff",
                          }}
                      />
                  ),
                  filledIcon: (
                      <img
                          src={
                              currentUser?.profile_picture_url ||
                              "https://static.vecteezy.com/system/resources/previews/005/544/718/non_2x/profile-icon-design-free-vector.jpg"
                          }
                          alt="Profile"
                          style={{
                              width: "33px",
                              height: "33px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              outline: "2px solid #000000",
                          }}
                      />
                  ),
              },
          ]
        : [
              { kind: "header", title: "Link" },
              {
                  kind: "item",
                  segment: "login",
                  title: "Login",
                  icon: <FontAwesomeIcon icon={faSignIn} style={{ fontSize: "26.67px", paddingLeft: "1px" }} />,
              },
              {
                  kind: "item",
                  segment: "register",
                  title: "Register",
                  icon: <FontAwesomeIcon icon={faUserPlus} style={{ fontSize: "20.67px", paddingLeft: "1px", marginLeft: "3px" }} />,
              },
          ];

    useEffect(() => {
        if (isMdOrLarger) {
            setOpen(true);
        } else {
            setOpen(false);
        }
    }, [isMdOrLarger]);

    const handleMenuClick = () => {
        setOpenDialog(true);
    };

    const handleLogout = () => {
        if (currentUser) {
            socket.disconnect();
        }
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("privateKey");

        setOpenDialog(false);
        navigate("/login");
    };

    useEffect(() => {
        socket.on("unreadMessagesCount", (data) => {
            setUnreadMessagesCount(data.unreadCount);
        });

        return () => {
            socket.off("unreadMessagesCount");
        };
    }, []);

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    return (
        <>
            <div>
                {!hideDrawer ? (
                    !isMobile ? (
                        <Drawer
                            sx={{
                                width: open ? DrawerWidth : CollapsedDrawerWidth,
                                minWidth: open ? DrawerWidth : CollapsedDrawerWidth,
                                flexShrink: 0,
                                transition: "width 0.3s ease-in-out, min-width 0.3s ease-in-out",
                                "& .MuiDrawer-paper": {
                                    width: open ? DrawerWidth : CollapsedDrawerWidth,
                                    minWidth: open ? DrawerWidth : CollapsedDrawerWidth,
                                    transition: "width 0.3s ease-in-out, min-width 0.3s ease-in-out, padding 0.3s ease-in-out",
                                    boxSizing: "border-box",
                                    backgroundColor: "black",
                                    overflowX: "hidden",
                                },
                            }}
                            variant="permanent"
                            anchor="left"
                            open={open}
                        >
                            <List sx={{ padding: 1, display: "flex", flexDirection: "column", height: "100%" }}>
                                {NAVIGATION.map((item, index) => {
                                    if (item.kind === "header") {
                                        return (
                                            <ListItem
                                                key={index}
                                                sx={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    padding: open ? 2 : "21px 0",
                                                    height: "90px",
                                                }}
                                            >
                                                {open ? (
                                                    <Fade in={open} timeout={1000}>
                                                        <Typography
                                                            style={{
                                                                visibility: open ? "visible" : "hidden",
                                                                backgroundImage: "linear-gradient(to right, #7a60ff, #ff8800)",
                                                                WebkitBackgroundClip: "text",
                                                                WebkitTextFillColor: "transparent",
                                                            }}
                                                            sx={{
                                                                transition: "opacity 0.3s ease-in-out, visibility 0.9s ease-in-out",
                                                                opacity: open ? 1 : 0,
                                                            }}
                                                            variant="h3"
                                                            className="lily-script-one-regular"
                                                        >
                                                            Ripple
                                                        </Typography>
                                                    </Fade>
                                                ) : (
                                                    <img
                                                        src={Logo}
                                                        alt="Logo"
                                                        style={{
                                                            width: "54.22px",
                                                            transition: "width 0.3s ease-in-out",
                                                            cursor: "pointer",
                                                        }}
                                                        onClick={toggleDrawer}
                                                    />
                                                )}
                                                {open ? (
                                                    <IconButton
                                                        onClick={toggleDrawer}
                                                        sx={{
                                                            color: "white",
                                                            position: "absolute",
                                                            right: open ? 0 : 8,
                                                            top: 24,
                                                            borderRadius: "50%",
                                                            "&:hover": { backgroundColor: "#000000" },
                                                        }}
                                                    >
                                                        <ChevronLeft />
                                                    </IconButton>
                                                ) : null}
                                            </ListItem>
                                        );
                                    }
                                    const isActive =
                                        item.segment === "messages"
                                            ? location.pathname.startsWith("/messages")
                                            : location.pathname === `/${item.segment}`;
                                    return (
                                        <ListItem
                                            key={item.segment}
                                            component={Link}
                                            to={`/${item.segment}`}
                                            onClick={() => {
                                                if (item.segment === "messages") {
                                                    setOpen(false);
                                                }
                                            }}
                                            sx={{
                                                textDecoration: "none",
                                                padding: "12px 12px",
                                                borderRadius: "20px",
                                                backgroundColor: isActive ? "#ffffff" : "transparent",
                                                "&:hover": isActive ? { backgroundColor: "#ffffff" } : { backgroundColor: "#202327" },
                                                maxHeight: "62px",
                                                justifyContent: "flex-start",
                                                alignItems: "center",
                                                margin: "5px 0",
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: open ? 56 : "auto" }}>
                                                {isActive ? item.filledIcon : item.icon}
                                            </ListItemIcon>
                                            <Typography
                                                sx={{
                                                    fontSize: "1rem",
                                                    color: isActive ? "#000000" : "white",
                                                    visibility: open ? "visible" : "hidden",
                                                    transition: "opacity 0.5s ease-in-out, transform 0.4s ease-in-out",
                                                    opacity: open ? 1 : 0,
                                                    transform: open ? "translateX(0)" : "translateX(-20px)",
                                                }}
                                            >
                                                {item.title}
                                            </Typography>
                                        </ListItem>
                                    );
                                })}
                                {currentUser?.id && (
                                    <ListItem
                                        onClick={handleOpen}
                                        sx={{
                                            textDecoration: "none",
                                            padding: "12px 12px",
                                            cursor: "pointer",
                                            borderRadius: "20px",
                                            "&:hover": { backgroundColor: "#202327" },
                                            margin: "5px 0",
                                            justifyContent: "flex-start",
                                            alignItems: "center",
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: open ? 56 : "auto" }}>
                                            <AddIcon sx={{ fontSize: "2rem" }} />
                                        </ListItemIcon>
                                        <Typography
                                            sx={{
                                                fontSize: "1rem",
                                                color: "white",
                                                visibility: open ? "visible" : "hidden",
                                                transition: "opacity 0.5s ease-in-out, transform 0.4s ease-in-out",
                                                opacity: open ? 1 : 0,
                                                transform: open ? "translateX(0)" : "translateX(-20px)",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            Create Post
                                        </Typography>
                                    </ListItem>
                                )}

                                <Box sx={{ flexGrow: 1 }} />
                                {currentUser?.id && (
                                    <ListItem
                                        onClick={handleMenuClick}
                                        sx={{
                                            textDecoration: "none",
                                            padding: "12px 12px",
                                            cursor: "pointer",
                                            borderRadius: "20px",
                                            "&:hover": { backgroundColor: "#202327" },
                                            margin: "5px 0",
                                            justifyContent: "flex-start",
                                            alignItems: "center",
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: open ? 56 : "auto" }}>
                                            <MenuIcon sx={{ fontSize: "2rem" }} />
                                        </ListItemIcon>
                                        <Typography
                                            sx={{
                                                fontSize: "1rem",
                                                color: "white",
                                                visibility: open ? "visible" : "hidden",
                                                transition: "opacity 0.5s ease-in-out, transform 0.4s ease-in-out",
                                                opacity: open ? 1 : 0,
                                                transform: open ? "translateX(0)" : "translateX(-20px)",
                                            }}
                                        >
                                            More
                                        </Typography>
                                    </ListItem>
                                )}
                            </List>
                        </Drawer>
                    ) : (
                        // Mobile Bottom Navigation
                        <BottomNavigation
                            showLabels
                            sx={{
                                position: "fixed",
                                bottom: -1,
                                width: "100%",
                                backgroundColor: "black",
                                zIndex: 1000,
                                height: "60px",
                                borderRadius: "10px 10px 0 0",
                            }}
                        >
                            {NAVIGATION.map((item, index) => {
                                const isActive = location.pathname === `/${item.segment}`;
                                if (item.kind != "header") {
                                    return (
                                        <BottomNavigationAction
                                            key={index}
                                            icon={item.icon}
                                            component={Link}
                                            to={`/${item.segment}`}
                                            sx={{
                                                backgroundColor: isActive ? "#ffffff" : "transparent",
                                                color: isActive ? "black" : "white",
                                                "&.Mui-selected": { color: "yellow" },
                                                minWidth: "auto",
                                                padding: "0 8px",
                                                borderRadius: "10px 10px 0 0",
                                            }}
                                        />
                                    );
                                }
                            })}
                        </BottomNavigation>
                    )
                ) : null}
            </div>
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                fullWidth
                maxWidth="xs"
                sx={{
                    "& .MuiDialog-paper": {
                        borderRadius: "20px",
                        backgroundColor: "rgba(32, 35, 39, 0.9)",
                        color: "white",
                        textAlign: "center",
                    },
                }}
                BackdropProps={{
                    sx: {
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        backdropFilter: "blur(5px)",
                    },
                }}
            >
                <Button
                    fullWidth
                    onClick={() => {
                        navigate("/settings?setting=profiledetails");
                        setOpenDialog(false);
                    }}
                    sx={{
                        padding: "10px",
                        fontSize: isMobile ? "0.85rem" : "0.9rem",
                        backgroundColor: "#202327",
                        textTransform: "none",
                        borderRadius: 0,
                        "&:hover": { backgroundColor: "#2e3238" },
                        borderBottom: "1px solid #505050",
                    }}
                >
                    Settings
                </Button>
                <Button
                    fullWidth
                    onClick={() => {
                        handleLogout();
                        setOpenDialog(false);
                    }}
                    sx={{
                        padding: "10px",
                        fontSize: isMobile ? "0.85rem" : "0.9rem",
                        backgroundColor: "#202327",
                        textTransform: "none",
                        borderRadius: 0,
                        "&:hover": { backgroundColor: "#2e3238" },
                        borderBottom: "1px solid #505050",
                    }}
                >
                    Logout
                </Button>
                <Button
                    fullWidth
                    onClick={handleCloseDialog}
                    sx={{
                        padding: "10px",
                        fontSize: isMobile ? "0.85rem" : "0.9rem",
                        backgroundColor: "#202327",
                        textTransform: "none",
                        borderRadius: 0,
                        "&:hover": { backgroundColor: "#2e3238" },
                    }}
                >
                    Cancel
                </Button>
            </Dialog>
            <CreatePostModal open={modalOpen} handleClose={handleClose} />
        </>
    );
}
