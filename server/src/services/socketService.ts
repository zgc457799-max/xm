import partition, { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
    user?: any;
}

class SocketService {
    private static instance: SocketService;
    private io: Server | null = null;
    // Map userId -> socketId[] (allow multiple connections per user)
    private userSockets: Map<string, string[]> = new Map();

    private constructor() { }

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    public init(httpServer: HttpServer): void {
        this.io = new Server(httpServer, {
            cors: {
                origin: "*", // Adjust for production
                methods: ["GET", "POST"]
            }
        });

        this.io.use((socket: AuthenticatedSocket, next) => {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error("Authentication error"));
            }

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
                socket.user = decoded;
                next();
            } catch (err) {
                next(new Error("Authentication error"));
            }
        });

        this.io.on('connection', (socket: AuthenticatedSocket) => {
            console.log(`User connected: ${socket.user?.id} (${socket.id})`);

            if (socket.user?.id) {
                const userId = String(socket.user.id);
                const sockets = this.userSockets.get(userId) || [];
                sockets.push(socket.id);
                this.userSockets.set(userId, sockets);

                // Join a room for the user
                socket.join(`user:${userId}`);
            }

            socket.on('disconnect', () => {
                console.log(`User disconnected: ${socket.id}`);
                if (socket.user?.id) {
                    const userId = String(socket.user.id);
                    let sockets = this.userSockets.get(userId) || [];
                    sockets = sockets.filter(id => id !== socket.id);
                    if (sockets.length > 0) {
                        this.userSockets.set(userId, sockets);
                    } else {
                        this.userSockets.delete(userId);
                    }
                }
            });
        });

        console.log('Socket.io initialized');
    }

    public emitToUser(userId: string, event: string, data: any): void {
        if (this.io) {
            this.io.to(`user:${userId}`).emit(event, data);
        }
    }

    public emitToAll(event: string, data: any): void {
        if (this.io) {
            this.io.emit(event, data);
        }
    }
}

export default SocketService.getInstance();
