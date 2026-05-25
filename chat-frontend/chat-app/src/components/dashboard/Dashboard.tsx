import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "./dashboard.css"


type User = {
  _id: string
  name: string
}


function Dashboard() {
  const navigate = useNavigate()
  const raw = sessionStorage.getItem('user')
  const me: User | null = raw ? JSON.parse(raw) : null

  useEffect(() => {
    if (!me) navigate('/')
  }, [me, navigate])

  if (!me) return null


  return (
    <div className="dashboard">

      {/* ── 30% LEFT: sidebar with search + user list ─────── */}
      <aside className="sidebar">

        {/* Header — shows logged-in user's name */}
        <div className="sidebar-header">
          {me.name}
        </div>

        {/* Search bar — YOU will wire this to state + filter the list */}
        <div className="sidebar-search">
          <input
            type="text"
            placeholder="Search users…"
          /* TODO (you): value={search} onChange={...} */
          />
        </div>

        {/* User list — YOU will replace this with .map() over real users */}
        <div className="user-list">

          {/* PLACEHOLDER ITEM 1 — duplicate this row when you map real data */}
          <div className="user-item">
            <div className="user-avatar">A</div>
            <div className="user-name">Alice (placeholder)</div>
          </div>

          {/* PLACEHOLDER ITEM 2 */}
          <div className="user-item active">
            <div className="user-avatar">B</div>
            <div className="user-name">Bob (placeholder, active state)</div>
          </div>

          {/* PLACEHOLDER ITEM 3 */}
          <div className="user-item">
            <div className="user-avatar">C</div>
            <div className="user-name">Charlie (placeholder)</div>
          </div>

        </div>

      </aside>


      {/* ── 70% RIGHT: chat area (empty for now) ──────────── */}
      <main className="chat-area">
        Select a user to start chatting
      </main>

    </div>
  )
}

export default Dashboard
