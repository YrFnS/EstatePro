import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-conversation", (conversationId: string) => {
      socket.join(`conv-${conversationId}`);
      console.log(`Socket ${socket.id} joined conv-${conversationId}`);
    });

    socket.on("leave-conversation", (conversationId: string) => {
      socket.leave(`conv-${conversationId}`);
      console.log(`Socket ${socket.id} left conv-${conversationId}`);
    });

    socket.on("send-message", (data: { conversationId: string; senderId: string; content: string; message: any }) => {
      io.to(`conv-${data.conversationId}`).emit("new-message", data.message || {
        id: Date.now().toString(),
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content,
        createdAt: new Date().toISOString(),
        read: false,
      });
    });

    socket.on("typing", (data: { conversationId: string; userId: string; userName: string; isTyping: boolean }) => {
      socket.to(`conv-${data.conversationId}`).emit("user-typing", data);
    });

    socket.on("mark-read", (data: { conversationId: string; userId: string; messageIds: string[] }) => {
      socket.to(`conv-${data.conversationId}`).emit("messages-read", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO integrated on same port`);
  });
});
