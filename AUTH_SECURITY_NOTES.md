# Auth & Backend Security — Simple Notes

Focused notes on backend auth and security lessons from building Phase 2 of your chat. Tied to YOUR real bugs and YOUR real code — so when an interviewer probes, you can speak from experience.

---

## 🎯 The ONE sentence to remember

> **Authentication tells you WHO is calling. But ONLY the data from the verified token is trustworthy — everything else from the client is a potential attack.**

If you take only one thing from this file: **never trust client-provided user IDs**. Use `req.userId` (set by your middleware from the token). That's the source of truth.

---

## The full auth flow (the picture)

```
                           ┌────────────────────────────┐
SIGNUP                     │       BACKEND              │
  ┌──────────┐             │                            │
  │ Frontend │  POST       │ 1. validate fields         │
  │          │  /sign-up   │ 2. check email not taken   │
  │ { name,  │ ──────────► │ 3. bcrypt.hash(password)   │
  │  email,  │             │ 4. User.create({          │
  │  pwd }   │             │      password: HASH       │
  └──────────┘             │    })                      │
                           │ 5. jwt.sign({ userId })    │
                           │ 6. respond { token, user } │
                           │    (NO password)           │
                           └────────────┬───────────────┘
                                        │
                                        ▼
                           ┌────────────────────────────┐
                           │   Frontend stores token in │
                           │   localStorage             │
                           └────────────────────────────┘


LOGIN
  ┌──────────┐             ┌────────────────────────────┐
  │ Frontend │  POST       │ 1. find user by email      │
  │ { email, │  /login     │ 2. bcrypt.compare(         │
  │   pwd }  │ ──────────► │      plain, user.password) │
  │          │             │ 3. if no match → 401       │
  │          │             │ 4. jwt.sign({ userId })    │
  │          │             │ 5. respond { token, user } │
  └──────────┘             └────────────────────────────┘


PROTECTED REQUEST
  ┌──────────────────────────────┐
  │ Frontend                     │
  │ fetch(url, {                 │
  │   headers: {                 │
  │     Authorization:           │  POST /send-message
  │       `Bearer ${token}`      │ ────────────────────►
  │   }                          │
  │ })                           │      ┌───────────────────┐
  └──────────────────────────────┘      │  Backend          │
                                        │  requireAuth() ▼  │
                                        │  • read header    │
                                        │  • verify token   │
                                        │  • set req.userId │
                                        │  • next()         │
                                        │     ▼             │
                                        │  Route handler:   │
                                        │  uses req.userId  │
                                        └───────────────────┘
```

---

## The 5 rules of password storage

1. **Never store plaintext.** Ever. One DB leak = total disaster.
2. **Use bcrypt** (or argon2, scrypt). They're slow on purpose — that's the point.
3. **Salt is included automatically** — bcrypt adds randomness so two users with the same password get different hashes.
4. **Cost factor 10-12.** Higher = slower = more secure. 10 is standard, 12 for extra-sensitive apps.
5. **Compare, don't decrypt.** Hashes are one-way. `bcrypt.compare(plain, hash)` hashes the plain input the same way and checks equality internally.

```js
// SIGNUP
const hashed = await bcrypt.hash(password, 10)
await User.create({ password: hashed })

// LOGIN
const isMatch = await bcrypt.compare(plainPassword, user.password)
```

> **YOUR REAL BUG (war story):** "I once used bcrypt's CALLBACK form and User.create ran BEFORE the hash was ready — saving users with empty passwords. Switching to `await bcrypt.hash(...)` fixed it. Lesson: never mix callback and promise styles in the same handler."

---

## JWT — the essentials

### What a JWT is
A signed token with 3 parts: `header.payload.signature`. The signature uses your secret key — so anyone can READ the payload, but only your server can FORGE one.

### Rules
1. **Payload should contain ONLY a user identifier** (`{ userId }`). Don't put sensitive data — anyone can decode the payload.
2. **Always set expiration.** `expiresIn: '7d'` is reasonable for web apps. Stolen tokens have a damage window.
3. **The secret must be long + random + in env vars.** Never commit it. Generate with `crypto.randomBytes(32).toString('hex')`.
4. **Rotate the secret on leak.** Changes invalidate all existing tokens — everyone re-logs in. Acceptable cost.

### Code pattern
```js
// Issue (signup/login)
const token = jwt.sign(
  { userId: user._id },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
)

// Verify (in middleware)
const decoded = jwt.verify(token, process.env.JWT_SECRET)
// decoded = { userId: '...', iat: ..., exp: ... }
```

---

## The `requireAuth` middleware pattern (memorize the shape)

```js
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization      // "Bearer eyJ..."
  const token = authHeader?.split(' ')[1]           // "eyJ..."

  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId        // attach for downstream handlers
    next()                              // continue
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
```

### Use it on a route
```js
app.get('/users', requireAuth, async (req, res) => {
  // req.userId is set — trusted, came from a verified token
})
```

