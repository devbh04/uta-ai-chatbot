"use client";

import React, { useState } from "react";
import { RotateCcw, CheckCircle2, ExternalLink, ChevronRight } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ReturnPolicyCard({
  policy_summary,
  return_window,
  eligible_conditions,
  process_steps,
  return_link,
  onAction
}: {
  policy_summary: string;
  return_window: string;
  eligible_conditions: string[];
  process_steps: string[];
  return_link?: string;
  onAction?: (text: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"summary" | "eligibility" | "process">("summary");

  return (
    <Card className="w-full max-w-md bg-white border border-border shadow-xs overflow-hidden">
      <div className="bg-primary/5 px-4 py-3 border-b border-border flex items-center gap-2">
        <RotateCcw className="text-primary h-5 w-5" />
        <span className="font-semibold text-sm text-primary">Returns & Exchanges Policy</span>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-border text-xs">
        {(["summary", "eligibility", "process"] as const).map((tab) => (
          <button
            key={tab}
            className={cn(
              "flex-1 py-2 text-center font-medium capitalize border-b-2 transition-colors",
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <CardContent className="p-4 min-h-[160px] text-sm">
        {activeTab === "summary" && (
          <div className="space-y-3">
            <p className="text-muted-foreground text-xs leading-relaxed">{policy_summary}</p>
            <div className="bg-secondary/40 p-2.5 rounded-md border border-border/50 flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">Return Window:</span>
              <Badge variant="secondary" className="font-semibold text-[10px]">
                {return_window}
              </Badge>
            </div>
          </div>
        )}

        {activeTab === "eligibility" && (
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Eligible Conditions
            </span>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {eligible_conditions.map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === "process" && (
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Step-by-Step Return Process
            </span>
            <ol className="space-y-1.5 text-xs text-muted-foreground">
              {process_steps.map((step, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="font-bold text-primary shrink-0">{idx + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-3 border-t border-border/50 bg-secondary/10 flex justify-between gap-2">
        {return_link && (
          <a
            href={return_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium"
          >
            Online Portal <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {onAction && (
          <Button
            size="sm"
            className="text-xs h-8 ml-auto"
            onClick={() => onAction("I would like to initiate a return")}
          >
            Start Return Request <ChevronRight className="h-3 w-3" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
