import * as batchService from './batch.service.js'


export async function createbatch(req, res) {

    const { name, description, teacherId, schedule } = req.body;

    const batchCreated = await batchService.createbatch(req.params.id, req.userId, {
        name: name,
        description: description,
        teacher: teacherId,
        schedule: schedule
    })

    res.status(201).json({
        success: true,
        data: batchCreated
    })
}


