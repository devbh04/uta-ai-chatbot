"use client";

import React from "react";
import {
  OrderStatusCard,
  ReturnPolicyCard,
  ReturnConfirmationCard,
  RefundStatusCard,
  ProductCards,
  HandoffCard,
  HelpMenuCard
} from "./cards";

export interface CardPayload {
  type: string;
  data: any;
}

export function CardRenderer({
  payload,
  onAction
}: {
  payload: CardPayload | null | undefined;
  onAction?: (text: string) => void;
}) {
  if (!payload || !payload.type || !payload.data) return null;

  switch (payload.type) {
    case "order_status":
      return (
        <OrderStatusCard
          order_id={payload.data.order_id}
          status={payload.data.status}
          items={payload.data.items || []}
          estimated_delivery={payload.data.estimated_delivery}
          tracking_number={payload.data.tracking_number}
          shipping_method={payload.data.shipping_method}
          onAction={onAction}
        />
      );

    case "return_policy":
      return (
        <ReturnPolicyCard
          policy_summary={payload.data.policy_summary}
          return_window={payload.data.return_window}
          eligible_conditions={payload.data.eligible_conditions || []}
          process_steps={payload.data.process_steps || []}
          return_link={payload.data.return_link}
          onAction={onAction}
        />
      );

    case "return_confirmation":
      return (
        <ReturnConfirmationCard
          order_id={payload.data.order_id}
          items={payload.data.items || []}
          next_steps={payload.data.next_steps || []}
          refund_estimate={payload.data.refund_estimate}
        />
      );

    case "refund_status":
      return (
        <RefundStatusCard
          order_id={payload.data.order_id}
          status={payload.data.status}
          items={payload.data.items || []}
          refund_estimate={payload.data.refund_estimate}
        />
      );

    case "product_cards":
      return (
        <ProductCards
          products={payload.data.products || []}
          match_type={payload.data.match_type}
          note={payload.data.note}
          onAction={onAction}
        />
      );

    case "handoff":
      return (
        <HandoffCard
          summary={payload.data.summary}
          status={payload.data.status}
          agent_name={payload.data.agent_name}
        />
      );

    case "help_menu":
      return (
        <HelpMenuCard
          options={payload.data.options || []}
          suggest_handoff={payload.data.suggest_handoff}
          onAction={onAction}
        />
      );

    default:
      console.warn("Unknown card_payload type:", payload.type);
      return null;
  }
}
