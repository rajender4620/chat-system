# Interview Prep — Chat System Project

Questions and simple, speakable answers based on what YOU built. Practice saying these out loud. Each answer is something you can actually defend because you wrote the code.

**How to use this:** read the question, try to answer in your own words FIRST, then check. The goal is to explain clearly step-by-step, not memorize word-for-word.

---

# PART 1 — FRONTEND (React + TypeScript)

## Q1. What is React, in simple terms?
React is a JavaScript library for building user interfaces out of **components** — reusable pieces of UI. Instead of manually updating the page when data changes, you describe what the UI should look like for a given state, and React updates the screen for you when the state changes.

*(Flutter parallel: React components are like Widgets. You describe the UI; the framework re-renders on state change.)*

---

## Q2. What is a component?
A component is a **function that returns UI** (JSX). You can reuse it many times. Example: a `MessageBubble` component — write it once, use it for every message.

```tsx
function MessageBubble({ text }) {
  return <div className="bubble">{text}</div>
}
```

---

## Q3. What is JSX?
JSX is HTML-like syntax written inside JavaScript. It lets you describe UI in your component. Behind the scenes it compiles to JavaScript function calls. Rules: return ONE root element, use `className` instead of `class`, and embed JavaScript with `{ }`.

---

## Q4. What is `useState` and why use it?
`useState` is a React hook that gives a component **memory** — data that can change over time. When you update it with the setter function, React **re-renders** the component with the new value.

```tsx
const [count, setCount] = useState(0)
setCount(count + 1)   // triggers a re-render
```

In my chat app I used it for the message input text, the list of messages, the search box, and online users.

---

## Q5. What is the difference between `useState(x)` direct update vs functional update?
- `setCount(count + 1)` — uses the current value. Risky in rapid updates because it can use a stale value.
- `setCount(prev => prev + 1)` — React gives you the latest value. Safe when the new state depends on the old.

I used the functional form (`setMessages(prev => [...prev, newMsg])`) when appending messages, so rapid updates don't lose data.

---

## Q6. What is `useEffect`?
`useEffect` runs **side effects** — things outside rendering, like fetching data or setting up a socket connection. It runs AFTER the component renders.

- `useEffect(fn, [])` → runs once when the component mounts (like fetching initial data)
- `useEffect(fn, [x])` → runs whenever `x` changes
- Return a function from it → cleanup (runs on unmount)

In my app I used it to fetch users on mount, fetch messages when the selected chat changed, and connect/disconnect the socket.

---

## Q7. When should you NOT use useEffect?
For **derived values** — anything you can compute directly from existing state during render. For example, my filtered user list is just `users.filter(...)` computed during render — no useEffect needed. React re-runs the function on every render, so it stays in sync automatically. The React docs even have a page called "You Might Not Need an Effect."

---

## Q8. What are the Rules of Hooks?
1. Only call hooks at the **top level** — never inside if-statements, loops, or after an early return.
2. Only call them from React components or other hooks.

Reason: React tracks hooks by their call order. If the order changes between renders, React loses track of which state is which.

---

## Q9. What is a "controlled input"?
An input whose value is controlled by React state. You bind `value={state}` and update state in `onChange`. React becomes the single source of truth for the input.

```tsx
<input value={draft} onChange={e => setDraft(e.target.value)} />
```

Benefit: I can clear the input instantly with `setDraft('')`, validate as the user types, and always know the current value.

---

## Q10. What are props?
Props are data passed from a parent component to a child — like function arguments. In my app, Dashboard passes `partnerId`, `myId`, and `socket` down to the ChatPanel component.

*(Flutter parallel: props are like constructor arguments to a Widget.)*

---

## Q11. What is "lifting state up"?
When two components need the same data, you move that state to their nearest common parent and pass it down as props. In my app, the selected user and socket live in Dashboard (the parent), and ChatPanel receives what it needs.

---

## Q12. How did you handle navigation / routing?
I used **React Router** with the `createBrowserRouter` API. I defined routes for `/` (login) and `/dashboard`. I navigate programmatically with the `useNavigate` hook after login, and I store the currently-open chat in the URL as a query param (`?chat=<id>`) using `useSearchParams`.

---

## Q13. Why store the selected chat in the URL?
So it survives a refresh, works with the browser back/forward buttons, and is shareable/bookmarkable. The URL becomes the single source of truth for which conversation is open — same as WhatsApp Web. I used `useSearchParams` for this.

---

## Q14. How do you render a list in React?
With `.map()`, and each item needs a unique `key` prop so React can track items efficiently.

```tsx
{messages.map(msg => <Bubble key={msg._id} text={msg.message} />)}
```

The `key` should be a stable unique ID (I use `_id`), never the array index.

---

