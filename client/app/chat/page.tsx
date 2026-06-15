"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Send,
  ArrowLeft,
  Sparkles,
  User,
  Compass,
  ArrowRight,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CardRenderer } from "@/components/chat/card-renderer";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant" | "agent" | "system";
  content: string;
  timestamp: string;
  card_payload?: any;
}

export default function ChatPage() {
  const [userName, setUserName] = useState("");
  const [isNameEntered, setIsNameEntered] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle Session Initialization
  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = userName.trim() || `Guest-${Math.floor(1000 + Math.random() * 9000)}`;
    setUserName(name);
    setLoadingSession(true);

    try {
      // POST to backend api
      const res = await fetch("http://localhost:8000/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consumer_name: name })
      });

      if (!res.ok) throw new Error("Failed to create session");
      const data = await res.json();
      setSessionId(data.session_id);
      setIsNameEntered(true);
    } catch (err) {
      console.error("Session creation error:", err);
      // Fallback in case of backend issues so the user can test the UI shell
      const mockSessionId = `SES-MOCK-${Math.floor(100000 + Math.random() * 900000)}`;
      setSessionId(mockSessionId);
      setIsNameEntered(true);
      setMessages([
        {
          role: "system",
          content: "Backend server connection failed. Running in demo mode.",
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoadingSession(false);
    }
  };

  // Handle WebSocket Connection
  useEffect(() => {
    if (!sessionId || !isNameEntered) return;

    // Connect to backend WS
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//localhost:8000/ws/consumer/${sessionId}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log("WebSocket connected for session:", sessionId);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WS Received:", data);

        if (data.type === "typing") {
          setIsTyping(data.is_typing);
        } else if (data.type === "message") {
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              role: data.role,
              content: data.content,
              timestamp: data.timestamp || new Date().toISOString(),
              card_payload: data.card_payload
            }
          ]);
        } else if (data.type === "system") {
          setMessages((prev) => [
            ...prev,
            {
              role: "system",
              content: data.content,
              timestamp: new Date().toISOString()
            }
          ]);
        }
      } catch (err) {
        console.error("Error parsing WS message:", err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log("WebSocket disconnected");
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [sessionId, isNameEntered]);

  // Send message
  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : inputValue;
    if (!text.trim()) return;

    // Add local user message immediately
    const userMsg: Message = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMsg]);

    if (textToSend === undefined) {
      setInputValue("");
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ content: text }));
    } else {
      // Demo response if backend is offline
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Demo Mode Active: You sent "${text}". To run fully, ensure MongoDB, Qdrant, and the FastAPI backend are active.`,
            timestamp: new Date().toISOString()
          }
        ]);
      }, 1500);
    }
  };

  const formatMessageTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "";
    }
  };

  // Name Entry Prompt
  if (!isNameEntered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border border-border shadow-md bg-white">
          <CardHeader className="text-center space-y-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Compass className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              North Star Outfitters
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Welcome to customer support. Tell us your name to start chat.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStartChat} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Your Name
                </label>
                <Input
                  placeholder="e.g. John Doe"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="bg-secondary/20 focus:bg-white transition-colors"
                  disabled={loadingSession}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={loadingSession}>
                {loadingSession ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    Start Support Session <ArrowRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
              <div className="text-center pt-2">
                <Link
                  href="/"
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" /> Back to Landing Page
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-h-screen bg-background text-foreground overflow-hidden">
      {/* Top Header */}
      <header className="bg-white border-b border-border px-4 py-3 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
              NS
            </div>
            <div>
              <h2 className="font-semibold text-sm leading-none flex items-center gap-1.5">
                North Star Assistant
                <Sparkles className="h-3.5 w-3.5 text-accent fill-accent" />
              </h2>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
                {isConnected ? "Real-time Support Active" : "Disconnected"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground hidden sm:inline">Session ID:</span>
          <span className="font-mono bg-secondary/70 border border-border px-2 py-0.5 rounded-sm font-semibold text-[10px]">
            {sessionId}
          </span>
        </div>
      </header>

      {/* Messages Workspace */}
      <div className="flex-grow overflow-y-auto px-4 py-6 space-y-4 custom-scrollbar bg-background">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <div className="h-12 w-12 bg-primary/5 rounded-full flex items-center justify-center text-primary/70">
                <Compass className="h-6 w-6 animate-spin" style={{ animationDuration: "12s" }} />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">Welcome to North Star support, {userName}!</p>
                <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed">
                  Ask me questions about orders, returns, refund status, or check out our product catalog. Try typing &ldquo;Recommend a winter jacket&rdquo; or &ldquo;Track ORD-001&rdquo;.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, index) => {
            const isUser = msg.role === "user";
            const isSystem = msg.role === "system";
            const isAgent = msg.role === "agent";

            if (isSystem) {
              return (
                <div key={index} className="flex justify-center my-2">
                  <span className="bg-amber-100/40 text-amber-900 border border-amber-200/50 text-[10px] px-3 py-1 rounded-full font-medium">
                    {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={index}
                className={cn("flex gap-2 max-w-full", isUser ? "justify-end" : "justify-start")}
              >
                {/* Avatar for non-user */}
                {!isUser && (
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-xs border",
                    isAgent
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "bg-white border-border text-primary"
                  )}>
                    {isAgent ? <User className="h-4 w-4" /> : "AI"}
                  </div>
                )}

                {/* Message Bubble + Card Content */}
                <div className={cn("flex flex-col gap-1.5 max-w-[85%] sm:max-w-[70%]", isUser ? "items-end" : "items-start")}>
                  {/* bubble name & role header */}
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground px-1">
                    <span className="font-semibold">{isUser ? userName : isAgent ? "Agent" : "North Star AI"}</span>
                    {isAgent && (
                      <Badge variant="success" className="text-[8px] font-bold px-1.5 py-0">
                        Live Representative
                      </Badge>
                    )}
                    <span>•</span>
                    <span>{formatMessageTime(msg.timestamp)}</span>
                  </div>

                  {/* Bubble Content */}
                  {msg.content && (
                    <div
                      className={cn(
                        "rounded-lg px-4 py-2.5 text-sm shadow-xs leading-relaxed break-words border",
                        isUser
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-white text-foreground border-border"
                      )}
                    >
                      {msg.content}
                    </div>
                  )}

                  {/* Render Card if payload exists */}
                  {msg.card_payload && (
                    <div className="w-full mt-1.5 transition-all duration-300 transform scale-100 origin-top-left">
                      <CardRenderer payload={msg.card_payload} onAction={handleSendMessage} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-2 items-center">
              <div className="h-8 w-8 rounded-full bg-white border border-border text-primary flex items-center justify-center text-xs font-bold shrink-0">
                AI
              </div>
              <div className="bg-white border border-border rounded-lg px-4 py-3 flex gap-1 items-center shadow-xs">
                <span className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Bar */}
      <footer className="bg-white border-t border-border p-4 shrink-0 shadow-sm">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Input
            placeholder={isConnected ? "Type a message to North Star support..." : "System disconnected..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            className="bg-secondary/20 focus:bg-white transition-colors"
            disabled={!isConnected}
          />
          <Button
            onClick={() => handleSendMessage()}
            className="shrink-0"
            disabled={!inputValue.trim() || !isConnected}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
