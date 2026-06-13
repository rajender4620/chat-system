import Batch from "../../models/Batch.js";
import Enroll from "../../models/Enroll.js";
import User from "../../models/User.js";
import { AppError } from "../../utils/AppError.js";

export async function studentEnroll(batchId, { studentId }) {

    if (!batchId || !studentId) throw new AppError('Missing fields', 400)

    const batch = await Batch.findById(batchId);
    if (!batch) throw new AppError('Not found', 404)

    const student = await User.findById(studentId)
    if (!student) throw new AppError('User not found', 404)
    if (student.role !== 'student') throw new AppError('User is not a student', 400)

    try {
        const enrollment = await Enroll.create({ batchId, studentId })
        return enrollment
    } catch (err) {
        console.log(err)  // unexpected → errorHandler → 500
    }
}