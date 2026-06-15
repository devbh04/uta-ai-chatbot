"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, ShieldAlert, CheckCircle2, User, Loader2, ArrowRight, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Session {
  session_id: string;
  consumer_name: string;
  status: "active" | "handed_off" | "taken_over" | "resolved";
  started_at: string;
  handoff_summary?: string | null;
  assigned_agent?: string | null;
  duration_minutes?: number;
}

export function ChatsTab({
  onSelectSession
}: {
  onSelectSession: (sessionId: string, mode: "view" | "takeover") => void;
}) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/sessions");
      if (!res.ok) throw new Error("Failed to load sessions");
      const data = await res.json();
      setSessions(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch sessions from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000); // Poll every 5s for updates
    return () => clearInterval(interval);
  }, []);

  const handleTakeover = async (sessionId: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/sessions/${sessionId}/takeover`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_name: "Agent Smith" })
      });

      if (!res.ok) throw new Error("Takeover failed");
      fetchSessions();
      onSelectSession(sessionId, "takeover");
    } catch (err) {
      console.error(err);
      alert("Failed to take over chat session.");
    }
  };

  const getStatusBadge = (status: Session["status"]) => {
    switch (status) {
      case "active":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-0">AI Active</Badge>;
      case "handed_off":
        return <Badge variant="warning" className="border-transparent flex items-center gap-1"><Radio className="h-3 w-3 animate-pulse text-amber-700" /> Handoff Queue</Badge>;
      case "taken_over":
        return <Badge variant="success" className="border-transparent">Agent Active</Badge>;
      case "resolved":
        return <Badge variant="outline" className="text-muted-foreground border-muted bg-transparent">Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-foreground">Live Support Center</h2>
          <p className="text-xs text-muted-foreground">Monitor and manage guest conversation sessions.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSessions} className="text-xs h-8">
          Refresh List
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 p-3 rounded-md text-xs border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-secondary/40 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                <th className="p-3">Customer</th>
                <th className="p-3">Session ID</th>
                <th className="p-3">Status</th>
                <th className="p-3">Escalation Summary</th>
                <th className="p-3">Duration</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-muted-foreground">
                    No active sessions found.
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.session_id} className="hover:bg-secondary/10 transition-colors">
                    <td className="p-3 font-medium text-foreground flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-secondary text-primary flex items-center justify-center font-bold text-[10px]">
                        {session.consumer_name.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{session.consumer_name}</span>
                    </td>
                    <td className="p-3 font-mono font-semibold text-muted-foreground">{session.session_id}</td>
                    <td className="p-3">{getStatusBadge(session.status)}</td>
                    <td className="p-3 max-w-[200px] truncate text-muted-foreground italic">
                      {session.handoff_summary || "None"}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {session.duration_minutes !== undefined ? `${session.duration_minutes}m` : "N/A"}
                    </td>
                    <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[10px]"
                        onClick={() => onSelectSession(session.session_id, "view")}
                      >
                        View Chat
                      </Button>
                      {session.status === "handed_off" && (
                        <Button
                          variant="default"
                          size="sm"
                          className="h-7 px-2.5 text-[10px] bg-amber-600 hover:bg-amber-700"
                          onClick={() => handleTakeover(session.session_id)}
                        >
                          Take Over <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      )}
                      {session.status === "taken_over" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 px-2.5 text-[10px]"
                          onClick={() => onSelectSession(session.session_id, "takeover")}
                        >
                          Join Chat
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
