import mongoose from 'mongoose';

const CourseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true

        },
        description: {
            type: String,

        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    },
    {
        timestamps: true
    }
)

const Course = mongoose.model("Course", CourseSchema)
export default Course;