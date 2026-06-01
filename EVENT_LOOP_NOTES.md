# Event Loop & Async JavaScript — Simple Notes

The clearest way to understand JavaScript's async model, in plain language. Use this to study AND to explain it to someone else (teaching it is how you really learn it).

---

## 🎯 The ONE sentence to remember

> **JavaScript is single-threaded — it runs one thing at a time. But it can DELEGATE slow work (timers, network, file I/O) to the runtime, keep running other code, and pick up the results later when they're ready.**

Everything below is just the detail of how "later" actually works.

---

## The restaurant analogy 🍝

Imagine a small restaurant with **one chef** (JavaScript) and a single counter (the call stack) where they prepare dishes one at a time.

- **Customers walk in** with orders → these are like function calls
- The chef can ONLY cook one dish at a time on the counter (single-threaded)
- Some things take time (a cake — 30 min in the oven). The chef doesn't stand staring at the oven — they put it in, set a timer, and serve OTHER customers
- When the oven beeps, the chef knows the cake is ready and finishes serving it

**The "kitchen helpers" doing slow work in the back** = Node APIs / Web APIs (timers, networking, file system).

**The "list of beeped orders waiting"** = the queue.

**The chef checking the list when free** = the event loop.

---

## The 4 pieces

```
   ┌────────────────────────────────────────────┐
   │              CALL STACK                    │
   │      (the chef's counter — one dish)       │
   │  ┌──────────────────┐                      │
   │  │  console.log     │  ← currently running │
   │  │  myFunction      │                      │
   │  │  main()          │                      │
   │  └──────────────────┘                      │
   └────────────────────────────────────────────┘
                       │
                       │ delegates slow work to:
                       ▼
   ┌────────────────────────────────────────────┐
   │     NODE APIs / WEB APIs                   │
   │  (the kitchen helpers in the back)         │
   │                                            │
   │  • setTimeout (timer)                      │
   │  • setInterval                             │
   │  • fetch / HTTP                            │
   │  • file system (fs)                        │
   │  • bcrypt.hash                             │
   │  • DOM events (browser)                    │
   └────────────────────────────────────────────┘
                       │
                       │ when done, the result lands in...
                       ▼
   ┌────────────────────────────────────────────┐
   │              QUEUES                        │
   │  (lists of "stuff that's ready to run")    │
   │                                            │
   │  ┌──────────────────┐  ┌────────────────┐  │
   │  │ MICROTASK QUEUE  │  │ MACROTASK QUEUE│  │
   │  │ (HIGH priority)  │  │ (LOWER pri)    │  │
   │  │                  │  │                │  │
   │  │ • Promise.then   │  │ • setTimeout cb│  │
   │  │ • await resume   │  │ • I/O callback │  │
   │  └──────────────────┘  └────────────────┘  │
   └────────────────────────────────────────────┘
                       │
                       │ pulled into the stack by:
                       ▼
   ┌────────────────────────────────────────────┐
   │             EVENT LOOP                     │
   │  "Stack empty? → drain ALL microtasks      │
   │   → then take ONE macrotask → repeat"      │
   └────────────────────────────────────────────┘
```

---

## How the 4 pieces work together

**Step by step, every time:**

1. JavaScript runs synchronous code on the **call stack**
2. When it hits async code (timer, fetch, etc.), it **hands the work off** to Node/Browser APIs and continues
3. When the async work finishes, its callback lands in the **microtask** or **macrotask** queue
4. When the call stack is empty, the **event loop** moves callbacks from queues to the stack — microtasks first, then one macrotask, repeat

That's the entire system.

---

## Microtask vs Macrotask — the key distinction

This is what separates juniors from mids in interviews.

| Microtask | Macrotask |
|---|---|
| `Promise.then(cb)` | `setTimeout(cb)` |
| `await` continuation | `setInterval(cb)` |
| `queueMicrotask(cb)` | I/O callbacks |
| `process.nextTick` (Node) | UI rendering (browser) |

**The rule:** when the stack empties, drain the ENTIRE microtask queue (including new microtasks added during draining) → then take ONE macrotask → drain microtasks again → take next macrotask → ...

**Practical consequence:** A resolved Promise fires BEFORE a `setTimeout(0)`.

---

## Walking through real code

### Example 1 — Simple `await`

```js
async function example() {
  console.log('A')
  await new Promise(r => setTimeout(r, 100))
  console.log('B')
  console.log('C')
}
example()
console.log('D')
```

**Output:** `A, D, B, C`

**Trace:**
```
Time 0ms:
  Stack: [example()]
    "A" prints
    Hit await → setTimeout(100) handed to timer API
    example() PAUSES, leaves the stack
  Stack: []
    "D" prints
  Stack: []  (idle, waiting)

Time 100ms:
  Timer fires → setTimeout's callback enters MACROTASK queue
  Event loop: stack empty, no microtasks, take macrotask
    setTimeout cb runs → calls resolve() on the Promise
    Promise resolution → example's continuation enters MICROTASK queue
  Event loop: drain microtasks
    example resumes → "B" prints → "C" prints
```

---

### Example 2 — The famous "0ms setTimeout" trick

```js
console.log('1')
setTimeout(() => console.log('2'), 0)
Promise.resolve().then(() => console.log('3'))
console.log('4')
```

**Output:** `1, 4, 3, 2`

**Why not `1, 4, 2, 3` (since both are async)?**
- `setTimeout(...,0)` → MACROTASK queue
- `Promise.then` → MICROTASK queue
- After "4", stack empties → event loop drains microtasks FIRST → "3" prints → then macrotask → "2"

**Interview takeaway:** Promises are "more urgent" than setTimeout, even with 0ms.

---

### Example 3 — The bcrypt callback bug (your real code)

