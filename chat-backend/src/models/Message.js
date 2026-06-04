import mongoose from 'mongoose';


const messageSchema = new mongoose.Schema(
    {
        chatId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Chat',
            required: true
        },
        text: {
            type: String,
            required: true
        },
        sender: {
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            name: {
                type: String,
                required: true
            }
        },
    },
    {
        timestamps: true
    }
);


const Message = mongoose.model("Message", messageSchema);

// Fast "load messages in this chat, chronological"
messageSchema.index({ chatId: 1, createdAt: 1 })

export default Message;