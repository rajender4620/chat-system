import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./dashboard.css";
import ChatPanel from "../chat_panel/Chat_panel";
import { io, Socket } from "socket.io-client";
import { API_URL } from "../../config";

export type User = {
  _id: string;
  name: string;
  email?: string;
  role?: "admin" | "teacher" | "student";   // present after login (backend now returns it)
};

type Chat = {
  _id: string;
  participants: User[];        // populated by backend
  lastMessage?: {
    text: string;
    senderId: string | null;
    createdAt: string | null;
  };
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
};

function Dashboard() {
  const navigate = useNavigate();
  const raw = sessionStorage.getItem("user");
  const me: User | null = raw ? JSON.parse(raw) : null;

  const [chats, setChats] = useState<Chat[]>([]);
  const [users, setUsers] = useState<User[]>([]);              // for the + new chat flow
  const [search, setSearch] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [showNewChatPicker, setShowNewChatPicker] = useState(false);

  // URL state:
  //   ?chat=<chatId>      → existing chat selected
  //   ?newChat=<userId>   → starting a new chat with this user (no chatId yet)
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedChatId = searchParams.get('chat');
  const newChatPartnerId = searchParams.get('newChat');

  // ──────────────────────────────────────────────────────────────
  // Auth + socket lifecycle
  // ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!me) navigate("/login");
  }, [me, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  // Load chats (sidebar source)
  const loadChats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/chats`, {
        headers: {
          "content-type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setChats(json.data);
    } catch (error) {
      console.error("Failed to load chats:", error);
    }
  };


  // Fetch chats + users once on mount.
  // Using an inline async IIFE so setState happens inside an awaited callback —
  // React's effect-linter recognizes that as "deferred" (a microtask), not synchronous.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const [chatsRes, usersRes] = await Promise.all([
          fetch(`${API_URL}/chats`, {
            headers: { "content-type": "application/json", "Authorization": `Bearer ${token}` },
          }),
          fetch(`${API_URL}/users`, {
            headers: { "content-type": "application/json", "Authorization": `Bearer ${token}` },
          }),
        ]);
        if (chatsRes.ok && usersRes.ok) {
          const chatsJson = await chatsRes.json();
          const usersJson = await usersRes.json();
          if (!cancelled) {
            setChats(chatsJson.data);
            setUsers(usersJson.data);
          }
        }
      } catch (err) {
        console.error('Initial load failed:', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Socket connection + ALL listeners attached BEFORE connect fires.
  // Why: events the server sends immediately on connect (like 'online-users')
  // get dropped if no listener is attached yet. So we wire ears first, then connect.
  useEffect(() => {
    const s = io(API_URL, {
      auth: { token: localStorage.getItem('token') }
    });

    // Attach this BEFORE 'connect' — must exist when the server's initial broadcast arrives
    s.on('online-users', (data: string[]) => setOnlineUsers(data));

    s.on('connect', () => {
      console.log('Connected to server, socket id:', s.id);
      s.emit('join');
      setSocket(s);
    });

    s.on('connect_error', (err) => {
      console.error('Socket auth failed:', err.message);
      localStorage.removeItem('token');
      sessionStorage.removeItem('user');
      navigate('/login');
    });

    return () => { s.disconnect(); };
  }, [me?._id, navigate]);

  // When a new message arrives via socket, refresh chats list to update last-message preview
  // (the message itself is handled by ChatPanel — we just refresh sidebar metadata)
  useEffect(() => {
    if (!socket) return;
    const refresh = () => loadChats();
    socket.on('new-message', refresh);
    return () => { socket.off('new-message', refresh); };
  }, [socket]);

  // ──────────────────────────────────────────────────────────────
  // Derived values — useMemo MUST be before any early return
  // ──────────────────────────────────────────────────────────────

  // Partner info for ChatPanel — works for BOTH existing chats AND new chats.
  // useMemo placed BEFORE the early return so it's called on every render (rules of hooks).
  const partner: User | undefined = useMemo(() => {
    if (!me) return undefined;
    const chat = chats.find(c => c._id === selectedChatId);
    if (chat) return chat.participants.find(p => p._id !== me._id);
    if (newChatPartnerId) return users.find(u => u._id === newChatPartnerId);
    return undefined;
  }, [me, chats, users, selectedChatId, newChatPartnerId]);

  if (!me) return null;

  // For each chat, the OTHER participant is "the partner"
  const partnerOf = (chat: Chat): User | undefined =>
    chat.participants.find(p => p._id !== me._id);

  // The currently-open chat object
  const selectedChat = chats.find(c => c._id === selectedChatId) || null;

  // Chats filtered by search (search applies to the partner's name)
  const filteredChats = chats.filter(c => {
    const p = partnerOf(c);
    return p?.name.toLowerCase().includes(search.toLowerCase());
  });

  // Users available for a NEW chat — exclude users I already have a chat with
  const usersInExistingChats = new Set(
    chats.flatMap(c => c.participants.map(p => p._id))
  );
  const usersForNewChat = users.filter(u =>
    u._id !== me._id &&
    !usersInExistingChats.has(u._id) &&
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  // After sending the first message in a new chat, ChatPanel calls this
  const handleChatCreated = async (newChatId: string) => {
    await loadChats();                              // refresh sidebar
    setSearchParams({ chat: newChatId });           // switch URL: newChat → chat
    setShowNewChatPicker(false);
  };

  // ──────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────

  return (
    <div className="dashboard">
      {/* ── 30% LEFT: sidebar ─────────────────────────────── */}
      <aside className="sidebar">

        <div className="sidebar-header">
          <span>{me.name}</span>
          <button type="button" className="logout-btn" onClick={handleLogout} title="Log out">
            Logout
          </button>
        </div>

        <div className="sidebar-search">
          <input
            type="text"
            placeholder={showNewChatPicker ? "Search users…" : "Search chats…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            className="new-chat-btn"
            onClick={() => {
              setShowNewChatPicker(prev => !prev);
              setSearch('');
            }}
            title={showNewChatPicker ? "Cancel" : "Start new chat"}
          >
            {showNewChatPicker ? '×' : '+'}
          </button>
        </div>

        <div className="user-list">
          {!showNewChatPicker && filteredChats.map((chat) => {
            const p = partnerOf(chat);
            if (!p) return null;
            const isOnline = onlineUsers.includes(p._id);
            const isActive = chat._id === selectedChatId;
            return (
              <div
                key={chat._id}
                className={isActive ? 'user-item active' : 'user-item'}
                onClick={() => setSearchParams({ chat: chat._id })}
              >
                <div className="user-avatar">
                  {p.name[0]?.toUpperCase()}
                  {isOnline && <span className="online-dot" />}
                </div>
                <div className="user-meta">
                  <div className="user-name">{p.name}</div>
                  {chat.lastMessage?.text && (
                    <div className="last-message-preview">{chat.lastMessage.text}</div>
                  )}
                </div>
              </div>
            );
          })}

          {showNewChatPicker && usersForNewChat.map((u) => {
            const isOnline = onlineUsers.includes(u._id);
            const isActive = u._id === newChatPartnerId;
            return (
              <div
                key={u._id}
                className={isActive ? 'user-item active' : 'user-item'}
                onClick={() => setSearchParams({ newChat: u._id })}
              >
                <div className="user-avatar">
                  {u.name[0]?.toUpperCase()}
                  {isOnline && <span className="online-dot" />}
                </div>
                <div className="user-meta">
                  <div className="user-name">{u.name}</div>
                  <div className="last-message-preview" style={{ fontStyle: 'italic', color: '#9ca3af' }}>
                    Start a conversation
                  </div>
                </div>
              </div>
            );
          })}

          {!showNewChatPicker && filteredChats.length === 0 && (
            <div className="empty-list">No chats yet. Click + to start one.</div>
          )}
          {showNewChatPicker && usersForNewChat.length === 0 && (
            <div className="empty-list">No new users available.</div>
          )}
        </div>

      </aside>

      {/* ── 70% RIGHT: chat area ──────────────────────────── */}
      <main className="chat-area">
        <ChatPanel
          key={selectedChat?._id || newChatPartnerId || 'empty'}
          chatId={selectedChat?._id || null}
          partnerId={partner?._id || null}
          partnerName={partner?.name || null}
          myId={me._id}
          socket={socket}
          onChatCreated={handleChatCreated}
        />
      </main>
    </div>
  );
}

export default Dashboard;
