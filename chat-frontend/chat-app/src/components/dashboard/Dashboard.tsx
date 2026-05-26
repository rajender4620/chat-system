import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./dashboard.css";
import ChatPanel from "../chat_panel/Chat_panel";

type User = {
  _id: string;
  name: string;
};

function Dashboard() {
  const navigate = useNavigate();
  const raw = sessionStorage.getItem("user");
  const me: User | null = raw ? JSON.parse(raw) : null;

  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');

  // URL is the source of truth for which chat is open.
  // /dashboard           → no chat selected
  // /dashboard?chat=abc  → chat with user abc is selected
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedUserId = searchParams.get('chat');

  useEffect(() => {
    if (!me) navigate("/");
  }, [me, navigate]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetch("http://localhost:3000/users", {
          method: "GET",
          headers: {
            "content-type": "application/json",
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setUsers(json.data);
      } catch (error) {
        console.error("Failed to load users:", error);
      }
    };
    loadUsers();
  }, []);


  if (!me) return null;

  const others = users.filter((e) => e._id !== me._id).filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));



  return (
    <div className="dashboard">
      {/* ── 30% LEFT: sidebar with search + user list ─────── */}
      <aside className="sidebar">
        {/* Header — shows logged-in user's name */}
        <div className="sidebar-header">{me.name}</div>

        {/* Search bar — YOU will wire this to state + filter the list */}
        <div className="sidebar-search">
          <input
            type="text"
            placeholder="Search users…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
          />
        </div>

        {/* User list — YOU will replace this with .map() over real users */}
        <div className="user-list">
          {others.map((u) => (
            <div
              key={u._id}
              className={u._id === selectedUserId ? 'user-item active' : 'user-item'}
              onClick={() => setSearchParams({ chat: u._id })}
            >
              <div className="user-avatar">{u.name[0].toUpperCase()}</div>
              <div className="user-name">{u.name}</div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── 70% RIGHT: chat area ─────────────────────────── */}
      <main className="chat-area">
        <ChatPanel partnerId={selectedUserId} myId={me._id} ></ChatPanel>
      </main>
    </div>
  );
}

export default Dashboard;