## Q15. What is conditional rendering?
Showing different UI based on state. I use:
- Short-circuit: `{user && <h1>Hi {user.name}</h1>}`
- Ternary: `{isTyping ? 'typing…' : 'online'}`
- Early return: `if (!partnerId) return <EmptyState />`

---

## Q16. What is optimistic UI?
Updating the screen immediately, before the server confirms — then rolling back if it fails. When I send a message, I add it to the list right away with a temporary ID, send the request, then replace the temp message with the server's real one. If it fails, I remove the temp message. This makes the chat feel instant.

---

## Q17. What is `useRef` and where did you use it?
`useRef` holds a value that persists across renders WITHOUT causing re-renders. Two uses: (1) reference a DOM element, (2) hold a mutable value. I used it to reference an empty div at the bottom of the message list and call `scrollIntoView()` for auto-scroll, and to hold the typing-debounce timeout ID.

---

## Q18. What is TypeScript and why use it?
TypeScript adds static types to JavaScript. It catches errors at compile time (like typos in object fields) and gives autocomplete. In my app I typed the User and Message shapes, component props, and event handlers.

Important: TypeScript types are **compile-time only** — they disappear at runtime. So they don't validate data from the server; for that you'd use a runtime validator like Zod.

---

## Q19. What is the difference between `==` and `===`?
`===` is strict equality (no type conversion). `==` does type coercion (`0 == '0'` is true). Always use `===` to avoid bugs.

---

## Q20. How do you handle conditional CSS classes?
A ternary for one class: `className={isActive ? 'item active' : 'item'}`. For multiple, the `clsx` library is the standard. I used the ternary for the active-chat highlight.

---

# PART 2 — BACKEND (Node.js + Express)

## Q21. What is Node.js?
Node.js lets you run JavaScript on the server (outside the browser). It's event-driven and non-blocking, good for I/O-heavy apps like a chat server handling many connections.

---

## Q22. What is Express?
Express is a web framework for Node.js. It makes it easy to define routes (URLs + HTTP methods) and middleware. My backend uses Express for the REST endpoints: `/users`, `/send-message`, `/get-messages`.

---

## Q23. What is a REST API?
REST is a convention for building APIs using HTTP methods on resources:
- `GET` — read data
- `POST` — create data
- `PUT/PATCH` — update
- `DELETE` — remove

My endpoints: `GET /users` (list users), `POST /send-message` (create a message), `GET /get-messages` (read a conversation).

---

## Q24. What is middleware in Express?
Middleware is a function that runs **between** the request arriving and your route handler. It can read/modify the request, or stop it. I use `express.json()` (parses JSON request bodies) and `cors()` (allows the frontend to call the backend). In Phase 2 I'll add an auth middleware that checks the JWT before protected routes run.

---

## Q25. What is CORS and why did you need it?
CORS (Cross-Origin Resource Sharing) is a browser security feature that blocks requests between different origins (different domain/port). My frontend runs on one URL and backend on another, so the browser blocked the calls until I added the `cors()` middleware to allow them.

---

## Q26. What is async/await?
A way to write asynchronous code that reads like synchronous code. `await` pauses until a Promise resolves. The function must be marked `async`. I use it for all database calls and fetches.

```js
const users = await User.find({})   // waits for the DB, then continues
```

---

## Q27. Why must route handlers be `async` and use `await`?
Database operations return Promises (they take time). Without `await`, you'd get the Promise object instead of the actual data. Without `async`, you can't use `await`. I hit this exact bug — forgot `await` and got an empty/wrong response.

---

## Q28. How do you handle errors in Express?
I wrap async handlers in `try/catch`. On error, I log it and return an appropriate status code (400 for bad input, 500 for server errors) with a JSON error message. I always log the actual error object, not just a generic string, so I can debug.

---

## Q29. What's a gotcha with `fetch` and error handling?
`fetch` does NOT throw on HTTP errors (4xx/5xx) — only on network failure. You must manually check `res.ok`. This trips up developers coming from axios or Dart's http package, which DO throw on bad status.

---

## Q30. How do you read data from a request in Express?
- `req.body` — JSON body (POST/PUT), needs `express.json()` middleware
- `req.query` — query string params (`?senderId=x`)
- `req.params` — URL path params (`/users/:id`)

I use `req.body` for sending messages and `req.query` for fetching a conversation.

---

## Q31. What are environment variables and why use them?
Config values that differ between environments (dev vs production) — like the database URL or API URL. They're stored outside the code (in `.env` files or the host's settings) so secrets aren't committed and the same code runs anywhere. I use `MONGODB_URI` on the backend and `VITE_API_URL` on the frontend.

---

# PART 3 — DATABASE (MongoDB + Mongoose)

## Q32. What is MongoDB?
A NoSQL document database. Instead of tables and rows, it stores **documents** (JSON-like objects) in **collections**. Flexible schema, good for nested/varied data.

