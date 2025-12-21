import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all origins for simplicity in dev
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Webhook for Laravel to trigger events
app.post('/api/broadcast', (req, res) => {
    const { event, data } = req.body;

    if (event && data) {
        console.log(`Broadcasting event: ${event}`, data);
        io.emit(event, data);
        return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Missing event or data' });
});

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = 3001; // Use 3001 to avoid conflicts
httpServer.listen(PORT, () => {
    console.log(`Socket.IO server running on port ${PORT}`);
});
