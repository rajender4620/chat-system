# React + TypeScript Cheatsheet (for Flutter devs)

Quick reference for the 95% of React patterns you'll write in real apps.
Bookmark this. Re-read before interviews.

---

## 0. Flutter → React Translation Table

| Flutter | React | Same idea |
|---|---|---|
| StatelessWidget | function component | Pure UI |
| StatefulWidget + setState | `useState` hook | Mutable state |
| initState() | `useEffect(fn, [])` | Run once on mount |
| didUpdateWidget() | `useEffect(fn, [dep])` | Run when dep changes |
| dispose() | `useEffect` returns cleanup fn | Run on unmount |
| Constructor args (`final` fields) | **props** | Data from parent |
| `build()` returning Widget tree | **return JSX** | Declarative UI |
| Row / Column | `display: flex` | Layout |
| Future / async / await | Promise / async / await | Identical |
| Navigator.push | `navigate('/path')` | Routing |

**Once you internalize this table, React stops being scary.**

---

## 1. Component Basics

### A component is a function that returns JSX.

```tsx
function Greeting() {
  return <h1>Hello!</h1>
}
```

### JSX rules

```tsx
// ✅ Return ONE root element
return <div><h1>Hi</h1><p>Welcome</p></div>

// ✅ Or use a Fragment (no extra DOM node)
return <><h1>Hi</h1><p>Welcome</p></>

// ❌ Can't return multiple top-level elements
return <h1>Hi</h1><p>Welcome</p>   // syntax error

// ✅ Use {} to embed JS expressions
return <h1>Hello, {user.name}!</h1>

// ✅ className (NOT class — class is reserved in JS)
return <div className="card">...</div>

// ✅ Comments inside JSX need braces
return <div>{/* this is a comment */}</div>
```

### File naming convention
Components are **PascalCase**: `UserCard.tsx`, `LoginForm.tsx`. Not `userCard.tsx` or `login_form.tsx`.

---

## 2. Props (passing data DOWN)

```tsx
type GreetingProps = {
  name: string
  age?: number              // optional with ?
  onLogin: () => void       // callback prop
}

function Greeting({ name, age, onLogin }: GreetingProps) {
  //                ↑ destructure props
  return (
    <div>
      <h1>Hello, {name}!</h1>
      {age && <p>Age: {age}</p>}
      <button onClick={onLogin}>Log in</button>
    </div>
  )
}

// Parent usage:
<Greeting name="Alice" onLogin={() => console.log('clicked')} />
```

**Flutter analogy:** Props = constructor named arguments. `({ name, onLogin }: Props)` is the same as `Greeting({required this.name, required this.onLogin})`.

---

## 3. State — `useState`

```tsx
const [count, setCount] = useState(0)
//      ↑       ↑                 ↑
//   value   setter         initial value

setCount(count + 1)          // simple update
setCount(prev => prev + 1)   // ✅ functional update (use this when based on prev value)
```

### Typed state
```tsx
const [users, setUsers] = useState<User[]>([])              // array of User
const [me, setMe] = useState<User | null>(null)             // nullable
const [draft, setDraft] = useState('')                      // inferred as string
```

### State is async
```tsx
setCount(5)
console.log(count)   // ❌ still old value! Re-renders happen on next tick
```

### Rules
- **Call hooks at the TOP of the component**, never inside `if`, loops, or event handlers.
- **Never mutate state directly:**
  ```tsx
  users.push(newUser)            // ❌ won't re-render
  setUsers([...users, newUser])  // ✅ new array
  ```

---

## 4. Effects — `useEffect`

```tsx
useEffect(() => {
  // runs AFTER render
  console.log('mounted or deps changed')

  return () => {
    // cleanup — runs before next effect / on unmount
    console.log('cleaning up')
  }
}, [dep1, dep2])  // re-run when these change
```

### The 3 most common patterns

```tsx
// ── 1. Run ONCE on mount (like Flutter initState) ──
useEffect(() => {
  fetch('/api/users').then(r => r.json()).then(setUsers)
}, [])   // empty deps → runs once

// ── 2. Run when a value changes (like didUpdateWidget) ──
useEffect(() => {
  fetch(`/api/messages?with=${partnerId}`).then(...)
}, [partnerId])

// ── 3. Subscription + cleanup ──
useEffect(() => {
  const socket = io.connect('...')
  socket.on('msg', handleMsg)

  return () => socket.disconnect()   // cleanup — like dispose()
}, [])
```

### useEffect gotchas

