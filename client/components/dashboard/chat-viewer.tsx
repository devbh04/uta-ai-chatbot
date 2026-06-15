"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, ArrowLeft, AlertCircle, ShieldAlert, CheckCircle2, Loader2, Sparkles, User, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CardRenderer } from "@/components/chat/card-renderer";
import { cn, formatMessageContent } from "@/lib/utils";

interface Message {
  role: "user" | "assistant" | "agent" | "system";
  content: any;
  timestamp: string;
  card_payload?: any;
}

interface SessionData {
  session_id: string;
  consumer_name: string;
  status: "active" | "handed_off" | "taken_over" | "resolved";
  started_at: string;
  handoff_summary?: string | null;
  assigned_agent?: string | null;
  messages: Message[];
}

export function ChatViewer({
  sessionId,
  mode,
  onBack
}: {
  sessionId: string;
  mode: "view" | "takeover";
  onBack: () => void;
}) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load history
  const loadHistory = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/sessions/${sessionId}`);
      if (!res.ok) throw new Error("Failed to load session history");
      const data = await res.json();
      setSession(data);
      setMessages(data.messages || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch conversation logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [sessionId]);

  // WebSocket Connection
  useEffect(() => {
    if (!sessionId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//localhost:8000/ws/dashboard/chat/${sessionId}`;
    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log("Dashboard viewer socket open for:", sessionId);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Dashboard WS received:", data);

        // When a message is mirrored, add it to the stream
        if (data.type === "message") {
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
        console.error("Error reading WS broadcast:", err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log("Dashboard viewer socket closed");
    };

    return () => {
      ws.close();
    };
  }, [sessionId]);

  // Send message
  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const msgContent = inputValue;
    setInputValue("");

    // Optimistically add agent message locally
    const agentMsg: Message = {
      role: "agent",
      content: msgContent,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, agentMsg]);

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "agent_message",
          content: msgContent,
          agent_name: "Agent Smith"
        })
      );
    } else {
      console.error("WebSocket not open. Can't send message.");
    }
  };

  // Resolve chat
  const handleResolveSession = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/sessions/${sessionId}/resolve`, {
        method: "PATCH"
      });
      if (!res.ok) throw new Error("Resolve failed");

      // Reload
      loadHistory();
      alert("Session marked as resolved.");
      onBack();
    } catch (err) {
      console.error(err);
      alert("Failed to mark session as resolved.");
    }
  };

  const handleTakeover = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/sessions/${sessionId}/takeover`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_name: "Agent Smith" })
      });

      if (!res.ok) throw new Error("Takeover failed");
      loadHistory();
    } catch (err) {
      console.error(err);
      alert("Failed to take over chat session.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  const isTakeOverMode = mode === "takeover" || session?.status === "taken_over";
  const isResolved = session?.status === "resolved";

  return (
    <div className="flex flex-col h-[600px] border border-border rounded-lg overflow-hidden bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border p-3 flex justify-between items-center shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 hover:bg-secondary">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="font-bold text-xs leading-none flex items-center gap-1.5">
              Chat: {session?.consumer_name}
              {isResolved && (
                <Badge variant="outline" className="text-[8px] py-0 px-1 border-muted text-muted-foreground bg-transparent">
                  Resolved
                </Badge>
              )}
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono leading-none block mt-0.5">
              {sessionId}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isTakeOverMode && !isResolved && (
            <Button
              variant="default"
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 h-7 text-[10px] px-2.5"
              onClick={handleTakeover}
            >
              Take Over Session
            </Button>
          )}

          {isTakeOverMode && !isResolved && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-700 border-red-200 hover:bg-red-50 hover:text-red-800 h-7 text-[10px] px-2.5"
              onClick={handleResolveSession}
            >
              Resolve Session
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={loadHistory}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {/* Escalation context block if available */}
      {session?.handoff_summary && (
        <div className="bg-amber-50 border-b border-amber-100 p-2.5 flex items-start gap-2 text-xs shrink-0">
          <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-950 block">Handoff Escalation context:</span>
            <p className="text-amber-900 leading-snug mt-0.5">{session.handoff_summary}</p>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-grow overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar bg-secondary/10">
        {messages.map((msg, index) => {
          const isUser = msg.role === "user";
          const isSystem = msg.role === "system";
          const isAgent = msg.role === "agent";

          if (isSystem) {
            return (
              <div key={index} className="flex justify-center my-1.5">
                <span className="bg-secondary px-2.5 py-0.5 rounded-full text-[9px] text-muted-foreground border border-border">
                  {msg.content}
                </span>
              </div>
            );
          }

          return (
            <div
              key={index}
              className={cn("flex gap-2 max-w-full", isUser ? "justify-start" : "justify-end")}
            >
              {!isUser && (
                <div className={cn(
                  "h-7 w-7 rounded-full text-[10px] flex items-center justify-center font-bold shrink-0 border shadow-xs order-last ml-1.5",
                  isAgent
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "bg-white border-border text-primary"
                )}>
                  {isAgent ? "AG" : "AI"}
                </div>
              )}
              {isUser && (
                <div className="h-7 w-7 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] font-bold shrink-0 mr-1.5">
                  {session?.consumer_name.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className={cn("flex flex-col gap-1 max-w-[80%]", isUser ? "items-start" : "items-end")}>
                <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground px-1">
                  <span className="font-semibold">{isUser ? session?.consumer_name : isAgent ? "Agent Smith (You)" : "North Star AI"}</span>
                  <span>•</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>

                {msg.content && (
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 text-xs leading-relaxed border shadow-xs",
                      isUser
                        ? "bg-white text-foreground border-border"
                        : isAgent
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-primary/10 text-primary border-primary/20"
                    )}
                  >
                    {formatMessageContent(msg.content)}
                  </div>
                )}

                {msg.card_payload && (
                  <div className="w-full mt-1">
                    <CardRenderer payload={msg.card_payload} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input controls */}
      {isTakeOverMode && !isResolved && (
        <footer className="bg-white border-t border-border p-3 shrink-0 flex gap-2">
          <Input
            placeholder="Type live reply to user..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            className="text-xs h-8 bg-secondary/20 focus:bg-white"
            disabled={!isConnected}
          />
          <Button
            size="sm"
            onClick={handleSendMessage}
            className="h-8"
            disabled={!inputValue.trim() || !isConnected}
          >
            <Send className="h-3 w-3" />
          </Button>
        </footer>
      )}

      {!isTakeOverMode && !isResolved && (
        <footer className="bg-secondary/40 border-t border-border p-3 text-center text-[10px] text-muted-foreground shrink-0 font-medium">
          Watching session. Click &ldquo;Take Over Session&rdquo; to send replies directly to customer.
        </footer>
      )}

      {isResolved && (
        <footer className="bg-emerald-50 text-emerald-800 border-t border-emerald-100 p-2.5 text-center text-[10px] shrink-0 font-semibold flex items-center justify-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> This session is resolved.
        </footer>
      )}
    </div>
  );
}
