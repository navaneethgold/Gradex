import { Server } from "socket.io";
const Messaging = (server) => {
    const io = new Server(server, {
        cors: {
            origin: [
                "http://localhost:5173",
                "https://smart-quiz-app-two.vercel.app",
                "https://smart-quiz-app-e3c9.onrender.com"
            ],
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });
    io.use((socket, next) => {
        const userId = socket.handshake.auth.userId;
        console.log(userId);
        if (!userId) return next(new Error('Unauthorized'));
        socket.userId = userId;
        next();
    });
    const onlineUsers = new Map();
    io.on("connection", (socket) => {
        onlineUsers.set(socket.userId, socket.id);
        socket.on("join-room", ({ roomId }) => {
            socket.join(roomId);
        })
        socket.on("grp-message", async ({ username, newMsg, id }) => {
            console.log(`New message from ${username}: ${newMsg} to room ${id}`);
            io.to(id).emit('grp-message', {
                username, newMsg, id
            })
        })
    });
    return io;
}
export default Messaging;