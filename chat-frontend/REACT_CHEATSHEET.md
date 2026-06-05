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

### State is async — the variable does NOT change in the current render

```tsx
setCount(5)
console.log(count)   // ❌ still the OLD value (e.g. 0), not 5
```

**Why:** each render is a *snapshot*. The `count` variable is a `const` captured for *this*
run of the component. `setCount(5)` does NOT reach back and change that `const` — it schedules
a **re-render**, and only in the *next* render does `count` read as `5`.

```tsx
async function loadCourses() {
  const json = await res.json()
  setCourses(json.data)
  console.log(courses)   // ❌ still []  — this render's snapshot. setCourses doesn't mutate it.
}
```
Nothing is broken — `courses` IS set; it just shows up on the next render (your `.map()` renders it fine).

**How to actually verify state changed:**
```tsx
// option A: log in the component body (runs every render)
console.log('courses now:', courses)

// option B: watch it with an effect (logs only when it changes)
useEffect(() => { console.log('courses updated:', courses) }, [courses])
```

**Flutter analogy:** like calling `setState(() => ...)` then reading the field on the same line —
in React the local `const` is frozen per render, so it literally can't have updated yet.

### Bonus gotcha: don't log objects with a template literal
```tsx
console.log(`data: ${json.data}`)   // ❌ "data: [object Object],[object Object]"
console.log('data:', json.data)     // ✅ real array, expandable in console
```
A template literal calls `.toString()` on objects → useless `[object Object]`. Use a comma instead.

### Interview answer
> *"setState is asynchronous and per-render: the state variable is a const captured in that render's
> closure, so reading it right after calling the setter gives the old value. The new value only exists
> in the next render. To observe a change I log in the render body or use an effect keyed on that state."*

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

## 20. "You Might Not Need an Effect" (the most important anti-pattern to avoid)

**This is the #1 concept that separates juniors from mid/senior React devs.** React has an entire docs page literally called this.

### The Rule

> **If a value can be computed from existing state or props during render, DO NOT put it in another `useState` synced via `useEffect`. Just compute it in the function body.**

### The wrong pattern (what most juniors write)

```tsx
const [users, setUsers] = useState<User[]>([])
const [search, setSearch] = useState('')
const [filtered, setFiltered] = useState<User[]>([])   // ❌ unnecessary state

useEffect(() => {                                       // ❌ unnecessary effect
  setFiltered(
    users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()))
  )
}, [users, search])
```

**Two problems:**
1. You're duplicating state — `filtered` is just a function of `users` + `search`
2. Every keystroke = setState = re-render → useEffect → another setState → another re-render. Wasted cycle + risk of infinite loop

### The right pattern (derived during render)

```tsx
const [users, setUsers] = useState<User[]>([])
const [search, setSearch] = useState('')

// derived — computed on every render, always in sync, no extra state
const filtered = users.filter(u =>
  u.name.toLowerCase().includes(search.toLowerCase())
)
```

**One source of truth.** When `users` or `search` changes → re-render → `filtered` recomputed automatically.

### Flutter analogy
This is identical to writing derived calculations inside Flutter's `build()` method. You wouldn't `setState` a `_filtered` list whenever `_search` changes — you'd just compute it in `build()`. **React is the same.**

```dart
Widget build(BuildContext context) {
  final filtered = users.where((u) => u.name.contains(search)).toList();  // derived here
  return ListView(...);
}
```

### When IS useEffect actually needed?

Only for **side effects** — things that affect the world OUTSIDE the render:
- ✅ Fetching data on mount or when something changes
- ✅ Setting up subscriptions (sockets, intervals, event listeners)
- ✅ Synchronizing with non-React state (localStorage, DOM APIs)
- ✅ Logging analytics events on prop changes

### When useEffect is WRONG

- ❌ Computing a value from other state/props → derive in render
- ❌ Updating state when another state changes → derive instead
- ❌ Triggering a chain reaction of state updates → refactor to one source of truth
- ❌ "When this prop changes, do X to local state" → consider lifting state up

### The thinking question
Before adding a `useEffect`, ask yourself:

> *"Could I compute this value during render from existing state?"*

If yes → don't use useEffect.
If no (side effect, async, subscription) → useEffect is correct.

### Strong-signal interview answer
> *"My default is to derive values during render rather than syncing them into a separate state via useEffect. The React docs have a whole page — 'You Might Not Need an Effect' — about this. Effects are for side effects, not for keeping state in sync with other state. If I see `useState + useEffect that just calls setState`, it's a smell that the state should be derived."*

**Memorize this answer.** It comes up in EVERY React interview.

### Other "you don't need useEffect" red flags

```tsx
// ❌ Sync state from props
useEffect(() => { setLocal(prop) }, [prop])
// ✅ Just use the prop directly, or lift state up if needed

// ❌ Reset state when a prop changes
useEffect(() => { setLocal(0) }, [resetKey])
// ✅ Use the `key` prop on the component instead — React unmounts/remounts cleanly

// ❌ "Send data to parent" via useEffect
useEffect(() => { onSelectionChange(selected) }, [selected])
// ✅ Just call onSelectionChange directly in the click handler

// ❌ Chained setStates
useEffect(() => { setFiltered(...) }, [users])
useEffect(() => { setVisible(filtered.slice(0, 10)) }, [filtered])
// ✅ Both `filtered` and `visible` are derived — compute inline
```

---

## 21. Reference Equality Trap in `useEffect` Deps (the infinite-loop bug)

React's dependency array compares values with `===` (reference equality), not deep equality. This bites you with **objects and arrays computed during render.**

### The bug pattern

```tsx
function Dashboard() {
  const raw = sessionStorage.getItem('user')
  const me = raw ? JSON.parse(raw) : null     // ⚠️ NEW object every render!

  useEffect(() => {
    fetch('/users')
  }, [me])    // ❌ me has new reference every render → fetch fires endlessly
}
```

**Why it loops:**
- `JSON.parse()` produces a brand-new object with a different reference each call
- Dep array sees "reference changed!" → effect fires
- Effect calls `setUsers` → re-render → `me` recomputed again with new reference → effect fires again → forever

### Three fixes

```tsx
// FIX 1: empty deps (run once on mount) — usually what you want for one-shot fetches
useEffect(() => { fetch('/users') }, [])

// FIX 2: depend on PRIMITIVE values inside the object, not the object itself
useEffect(() => { fetch(`/users/${me?._id}`) }, [me?._id])

// FIX 3: stabilize the object with useMemo
const me = useMemo(() => raw ? JSON.parse(raw) : null, [raw])
useEffect(() => { fetch('/users') }, [me])    // now me is stable
```

### What's safe vs not safe to put in dep arrays

