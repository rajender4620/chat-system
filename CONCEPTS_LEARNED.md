# Concepts You've Learned Building This Chat App

A complete inventory of everything you covered building this project from zero. Use this for resume keywords, interview prep, and confidence.

---

## ⚛️ Frontend — React & TypeScript

### React Core
- Function components & JSX
- `useState` (with lazy init, type generics, functional updates)
- `useEffect` (mount, dep-array, cleanup, async patterns)
- `useRef` (DOM refs + mutable values that don't re-render)
- `useNavigate`, `useParams`, `useSearchParams` (React Router hooks)
- Custom hooks pattern (`useAuth` concept)
- Props + prop destructuring + typed props
- Conditional rendering (`&&`, ternary, early return)
- List rendering with `.map()` + `key` prop
- Fragment (`<>...</>`) for sibling returns
- Event handlers (`onClick`, `onChange`, `onSubmit`, `onKeyDown`)
- `e.preventDefault()` and form behavior
- Controlled inputs pattern (`value` + `onChange`)
- StrictMode behavior + double-mount in dev
- Component composition (extracting `<ChatPanel>` from Dashboard)

### React Routing
- `createBrowserRouter` + `RouterProvider`
- Route definitions, dynamic params (`/chat/:userId`)
- Programmatic navigation with `useNavigate`
- `<Link>` for declarative navigation
- URL as state via `useSearchParams` (selected chat in `?chat=`)
- Protected route pattern

### Advanced React Patterns
- Derived state in render (the "You Might Not Need an Effect" principle)
- The reference-equality trap in useEffect deps (infinite loop bug)
- Optimistic UI flow (temp ID → swap → rollback)
- "Lifting state up" — Dashboard holds state, passes to ChatPanel
- The cleanup pattern (subscribe in effect, unsubscribe in cleanup)
- Why `setX(prev => ...)` over `setX(...)` for prev-dependent updates
- Conditional `className` patterns (ternary, `clsx`)

### TypeScript
- `type` vs `interface`
- Union types (`string | null`)
- Optional properties (`?`)
- Type narrowing with guards (`if (!partnerId) return`)
- Type inference vs explicit annotation
- Type assertions (`as`, JSDoc casts)
- Generics in components (`useState<User[]>`)
- Utility types (`Partial`, `Pick`, `Omit`, `Record`)
- The compile-time-only nature (no runtime validation → Zod awareness)
- Express `Request` type augmentation via `.d.ts` declaration merging
- React 19 deprecations (`FormEvent`, `FormEventHandler`)

---

## 🎨 CSS & HTML

### CSS Fundamentals
- Box model (content / padding / border / margin)
- `box-sizing: border-box` (the universal fix)
- Flexbox (`display: flex`, `flex-direction`, `justify-content`, `align-items`, `gap`, `flex: 1`)
- Position (`relative`, `absolute`, `fixed`)
- Selectors (class, id, tag, compound, descendant)
- Pseudo-classes (`:hover`, `:focus`, `:active`, `:disabled`, `:nth-child`)
- Specificity & inheritance
- CSS units (`px`, `rem`, `em`, `%`, `vh`, `vw`)
- Transitions for smooth interactions
- `box-shadow` for depth
- `border-radius: 50%` for circular avatars
- Linear gradients
- Text truncation (`overflow: hidden; text-overflow: ellipsis; white-space: nowrap`)
- "Reserve space" pattern (transparent border for active state)
- Conditional className for state-based styling

### Semantic HTML
- `<header>`, `<main>`, `<aside>`, `<nav>`, `<footer>` (page landmarks)
- `<section>`, `<article>` (logical grouping)
- `<form>` with `onSubmit` (vs `<div>` + `onClick`)
- `<button type="submit">` vs `type="button"`
- `<label>` wrapping inputs for accessibility
- `<input>` types (`text`, `email`, `password`)
- HTML5 validation (`required`, `minLength`, `type="email"`)
- `autoComplete` hints for browser autofill

---

## 💻 JavaScript Fundamentals

### Language essentials
- `var` vs `let` vs `const`
- Arrow functions vs regular functions (`this` behavior)
- Template literals (backticks + `${}`)
- Destructuring (object + array)
- Spread/rest operator (`...`)
- Object property shorthand (`{ name }`)
- Optional chaining (`?.`)
- Nullish coalescing (`??`)
- `===` vs `==` (always use strict)
- Truthy/falsy values + the `0`/`''`/`false` traps
- `null` vs `undefined`
- Imports: default vs named (`import x` vs `import { x }`)

### Async & control flow
- Promises + `.then`/`.catch`
- `async`/`await` (THE preferred pattern)
- The bcrypt callback-vs-promise bug (saving empty passwords)
- `Promise.all` for parallel work
- `try`/`catch`/`finally`
- Event loop, call stack, microtask vs macrotask queues
- Why `await` pauses THIS function but not the whole program
- Why `fetch` doesn't throw on 4xx/5xx (must check `res.ok`)

### Array & object methods
- `.map()`, `.filter()`, `.reduce()`, `.find()`, `.some()`, `.every()`, `.includes()`
- `.sort()` mutates — copy first with `[...arr].sort()`
- `Object.keys/values/entries`
- Reference vs value equality
- Shallow vs deep copy
- `JSON.stringify` / `JSON.parse` (and what they drop)

---

## 🌐 HTTP, REST & Web Protocols

- HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Status codes (200, 201, 400, 401, 403, 404, 409, 500) + when to use each
- Request structure (method, headers, body)
- Response structure (status, headers, body)
- HTTP vs HTTPS (and why you need HTTPS in prod)
- REST principles (resource-oriented, stateless)
- The Authorization header + `Bearer <token>` convention
- CORS — what it is, why browsers enforce it, how to allow
- HTTP vs WebSocket (one-shot vs persistent bidirectional)
- WebSocket upgrade requests bypassing Express middleware

---

## 🚀 Node.js & Express Backend

- Setting up an Express app, `app.listen`
- Middleware (built-in: `cors()`, `express.json()`)
- Writing custom middleware (`requireAuth`)
- Route handlers `(req, res, next)`
- Route-specific middleware chaining
- `req.body` / `req.query` / `req.params`
- Async route handlers with `await`
- `try`/`catch` error handling per route
- Returning JSON with `res.json` + status codes
- The `return res.status().json()` pattern (early-exit guards)
- Environment variables with `dotenv`
- Fail-fast checks at startup (JWT_SECRET missing)
- `nodemon` for dev auto-restart
- Wrapping Express in raw HTTP server for Socket.IO

---

## 🗄️ MongoDB & Mongoose

### Modeling
- Mongoose schemas + field types
- References (`Schema.Types.ObjectId` + `ref`)
- Embedded subdocuments (denormalization)
- `timestamps: true` option
- `unique`, `required` validators
- Schema indexes (single field + compound)
- Mongoose models (`mongoose.model`)

### Queries
- `find()`, `findOne()`, `findById()`
- `findOne` returns null when nothing matches; `find` returns `[]`
- Query operators (`$ne`, `$or`, `$and`, `$in`, `$gt`, `$gte`, `$lt`, `$lte`, `$exists`)
- `.populate()` — Mongoose's JOIN equivalent
- `.select()` — whitelist/blacklist fields
- `.lean()` — plain objects, faster + no circular refs
- `.sort()` — by field, ascending/descending
- `.limit()`, `.skip()` — pagination
- `Model.create()` for inserts
- The N+1 query problem
- The "Converting circular structure to JSON" bug → `.lean()` fix

### Data modeling decisions
- Referenced vs embedded data tradeoff
- Denormalization for read performance (chat sender)
- When to embed (1-to-few, read-together, rarely-changes)
- When to reference (1-to-many, changes often, large data)
- Historical name preservation via denormalization (WhatsApp pattern)
- 3-collection chat model (users / conversations / messages)
- `lastMessage` cached on Conversation for sidebar
- Compound indexes for hot read paths

### MongoDB Atlas
- Cloud database setup
- Connection string format
- Network Access (IP whitelist, 0.0.0.0/0 for dev)

---

## 🔐 Authentication & Security

### Authentication flow
- bcrypt password hashing (cost factor 10)
- bcrypt is one-way + auto-salted
- `bcrypt.compare(plain, hash)` for verification
- JWT structure: header.payload.signature
- `jwt.sign(payload, secret, options)`
- `jwt.verify(token, secret)` (throws on invalid)
- Why payload should be minimal (`{ userId }`)
- Token expiration (`expiresIn: '7d'`)
- JWT secret in env vars, never commit
- Storing token in localStorage (tradeoffs vs cookies)

### Backend security
- `requireAuth` middleware
- Authorization: Bearer token convention
- `req.userId` from verified token (never from body/query)
- IDOR (Insecure Direct Object Reference) prevention
- Generic 401 error message (prevent email enumeration)
- Field whitelisting with `.select()` to hide password hash
- Status codes: 400 (bad input), 401 (no auth), 403 (forbidden), 409 (conflict)
- CORS: dev `*` vs prod locked-down

### Socket.IO security
- `io.use()` middleware (auth before connection completes)
- `socket.handshake.auth` for client-sent auth
- `socket.data.userId` for trusted per-socket identity
- Rejecting connections via `next(new Error(...))`
- Same IDOR rule for socket events

---

## ⚡ Real-Time with Socket.IO

- WebSocket protocol fundamentals
- Why WebSocket over HTTP for chat
- Socket.IO library (rooms, events, auto-reconnect, fallback)
- Client `io(URL, { auth: {...} })`
- `socket.emit('event', data)` / `socket.on('event', cb)`
- `socket.join(roomName)` — targeted delivery rooms
- `io.to(room).emit(...)` — broadcast to one room
- `io.emit(...)` — broadcast to ALL connections
- Connection lifecycle (`connect`, `disconnect`, `connect_error`)
- Cleanup with `socket.off(...)` in `useEffect` cleanup
- The "duplicate listeners on re-render" bug
- Typing indicators with debounce
- Online presence tracking with `Set`
- Server-as-relay model (no direct socket-to-socket)
- Separate CORS config for Socket.IO

---

## 🎯 Architecture & Patterns

- Separation of concerns (frontend / backend / database)
- API contract consistency (the populate-mismatch lesson)
- Single source of truth (URL state, `useAuth`, etc.)
- Stateless server (JWT enables horizontal scaling)
- Component composition + extraction
- Optimistic UI (temp ID → swap → rollback)
- URL as state container
- Lifting state up
- Race conditions (StrictMode + AbortController)
- N+1 problem + how `.populate()` solves it
- Denormalization tradeoffs
- Caching for read performance (`lastMessage` on Conversation)

---

## 🛠️ Tooling & DevOps

### Dev workflow
- Git: commits, branching, push, pull
- GitHub: repos, README, README badges
- VS Code: IntelliSense, hover, Ctrl+Click, Restart TS Server
- Browser DevTools: Console, Network, Application/Storage
- Reading stack traces + error messages
- nodemon for backend hot-reload
- Vite for frontend dev server + HMR

### Build & Deploy
- npm package management
- `package.json` scripts (`start`, `dev`, `build`)
- Environment variables (`.env` + platform env vars)
- Vite env vars (`VITE_` prefix, `import.meta.env`)
- Vercel deployment (Root Directory for monorepo, env vars)
- Render deployment (Build/Start commands, env vars)
- MongoDB Atlas (cloud DB, network access)
- CORS for prod (lock to real frontend domain)

---

## 🧠 Engineering Mindset

- WHY comments vs WHAT comments
- Self-documenting code through naming
- Status codes as communication
- API design as a contract between teams
- Security mindset (defense in depth)
- "Never trust client-provided identity" (IDOR rule)
- Generic error messages (don't leak info)
- Fail-fast at startup (config validation)
- Cleanup matters (useEffect, socket listeners)
- Tradeoff analysis (referenced vs embedded, lean vs full doc)
- "Premature optimization" awareness
- Code review patterns (return-on-guard, no dead code)
- Reading errors carefully before guessing
- Logging the right thing (`console.log('label:', obj)` not template literals)

---

## 🐛 Real Bugs You Debugged (your war stories)

These are interview gold — you have lived experience:

1. **`req.body` was undefined** → forgot `express.json()` middleware
2. **MongoDB CastError on senderId** → using strings instead of ObjectIds (early model issue)
3. **`MissingSchemaError` for "User"** → case mismatch between `model('user')` and `ref: 'User'`
4. **Circular structure to JSON** → `.lean()` fix on a populated Mongoose document
5. **Login flipped to wrong side after send** → POST didn't populate; GET did → inconsistent API shapes
6. **Infinite useEffect loop** → `me` derived in render had new reference every time, used as dep
7. **TypeScript `Property 'userId' does not exist on Request`** → declaration merging via `.d.ts`
8. **bcrypt callback bug** → mixing callback and promise; `User.create` ran with empty hash
9. **`FormEvent` deprecated in React 19** → switched to `FormEventHandler` (also deprecated 😅)
10. **2 socket connections on refresh** → StrictMode double-mount; AbortController concept
11. **IDOR in `/send-message`** → trusted `senderId` from body; refactored to `req.userId`
12. **Password hash leaking in `/users`** → added `.select('name email')`
13. **JSON.parse('') crash** → null guard `raw ? JSON.parse(raw) : null`
14. **Single Hook called conditionally** → moved early returns AFTER hooks (rules of hooks)
15. **`onSubmit={fn()}` called immediately** → must pass the function reference, not call it

---

## 📋 In Summary

You can credibly speak to:
- React (~30 concepts)
- TypeScript (~10 concepts)
- CSS (~15 concepts)
- JavaScript fundamentals (~25 concepts)
- HTTP/REST (~10 concepts)
- Express (~12 concepts)
- MongoDB/Mongoose (~20 concepts)
- Authentication & Security (~15 concepts)
- Real-time / Socket.IO (~12 concepts)
- Architecture patterns (~10 concepts)
- Tooling/DevOps (~12 concepts)

**~170 distinct concepts**, all tied to code YOU wrote and bugs YOU debugged.

That's not "I did a tutorial." That's a real engineering portfolio.
