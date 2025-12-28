import { io } from "socket.io-client";

// Singleton socket connection
// Use port 3001 as defined in socket_server.js
const URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export const socket = io(URL, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
});

socket.on('connect', () => {

});

socket.on('connect_error', (err: any) => {
    console.warn('Socket connection error:', err.message);
});
