"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Brain, X, Send, MessageCircle, Sparkles, RotateCcw, AlertTriangle, Settings, TrendingUp, Home, DollarSign, MapPin, Building, Lightbulb, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n/provider";
import { useOpenRouterSettings } from "@/lib/openrouter-settings";
import { SUGGESTED_MODELS } from "@/lib/openrouter";
import { useRouter } from "@/lib/router";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const STORAGE_KEY = "estatepro-chat-history";
const MAX_MESSAGES = 50;

function loadMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed.slice(-MAX_MESSAGES);
    }
  } catch {
    // ignore
  }
  return [];
}

function saveMessages(messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)));
  } catch {
    // ignore
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateIfDifferent(timestamp: number, prevTimestamp: number | null): string | null {
  const date = new Date(timestamp);
  const prev = prevTimestamp ? new Date(prevTimestamp) : null;
  if (!prev || date.toDateString() !== prev.toDateString()) {
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  return null;
}

// Enhanced suggested questions with icons and categories
const suggestedQuestions = [
  {
    key: "findProperties",
    icon: Home,
    color: "text-primary",
    bgColor: "bg-primary/10",
    message: "I want to find a property. What's available in the $300K-$500K range?",
  },
  {
    key: "marketTrends",
    icon: TrendingUp,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    message: "What are the current market trends? Is it a good time to buy?",
  },
  {
    key: "mortgageHelp",
    icon: DollarSign,
    color: "text-amber-600",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    message: "Help me understand mortgage options and current interest rates.",
  },
  {
    key: "neighborhoodInfo",
    icon: MapPin,
    color: "text-rose-600",
    bgColor: "bg-rose-100 dark:bg-rose-900/30",
    message: "Tell me about the best neighborhoods for families with good schools.",
  },
  {
    key: "investmentAdvice",
    icon: Building,
    color: "text-violet-600",
    bgColor: "bg-violet-100 dark:bg-violet-900/30",
    message: "What are the best areas for real estate investment right now?",
  },
  {
    key: "pricingHelp",
    icon: Calculator,
    color: "text-sky-600",
    bgColor: "bg-sky-100 dark:bg-sky-900/30",
    message: "How do I determine a fair price for a property I'm interested in?",
  },
];

export function AIChatWidget() {
  const { t, dir, locale } = useI18n();
  const { navigate } = useRouter();
  const { settings: openRouterSettings } = useOpenRouterSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    const saved = loadMessages();
    if (saved.length > 0) {
      setMessages(saved);
    }
    setInitialized(true);
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (initialized) {
      saveMessages(messages);
    }
  }, [messages, initialized]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content: content.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        const chatHistory = [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-openrouter-key": openRouterSettings.apiKey || "",
            "x-openrouter-model": openRouterSettings.model || "google/gemini-2.0-flash-001",
          },
          body: JSON.stringify({ messages: chatHistory }),
        });

        const data = await response.json();

        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: data.reply || "I'm sorry, I couldn't process your request.",
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch {
        const errorMessage: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: "I'm currently unavailable. Please try again in a moment.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, openRouterSettings]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickAction = (message: string) => {
    sendMessage(message);
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    setShowClearConfirm(false);
  };

  // Get localized suggested questions
  const localizedSuggestions = suggestedQuestions.map((q) => ({
    ...q,
    text: t(`chat.${q.key}`) || q.key,
  }));

  // Show welcome message if no messages yet
  const showWelcome = messages.length === 0;

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-6 end-6 z-50"
          >
            <motion.button
              onClick={() => setIsOpen(true)}
              className="relative h-14 w-14 rounded-full shadow-lg flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 group"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Open AI Chat"
            >
              <MessageCircle className="w-6 h-6" />

              {/* AI Badge */}
              <span className="absolute -top-1 -end-1 bg-background text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border border-primary/30 z-10">
                AI
              </span>

              {/* Pulse animation */}
              <span className="absolute inset-0 rounded-full bg-primary/50 animate-ping opacity-20" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed z-50 shadow-2xl rounded-2xl overflow-hidden border border-border sm:w-[400px] w-[calc(100vw-32px)]"
            style={{
              bottom: "16px",
              [dir === "rtl" ? "left" : "right"]: "16px",
              height: "560px",
              maxHeight: "calc(100vh - 80px)",
            }}
          >
            <div className="h-full flex flex-col bg-background">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                      <Brain className="w-5 h-5" />
                    </div>
                    <span className="absolute -bottom-0.5 -end-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm leading-tight">{t("chat.title")}</h3>
                    <p className="text-[11px] text-primary-foreground/70 leading-tight">
                      {openRouterSettings.isConfigured
                        ? (SUGGESTED_MODELS.find(m => m.id === openRouterSettings.model)?.name || openRouterSettings.model)
                        : t("chat.notConfigured")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {messages.length > 0 && !showClearConfirm && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowClearConfirm(true)}
                      className="h-8 w-8 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/20"
                      title={t("chat.clearChat")}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  )}
                  {showClearConfirm && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearChat}
                        className="h-7 text-[11px] text-red-200 hover:text-white hover:bg-red-500/30 px-2"
                      >
                        {t("chat.confirm")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowClearConfirm(false)}
                        className="h-7 text-[11px] text-primary-foreground/70 hover:text-primary-foreground px-2"
                      >
                        {t("common.cancel")}
                      </Button>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setIsOpen(false); setShowClearConfirm(false); }}
                    className="h-8 w-8 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/20"
                    title={t("common.close")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-1 scroll-smooth"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "rgba(0,0,0,0.15) transparent",
                }}
              >
                {/* Welcome State */}
                {showWelcome && (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        {t("chat.greeting")}
                      </p>
                      <p className="text-xs text-muted-foreground max-w-[260px] leading-relaxed">
                        {t("chat.welcome")}
                      </p>
                    </div>
                    {!openRouterSettings.isConfigured && (
                      <div className="flex flex-col items-center gap-2 w-full max-w-[280px]">
                        <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {t("settings.configurePrompt")}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { navigate("settings"); setIsOpen(false); }}
                          className="text-xs border-primary/30 text-primary hover:bg-primary/10"
                        >
                          <Settings className="w-3 h-3 me-1" />
                          {t("settings.title")}
                        </Button>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 w-full max-w-[320px]">
                      {localizedSuggestions.slice(0, 4).map((question) => {
                        const Icon = question.icon;
                        return (
                          <button
                            key={question.key}
                            onClick={() => handleQuickAction(question.message)}
                            className="flex items-center gap-2 p-2.5 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-start group"
                          >
                            <div className={`w-7 h-7 rounded-lg ${question.bgColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                              <Icon className={`w-3.5 h-3.5 ${question.color}`} />
                            </div>
                            <span className="text-[11px] text-foreground/80 group-hover:text-foreground leading-tight line-clamp-2">
                              {question.text}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Messages */}
                {messages.map((message, index) => {
                  const prevTimestamp = index > 0 ? messages[index - 1].timestamp : null;
                  const dateSeparator = formatDateIfDifferent(message.timestamp, prevTimestamp);

                  return (
                    <div key={message.id}>
                      {/* Date separator */}
                      {dateSeparator && (
                        <div className="flex items-center gap-3 my-3">
                          <div className="flex-1 h-px bg-border" />
                          <span className="text-[10px] text-muted-foreground font-medium">{dateSeparator}</span>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                      )}
                      <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} mb-2`}>
                        <div className={`flex gap-2 max-w-[88%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                          {/* Avatar for assistant */}
                          {message.role === "assistant" && (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                              <Brain className="w-3.5 h-3.5" />
                            </div>
                          )}

                          <div className="flex flex-col">
                            <div
                              className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                                message.role === "user"
                                  ? "bg-primary text-primary-foreground rounded-ee-sm shadow-sm"
                                  : "bg-muted/80 text-foreground rounded-es-sm border border-border/50"
                              }`}
                            >
                              {message.content}
                            </div>
                            <span
                              className={`text-[10px] text-muted-foreground/70 mt-0.5 px-1 ${
                                message.role === "user" ? "text-end" : "text-start"
                              }`}
                            >
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Enhanced Typing Indicator */}
                {isLoading && (
                  <div className="flex justify-start mb-2">
                    <div className="flex gap-2 max-w-[88%]">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <Brain className="w-3.5 h-3.5" />
                      </div>
                      <div className="bg-muted/80 rounded-2xl rounded-es-sm border border-border/50 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <div
                              className="w-1.5 h-1.5 rounded-full bg-primary/60"
                              style={{
                                animation: "typingBounce 1.4s ease-in-out infinite",
                                animationDelay: "0ms",
                              }}
                            />
                            <div
                              className="w-1.5 h-1.5 rounded-full bg-primary/60"
                              style={{
                                animation: "typingBounce 1.4s ease-in-out infinite",
                                animationDelay: "0.2s",
                              }}
                            />
                            <div
                              className="w-1.5 h-1.5 rounded-full bg-primary/60"
                              style={{
                                animation: "typingBounce 1.4s ease-in-out infinite",
                                animationDelay: "0.4s",
                              }}
                            />
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {t("chat.thinking")}
                          </span>
                        </div>
                        <style jsx>{`
                          @keyframes typingBounce {
                            0%, 60%, 100% {
                              transform: translateY(0);
                              opacity: 0.4;
                            }
                            30% {
                              transform: translateY(-6px);
                              opacity: 1;
                            }
                          }
                        `}</style>
                      </div>
                    </div>
                  </div>
                )}

                {/* Suggested questions after AI response */}
                {!isLoading && messages.length > 0 && messages[messages.length - 1].role === "assistant" && (
                  <div className="mt-2 mb-1">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Lightbulb className="w-3 h-3 text-amber-500" />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        {t("chat.suggestedQuestions")}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {localizedSuggestions.slice(0, 4).map((question) => {
                        const Icon = question.icon;
                        return (
                          <button
                            key={question.key}
                            onClick={() => handleQuickAction(question.message)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-start"
                          >
                            <Icon className={`w-3 h-3 ${question.color} shrink-0`} />
                            <span className="text-[11px] text-foreground/80 hover:text-foreground line-clamp-1">
                              {question.text}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form
                onSubmit={handleSubmit}
                className="shrink-0 p-3 border-t border-border bg-background"
              >
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={t("chat.placeholder")}
                      disabled={isLoading}
                      className="w-full h-10 ps-4 pe-3 py-2 rounded-full border border-input bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 placeholder:text-muted-foreground transition-all"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    size="icon"
                    className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md disabled:opacity-50 shrink-0 transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
