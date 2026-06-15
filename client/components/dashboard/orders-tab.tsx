"use client";

import React, { useState, useEffect } from "react";
import { Package, Search, PlusCircle, AlertCircle, Edit, RefreshCw, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

interface OrderItem {
  product_name: string;
  qty: number;
  price: number;
}

interface Order {
  order_id: string;
  customer_name: string;
  customer_email: string;
  items: OrderItem[];
  status: string;
  shipping_method: "standard" | "expedited";
  created_at: string;
  estimated_delivery?: string;
  tracking_number?: string;
  notes?: string;
}

export function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create Order Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [shippingMethod, setShippingMethod] = useState<"standard" | "expedited">("standard");
  const [itemsList, setItemsList] = useState<OrderItem[]>([{ product_name: "", qty: 1, price: 0 }]);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Edit Order Dialog state
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    try {
      const url = new URL("http://localhost:8000/api/orders");
      if (statusFilter !== "ALL") {
        url.searchParams.append("status", statusFilter);
      }
      if (searchTerm) {
        url.searchParams.append("search", searchTerm);
      }

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to load orders");
      const data = await res.json();
      setOrders(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch order catalog from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, searchTerm]);

  // Handle status transition update
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setTransitionError(null);
    try {
      const res = await fetch(`http://localhost:8000/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Illegal status transition.");
      }

      fetchOrders();
      setEditingOrder(null);
    } catch (err: any) {
      console.error(err);
      setTransitionError(err.message);
      setTimeout(() => setTransitionError(null), 5000); // Clear after 5s
    }
  };

  // Add Item to creation list
  const addCreateItem = () => {
    setItemsList((prev) => [...prev, { product_name: "", qty: 1, price: 0 }]);
  };

  // Remove Item from creation list
  const removeCreateItem = (idx: number) => {
    setItemsList((prev) => prev.filter((_, i) => i !== idx));
  };

  // Update item field in creation list
  const updateCreateItem = (idx: number, field: keyof OrderItem, value: any) => {
    setItemsList((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  // Handle Submit Order
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = itemsList.filter((it) => it.product_name.trim() !== "");
    if (validItems.length === 0) {
      alert("Please add at least one valid product item.");
      return;
    }

    setSubmittingOrder(true);
    try {
      const res = await fetch("http://localhost:8000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName,
          customer_email: customerEmail,
          items: validItems,
          shipping_method: shippingMethod
        })
      });

      if (!res.ok) throw new Error("Order creation failed.");
      setIsCreateOpen(false);
      // Reset
      setCustomerName("");
      setCustomerEmail("");
      setShippingMethod("standard");
      setItemsList([{ product_name: "", qty: 1, price: 0 }]);
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("Could not create order on database.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PENDING":
        return "secondary";
      case "PROCESSING":
        return "default";
      case "SHIPPED":
      case "OUT_FOR_DELIVERY":
        return "warning";
      case "DELIVERED":
        return "success";
      case "CANCELLED":
        return "danger";
      case "RETURN_REQUESTED":
      case "RETURN_IN_TRANSIT":
      case "REFUND_PROCESSING":
        return "warning";
      case "REFUNDED":
        return "outline";
      default:
        return "outline";
    }
  };

  const calculateTotal = (order: Order) => {
    return order.items.reduce((acc, curr) => acc + curr.price * curr.qty, 0);
  };

  const statuses = [
    "PENDING",
    "PROCESSING",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
    "RETURN_REQUESTED",
    "RETURN_IN_TRANSIT",
    "REFUND_PROCESSING",
    "REFUNDED",
    "EXCHANGED"
  ];

  return (
    <div className="space-y-4">
      {/* Head */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Order Operations</h2>
          <p className="text-xs text-muted-foreground">Lookup, filter, and transition order states.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="text-xs h-8">
          <PlusCircle className="mr-1 h-3.5 w-3.5" /> Place Order
        </Button>
      </div>

      {/* Transition Warnings */}
      {transitionError && (
        <div className="bg-red-50 text-red-800 p-3 rounded-md text-xs border border-red-200 flex items-start gap-2 animate-bounce">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <div>
            <span className="font-bold">Illegal State Transition Checked by Backend:</span>
            <p className="mt-0.5">{transitionError}</p>
          </div>
        </div>
      )}

      {/* Filter panel */}
      <div className="bg-white border border-border p-3 rounded-lg shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by ID or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 text-xs h-8.5 bg-secondary/10"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-semibold">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-secondary/20 hover:bg-secondary/40 border border-border text-xs rounded-md h-8.5 px-2.5 text-foreground outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            {statuses.map((st) => (
              <option key={st} value={st}>
                {st.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchOrders}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Orders Grid */}
      {loading && orders.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.length === 0 ? (
            <div className="col-span-full bg-white border border-border rounded-lg p-12 text-center text-muted-foreground text-xs">
              No orders matching filters.
            </div>
          ) : (
            orders.map((order) => (
              <Card key={order.order_id} className="bg-white border border-border shadow-xs overflow-hidden flex flex-col justify-between">
                <CardHeader className="p-3 border-b border-border bg-secondary/10 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-primary" />
                    <span className="font-bold text-xs font-mono">{order.order_id}</span>
                  </div>
                  <Badge variant={getStatusBadgeVariant(order.status)} className="text-[9px] font-bold">
                    {order.status.replace(/_/g, " ")}
                  </Badge>
                </CardHeader>
                <CardContent className="p-3.5 space-y-2.5 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Customer Details</span>
                    <span className="font-semibold text-foreground">{order.customer_name}</span>
                    <span className="text-muted-foreground font-mono block text-[10px]">{order.customer_email}</span>
                  </div>

                  <div className="border-t border-border/40 pt-2">
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Items Purchased</span>
                    <div className="max-h-[60px] overflow-y-auto custom-scrollbar space-y-0.5 mt-0.5">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[11px]">
                          <span className="text-foreground line-clamp-1">{it.product_name} × {it.qty}</span>
                          <span className="text-muted-foreground font-mono font-semibold">
                            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(it.price * it.qty)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-border/40 pt-2 flex justify-between items-center">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Shipping method</span>
                      <span className="font-medium text-foreground capitalize">{order.shipping_method}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Total Total</span>
                      <span className="font-bold font-mono text-primary">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(calculateTotal(order))}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-2 border-t border-border/40 bg-secondary/5 flex justify-end gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] border-border"
                    onClick={() => setEditingOrder(order)}
                  >
                    <Edit className="h-3 w-3 mr-1" /> Update Status
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}

      {/* --- CREATE ORDER MODAL DIALOG --- */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg border border-border shadow-lg max-w-lg w-full max-h-[85vh] overflow-y-auto custom-scrollbar">
            <header className="p-4 border-b border-border flex justify-between items-center bg-secondary/15">
              <h3 className="font-bold text-sm text-foreground">Place New Demo Order</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsCreateOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </header>
            <form onSubmit={handleCreateOrder} className="p-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Customer Name</label>
                  <Input
                    required
                    placeholder="e.g. Alice Cooper"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-8.5 text-xs bg-secondary/10"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Customer Email</label>
                  <Input
                    required
                    type="email"
                    placeholder="e.g. alice@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="h-8.5 text-xs bg-secondary/10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground block">Shipping Method</label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="shipping"
                      checked={shippingMethod === "standard"}
                      onChange={() => setShippingMethod("standard")}
                      className="accent-primary"
                    />
                    <span>Standard</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="shipping"
                      checked={shippingMethod === "expedited"}
                      onChange={() => setShippingMethod("expedited")}
                      className="accent-primary"
                    />
                    <span>Expedited</span>
                  </label>
                </div>
              </div>

              <div className="border-t border-border/50 pt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-muted-foreground">Product Items</label>
                  <Button type="button" variant="outline" size="sm" className="h-7 text-[10px]" onClick={addCreateItem}>
                    + Add Item
                  </Button>
                </div>

                <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                  {itemsList.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input
                        required
                        placeholder="Product Name"
                        value={item.product_name}
                        onChange={(e) => updateCreateItem(idx, "product_name", e.target.value)}
                        className="h-8 text-xs flex-grow bg-secondary/10"
                      />
                      <Input
                        required
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.qty}
                        onChange={(e) => updateCreateItem(idx, "qty", parseInt(e.target.value) || 1)}
                        className="h-8 text-xs w-14 bg-secondary/10"
                      />
                      <Input
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Price"
                        value={item.price || ""}
                        onChange={(e) => updateCreateItem(idx, "price", parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs w-20 bg-secondary/10"
                      />
                      {itemsList.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-600 shrink-0"
                          onClick={() => removeCreateItem(idx)}
                        >
                          <X className="h-4.5 w-4.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <footer className="border-t border-border/50 pt-3 flex justify-end gap-2 shrink-0">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submittingOrder}>
                  {submittingOrder ? "Saving..." : "Submit Order"}
                </Button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT STATUS MODAL DIALOG --- */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg border border-border shadow-lg max-w-sm w-full">
            <header className="p-4 border-b border-border flex justify-between items-center bg-secondary/15">
              <div>
                <h3 className="font-bold text-sm text-foreground">Update Order State</h3>
                <span className="text-[10px] text-muted-foreground font-mono font-semibold">{editingOrder.order_id}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingOrder(null)}>
                <X className="h-4 w-4" />
              </Button>
            </header>
            <div className="p-4 space-y-3.5 text-xs">
              <div className="flex justify-between items-center p-2 bg-secondary/20 border border-border/50 rounded-md">
                <span className="text-muted-foreground font-medium">Current Status:</span>
                <Badge variant={getStatusBadgeVariant(editingOrder.status)} className="font-bold text-[10px]">
                  {editingOrder.status.replace(/_/g, " ")}
                </Badge>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Select Target Status</label>
                <div className="grid grid-cols-1 gap-1 max-h-[200px] overflow-y-auto custom-scrollbar border border-border/40 p-1.5 rounded-md">
                  {statuses.map((st) => (
                    <button
                      key={st}
                      className={`text-left px-2.5 py-1.5 rounded-sm transition-colors text-xs font-semibold hover:bg-secondary/40 cursor-pointer ${
                        editingOrder.status === st ? "bg-primary/10 text-primary" : "text-foreground"
                      }`}
                      onClick={() => handleStatusChange(editingOrder.order_id, st)}
                    >
                      {st.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-normal italic">
                Note: Status transitions are restricted by order logic rules. Illegal changes will be rejected by the API.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