| Type | Safe? | Notes |
|---|---|---|
| Strings, numbers, booleans | ✅ Always | Primitive equality |
| `null`, `undefined` | ✅ Always | |
| State from `useState` | ✅ Safe | Setter only produces new reference when value changes |
| Functions from `useCallback` | ✅ Safe | Stable across renders |
| Objects/arrays from `useState` | ✅ Safe | Only changes when you call setter |
| Computed objects/arrays in body | ❌ Trap! | New reference every render → loop |
| Inline functions/objects (`onClick={() => ...}`) | ❌ Trap! | New each render |
| `useMemo`/`useCallback` results | ✅ Safe | Stable as long as their deps are stable |

### How to spot this bug
**Symptoms:**
- Network tab shows endless requests
- Console logs print forever
- React DevTools shows the component "highlighted" non-stop
- Vite HMR stops reflecting changes (browser too busy)

**Quick debug:** put `console.log('render')` at the top of your component. If it logs forever, you have a loop somewhere.

### Interview answer
> *"useEffect deps compare with `===`, so objects or arrays computed during render trigger the effect every time — their reference changes even if contents are identical. The fixes are: depend on primitives inside the object, stabilize the value with useMemo, or use empty deps for one-shot effects. It's the most common cause of infinite re-render loops in React."*

---

**Bookmark this file. Re-read before frontend interviews.**

---

## 22. Conditional `className` Patterns

You'll do this dozens of times per page — apply CSS classes based on state/props.

### 3 levels of complexity

```tsx
// 1. Ternary — clean for ONE conditional class
className={isActive ? 'user-item active' : 'user-item'}

// 2. Template literal — for 2-3 conditionals
className={`user-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}

// 3. clsx library — production standard for 2+ conditionals
import clsx from 'clsx'
className={clsx('user-item', {
  active: isActive,
  disabled: isDisabled,
  pinned: u.pinned,
})}
```

### When to use which

| Conditional classes | Use |
|---|---|
| 1 | Ternary ✅ |
| 2-3 | Template literal or clsx |
| 4+ | clsx (much cleaner) |

### Why `clsx` is the community standard

- Skips `false`/`null`/`undefined` automatically (no awkward `''` empties)
- Tiny (~200 bytes)
- TypeScript-friendly
- Used in basically every modern React project

```tsx
clsx('btn', { primary: true, disabled: false, large: undefined })
// → "btn primary"  (disabled and large are skipped)
```

**Recruiter signal:** *"I start with a ternary; once there are 2+ conditional classes I reach for clsx. Cleaner than string concatenation and skips falsy values automatically."*

---

**Bookmark this file. Re-read before frontend interviews.**

---

## 23. Functional State Updates (`prev => ...`)

When new state **depends on previous state**, ALWAYS use the function form. Never the direct form.

### The pattern
```tsx
const [count, setCount] = useState(0)

setCount(count + 1)           // ⚠️ uses `count` from closure — can be stale
setCount(prev => prev + 1)    // ✅ React passes you the LATEST value
```

### Why the direct form is risky

```tsx
const handleClick = () => {
  setCount(count + 1)   // count = 0 → sets to 1
  setCount(count + 1)   // count still 0 in this closure → sets to 1 again
  setCount(count + 1)   // same → final value is 1, not 3!
}
```

vs functional:
```tsx
const handleClick = () => {
  setCount(prev => prev + 1)   // prev = 0 → returns 1
  setCount(prev => prev + 1)   // prev = 1 → returns 2
  setCount(prev => prev + 1)   // prev = 2 → returns 3 ✅
}
```

### Common patterns

```tsx
// Append to array
setMessages(prev => [...prev, newMsg])

// Remove from array
setMessages(prev => prev.filter(m => m._id !== id))

// Replace one item
setMessages(prev => prev.map(m => m._id === id ? updated : m))

// Toggle boolean
setOpen(prev => !prev)

// Update object field
setUser(prev => ({ ...prev, name: 'new' }))

// Increment counter
setCount(prev => prev + 1)
```

### Rule of thumb
> **If your new state references the old state in any way, use the function form.**

### Interview answer
> *"For state updates that depend on the previous value, I use the functional form `setX(prev => ...)`. Direct updates like `setX([...arr, item])` can use a stale closure value when called rapidly — multiple updates batch together and only the last one wins. The function form guarantees React passes the latest value."*

---

## 24. Optimistic UI (the WhatsApp-feel pattern)

**Optimistic UI** = update the screen *before* the server confirms. If the server fails, roll back. Standard in every modern chat app.

### Why
Without it: user types → clicks send → message appears 200-2000ms later. Feels slow.
With it: message appears INSTANTLY. Feels native.

### The 4-step pattern

```tsx
const handleSend = async () => {
  if (!partnerId || !draft.trim()) return

  // 1. Create a TEMP message with a fake ID — local-only
  const tempId = 'temp-' + Date.now()
  const optimisticMsg = {
    _id: tempId,
    message: draft,
    senderId: { _id: myId, name: 'me' },
    receiverId: { _id: partnerId, name: '' },
    createdAt: new Date().toISOString(),
  }

  // 2. Add it IMMEDIATELY to UI
  setMessages(prev => [...prev, optimisticMsg])
  setDraft('')

  try {
    // 3. Send to backend
    const res = await fetch('/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId: myId, receiverId: partnerId, message: draft }),
    })
    if (!res.ok) throw new Error('Failed')
    const json = await res.json()

    // 4. SWAP the temp with the real server-returned message
    setMessages(prev =>
      prev.map(m => m._id === tempId ? json.data : m)
    )
  } catch (err) {
    // 5 (on failure): ROLLBACK — remove the temp
    setMessages(prev => prev.filter(m => m._id !== tempId))
    alert('Failed to send')
  }
}
```

### Key insights

- **The `tempId` never leaves the browser** — backend doesn't know or care
- **Frontend matches by `tempId`** to find which message to replace
- **The `'temp-'` prefix** lets you identify pending messages (`m._id.startsWith('temp-')`)
- **You can style pending messages differently** — lower opacity, "sending..." indicator

### Pending state styling
```tsx
{messages.map(msg => {
  const isPending = msg._id.startsWith('temp-')
  return (
    <div className={`bubble ${isPending ? 'pending' : ''}`}>
      {msg.message}
      {isPending && <span className="status">sending…</span>}
    </div>
  )
})}
```

```css
.bubble.pending { opacity: 0.6; }
```

### Recruiter answer
> *"For send actions in interactive UIs I use optimistic updates — create a temp message with a local UUID, render it immediately, then swap with the server response when it arrives. On failure, I roll back. WhatsApp, iMessage, Slack — every modern chat app does this. The pattern requires functional state updates and a way to identify pending items, usually a `'temp-'` prefix on the local ID."*

---

## 25. Keyboard Events (`onKeyDown`)

### Basic shape

```tsx
<input onKeyDown={(e) => { /* e is React.KeyboardEvent<HTMLInputElement> */ }} />
```

### Common `e.key` values

| Key pressed | `e.key` |
|---|---|
| Enter | `"Enter"` |
| Escape | `"Escape"` |
| Tab | `"Tab"` |
| Backspace | `"Backspace"` |
| Space | `" "` (a literal space) |
| Arrow keys | `"ArrowUp"`, `"ArrowDown"`, `"ArrowLeft"`, `"ArrowRight"` |
| Letters | `"a"`, `"A"` (uppercase if Shift) |
| Numbers | `"0"` - `"9"` |

### Modifier flags (booleans)
`e.shiftKey`, `e.ctrlKey`, `e.altKey`, `e.metaKey` (Cmd/Win key)

### Common patterns

```tsx
// Enter to submit
onKeyDown={(e) => {
  if (e.key === 'Enter') handleSubmit()
}}

