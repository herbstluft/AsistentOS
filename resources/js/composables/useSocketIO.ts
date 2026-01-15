import { ref, onMounted, onBeforeUnmount } from 'vue';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
const isConnected = ref(false);

export function useSocketIO() {
    const connect = () => {
        if (socket?.connected) {
            console.log('✅ Socket.IO ya está conectado');
            return socket;
        }

        console.log('🔌 Conectando a Socket.IO...');
        socket = io('http://localhost:3001', {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        socket.on('connect', () => {
            console.log('✅ Socket.IO conectado:', socket?.id);
            isConnected.value = true;
        });

        socket.on('disconnect', () => {
            console.log('❌ Socket.IO desconectado');
            isConnected.value = false;
        });

        socket.on('connect_error', (error: any) => {
            console.error('⚠️ Error de conexión Socket.IO:', error);
        });

        return socket;
    };

    const disconnect = () => {
        if (socket) {
            console.log('🔌 Desconectando Socket.IO...');
            socket.disconnect();
            socket = null;
            isConnected.value = false;
        }
    };

    const on = (event: string, callback: (...args: any[]) => void) => {
        if (!socket) {
            console.warn('⚠️ Socket no está conectado. Conectando...');
            connect();
        }
        socket?.on(event, callback);
    };

    const off = (event: string, callback?: (...args: any[]) => void) => {
        socket?.off(event, callback);
    };

    const emit = (event: string, data: any) => {
        socket?.emit(event, data);
    };

    return {
        isConnected,
        connect,
        disconnect,
        on,
        off,
        emit,
        socket: () => socket
    };
}
