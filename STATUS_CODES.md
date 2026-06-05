# HTTP Status Codes — When to Use Which (quick reference)

Keep this open while building. Examples are from THIS project (chat + institute platform).

---

## The 30-second decision guide

```
Did it work?
├─ YES
│   ├─ Created a new thing (POST)        → 201 Created
│   └─ Read / updated / deleted          → 200 OK
└─ NO — whose fault?
    ├─ THE CLIENT'S fault (4xx)
    │   ├─ Bad/missing input              → 400 Bad Request
    │   ├─ Not logged in / bad token      → 401 Unauthorized
    │   ├─ Logged in but not allowed      → 403 Forbidden
    │   ├─ Thing doesn't exist            → 404 Not Found
    │   └─ Conflicts with current state   → 409 Conflict
    └─ THE SERVER'S fault (5xx)
        └─ Unexpected crash / bug         → 500 Internal Server Error
```

**The one rule that clears up most confusion:** 4xx = *the caller did something wrong*. 5xx = *my code broke*.

---

## Success (2xx)

| Code | Name | Use when | Example here |
|---|---|---|---|
| **200** | OK | A request succeeded (read, update, delete, login) | `GET /courses`, `PATCH /users/:id/role`, login |
| **201** | Created | You created a NEW resource | `POST /courses`, `POST /sign-up` |
| **204** | No Content | Success, but nothing to send back | `DELETE /courses/:id` (if you return no body) |

> Tip: many APIs just use **200** for everything successful. **201** for "I made a new row" is a nice signal but optional. Be consistent.

---

## Client errors (4xx) — "you did something wrong"

| Code | Name | Use when | Example here |
|---|---|---|---|
| **400** | Bad Request | Input is missing/malformed/invalid | Missing `name` on sign-up; `role` not in the enum |
| **401** | Unauthorized | NOT authenticated — no token, bad/expired token | No `Authorization` header; `jwt.verify` throws; wrong password on login |
| **403** | Forbidden | Authenticated, but NOT ALLOWED | Student hits an admin-only route (`requireRole('admin')`); not a participant of a chat |
| **404** | Not Found | The resource doesn't exist | `findById` returns null — course/user/chat not found |
| **409** | Conflict | Request clashes with current state | Email already registered on sign-up |
| **422** | Unprocessable Entity | (Optional) Syntactically fine but semantically invalid | Some teams use this instead of 400 for validation |

### 401 vs 403 — the one everyone mixes up
- **401** = *"I don't know who you are."* → log in / send a valid token.
- **403** = *"I know exactly who you are. You still can't do this."* → wrong role/permission.

Memory hook: **401 = no/bad ID card. 403 = valid ID card, but the door isn't yours.**

### 400 vs 404 vs 409
- **400** — the *request itself* is wrong (bad shape, missing field, invalid value).
- **404** — the request is fine, but the *thing you asked for* isn't there.
- **409** — the request is fine, but doing it would *conflict* (duplicate, already exists, state mismatch).

---

## Server errors (5xx) — "I broke"

| Code | Name | Use when |
|---|---|---|
| **500** | Internal Server Error | Anything unexpected — DB down, a thrown error you didn't plan for, a bug |

> In this project, anything that lands in the global `errorHandler` WITHOUT an
> `AppError` statusCode becomes a 500 — because it's an unexpected fault, not a known case.
> That's why only 5xx get logged loudly: 4xx are normal user mistakes, 5xx are real bugs.

---

## How it maps to AppError in this codebase

You throw the *semantic* failure; the controller/errorHandler turns it into the response:

```js
throw new AppError('Missing fields', 400)            // client sent bad input
throw new AppError('Email already in use', 409)       // conflicts with existing data
throw new AppError('Invalid email or password', 401)  // not authenticated
throw new AppError('Forbidden: insufficient role', 403) // authenticated, not allowed
throw new AppError('Course not found', 404)           // resource missing
// no statusCode / a plain Error  → 500 (unexpected)
```

---

## Cheat phrases for interviews
- *"201 for create, 200 for everything else that succeeds."*
- *"401 is authentication, 403 is authorization."*
- *"400 is a bad request, 404 is a missing resource, 409 is a conflict like a duplicate."*
- *"4xx is the client's fault, 5xx is mine — that's why I only log 5xx loudly."*
