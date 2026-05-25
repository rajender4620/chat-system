# Mongoose / MongoDB Query Cheatsheet

Quick reference for the 95% of queries you'll write in real apps.
Save this — refer back when stuck.

---

## 1. The Basic Find Patterns

```js
// Find all (no filter)
const all = await User.find({})

// Find one document by exact match
const alice = await User.findOne({ name: 'Alice' })

// Find by ID (special shortcut)
const user = await User.findById('65f3a7c2b4e8d91234567890')

// Find many matching a filter
const adults = await User.find({ age: { $gte: 18 } })

// Count
const total = await User.countDocuments({})
```

**Returns:**
- `find()` → array (empty `[]` if nothing matches — does NOT throw)
- `findOne()` / `findById()` → single doc OR `null` if not found

---

## 2. Operators (the $-prefixed power tools)

| Operator | Means | Example |
|---|---|---|
| `$eq` | equal (rarely used — implicit) | `{ name: { $eq: 'Alice' } }` (same as `{ name: 'Alice' }`) |
| `$ne` | NOT equal | `{ _id: { $ne: myId } }` |
| `$gt` / `$gte` | greater than / or equal | `{ age: { $gt: 18 } }` |
| `$lt` / `$lte` | less than / or equal | `{ age: { $lte: 65 } }` |
| `$in` | value is in array | `{ status: { $in: ['active', 'pending'] } }` |
| `$nin` | value is NOT in array | `{ role: { $nin: ['banned', 'deleted'] } }` |
| `$exists` | field exists (or not) | `{ avatar: { $exists: true } }` |
| `$regex` | regex match | `{ name: { $regex: /^al/i } }` (case-insensitive starts with "al") |

---

## 3. Logical Operators

```js
// AND — implicit when you list multiple fields
User.find({ name: 'Alice', age: { $gt: 18 } })

// OR — explicit
User.find({
  $or: [
    { name: 'Alice' },
    { name: 'Bob' }
  ]
})

// AND of OR groups
User.find({
  $and: [
    { $or: [{ city: 'NY' }, { city: 'LA' }] },
    { age: { $gt: 18 } }
  ]
})
```

---

## 4. Chained Modifiers (the most useful 5)

```js
const result = await User
  .find({ age: { $gt: 18 } })       // filter
  .select('name email')              // only return these fields (+ _id by default)
  .sort({ createdAt: -1 })           // newest first  (1 = asc, -1 = desc)
  .skip(20)                          // pagination: skip first 20
  .limit(10)                         // pagination: max 10 results
  .populate('createdBy', 'name')     // join with another collection (like SQL JOIN)
```

### Field selection — gotcha
```js
.select('name email')      // include name + email (+ _id)
.select('-password')       // include everything EXCEPT password
.select('name -_id')       // include name, exclude _id
```
Don't mix include/exclude in one call (Mongo throws).

---

## 5. Create / Update / Delete

```js
// CREATE
const user = await User.create({ name: 'Alice' })           // single
const users = await User.create([{ name: 'Alice' }, { name: 'Bob' }])  // multiple

// UPDATE
await User.updateOne({ _id: id }, { $set: { name: 'Alice2' } })
await User.findByIdAndUpdate(id, { $set: { name: 'Alice2' } }, { new: true })
                                                              // ↑ {new: true} returns the UPDATED doc

// Common update operators:
// $set    — set a field value
// $inc    — increment number ($inc: { views: 1 })
// $push   — push to array ($push: { tags: 'react' })
// $pull   — remove from array ($pull: { tags: 'react' })

// DELETE
await User.deleteOne({ _id: id })
await User.findByIdAndDelete(id)
```

---

## 6. Reading Query Params in Express

```js
// URL: GET /users?excludeId=ABC&limit=10
app.get('/users', async (req, res) => {
  const { excludeId, limit } = req.query
  // both are strings — convert with Number(limit) if needed
})

// URL params (the :colon ones)
// Route: GET /users/:id
app.get('/users/:id', async (req, res) => {
  const { id } = req.params
})

// Body (POST/PUT)
app.post('/users', async (req, res) => {
  const { name } = req.body   // needs app.use(express.json()) middleware
})
```

---

## 7. The Async/Await Pattern (MUST follow)

```js
app.get('/users', async (req, res) => {      // ← async!
  try {
    const users = await User.find({})        // ← await!
    res.json({ success: true, data: users })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'something broke' })
  }
})
```

**Without `async`** → `await` throws a syntax error.
**Without `await`** → you get back a Promise object, not the data. (`res.json(<Promise>)` returns nonsense.)
**Without `try/catch`** → unhandled rejections crash the server in production.

---

## 8. Common Real-World Recipes

### "Latest 20 posts by users I follow"
```js
await Post
  .find({ authorId: { $in: myFollowedUserIds } })
  .sort({ createdAt: -1 })
  .limit(20)
  .populate('authorId', 'name avatar')
```

### "Search users by name (case-insensitive partial match)"
```js
await User.find({
  name: { $regex: searchText, $options: 'i' }   // 'i' = case-insensitive
})
```

### "Users created in last 7 days"
```js
const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
await User.find({ createdAt: { $gte: lastWeek } })
```

### "Toggle a value in an array (like/unlike)"
```js
// add if missing, remove if present
const post = await Post.findById(id)
if (post.likes.includes(userId)) {
  await Post.updateOne({ _id: id }, { $pull: { likes: userId } })
} else {
  await Post.updateOne({ _id: id }, { $push: { likes: userId } })
}
```

---

## 9. Common Gotchas (interview traps)

1. **`find()` returns `[]` when nothing matches, not null.** Only `findOne()`/`findById()` return `null`.

2. **String IDs vs ObjectIds.** If you pass a string ID and Mongo expects an ObjectId, you'll get a `CastError`. `findById()` auto-converts; manual queries don't. Use `new mongoose.Types.ObjectId(stringId)` when in doubt.

3. **Cannot mix include/exclude in `.select()`** — except `_id` is always allowed to be excluded with `-_id`.

4. **Validation on `updateOne` doesn't run by default.** Add `{ runValidators: true }` option.

5. **Mongoose pluralizes model names** — `mongoose.model('User', ...)` creates the `users` collection. Surprising at first.

---

## 10. Interview Talking Points

- *"I use `$ne` to exclude the current user at query time so MongoDB can use the `_id` index — faster than fetching all and filtering in Node."*
- *"I chain `.select()` to return only the fields the frontend needs, reducing bandwidth and avoiding leaking sensitive fields like password hashes."*
- *"For pagination I use `.skip().limit()` — though for large datasets cursor-based pagination with `_id > lastSeen` is more efficient because skip is O(n)."*
- *"I always wrap async route handlers in try/catch and use a centralized error middleware to avoid duplicating error responses."*

---

**Bookmark this file. Re-read before backend interviews.**
