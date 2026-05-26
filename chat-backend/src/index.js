import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
/** @type {import('mongoose').Model} */
import Message from './models/Message.js'
/** @type {import('mongoose').Model} */
import User from './models/User.js'

dotenv.config();

const app = express();

app.use(cors())
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
        const created = await Message.create({
            senderId,
            receiverId,
            message
        });

        const newMessage = await Message.findById(created._id)
            .populate('senderId', 'name')
            .populate('receiverId', 'name')
            .lean()

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
        }).sort({ createdAt: 1 })
            .populate("senderId", "name")
            .populate("receiverId", "name");

        res.json({
            success: true,
            data: chat,
            total: chat.length

        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});


app.get('/users', async (req, res) => {
    try {
        const users = await User.find({},);

        return res.json({
            data: users,
            success: true

        });


    } catch (error) {
        console.log(`error fetching users ${error}`)
        res.status(500).json({
            error: 'Failed to fetch users'
        })
    }
});


// "Login or create" — looks up the user by name; creates them if missing.
// TEMPORARY pattern for the MVP. Phase 2 replaces this with proper JWT auth (signup + login + password).
app.post("/users", async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Missing fields' });
    }

    try {
        // Try to find first
        let user = await User.findOne({ name }).lean();

        // If not found, create
        if (!user) {
            const created = await User.create({ name });
            user = created.toObject();
        }

        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        console.error('Error in login-or-create:', error);
        res.status(500).json({ error: 'Failed to login or create user' });
    }

});



app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000')
})