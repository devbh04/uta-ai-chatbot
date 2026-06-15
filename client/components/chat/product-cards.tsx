"use client";

import React from "react";
import { Package } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
};

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
