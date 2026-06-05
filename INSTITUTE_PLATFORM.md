# Institute Management Platform — Project Spec

> **Purpose of this file:** a single source of truth for the project. Hand it to any AI
> (or read it yourself after a break) to get fully aligned in one shot — what we're building,
> why, how the code is organized, and exactly what to build next.

---

## 1. What this is

A **school / coaching-institute management platform**. An institute runs its classes online:
admins set up courses and batches, teachers mark attendance and give assignments, students
attend, submit work, and track their progress, fees, and announcements. Everyone communicates
via announcements and real-time chat.

**One-line pitch:** *"A school management system with role-based access for admins, teachers,
and students — built with React, Node, MongoDB, and real-time features."*

This is being built **on top of an existing real-time chat app** (see §4). The chat already
works; the institute platform is added alongside it, sharing only login + the `User` collection.

---

## 2. Why I'm building it (READ THIS — it changes how you should help)

- I'm a **Flutter developer (4 years)** learning **backend (Node/Express/MongoDB) and React**.
- **I learn by building** — writing schemas, APIs, and React screens repeatedly is the point.
  This project is deliberately CRUD-heavy so I get reps.
- **I write the code myself** so I can defend every line in interviews. When an AI writes all the
  code, I can't defend it.
- Shipping / deploying / polish is **secondary**. Learning the patterns is primary.

### How an AI should work with me
- **Teach the concept and the WHY first, then let me write the code.** Review what I write.
- Use **Flutter analogies** where helpful; skip beginner programming explanations.
- **Don't push refactors** for their own sake — I see mechanical refactoring as low-value busywork.
- Build **one small story at a time** (see §7). Don't dump a whole epic of code on me.
- When I ask you to "do one as an example," write ONE worked reference with heavy WHY comments,
  then let me repeat the pattern myself.

---

## 3. Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router |
| Real-time | Socket.IO (client + server) |
| Backend | Node.js, Express **5** |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT (Bearer token in `Authorization` header), bcrypt password hashing |

---

## 4. What already exists (the chat app — DO NOT BREAK)

A working 1-to-1 real-time chat:
- **Auth:** `/sign-up`, `/login` → returns `{ success, token, user }`. Passwords hashed with bcrypt.
- **Chat:** `/send-message`, `/messages`, `/chats`, `/users`. Real-time via Socket.IO rooms
  (each user joins a room named by their userId). Typing indicators + online presence.
- **Models:** `User`, `Chat`, `Message`.
- **Auth middleware:** `requireAuth` reads the Bearer token, verifies the JWT, sets `req.userId`.

The institute platform shares **only** the `User` collection and the auth/login flow. All new
features live in new collections + new routes. Adding a `role` field to `User` (with a default)
is backward-compatible and does not affect chat.

---

## 5. Roles

| Role | Can do |
|---|---|
| **admin** | Create courses & batches, assign teachers, enroll students, send announcements, record fees |
| **teacher** | See own batches, mark attendance, upload materials, post & grade assignments |
| **student** | See own batches, download materials, submit assignments, view attendance %, fees, announcements, chat with teacher |

---

## 6. Data model (the schemas to build)

Each entity is one schema + its APIs + a React screen. `→` means a Mongoose reference (`ObjectId` + `ref`).

| Entity | Key fields | Notes |
|---|---|---|
| **User** *(exists)* | name, email, password, **role** | add `role: enum['admin','teacher','student'], default 'student'` |
| **Course** | name, description | what the institute offers |
| **Batch** | name, schedule, → Course, → User (teacher) | a running class |
| **Enrollment** | → Batch, → User (student) | links student to batch (many-to-many) |
| **Attendance** | → Batch, date, records: [{ → User (student), status }] | per batch per date |
| **Assignment** | → Batch, title, description, dueDate, fileUrl | posted by teacher |
| **Submission** | → Assignment, → User (student), fileUrl, grade | student's answer |
| **Material** | → Batch, title, fileUrl | notes uploaded by teacher |
| **Announcement** | title, body, scope (institute / → Batch) | broadcast messages |
| **Fee** | → User (student), amount, dueDate, status | paid / unpaid |
| **Message/Chat** *(exists)* | — | reused for teacher ↔ student doubts |

