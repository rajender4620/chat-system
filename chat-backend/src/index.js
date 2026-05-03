import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
/** @type {import('mongoose').Model} */
import Message from './models/Message.js'
/** @type {import('mongoose').Model} */
import User from './models/User.js'

dotenv.config();

const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

//'mongodb+srv://rajender4620_db_user:kpm03mY6XzL7cSAQ@cluster0.yvqebx9.mongodb.net/chat-system'
// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
    });


app.get('/', (req, res) => {
    res.send('Hello World')
})


app.post('/send-message', async (req, res) => {

    const { senderId, receiverId, message } = req.body;

    if (!senderId || !receiverId || !message) {
        return res.status(400).json({ message: 'Missing fields' });

    }
    try {
        const newMessage = await Message.create({
            senderId,
            receiverId,
            message
        });

        res.json({
            success: true,
            message: 'Message sent successfully',
            data: newMessage
        });
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
})




app.get('/get-messages', async (req, res) => {
    const { senderId, receiverId } = req.query;

    if (!senderId || !receiverId) {
        return res.status(400).json({
            'error': 'Missing fields'
        })
    }

    try {
        const chat = await Message.find({
            $or: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId }
            ]
        }).sort({ timestamp: 1 });

        res.json({
            success: true,
            data: chat
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});


app.post("/users", async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Missing fields' });
    }

    try {
        const user = await User.create(
            {
                name
            }
        );

        res.status(201).json(
            {
                success: true,
                message: 'User created successfully',
                data: user
            }
        );
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }

});



app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000')
})