// Enter to submit, Shift+Enter for newline (Slack/Discord style)
onKeyDown={(e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()       // stop browser from inserting a newline
    handleSubmit()
  }
}}

// Escape to close
onKeyDown={(e) => {
  if (e.key === 'Escape') closeModal()
}}

// Ctrl/Cmd + S to save
onKeyDown={(e) => {
  if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()       // stop browser's "Save Page As" dialog
    handleSave()
  }
}}

// Arrow nav
onKeyDown={(e) => {
  if (e.key === 'ArrowUp') setIndex(i => i - 1)
  if (e.key === 'ArrowDown') setIndex(i => i + 1)
}}
```

### `onKeyDown` vs `onKeyUp` vs `onKeyPress`

| Event | When | Use |
|---|---|---|
| `onKeyDown` | Key pressed down | **Default — use this** |
| `onKeyUp` | Key released | Rare (e.g., "stopped typing" detection) |
| `onKeyPress` | Produces a character | ❌ **Deprecated — never use** |

### Interview answer
> *"For keyboard shortcuts I use `onKeyDown` with `e.key === 'Enter'` rather than the deprecated `onKeyPress`. For chat I also check `e.shiftKey` so Shift+Enter inserts a newline like Slack — plain Enter sends. The keyboard handler always calls the same function the Send button does, so there's one source of truth."*

---

**Bookmark this file. Re-read before frontend interviews.**

---

# 📖 Appendix: JavaScript / TypeScript Essentials for React

You can't write React without these. All of them have **direct Dart equivalents** — you already know them, just under different names.

---

## A1. Array Methods (use these DAILY in React)

### `.map()` — transform each item
```js
const nums = [1, 2, 3]
const doubled = nums.map(n => n * 2)        // [2, 4, 6]

const users = [{name: 'Alice'}, {name: 'Bob'}]
const names = users.map(u => u.name)        // ['Alice', 'Bob']
```
**Dart equivalent:** `nums.map((n) => n * 2).toList()`
**React use:** rendering lists in JSX.

### `.filter()` — keep items that match a condition
```js
const nums = [1, 2, 3, 4, 5]
const evens = nums.filter(n => n % 2 === 0)   // [2, 4]

const users = [{name: 'Alice', active: true}, {name: 'Bob', active: false}]
const activeUsers = users.filter(u => u.active)
```
**Dart equivalent:** `nums.where((n) => n.isEven).toList()`
**React use:** filtering data before rendering (your search feature!).

### `.find()` — first item matching, or undefined
```js
const users = [{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}]
const alice = users.find(u => u.id === 1)   // {id: 1, name: 'Alice'}
const missing = users.find(u => u.id === 99) // undefined
```
**Dart equivalent:** `users.firstWhere(...)` (but firstWhere throws — `find` returns undefined).
**React use:** look up a single item by ID.

### `.some()` / `.every()` — boolean checks
```js
nums.some(n => n > 3)    // true if AT LEAST ONE matches
nums.every(n => n > 0)   // true if ALL match
```
**Dart equivalent:** `nums.any(...)` / `nums.every(...)`
**React use:** "is anyone admin?", "are all forms valid?"

### `.includes()` — does the array contain X?
```js
['a', 'b', 'c'].includes('b')    // true
[1, 2, 3].includes(5)            // false
```
**Dart equivalent:** `list.contains(x)`
**React use:** "is this user already selected?"

### `.reduce()` — collapse to a single value
```js
const nums = [1, 2, 3, 4]
const sum = nums.reduce((acc, n) => acc + n, 0)    // 10
//                       ↑accumulator ↑starting value

// Group by:
const usersByRole = users.reduce((acc, u) => {
  acc[u.role] = acc[u.role] || []
  acc[u.role].push(u)
  return acc
}, {})
```
**Dart equivalent:** `nums.fold(0, (acc, n) => acc + n)`
**React use:** computing totals, grouping data.

### `.sort()` — sorts IN PLACE (mutates!)
```js
const nums = [3, 1, 2]
nums.sort()                       // [1, 2, 3] — but nums is now mutated!

// Safe pattern: copy first
const sorted = [...nums].sort((a, b) => a - b)    // ascending
const desc   = [...nums].sort((a, b) => b - a)    // descending

// Sort objects
users.sort((a, b) => a.name.localeCompare(b.name))   // alphabetical
```
**Dart equivalent:** `list.sort()` — also mutates! Same gotcha.
**React gotcha:** **NEVER call `.sort()` on state directly** — it mutates. Always copy first with `[...state].sort()`.

### `.slice()` vs `.splice()`
```js
// slice = COPY part of an array (non-mutating)
const arr = [1, 2, 3, 4, 5]
const middle = arr.slice(1, 3)    // [2, 3] — arr unchanged

