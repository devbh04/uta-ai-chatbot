"use client";

import React, { useState } from "react";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Copy,
  Check,
  RotateCcw,
  AlertTriangle,
  ExternalLink,
  HelpCircle,
  AlertCircle,
  ChevronRight,
  TrendingDown,
  UserCheck
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// --- HELPERS ---
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

// --- 1. ORDER STATUS CARD ---
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

  // If status is not in the default shipping flow, handle separately
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

// --- 2. RETURN POLICY CARD ---
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

// --- 3. RETURN CONFIRMATION CARD ---
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
      <div className="bg-emerald-50 text-emerald-900 px-4 py-3 border-b border-emerald-100 flex items-center gap-2">
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

// --- 4. REFUND STATUS CARD ---
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

// --- 5. PRODUCT CARDS (CAROUSEL) ---
export function ProductCards({
  products,
  match_type,
  note,
  onAction
}: {
  products: Array<{
    product_id: string;
    name: string;
    description: string;
    category: string;
    price: number;
    image_url?: string;
    in_stock: boolean;
    tags?: string[];
  }>;
  match_type?: string;
  note?: string | null;
  onAction?: (text: string) => void;
}) {
  const isNearest = match_type === "nearest";

  return (
    <div className="w-full space-y-2.5 max-w-lg">
      {/* Title / Banner */}
      <div className="flex flex-col gap-1 px-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider block">
            {isNearest ? "Closest Product Matches" : "Recommended Products"}
          </span>
          {isNearest && (
            <Badge variant="warning" className="text-[9px] font-bold py-0">
              Nearest Match
            </Badge>
          )}
        </div>
        {note && <p className="text-xs text-muted-foreground font-medium leading-tight">{note}</p>}
      </div>

      {/* Grid of Product Cards */}
      <div className="flex gap-4 overflow-x-auto pb-3 custom-scrollbar snap-x snap-mandatory pr-1">
        {products.map((product) => (
          <Card
            key={product.product_id}
            className="w-[240px] shrink-0 snap-start bg-white border border-border shadow-xs flex flex-col justify-between overflow-hidden"
          >
            {/* Image banner */}
            <div className="h-[120px] bg-secondary/20 relative overflow-hidden group">
              {product.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-8 w-8 text-muted-foreground/45" />
                </div>
              )}
              {/* Category tag */}
              <Badge className="absolute top-2 left-2 text-[9px] bg-black/60 text-white border-0 font-medium tracking-wide backdrop-blur-xs">
                {product.category}
              </Badge>
              {/* In stock badge */}
              <Badge
                variant={product.in_stock ? "success" : "danger"}
                className="absolute top-2 right-2 text-[9px] font-bold"
              >
                {product.in_stock ? "In Stock" : "Out of Stock"}
              </Badge>
            </div>

            {/* Content */}
            <CardContent className="p-3 space-y-1.5 flex-grow">
              <h4 className="font-semibold text-xs text-foreground line-clamp-1 leading-snug">
                {product.name}
              </h4>
              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                {product.description}
              </p>
              <div className="text-xs font-mono font-bold text-primary pt-0.5">
                {formatCurrency(product.price)}
              </div>
            </CardContent>

            {/* Footer */}
            {onAction && (
              <CardFooter className="p-2 border-t border-border/40 bg-secondary/5 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[10px] h-7 px-2.5 font-medium border-border hover:bg-primary hover:text-white"
                  onClick={() => onAction(`Tell me more about ${product.name}`)}
                >
                  View Details
                </Button>
              </CardFooter>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// --- 6. HANDOFF CARD ---
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

// --- 7. HELP MENU CARD ---
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
