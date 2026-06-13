import * as enrollService from './enroll.service.js'


export async function studentEnroll(req, res) {
    const batchId = req.params.id;
    const { studentId } = req.body;
    const enrolled = await enrollService.studentEnroll(batchId, { studentId })
    res.status(201).json({
        success: true,
        data: enrolled
    })

}