- **Don't lie about deps.** ESLint warns if you use something inside but skip it. Lying causes "stale closures."
- **Don't put `navigate(...)` in render.** Put it in `useEffect`. (Side effects must come after render.)
- **Async functions:** can't pass `async` directly to `useEffect`. Define inside and call it:
  ```tsx
  useEffect(() => {
    const load = async () => {
      const data = await fetch(...)
      setData(data)
    }
    load()
  }, [])
  ```

---

## 5. Conditional Rendering

```tsx
// ── Short-circuit (most common) ──
{user && <h1>Welcome, {user.name}</h1>}      // render only if user truthy

// ── Ternary ──
{isLoggedIn ? <Dashboard /> : <Login />}

// ── Early return ──
if (loading) return <Spinner />
if (error) return <p>Error: {error}</p>
return <Content data={data} />

// ── Multiple conditions ──
if (!me) return <Login />
if (!partner) return <PartnerPicker />
return <ChatWindow />
```

### Gotcha: rendering `0`
```tsx
{users.length && <List />}   // ❌ if length=0, renders "0" not nothing!
{users.length > 0 && <List />}  // ✅ explicit boolean
```

---

## 6. Lists — `.map()` and `key`

```tsx
{users.map(u => (
  <UserCard key={u._id} user={u} />
))}
```

### The `key` rule
- **Every item in a list MUST have a unique `key`** so React can track which is which.
- Use a real ID (`_id`, `uuid`) — **never array index** (causes bugs when reordering).
- Keys must be unique among siblings, not globally.

### Filter + map chain
```tsx
{users
  .filter(u => u._id !== me._id)
  .filter(u => u.name.toLowerCase().includes(search.toLowerCase()))
  .map(u => <UserCard key={u._id} user={u} />)
}
```

**Flutter analogy:** `users.map((u) => UserCard(user: u)).toList()` inside a Column's children.

---

## 7. Event Handlers

```tsx
<button onClick={handleClick}>Click</button>      // ✅ pass function reference
<button onClick={handleClick()}>Click</button>    // ❌ calls NOW on every render!

<button onClick={() => doThing(arg)}>...</button> // ✅ wrap in arrow when args needed
```

### Common event types (TypeScript)
```tsx
const onSubmit = (e: React.FormEvent<HTMLFormElement>) => { ... }
const onClick = (e: React.MouseEvent<HTMLButtonElement>) => { ... }
const onChange = (e: React.ChangeEvent<HTMLInputElement>) => { ... }
const onKeyDown = (e: React.KeyboardEvent) => { ... }
```

**Tip:** define the handler inline first and hover over `e` — VS Code tells you the exact type.

### `preventDefault()`
Stops default browser behavior (form reload, link nav):
```tsx
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()   // stop page reload
  // your code here
}
```

---

## 8. Forms — Controlled Inputs

The most important React form pattern.

```tsx
const [name, setName] = useState('')

<input
  value={name}                                  // input mirrors state
  onChange={(e) => setName(e.target.value)}     // every keystroke updates state
/>
```

**React controls the input's value via state.** This means:
- `setName('')` instantly clears the field
- You can validate as user types
- The single source of truth is state

### Form skeleton
```tsx
function LoginForm() {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await loginApi({ name, password })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Login</button>
    </form>
  )
}
```

**Flutter analogy:** `value` + `onChange` = `controller.text` + `onChanged`. Same pattern.

---

## 9. Data Fetching (the production pattern)

```tsx
const fetchUsers = async () => {
  try {
    const res = await fetch('http://localhost:3000/users')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)   // fetch doesn't throw on 4xx/5xx!
    const json = await res.json()
    setUsers(json.data)
  } catch (err) {
    console.error('Failed to load users:', err)
    setError('Failed to load')
  }
}

useEffect(() => { fetchUsers() }, [])
```

### Critical gotcha (Flutter dev trap)
`fetch()` does **NOT** throw on HTTP error status codes (4xx, 5xx). Only on network failure. You must check `res.ok` manually.

