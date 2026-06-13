import { Router } from 'express';
import requireAuth from '../../middleware/requireAuth.js';
import requireRole from '../../middleware/requireRole.js';
import * as controller from './enroll.controller.js'

const router = Router()

router.post('/batch/:id/enroll', requireAuth, requireRole('admin'), controller.studentEnroll)

export default router;