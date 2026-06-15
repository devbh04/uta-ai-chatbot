"use client";

import React, { useState } from "react";
import { Package, Truck, Clock, Copy, Check, RotateCcw, AlertCircle } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
};

export function OrderStatusCard({
  order_id,
  status,
  items,
  estimated_delivery,
  tracking_number,
  shipping_method,
  onAction
}: {
  order_id: string;
  status: string;
  items: Array<{ product_name: string; qty: number; price: number }>;
  estimated_delivery?: string;
  tracking_number?: string;
  shipping_method?: string;
  onAction?: (text: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyTracking = () => {
    if (tracking_number) {
      navigator.clipboard.writeText(tracking_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const steps = ["PENDING", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];
  const currentStepIndex = steps.indexOf(status);

  const isCancelled = status === "CANCELLED";
  const isReturnFlow = ["RETURN_REQUESTED", "RETURN_IN_TRANSIT", "REFUND_PROCESSING", "REFUNDED"].includes(status);

  return (
    <Card className="w-full max-w-md bg-white border border-border shadow-xs overflow-hidden">
      <div className="bg-primary/5 px-4 py-3 border-b border-border flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Package className="text-primary h-5 w-5" />
          <span className="font-semibold text-sm text-primary">Order Status</span>
        </div>
        <span className="text-xs font-mono font-semibold bg-secondary px-2 py-0.5 rounded-sm">
          {order_id}
        </span>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Progress Tracker */}
        {!isCancelled && !isReturnFlow && (
          <div className="py-2">
            <div className="flex justify-between items-center relative">
              <div className="absolute left-0 right-0 h-1 bg-secondary top-1/2 -translate-y-1/2 z-0" />
              <div
                className="absolute left-0 h-1 bg-primary top-1/2 -translate-y-1/2 z-0 transition-all duration-500"
                style={{
                  width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%`
                }}
              />
              {steps.map((step, idx) => {
                const isCompleted = idx <= currentStepIndex;
                const isActive = idx === currentStepIndex;
                return (
                  <div key={step} className="flex flex-col items-center z-10 relative">
                    <div
                      className={cn(
                        "h-6 w-6 rounded-full flex items-center justify-center border-2 text-[10px] font-bold transition-colors",
                        isCompleted
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-white border-border text-muted-foreground",
                        isActive && "ring-2 ring-ring ring-offset-2"
                      )}
                    >
                      {idx + 1}
                    </div>
                    <span className="text-[9px] mt-1 text-muted-foreground font-semibold uppercase tracking-wider text-center max-w-[60px] hidden sm:block">
                      {step.replace(/_/g, " ")}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Mobile Status Label */}
            <div className="mt-2 text-center text-xs font-medium text-primary sm:hidden">
              Current Status: {status.replace(/_/g, " ")}
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="flex items-center gap-3 p-3 bg-red-50 text-red-800 rounded-md border border-red-100">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Order Cancelled</p>
              <p className="text-xs opacity-90">This order has been cancelled and cannot be processed.</p>
            </div>
          </div>
        )}

        {isReturnFlow && (
          <div className="flex items-center gap-3 p-3 bg-amber-50 text-amber-900 rounded-md border border-amber-100">
            <RotateCcw className="h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-sm">Return Status: {status.replace(/_/g, " ")}</p>
              <p className="text-xs opacity-90">This order is currently in the return pipeline.</p>
            </div>
          </div>
        )}

        {/* Estimated Delivery / Tracking */}
        <div className="grid grid-cols-2 gap-4 text-xs border-y border-border py-3">
          <div>
            <span className="text-muted-foreground block font-medium">Estimated Delivery</span>
            <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              {estimated_delivery ? formatDate(estimated_delivery) : "Pending"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block font-medium">Shipping Method</span>
            <span className="font-semibold text-foreground capitalize block mt-0.5">
              {shipping_method || "standard"}
            </span>
          </div>
        </div>

        {/* Tracking Number */}
        {tracking_number && (
          <div className="flex items-center justify-between bg-secondary/30 rounded-md p-2 border border-border/50">
            <div className="flex items-center gap-1.5 text-xs">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Tracking:</span>
              <span className="font-mono font-semibold">{tracking_number}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-sm hover:bg-secondary"
              onClick={copyTracking}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        )}

        {/* Items Summary */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Items ({items.length})
          </span>
          <div className="max-h-[120px] overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="font-medium text-foreground line-clamp-1">
                  {item.product_name} <span className="text-muted-foreground font-normal">× {item.qty}</span>
                </span>
                <span className="font-mono text-muted-foreground font-semibold">
                  {formatCurrency(item.price * item.qty)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      {onAction && !isCancelled && !isReturnFlow && status === "DELIVERED" && (
        <CardFooter className="bg-secondary/20 border-t border-border/50 p-3 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={() => onAction(`I want to return my order ${order_id}`)}
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Return Order
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