---

## Q33. What is Mongoose?
An ODM (Object Data Modeling) library for MongoDB in Node.js. It lets you define schemas (structure + validation) for your documents and gives helper methods like `find`, `create`, `populate`. My app has User and Message schemas.

---

## Q34. What is a schema?
A blueprint defining the structure of documents in a collection — field names, types, validation rules. My Message schema has `message` (String), `senderId` and `receiverId` (references to User), with timestamps.

---

## Q35. What is `.populate()` and why did you need it?
MongoDB stores references as IDs, not the full related document. `populate()` follows that reference and fetches the related document. My Message stores `senderId` as just an ID; `populate('senderId', 'name')` replaces it with `{ _id, name }` so the frontend can show the sender's name. It's MongoDB's equivalent of a SQL JOIN.

I learned this the hard way: my GET endpoint populated but my POST didn't, so the two returned different shapes and broke my frontend. The lesson: keep API response shapes consistent.

---

## Q36. What is the N+1 problem?
When you fetch a list of N items, then make 1 extra query per item to get related data — N+1 total queries. It's slow. `populate()` solves it by batching the related lookups into one query using `$in`.

---

## Q37. What is `.lean()`?
By default Mongoose returns "smart" Document objects with methods and change-tracking. `.lean()` returns plain JavaScript objects instead — faster, less memory, and avoids serialization issues. I use it for read-only endpoints that just send data to the frontend. I don't use it when I need to call `.save()`.

---

## Q38. What are the main MongoDB query operators you know?
- `$ne` — not equal
- `$in` / `$nin` — in / not in an array
- `$gt`, `$gte`, `$lt`, `$lte` — comparisons
- `$or`, `$and` — logical
- `$exists` — field exists

I used `$or` in get-messages to fetch the conversation in both directions (A→B and B→A).

---

## Q39. How would you design the database for a chat app?
Three collections:
- **users** — identity (name, and password in Phase 2)
- **conversations** (chats) — who's talking to whom (participants), plus a cached last message for the sidebar
- **messages** — the actual texts, referencing their conversation

For the message's sender, I'd consider **denormalizing** (storing the name directly on the message) so reads don't need populate and historical messages keep the original name. This is what WhatsApp/Slack do. My current app uses references + populate; denormalizing is a planned refactor.

---

## Q40. Referencing vs Embedding — what's the difference?
- **Referencing** — store an ID pointer, fetch related data with populate. Good when data changes often or is shared (1-to-many).
- **Embedding** — store the related data inside the parent document. Good for data that's read together and rarely changes (1-to-few).

Trade-off: embedding is faster to read (no join) but duplicates data. For chat messages, embedding/denormalizing the sender name is usually the right call for read performance.

---

## Q41. Why are database indexes important?
An index lets the database find matching documents quickly instead of scanning the whole collection. Without an index, a query on a million-row collection can go from milliseconds to seconds. For my Message collection I'd index `{ senderId, receiverId, createdAt }` since that's what I query and sort by.

---

# PART 4 — REAL-TIME (Socket.IO)

## Q42. What is the difference between HTTP and WebSockets?
- **HTTP** — request/response, one-shot. The client asks, the server answers, the connection closes. The server can't reach out on its own.
- **WebSocket** — a persistent, two-way connection. Either side can send messages anytime. Perfect for chat, where the server needs to PUSH new messages to clients.

---

## Q43. What is Socket.IO?
A library built on top of WebSockets that adds auto-reconnect, fallback to long-polling if WebSockets are blocked, named events, and "rooms." I used it so messages appear instantly without refreshing.

---

## Q44. What are Socket.IO "rooms" and why use them?
A room is a group of socket connections. When a user connects, I have them join a room named after their user ID. To deliver a message to a specific user, I emit only to their room — so other users don't receive it. Without rooms, I'd have to broadcast every message to everyone.

---

## Q45. Walk me through how a message is delivered in real time.
1. Sender's app shows the message instantly (optimistic UI) and POSTs it to the backend.
2. Express saves it to MongoDB.
3. The server emits a `new-message` event to the **receiver's room** (named after their user ID).
4. The receiver's browser is listening for that event and appends the message — appears instantly, no refresh.

---

## Q46. How did you implement typing indicators?
When a user types, the client emits a `typing` event to the server, which relays it to the partner's room. The partner shows "User is typing…". I debounce a `stop-typing` event with a 1.5-second timer that resets on each keystroke, so the indicator disappears when they pause.

---

## Q47. How did you track online status?
On the server I keep a Set of connected user IDs. When a user joins, I add them and broadcast the updated list to everyone with `io.emit`. On disconnect, I remove them and broadcast again. The frontend shows a green dot for users in that list.

---

