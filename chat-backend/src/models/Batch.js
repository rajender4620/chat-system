import mongoose from 'mongoose'

const batchSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
        },
        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        schedule: {
            type: String,
        },
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        }

    }, {
    timestamps: true
}
)

const Batch = mongoose.model('Batch', batchSchema);
export default Batch