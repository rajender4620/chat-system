import { Router } from 'express'
import requireAuth from '../../middleware/requireAuth.js';
import requireRole from '../../middleware/requireRole.js';
import * as batchController from './batch.controller.js';

const router = Router();

router.post('/batch/:id', requireAuth, requireRole('admin'), batchController.createbatch)

export default router;