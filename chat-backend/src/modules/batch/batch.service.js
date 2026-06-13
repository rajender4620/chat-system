import Batch from "../../models/Batch.js";
import User from "../../models/User.js";
import { AppError } from "../../utils/AppError.js";

export async function createbatch(id, userId, { name, description, teacher, schedule }) {

    if (!id) throw new AppError('Course not found', 404)
    if (!name || !teacher) throw new AppError('Missing fields', 400)   // ← move up

    const teacherUser = await User.findById(teacher)                    // now safe
    if (!teacherUser || teacherUser.role !== 'teacher') {
        throw new AppError('Assigned user is not a teacher', 400)
    }

    const batchCreated = await Batch.create(
        {
            name: name,
            description: description,
            teacher: teacher,
            schedule: schedule,
            courseId: id,
            createdBy: userId
        }
    )

    return batchCreated;

}


export async function getbatches(role, userId) {
    if (role === 'admin') {
        return await Batch.find({}).populate('teacher', 'name email').populate('courseId', 'title')
    } else {
        return await Batch.find({ teacher: userId }).populate('teacher', 'name email').populate('courseId', 'title')
    }
}

export async function editBatch(batchId, { name, description, schedule, teacherId }) {
    const update = {}
    if (name !== undefined) update.name = name
    if (description !== undefined) update.description = description
    if (schedule !== undefined) update.schedule = schedule
    if (teacherId) {
        const teacherUser = await User.findById(teacherId)
        if (!teacherUser || teacherUser.role !== 'teacher') {
            throw new AppError('Assigned user is not a teacher', 400)
        }
        update.teacher = teacherId
    }

    const updated = await Batch.findByIdAndUpdate(batchId, update,
        {
            new: true,
            runValidators: true
        })
    if (!updated) {
        throw new AppError('Batch not found', 404)
    }

    return updated
}



