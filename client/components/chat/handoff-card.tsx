"use client";

import React from "react";
import { UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function HandoffCard({
  summary,
  status,
  agent_name
}: {
  summary: string;
  status: string;
  agent_name?: string | null;
}) {
  const isConnected = status === "connected" || agent_name;

  return (
    <Card className={cn(
      "w-full max-w-md border shadow-xs overflow-hidden transition-all duration-300",
      isConnected 
        ? "border-emerald-200 bg-white" 
        : "border-amber-200 bg-amber-50/10"
    )}>
      <div className={cn(
        "px-4 py-3 border-b flex items-center justify-between",
        isConnected 
          ? "bg-emerald-50 text-emerald-950 border-emerald-100" 
          : "bg-amber-50/50 text-amber-950 border-amber-100"
      )}>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <UserCheck className="h-5 w-5 text-emerald-600" />
          ) : (
            <div className="h-2 w-2 rounded-full bg-amber-600 pulsate-amber shrink-0" />
          )}
          <span className="font-semibold text-sm">
            {isConnected ? "Support Agent Connected" : "Connecting to Agent"}
          </span>
        </div>
        <Badge variant={isConnected ? "success" : "warning"} className="text-[10px] font-bold">
          {isConnected ? "Live Support" : "In Queue"}
        </Badge>
      </div>

      <CardContent className="p-4 space-y-2.5">
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground block mb-0.5">Escalation Context</span>
          <p className="italic bg-secondary/30 border border-border/30 rounded-md p-2 text-[11px] leading-relaxed">
            &ldquo;{summary}&rdquo;
          </p>
        </div>

        {isConnected ? (
          <div className="p-3 bg-emerald-50/30 text-emerald-900 rounded-md border border-emerald-100/50 flex items-center gap-2.5 text-xs">
            <div className="h-7 w-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 uppercase">
              {agent_name?.slice(0, 2) || "AG"}
            </div>
            <div>
              <p className="font-bold">{agent_name || "Agent"}</p>
              <p className="text-[10px] text-muted-foreground">Support Representative is active</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2 bg-amber-50/20 text-amber-900 rounded-md border border-amber-100/30 text-xs">
            <span className="text-[10px] leading-normal text-muted-foreground animate-pulse">
              Please wait while we connect your session to our live human support team...
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
