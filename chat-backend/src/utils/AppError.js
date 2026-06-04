/**
 * A custom Error that carries an HTTP status code.
 *
 * WHY this exists:
 * A service layer does pure logic — it has NO `res` object, so it cannot do
 * `res.status(409)`. But it still needs to tell the controller WHICH kind of
 * failure happened ("email taken" = 409, "bad password" = 401, "server blew up" = 500).
 *
 * Solution: the service THROWS an AppError carrying the right statusCode.
 * The controller CATCHES it and does `res.status(err.statusCode).json(...)`.
 *
 * This keeps the service HTTP-ignorant while still controlling the response.
 * (Flutter parallel: a custom Exception thrown from a repository, mapped to UI by the caller.)
 */
export class AppError extends Error {
    constructor(message, statusCode) {
        super(message)               // sets this.message (Error's built-in field)
        this.statusCode = statusCode // the controller reads this to set the HTTP status
        this.name = 'AppError'       // nicer stack traces / lets us check err.name later
    }
}