| Status | Dart http | JS fetch |
|---|---|---|
| 200 OK | succeeds | `res.ok = true` |
| 404, 500 | **throws** | `res.ok = false` (doesn't throw) |
| Network down | throws | throws |

**Recruiter signal:** mention this gotcha in interviews. *"I always check `res.ok` because `fetch` only rejects on network failure, unlike axios or Dart's http."*

### In production, wrap fetch in a helper
```tsx
async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`http://localhost:3000${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// Usage — clean and reusable
const users = await api<User[]>('/users')
```

---

## 10. Custom Hooks (the "Flutter mixin" of React)

A custom hook = a function starting with `use` that calls other hooks. **Extract reusable logic.**

```tsx
// useCurrentUser.ts
export function useCurrentUser() {
  const raw = sessionStorage.getItem('user')
  return raw ? JSON.parse(raw) as User : null
}

// Usage in any component:
function Dashboard() {
  const me = useCurrentUser()
  if (!me) return <Navigate to="/" />
  ...
}
```

### Real-world examples
- `useAuth()` — current user + login/logout
- `useDebounce(value, delay)` — debounce a value for search
- `useFetch(url)` — load data with loading/error states
- `useLocalStorage(key, initial)` — state synced to localStorage

**Recruiter signal:** custom hooks show you understand React's composition model. Mention them.

---

## 11. Context API (avoiding prop drilling)

### What problem does it solve?

Imagine the logged-in user data needs to be read by `App → Dashboard → Sidebar → UserAvatar`. Without Context, you have to pass `user` as a prop through every layer — even components that don't use it themselves:

```tsx
// ❌ PROP DRILLING — every component needs to forward `user`
function App()        { return <Dashboard user={user} /> }
function Dashboard({user}) { return <Sidebar user={user} /> }
function Sidebar({user})   { return <UserAvatar user={user} /> }
function UserAvatar({user}){ return <img src={user.avatar} /> }
//                          ↑ ONLY THIS COMPONENT actually uses it
```

This is **prop drilling**: passing a prop through 3-4 middle components just so a deep child can read it. It's noisy, brittle (rename `user` → rename in 4 places), and obscures which components actually use the data.

### The fix: Context lets a deep child read from a parent directly.

```tsx
// ✅ WITH CONTEXT — middle components don't touch `user`
function App()        { return <AuthProvider><Dashboard /></AuthProvider> }
function Dashboard()  { return <Sidebar /> }
function Sidebar()    { return <UserAvatar /> }
function UserAvatar() {
  const user = useAuth()    // reads directly from context
  return <img src={user.avatar} />
}
```

### Flutter analogy (you've done this)

Context is **React's `InheritedWidget`**. The Flutter Provider package is the closest match:

| Flutter | React |
|---|---|
| `Provider<User>` at top of tree | `<UserContext.Provider value={...}>` |
| `Provider.of<User>(context)` | `useContext(UserContext)` |
| `context.watch<User>()` | `useContext(UserContext)` |
| Consumer widget | `<UserContext.Consumer>` (rarely used; prefer `useContext`) |

**Identical mental model.** "Inject" data at the top, "read" it anywhere below.

---

### The 3-step pattern (every Context setup looks like this)

```tsx
// ─── Step 1: Create the context ────────────────────────
import { createContext, useContext, useState, type ReactNode } from 'react'

// The TYPE of what the context holds.
// Include BOTH the data AND the function to update it.
type AuthContextType = {
  user: User | null
  setUser: (u: User | null) => void
}

// Initial value — usually a sensible default or a "throw if used outside provider" guard
const AuthContext = createContext<AuthContextType | null>(null)


// ─── Step 2: Build the Provider component ──────────────
// This wraps part of your tree and provides the value.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  // The value can include data + setters
  const value = { user, setUser }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}


// ─── Step 3: Custom hook to consume (production pattern) ──
// This is the PROFESSIONAL way — always wrap useContext in a custom hook.
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
```

### Now you can use it anywhere

```tsx
// main.tsx — wrap the tree
<AuthProvider>
  <App />
</AuthProvider>

// Login component — write to context
function Login() {
  const { setUser } = useAuth()
  const handleSubmit = async () => {
    const u = await loginApi(...)
    setUser(u)        // shared across the whole app
  }
}

// Anywhere deep in the tree — read from context
function ProfileBadge() {
  const { user } = useAuth()
  return <span>Hi, {user?.name}</span>
}
```

---

### Why the custom hook (`useAuth`) is the pro pattern

Every junior tutorial shows `useContext(AuthContext)` directly. **Real codebases always wrap it.** Reasons:

1. **Better error message** — if a component is rendered outside `<AuthProvider>`, you get `"useAuth must be used inside <AuthProvider>"` instead of a cryptic null-access crash.
2. **No need to import the context everywhere** — just `useAuth`, not `useContext + AuthContext` everywhere.
3. **Easier to refactor** — if you swap from Context to Zustand later, only `useAuth` changes; all the call sites stay the same.

**Interview answer:**
> *"I always wrap `useContext` in a custom hook like `useAuth`. It gives a clear error if used outside the provider, hides the implementation detail, and makes it trivial to swap to a different state library later without touching call sites."*

---

### The performance gotcha (interview question)

**Every consumer re-renders when the context value changes.** If you put a giant object in context, every state change re-renders the whole tree.

```tsx
// ❌ Re-renders consumers on EVERY parent render — even if nothing changed
<AuthContext.Provider value={{ user, setUser }}>

