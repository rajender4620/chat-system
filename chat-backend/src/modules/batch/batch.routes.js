import { Router } from 'express'
import requireAuth from '../../middleware/requireAuth.js';
import requireRole from '../../middleware/requireRole.js';
import * as batchController from './batch.controller.js';

const router = Router();

router.post('/batch/:id', requireAuth, requireRole('admin'), batchController.createbatch)

router.get('/batches', requireAuth, requireRole('admin', 'teacher',), batchController.getbatches)

router.patch('/batch/:id', requireAuth, requireRole('admin'), batchController.editBatch)

export default router;