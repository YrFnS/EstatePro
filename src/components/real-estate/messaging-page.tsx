"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Home,
  Loader2,
  MessageCircle,
  MessageSquare,
  Search,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
import { cn } from "@/lib/utils";
import { AuthDialog } from "@/components/real-estate/auth-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface ConversationUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
}

interface Participant {
  id: string;
  userId: string;
  joinedAt: string;
  user: ConversationUser;
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

interface Conversation {
  id: string;
  propertyId: string | null;
  createdAt: string;
  updatedAt: string;
  participants: Participant[];
  lastMessage: Message | null;
  unreadCount: number;
}

function normalizeConversation(value: any): Conversation {
  return {
    id: value.id,
    propertyId: value.propertyId || null,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    participants: Array.isArray(value.participants) ? value.participants : [],
    lastMessage:
      value.lastMessage ||
      (Array.isArray(value.messages) && value.messages.length
        ? value.messages[0]
        : null),
    unreadCount: Number(value.unreadCount || 0),
  };
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function relativeTime(value: string, locale: string, nowLabel: string) {
  const elapsed = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(elapsed / 60_000);
  const hours = Math.floor(elapsed / 3_600_000);
  const days = Math.floor(elapsed / 86_400_000);

  if (!Number.isFinite(elapsed) || minutes < 1) return nowLabel;
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return new Date(value).toLocaleDateString(locale === "ar" ? "ar-IQ" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

function messageTime(value: string, locale: string) {
  return new Date(value).toLocaleTimeString(locale === "ar" ? "ar-IQ" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessagingPage() {
  const { t, locale, dir } = useI18n();
  const { params, navigate } = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [typingUser, setTypingUser] = useState<{ userId: string; userName: string } | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef("");
  const userId = user?.id || "";

  const otherUser = useCallback(
    (conversation: Conversation) =>
      conversation.participants.find((participant) => participant.userId !== userId)?.user || null,
    [userId]
  );

  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/conversations", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to load conversations");
      const next = (payload.conversations || []).map(normalizeConversation);
      setConversations(next);
      setSelected((current) =>
        current ? next.find((item: Conversation) => item.id === current.id) || current : null
      );
    } catch (error) {
      console.error(error);
      setConversations([]);
      toast.error(locale === "ar" ? "تعذر تحميل المحادثات" : "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, locale]);

  const loadThread = useCallback(
    async (conversationId: string) => {
      setThreadLoading(true);
      try {
        const response = await fetch(`/api/conversations/${conversationId}`, {
          cache: "no-store",
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Failed to load messages");

        const nextMessages: Message[] = payload.conversation?.messages || [];
        setMessages(nextMessages);
        const unreadIds = nextMessages
          .filter((message) => message.senderId !== userId && !message.read)
          .map((message) => message.id);

        if (unreadIds.length) {
          const markResponse = await fetch(`/api/conversations/${conversationId}/messages`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messageIds: unreadIds }),
          });
          if (markResponse.ok) {
            setMessages((current) =>
              current.map((message) =>
                unreadIds.includes(message.id) ? { ...message, read: true } : message
              )
            );
            socketRef.current?.emit("mark-read", { conversationId, messageIds: unreadIds });
            loadConversations();
          }
        }
      } catch (error) {
        console.error(error);
        setMessages([]);
        toast.error(locale === "ar" ? "تعذر تحميل الرسائل" : "Failed to load messages");
      } finally {
        setThreadLoading(false);
      }
    },
    [loadConversations, locale, userId]
  );

  useEffect(() => {
    if (!authLoading) loadConversations();
  }, [authLoading, loadConversations]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = io({ transports: ["websocket", "polling"], withCredentials: true });
    socket.on("new-message", (message: Message) => {
      setMessages((current) =>
        current.some((item) => item.id === message.id) ? current : [...current, message]
      );
      loadConversations();
    });
    socket.on("user-typing", (data: { userId: string; userName: string; isTyping: boolean }) => {
      if (!data.isTyping) {
        setTypingUser(null);
        return;
      }
      setTypingUser({ userId: data.userId, userName: data.userName });
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setTypingUser(null), 3_000);
    });
    socket.on("messages-read", (data: { messageIds: string[] }) => {
      if (!data.messageIds?.length) return;
      setMessages((current) =>
        current.map((message) =>
          data.messageIds.includes(message.id) ? { ...message, read: true } : message
        )
      );
    });
    socket.on("socket-error", (data: { message?: string }) => {
      if (data?.message) toast.error(data.message);
    });

    socketRef.current = socket;
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, loadConversations]);

  useEffect(() => {
    if (!selected || !socketRef.current) return;
    const conversationId = selected.id;
    socketRef.current.emit("join-conversation", conversationId);
    return () => {
      socketRef.current?.emit("leave-conversation", conversationId);
    };
  }, [selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const agentId = params.agentId;
    if (!isAuthenticated || !agentId) return;

    const key = `${agentId}:${params.propertyId || ""}`;
    if (startedRef.current === key) return;
    startedRef.current = key;

    const startConversation = async () => {
      try {
        const response = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId, propertyId: params.propertyId || null }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Failed to start conversation");

        const conversation = normalizeConversation(payload.conversation);
        setSelected(conversation);
        setMobileThreadOpen(true);
        await loadThread(conversation.id);
        await loadConversations();
        if (!payload.existed) toast.success(t("messaging.newConversationCreated"));
      } catch (error) {
        startedRef.current = "";
        toast.error(error instanceof Error ? error.message : t("messaging.failedCreateConversation"));
      }
    };

    startConversation();
  }, [isAuthenticated, loadConversations, loadThread, params.agentId, params.propertyId, t]);

  const selectConversation = useCallback(
    (conversation: Conversation) => {
      setSelected(conversation);
      setMobileThreadOpen(true);
      loadThread(conversation.id);
    },
    [loadThread]
  );

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      if (!selected) return;
      socketRef.current?.emit("typing", { conversationId: selected.id, isTyping });
    },
    [selected]
  );

