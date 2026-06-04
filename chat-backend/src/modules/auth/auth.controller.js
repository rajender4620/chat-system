import * as authService from './auth.service.js'

/**
 * AUTH CONTROLLER — the HTTP-facing layer.
 * Unwrap the request → call the service → wrap the response.
 *
 * No try/catch here anymore. On Express 5, if an async handler's promise rejects
 * (i.e. the service throws an AppError), Express automatically forwards it to the
 * global errorHandler middleware — which logs it and sends the right status code.
 * One place handles every error instead of a try/catch in every function.
 */

export async function signup(req, res) {
    const result = await authService.signup(req.body)
    res.json({ success: true, ...result })
}

export async function login(req, res) {
    const result = await authService.login(req.body)
    res.json({ success: true, ...result })
}
