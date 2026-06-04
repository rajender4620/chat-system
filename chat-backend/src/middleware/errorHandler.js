/**
 * GLOBAL ERROR HANDLER — the one place every error in the app ends up.
 *
 * WHY 4 arguments (err, req, res, next): Express identifies error-handling
 * middleware purely by its ARITY. A function with 4 params is treated as an
 * error handler; 3 params is normal middleware. Don't remove `next` even if unused.
 *
 * HOW errors reach here:
 *  - A route/controller throws or its returned promise rejects → Express 5
 *    automatically forwards it here (no try/catch needed in the controller).
 *  - Or any middleware calls next(err) explicitly.
 *
 * MUST be registered LAST in index.js, after all routes — Express runs middleware
 * top-to-bottom, so this only catches what the routes above it threw.
 */
export function errorHandler(err, req, res, next) {
    // If a response was already partially sent, hand off to Express's default handler.
    if (res.headersSent) {
        return next(err)
    }

    // AppError carries an intended statusCode (400/401/409...). Anything without one
    // is an UNEXPECTED fault → treat as 500.
    const statusCode = err.statusCode || 500

    // WHY only log 5xx loudly: 4xx are expected user errors (wrong password, missing
    // fields) — logging them on every request is noise. 5xx are real bugs you must see.
    if (statusCode >= 500) {
        console.error(`[${req.method} ${req.originalUrl}]`, err)
    }

    res.status(statusCode).json({ error: err.message || 'Internal Server Error' })
}
