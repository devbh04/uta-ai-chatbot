"use client";

import React from "react";
import { HelpCircle, ChevronRight, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function HelpMenuCard({
  options,
  suggest_handoff,
  onAction
}: {
  options: string[];
  suggest_handoff?: boolean;
  onAction?: (text: string) => void;
}) {
  return (
    <Card className="w-full max-w-sm bg-white border border-border shadow-xs overflow-hidden">
      <div className="bg-primary/5 px-4 py-3 border-b border-border flex items-center gap-2">
        <HelpCircle className="text-primary h-5 w-5" />
        <div>
          <span className="font-semibold text-sm text-primary block leading-none">Support Options</span>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">How can we assist you today?</span>
        </div>
      </div>

      <CardContent className="p-3 space-y-2">
        <div className="flex flex-col gap-1.5">
          {options.map((option, idx) => (
            <button
              key={idx}
              className="flex justify-between items-center text-left text-xs bg-secondary/30 hover:bg-primary/10 border border-border/40 rounded-md py-2 px-3 transition-colors text-foreground font-medium cursor-pointer group"
              onClick={() => onAction && onAction(option)}
            >
              <span>{option}</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>

        {suggest_handoff && onAction && (
          <div className="border-t border-border/50 pt-2.5 mt-2 flex flex-col gap-1.5 text-xs text-muted-foreground">
            <div className="flex items-start gap-1.5 p-2 bg-amber-50/30 border border-amber-200/30 text-amber-950 rounded-md leading-relaxed text-[11px]">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>It looks like I might not be answering your question adequately. Would you like to connect directly with a representative?</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 border-amber-300 text-amber-800 hover:bg-amber-600 hover:text-white"
              onClick={() => onAction("Talk to a human agent")}
            >
              Talk to Human Agent
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