## Q48. What's a critical bug to avoid with Socket.IO in React?
Forgetting to remove the event listener in the useEffect cleanup. Without `socket.off(...)`, every re-render stacks another listener, and incoming events fire multiple times (duplicate messages). I always pair `socket.on` in the effect with `socket.off` in the cleanup.

---

# PART 5 — GENERAL / ARCHITECTURE

## Q49. Describe your project in 30 seconds.
"It's a real-time 1-to-1 chat app — like an internal team messenger. Users sign in, see a directory of other users, and message anyone privately. Messages deliver instantly via Socket.IO, with online status and typing indicators. Built with React + TypeScript on the frontend, Express + MongoDB on the backend, deployed to Vercel and Render."

---

## Q50. What was the hardest bug you solved?
"My sent messages were appearing on the wrong side of the chat. I traced it to my POST and GET endpoints returning different data shapes — GET populated the sender into an object, POST returned a raw ID string. After the optimistic message got swapped with the POST response, `senderId._id` became undefined and the alignment check failed. I fixed it by populating consistently on both endpoints. The bigger lesson was about keeping API response shapes consistent."

---

## Q51. How did you deploy it?
"Frontend to Vercel, backend to Render, database on MongoDB Atlas. The backend URL is an environment variable (`VITE_API_URL`) injected at build time, so the same code runs locally and in production. I configured CORS and made sure Atlas allowed connections from the backend host."

---

## Q52. What would you improve / add next?
"JWT authentication with hashed passwords and protected routes — right now login is name-based for the demo. Then a conversations collection to enable group chats and a sorted recent-chats sidebar, message pagination for performance, and read receipts. I'd also move the socket into a React Context so components don't prop-drill it."

---

## Q53. How would you scale this to a million users?
"Add database indexes on the message query fields, paginate message history (cursor-based, not skip/limit), use `.lean()` on read endpoints, cache the user list, and run multiple backend instances behind a load balancer with a Redis adapter so Socket.IO rooms work across instances. I'd also denormalize the sender name onto messages to avoid populate on the hot read path."

---

## Q54. What's the difference between authentication and authorization?
Authentication = proving WHO you are (login). Authorization = what you're ALLOWED to do (permissions/roles). Phase 2 adds authentication via JWT.

---

## Q55. How does JWT authentication work? (Phase 2 preview)
"On login, the server verifies the password (compared against a bcrypt hash) and returns a signed JWT. The client stores it and sends it in the `Authorization: Bearer` header on every request. The server verifies the token's signature with its secret key to confirm identity — no need to hit the database for every request. The signature ensures the token can't be forged or tampered with."

---

# PART 6 — JAVASCRIPT FUNDAMENTALS (the gatekeeper round)

## Q56. `var` vs `let` vs `const`?
- **`var`** — old, function-scoped, can be redeclared, hoisted. Avoid it.
- **`let`** — block-scoped (`{ }`), can be reassigned. Use for variables that change.
- **`const`** — block-scoped, can't be reassigned. Use by default.

Note: `const` only locks the variable binding, not the object's contents — you can still mutate fields of a `const` object.

---

## Q57. What is hoisting?
JavaScript moves declarations to the top of their scope before running code. `var` and function declarations are hoisted (functions fully, `var` as `undefined`). `let`/`const` are hoisted but NOT initialized — accessing them before declaration throws (the "temporal dead zone"). Practical takeaway: declare before you use.

---

## Q58. What is a closure?
A closure is when an inner function "remembers" variables from its outer function, even after the outer function has finished. It's how a function keeps access to its surrounding scope.

```js
function counter() {
  let count = 0
  return () => ++count   // this inner fn "closes over" count
}
const inc = counter()
inc() // 1
inc() // 2  — count is remembered
```

In React, every render's event handlers are closures over that render's state — which is why "stale closures" happen (e.g. an interval capturing an old state value).

---

## Q59. What is `this`?
`this` refers to the object that's calling the function — but its value depends on HOW the function is called:
- Regular function: `this` = the calling object (or undefined in strict mode)
- Arrow function: `this` = inherited from where it was defined (no own `this`)
- Method on an object: `this` = that object

This is why React code prefers arrow functions — they don't rebind `this`.

---

## Q60. What is the event loop?
JavaScript is single-threaded — one thing at a time. The event loop is how it handles async without blocking:
1. Synchronous code runs on the **call stack**
2. Async tasks (timers, fetch) are handed off; their callbacks wait in a **queue**
3. When the stack is empty, the event loop pushes queued callbacks onto the stack
4. **Microtasks** (Promises) run before **macrotasks** (setTimeout)

Simple version: "JS runs your code top to bottom, and async callbacks run later, once the current code finishes."

---