// ✅ Stable value with useMemo — only re-renders consumers when user/setUser change
const value = useMemo(() => ({ user, setUser }), [user])
<AuthContext.Provider value={value}>
```

Even better: **split contexts.** If you have user data AND theme AND notifications, put them in separate contexts so consumers only re-render for what they care about.

```tsx
<AuthProvider>
  <ThemeProvider>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </ThemeProvider>
</AuthProvider>
```

**Interview answer:**
> *"I split contexts by domain — auth, theme, notifications — and wrap provider values in `useMemo`. Without that, every consumer re-renders whenever any field changes. For state that updates frequently, I'd skip Context entirely and use Zustand, which selectively re-renders only components that subscribed to changed slices."*

---

### When to use Context vs. when to NOT use it

| Use Context | Use something else |
|---|---|
| Truly app-wide data (current user, theme, locale) | Server data (use TanStack Query) |
| Rarely-changing data | Frequently-changing data (use Zustand / Redux) |
| Avoiding 3+ levels of prop drilling | Sibling-only state (lift state up to common parent) |
| You have ≤ 2-3 contexts | You'd end up nesting 6+ providers |

### Decision tree

```
Is the data only needed in one place?
  → Local useState

Is it needed in 2-3 close siblings/children?
  → Lift state up to common parent + pass props

Is it needed across the whole app, changes rarely?
  → Context (this section)

Is it needed across the whole app, changes a lot?
  → Zustand / Redux / Jotai