// splice = REMOVE/INSERT in place (mutating — AVOID in React state)
arr.splice(1, 2)                  // arr becomes [1, 4, 5]
```
**React rule:** prefer `slice` (non-mutating). Avoid `splice` on state.

### `.concat()` and joining arrays
```js
const a = [1, 2]
const b = [3, 4]
const joined = a.concat(b)    // [1, 2, 3, 4]
const spreadJoined = [...a, ...b]   // [1, 2, 3, 4] — modern preferred
```

### Chaining (the React pattern)
```tsx
{users
  .filter(u => u.active)
  .filter(u => u.name.toLowerCase().includes(search))
  .sort((a, b) => a.name.localeCompare(b.name))
  .map(u => <UserCard key={u.id} user={u} />)
}
```
Read top-to-bottom: filter, filter, sort, render. Beautiful and declarative.

---

## A2. Spread (`...`) — your most-used operator in React

### Copy / extend an array
```js
const nums = [1, 2, 3]
const copy = [...nums]                  // [1, 2, 3] — independent copy
const added = [...nums, 4]              // [1, 2, 3, 4]
const prepended = [0, ...nums]          // [0, 1, 2, 3]
const merged = [...nums, ...[4, 5]]     // [1, 2, 3, 4, 5]
```

### Copy / extend an object
```js
const user = { name: 'Alice', age: 30 }
const copy = { ...user }                       // { name: 'Alice', age: 30 }
const updated = { ...user, age: 31 }           // age overwritten
const withRole = { ...user, role: 'admin' }    // new field added
```

### React state updates (the #1 use case)
```tsx
// ❌ MUTATING — won't trigger re-render
users.push(newUser)
setUsers(users)

// ✅ NEW ARRAY — re-renders correctly
setUsers([...users, newUser])

// ✅ Object field update
setUser({ ...user, name: 'newName' })
```
**Dart equivalent:** `[...nums, 4]` works in Dart 2.3+. `{...obj, name: 'x'}` for maps via spread also works in modern Dart.

### Rest in function params
```js
function sum(...nums) {         // ... here = collect into array
  return nums.reduce((a, b) => a + b, 0)
}
sum(1, 2, 3, 4)   // 10
```

---

## A3. Destructuring

### Object destructuring (everywhere in React)
```js
const user = { name: 'Alice', age: 30, role: 'admin' }

const { name, age } = user                    // pull out specific keys
const { name: userName } = user               // rename: userName === 'Alice'
const { country = 'USA' } = user              // default if missing

// Nested
const { address: { city } } = data
```

### Array destructuring (useState pattern!)
```js
const [first, second, third] = [1, 2, 3]
const [head, ...tail] = [1, 2, 3, 4]    // head=1, tail=[2,3,4]
const [, , third] = [1, 2, 3]            // skip indexes

// THE useState destructure:
const [count, setCount] = useState(0)    // exactly this pattern!
```

### In function parameters (React props!)
```tsx
function Greeting({ name, age }: { name: string; age: number }) {
  return <h1>Hi {name}, you are {age}</h1>
}
```
Same as `const { name, age } = props`.

**Dart equivalent:** Dart added record destructuring in 3.0. React-style destructuring of objects in function params isn't direct — Dart uses named parameters which serve the same purpose.

---

## A4. Optional Chaining (`?.`)

Same as Dart's `?.`. Avoids null-access crashes.

```js
const user = null
user.name                  // ❌ TypeError: cannot read 'name' of null
user?.name                 // ✅ undefined (no crash)
user?.address?.city        // ✅ chain — undefined if any step is null
user?.greet?.()            // ✅ also works on function calls
arr?.[0]                   // ✅ on arrays too
```

**React use case:**
```tsx
{user?.profile?.avatar && <img src={user.profile.avatar} />}
```

---

## A5. Nullish Coalescing (`??`)

Same as Dart's `??`. Returns right side if left is `null` or `undefined`.

```js
const name = userName ?? 'Anonymous'        // if userName is null/undefined
const port = process.env.PORT ?? 3000
```

### Difference from `||`
```js
const count = 0
count || 10        // 10  — || considers 0, '', false as "empty"
count ?? 10        // 0   — ?? only considers null/undefined as "empty"
```

**Use `??` when 0, '', or false are valid values you want to keep.**

---

## A6. Template Literals (backticks)

Identical to Dart's `'$name'` interpolation.

```js
const name = 'Alice'
const greeting = `Hello, ${name}!`              // "Hello, Alice!"
const url = `http://localhost:3000/users/${id}`

// Multi-line works natively
const html = `
  <div>
    <h1>${title}</h1>
  </div>
`

// Expressions, not just variables
`Total: ${cart.reduce((sum, item) => sum + item.price, 0)}`
```

**React use:** building URLs, dynamic class names, multi-line strings.

---

## A7. Object Property Shorthand

When the key and variable name match:

```js
const name = 'Alice'
const age = 30

// ❌ Old / verbose
const user = { name: name, age: age }

// ✅ Shorthand
const user = { name, age }
```

**React use case (in your code!):**
```tsx
body: JSON.stringify({ name })   // same as { name: name }
```

---

## A8. Arrow Functions (recap)

```js
// All these are equivalent functions:
function add(a, b) { return a + b }
const add = function(a, b) { return a + b }
const add = (a, b) => { return a + b }
const add = (a, b) => a + b        // implicit return for one-liners
const square = n => n * n           // one arg — parens optional
const makeUser = name => ({ name }) // returning object — wrap in ()!
```

**The tricky one:** to return an object from a one-liner, **wrap it in parens** — otherwise `{` is interpreted as a function body.

```js
users.map(u => { name: u.name })       // ❌ syntax error
users.map(u => ({ name: u.name }))     // ✅
```

---

## A9. async / await + Promises

You already know this from Dart Futures. Same syntax.

```js
// Define an async function
async function getUser(id) {
  const res = await fetch(`/users/${id}`)
  return res.json()    // async functions ALWAYS return a Promise
}

// Call it
async function main() {
  const user = await getUser(1)
  console.log(user.name)
}

// Without await — you get the PROMISE, not the value
const promise = getUser(1)
console.log(promise)    // Promise { <pending> }
```

### Promise basics
```js
// A Promise has 3 states: pending → fulfilled OR rejected

// .then / .catch (the older pattern)
fetch('/users')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err))

// Same with async/await (modern, preferred)
try {
  const res = await fetch('/users')
  const data = await res.json()
  console.log(data)
} catch (err) {
  console.error(err)
}
```

### Run multiple in parallel
```js
// ❌ Sequential — total = sum of all delays
const a = await fetch('/a')
const b = await fetch('/b')