### Key rules of middleware
- Signature is `(req, res, next)` — always in that order
- Either call `next()` OR send a response — **never both, never neither**
- Empty branches = the request hangs forever
- Attach data to `req` (like `req.userId`) so the handler can use it

---

## 🚨 THE CRITICAL SECURITY LESSON — IDOR

This was YOUR exact bug. The single most important thing in this whole file.

### The vulnerable pattern (you had this)
```js
app.post('/send-message', requireAuth, async (req, res) => {
  const { senderId, receiverId, message } = req.body
  //      ↑ trusted from CLIENT — anyone can set this to any user!
  ...
})
```

### The exploit
1. Alice logs in legitimately → gets her own token
2. Alice's token IS valid — `requireAuth` lets her in
3. Alice sends: `{ "senderId": "<bob's id>", "receiverId": "<charlie's id>", "message": "..." }`
4. The backend has NO IDEA Alice did this — it just saves a message FROM BOB.

This is called **IDOR (Insecure Direct Object Reference)** — and it's in the OWASP Top 10.

### The fix — use `req.userId` from the token
```js
app.post('/send-message', requireAuth, async (req, res) => {
  const senderId = req.userId                // ✅ from token — unforgeable
  const { receiverId, message } = req.body
  ...
})
```

### The same bug in GET endpoints
```js
// BAD — anyone can read anyone's chats
app.get('/get-messages', requireAuth, async (req, res) => {
  const { senderId, receiverId } = req.query
})

// GOOD
app.get('/get-messages', requireAuth, async (req, res) => {
  const senderId = req.userId
  const { receiverId } = req.query
})
```

### The mental model
> Authentication tells you WHO is calling. Authorization tells you WHAT THEY CAN DO. But before either applies, **never read user identity from the request body or query — only from the verified token.**

---

## Other backend security must-knows

### 1. Always `.select()` user queries
By default Mongoose returns the FULL document — including the password hash. **Whitelist fields explicitly:**
```js
const users = await User.find({}).select('name email').lean()
```

YOUR REAL BUG: when you added a password field to the User schema, GET /users started leaking hashes to the frontend.

### 2. Strip sensitive fields from auth responses
Never return the password (even hashed) in signup/login responses:
```js
res.json({
  token,
  user: { _id: user._id, name: user.name, email: user.email }
  // NOT: user
})
```

### 3. Generic error messages on login
Don't reveal which emails exist:
```js
// BAD
if (!user) return res.status(401).json({ error: 'Email not found' })       // reveals
if (!match) return res.status(401).json({ error: 'Wrong password' })       // reveals

// GOOD — same message, same status
if (!user || !match) {
  return res.status(401).json({ error: 'Invalid email or password' })
}
```

### 4. Rate limit auth endpoints
Without rate limiting, attackers can brute-force passwords (try millions of guesses). Use `express-rate-limit`:
```js
import rateLimit from 'express-rate-limit'
app.post('/login', rateLimit({ windowMs: 60_000, max: 10 }), async (req, res) => {...})
// max 10 login attempts per minute per IP
```

(Not in your code yet — Phase 3 / security polish.)

### 5. CORS — lock to your real frontend
In production, never use `origin: '*'`:
```js
app.use(cors({ origin: process.env.FRONTEND_URL }))
```

### 6. HTTPS always
Tokens in HTTP are visible to anyone on the network. Vercel + Render give you HTTPS automatically — but if you self-host, terminate TLS at the load balancer.

---

## HTTP status codes — cheat sheet

| Code | When to use |
|---|---|
| **200 OK** | Success (default for GET) |
| **201 Created** | Successful POST that created a resource (signup) |
| **400 Bad Request** | Missing/invalid input — fields, types, formats |
| **401 Unauthorized** | No/bad token, wrong credentials |
| **403 Forbidden** | Authenticated but not allowed (e.g., not an admin) |
| **404 Not Found** | Resource doesn't exist |
| **409 Conflict** | Duplicate — e.g., signup with existing email |
| **500 Internal Server Error** | Unexpected backend crash |

**Common confusion:** missing fields = **400** (the request is bad), NOT 401 (which means auth failed). YOUR REAL BUG: you used 401 for missing-fields in login.

---

## The Express handler template (memorize this shape)

Every protected handler follows this skeleton:

```js
app.post('/something', requireAuth, async (req, res) => {
  try {
    // 1. Read identity from TOKEN (not body!)
    const userId = req.userId

    // 2. Read & validate input
    const { x, y } = req.body
    if (!x || !y) return res.status(400).json({ error: 'Missing fields' })

    // 3. Authorization check (if needed)
    //    e.g., does this user own the resource they're editing?

    // 4. Do the work (DB call, etc.) — every async = await
    const result = await SomeModel.create({ userId, x, y })

    // 5. Respond — appropriate status code
    res.status(201).json({ success: true, data: result })

  } catch (err) {
    // 6. Catch unexpected errors
    console.error('Error:', err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})
```

