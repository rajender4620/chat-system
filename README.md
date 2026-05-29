# Chat System

A real-time 1-to-1 messaging application. Users sign in with a name, browse a directory of all registered users, and start a private conversation with any of them — messages are delivered instantly via WebSockets, with online status and typing indicators.

> **Live demo:** _(add your deployed link here once deployed)_

---

## Features

- 🔐 **Login** — sign in with a name (creates an account on first use)
- 👥 **User directory** — see all registered users, with live search filtering
- 💬 **Real-time messaging** — messages delivered instantly via Socket.IO (no refresh)
- ⚡ **Optimistic UI** — your own messages appear instantly before the server confirms
- 🟢 **Online status** — green dot shows who's currently connected
- ✍️ **Typing indicators** — "User is typing…" in real time
- 🕒 **Timestamps & auto-scroll** — messages timestamped, view auto-scrolls to newest
- 🔗 **URL-driven chat state** — open conversation is stored in the URL (`/dashboard?chat=<id>`), so refresh and browser back/forward work naturally

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router |
| Real-time | Socket.IO (client + server) |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose ODM) |
| Hosting | _(Vercel — frontend, Render — backend, MongoDB Atlas — database)_ |

---

## Architecture

```
┌──────────────┐        HTTP (REST)         ┌──────────────┐
│              │  ───────────────────────►  │              │
│  React App   │   POST /send-message       │   Express    │
│  (browser)   │   GET  /get-messages       │   Server     │
│              │   GET  /users              │              │
│              │  ◄───────────────────────  │              │
│              │                            │              │
│              │   WebSocket (Socket.IO)    │              │
│              │  ◄═══════════════════════► │   Socket.IO  │
│              │   join / new-message       │   (rooms)    │
│              │   typing / online-users    │              │
└──────────────┘                            └──────┬───────┘
                                                   │
                                                   ▼
                                            ┌──────────────┐
                                            │   MongoDB    │
                                            │ users +      │
                                            │ messages     │
                                            └──────────────┘
```

**How a message is delivered in real time:**
1. Sender's React app shows the message immediately (optimistic UI) and `POST`s it
2. Express saves it to MongoDB
3. Server emits a `new-message` event to the **receiver's Socket.IO room** (named after their user ID)
4. Receiver's browser is subscribed to that room → message appears instantly

---

## Local Development

### Prerequisites
- Node.js 18+
- A MongoDB connection string (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Backend
```bash
cd chat-backend
npm install
# create a .env file with your Mongo URI (see below)
npm run dev
```
Runs on `http://localhost:3000`.

### 2. Frontend
```bash
cd chat-frontend/chat-app
npm install
npm run dev
```
Runs on `http://localhost:5173`.

### Environment variables

**`chat-backend/.env`**
```
MONGODB_URI=your-mongodb-connection-string
```

**`chat-frontend/chat-app/.env`** _(after deployment prep — see below)_
```
VITE_API_URL=http://localhost:3000
```

---

## Testing two users

Open two **different browsers** (e.g. Chrome + Edge) so each has its own session. Log in as a different user in each, then chat between them to see real-time delivery, online dots, and typing indicators.

---

## Roadmap

- [ ] **JWT authentication** — replace name-based login with signup/login, bcrypt password hashing, and protected routes
- [ ] **Schema refactor** — add a `conversations` collection, denormalize sender name onto messages
- [ ] **Message pagination** — load recent messages, lazy-load history on scroll
- [ ] **Read receipts** — delivered / seen indicators
- [ ] **Group chats**
- [ ] **Image / file uploads**

---

## What I learned building this

- Real-time architecture with Socket.IO (rooms, event relay, connection lifecycle)
- The optimistic UI pattern with rollback on failure
- React fundamentals: hooks, controlled inputs, derived state, URL as state
- Why API endpoints must return consistent shapes (the populate-consistency lesson)
- MongoDB data modeling trade-offs (referencing + populate vs denormalization)
