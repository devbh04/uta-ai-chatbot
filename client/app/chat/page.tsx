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
  Loader2,
  Plus,
  History,
  CheckCircle2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CardRenderer } from "@/components/chat/card-renderer";
import { Badge } from "@/components/ui/badge";
import { cn, formatMessageContent, API_URL, WS_URL } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/chat/markdown-renderer";

interface Message {
  role: "user" | "assistant" | "agent" | "system";
  content: any;
  timestamp: string;
  card_payload?: any;
}

export default function ChatPage() {
  const [userName, setUserName] = useState("");
  const [isNameEntered, setIsNameEntered] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);

  const [guestId, setGuestId] = useState<string>("");
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [isResolved, setIsResolved] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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

  // Load Past Sessions List
  const loadPastSessions = async (gId: string) => {
    if (!gId) return;
    try {
      const res = await fetch(`${API_URL}/api/sessions/guest/${gId}`);
      if (res.ok) {
        const data = await res.json();
        setPastSessions(data);
      }
    } catch (err) {
      console.error("Failed to load past sessions:", err);
    }
  };

  // Check Guest Account on Mount
  useEffect(() => {
    let savedGuestId = localStorage.getItem("guest_id");
    if (!savedGuestId) {
      savedGuestId = `GST-${Math.floor(100000 + Math.random() * 900000)}`;
      localStorage.setItem("guest_id", savedGuestId);
    }
    setGuestId(savedGuestId);

    const savedName = localStorage.getItem("guest_name");
    if (savedName) {
      setUserName(savedName);
    }

    loadPastSessions(savedGuestId);
  }, []);

  // Handle Session Initialization (New Chat Form Submission)
  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = userName.trim() || `Guest-${Math.floor(1000 + Math.random() * 9000)}`;
    setUserName(name);
    setLoadingSession(true);

    try {
      // POST to backend api
      const res = await fetch(`${API_URL}/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consumer_name: name, guest_id: guestId })
      });

      if (!res.ok) throw new Error("Failed to create session");
      const data = await res.json();
      setSessionId(data.session_id);
      setIsNameEntered(true);
      setIsResolved(false);
      setMessages([]);
      
      // Save name to localStorage
      localStorage.setItem("guest_name", name);
      
      // Refresh list
      loadPastSessions(guestId);
    } catch (err) {
      console.error("Session creation error:", err);
      // Fallback
      const mockSessionId = `SES-MOCK-${Math.floor(100000 + Math.random() * 900000)}`;
      setSessionId(mockSessionId);
      setIsNameEntered(true);
      setIsResolved(false);
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

  // Create New Session (Inside Chat Interface)
  const handleCreateNewSession = async () => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    if (!userName.trim()) {
      setIsNameEntered(false);
      setSessionId(null);
      setMessages([]);
      setIsResolved(false);
      return;
    }

    setLoadingSession(true);
    setIsMobileSidebarOpen(false);

    try {
      const res = await fetch(`${API_URL}/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consumer_name: userName, guest_id: guestId })
      });

      if (!res.ok) throw new Error("Failed to create session");
      const data = await res.json();
      setSessionId(data.session_id);
      setMessages([]);
      setIsResolved(false);
      setIsNameEntered(true);
      
      loadPastSessions(guestId);
    } catch (err) {
      console.error("Failed to start new session:", err);
      alert("Failed to start a new chat session.");
    } finally {
      setLoadingSession(false);
    }
  };

  // Load and Resume past session
  const handleSelectSession = async (sId: string) => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    setLoadingSession(true);
    setIsMobileSidebarOpen(false);

    try {
      const res = await fetch(`${API_URL}/api/sessions/${sId}`);
      if (!res.ok) throw new Error("Failed to load session");
      const data = await res.json();
      setUserName(data.consumer_name);
      setSessionId(data.session_id);
      setMessages(data.messages || []);
      setIsResolved(data.status === "resolved");
      setIsNameEntered(true);
    } catch (err) {
      console.error("Error loading session:", err);
      alert("Failed to load conversation history.");
    } finally {
      setLoadingSession(false);
    }
  };

  // Handle WebSocket Connection
  useEffect(() => {
    if (!sessionId || !isNameEntered) return;

    // Connect to backend WS
    const wsUrl = `${WS_URL}/ws/consumer/${sessionId}`;
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
        } else if (data.type === "status_change") {
          if (data.status === "resolved") {
            setIsResolved(true);
            loadPastSessions(guestId);
          } else {
            setIsResolved(false);
          }
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
  }, [sessionId, isNameEntered, guestId]);

  // Send message
  const handleSendMessage = (textToSend?: string) => {
    if (isResolved) return;
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

  // Reusable Sidebar Contents
  const renderSidebarContents = () => (
    <>
      <div>
        {/* Brand header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/15">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center text-white font-bold text-sm">
              NS
            </div>
            <span className="font-bold text-xs text-foreground tracking-wide uppercase">Your Chats</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 hover:bg-secondary cursor-pointer"
            onClick={handleCreateNewSession}
            title="Start New Conversation"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Session lists */}
        <div className="p-3 space-y-2 overflow-y-auto max-h-[calc(100vh-140px)]">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold px-2 uppercase tracking-wider">
            <span>Support History</span>
            <Badge variant="outline" className="text-[9px] py-0 px-1.5">{pastSessions.length}</Badge>
          </div>
          
          <div className="space-y-1.5 mt-2">
            {pastSessions.map((session) => {
              const isActiveSession = session.session_id === sessionId;
              return (
                <button
                  key={session.session_id}
                  onClick={() => handleSelectSession(session.session_id)}
                  className={cn(
                    "w-full text-left p-2.5 rounded-md transition-all flex flex-col gap-1 border cursor-pointer",
                    isActiveSession
                      ? "bg-primary/10 text-primary border-primary/20 shadow-xs"
                      : "bg-transparent text-foreground border-transparent hover:bg-secondary/35"
                  )}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-semibold text-xs truncate max-w-[130px]">
                      {session.consumer_name}
                    </span>
                    <span className="text-[8px] font-mono text-muted-foreground shrink-0 bg-secondary px-1 py-0.2 rounded-xs">
                      {session.session_id}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center w-full text-[9px] text-muted-foreground mt-0.5">
                    <span>
                      {new Date(session.started_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[7px] px-1 py-0 capitalize shrink-0",
                        session.status === "active" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                        session.status === "handed_off" && "bg-amber-50 text-amber-700 border-amber-200",
                        session.status === "taken_over" && "bg-blue-50 text-blue-700 border-blue-200",
                        session.status === "resolved" && "bg-gray-50 text-gray-600 border-gray-200"
                      )}
                    >
                      {session.status === "taken_over" ? "Live Agent" : session.status}
                    </Badge>
                  </div>
                </button>
              );
            })}
            
            {pastSessions.length === 0 && (
              <p className="text-[11px] text-muted-foreground text-center py-6">
                No past conversations.
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer info */}
      <div className="p-3 border-t border-border bg-secondary/15 text-[10px] text-muted-foreground flex flex-col gap-1.5 shrink-0">
        <div className="flex justify-between">
          <span>Guest Browser ID:</span>
          <span className="font-mono">{guestId}</span>
        </div>
        <Link href="/">
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground justify-start h-7 px-1.5 text-[10px]">
            <ArrowLeft className="mr-1 h-3 w-3" /> Back to Portal
          </Button>
        </Link>
      </div>
    </>
  );

  // Name Entry / Loading Prompt View
  if (!isNameEntered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
        <Card className="w-full max-w-4xl border border-border shadow-md bg-white">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-border">
              {/* Left Column: Start Chat */}
              <div className="space-y-4 pb-6 md:pb-0 md:pr-6">
                <div className="text-center md:text-left space-y-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto md:mx-0">
                    <Compass className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                    Start a New Chat
                  </CardTitle>
                  <p className="text-xs text-muted-foreground font-medium">
                    Start a fresh support session with North Star assistant.
                  </p>
                </div>

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
                        Start Conversation <ArrowRight className="ml-1 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </div>

              {/* Right Column: Past Conversations */}
              <div className="pt-6 md:pt-0 md:pl-6 space-y-4">
                <div>
                  <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                    Recent Conversations
                  </CardTitle>
                  <p className="text-xs text-muted-foreground font-medium">
                    Resume any of your active or past support chats.
                  </p>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {pastSessions.map((session) => (
                    <button
                      key={session.session_id}
                      onClick={() => handleSelectSession(session.session_id)}
                      className="w-full text-left p-3 rounded-lg border border-border bg-secondary/15 hover:bg-secondary/40 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="min-w-0 flex-grow">
                        <p className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                          {session.consumer_name}
                          <span className="text-[9px] text-muted-foreground font-mono font-normal">
                            ({session.session_id})
                          </span>
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                          Started: {new Date(session.started_at).toLocaleDateString([], { month: "short", day: "numeric" })} at {new Date(session.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[8px] px-1.5 py-0 capitalize",
                            session.status === "active" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                            session.status === "handed_off" && "bg-amber-50 text-amber-700 border-amber-200",
                            session.status === "taken_over" && "bg-blue-50 text-blue-700 border-blue-200",
                            session.status === "resolved" && "bg-gray-50 text-gray-600 border-gray-200"
                          )}
                        >
                          {session.status === "taken_over" ? "Live Agent" : session.status}
                        </Badge>
                      </div>
                    </button>
                  ))}
                  {pastSessions.length === 0 && (
                    <div className="h-full flex items-center justify-center py-12 text-center border border-dashed border-border rounded-lg bg-secondary/5">
                      <p className="text-xs text-muted-foreground">No recent conversations on this browser.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="text-center pt-6 border-t border-border mt-6">
              <Link
                href="/"
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" /> Back to Landing Page
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen max-h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* DESKTOP LEFT SIDEBAR: SUPPORT HISTORY */}
      <aside className="w-72 bg-white border-r border-border flex flex-col justify-between shrink-0 hidden md:flex">
        {renderSidebarContents()}
      </aside>

      {/* MOBILE DRAWERS */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40" onClick={() => setIsMobileSidebarOpen(false)} />
          
          {/* Drawer container */}
          <aside className="relative w-72 bg-white flex flex-col justify-between h-full shadow-lg z-50 animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="absolute top-4 right-4 h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center border border-border rounded-full hover:bg-secondary/40"
            >
              <X className="h-3 w-3" />
            </button>
            {renderSidebarContents()}
          </aside>
        </div>
      )}

      {/* RIGHT SIDE: CHAT AREA */}
      <div className="flex flex-col flex-grow overflow-hidden h-screen bg-background relative">
        {/* Top Header */}
        <header className="bg-white border-b border-border px-4 py-3 flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:hidden hover:bg-secondary cursor-pointer"
              onClick={() => setIsMobileSidebarOpen(true)}
              title="Show Support History"
            >
              <History className="h-4 w-4" />
            </Button>
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
                  {isConnected ? (isResolved ? "Conversation Resolved" : "Real-time Support Active") : "Disconnected"}
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
                  <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed font-medium">
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

                  <div className={cn("flex flex-col gap-1.5 max-w-[85%] sm:max-w-[70%]", isUser ? "items-end" : "items-start")}>
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

                    {msg.content && (
                      <div
                        className={cn(
                          "rounded-lg px-4 py-2.5 text-sm shadow-xs leading-relaxed break-words border",
                          isUser
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-white text-foreground border-border"
                        )}
                      >
                        {isUser ? (
                          formatMessageContent(msg.content)
                        ) : (
                          <MarkdownRenderer content={formatMessageContent(msg.content)} />
                        )}
                      </div>
                    )}

                    {msg.card_payload && (
                      <div className="w-full mt-1.5 transition-all duration-300 transform scale-100 origin-top-left">
                        <CardRenderer payload={msg.card_payload} onAction={handleSendMessage} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

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
        <footer className="bg-white border-t border-border p-4 shrink-0 shadow-sm relative">
          {isResolved && (
            <div className="absolute inset-0 bg-emerald-50/95 flex items-center justify-center gap-2 text-xs font-bold text-emerald-800 animate-in fade-in duration-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>This support session has been resolved. You can start a new chat in the history sidebar.</span>
            </div>
          )}
          <div className="max-w-3xl mx-auto flex gap-2">
            <Input
              placeholder={isConnected ? "Type a message to North Star support..." : "System disconnected..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              className="bg-secondary/20 focus:bg-white transition-colors"
              disabled={!isConnected || isResolved}
            />
            <Button
              onClick={() => handleSendMessage()}
              className="shrink-0"
              disabled={!inputValue.trim() || !isConnected || isResolved}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
