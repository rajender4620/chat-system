import jwt from 'jsonwebtoken'
/**
 * Auth middleware. Runs BEFORE protected route handlers.
 * WHY exists: a token verified here is the ONLY trusted source of "who is calling".
 * Route handlers should read req.userId from this, never from req.body / req.query —
 * otherwise an authenticated user could impersonate another by passing their ID (IDOR).
 */
function requireAuth(req, res, next) {
    // WHY split on space: industry convention "Authorization: Bearer <token>"
    const authHeader = req.headers.authorization
    const token = authHeader?.split(' ')[1]

    if (!token) {
        return res.status(401).json({ error: 'No token provided' })
    }

    try {
        // WHY the JSDoc cast: jwt.verify's return type is `string | JwtPayload`.
        // Casting tells TS the payload shape we put in at signing time.
        const decoded = /** @type {{ userId: string , role : string}} */ (
            jwt.verify(token, process.env.JWT_SECRET)
        )

        // WHY attach to req: makes the verified userId available to the route handler
        // — same trick as Express's own req.body via express.json() middleware.
        req.userId = decoded.userId
        // Role comes straight from the verified token (Option A) so requireRole can
        // authorize without a DB hit. Trade-off: stale until the token expires.
        req.userRole = decoded.role
        next()
    } catch (error) {
        // WHY catch: jwt.verify THROWS on invalid/expired/malformed tokens.
        // One catch covers all failure modes; client gets a clean 401.
        return res.status(401).json({ error: 'Invalid or expired token' })
    }
}

export default requireAuth;