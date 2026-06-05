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
            course: id,
            createdBy: userId
        }
    )

    return batchCreated;



}