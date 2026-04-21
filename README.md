<div align="center">

<img src="src/static/logo-transparent.png" alt="Ripple Logo" width="120" />

# Ripple

### A feature-rich social media platform with real-time messaging, video calls, and immersive stories

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0.5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MUI](https://img.shields.io/badge/MUI-6.4.1-007FFF?style=for-the-badge&logo=mui&logoColor=white)](https://mui.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8.1-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

[Report Bug](https://github.com/issues) · [Request Feature](https://github.com/issues)

</div>

---

## Table of Contents

- [About the Project](#about-the-project)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the App](#running-the-app)
- [Feature Deep-Dive](#feature-deep-dive)
  - [Authentication](#authentication)
  - [Feed & Posts](#feed--posts)
  - [Stories](#stories)
  - [Real-Time Messaging](#real-time-messaging)
  - [Video Calls (WebRTC)](#video-calls-webrtc)
  - [Notifications](#notifications)
  - [User Profiles & Social Graph](#user-profiles--social-graph)
  - [Search](#search)
  - [Settings & Privacy](#settings--privacy)
  - [Theming](#theming)
- [Application Routes](#application-routes)
- [State Management](#state-management)
- [API Integration](#api-integration)
- [WebSocket Events](#websocket-events)
- [Docker Deployment](#docker-deployment)
- [Contributing](#contributing)

---

## About the Project

**Ripple** is a full-featured social media web application inspired by platforms like Instagram. It combines a rich post-based feed, ephemeral stories, real-time direct messaging, peer-to-peer video calling, and a comprehensive notification system — all wrapped in a polished, responsive UI with light/dark mode support.

Built entirely with modern web technologies, Ripple delivers a smooth, app-like experience in the browser using React 18, TypeScript, Vite, MUI, and Socket.io.

---

## Key Features

| Category | Features |
|---|---|
| **Authentication** | Email/password login, Google OAuth 2.0, OTP-based password reset, email verification |
| **Feed** | Infinite scroll, create/edit/delete posts, image & video uploads, location tagging |
| **Stories** | Ephemeral stories with expiry, video/image support, viewer analytics, progress bars |
| **Interactions** | Likes, comments, nested replies, emoji reactions, saves/bookmarks |
| **Messaging** | Real-time DMs, media sharing, emoji picker, typing indicators, read receipts, message reactions |
| **Video Calls** | WebRTC peer-to-peer video/audio calls, screen sharing, mute controls, TURN relay |
| **Notifications** | Real-time push notifications, in-app notification feed, unread counters |
| **Profiles** | Public/private accounts, follow/unfollow with approval, followers/following lists |
| **Search** | User search by username, hashtag search, search history |
| **Settings** | Profile editing, account privacy, notification preferences, blocked users |
| **Theming** | Full light/dark mode with persistent preference |
| **Responsive** | Fully mobile-responsive with adaptive navigation |

---

## Tech Stack

### Frontend Core

| Technology | Version | Purpose |
|---|---|---|
| [React.js](https://reactjs.org/) | 18.3.1 | UI component framework |
| [TypeScript](https://www.typescriptlang.org/) | 5.6.2 | Type-safe JavaScript |
| [Vite](https://vitejs.dev/) | 6.0.5 | Build tool & dev server |

### UI & Styling

| Technology | Version | Purpose |
|---|---|---|
| [MUI (Material-UI)](https://mui.com/) | 6.4.1 | Component library & theming |
| [Emotion](https://emotion.sh/) | 11.x | CSS-in-JS styling engine |
| [Framer Motion](https://www.framer.com/motion/) | 12.9.4 | Animations & transitions |
| [FontAwesome](https://fontawesome.com/) | 6.x | Icon library |

### Real-Time & Communication

| Technology | Version | Purpose |
|---|---|---|
| [Socket.io Client](https://socket.io/) | 4.8.1 | WebSocket real-time events |
| [WebRTC](https://webrtc.org/) | (native) | Peer-to-peer video/audio |

### State, Routing & Data

| Technology | Version | Purpose |
|---|---|---|
| [Zustand](https://zustand-demo.pmnd.rs/) | 5.0.3 | Lightweight global state |
| [React Router DOM](https://reactrouter.com/) | 7.1.3 | Client-side routing |
| [Axios](https://axios-http.com/) | 1.7.9 | HTTP client with interceptors |

### Media & Graphics

| Technology | Version | Purpose |
|---|---|---|
| [Three.js](https://threejs.org/) | 0.181.0 | 3D graphics |
| [OGL](https://github.com/oframe/ogl) | 1.0.11 | WebGL rendering |
| [react-image-crop](https://github.com/DominicTobias/react-image-crop) | 11.0.7 | Image cropping |
| [react-dropzone](https://react-dropzone.js.org/) | 14.3.5 | Drag-and-drop file uploads |
| [emoji-picker-react](https://github.com/ealush/emoji-picker-react) | 4.12.0 | Emoji selection |

### Auth & Utilities

| Technology | Version | Purpose |
|---|---|---|
| [@react-oauth/google](https://github.com/MomenSherif/react-oauth) | 0.12.1 | Google OAuth 2.0 |
| [jwt-decode](https://github.com/auth0/jwt-decode) | 4.0.0 | JWT token parsing |
| [lodash](https://lodash.com/) | 4.17.21 | Utility functions |
| [uuid](https://github.com/uuidjs/uuid) | 11.0.5 | Unique ID generation |

---

## Project Structure

```
ripple-frontend/
│
├── public/                         # Static public assets
│
├── src/
│   ├── App.tsx                     # Root component with MUI CssVarsProvider theming
│   ├── AppContent.tsx              # Main router + WebRTC call orchestration
│   ├── main.tsx                    # React DOM entry point
│   ├── SettingsPage.tsx            # Settings hub component
│   ├── index.css                   # Global CSS reset & base styles
│   │
│   ├── component/                  # Shared/reusable components
│   │   ├── ImageDialog.tsx         # Lightbox image viewer
│   │   ├── PrivateRoute.tsx        # Auth-gated route wrapper
│   │   ├── PublicRoute.tsx         # Public-only route wrapper (redirects if authed)
│   │   ├── TypingIndicator.tsx     # Animated typing dots indicator
│   │   ├── VideoPlayer.tsx         # HTML5 video player wrapper
│   │   ├── VideoCallModal.tsx      # Full WebRTC video call UI
│   │   │
│   │   ├── navbar/
│   │   │   ├── NavDrawer.tsx       # Sidebar navigation (collapsible, desktop + mobile)
│   │   │   └── MobileTopBar.tsx    # Mobile app bar
│   │   │
│   │   ├── post/
│   │   │   ├── CreatePostModal.tsx         # Post creation dialog (text + media)
│   │   │   ├── Post.tsx                    # Post card (likes, comments, save)
│   │   │   ├── ModalPost.tsx               # Post overlay modal
│   │   │   ├── ProfilePagePost.tsx         # Post grid item for profiles
│   │   │   ├── ScrollableCommentsDrawer.tsx # Slide-up comments panel
│   │   │   └── VideoThumbnail.tsx          # Generates video preview thumbnail
│   │   │
│   │   ├── stories/
│   │   │   ├── StoryDialog.tsx             # Full-screen story viewer
│   │   │   └── UploadStoryDialog.tsx       # Story creation & upload
│   │   │
│   │   ├── settings/
│   │   │   ├── ProfileDetails.tsx          # Edit bio, location, website
│   │   │   ├── General.tsx                 # General preferences
│   │   │   ├── NotificationsSettings.tsx   # Notification toggles
│   │   │   └── AccountPrivacy.tsx          # Public/private account toggle
│   │   │
│   │   ├── plasma/
│   │   │   └── Orb.tsx                     # WebGL animated plasma orb
│   │   ├── LineWaves/
│   │   │   └── LineWaves.tsx               # Canvas wave animation
│   │   └── metallicPaint/
│   │       └── MetallicPaint.tsx           # WebGL metallic liquid effect
│   │
│   ├── pages/                      # Route-level page components
│   │   ├── HomePage.tsx            # Main feed (posts + stories)
│   │   ├── LoginPage.tsx           # Login (email/password + Google OAuth)
│   │   ├── RegisterPage.tsx        # New user registration
│   │   ├── VerifyAccount.tsx       # Email verification flow
│   │   ├── ResetPassword.tsx       # OTP-based password reset
│   │   ├── SearchPage.tsx          # User & hashtag search
│   │   ├── SavedPage.tsx           # Bookmarked posts
│   │   ├── PostDetailPage.tsx      # Single post with all comments
│   │   ├── NotFoundPage.tsx        # 404 error page
│   │   ├── FollowersPage.tsx       # User followers list
│   │   ├── FollowingPage.tsx       # User following list
│   │   │
│   │   ├── profile/
│   │   │   ├── ProfilePage.tsx             # Full user profile
│   │   │   ├── FollowButton.tsx            # Follow / Unfollow / Requested button
│   │   │   └── MoreOptionsDialog.tsx       # Profile action menu
│   │   │
│   │   ├── Messages/
│   │   │   ├── Messages.tsx                # Main messaging layout
│   │   │   ├── MessageInput.tsx            # Input bar (emoji, file, send)
│   │   │   ├── MessagesTopBar.tsx          # Chat header with user info
│   │   │   ├── MessagesDrawer.tsx          # Conversation list sidebar
│   │   │   ├── NewChatUsersList.tsx        # Start new conversation UI
│   │   │   ├── messageContainer/
│   │   │   │   ├── MessagesContainer.tsx   # Message bubbles list
│   │   │   │   ├── MessageDetailsDrawer.tsx # Message action drawer
│   │   │   │   └── MessageOptionsDialog.tsx # Message context menu
│   │   │   └── mobileView/
│   │   │       └── MessagesUserList.tsx    # Mobile conversation list
│   │   │
│   │   └── notifications/
│   │       ├── Notifications.tsx           # Full notification feed
│   │       └── NotificationCard.tsx        # Individual notification item
│   │
│   ├── store/
│   │   └── store.tsx               # Zustand global store
│   │
│   ├── services/
│   │   ├── api.ts                  # All API call functions
│   │   ├── apiEndpoints.ts         # Endpoint URL constants
│   │   ├── config.ts               # Axios instance + JWT interceptor
│   │   ├── socket.ts               # Socket.io client singleton
│   │   └── messagesConfig.ts       # Message-specific Axios config
│   │
│   ├── hooks/
│   │   └── useNotification.tsx     # Custom toast/snackbar notification hook
│   │
│   ├── utils/
│   │   └── utils.ts                # timeAgo formatter, useDebounce hook
│   │
│   └── static/
│       ├── profile_blank.png       # Default avatar placeholder
│       ├── ringtone.mp3            # Incoming call ringtone
│       ├── hangup.mp3              # Call end sound
│       └── logo-transparent.png    # App logo
│
├── Dockerfile                      # Production Docker image
├── index.html                      # Vite HTML entry point
├── vite.config.ts                  # Vite build configuration
├── tsconfig.json                   # TypeScript root config
├── tsconfig.app.json               # App TypeScript config
├── eslint.config.js                # ESLint rules
├── .env                            # Environment variables
└── package.json                    # Dependencies and scripts
```

---

## Getting Started

### Prerequisites

Make sure you have the following installed on your machine:

- **Node.js** — v18.0.0 or higher ([Download](https://nodejs.org/))
- **npm** — v9.0.0 or higher (comes with Node.js)
- A modern browser (Chrome, Firefox, Edge, Safari)

Verify your versions:

```bash
node --version    # should be >= 18.0.0
npm --version     # should be >= 9.0.0
```

---

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/your-username/ripple-frontend.git
cd ripple-frontend
```

**2. Install dependencies**

```bash
npm install
```

This will install all required packages listed in `package.json`, including React, TypeScript, MUI, Socket.io, Framer Motion, and all other dependencies.

---

### Environment Variables

Create a `.env` file in the root of the project:

```bash
cp .env.example .env
```

Then configure the following variables:

```env
# Backend API base URL
VITE_BASE_URL=https://ripple-backend-ejk4.onrender.com

# Google OAuth Client ID (for Google login)
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
```

> **Note:** All environment variables in Vite **must** be prefixed with `VITE_` to be accessible in the browser bundle.

#### Getting a Google OAuth Client ID

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth Client ID**
5. Select **Web application** as the application type
6. Add `http://localhost:5173` to **Authorized JavaScript origins**
7. Copy the generated **Client ID** into your `.env` file

---

### Running the App

**Development mode** (with hot module replacement):

```bash
npm run dev
```

The application will start at **http://localhost:5173**

**Build for production:**

```bash
npm run build
```

Output is generated in the `dist/` directory.

**Preview the production build locally:**

```bash
npm run preview
```

**Run the linter:**

```bash
npm run lint
```

---

## Feature Deep-Dive

### Authentication

Ripple supports two methods of authentication with a full account lifecycle:

**Email / Password Flow**
1. **Register** — Fill in username, email, and password. A verification email is sent.
2. **Verify Account** — Click the link in the email (or enter the token) to activate the account.
3. **Login** — Enter credentials. A JWT token is returned and stored in `localStorage`.
4. **Forgot Password** — Enter email to receive a one-time OTP, verify it, then set a new password.

**Google OAuth Flow**
1. Click **Continue with Google** on the login page.
2. Google consent screen appears via `@react-oauth/google`.
3. The Google ID token is sent to the backend for verification.
4. A JWT is returned and the session begins identically to email login.

**Session Management**
- The JWT is stored in `localStorage` under the user key.
- An Axios request interceptor automatically appends `Authorization: Bearer <token>` to every outgoing API request.
- An `X-CURRENT-USER-ID` header is also injected for backend convenience.
- On app load, the user is restored from `localStorage` into the Zustand store.

---

### Feed & Posts

The home feed displays posts from users you follow in reverse-chronological order with infinite scroll.

**Creating a Post**
- Click the **+** button or the **Create Post** option in the navigation.
- Add text content and optionally attach an image or video (drag-and-drop supported via `react-dropzone`).
- Optionally add a location tag.
- Posts are uploaded via `multipart/form-data` to the backend.

**Post Interactions**
- **Like / Unlike** — Toggle the heart icon. The like count updates instantly.
- **Comments** — Open a scrollable comments drawer. Reply to individual comments to create threads.
- **Like Comments** — Each comment can be individually liked.
- **Save / Bookmark** — Save posts to your personal collection, accessible from the Saved page.
- **Edit Post** — Post authors can edit the text content of their posts.
- **Delete Post** — Post authors can delete their posts with confirmation.

**Post Detail View**
- Navigate to `/posts/:postId` for a dedicated full-page view.
- Shows the post media, full description, author info, like count, and all comments in a scrollable list.

---

### Stories

Stories are ephemeral content that disappear after a set period. Users can post images or videos as stories.

**Uploading a Story**
- Click the **+ Add Story** avatar ring on the home page.
- The upload dialog lets you select an image or video and optionally add a caption.
- Stories are uploaded to the backend and linked to your profile.

**Viewing Stories**
- Story rings appear at the top of the home feed. Unseen stories are highlighted with a gradient ring.
- Clicking a story ring opens the full-screen **StoryDialog** viewer.
- Each story segment has a progress bar that auto-advances (8 seconds per story).
- Controls include: **Previous / Next** navigation, **Play / Pause**, **Volume toggle**, and **Close**.
- Story authors can see a **Viewers list** showing who has watched their story.

---

### Real-Time Messaging

Ripple's messaging system is powered by **Socket.io** for instant delivery.

**Starting a Conversation**
- Navigate to the **Messages** page.
- Click the compose icon to open the **New Chat** panel and search for a user.
- Click a user to start or continue a conversation.

**Features**
- **Instant messaging** — Messages appear in real time without page refresh.
- **Typing indicator** — An animated typing indicator (`...`) appears when the other user is typing.
- **Media sharing** — Send images and videos directly in chat via the attachment button.
- **Emoji picker** — Click the emoji button to open a full emoji picker panel.
- **Message reactions** — Hover/long-press a message to react with an emoji.
- **Message options** — Context menu to **delete**, **edit**, **reply to**, or **save** a message.
- **Read receipts** — Double-check marks indicate message delivery and read status.
- **Unread count** — Badge on the Messages nav icon shows total unread messages.
- **Mute conversations** — Mute specific users to suppress their notifications.

**Responsive Layout**
- On desktop: a split-pane layout with conversation list on the left and chat on the right.
- On mobile: separate views — conversation list and the active chat — with back navigation.

---

### Video Calls (WebRTC)

Ripple implements true peer-to-peer video calling using the **WebRTC** API with Socket.io as the signaling channel.

**Call Flow**
1. **Initiate a call** — Click the video camera icon in a conversation's top bar.
2. **Incoming call popup** — The recipient sees a modal with the caller's name, avatar, and Accept/Decline buttons. The ringtone plays.
3. **Connection setup** — Both sides create an `RTCPeerConnection`. The caller creates an SDP offer; the callee creates an answer.
4. **ICE negotiation** — ICE candidates are exchanged in real-time via Socket.io events until a peer path is found.
5. **STUN/TURN servers** — Google STUN servers + a TURN relay are configured as ICE servers for NAT traversal.
6. **Active call** — Video streams are attached to `<video>` elements. Local video is shown in a small overlay.

**In-Call Controls**
- **Mute / Unmute** microphone
- **Enable / Disable** camera
- **Screen Share** — Share your entire screen or a browser tab
- **End Call** — Hangs up and plays the hangup sound

---

### Notifications

Ripple provides both in-app and browser push notifications.

**Notification Types**
- Someone **liked** your post
- Someone **commented** on your post
- Someone sent you a **follow request**
- Someone **accepted** your follow request

**In-App Notifications**
- The bell icon in the navigation shows a badge with the unread count.
- The `/notifications` page shows a full chronological feed of all notifications.
- Each card shows the actor's avatar, a description of the action, and a time-ago timestamp.

**Browser Push Notifications**
- On first interaction, the app requests browser notification permission.
- When a new notification arrives via Socket.io, a native browser notification is triggered with the sender's name and action.
- This works even when the notifications tab is not focused.

---

### User Profiles & Social Graph

**Profile Page** (`/profile/:userId`)
- Displays: profile picture, username, bio, website link, location, post count, follower count, following count.
- A grid of the user's posts.
- A verification badge for verified accounts.

**Follow System**
- **Follow** a public account — takes effect immediately.
- **Request to Follow** a private account — the account owner must approve the request.
- **Unfollow** at any time.
- **Cancel** a pending follow request.
- **Remove Followers** from your own followers list.
- **Followers / Following** lists are accessible at dedicated routes.

**Editing Your Profile**
- From Settings → Profile Details, update: display name, bio, website URL, and location.
- Upload a new profile picture with the built-in image cropper (`react-image-crop`).

---

### Search

The `/search` page supports two modes:

**User Search**
- Search for users by username in real time using a debounced input (prevents excessive API calls).
- Results show the user's avatar, username, and a follow/following status.
- Click a result to navigate to their profile.

**Hashtag Search**
- Switch to the Hashtags tab and search for any hashtag.
- Returns posts tagged with that hashtag.

**Search History**
- Recent searches are persisted and displayed below the search bar.
- Individual searches can be removed, or the entire history can be cleared.

---

### Settings & Privacy

Navigate to `/settings` to access all account configuration:

| Section | Options |
|---|---|
| **Profile Details** | Edit display name, bio, website, and location |
| **Account Privacy** | Toggle between Public and Private account |
| **Notifications** | Configure which notification types you receive |
| **General** | App-level preferences |
| **Blocked Users** | View and manage users you've blocked |

---

### Theming

Ripple supports both **light** and **dark** modes using MUI's `CssVarsProvider`.

- Toggle the theme from the navigation sidebar.
- The preference is persisted in `localStorage` and restored on the next visit.
- All components adapt seamlessly using MUI's color tokens and CSS variables.

---

## Application Routes

| Route | Component | Auth Required | Description |
|---|---|---|---|
| `/` | `HomePage` | Yes | Main post feed with stories |
| `/login` | `LoginPage` | No (public only) | Login with email or Google |
| `/register` | `RegisterPage` | No (public only) | Create a new account |
| `/verify-account` | `VerifyAccount` | No | Email verification |
| `/reset-password` | `ResetPassword` | No | OTP password reset |
| `/profile/:userId` | `ProfilePage` | No | Any user's profile |
| `/profile/:userId/followers` | `FollowersPage` | No | User's followers list |
| `/profile/:userId/following` | `FollowingPage` | No | User's following list |
| `/posts/:postId` | `PostDetailPage` | Yes | Single post detail view |
| `/messages` | `Messages` | Yes | Messages (no user selected) |
| `/messages/:userId` | `Messages` | Yes | Active chat with a user |
| `/notifications` | `Notifications` | Yes | Notification feed |
| `/search` | `SearchPage` | Yes | User & hashtag search |
| `/settings` | `SettingsPage` | Yes | Account settings hub |
| `*` | `NotFoundPage` | No | 404 fallback |

---

## State Management

Global state is managed with **Zustand** (`src/store/store.tsx`). The store is intentionally minimal — only truly global, cross-component state lives here.

```typescript
interface StoreState {
  user: User | null;                        // Authenticated user object
  unreadNotificationsCount: number | null;  // Notification badge count
  unreadMessagesCount: number | null;       // Messages badge count
  postUploading: boolean;                   // Global post-upload in-progress flag

  setUser: (user: User | null) => void;
  setUnreadNotificationsCount: (count: number | null) => void;
  setUnreadMessagesCount: (count: number | null) => void;
  resetNotificationsCount: () => void;
  setPostUploading: (status: boolean) => void;
}
```

The `user` object is also persisted to `localStorage` so the session survives page refreshes.

---

## API Integration

All API calls are centralized in `src/services/api.ts` and organized by domain. The Axios instance in `src/services/config.ts` applies a request interceptor that automatically appends the JWT Bearer token and the current user's ID to every request.

**Base URL:** `https://ripple-backend-ejk4.onrender.com`

### API Domains

<details>
<summary><strong>Authentication</strong> — 8 endpoints</summary>

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login with email & password |
| POST | `/auth/google-login` | Login with Google OAuth token |
| GET | `/auth/verify-account` | Verify email via token |
| POST | `/auth/generate-otp` | Send OTP for password reset |
| POST | `/auth/verify-otp` | Verify the OTP code |
| POST | `/auth/reset-password` | Set new password after OTP verify |
| POST | `/auth/track-traffic` | Track page visit analytics |

</details>

<details>
<summary><strong>Users</strong> — 3 endpoints</summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/users/:userId` | Get a user's profile |
| POST | `/users/upload-profile-picture` | Upload a new profile picture |
| PUT | `/users/update-details` | Update profile bio, location, etc. |

</details>

<details>
<summary><strong>Follow System</strong> — 7 endpoints</summary>

| Method | Endpoint | Description |
|---|---|---|
| POST | `/follow/:targetId` | Follow or request to follow a user |
| DELETE | `/follow/:targetId` | Unfollow a user |
| DELETE | `/follow/cancel/:targetId` | Cancel a pending follow request |
| PUT | `/follow/respond/:requesterId` | Accept or decline a follow request |
| DELETE | `/follow/remove/:followerId` | Remove a follower from your list |
| GET | `/follow/:userId/followers` | Get a user's followers list |
| GET | `/follow/:userId/following` | Get a user's following list |

</details>

<details>
<summary><strong>Posts</strong> — 11 endpoints</summary>

| Method | Endpoint | Description |
|---|---|---|
| POST | `/posts` | Create a new post |
| GET | `/posts/feed` | Get the home feed posts |
| GET | `/posts/:postId` | Get a single post |
| GET | `/posts/user/:userId` | Get all posts by a user |
| PUT | `/posts/:postId` | Update a post's content |
| DELETE | `/posts/:postId` | Delete a post |
| POST | `/posts/:postId/like` | Like or unlike a post |
| POST | `/posts/:postId/comments` | Add a comment |
| DELETE | `/posts/:postId/comments/:commentId` | Delete a comment |
| POST | `/posts/:postId/comments/:commentId/like` | Like a comment |
| POST | `/posts/:postId/save` | Save or unsave a post |

</details>

<details>
<summary><strong>Messages</strong> — 4 endpoints</summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/messages/users` | Get list of conversations |
| GET | `/messages/:userId` | Get messages with a specific user |
| DELETE | `/messages/:messageId` | Delete a message |
| POST | `/messages/send-media` | Upload media for a message |

</details>

<details>
<summary><strong>Stories</strong> — 2 endpoints</summary>

| Method | Endpoint | Description |
|---|---|---|
| POST | `/stories` | Upload a new story |
| GET | `/stories` | Fetch stories from followed users |

</details>

<details>
<summary><strong>Notifications</strong> — 4 endpoints</summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/notifications` | Fetch all notifications |
| GET | `/notifications/count` | Get unread notification count |
| POST | `/notifications/mute/:userId` | Mute a user's notifications |
| GET | `/notifications/muted` | Get list of muted users |

</details>

<details>
<summary><strong>Search</strong> — 5 endpoints</summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/search/users?query=` | Search for users by username |
| GET | `/search/hashtags?query=` | Search for posts by hashtag |
| GET | `/search/history` | Get personal search history |
| DELETE | `/search/history/:id` | Remove a single search entry |
| DELETE | `/search/history` | Clear entire search history |

</details>

---

## WebSocket Events

Ripple uses Socket.io for all real-time features. The client connects to the same backend base URL.

**Emitted Events (Client → Server)**

| Event | Payload | Description |
|---|---|---|
| `registerUser` | `{ userId }` | Register user as online after connect |
| `sendMessage` | `{ to, message, ... }` | Send a new chat message |
| `typing` | `{ to, isTyping }` | Broadcast typing indicator |
| `callUser` | `{ to, offer, callerInfo }` | Initiate a WebRTC call |
| `answerCall` | `{ to, answer }` | Accept and send SDP answer |
| `iceCandidate` | `{ to, candidate }` | Send ICE candidate |
| `endCall` | `{ to }` | Hang up the call |

**Received Events (Server → Client)**

| Event | Description |
|---|---|
| `onlineUsers` | List of currently online user IDs |
| `receiveMessage` | New incoming chat message |
| `userTyping` | Typing status from another user |
| `unreadCountResponse` | Updated unread notification/message count |
| `notificationAlert` | Trigger a browser push notification |
| `callReceived` | Incoming call with SDP offer |
| `callAnswered` | Remote SDP answer received |
| `iceCandidate` | Incoming ICE candidate |
| `callEnded` | Remote party ended the call |

---

## Docker Deployment

A `Dockerfile` is included for containerized production deployment.

**Build the image:**

```bash
docker build -t ripple-frontend .
```

**Run the container:**

```bash
docker run -p 80:80 \
  -e VITE_BASE_URL=https://your-backend-url.com \
  ripple-frontend
```

The app will be served on `http://localhost`.

---

## Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/your-feature-name`
3. **Commit** your changes: `git commit -m 'Add some feature'`
4. **Push** to the branch: `git push origin feature/your-feature-name`
5. **Open** a Pull Request

Please make sure your code passes the linter (`npm run lint`) before submitting.

---

<div align="center">

Made with care by the Ripple team

</div>
