import type { OrderStatus } from "@/db/schema";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Awaiting payment",
  paid: "To send",
  shipped: "Sent",
  ready: "Ready to collect",
  completed: "Completed",
  refunded: "Refunded",
  cancelled: "Not completed",
};

export const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: "bg-paper text-ink-soft border border-line",
  paid: "bg-sticker text-ink",
  shipped: "bg-cobalt-wash text-cobalt-deep",
  ready: "bg-cobalt-wash text-cobalt-deep",
  completed: "bg-go-wash text-go",
  refunded: "bg-stop-wash text-stop",
  cancelled: "bg-paper text-ink-soft border border-line",
};
