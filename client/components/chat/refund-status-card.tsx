"use client";

import React from "react";
import { TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
};

export function RefundStatusCard({
  order_id,
  status,
  items,
  refund_estimate
}: {
  order_id: string;
  status: string;
  items: Array<{ product_name: string; qty: number; price: number }>;
  refund_estimate?: string;
}) {
  const refundSteps = ["RETURN_REQUESTED", "RETURN_IN_TRANSIT", "REFUND_PROCESSING", "REFUNDED"];
  const currentIdx = refundSteps.indexOf(status);

  const total = items.reduce((acc, curr) => acc + curr.price * curr.qty, 0);

  return (
    <Card className="w-full max-w-md bg-white border border-border shadow-xs overflow-hidden">
      <div className="bg-primary/5 px-4 py-3 border-b border-border flex justify-between items-center">
        <div className="flex items-center gap-2">
          <TrendingDown className="text-primary h-5 w-5" />
          <span className="font-semibold text-sm text-primary">Refund Pipeline</span>
        </div>
        <span className="text-xs font-mono font-semibold bg-secondary px-2 py-0.5 rounded-sm">
          {order_id}
        </span>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Timeline Progress */}
        <div className="space-y-4 relative py-2 pl-4">
          <div className="absolute left-6 top-3 bottom-3 w-[2px] bg-secondary" />
          <div
            className="absolute left-6 top-3 w-[2px] bg-emerald-600 transition-all duration-500"
            style={{
              height: `${(Math.max(0, currentIdx) / (refundSteps.length - 1)) * 90}%`
            }}
          />

          {refundSteps.map((step, idx) => {
            const isCompleted = idx <= currentIdx;
            const isActive = idx === currentIdx;
            return (
              <div key={step} className="flex gap-4 items-start relative">
                <div
                  className={cn(
                    "h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors z-10",
                    isCompleted
                      ? "bg-emerald-600 border-emerald-600"
                      : "bg-white border-border",
                    isActive && "ring-2 ring-emerald-600 ring-offset-2"
                  )}
                />
                <div className="text-xs -mt-0.5">
                  <p
                    className={cn(
                      "font-semibold",
                      isActive ? "text-emerald-700 font-bold" : isCompleted ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.replace(/_/g, " ")}
                  </p>
                  {isActive && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                      {step === "RETURN_REQUESTED" && "Return is authorized. Package dropoff pending."}
                      {step === "RETURN_IN_TRANSIT" && "Package is shipping back to our warehouse."}
                      {step === "REFUND_PROCESSING" && "Items arrived, examining condition & clearing refund."}
                      {step === "REFUNDED" && "Refund successfully issued to your primary payment method."}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Refund Details */}
        <div className="grid grid-cols-2 gap-4 text-xs border-t border-border pt-3">
          <div>
            <span className="text-muted-foreground block">Refund Amount</span>
            <span className="font-bold text-foreground text-sm font-mono mt-0.5 block">
              {formatCurrency(total)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block">Timeline Estimate</span>
            <span className="font-semibold text-foreground mt-0.5 block">
              {refund_estimate || "3-5 business days"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