  const sendMessage = useCallback(async () => {
    const content = draft.trim();
    if (!content || !selected || sending) return;

    setDraft("");
    setSending(true);
    try {
      const response = await fetch(`/api/conversations/${selected.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to send message");

      const message = payload.message as Message;
      setMessages((current) =>
        current.some((item) => item.id === message.id) ? current : [...current, message]
      );
      socketRef.current?.emit("send-message", {
        conversationId: selected.id,
        message: { id: message.id },
      });
      loadConversations();
    } catch (error) {
      setDraft(content);
      toast.error(error instanceof Error ? error.message : t("messaging.failedSendMessage"));
    } finally {
      setSending(false);
    }
  }, [draft, loadConversations, selected, sending, t]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((conversation) =>
      otherUser(conversation)?.name.toLowerCase().includes(query)
    );
  }, [conversations, otherUser, search]);

  const activeOtherUser = selected ? otherUser(selected) : null;

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Skeleton className="mb-6 h-10 w-56" />
        <div className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
          <Skeleton className="h-[640px] rounded-2xl" />
          <Skeleton className="h-[640px] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg rounded-3xl text-center">
          <CardContent className="p-10">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MessageCircle className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold">{t("messaging.title")}</h1>
            <p className="mt-3 text-muted-foreground">
              {locale === "ar"
                ? "سجّل الدخول لعرض رسائلك والتواصل بأمان مع الوكلاء."
                : "Sign in to view your messages and securely contact agents."}
            </p>
            <Button className="mt-6" onClick={() => setAuthDialogOpen(true)}>
              {t("auth.signIn")}
            </Button>
          </CardContent>
        </Card>
        <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12" dir={dir}>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
            <MessageCircle className="h-4 w-4" />
            {t("common.appName")}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t("messaging.title")}</h1>
        </div>
        <Button variant="outline" onClick={() => navigate("agents")} className="gap-2">
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">{t("messaging.browseAgents")}</span>
        </Button>
      </div>

      <div className="grid min-h-[660px] overflow-hidden rounded-2xl border bg-card shadow-sm lg:grid-cols-[340px_1fr]">
        <aside className={cn("border-e bg-background", mobileThreadOpen ? "hidden lg:block" : "block")}>
          <div className="border-b p-4">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("messaging.searchConversations")}
                className="ps-9"
              />
            </div>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            {!filtered.length ? (
              <div className="p-8 text-center">
                <MessageSquare className="mx-auto mb-3 h-11 w-11 text-muted-foreground/40" />
                <h2 className="font-semibold">{t("messaging.noConversations")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("messaging.noConversationsDesc")}</p>
              </div>
            ) : (
              filtered.map((conversation) => {
                const other = otherUser(conversation);
                const active = selected?.id === conversation.id;
                return (
                  <button
                    type="button"
                    key={conversation.id}
                    onClick={() => selectConversation(conversation)}
                    className={cn(
                      "flex w-full items-center gap-3 border-b p-4 text-start transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                      active && "bg-primary/5"
                    )}
                  >
                    <Avatar className="h-11 w-11 shrink-0">
                      {other?.avatar ? <AvatarImage src={other.avatar} alt={other.name} /> : null}
                      <AvatarFallback>{initials(other?.name || "?")}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold">
                          {other?.name || (locale === "ar" ? "مستخدم" : "User")}
                        </span>
                        {conversation.lastMessage ? (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {relativeTime(conversation.lastMessage.createdAt, locale, t("messaging.now"))}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-muted-foreground">
                          {conversation.lastMessage?.content || t("messaging.noMessages")}
                        </span>
                        {conversation.unreadCount > 0 ? (
                          <Badge className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px]">
                            {conversation.unreadCount}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className={cn("min-w-0 flex-col bg-card", mobileThreadOpen ? "flex" : "hidden lg:flex")}>
          {selected && activeOtherUser ? (
            <>
              <header className="flex items-center gap-3 border-b p-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setMobileThreadOpen(false)}
                  aria-label={t("common.back")}
                >
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                </Button>
                <Avatar className="h-10 w-10">
                  {activeOtherUser.avatar ? (
                    <AvatarImage src={activeOtherUser.avatar} alt={activeOtherUser.name} />
                  ) : null}
                  <AvatarFallback>{initials(activeOtherUser.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-semibold">{activeOtherUser.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {typingUser && typingUser.userId !== userId
                      ? `${typingUser.userName} ${t("messaging.typing")}`
                      : activeOtherUser.role === "agent"
                        ? locale === "ar" ? "وكيل عقاري" : "Real estate agent"
                        : t("messaging.online")}
                  </p>
                </div>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto p-4 md:p-6">
                {threadLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !messages.length ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <MessageCircle className="mb-3 h-12 w-12 text-muted-foreground/30" />
                    <p className="font-medium">{t("messaging.noMessages")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t("messaging.startConversation")}</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const own = message.senderId === userId;
                    return (
                      <div key={message.id} className={cn("flex", own ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[82%] rounded-2xl px-4 py-2.5 md:max-w-[70%]",
                            own
                              ? "rounded-ee-md bg-primary text-primary-foreground"
                              : "rounded-es-md bg-muted"
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                          <div
                            className={cn(
                              "mt-1 flex items-center gap-1 text-[10px]",
                              own ? "justify-end text-primary-foreground/65" : "text-muted-foreground"
                            )}
                          >
                            {messageTime(message.createdAt, locale)}
                            {own ? message.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" /> : null}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <footer className="border-t p-3 md:p-4">
                <div className="flex items-end gap-2">
                  <Input
                    value={draft}
                    onChange={(event) => {
                      setDraft(event.target.value);
                      emitTyping(Boolean(event.target.value));
                    }}
                    onBlur={() => emitTyping(false)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        emitTyping(false);
                        sendMessage();
                      }
                    }}
                    maxLength={4_000}
                    placeholder={t("messaging.typeMessage")}
                    disabled={sending}
                  />
                  <Button
                    size="icon"
                    onClick={() => {
                      emitTyping(false);
                      sendMessage();
                    }}
                    disabled={!draft.trim() || sending}
                    aria-label={t("messaging.sendMessage")}
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 rtl:rotate-180" />}
                  </Button>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MessageCircle className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-semibold">{t("messaging.selectConversation")}</h2>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
