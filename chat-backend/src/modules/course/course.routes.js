import { Router } from 'express'
import * as courseController from './course.controller.js'
import requireAuth from '../../middleware/requireAuth.js'
import requireRole from '../../middleware/requireRole.js'


const router = Router()

router.post('/courses', requireAuth, requireRole('admin'), courseController.createCourse)
router.get('/courses', requireAuth, courseController.allCourses)
router.patch('/courses/:id', requireAuth, requireRole('admin'), courseController.updateCourse)
router.delete('/courses/:id', requireAuth, requireRole('admin'), courseController.deleteCourse)



export default router