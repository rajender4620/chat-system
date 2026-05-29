import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./dashboard.css";
import ChatPanel from "../chat_panel/Chat_panel";
import { io, Socket } from "socket.io-client";
import { API_URL } from "../../config";

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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setonlineUsers] = useState<string[]>([]);

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
        const res = await fetch(`${API_URL}/users`, {
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


  useEffect(() => {
    const s = io(API_URL)
    s.on('connect', () => {
      console.log('Connected to server, socket id:', s.id)
      s.emit('join', me?._id)
      setSocket(s);
    })
    return () => { s.disconnect() }
  }, [me?._id])


  useEffect(() => {
    if (!socket) return;

    const handleOnlineUsers = (data: string[]) => {
      console.log(data)
      setonlineUsers(data)
    }
    socket.on('online-users', handleOnlineUsers)

    return () => {
      socket.off('online-users', handleOnlineUsers)
    }
  }, [socket])
  if (!me) return null;

  const others = users.filter((e) => e._id !== me._id).filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

  const partner = users.find(u => u._id === selectedUserId)




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
          {others.map((u) => {
            const isOnline = onlineUsers.includes(u._id);
            return (

              < div
                key={u._id}
                className={u._id === selectedUserId ? 'user-item active' : 'user-item'}
                onClick={() => setSearchParams({ chat: u._id })}

              >
                <div className="user-avatar">
                  {u.name[0].toUpperCase()}
                  {isOnline && <span className="online-dot" />}   {/* ← the dot */}
                </div>
                <div className="user-name">{u.name}</div>
              </div>
            )
          }

          )}
        </div>
      </aside >

      {/* ── 70% RIGHT: chat area ─────────────────────────── */}
      < main className="chat-area" >
        <ChatPanel partnerId={selectedUserId} myId={me._id} socket={socket} partnerName={partner?.name} ></ChatPanel>
      </main >
    </div >
  );
}

export default Dashboard;