## Q61. Callbacks vs Promises vs async/await?
- **Callback** — pass a function to run later. Nesting many = "callback hell."
- **Promise** — an object representing a future value; chain with `.then()/.catch()`.
- **async/await** — syntactic sugar over Promises; reads like synchronous code. My preferred style.

All three handle asynchronous operations; async/await is the cleanest.

---

## Q62. What is a Promise? What states does it have?
A Promise represents a value that will exist in the future. Three states: **pending** → **fulfilled** (resolved) or **rejected**. You handle it with `.then`/`.catch` or `await` in a try/catch.

`Promise.all([...])` runs several in parallel and waits for all. `Promise.race([...])` resolves with the first to finish.

---

## Q63. `null` vs `undefined`?
- **`undefined`** — a variable declared but not assigned, or a missing object property. JavaScript's default "nothing."
- **`null`** — an intentional "no value" you set deliberately.

`==` treats them as equal; `===` does not.

---

## Q64. What are truthy and falsy values?
Falsy values (treated as false in conditions): `false`, `0`, `''`, `null`, `undefined`, `NaN`. Everything else is truthy — including `[]`, `{}`, and `'0'` (a non-empty string). This is why I use `users.length > 0` instead of `users.length` in conditions.

---

## Q65. Explain `map`, `filter`, `reduce`.
- **`map`** — transform each item, returns a new array of the same length.
- **`filter`** — keep items that match a condition, returns a shorter (or equal) array.
- **`reduce`** — collapse an array into a single value (sum, object, etc.).

I use `map` to render messages, `filter` to exclude myself + search users.

---

## Q66. What is destructuring?
Pulling values out of objects/arrays into variables.
```js
const { name, age } = user          // object
const [first, second] = array       // array
const [count, setCount] = useState() // that's array destructuring!
```

---

## Q67. What is the spread operator?
`...` expands an array/object. Used to copy or merge immutably — essential for React state updates.
```js
setMessages(prev => [...prev, newMsg])   // copy + add
setUser({ ...user, name: 'new' })        // copy + change one field
```

---

## Q68. Arrow function vs regular function?
- Arrow: shorter syntax, no own `this` (inherits it), can't be a constructor.
- Regular: has its own `this`, can be hoisted (if declared with `function`).

For callbacks and React handlers, arrow functions are standard.

---

# PART 7 — CSS FUNDAMENTALS

## Q69. Explain the box model.
Every element is a box with 4 layers, inside out: **content** → **padding** (space inside, around content) → **border** → **margin** (space outside, between elements). `padding` pushes content away from the border; `margin` pushes the box away from other boxes.

---

## Q70. What is `box-sizing: border-box`?
By default, `width` only covers the content — padding and border are added on top, making elements bigger than expected. `border-box` makes `width` INCLUDE padding and border, so a `width: 100%` element actually stays 100%. I set it to avoid layout surprises.

---

## Q71. Explain flexbox.
Flexbox lays out items in a row or column. Set `display: flex` on the container.
- `flex-direction` — row (default) or column
- `justify-content` — aligns along the MAIN axis (the direction of flow)
- `align-items` — aligns along the CROSS axis (perpendicular)
- `gap` — space between items
- `flex: 1` — makes an item grow to fill remaining space

I used flexbox for the 30/70 dashboard split and the chat layout. `flex: 1` is like Flutter's `Expanded`.

---

