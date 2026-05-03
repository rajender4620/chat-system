import mongoose from 'mongoose';


const messageSchema = new mongoose.Schema(
    {
        message: String,
        senderId: String,
        senderName: String,
        receiverId: String,
        receiverName: String,
    },
    {
        timestamps: true
    }
);


const Message = mongoose.model("Message", messageSchema);
export default Message;