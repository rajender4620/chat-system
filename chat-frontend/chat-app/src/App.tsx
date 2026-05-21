import { useState, useEffect } from 'react'
import './App.css'

type User = {
  _id: string
  name: string
}

type Message = {
  _id: string
  message: string
  senderId: { _id: string; name: string }
  receiverId: { _id: string; name: string }
  createdAt: string
}

function App() {
  const [users, setUsers] = useState<User[]>([])
  const [me, setMe] = useState<User | null>(null)
  const [partner, setPartner] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')  // the text currently typed in the input box

  // Load all users once
  useEffect(() => {
    fetch('http://localhost:3000/users')
      .then(res => res.json())
      .then(json => setUsers(json.data))
  }, [])

  // A small helper to (re)load the chat history.
  // Defined separately so we can call it both from useEffect AND after sending.
  const loadMessages = () => {
    if (!me || !partner) return
    const url = `http://localhost:3000/get-messages?senderId=${me._id}&receiverId=${partner._id}`
    fetch(url)
      .then(res => res.json())
      .then(json => setMessages(json.data))
  }

  // Load chat whenever (me, partner) changes
  useEffect(() => {
    loadMessages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, partner])

  // Called when the user submits the form (clicks Send or presses Enter)
  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()                  // stop the browser from reloading the page
    if (!draft.trim() || !me || !partner) return  // ignore empty messages

    await fetch('http://localhost:3000/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: me._id,
        receiverId: partner._id,
        message: draft,
      }),
    })

    setDraft('')        // clear the input box
    loadMessages()      // refresh the chat to show the new message
  }

  // ─── SCREEN 1: pick "me" ──────────────────────────────────────────
  if (!me) {
    return (
      <div className="app">
        <h1>Who are you?</h1>
        <ul className="user-list">
          {users.map(user => (
            <li key={user._id}>
              <button className="user-btn" onClick={() => setMe(user)}>
                {user.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  // ─── SCREEN 2: pick a partner ─────────────────────────────────────
  if (!partner) {
    const others = users.filter(u => u._id !== me._id)
    return (
      <div className="app">
        <div className="top-bar">
          <span>Logged in as <b>{me.name}</b></span>
          <button className="link-btn" onClick={() => setMe(null)}>Switch user</button>
        </div>
        <h1>Chat with…</h1>
        <ul className="user-list">
          {others.map(user => (
            <li key={user._id}>
              <button className="user-btn" onClick={() => setPartner(user)}>
                {user.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  // ─── SCREEN 3: the chat window ────────────────────────────────────
  return (
    <div className="app">
      <div className="top-bar">
        <button className="link-btn" onClick={() => setPartner(null)}>← Back</button>
        <span>Chatting with <b>{partner.name}</b></span>
      </div>

      <div className="chat-box">
        {messages.length === 0 && <p className="empty">No messages yet.</p>}
        {messages.map(msg => {
          const isMine = msg.senderId._id === me._id
          return (
            <div key={msg._id} className={isMine ? 'bubble mine' : 'bubble theirs'}>
              {msg.message}
            </div>
          )
        })}
      </div>

      {/* The input form at the bottom. onSubmit fires when the user clicks Send or presses Enter. */}
      <form className="send-form" onSubmit={handleSend}>
        <input
          className="send-input"
          type="text"
          placeholder="Type a message…"
          value={draft}                                  // the input always shows whatever is in state
          onChange={(e) => setDraft(e.target.value)}     // every keystroke updates state
        />
        <button className="send-btn" type="submit">Send</button>
      </form>
    </div>
  )
}

export default App
