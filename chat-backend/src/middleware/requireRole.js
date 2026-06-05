/**
 * AUTHORIZATION middleware FACTORY.
 *
 * Authentication ("who are you?") is handled by requireAuth.
 * Authorization ("are you ALLOWED?") is handled here.
 *
 * WHY a factory (a function that RETURNS a middleware): Express middleware has a
 * fixed signature (req, res, next) — you can't pass it an argument directly. So we
 * wrap it: requireRole('admin') runs the OUTER function, which returns the actual
 * middleware. That inner function is a CLOSURE — it remembers `allowedRoles`.
 *
 * WHY ...allowedRoles (rest param): lets a route accept multiple roles, e.g.
 * requireRole('admin', 'teacher').
 *
 * ORDER MATTERS: this reads req.userRole, which requireAuth sets. So always chain
 * requireAuth BEFORE requireRole:  requireAuth, requireRole('admin')
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        // req.userRole was set by requireAuth from the verified JWT.
        // If it's missing, the route wasn't protected by requireAuth first (a wiring bug),
        // or the token predates the role change → treat as forbidden.
        if (!req.userRole || !allowedRoles.includes(req.userRole)) {
            // WHY 403 (not 401): the caller IS authenticated (we know who they are),
            // they're just not permitted. 401 would wrongly imply "log in again".
            return res.status(403).json({ error: 'Forbidden: insufficient role' })
        }
        next()
    }
}

export default requireRole;
