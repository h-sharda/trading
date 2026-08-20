export type ScheduledOrderStatusDto =
  | "pending"
  | "armed"
  | "placed"
  | "failed"
  | "cancelled";

export type ScheduledOrderDto = {
  id: string;
  exchange: string;
  tradingsymbol: string;
  quantity: number;
  product: string;
  transactionType: string;
  orderType: string;
  executeAt: string;
  status: ScheduledOrderStatusDto;
  kiteOrderId: string | null;
  errorMessage: string | null;
  placedAt: string | null;
  createdAt: string;
};

type ScheduledOrderRecord = {
  id: string;
  exchange: string;
  tradingsymbol: string;
  quantity: number;
  product: string;
  transactionType: string;
  orderType: string;
  executeAt: Date;
  status: ScheduledOrderStatusDto;
  kiteOrderId: string | null;
  errorMessage: string | null;
  placedAt: Date | null;
  createdAt: Date;
};

export function toScheduledOrderDto(order: ScheduledOrderRecord): ScheduledOrderDto {
  return {
    id: order.id,
    exchange: order.exchange,
    tradingsymbol: order.tradingsymbol,
    quantity: order.quantity,
    product: order.product,
    transactionType: order.transactionType,
    orderType: order.orderType,
    executeAt: order.executeAt.toISOString(),
    status: order.status,
    kiteOrderId: order.kiteOrderId,
    errorMessage: order.errorMessage,
    placedAt: order.placedAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
  };
}
