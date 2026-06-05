import Course from '../../models/Course.js'
import { AppError } from '../../utils/AppError.js'

/**
 * COURSE SERVICE — pure logic. No req/res. Returns data or throws AppError.
 */
export async function createCourse({ title, description, createdBy }) {
    // Validate here so the rule lives with the logic, not the HTTP layer.
    if (!title) {
        throw new AppError('Missing fields: title is required', 400)
    }

    const course = await Course.create({ title, description, createdBy })
    return course
}

export async function allCourses() {
    const courses = await Course.find().populate('createdBy', 'name');
    return courses;
}


export async function updateCourse(id, { title, description }) {

    const updated = await Course.findByIdAndUpdate(
        id, {
        title, description
    }, {
        new: true, runValidators: true
    }
    )
    if (!updated) {
        throw new AppError('Course Not found', 404)
    }
    return updated
}


export async function deleteCourse(id,) {
    const deleted = await Course.findByIdAndDelete(id)
    if (!deleted) {
        throw new AppError('Course Not found', 404)
    }
    return deleted
}