```

---

### Common mistakes to avoid

1. **Putting everything in one giant Context.** Split by concern.
2. **Not wrapping in a custom hook.** Always `useAuth()`, never bare `useContext(AuthContext)` in components.
3. **Forgetting `useMemo` on the value.** Causes unnecessary re-renders.
4. **Using Context for server data.** Use TanStack Query / SWR instead — they handle caching, loading, error, refetch automatically.
5. **Defaulting to `null` and not handling it.** Either throw in the custom hook (recommended) or always check for null.

---

### Real example from a chat app

```tsx
// auth/AuthContext.tsx
type AuthContextType = {
  user: User | null
  login: (name: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = sessionStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  })

  const login = async (name: string) => {
    const res = await fetch('/users', { method: 'POST', body: JSON.stringify({ name }) })
    const json = await res.json()
    sessionStorage.setItem('user', JSON.stringify(json.data))
    setUser(json.data)
  }

  const logout = () => {
    sessionStorage.removeItem('user')
    setUser(null)
  }

  const value = useMemo(() => ({ user, login, logout }), [user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
```

Now any component can do:
```tsx
const { user, login, logout } = useAuth()
```

**No prop drilling, no sessionStorage logic scattered everywhere, one source of truth.**

---

## 12. useRef

Two main uses:

### A. Reference a DOM element
```tsx
const inputRef = useRef<HTMLInputElement>(null)

useEffect(() => {
  inputRef.current?.focus()   // focus on mount
}, [])

return <input ref={inputRef} />
```

### B. Hold a mutable value that DOESN'T trigger re-render
```tsx
const renderCount = useRef(0)
renderCount.current++   // changes don't re-render the component
```

**Difference from useState:** state changes trigger re-render; ref changes don't.

---

## 13. useMemo / useCallback (performance)

### `useMemo` — cache the result of a calculation
```tsx
const filtered = useMemo(
  () => users.filter(u => u.name.includes(search)),
  [users, search]   // only recompute when these change
)
```

### `useCallback` — cache a function reference
```tsx
const handleClick = useCallback(() => {
  doSomething(id)
}, [id])
```

**When to use:** only when measuring shows it's needed (heavy computation, passing callbacks to memoized children). **Don't sprinkle these everywhere — they have overhead.**

**Interview trap:** *"Why useMemo/useCallback?"* — Strong answer: *"To stabilize references across renders so memoized children don't re-render, and to avoid expensive computations. I only add them when profiling shows benefit, not preemptively."*

---

## 14. React Router (v6+)

### Setup
```tsx
// main.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

const router = createBrowserRouter([
  { path: '/', element: <Login /> },
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/chat/:userId', element: <Chat /> },     // dynamic param
])

createRoot(...).render(<RouterProvider router={router} />)
```

### Navigate programmatically
```tsx
const navigate = useNavigate()
navigate('/dashboard')           // push
navigate('/dashboard', { replace: true })   // replace (no back history)
navigate(-1)                     // back
```

### Read URL params
```tsx
// Route /chat/:userId
const { userId } = useParams()
```

### Declarative link
```tsx
<Link to="/dashboard">Go to dashboard</Link>
```

**Flutter analogy:**
- `createBrowserRouter` ≈ MaterialApp's routes
- `useNavigate` ≈ Navigator.of(context).pushNamed
- `useParams` ≈ route arguments

---

## 15. Common Gotchas (interview traps)

### 1. Calling event handler immediately
```tsx
<button onClick={handleClick()}>   // ❌ called on render
<button onClick={handleClick}>     // ✅
```

### 2. Stale closure in useEffect
```tsx
useEffect(() => {
  setInterval(() => setCount(count + 1), 1000)
}, [])   // ❌ count is always 0 here (closure captures initial value)

useEffect(() => {
  setInterval(() => setCount(c => c + 1), 1000)   // ✅ functional update
}, [])
```

### 3. Forgetting `key` in lists
React warns in console. Real bug: with duplicate/missing keys, React mis-tracks items and breaks input focus, animations.

### 4. Mutating state
```tsx
users.push(newUser)            // ❌ no re-render
setUsers([...users, newUser])  // ✅ new array
```

### 5. Async functions in useEffect
```tsx
useEffect(async () => { ... }, [])   // ❌ useEffect must return undefined or cleanup
useEffect(() => { (async () => { ... })() }, [])   // ✅ IIFE wrapper
```

### 6. Not handling the loading/error states
```tsx
// ❌ crashes if user is null
return <h1>{user.name}</h1>

// ✅
if (!user) return <Spinner />
return <h1>{user.name}</h1>
```

### 7. `useState` initial value runs every render (if it's a function call)
```tsx
const [data, setData] = useState(expensiveComputation())   // ❌ runs every render

const [data, setData] = useState(() => expensiveComputation())   // ✅ lazy init
```

---

## 16. Rules of Hooks (memorize for interviews)

1. **Only call at the top level.** No hooks inside `if`, loops, or nested functions.
2. **Only call from React functions** (components or other hooks).
3. **Always call in the same order.** This is how React tracks which state is which.

The ESLint plugin `eslint-plugin-react-hooks` enforces these.

---

## 17. Strong-Signal Interview Answers (memorize 2-3)

> *"I use controlled inputs everywhere because React being the source of truth makes validation, clearing, and conditional logic trivial."*

> *"I always check `res.ok` after `fetch` because — unlike axios or Dart's http — fetch only rejects on network failure, not on 4xx/5xx status codes."*

> *"For shared logic I extract custom hooks like `useCurrentUser` or `useFetch`. It's React's composition pattern — equivalent to mixins in Dart."*

> *"I avoid prop drilling more than 2-3 levels deep by lifting state to Context. For larger app-wide state I'd reach for Zustand — it's lighter than Redux and Hooks-first."*

> *"I only add `useMemo`/`useCallback` when profiling shows a real cost — premature memoization adds overhead without benefit."*

> *"useEffect dependencies are not negotiable. Skipping a value to silence ESLint causes stale closures; the right fix is usually a functional state update or `useRef` for values you want to read but not react to."*

---

## 18. Folder Structure (production-ish)

```
src/
├── components/
│   ├── login/
│   │   ├── Login.tsx
│   │   └── login.css
│   └── dashboard/
│       ├── Dashboard.tsx
│       └── dashboard.css
├── hooks/
│   ├── useAuth.ts
│   └── useDebounce.ts
├── api/
│   ├── client.ts          ← fetch wrapper
│   └── users.ts           ← typed API functions
├── types/
│   └── api.ts             ← shared interfaces
├── router/
│   └── routes.tsx
├── main.tsx
└── index.css
```

**Recruiter signal:** folder-per-feature with separate `hooks/`, `api/`, `types/` is a sign you've worked on real codebases — not a tutorial app.

---

## 19. The Modern Stack (recruiter keywords)

When recruiters ask *"what's your React stack?"*:

| Layer | Pick |
|---|---|
| Bundler | **Vite** (modern; Webpack is legacy) |
| Routing | **React Router v6+** or **TanStack Router** |
| Data fetching | **TanStack Query** (was React Query) |
| State (global) | **Zustand** for small, **Redux Toolkit** for large |
| Forms | **React Hook Form** + **Zod** for validation |
| Styling | **Tailwind CSS** or **CSS Modules** |
| Testing | **Vitest** + **React Testing Library** |
| Type safety | **TypeScript** + **Zod** for runtime |

**Drop 3-4 of these in interviews to sound current.**

---

**Bookmark this file. Re-read before frontend interviews.**