## Q72. justify-content vs align-items?
`justify-content` aligns along the main axis; `align-items` along the cross axis. In a row, justify = horizontal, align = vertical. In a column, they swap. (Same as Flutter's mainAxisAlignment vs crossAxisAlignment.)

---

## Q73. Explain CSS `position` values.
- **static** — default, normal flow
- **relative** — offset from its normal position; becomes a positioning context
- **absolute** — positioned relative to the nearest `relative` ancestor; removed from flow
- **fixed** — positioned relative to the viewport; stays on scroll
- **sticky** — relative until you scroll past a threshold, then sticks

I used `relative` on the avatar + `absolute` on the online dot to pin it to the corner.

---

## Q74. What is CSS specificity?
The rule that decides which style wins when multiple target the same element. Roughly: inline styles > IDs > classes > tag selectors. More specific selectors override less specific ones. If equal, the last one defined wins. Avoid `!important` — it's a specificity sledgehammer that's hard to override later.

---

## Q75. How do you make a site responsive?
Media queries apply different styles at different screen sizes:
```css
@media (max-width: 768px) { .sidebar { width: 100%; } }
```
Plus flexible units (`%`, `rem`, `vh`), flexbox/grid that reflow, and `max-width` instead of fixed `width`. Mobile-first means writing the small-screen styles first, then adding `min-width` queries for larger screens.

---

## Q76. CSS units — when to use what?
- **px** — fixed size, most things
- **%** — relative to parent
- **rem** — relative to root font size; best for fonts (respects user settings)
- **em** — relative to parent font size
- **vh/vw** — % of viewport height/width (full-screen layouts)

---

## Q77. `display: block` vs `inline` vs `inline-block` vs `flex`?
- **block** — takes full width, stacks vertically (div, p)
- **inline** — flows in text, ignores width/height (span, a)
- **inline-block** — inline but respects width/height
- **flex/grid** — layout systems for arranging children

---

## Q78. Flexbox vs Grid — when to use which?
- **Flexbox** — one-dimensional (a row OR a column). Great for navbars, lists, the chat layout.
- **Grid** — two-dimensional (rows AND columns at once). Great for page layouts, image galleries.

---

# PART 8 — HTTP & SECURITY

## Q79. What are the common HTTP methods?
- **GET** — read data (no body)
- **POST** — create data
- **PUT** — replace a resource
- **PATCH** — partially update
- **DELETE** — remove

My app: GET /users, POST /send-message, GET /get-messages.

---

## Q80. Common HTTP status codes?
- **2xx success:** 200 OK, 201 Created
- **4xx client error:** 400 Bad Request, 401 Unauthorized (not logged in), 403 Forbidden (logged in but not allowed), 404 Not Found
- **5xx server error:** 500 Internal Server Error

I return 400 for missing fields, 500 for server errors, and 201 when creating.

---

## Q81. 401 vs 403?
- **401 Unauthorized** — "I don't know who you are" (not authenticated — no/invalid token)
- **403 Forbidden** — "I know who you are, but you're not allowed" (authenticated but lacking permission)

---

## Q82. HTTP vs HTTPS?
HTTPS is HTTP encrypted with TLS. It protects data in transit from eavesdropping and tampering. Always use HTTPS in production — my deployed app uses it (Vercel/Render provide it automatically).

---

## Q83. What happens when you type a URL and press Enter?
1. Browser checks cache, then does a **DNS lookup** to get the server's IP
2. Opens a **TCP connection** (and TLS handshake for HTTPS)
3. Sends an **HTTP request**
4. Server processes it and sends an **HTTP response** (HTML/JSON)
5. Browser **renders** the page (and fetches CSS/JS/images)

---

## Q84. What is XSS (Cross-Site Scripting)?
An attack where a malicious script is injected into a page and runs in other users' browsers — e.g., a chat message containing `<script>` that steals data. Defense: never trust user input; React escapes content by default (it does NOT run strings as HTML unless you use `dangerouslySetInnerHTML`). This is also why storing JWTs in localStorage is an XSS risk.

---

## Q85. What is CSRF (Cross-Site Request Forgery)?
An attack that tricks a logged-in user's browser into making an unwanted request using their cookies. Defense: CSRF tokens, `SameSite` cookies. It's mainly a risk with cookie-based auth — token-in-header auth (like JWT in the Authorization header) is less exposed to CSRF.

---

## Q86. What is SQL/NoSQL injection?
When user input is used directly in a query, letting attackers manipulate it. Defense: never build queries by string concatenation; use parameterized queries / the ODM's query methods. Mongoose helps by typing/casting inputs, but you should still validate (e.g., with Zod) at the boundary.

---

## Q87. Why hash passwords? How?
So a database leak doesn't expose plaintext passwords. I'll use **bcrypt**: it's a one-way hash (can't be reversed) and salted (random per password, so identical passwords get different hashes). On login you hash the entered password and compare hashes — you never store or compare plaintext.

---

## Q88. How is a JWT secure if anyone can read it?
A JWT's payload is only **encoded** (base64), not encrypted — anyone can read it. Security comes from the **signature**: the server signs it with a secret key. If someone tampers with the payload, the signature won't match and the server rejects it. So you can't forge a valid token without the secret. Don't put sensitive data in the payload.

---

## Q89. What is CORS (recap)?
A browser security rule that blocks requests to a different origin unless the server explicitly allows it. I enabled it with the `cors()` middleware and configured Socket.IO's CORS so my frontend (different domain) can call my backend. In production you lock it to your real frontend domain, not `*`.

---

# PART 9 — REACT ADVANCED

## Q90. What is the Virtual DOM?
A lightweight in-memory copy of the real DOM. When state changes, React builds a new virtual DOM, compares it to the previous one (**diffing**), and updates only the parts of the real DOM that actually changed — instead of re-rendering everything. This makes updates fast.

---

## Q91. What is reconciliation?
React's process of comparing the new virtual DOM to the old one and figuring out the minimal set of real-DOM changes. `key` props help it match list items efficiently during this diff.

---

## Q92. What triggers a re-render in React?
1. State changes (`setState`)
2. Props change
3. Parent re-renders
4. Context value changes

When a component re-renders, its whole function body runs again (which is why derived values stay in sync).

