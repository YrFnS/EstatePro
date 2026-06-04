"use client";

import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import {
  MessageCircle,
  Send,
  Search,
  ArrowLeft,
  Check,
  CheckCheck,
  Loader2,
  MessageSquare,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Types
interface ConversationUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
}

interface ConversationParticipant {
  id: string;
  userId: string;
  joinedAt: string;
  user: ConversationUser;
}

interface LastMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

interface Conversation {
  id: string;
  propertyId: string | null;
  createdAt: string;
  updatedAt: string;
  participants: ConversationParticipant[];
  lastMessage: LastMessage | null;
  unreadCount: number;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: string;
  sender?: ConversationUser;
}

// Demo user ID (since we don't have auth, use a stored ID)
function getCurrentUserId(): string {
  if (typeof window === "undefined") return "demo-user";
  let userId = localStorage.getItem("estatepro-user-id");
  if (!userId) {
    userId = `user-${Date.now()}`;
    localStorage.setItem("estatepro-user-id", userId);
  }
  return userId;
}

function getCurrentUserName(): string {
  if (typeof window === "undefined") return "Guest";
  return localStorage.getItem("estatepro-user-name") || "Guest";
}

function formatTime(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t("messaging.now");
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatMessageTime(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString(locale === "ar" ? "ar-SA" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessagingPage() {
  const { t, locale, dir } = useI18n();
  const { params, navigate } = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [typingUser, setTypingUser] = useState<{ userId: string; userName: string } | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("demo-user");
  const [currentUserName, setCurrentUserName] = useState("Guest");

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize user ID
  useEffect(() => {
    setCurrentUserId(getCurrentUserId());
    setCurrentUserName(getCurrentUserName());
  }, []);

  // Initialize Socket.IO
  useEffect(() => {
    const socket = io({
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("new-message", (message: Message) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      // Refresh conversations list
      fetchConversations();
    });

    socket.on("user-typing", (data: { userId: string; userName: string; isTyping: boolean }) => {
      if (data.isTyping) {
        setTypingUser({ userId: data.userId, userName: data.userName });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
      } else {
        setTypingUser(null);
      }
    });

    socket.on("messages-read", (data: { userId: string; messageIds: string[] }) => {
      setMessages((prev) =>
        prev.map((m) =>
          data.messageIds.includes(m.id) ? { ...m, read: true } : m
        )
      );
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  // Join conversation room when selected
  useEffect(() => {
    if (selectedConversation && socketRef.current) {
      socketRef.current.emit("join-conversation", selectedConversation.id);
      return () => {
        socketRef.current?.emit("leave-conversation", selectedConversation.id);
      };
    }
  }, [selectedConversation]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations?userId=${currentUserId}`);
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Check for agentId/propertyId params to start a conversation
  useEffect(() => {
    const startConversationWithAgent = async () => {
      const agentId = params.agentId;
      const propertyId = params.propertyId;

      if (!agentId) return;

      try {
        // Create or get conversation
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participantIds: [currentUserId, agentId],
            propertyId: propertyId || null,
          }),
        });
        const data = await res.json();

        if (data.conversation) {
          setSelectedConversation(data.conversation);
          setShowMobileChat(true);
          // Fetch messages for this conversation
          fetchMessages(data.conversation.id);
          // Refresh list
          fetchConversations();

          if (!data.existed) {
            toast.success(
              t("messaging.newConversationCreated")
            );
          }
        }
      } catch {
        toast.error(
          t("messaging.failedCreateConversation")
        );
      }
    };

    if (currentUserId !== "demo-user" || params.agentId) {
      startConversationWithAgent();
    }
  }, [params.agentId, params.propertyId, currentUserId, locale]);

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}`);
      const data = await res.json();
      if (data.conversation) {
        setMessages(data.conversation.messages || []);
        // Mark as read
        await fetch(`/api/conversations/${conversationId}/messages`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUserId }),
        });
      }
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Handle selecting a conversation
  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowMobileChat(true);
    fetchMessages(conversation.id);
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    const content = messageInput.trim();
    setMessageInput("");
    setSendingMessage(true);

    try {
      // Save to DB
      const res = await fetch(
        `/api/conversations/${selectedConversation.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderId: currentUserId,
            content,
          }),
        }
      );
      const data = await res.json();

      if (data.message) {
        // Emit via socket for real-time
        socketRef.current?.emit("send-message", {
          conversationId: selectedConversation.id,
          senderId: currentUserId,
          content,
          message: data.message,
        });

        // Add to local messages
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });

        // Refresh conversations
        fetchConversations();
      }
    } catch {
      toast.error(
        t("messaging.failedSendMessage")
      );
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle typing indicator
  const handleTyping = (isTyping: boolean) => {
    if (!selectedConversation || !socketRef.current) return;
    socketRef.current.emit("typing", {
      conversationId: selectedConversation.id,
      userId: currentUserId,
      userName: currentUserName,
      isTyping,
    });
  };

  // Get other participant in a conversation
  const getOtherParticipant = (conversation: Conversation): ConversationUser | null => {
    const other = conversation.participants.find(
      (p) => p.userId !== currentUserId
    );
    return other?.user || null;
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const other = getOtherParticipant(conv);
    if (!other) return false;
    return other.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const otherParticipant = selectedConversation
    ? getOtherParticipant(selectedConversation)
    : null;

  // Loading state
  if (loading) {
    return (
      <div className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[600px] rounded-xl" />
            <Skeleton className="h-[600px] lg:col-span-2 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-12" dir={dir}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <MessageCircle className="w-7 h-7 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">{t("messaging.title")}</h1>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-6 rounded-xl overflow-hidden lg:overflow-visible border border-border lg:border-0">
          {/* Conversation List */}
          <div
            className={cn(
              "lg:border lg:rounded-xl lg:bg-card",
              showMobileChat ? "hidden lg:block" : "block"
            )}
          >
            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("messaging.searchConversations")}
                  className="ps-9"
                />
              </div>
            </div>

            {/* Conversation Items */}
            <div className="max-h-[600px] overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">
                    {t("messaging.noConversations")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("messaging.noConversationsDesc")}
                  </p>
                  <Button
                    className="mt-4 btn-gold gap-2"
                    onClick={() => navigate("agents")}
                  >
                    <Home className="w-4 h-4" />
                    {t("messaging.browseAgents")}
                  </Button>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const other = getOtherParticipant(conv);
                  const isSelected = selectedConversation?.id === conv.id;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={cn(
                        "w-full flex items-center gap-3 p-4 text-start transition-colors hover:bg-accent/50 border-b border-border/50",
                        isSelected && "bg-accent/50"
                      )}
                    >
                      <Avatar className="w-11 h-11 shrink-0">
                        <AvatarImage
                          src={
                            other?.avatar ||
                            `https://placehold.co/80x80/e2e8f0/64748b?text=${encodeURIComponent(
                              other?.name?.[0] || "?"
                            )}`
                          }
                        />
                        <AvatarFallback>
                          {other ? getInitials(other.name) : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm truncate">
                            {other?.name || "Unknown"}
                          </span>
                          {conv.lastMessage && (
                            <span className="text-xs text-muted-foreground shrink-0">
                              {formatTime(conv.lastMessage.createdAt, locale)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-muted-foreground truncate">
                            {conv.lastMessage
                              ? conv.lastMessage.content
                              : t("messaging.noMessages")}
                          </p>
                          {conv.unreadCount > 0 && (
                            <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 h-5 min-w-[20px] flex items-center justify-center shrink-0">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Panel */}
          <div
            className={cn(
              "lg:col-span-2 lg:border lg:rounded-xl lg:bg-card flex flex-col",
              showMobileChat ? "block" : "hidden lg:flex"
            )}
            style={{ height: "660px" }}
          >
            {selectedConversation && otherParticipant ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 p-4 border-b">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden h-8 w-8"
                    onClick={() => setShowMobileChat(false)}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <Avatar className="w-9 h-9">
                    <AvatarImage
                      src={
                        otherParticipant.avatar ||
                        `https://placehold.co/80x80/e2e8f0/64748b?text=${encodeURIComponent(
                          otherParticipant.name?.[0] || "?"
                        )}`
                      }
                    />
                    <AvatarFallback>
                      {getInitials(otherParticipant.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">
                      {otherParticipant.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {typingUser && typingUser.userId !== currentUserId
                        ? `${typingUser.userName} ${t("messaging.typing")}`
                        : otherParticipant.role === "agent"
                        ? t("messaging.online")
                        : t("messaging.offline")}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingMessages ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                      <MessageCircle className="w-12 h-12 text-muted-foreground/40 mb-3" />
                      <p className="text-sm text-muted-foreground">
                        {t("messaging.noMessages")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("messaging.startConversation")}
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.senderId === currentUserId;
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex gap-2",
                            isOwn ? "justify-end" : "justify-start"
                          )}
                        >
                          {!isOwn && (
                            <Avatar className="w-7 h-7 shrink-0 mt-1">
                              <AvatarImage
                                src={
                                  msg.sender?.avatar ||
                                  `https://placehold.co/80x80/e2e8f0/64748b?text=${encodeURIComponent(
                                    msg.sender?.name?.[0] || "?"
                                  )}`
                                }
                              />
                              <AvatarFallback className="text-[10px]">
                                {msg.sender
                                  ? getInitials(msg.sender.name)
                                  : "?"}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={cn(
                              "max-w-[70%] rounded-2xl px-4 py-2.5",
                              isOwn
                                ? "bg-primary text-primary-foreground rounded-ee-sm"
                                : "bg-muted rounded-es-sm"
                            )}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
                            <div
                              className={cn(
                                "flex items-center gap-1 mt-1",
                                isOwn ? "justify-end" : "justify-start"
                              )}
                            >
                              <span
                                className={cn(
                                  "text-[10px]",
                                  isOwn
                                    ? "text-primary-foreground/60"
                                    : "text-muted-foreground"
                                )}
                              >
                                {formatMessageTime(msg.createdAt, locale)}
                              </span>
                              {isOwn && (
                                msg.read ? (
                                  <CheckCheck className="w-3 h-3 text-primary-foreground/60" />
                                ) : (
                                  <Check className="w-3 h-3 text-primary-foreground/60" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Typing indicator */}
                  {typingUser && typingUser.userId !== currentUserId && (
                    <div className="flex items-center gap-2">
                      <Avatar className="w-7 h-7 shrink-0">
                        <AvatarFallback className="text-[10px]">
                          {typingUser.userName?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-2xl px-4 py-2.5 rounded-es-sm">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    <Input
                      value={messageInput}
                      onChange={(e) => {
                        setMessageInput(e.target.value);
                        handleTyping(true);
                      }}
                      onBlur={() => handleTyping(false)}
                      placeholder={t("messaging.typeMessage")}
                      className="flex-1"
                      disabled={sendingMessage}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!messageInput.trim() || sendingMessage}
                      className="shrink-0"
                    >
                      {sendingMessage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              /* No conversation selected */
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <MessageCircle className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h3 className="font-semibold text-lg mb-2">
                  {t("messaging.title")}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {t("messaging.selectConversation")}
                </p>
                <Button
                  className="mt-4 btn-gold gap-2"
                  onClick={() => navigate("agents")}
                >
                  <Home className="w-4 h-4" />
                  {t("messaging.browseAgents")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