// ✅ Parallel — total = max of all delays
const [a, b] = await Promise.all([fetch('/a'), fetch('/b')])
```

**Dart equivalent:** `Future.wait([a, b])`. Same idea.

---

## A10. `==` vs `===` (the most-asked JS interview question)

```js
0 == '0'          // true  (loose — coerces types)
0 === '0'         // false (strict — no coercion)
null == undefined // true
null === undefined // false
```

**Always use `===`.** Never `==`. The coercion rules are a minefield.

**Dart has only `==`** (it doesn't coerce types like JS `==` does, so it's safe). JS's `===` is the equivalent.

---

## A11. Common Flutter → JavaScript Gotchas

| You expect (Dart) | JS reality |
|---|---|
| Variables are typed | `let`/`const` are inferred; `any` exists |
| `final` doesn't allow mutation of object fields | `const` only locks the binding; you CAN mutate object fields |
| Numbers are int / double | All numbers are `Number` (floating point); use `Number.isInteger(x)` |
| Async errors caught by `try/catch` automatically | Same, BUT `fetch` doesn't throw on 4xx/5xx (check `res.ok`!) |
| `==` is value equality and safe | `==` coerces types — always use `===` |
| Asking for missing map key throws | Asking for missing object key returns `undefined` |
| Trailing commas allowed everywhere | Allowed in most places (function calls, arrays, objects) |
| `print()` | `console.log()` |
| `int.parse('42')` | `Number('42')` or `parseInt('42', 10)` (always pass radix!) |
| `jsonEncode` / `jsonDecode` | `JSON.stringify` / `JSON.parse` |

---

## A12. TypeScript Quick-Ref (since your project is TS)

### Basic types
```ts
const name: string = 'Alice'
const age: number = 30
const isActive: boolean = true
const tags: string[] = ['a', 'b']
const user: { name: string; age: number } = { name: 'A', age: 1 }
let nullable: string | null = null    // union
```

### `type` vs `interface` — most React code uses both interchangeably
```ts
type User = { name: string; age: number }
interface User { name: string; age: number }   // same thing in practice
```
**Convention:** `type` for unions/aliases; `interface` for object shapes that might be extended.

### Function signatures
```ts
function add(a: number, b: number): number { return a + b }
const add = (a: number, b: number): number => a + b
type AddFn = (a: number, b: number) => number
```

### Optional / default params
```ts
function greet(name: string, greeting: string = 'Hi') {}
function fetchUser(id?: string) {}    // optional
```

### Generics (looks scary, isn't)
```ts
function first<T>(arr: T[]): T | undefined {
  return arr[0]
}
first<string>(['a', 'b'])    // type is string | undefined
first([1, 2, 3])             // type inferred as number | undefined
```

### `unknown` vs `any`
- `any` = "TypeScript, don't check this" (escape hatch — avoid)
- `unknown` = "I don't know yet — force me to check before using" (safer)

```ts
const data: unknown = await res.json()
if (typeof data === 'object' && data && 'name' in data) {
  // narrowed to a usable type
}
```

### Type narrowing patterns
```ts
if (user) {}                          // truthy check
if (typeof x === 'string') {}         // typeof
if (Array.isArray(x)) {}              // Array check
if ('name' in obj) {}                 // property check
if (x instanceof Date) {}             // class check
```

---

## A13. One-Page Mental Map

Anytime you see complex React code, you'll see these in the wild:

```tsx
function Component({ user, onSubmit }: Props) {     // destructuring
  const [items, setItems] = useState<Item[]>([])    // array destructure + generic

  const filtered = items                            // chained array methods
    .filter(i => i.active)
    .sort((a, b) => a.name.localeCompare(b.name))

  const handleAdd = (newItem: Item) => {
    setItems([...items, newItem])                   // spread for state update
  }

  return (
    <div>
      <h1>Welcome, {user?.name ?? 'Guest'}</h1>     {/* optional chain + nullish */}
      {filtered.map(i => (                          {/* map + key */}
        <Item key={i.id} {...i} />                  {/* spread props */}
      ))}
      <button onClick={() => handleAdd({...})}>+</button>
    </div>
  )
}
```

**Every line uses one of A1–A12.** Master them and React code stops feeling foreign.

---

---

## A14. Object Operations (the daily kit)

JavaScript objects ≈ Dart `Map<String, dynamic>`. Different syntax, same idea. Below is everything you'll do with them in React.

### Creating

```js
// Literal
const user = { name: 'Alice', age: 30 }

// Computed key
const key = 'role'
const obj = { [key]: 'admin' }       // { role: 'admin' }

// From entries (like fromMap)
const pairs = [['a', 1], ['b', 2]]
const obj = Object.fromEntries(pairs)  // { a: 1, b: 2 }

// Empty
const empty = {}
```

### Accessing fields

```js
// Dot notation (when key is known + valid identifier)
user.name              // 'Alice'

// Bracket notation (when key is dynamic or has special chars)
const field = 'name'
user[field]            // 'Alice'
user['some-key']       // for keys with dashes/spaces

// Missing key returns undefined (NOT an error like Dart Map throws)
user.email             // undefined
user.email.length      // ❌ TypeError on undefined

// Safe access with optional chaining
user.email?.length     // undefined (no crash)
user.address?.city ?? 'unknown'    // fallback if missing
```

**Dart gotcha:** in Dart, `map['missing']` returns `null` (Map default). In JS, `obj.missing` returns `undefined`. Slightly different — null vs undefined.

### Updating — the React-safe way (immutable)

```js
const user = { name: 'Alice', age: 30 }

// ❌ MUTATING — breaks React re-render
user.name = 'Bob'
setUser(user)            // React thinks nothing changed (same reference)

// ✅ NEW OBJECT — triggers re-render
setUser({ ...user, name: 'Bob' })

// Nested update (deeper levels need deeper spreads)
const state = {
  user: { name: 'Alice', address: { city: 'NY' } }
}

setState({
  ...state,
  user: {
    ...state.user,
    address: {
      ...state.user.address,
      city: 'LA',
    },
  },
})

// Deeply nested updates get tedious — use Immer (immer package) for real apps
```

### Adding / removing keys

```js
// Add
const updated = { ...user, role: 'admin' }

// Remove a key — use rest destructuring (CLEAN trick)
const { password, ...userWithoutPassword } = user
// userWithoutPassword has everything except password

// Mutating version (avoid in React state)
delete user.password
```

**Recruiter signal:** mention `const { sensitive, ...rest } = obj` as "the clean immutable way to omit a field" — they'll know you're past tutorials.

### Object.keys / values / entries

These are your **iteration tools**.

```js
const user = { name: 'Alice', age: 30 }

Object.keys(user)      // ['name', 'age']
Object.values(user)    // ['Alice', 30]
Object.entries(user)   // [['name', 'Alice'], ['age', 30]]
```

**Dart equivalent:** `map.keys`, `map.values`, `map.entries`. Same purpose.

### Iterating over an object

```js
const user = { name: 'Alice', age: 30 }

// Iterate keys
Object.keys(user).forEach(key => {
  console.log(key, user[key])
})

// Iterate entries (most common)
Object.entries(user).forEach(([key, value]) => {
  console.log(`${key}: ${value}`)
})

// Map to array (e.g. for JSX)
Object.entries(user).map(([key, value]) => (
  <li key={key}>{key}: {value}</li>
))

