import { createServer } from "node:http";
import next from "next";
import { decode } from "next-auth/jwt";
import { Server } from "socket.io";
import { db } from "./src/lib/db";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = Number.parseInt(process.env.PORT || "3000", 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return header.split(";").reduce<Record<string, string>>((cookies, part) => {
    const separator = part.indexOf("=");
    if (separator === -1) return cookies;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});
}

function getSessionToken(cookieHeader: string | undefined): string | null {
  const cookies = parseCookies(cookieHeader);
  return (
    cookies["__Secure-next-auth.session-token"] ||
    cookies["next-auth.session-token"] ||
    null
  );
}

async function isConversationMember(conversationId: string, userId: string) {
  const membership = await db.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    select: { id: true },
  });
  return Boolean(membership);
}

const configuredOrigins = [
  process.env.NEXTAUTH_URL,
  process.env.APP_URL,
  dev ? `http://localhost:${port}` : undefined,
].filter((value): value is string => Boolean(value));

app.prepare().then(() => {
  const httpServer = createServer((request, response) => {
    handle(request, response);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: configuredOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket, nextMiddleware) => {
    try {
      const secret = process.env.NEXTAUTH_SECRET;
      const token = getSessionToken(socket.handshake.headers.cookie);
      if (!secret || !token) {
        return nextMiddleware(new Error("Authentication required"));
      }

      const session = await decode({ token, secret });
      const userId =
        typeof session?.id === "string"
          ? session.id
          : typeof session?.sub === "string"
            ? session.sub
            : null;

      if (!userId) {
        return nextMiddleware(new Error("Authentication required"));
      }

      socket.data.userId = userId;
      socket.data.userName =
        typeof session?.name === "string" ? session.name : "User";
      return nextMiddleware();
    } catch {
      return nextMiddleware(new Error("Authentication required"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;

    socket.on("join-conversation", async (conversationId: unknown) => {
      if (typeof conversationId !== "string") return;
      if (!(await isConversationMember(conversationId, userId))) {
        socket.emit("socket-error", { message: "Conversation not found" });
        return;
      }
      await socket.join(`conv-${conversationId}`);
    });

    socket.on("leave-conversation", (conversationId: unknown) => {
      if (typeof conversationId === "string") {
        socket.leave(`conv-${conversationId}`);
      }
    });

    socket.on(
      "send-message",
      async (data: { conversationId?: unknown; message?: { id?: unknown } }) => {
        const conversationId = data?.conversationId;
        const messageId = data?.message?.id;
        if (typeof conversationId !== "string" || typeof messageId !== "string") {
          return;
        }
        if (!(await isConversationMember(conversationId, userId))) return;

        const message = await db.message.findFirst({
          where: {
            id: messageId,
            conversationId,
            senderId: userId,
          },
          include: {
            sender: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        });

        if (message) {
          io.to(`conv-${conversationId}`).emit("new-message", message);
        }
      }
    );

    socket.on(
      "typing",
      async (data: { conversationId?: unknown; isTyping?: unknown }) => {
        const conversationId = data?.conversationId;
        if (typeof conversationId !== "string") return;
        if (!(await isConversationMember(conversationId, userId))) return;

        socket.to(`conv-${conversationId}`).emit("user-typing", {
          userId,
          userName: socket.data.userName,
          isTyping: Boolean(data.isTyping),
        });
      }
    );

    socket.on(
      "mark-read",
      async (data: { conversationId?: unknown; messageIds?: unknown }) => {
        const conversationId = data?.conversationId;
        const messageIds = Array.isArray(data?.messageIds)
          ? data.messageIds.filter((id): id is string => typeof id === "string").slice(0, 500)
          : [];
        if (typeof conversationId !== "string") return;
        if (!(await isConversationMember(conversationId, userId))) return;

        await db.message.updateMany({
          where: {
            conversationId,
            senderId: { not: userId },
            read: false,
            ...(messageIds.length ? { id: { in: messageIds } } : {}),
          },
          data: { read: true },
        });

        socket.to(`conv-${conversationId}`).emit("messages-read", {
          userId,
          messageIds,
        });
      }
    );
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
