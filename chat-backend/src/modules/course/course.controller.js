import * as courseService from './course.service.js'

/**
 * COURSE CONTROLLER — (req, res) only. Middleware (requireAuth/requireRole) live
 * in the route, NOT here. No try/catch: if the service throws, Express 5 forwards
 * it to the global errorHandler (which reads err.statusCode).
 */
export async function createCourse(req, res) {
    const course = await courseService.createCourse({
        title: req.body.title,
        description: req.body.description,
        createdBy: req.userId,            // set by requireAuth from the verified token
    })

    // 201 Created — we made a new resource.
    res.status(201).json({ success: true, data: course })
}



export async function allCourses(req, res) {
    const courses = await courseService.allCourses();
    res.json({
        success: true,
        data: courses
    })
}

export async function updateCourse(req, res) {
    const courseUpdated = await courseService.updateCourse(req.params.id, req.body);
    res.json({
        success: true,
        data: courseUpdated
    })
}

export async function deleteCourse(req, res) {
    const coursedeleted = await courseService.deleteCourse(req.params.id);
    res.json({
        success: true,
    })
}