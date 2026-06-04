import mongoose from 'mongoose';
import { type } from 'node:os';

const chatSchema = new mongoose.Schema(

    {

        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            }
        ],
        // Cached on the chat for fast sidebar preview
        lastMessage: {
            text: { type: String, default: '' },
            senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
            createdAt: { type: Date, default: null },
        },

        // For sorting sidebar by most-recent
        lastActivity: { type: Date, default: Date.now },

    },
    { timestamps: true }

)

const Chat = mongoose.model("Chat", chatSchema)
// Compound index — sidebar query "find my chats sorted by recent"
chatSchema.index({ participants: 1, lastActivity: -1 })

export default Chat;