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


export async function getbatches(req, res) {
    const batches = await batchService.getbatches(req.userRole, req.userId);
    res.json({
        success: true,
        data: batches
    })
}


export async function editBatch(req, res) {
    const { name, description, schedule, teacherId } = req.body;
    const batchId = req.params.id;
    const batcheUpdated = await batchService.editBatch(batchId, { name, description, schedule, teacherId });
    res.json({
        success: true,
        data: batcheUpdated

    })
}

