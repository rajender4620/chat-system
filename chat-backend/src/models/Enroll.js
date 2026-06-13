import mongoose from "mongoose";

const enrollSchema = new mongoose.Schema(
    {
        batchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Batch",
            required: true,
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        }
    }
)


const Enroll = mongoose.model('Enroll', enrollSchema)
export default Enroll;