---

## Q93. What are useMemo and useCallback?
Both are performance optimizations:
- **`useMemo`** — caches a computed VALUE, recomputes only when dependencies change.
- **`useCallback`** — caches a FUNCTION reference, so it's stable across renders.

Use them only when there's a measured performance need (e.g., expensive computation, or passing callbacks to memoized children) — not everywhere, because they add overhead.

---

## Q94. What is React.memo?
A wrapper that prevents a component from re-rendering if its props haven't changed. Pairs with `useCallback`/`useMemo` to keep prop references stable. Again — only when profiling shows a benefit.

---

## Q95. What is the Context API?
A way to share data across many components without "prop drilling" (passing props through every level). You create a context, provide a value at the top, and any descendant reads it with `useContext`. Good for app-wide data like the logged-in user, theme, or — in my Phase 3 plan — the socket instance. (Flutter parallel: InheritedWidget / Provider.)

---

## Q96. What is prop drilling and how do you avoid it?
Passing a prop through many intermediate components that don't use it, just to reach a deep child. Avoid it with Context (for app-wide state) or by lifting state to the right level. For large apps, a state library like Zustand or Redux.

---

## Q97. useState vs useReducer?
- **useState** — simple, independent pieces of state.
- **useReducer** — complex state with multiple sub-values or transitions, managed by a reducer function (like a mini Redux). Good when the next state depends on the action type.

---

## Q98. What is a custom hook?
A reusable function starting with `use` that calls other hooks, extracting shared logic. Example: `useAuth()` returning the current user, or `useSocket()` returning the socket. It keeps components clean and the logic reusable. (Like a Flutter mixin.)

---

## Q99. What is an Error Boundary?
A component that catches JavaScript errors in its child tree and shows a fallback UI instead of crashing the whole app. Without one, a render error blanks the page. (Currently must be a class component, or use a library.)

---

## Q100. What is StrictMode?
A development-only wrapper that helps catch bugs — it intentionally double-invokes effects and renders to surface side effects that aren't cleaned up properly. It does nothing in production. I saw this when my socket connected twice in dev — which is exactly why proper cleanup (`socket.disconnect`, `socket.off`) matters.

---

## Q101. What is a Fragment?
`<>...</>` lets a component return multiple sibling elements without adding an extra wrapper `<div>` to the DOM. I used it when each message renders both a bubble and a timestamp.

---

## Q102. Why are keys important in lists?
Keys give React a stable identity for each list item so it can track which items changed, were added, or removed during reconciliation. Without correct keys (or using array index as key), React can mis-match items — causing bugs with input focus, animations, and wrong data showing. Use a stable unique ID.

---

## Q103. Controlled vs uncontrolled components?
- **Controlled** — React state drives the input value (`value` + `onChange`). React is the source of truth. I use this.
- **Uncontrolled** — the DOM holds the value; you read it with a ref when needed. Less common, used for simple forms or file inputs.

---

# PART 10 — TYPESCRIPT

## Q104. What is TypeScript and why use it?
TypeScript is JavaScript with **static types**. You add type annotations, and a compiler catches type errors BEFORE you run the code — typos in field names, passing the wrong type, missing properties. Benefits: fewer runtime bugs, autocomplete, self-documenting code, safer refactoring. It compiles down to plain JavaScript.

In my app I typed the User and Message shapes, component props, and event handlers — so the editor caught mistakes as I typed.

---

## Q105. `type` vs `interface` — what's the difference?
Both describe the shape of an object and are mostly interchangeable.
- **`interface`** — best for object shapes; can be extended and "merged" (declared multiple times).
- **`type`** — more flexible; can describe unions, primitives, tuples, and intersections, not just objects.

Rule of thumb I follow: `interface` for object shapes that might be extended, `type` for unions and aliases. For my props I used `type`.

---

## Q106. `any` vs `unknown` vs `never`?
- **`any`** — turns OFF type checking. An escape hatch — avoid it; it defeats the purpose of TS.
- **`unknown`** — "I don't know the type yet." Safer than `any` because TS forces you to check/narrow before using it.
- **`never`** — a value that can never happen (e.g., a function that always throws, or an exhausted switch).

`res.json()` returns `any` by default — which is why my `setMessages(json)` bug slipped past the compiler. Typing it would've caught it.

---

## Q107. What are union types?
A value that can be one of several types, joined with `|`.
```ts
let id: string | number
partnerId: string | null    // from my ChatPanel props
```
You must "narrow" a union before using type-specific methods.

---

## Q108. What is type narrowing?
Refining a union type to a specific one using checks, so TS knows which type you have.
```ts
function chat(partnerId: string | null) {
  if (!partnerId) return        // after this, TS knows partnerId is string
  fetch(`/messages?id=${partnerId}`)  // no error
}
```
Narrowing techniques: truthy checks, `typeof`, `in`, `Array.isArray`, `instanceof`. I used the `if (!partnerId) return` guard so the rest of the function treats it as a string.