// Filter object by key/value
const filtered = Object.fromEntries(
  Object.entries(user).filter(([, value]) => value !== null)
)
```

**React use case:** rendering a dynamic key/value list (settings, form data summary).

### Checking if a key exists

```js
'name' in user                       // true — checks key existence
user.name !== undefined              // true if value is not undefined
user.hasOwnProperty('name')          // true — but prefer Object.hasOwn (newer)
Object.hasOwn(user, 'name')          // ✅ modern, recommended
```

**Difference:** `'name' in user` returns true even if value is `undefined`; `user.name !== undefined` doesn't.

### Merging objects

```js
// Spread merge (most common)
const merged = { ...defaults, ...userOverrides }
// Later spread wins for duplicate keys

// Object.assign (older, mutating)
const merged = Object.assign({}, defaults, userOverrides)
// ⚠️ Object.assign(defaults, ...) would MUTATE defaults — pass {} first
```

### Reference vs value equality (interview classic)

```js
const a = { name: 'Alice' }
const b = { name: 'Alice' }
const c = a

a === b          // false — different objects with same contents
a === c          // true  — same reference
```

JavaScript compares **references**, not contents. **Two objects with identical contents are NOT equal.**

**For deep equality:** use `JSON.stringify` (cheap but limited) or `lodash.isEqual` (proper).
```js
JSON.stringify(a) === JSON.stringify(b)    // true — but fails for functions, undefined, dates, etc.
```

**React implication:** if you pass `{...obj}` as a prop, React sees a new reference every render → child re-renders. This is where `useMemo` helps stabilize references.

### Object vs Map (the data-structure choice)

JS also has a `Map` data structure. When to use which?

| Use plain Object `{}` | Use `Map` |
|---|---|
| Fixed shape known at compile time | Dynamic keys you add/remove constantly |
| Keys are strings/symbols | Keys can be ANY type (objects, functions) |
| You want JSON serialization | Iteration order matters strictly |
| Most JS/React code (~95%) | Large key sets, frequent add/delete (better performance) |

```js
const map = new Map()
map.set('alice', { age: 30 })
map.get('alice')             // { age: 30 }
map.has('alice')             // true
map.delete('alice')
map.size                     // 0

// Iterate
for (const [key, value] of map) {
  console.log(key, value)
}
```

**Dart parallel:** Dart's `Map<K, V>` is closer to JS's `Map` than to plain JS objects. **In React day-to-day, you'll use `{}` 95% of the time.**

### Common React patterns with objects

#### Lookup table (replace if/else chains)
```js
const statusColors = {
  active: 'green',
  inactive: 'gray',
  banned: 'red',
}

return <span style={{ color: statusColors[user.status] }}>{user.status}</span>
```

**Recruiter signal:** "I prefer lookup objects over long switch/if chains — easier to extend and serialize."

#### Indexing a list for O(1) lookups
```js
// Slow: O(n) for each lookup
users.find(u => u.id === id)

// Fast: O(1) lookup after one-time O(n) indexing
const usersById = Object.fromEntries(users.map(u => [u.id, u]))
usersById[id]
```

#### Grouping
```js
const grouped = users.reduce((acc, user) => {
  const key = user.role
  acc[key] = acc[key] || []
  acc[key].push(user)
  return acc
}, {})
// { admin: [...], user: [...], guest: [...] }
```

#### Transforming an object's values
```js
const ages = { alice: 30, bob: 25 }
const ageStrings = Object.fromEntries(
  Object.entries(ages).map(([k, v]) => [k, `${v} years old`])
)
// { alice: '30 years old', bob: '25 years old' }
```

#### Updating object in array immutably (React state)
```js
// Update user with id=2's name to 'New Name'
setUsers(users.map(u =>
  u._id === 2 ? { ...u, name: 'New Name' } : u
))
```

This is the #1 React state pattern for updating one item in a list.

---

## A15. Common JS/TS Gotchas with Objects

### 1. Falsy values trip up `||`
```js
const limit = user.limit || 10        // 10 even if user.limit is 0!
const limit = user.limit ?? 10        // ✅ uses 0 if set, 10 if null/undefined
```

### 2. JSON.stringify drops things
```js
JSON.stringify({
  name: 'Alice',
  greet: () => {},          // dropped — functions can't serialize
  date: new Date(),         // becomes a string
  undef: undefined,         // dropped
  big: 123n,                // throws — BigInt unsupported
})
```

### 3. `const` doesn't freeze objects
```js
const user = { name: 'Alice' }
user.name = 'Bob'           // ✅ allowed — only the BINDING is const
user = { name: 'Bob' }      // ❌ TypeError — can't reassign

// To truly freeze:
const frozen = Object.freeze({ name: 'Alice' })
frozen.name = 'Bob'         // silently fails (or throws in strict mode)
```

### 4. Spread is SHALLOW
```js
const original = { name: 'Alice', address: { city: 'NY' } }
const copy = { ...original }
copy.address.city = 'LA'    // ⚠️ also changes original.address.city
                            // because spread copies references, not deep values
```
For deep clones use `structuredClone(obj)` (modern, built-in) or Immer.

### 5. Empty object is truthy
```js
if ({}) { console.log('runs!') }       // empty object is TRUTHY
if (Object.keys(obj).length === 0) {}   // ✅ to check "empty"
```

---

---

## A16. Semantic HTML (use the right tags, not `<div>` for everything)

HTML5 introduced **semantic elements** that describe what a section IS, not just how it looks. Visually they behave identically to `<div>`, but they carry meaning.

### The 7 semantic elements you need to know

| Tag | Meaning | Typical use |
|---|---|---|
| `<header>` | Top banner / intro of a section | App bar, hero section |
| `<nav>` | A set of navigation links | Top menu, sidebar nav |
| `<main>` | The primary content of the page | The "body" of the screen |
| `<aside>` | Supplementary content, sidebar | Filters panel, related links |
| `<section>` | A logical grouping with a heading | "Comments section", "About" |
| `<article>` | Self-contained, independently distributable content | Blog post, comment, news story |
| `<footer>` | Footer of a section / page | Copyright, links, sitemap |

### Visual: layout of a typical app

```html
<body>
  <header>
    <nav>...</nav>           <!-- top menu -->
  </header>

  <main>                     <!-- primary content -->
    <aside>...</aside>       <!-- sidebar -->
    <section>                <!-- main content area -->
      <article>...</article>
      <article>...</article>
    </section>
  </main>

  <footer>...</footer>       <!-- page footer -->
