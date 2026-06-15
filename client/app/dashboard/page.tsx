"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Package,
  Compass,
  ArrowLeft,
  X,
  Radio,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Volume2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatsTab } from "@/components/dashboard/chats-tab";
import { ChatViewer } from "@/components/dashboard/chat-viewer";
import { OrdersTab } from "@/components/dashboard/orders-tab";
import { ProductsTab } from "@/components/dashboard/products-tab";
import { cn, API_URL, WS_URL } from "@/lib/utils";

interface HandoffAlert {
  id: string;
  session_id: string;
  consumer_name: string;
  summary: string;
  timestamp: string;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"chats" | "orders" | "products" | "chat-viewer">("chats");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [chatViewerMode, setChatViewerMode] = useState<"view" | "takeover">("view");

  const [alerts, setAlerts] = useState<HandoffAlert[]>([]);
  const [isAlertsConnected, setIsAlertsConnected] = useState(false);
  const alertSocketRef = useRef<WebSocket | null>(null);

  // Play double tone chime using Web Audio API (no assets needed)
  const playSynthesizedChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);

      // C5 note
      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      
      // E5 note
      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start();
      osc1.stop(ctx.currentTime + 0.3);

      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.7);
    } catch (e) {
      console.error("Synthesizer error:", e);
    }
  };

  // Connect to Alert Websocket
  useEffect(() => {
    const url = `${WS_URL}/ws/dashboard/alerts`;
    const ws = new WebSocket(url);
    alertSocketRef.current = ws;

    ws.onopen = () => {
      setIsAlertsConnected(true);
      console.log("Global alert system socket connected.");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Dashboard Alert received:", data);

        if (data.type === "handoff_alert") {
          // Play audio sound
          playSynthesizedChime();

          // Push new persistent toast alert
          const newAlert: HandoffAlert = {
            id: `alert-${Date.now()}-${Math.random()}`,
            session_id: data.session_id,
            consumer_name: data.consumer_name,
            summary: data.summary,
            timestamp: data.timestamp || new Date().toISOString()
          };
          setAlerts((prev) => [newAlert, ...prev]);
        }
      } catch (err) {
        console.error("Error reading alert socket message:", err);
      }
    };

    ws.onclose = () => {
      setIsAlertsConnected(false);
      console.log("Global alert system socket closed.");
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleSelectSession = (sessionId: string, mode: "view" | "takeover") => {
    setSelectedSessionId(sessionId);
    setChatViewerMode(mode);
    setActiveTab("chat-viewer");
  };

  const handleDismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleTakeoverFromAlert = async (handoffAlert: HandoffAlert) => {
    try {
      const res = await fetch(`${API_URL}/api/sessions/${handoffAlert.session_id}/takeover`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_name: "Agent Smith" })
      });

      if (!res.ok) throw new Error("Takeover failed");
      // Dismiss alert & load viewer
      handleDismissAlert(handoffAlert.id);
      handleSelectSession(handoffAlert.session_id, "takeover");
    } catch (err) {
      console.error(err);
      alert("Failed to take over session from alert.");
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* LEFT SIDEBAR NAVBAR */}
      <aside className="w-64 bg-white border-r border-border flex flex-col justify-between shrink-0">
        <div>
          {/* Brand header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center text-white font-bold text-sm">
                NS
              </div>
              <span className="font-bold text-xs text-foreground tracking-wide uppercase">North Star Admin</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={cn("h-1.5 w-1.5 rounded-full", isAlertsConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 text-xs">
            <button
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-md font-semibold transition-colors cursor-pointer text-left",
                activeTab === "chats" || activeTab === "chat-viewer"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
              )}
              onClick={() => setActiveTab("chats")}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Live Chats</span>
              {isAlertsConnected && (
                <Radio className="h-3 w-3 ml-auto animate-pulse text-emerald-600" />
              )}
            </button>

            <button
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-md font-semibold transition-colors cursor-pointer text-left",
                activeTab === "orders"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
              )}
              onClick={() => setActiveTab("orders")}
            >
              <Package className="h-4 w-4" />
              <span>Order Management</span>
            </button>

            <button
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-md font-semibold transition-colors cursor-pointer text-left",
                activeTab === "products"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
              )}
              onClick={() => setActiveTab("products")}
            >
              <Compass className="h-4 w-4" />
              <span>Catalog Management</span>
            </button>
          </nav>
        </div>

        {/* Bottom panel */}
        <div className="p-3 border-t border-border bg-secondary/10 text-xs">
          <Link href="/">
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground justify-start h-8 px-2">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Portal
            </Button>
          </Link>
        </div>
      </aside>

      {/* CONTENT WORKSPACE */}
      <main className="flex-grow overflow-y-auto p-6 bg-secondary/15 relative">
        <div className="max-w-6xl mx-auto">
          {activeTab === "chats" && (
            <ChatsTab onSelectSession={handleSelectSession} />
          )}

          {activeTab === "chat-viewer" && selectedSessionId && (
            <ChatViewer
              sessionId={selectedSessionId}
              mode={chatViewerMode}
              onBack={() => setActiveTab("chats")}
            />
          )}

          {activeTab === "orders" && <OrdersTab />}

          {activeTab === "products" && <ProductsTab />}
        </div>
      </main>

      {/* PERSISTENT TOAST ALERTS OVERLAY LIST (Bottom-Right) */}
      {alerts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm space-y-2 pointer-events-none">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-amber-900 text-white rounded-lg shadow-lg border border-amber-800 p-4 pointer-events-auto transition-all duration-300 flex flex-col gap-2 scale-100"
            >
              {/* Alert Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-amber-300 animate-bounce" />
                  <span className="font-bold text-xs uppercase tracking-wider text-amber-300">
                    Escalation Handoff Request
                  </span>
                </div>
                <button
                  onClick={() => handleDismissAlert(alert.id)}
                  className="text-amber-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Alert Content */}
              <div className="text-xs space-y-1">
                <p className="font-semibold text-white">
                  Visitor: <span className="underline">{alert.consumer_name}</span> has requested human support.
                </p>
                <p className="text-amber-100 italic bg-amber-950/60 border border-amber-800/40 p-2 rounded-md leading-relaxed text-[11px]">
                  &ldquo;{alert.summary}&rdquo;
                </p>
              </div>

              {/* Alert Controls */}
              <div className="flex justify-between items-center text-[10px] mt-1 text-amber-300">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(alert.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <div className="space-x-1">
                  <Button
                    size="sm"
                    onClick={() => handleDismissAlert(alert.id)}
                    className="h-6 text-[9px] px-2 bg-transparent text-white border border-amber-700 hover:bg-amber-800/50"
                  >
                    Dismiss
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleTakeoverFromAlert(alert)}
                    className="h-6 text-[9px] px-2.5 bg-amber-400 text-amber-950 hover:bg-amber-300"
                  >
                    Take Over Chat <ChevronRight className="h-3 w-3 ml-0.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
