import express from 'express'
import mongoose, { set } from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
/** @type {import('mongoose').Model} */
import Message from './models/Message.js'
/** @type {import('mongoose').Model} */
import User from './models/User.js'
import { createServer } from 'http'
import { Server } from 'socket.io'


const onlineUsers = new Set();
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



        // NEW: push the message to the receiver's room in real-time
        io.to(receiverId).emit('new-message', newMessage)
        console.log('Emitted new-message to room:', receiverId)


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



//Why CORS again?
//Express has its own CORS middleware (you set that up earlier). Socket.IO has its own separate CORS config because WebSocket upgrade requests bypass Express middleware entirely.

//The cors: { origin: '*' } allows the frontend (port 5173) to connect to the Socket.IO server (port 3000). In production you'd lock it to your real domain.

//Socket.IO needs the raw Node HTTP server, not Express's wrapper. Express runs ON TOP of HTTP — but Socket.IO needs to attach AT the HTTP level so it can intercept WebSocket upgrade requests.
//Both Express and Socket.IO share the same HTTP server.
// 1. Wrap the express app in a raw HTTP server
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: '*', //    // allow any origin (dev only — tighten later)
        methods: ['GET', 'POST'],
    }
})

// 3. Listen for connections
io.on('connection', (socket) => {
    // TODO 1: console.log when a user connects.
    //         Hint: socket.id is a unique ID auto-assigned to each connection.

    // 1. Log when a new connection opens
    console.log('User connected:', socket.id)

    socket.on('join', (userId) => {
        socket.join(userId)
        console.log(`Socket ${socket.id} joined room ${userId}`)
        socket.data.userId = userId
        onlineUsers.add(userId)
        io.emit('online-users', Array.from(onlineUsers)) // ← tell EVERYONE the new list

    })

    socket.on('typing', ({ to, from }) => {
        socket.to(to).emit('typing', { from })

    })
    socket.on('stop-typing', ({ to, from }) => {
        io.to(to).emit('stop-typing', { from })
    })



    // 2. Log when connection closes (browser closed, network drop, etc.)
    socket.on('disconnect', () => {
        if (socket.data.userId) {
            onlineUsers.delete(socket.data.userId)              // ← mark offline
            io.emit('online-users', Array.from(onlineUsers))
        }
        console.log('User disconnected:', socket.id)
    })
})


// 4. Listen on the HTTP server (NOT app.listen anymore!)

httpServer.listen(3000, () => {
    console.log('Server is running on http://localhost:3000')
});