---

## 7. The build — small stories (build ONE at a time)

Format: *As a [role], I can [one thing]*. Tick each when it works. Build in this order
(each epic unlocks the next). Epics 0–3 alone make a real, demoable app.

### Epic 0 — Roles (foundation)
- [x] **0.1** Every user has a `role` (admin/teacher/student), default student *(add field to User)*
- [x] **0.2** A `requireRole('admin')` middleware that returns 403 for the wrong role *(role carried in JWT — Option A; requireAuth sets req.userRole)*
- [x] **0.3** Admin can change a user's role *(PATCH /users/:id/role — validates role 400, 404 if missing, returns updated user without password)*

### Epic 1 — Courses (first full CRUD loop)
- [ ] **1.1** Admin can create a course (name, description) *(schema + POST)*
- [ ] **1.2** Anyone can see the list of courses *(GET)*
- [ ] **1.3** Admin can edit a course *(PATCH)*
- [ ] **1.4** Admin can delete a course *(DELETE)*
- [ ] **1.5** React screen: list courses + "Add course" form

### Epic 2 — Batches (references)
- [ ] **2.1** Admin creates a batch for a course + assigns a teacher
- [ ] **2.2** Admin sees all batches; teacher sees only their own *(filtered GET)*
- [ ] **2.3** React screen for batches

### Epic 3 — Enrollment (many-to-many)
- [ ] **3.1** Admin enrolls a student into a batch
- [ ] **3.2** Student sees their batches
- [ ] **3.3** Teacher sees students in their batch

### Epic 4 — Attendance
- [ ] **4.1** Teacher marks attendance for a batch on a date
- [ ] **4.2** Student sees their attendance % *(first aggregation)*

### Epic 5 — Assignments & Submissions (file upload)
- [ ] **5.1** Teacher posts an assignment to a batch
- [ ] **5.2** Student sees assignments for their batch
- [ ] **5.3** Student submits an assignment (file upload)
- [ ] **5.4** Teacher grades a submission

### Epic 6 — Smaller CRUD reps
- [ ] **6.1** Teacher uploads materials (notes) to a batch
- [ ] **6.2** Admin/teacher posts announcements
- [ ] **6.3** Admin records fees; student sees fees due

### Epic 7 — Dashboards & chat reuse
- [ ] **7.1** Role-based home screen (admin / teacher / student each see their own view)
- [ ] **7.2** Student ↔ teacher chat (reuse existing chat)

---

## 8. Conventions (keep new code consistent)

- **API success shape:** `res.json({ success: true, data: ... })` (or `{ success, token, user }` for auth).
- **API error shape:** `res.status(code).json({ error: 'message' })`.
- **Status codes:** 400 bad input · 401 not authenticated · 403 wrong role/forbidden · 404 not found · 409 conflict · 500 server error.
- **Auth:** protected routes use the `requireAuth` middleware; `req.userId` is the trusted identity. Never trust an ID from the request body/query (IDOR rule).
- **Never leak the password hash** — whitelist fields with `.select('name email role')` or shape the response object.
- **Frontend** reads the API base URL from `API_URL` (env var `VITE_API_URL`).

---

## 9. Current status

- ✅ Chat app working (auth, 1-to-1 messaging, presence, typing).
- ✅ Auth extracted into `modules/auth/*`, with a shared `AppError` and a global `errorHandler`
  middleware (Express 5 auto-forwards rejected promises). *(Further refactoring is deprioritized.)*
- ✅ Story 0.1 — `role` field on User (enum admin/teacher/student, default student).
- ✅ Story 0.2 — `role` in JWT payload (Option A); `requireAuth` sets `req.userId` + `req.userRole`;
  `requireRole(...roles)` middleware factory returns 403 on mismatch. `toPublicUser` now includes role.
- ✅ Story 0.3 — `PATCH /users/:id/role` (admin-only via requireRole). Validates role (400), 404 if user missing, returns updated user without password. **Epic 0 (RBAC) COMPLETE.**
- ⬜ Next: **Epic 1 — Course CRUD. Start with Story 1.1 (admin creates a course).**

> Keep this file updated: tick stories as they're done, and update §9 with where we are.
