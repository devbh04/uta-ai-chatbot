"use client";

import React, { useState } from "react";
import { CheckCircle2, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
};

export function ReturnConfirmationCard({
  order_id,
  items,
  next_steps,
  refund_estimate
}: {
  order_id: string;
  items: Array<{ product_name: string; qty: number; price: number }>;
  next_steps: string[];
  refund_estimate: string;
}) {
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (idx: number) => {
    setCheckedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const totalRefund = items.reduce((acc, curr) => acc + curr.price * curr.qty, 0);

  return (
    <Card className="w-full max-w-md bg-white border border-border shadow-xs overflow-hidden">
      <div className="bg-emerald-50 text-emerald-950 px-4 py-3 border-b border-emerald-100 flex items-center gap-2">
        <CheckCircle2 className="text-emerald-600 h-5 w-5" />
        <div>
          <span className="font-semibold text-sm block leading-none">Return Authorized</span>
          <span className="text-[10px] text-emerald-700 font-mono mt-0.5 block">Order {order_id}</span>
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Estimated Refund */}
        <div className="bg-secondary/30 border border-border/60 rounded-md p-3 flex justify-between items-center text-xs">
          <div>
            <span className="text-muted-foreground block">Estimated Refund</span>
            <span className="text-emerald-700 font-mono font-bold text-base mt-0.5">
              {formatCurrency(totalRefund)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-muted-foreground block">Processing Speed</span>
            <span className="font-semibold text-foreground mt-0.5 block">{refund_estimate}</span>
          </div>
        </div>

        {/* Returned Items */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Items Scheduled for Return
          </span>
          <div className="space-y-1 bg-secondary/10 rounded-md p-2 border border-border/30 max-h-[80px] overflow-y-auto custom-scrollbar">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="text-foreground line-clamp-1 font-medium">{item.product_name}</span>
                <span className="text-muted-foreground shrink-0 ml-2">Qty {item.qty}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step checklist */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Instructions Checklist
          </span>
          <div className="space-y-2">
            {next_steps.map((step, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-start gap-2.5 p-2 rounded-md border text-xs cursor-pointer select-none transition-colors",
                  checkedSteps[idx]
                    ? "bg-emerald-50/20 border-emerald-200/50 text-muted-foreground"
                    : "bg-white border-border hover:bg-secondary/20"
                )}
                onClick={() => toggleStep(idx)}
              >
                <div
                  className={cn(
                    "h-4 w-4 rounded-sm border shrink-0 flex items-center justify-center transition-colors mt-0.5",
                    checkedSteps[idx]
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "border-border bg-white"
                  )}
                >
                  {checkedSteps[idx] && <Check className="h-3 w-3" />}
                </div>
                <span className={cn(checkedSteps[idx] && "line-through")}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