---

## Q109. What are generics?
Types that work with a placeholder type, decided when used — like a function parameter, but for types. Lets you write reusable, type-safe code.
```ts
function first<T>(arr: T[]): T | undefined {
  return arr[0]
}
first([1, 2, 3])      // T = number
first(['a', 'b'])     // T = string
```
`useState<User[]>([])` is generics in action — I tell it the state is an array of User.

---

## Q110. What are optional properties?
A property that might not exist, marked with `?`. Its type becomes `T | undefined`.
```ts
type Message = {
  _id: string
  updatedAt?: string   // optional — pending messages don't have it yet
}
```
Accessing it requires safe access: `msg.updatedAt?.slice(...)`. I made `updatedAt` optional because optimistic messages don't have it until the server responds.

---

## Q111. Optional (`?`) vs `| null` vs `| undefined`?
- **`field?: string`** — the property can be MISSING entirely (becomes `undefined`).
- **`field: string | null`** — the property MUST be passed, but its value can be `null`.

I used `partnerId: string | null` (must pass, but can be null when no chat is open) rather than optional, to force callers to handle the "no selection" case explicitly.

---

## Q112. What is type inference?
TypeScript figures out the type automatically when you don't annotate.
```ts
const name = 'alice'     // inferred as string
const [count, setCount] = useState(0)   // inferred as number
```
You don't have to type everything — let TS infer where it's obvious, annotate where it isn't (like function parameters and API responses).

---

## Q113. What is a type assertion (`as`)?
Telling TypeScript "trust me, this is type X" when you know better than the compiler.
```ts
const json = await res.json() as { data: Message[] }
```
Use sparingly — it bypasses checking. If you're wrong, you get a runtime bug. Better to validate (e.g., Zod) for external data.

---

## Q114. Important gotcha — do TypeScript types exist at runtime?
**No.** Types are compile-time only — they're erased when TS compiles to JavaScript. So they can't validate data coming from an API at runtime. If the backend sends an unexpected shape, TS won't catch it — your code crashes deeper. For runtime validation you use a library like **Zod**, which validates AND infers the type from one schema.

---

## Q115. What are utility types? Name a few.
Built-in generic types that transform other types:
- **`Partial<T>`** — all properties optional
- **`Required<T>`** — all properties required
- **`Pick<T, 'a' | 'b'>`** — keep only certain properties
- **`Omit<T, 'a'>`** — remove certain properties
- **`Record<K, V>`** — an object with keys K and values V
- **`Readonly<T>`** — all properties read-only

Example: `Omit<User, 'password'>` = a User type without the password field — useful for what you send to the client.

---

## Q116. Enum vs union of string literals?
```ts
enum Status { Active, Inactive }              // enum
type Status = 'active' | 'inactive'           // union of string literals
```
Most React codebases prefer the **string literal union** — it's simpler, has no runtime code, and works great with autocomplete. Enums generate extra JavaScript.

---

## Q117. How did you type your React component props?
I define a `type` for the props and destructure them in the function signature:
```ts
type ChatPanelProps = {
  myId: string
  partnerId: string | null
  partnerName?: string
  socket: Socket | null
}
function ChatPanel({ myId, partnerId, partnerName, socket }: ChatPanelProps) { ... }
```
TypeScript then enforces that the parent passes the right props with the right types.

---

## Q118. How do you type event handlers in React?
With React's event types, parameterized by the element:
```ts
const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {...}
const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {...}
const onKeyDown = (e: React.KeyboardEvent) => {...}
```
Tip: write the handler inline first and hover over `e` — the editor tells you the exact type to use.

---

# QUICK-FIRE "WHY" ANSWERS (memorize 5-6 of these)

- **Why `===` not `==`?** No type coercion — avoids subtle bugs.
- **Why functional setState?** Avoids stale values in rapid updates.
- **Why check `res.ok`?** fetch doesn't throw on 4xx/5xx, only network failure.
- **Why `.lean()`?** Plain objects, faster reads, no serialization quirks.
- **Why `populate()`?** Follow a reference to get related data — MongoDB's JOIN.
- **Why rooms in Socket.IO?** Target messages to specific users, not broadcast to all.
- **Why `socket.off` in cleanup?** Prevent stacked listeners firing events multiple times.
- **Why env vars?** Same code runs in dev and prod; secrets stay out of git.
- **Why hash passwords?** If the DB leaks, plaintext passwords are exposed.
- **Why URL state for the chat?** Survives refresh, back button works, shareable links.

---

**Practice: pick a random question, close this file, and explain it out loud. If you can teach it simply, you own it.**
