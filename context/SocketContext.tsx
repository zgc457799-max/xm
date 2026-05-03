
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
    socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode, user: any, token: string | null }> = ({ children, user, token }) => {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (token && user?.id) {
            // Initialize socket connection
            // Use relative path to work with Vite proxy and production URL
            const socketUrl = '/'; 
            console.log('Connecting to socket at:', socketUrl);

            const newSocket = io(socketUrl, {
                path: '/socket.io',
                auth: { token },
                transports: ['websocket', 'polling'], // Allow polling as fallback
            });

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
            });

            newSocket.on('connect_error', (err) => {
                console.error('Socket connection error:', err);
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        } else {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
        }
    }, [token, user?.id]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};
