import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import Message from './models/Message.js'
import User from './models/User.js'
import { createServer } from 'http'
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import Chat from './models/Chat.js';
import requireAuth from './middleware/requireAuth.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import requireRole from './middleware/requireRole.js';
import courseRoutes from './modules/course/course.routes.js';
import batchRoutes from './modules/batch/batch.routes.js'
import enrollRoutes from './modules/enroll/enroll.routes.js'

// In-memory set of currently connected user IDs.
// WHY: tracking online status without a DB round-trip — flushed on server restart.
// In production you'd back this with Redis so it survives restarts + works across multiple instances.
const onlineUsers = new Set();


dotenv.config();
console.log(process.env.JWT_SECRET);
const JWT_SECRET = process.env.JWT_SECRET;

// WHY: fail fast at startup if the secret is missing.
// Without it, jwt.sign throws cryptic errors per-request instead of one clear startup error.
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is missing in .env');
}


const app = express();

// WHY cors(): the frontend runs on a different origin (different port in dev,
// different domain in prod). Browsers block cross-origin requests by default.
// This middleware adds the headers that tell the browser "yes, this is allowed".
app.use(cors())

// WHY express.json(): POST bodies arrive as raw bytes. This parses
// `Content-Type: application/json` bodies into req.body. Without it,
// req.body is undefined — the cause of "Cannot destructure 'name' of undefined" bugs.
app.use(express.json());


mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
    });


// Health-check / liveness probe. Useful for hosting platforms (Render, etc.) that ping the root.
app.get('/', (req, res) => {
    res.send('Hello World')
})


// Auth module — /sign-up and /login now live in modules/auth/*.
// WHY app.use here: mounts the auth Router so index.js no longer holds that logic.
app.use('/', authRoutes)

// Course module — /courses lives in modules/course/*.
app.use('/', courseRoutes)

app.use('/', batchRoutes)

app.use('/', enrollRoutes)


app.post('/send-message', requireAuth, async (req, res) => {
    const senderId = req.userId
    const { receiverId, message } = req.body;

    if (!senderId || !receiverId || !message) {
        return res.status(400).json({ message: 'Missing fields' });
    }

    try {
        // 1. Look up sender's name (for denormalization)
        const senderUser = await User.findById(senderId).select('name').lean()
        let chat = await Chat.findOne({
            participants: {
                $all: [
                    senderId, receiverId
                ]
            }
        })

        if (!chat) {
            chat = await Chat.create({
                participants: [
                    senderId, receiverId
                ]
            })
        }
        const created = await Message.create({
            chatId: chat._id, sender: {
                _id: senderId, name: senderUser.name
            }, text: message
        });
        // 4. Update the chat's cached preview + activity (for sidebar)
        chat.lastMessage = {
            text: message,
            senderId: new mongoose.Types.ObjectId(senderId),
            createdAt: new Date(),
        }
        chat.lastActivity = new Date()
        await chat.save()

        // 5. Push to receiver's room in real time
        const newMessage = created.toObject()
        io.to(receiverId).emit('new-message', newMessage)

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



app.get('/messages', requireAuth, async (req, res) => {
    try {
        const { chatId } = req.query;
        console.log(` gegg : ${chatId}`);

        const chat = await Chat.findById(chatId)
        if (!chat) return res.status(404).json({ error: 'Chat not found' })

        // Check the requester is in this chat's participants
        const isParticipant = chat.participants.some(p => p.equals(req.userId))
        if (!isParticipant) {
            return res.status(403).json({ error: 'Not a participant of this chat' })
        }

        const messages = await Message.find({
            chatId
        }).sort({ createdAt: 1 }).lean()
        console.log(messages)

        res.json({
            success: true,
            data: messages
        })



    } catch (error) {
        console.error('Error fetching messages:', error)
        res.status(500).json({ error: 'Failed to fetch messages' })
    }

})



app.get('/chats', requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const chats = await Chat.find({
            participants: {
                $in: [
                    userId
                ]
            }
        }).sort({
            lastActivity: -1
        }).populate('participants', 'name email').lean()

        res.json({ success: true, data: chats })

    } catch (error) {
        console.error('Error fetching chats:', error)
        res.status(500).json({ error: 'Failed to fetch chats' })
    }
})


app.patch('/users/:id/role', requireAuth, requireRole('admin'), async (req, res) => {
    try {

        const { role } = req.body;
        console.log(`role: ${role}`)
        const allowed = ['admin', 'teacher', 'student']
        if (!allowed.includes(role)) {
            return res.status(400).json({ error: 'Invalid role' })
        }

        const updated = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select('-password')
        if (!updated) return res.status(404).json({ error: 'User not found' })
        res.json({ success: true, data: updated })

    } catch (error) {
        console.error('Change role error:', error)
        res.status(500).json({ error: 'Failed to change role' })
    }

});

app.get('/get-messages', requireAuth, async (req, res) => {
    // WHY senderId from token, receiverId from query: same IDOR-prevention rule.
    // "Who I am" comes from the verified token; "who I'm chatting with" is a UI choice.
    const senderId = req.userId
    const { receiverId } = req.query

    try {

        if (!senderId || !receiverId) {
            return res.status(400).json({ error: 'Missing fields' })
        }

        // WHY $or with both directions: a conversation is bidirectional.
        // Messages were stored with whoever sent them as senderId, so we need BOTH
        // {senderId: me, receiverId: them} AND {senderId: them, receiverId: me}.
        const chat = await Message.find({
            $or: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId }
            ]
        })
            // WHY sort by createdAt ASC: chat messages display oldest at top, newest at bottom.
            .sort({ createdAt: 1 })
            .populate("senderId", "name")
            .populate("receiverId", "name");

        res.json({ success: true, data: chat, total: chat.length });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});