</body>
```

### Why use them over `<div class="header">`?

1. **Accessibility** — Screen readers expose them as "landmarks." Users with disabilities can jump: *"skip to main content," "next aside."*
2. **SEO** — Search engines understand page structure → better indexing.
3. **Self-documenting code** — `<main>` reads better than `<div class="main">`. JSX is easier to scan.
4. **Default styling** — `<section>`, `<article>` add a small top margin in some browsers.

### Flutter analogy
It's like the difference between `Scaffold` vs raw `Container`. Same visual output, but `Scaffold` declares the **semantic role** of the layout. Pros use semantic widgets. Same with semantic HTML.

### When to use which

```html
<!-- ❌ Junior code — everything is div -->
<div className="header">
  <div className="nav">...</div>
</div>
<div className="main">
  <div className="sidebar">...</div>
  <div className="content">...</div>
</div>

<!-- ✅ Senior code — semantic + accessible -->
<header>
  <nav>...</nav>
</header>
<main>
  <aside>...</aside>
  <section>...</section>
</main>
```

### Rule of thumb

- **One `<main>` per page.** Marks the primary content. Never duplicate.
- **`<nav>` for sets of links**, not single buttons. Use for menus, breadcrumbs, pagination.
- **`<aside>` for content that supports but isn't the main story.** Sidebars, callouts.
- **`<section>` needs a heading.** If you can't write a `<h2>` describing it, use `<div>` instead.
- **`<article>` for content that makes sense alone** — could be syndicated, shared, ripped from this page.

### Other useful semantic elements

| Tag | Use |
|---|---|
| `<button>` | Anything clickable that does an action — NEVER use `<div onClick>` |
| `<a href="...">` | Navigation (links) — NEVER fake with `<div onClick={navigate}>` |
| `<form>` | Wraps inputs being submitted together (gives free Enter-to-submit + autofill) |
| `<label>` | Wraps an input so clicking the text focuses the input |
| `<dialog>` | Modal dialog (native HTML element — replaces 90% of modal libraries) |
| `<details>` / `<summary>` | Collapsible accordion (native, no JS needed) |
| `<time datetime="...">` | Machine-readable dates |
| `<picture>` / `<figure>` / `<figcaption>` | Responsive images with captions |

### Recruiter signal answers

> *"I use semantic HTML — `<header>`, `<main>`, `<aside>` — instead of div soup. It improves screen reader navigation, helps SEO, and the JSX is self-documenting. I also use `<button>` for actions and `<a>` for navigation rather than `<div onClick>` — buttons get free focus management and keyboard support, and search engines distinguish them properly."*

> *"For modals I reach for the native `<dialog>` element first — it handles focus trap, ESC-to-close, and accessibility out of the box. Only when its styling limitations bite do I fall back to a library like Radix or Headless UI."*

### A common React-specific gotcha

```tsx
{/* ❌ Looks like a button but is actually a div */}
<div onClick={handleClick} className="my-button">Submit</div>

{/* ✅ Real button — accessible, keyboard-supported, screen-reader-friendly */}
<button type="button" onClick={handleClick} className="my-button">Submit</button>
```

The CSS can make them look identical, but **the experience for keyboard and screen reader users is night and day.** Code reviewers and recruiters will flag `<div onClick>` immediately.

---

---

## A17. CSS Selectors & Patterns You'll Use Daily

You don't need to "learn CSS" — you need a small kit of selectors and patterns. Here it is.

### Selector types (the 6 you'll use 95% of the time)

```css
/* 1. By tag name */
h1            { ... }      /* every <h1> */

/* 2. By class (most common) */
.user-item    { ... }      /* every element with className="user-item" */

/* 3. By id (rare — use class instead) */
#root         { ... }      /* the element with id="root" */

/* 4. Compound — class on a specific tag */
button.primary { ... }     /* <button className="primary"> */

/* 5. Multiple classes on the same element */
.user-item.active { ... }  /* element that has BOTH classes */
                           /* (no space between them) */

/* 6. Pseudo-class (state-based) */
.btn:hover    { ... }      /* when mouse is over the button */
.input:focus  { ... }      /* when input has focus */
.row:first-child { ... }   /* first row in its parent */
```

### Combinators (relationships between elements)

| Selector | Means | Example |
|---|---|---|
| `.a .b` | `.b` anywhere INSIDE `.a` (descendant) | `.card .title` — any title inside a card |
| `.a > .b` | `.b` is a DIRECT child of `.a` | `.nav > li` — direct list items only |
| `.a + .b` | `.b` is the element IMMEDIATELY AFTER `.a` | `h1 + p` — paragraph right after a heading |
| `.a ~ .b` | `.b` is ANY sibling after `.a` | `h1 ~ p` — every paragraph after the heading |

**99% of the time you use just `.a .b` (descendant).** The others are situational.

### Real example from your dashboard

```css
.user-item.active .user-name {
  font-weight: 600;
}
```
Read as: *"a `.user-name` element nested inside an element that has BOTH `user-item` AND `active` classes."*

This is how you style just the name text in the currently-selected row.

### Common pseudo-classes (state-based)

| Selector | When it applies |
|---|---|
| `:hover` | Mouse over the element |
| `:focus` | Element has keyboard focus (clicked into input, tabbed to button) |
| `:active` | Element is being clicked (mouse down) |
| `:disabled` | Form element is disabled |
| `:first-child` / `:last-child` | First/last among siblings |
| `:nth-child(odd)` / `:nth-child(2n)` | Pattern-based (zebra stripes) |
| `:not(.active)` | Everything EXCEPT what matches |

---

## A18. CSS Patterns Worth Knowing

### Pattern 1 — "Reserve space for the active state" (avoid layout shift)

When you add a border to the active row, content shifts by the border width. **Reserve the space with a transparent border.**

```css
/* Base state — transparent border reserves 4px */
.user-item {
  border-left: 4px solid transparent;
}

/* Active state — flip color, no layout shift */
.user-item.active {
  border-left-color: #2563eb;
}
```

**Why it matters:** UI feels janky when text wobbles 4px on click. This pattern is the fix.

### Pattern 2 — Centering with flexbox (memorize)

```css
.center-everything {
  display: flex;
  align-items: center;       /* vertical center */
  justify-content: center;   /* horizontal center */
}
```

This is the **most useful 3 lines of CSS ever.** Replaces a decade of `margin: auto` workarounds.

### Pattern 3 — 100% height layouts (for app shells)

```css
html, body { margin: 0; height: 100%; }
.app       { height: 100vh; }              /* 100% of viewport height */
.sidebar   { flex: 0 0 30%; }              /* fixed 30% width */
.main      { flex: 1; }                    /* takes remaining space */
```

The `100vh` (viewport height) + `flex: 1` combo lets you build app shells that fill the screen perfectly.

### Pattern 4 — Smooth transitions

```css
.btn {
  background: #2563eb;
  transition: background 0.15s ease;       /* animate over 150ms */
}
.btn:hover {
  background: #1d4ed8;
}
```

`transition` interpolates between the base value and the `:hover` value. Standard duration: **150-300ms**. Longer feels slow; shorter feels jumpy.

Common properties to transition: `background`, `color`, `border-color`, `transform`, `opacity`. **Avoid transitioning `width`/`height`/`top`/`left`** — they trigger layout recalc and feel laggy.

### Pattern 5 — `box-sizing: border-box` (set it globally)

```css
*, *::before, *::after {
  box-sizing: border-box;
}
```

**What it does:** an element's `width: 100%` INCLUDES padding and border (instead of adding them on top). Stops the classic *"why is my 100% width element wider than its parent?"* bug.

**Set this on every project.** It's a one-line fix for hours of frustration.

### Pattern 6 — Circle (avatars, badges)

```css
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;        /* always 50% — makes a perfect circle for any size */
}
```

### Pattern 7 — Truncate long text with "…"

```css
.user-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

