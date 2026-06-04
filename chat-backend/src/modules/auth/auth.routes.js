import { Router } from 'express'
import * as authController from './auth.controller.js'

/**
 * AUTH ROUTES — maps URL + HTTP method to a controller function.
 * WHY a Router(): a mini Express app for just this module. index.js mounts it
 * with app.use(...), so all auth endpoints live together and index.js stays clean.
 *
 * Paths kept as /sign-up and /login (no /auth prefix) to match what the frontend
 * already calls. A cleaner REST design would namespace these under /auth/* and
 * update the frontend — a worthwhile later cleanup.
 */
const router = Router()

router.post('/sign-up', authController.signup)
router.post('/login', authController.login)

export default router