app.get('/users', requireAuth, async (req, res) => {
    try {
        // WHY .select('name email'): whitelist response fields.
        // Default Mongoose returns the FULL document — including the password hash.
        // Even hashed passwords shouldn't leak (offline brute-force risk).
        // WHY .lean(): plain JS objects — 2-3x faster serialization for read-only endpoints.
        const users = await User.find({}).select('name email role').lean();

        return res.json({ success: true, data: users });
    } catch (error) {
        console.error('Error fetching users:', error)
        res.status(500).json({ error: 'Failed to fetch users' })
    }
});


// Global error handler — MUST be last, after every route above.
// Anything a route throws (or a rejected promise on Express 5) lands here and gets
// logged + turned into a clean JSON response in ONE place.
app.use(errorHandler)


// ════════════════════════════════════════════════════════════════════════════
// HTTP server + Socket.IO
// ════════════════════════════════════════════════════════════════════════════

// WHY createServer(app): Socket.IO needs the raw Node HTTP server to attach to,
// because WebSocket connections start as HTTP "Upgrade" requests that bypass Express.
// Express is just an HTTP request handler; we wrap it manually so Socket.IO can share the same port.
const httpServer = createServer(app);

// WHY a separate cors config here: Socket.IO's WebSocket upgrade requests skip
// Express's middleware chain — including our app.use(cors()). Socket.IO needs its own.
const io = new Server(httpServer, {
    cors: {
        origin: '*',                          // dev only — lock to your real frontend in production
        methods: ['GET', 'POST'],
    }
})


/**
 * Socket.IO auth middleware.
 * WHY io.use: runs BEFORE the connection completes, on every connection attempt.
 * If we just verified inside io.on('connection'), the client would already be connected
 * and could fire events before we caught them. Middleware lets us reject upfront.
 */
io.use((socket, next) => {
    // WHY socket.handshake.auth: the client's `io(URL, { auth: { token } })` option lands here.
    const token = socket.handshake.auth?.token

    if (!token) {
        return next(new Error('No token provided'))
    }
    try {
        const decoded = /** @type {{ userId: string }} */ (
            jwt.verify(token, process.env.JWT_SECRET)
        )

        // WHY socket.data: per-socket trusted state, same idea as req.userId.
        // It survives the connection's lifetime and is accessible in every event handler.
        socket.data.userId = decoded.userId
        next()                                    // WHY next() with no args: allow the connection
    } catch (error) {
        next(new Error('Invalid or expired token'))    // WHY next(Error): rejects the connection
    }
})


io.on('connection', (socket) => {
    // userId is GUARANTEED here because io.use middleware rejected any unauthenticated socket.
    const userId = socket.data.userId
    console.log('User connected:', socket.id)

    // WHY socket.join(userId): puts this socket in a room named after the user.
    // Later, io.to(userId).emit(...) reaches only sockets in that room — targeted delivery.
    // If the user has multiple tabs, all their sockets land in the same room and receive together.
    socket.join(userId)
    onlineUsers.add(userId)

    // WHY io.emit (not io.to): broadcast the online list to ALL connected clients.
    // Everyone needs to see who came online — not targeted, so plain io.emit.
    io.emit('online-users', Array.from(onlineUsers))


    socket.on('typing', ({ to }) => {
        // WHY from = socket.data.userId (not from the client payload):
        // a user could send `{ to, from: 'someone-else' }` and spoof another user typing.
        // Always derive identity from the verified socket — same IDOR rule as REST.
        const from = socket.data.userId
        io.to(to).emit('typing', { from })
    })

    socket.on('stop-typing', ({ to }) => {
        const from = socket.data.userId
        io.to(to).emit('stop-typing', { from })
    })


    socket.on('disconnect', () => {
        // WHY remove + re-broadcast: keep online-users list accurate when users close their tabs.
        onlineUsers.delete(userId)
        io.emit('online-users', Array.from(onlineUsers))
        console.log('User disconnected:', socket.id)
    })
})


// WHY httpServer.listen (not app.listen): the HTTP server hosts BOTH Express and Socket.IO.
// app.listen would only start Express — Socket.IO would never accept WebSocket connections.
httpServer.listen(3000, () => {
    console.log('Server is running on http://localhost:3000')
});