**Every guard step uses `return res.status(...).json(...)` — never just `res.status(...)` without return.** Otherwise the function keeps running and you get "headers already sent" errors.

---

## How to explain auth to someone else (use this script)

Practice teaching it — that's how you really learn.

> "Authentication is proving who you are. Signup creates an account: you send name, email, and a password. The server hashes the password with bcrypt — a one-way function so a leaked database can't expose passwords. Then the server creates a JWT, which is a signed token containing your user ID. You store it in localStorage.
>
> Every protected request includes that token in the Authorization header — `Bearer <token>`. The server's middleware verifies the signature with its secret key, decodes the user ID, and attaches it to the request. Now the route handler knows who you are.
>
> The critical security rule: ANY field that says 'who am I' must come from the verified token, never from the request body or query. Otherwise an authenticated user could put another user's ID in the request and act as them. That's the IDOR vulnerability. Auth middleware verifies the token is real — but it's up to the route handlers to USE that verified identity instead of trusting client input."

Read aloud. Modify in your own words. If you can teach this without notes, you own it.

---

## Common interview questions

### Q: "How do you implement authentication in a Node API?"
> *"On signup I hash the password with bcrypt and create the user. On both signup and login I sign a JWT with the user's ID, set expiration to 7 days, and return it to the client. The client stores the JWT and sends it as a Bearer token in the Authorization header on every request. My requireAuth middleware verifies the token's signature with the secret key, attaches the user ID to req, and calls next. Invalid tokens get 401."*

### Q: "What is JWT and how is it secure if anyone can read it?"
> *"A JWT has three parts: header, payload, and signature. The payload is only base64-encoded, not encrypted — anyone can read it. Security comes from the signature, which is created with a secret key only the server knows. Tamper with the payload and the signature won't match — the server rejects it. So you can't forge a valid token without the secret. That's also why you never put sensitive data in the payload."*

### Q: "What's IDOR?"
> *"Insecure Direct Object Reference — when a server uses client-provided IDs to act on data without checking they match the authenticated user. Example: an authenticated endpoint that reads `senderId` from the body. Even with valid auth, the user can put another user's ID there and impersonate them. The fix is to use the user ID from the verified token, never from the client-provided body or query."*

### Q: "How would you protect a route?"
> *"Add the auth middleware before the handler: `app.get('/users', requireAuth, handler)`. The middleware verifies the token, attaches req.userId, and calls next. The handler reads req.userId — never trusts user identity from the body."*

### Q: "Why hash passwords with bcrypt instead of SHA-256?"
> *"SHA-256 is fast — attackers can hash billions of guesses per second on a GPU. bcrypt is deliberately slow (cost factor controls how slow), making brute-force impractical. It also handles salting automatically. For passwords, slowness is a feature."*

### Q: "Where should you store the JWT on the client?"
> *"For a portfolio app: localStorage. It's simple and persists across refreshes. The downside is it's vulnerable to XSS — any injected script can read it. For production I'd consider httpOnly cookies with SameSite, which JavaScript can't read but are vulnerable to CSRF unless you mitigate that with tokens. There's no perfect choice — pick based on threat model."*

### Q: "What if the JWT secret leaks?"
> *"Rotate it — change the secret to a new value. All existing tokens become invalid because their signatures no longer match. Every user has to log in again. Painful but contained — and a reason to never log or commit the secret."*

---

## Quick "why" answers

- **Why hash passwords?** DB leaks can't expose plaintext credentials.
- **Why bcrypt cost 10?** Industry-standard slowness, balances security and CPU cost.
- **Why JWT vs sessions?** Stateless — server doesn't need to look up a session row per request.
- **Why expire JWTs?** Limit damage window if stolen.
- **Why `req.userId` not `req.body.senderId`?** Body is client-controlled; token is server-verified.
- **Why `.select()` on user queries?** Hide password hash + other sensitive fields by default.
- **Why generic "invalid email or password"?** Specific errors let attackers enumerate valid emails.
- **Why 400 vs 401?** 400 = bad input, 401 = no/bad auth, 403 = authenticated but forbidden.
- **Why rate limit auth?** Slow down brute-force password guessing.

---

## If you remember NOTHING else, remember this

1. **Hash passwords with bcrypt.** Never store plaintext.
2. **Sign JWTs with a long, secret, env-var key.** Set expiration. Only put IDs in the payload.
3. **Verify the token in middleware** and attach `req.userId`.
4. **Never trust client-provided user IDs.** Use `req.userId` from the token.
5. **`.select()` your user queries.** Don't leak hashes.
6. **Same generic message** for "user not found" and "wrong password" on login.
7. **400 vs 401:** bad input vs no auth. Get these right.
8. **`return` every `res.status().json()`** in guard clauses.

You now understand backend auth at a level that gets juniors hired.