Long names become "AlexanderTheGreatLast…". All 3 lines required.

### Pattern 8 — Modern shadow

```css
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
/*          ↑ ↑   ↑    ↑
            x-offset
              y-offset (downward)
                blur radius
                     color (transparent black)
*/
```

Soft modern shadow recipe. Tweak the alpha (`0.1`) for stronger/weaker.

---

## A19. CSS Units Cheat-sheet

| Unit | Meaning | When to use |
|---|---|---|
| `px` | absolute pixels | Most things (fonts, padding, borders) |
| `%` | percent of parent | Widths inside flex/grid containers |
| `vh` / `vw` | % of viewport height/width | Full-screen layouts (`100vh`) |
| `rem` | relative to ROOT font size | Fonts (so they scale with user prefs) |
| `em` | relative to PARENT font size | Component-relative spacing (rare) |
| `auto` | computed by browser | `margin: 0 auto` for centering |
| `fr` | grid fraction | CSS Grid columns/rows |

**Default for everything:** `px`. Switch to `rem` for fonts if you care about accessibility.

---

## A20. Box Model (the foundation — internalize this picture)

```
┌─────────────────────── margin (space OUTSIDE) ────────────┐
│   ┌─────────────────── border ─────────────────────┐      │
│   │   ┌─────────── padding (space INSIDE) ─────┐   │      │
│   │   │                                         │   │      │
│   │   │            content                      │   │      │
│   │   │                                         │   │      │
│   │   └─────────────────────────────────────────┘   │      │
│   └─────────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────────┘
```

- **`padding`** pushes content away from the border (space INSIDE the box)
- **`margin`** pushes the box away from other things (space OUTSIDE)
- **`border`** is the line between them
- **`content`** is the actual text/image

**Understand this picture and you've understood ~40% of CSS.**

### Shorthand
```css
padding: 10px;              /* all 4 sides */
padding: 10px 20px;         /* top/bottom 10, left/right 20 */
padding: 10px 20px 30px 40px;  /* top right bottom left (clockwise) */

margin: 0 auto;             /* 0 top/bottom, auto left/right (centers horizontally) */
```

---

---

## A21. TypeScript Type Narrowing (the union-type tool)

When a value's type is `string | null` (or any union), you must **narrow** it before using methods that only work on one variant.

### The trap
```ts
type Props = { partnerId: string | null }

function ChatPanel({ partnerId }: Props) {
  fetch(`/messages?id=${partnerId}`)   // ❌ TS error: partnerId might be null
}
```

### The fix — narrowing guards

```ts
function ChatPanel({ partnerId }: Props) {
  if (!partnerId) return null           // ← TS now knows partnerId is `string` below this

  fetch(`/messages?id=${partnerId}`)    // ✅ no error — narrowed to string
}
```

This is **control-flow type narrowing.** TypeScript follows your conditionals.

### Common narrowing patterns

```ts
// 1. Truthy check (works for null, undefined, '', 0, false)
if (user) { user.name }              // user is User now

// 2. typeof guard
if (typeof x === 'string') { x.toUpperCase() }

// 3. in operator
if ('name' in obj) { obj.name }

// 4. Array check
if (Array.isArray(x)) { x.length }

// 5. instanceof
if (err instanceof Error) { err.message }

// 6. Explicit null check
if (value !== null && value !== undefined) { /* value is narrowed */ }
```

### Optional fields and accessing them

If you mark a field optional in a type:
```ts
type Message = {
  _id: string
  updatedAt?: string     // optional — can be undefined
}
```

Accessing it requires null-safe operators:
```ts
msg.updatedAt.slice(0, 10)             // ❌ TS error: might be undefined
msg.updatedAt?.slice(0, 10)            // ✅ optional chaining
msg.updatedAt?.slice(0, 10) ?? 'N/A'   // ✅ with fallback
```

### When to mark fields optional

**Mark optional when the value genuinely might not exist** — e.g., an in-flight optimistic message doesn't have `updatedAt` yet (backend hasn't set it). Don't mark optional just to make the compiler shut up.

### Interview answer
> *"TypeScript's union types like `string | null` force you to handle each variant. The pattern is type narrowing with guards — once you do `if (!x) return`, the rest of the function knows `x` is non-null. For optional fields I use optional chaining `?.` and nullish coalescing `??` to provide defaults. This is called control-flow type narrowing."*

---

## A22. The `console.log` Template Literal Trap (memorize this)

This bites Flutter devs constantly. **Never put an object inside a template literal for logging.**

```ts
// ❌ WRONG — prints "[object Object]" garbage
console.log(`Backend returned: ${json}`)
console.log(`User data: ${user}`)
console.log(`others: ${myArray}`)         // prints "[object Object],[object Object]..."

// ✅ RIGHT — comma syntax
console.log('Backend returned:', json)    // prints the actual data, expandable in DevTools
console.log('User data:', user)
console.log('others:', myArray)
```

### Why?
Template literals call `String(value)` on whatever you embed. For objects, `String({a:1})` returns `"[object Object]"`. For arrays, it joins with commas.

Comma syntax in `console.log` keeps each arg separate — DevTools renders objects as interactive expandable trees.

### Dart analogy
In Dart, `print('user: $user')` calls `user.toString()`. Same trap if `toString` isn't implemented — you get `Instance of 'User'`. JS just always does the dumb thing.

### Rule
> **Template literals for STRINGS. Comma syntax for OBJECTS/ARRAYS.**

```ts
// Use template literal — these are strings
console.log(`Hello, ${name}`)
console.log(`Status: ${status}`)

// Use commas — these are objects
console.log('user:', user)
console.log('messages:', messages)
console.log('error:', err, 'happened at', new Date())
```

---

**Re-read this appendix when JS or CSS syntax feels foreign — these are the building blocks.**
