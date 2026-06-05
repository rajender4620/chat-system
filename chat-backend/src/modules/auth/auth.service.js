import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../../models/User.js'
import { AppError } from '../../utils/AppError.js'

/**
 * AUTH SERVICE — pure business logic. NO `req`, NO `res` in this whole file.
 * Each function takes plain data in, RETURNS plain data out, or THROWS an AppError.
 * That's what makes it reusable (a route, a socket, a test, a script could all call it).
 */

/**
 * Build a signed JWT for a user.
 * WHY a private helper: both signup() and login() need the exact same token.
 * Writing it once means the payload + expiry can never drift apart between the two.
 * WHY read JWT_SECRET INSIDE the function (not at top of file): it's read at call-time,
 * by which point dotenv.config() in index.js has already populated process.env.
 * Reading it at module top-level would run at import-time — before dotenv — and bake in undefined.
 */
function signToken(userId, role) {
    return jwt.sign(
        { userId, role },                       // minimal payload — JWT is base64, NOT encrypted
        process.env.JWT_SECRET,
        { expiresIn: '7d' }               // limits blast radius if the token is stolen
    )
}

/**
 * WHY shape the public user explicitly: NEVER leak the password hash to the client.
 * Whitelisting the fields here means even hashed credentials can't escape by accident.
 */
function toPublicUser(user) {
    return { _id: user._id, name: user.name, email: user.email, role: user.role }
}

export async function signup({ name, email, password }) {
    // 1. Validate input. Missing fields = malformed request = 400 (not 401, that's auth).
    if (!name || !email || !password) {
        throw new AppError('Missing fields', 400)
    }

    // 2. Reject duplicates with a clean 409 instead of a raw Mongo duplicate-key error.
    const exists = await User.findOne({ email })
    if (exists) {
        throw new AppError('Email already in use', 409)
    }

    // 3. Hash the password. bcrypt is deliberately slow (cost 10 ≈ 100ms) to resist
    //    offline brute-force if the DB ever leaks. It also auto-salts.
    const hashed = await bcrypt.hash(password, 10)

    // 4. Persist.
    const user = await User.create({ name, email, password: hashed })

    // 5. Return data — the controller decides how to send it. No res here.
    return { token: signToken(user._id, user.role), user: toPublicUser(user) }
}

export async function login({ email, password }) {
    if (!email || !password) {
        throw new AppError('Missing fields', 400)
    }

    const user = await User.findOne({ email })

    // WHY the SAME 401 + message for "no user" and "wrong password":
    // prevents email enumeration — an attacker can't learn which emails are registered.
    if (!user) {
        throw new AppError('Invalid email or password', 401)
    }

    // bcrypt.compare re-hashes the input with the stored salt and checks equality.
    // (bcrypt is one-way — we can't decrypt the stored hash.)
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        throw new AppError('Invalid email or password', 401)
    }

    return { token: signToken(user._id, user.role), user: toPublicUser(user) }
}