```js
let hashPass = ''
bcrypt.hash(password, 10, (err, hash) => {
  hashPass = hash    // ⏰ runs LATER (macrotask, after I/O completes)
})
User.create({ password: hashPass })  // ⚡ runs NOW with hashPass = ''
```

**What actually happens:**
1. `bcrypt.hash(...)` is delegated to native bcrypt code (kitchen helper)
2. The callback is QUEUED for later — but JS keeps going
3. `User.create({ password: '' })` runs IMMEDIATELY — saves an empty password
4. Function returns, response sent
5. ~50ms later: bcrypt callback finally runs → `hashPass = "real hash"` — but it's TOO LATE, no one's using it

**The fix:** use `await bcrypt.hash(...)` so the function PAUSES until the hash is ready.

This was your real war story — keep it in your interview notebook.

---

## Why JavaScript is "non-blocking" even though it's single-threaded

This is the central paradox most people don't understand.

> **JavaScript itself is single-threaded.** But the work it can delegate (network, timers, file I/O) is handled by the runtime in the background — often using multiple threads under the hood. JS doesn't block on these. While they're running, JS keeps serving other code.

That's why a Node.js server can handle 10,000 concurrent connections with one thread:
- It handles each request quickly (a few ms)
- Hands off slow work (DB query, file read) to the runtime
- Keeps responding to OTHER requests while waiting
- Picks up results when ready

A traditional thread-per-request server uses thousands of threads. Node uses one + delegation. Both can be fast — Node is just memory-efficient.

---

## How to explain this to someone else (use this script)

This script will solidify your understanding by teaching.

> "JavaScript is like a single chef in a kitchen. They can only cook one dish at a time on the counter — that's the **call stack**. When a dish needs slow work, like baking a cake for 30 minutes, the chef doesn't just stand there. They put it in the oven and serve OTHER customers in the meantime.
>
> Behind the scenes, the **Node APIs** are the oven and the helpers handling the slow stuff — timers, network requests, file reads. When that slow work finishes, it doesn't INTERRUPT the chef. It just puts a note in a **queue** saying 'cake is ready.'
>
> The **event loop** is the chef checking that note list every time their counter is empty. There are actually two lists — a high-priority one called the **microtask queue** for things like Promises, and a regular one called the **macrotask queue** for setTimeout, I/O. The chef drains all the high-priority ones first, then takes one regular one, then checks high-priority again.
>
> That's it. That's why a Promise that's already done runs BEFORE a setTimeout(0) — Promises are microtasks, setTimeout is a macrotask."

Read this aloud. Modify it in your own words. If you can say it without notes, you own it.

---

## Common interview questions

### Q: "Explain the JavaScript event loop."
> *"JavaScript is single-threaded with a call stack. When async APIs like setTimeout or fetch are called, the work is handed off to the runtime (Node APIs or Web APIs), which runs them outside JS. When they finish, callbacks go into one of two queues — microtask (Promises, await) or macrotask (setTimeout, I/O). The event loop's rule: when the stack is empty, drain ALL microtasks first, then take ONE macrotask, then drain microtasks again. That's why Promises run before setTimeout(0)."*

### Q: "What's the output?"
```js
console.log('1')
setTimeout(() => console.log('2'), 0)
Promise.resolve().then(() => console.log('3'))
console.log('4')
```
> *"1, 4, 3, 2. Synchronous logs first — '1' and '4'. Then the event loop checks queues. Microtask queue has the Promise's `.then` callback so '3' prints. Then ONE macrotask — the setTimeout — so '2'. Microtasks always cut in line ahead of macrotasks."*

### Q: "What's the difference between a microtask and a macrotask?"
> *"Microtasks include Promise.then, await continuations, and process.nextTick. Macrotasks include setTimeout, setInterval, and I/O callbacks. The event loop drains ALL microtasks before taking the next macrotask, so microtasks are higher priority. Practically: an awaited Promise resumes faster than a setTimeout(0)."*

### Q: "Is JavaScript single-threaded or multi-threaded?"
> *"JavaScript itself is single-threaded — one call stack, one thing runs at a time. But the runtime (Node, browser) is multi-threaded and handles I/O, timers, and other slow work in the background. JS doesn't block on those; it delegates them and gets callbacks when they're done. That's why a single-threaded language can power a high-concurrency server."*

### Q: "What does `await` actually do?"
> *"`await` pauses the function it's in until the Promise resolves. It yields control back to the event loop, so other code can run. When the Promise resolves, the continuation of the function is scheduled as a MICROTASK, so it resumes as soon as the current stack clears. It doesn't pause the whole program — only the function containing it."*

### Q: "Why is `fetch` non-blocking?"
> *"fetch hands the network request off to the runtime — JS doesn't wait. The runtime handles the actual TCP/HTTPS work in the background. When the response arrives, the resulting Promise resolves and a microtask is queued to continue the awaiting code. So JS keeps responding to other requests while the network is in flight."*

---

## Memory tricks

- **Stack = NOW.** Microtask = "right after now." Macrotask = "later."
- **Promises cut the queue.** They're VIPs.
- **`await` = pause THIS function, not the program.**
- **JS doesn't have threads, but the runtime does.** That's the magic trick.

---

## If you remember NOTHING else, remember this

1. JavaScript runs **one thing at a time** on the **call stack**.
2. Slow work (timers, fetch, I/O) is handed off to the **runtime** and runs "elsewhere."
3. When done, results go into **queues** — microtask (high pri) or macrotask (lower).
4. The **event loop** picks from queues whenever the stack is empty: **drain microtasks → one macrotask → repeat**.
5. **`await`** pauses YOUR function. The world keeps spinning.

You now understand more than 80% of JavaScript devs.
