import "server-only";

import type { Connect } from "kiteconnect";
import { kiteErrorMessage } from "@/lib/kite";

type OrderVariety = Parameters<Connect["placeOrder"]>[0];
export type KiteOrderParams = Parameters<Connect["placeOrder"]>[1];
type SubmissionState = "exists" | "absent" | "unknown";

const RETRY_DELAYS_MS = [1_000, 3_000, 9_000] as const;

function createOrderTag() {
  return `ord${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 8)}`.slice(0, 20);
}

async function verifySubmission(
  kite: Connect,
  orderParams: KiteOrderParams,
  orderTag: string,
): Promise<SubmissionState> {
  const verificationDelays = [0, 100, 250, 500];

  for (const delay of verificationDelays) {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      const orders = await kite.getOrders();
      const matchingOrder = orders.find(
        (order) =>
          order.tag === orderTag &&
          order.exchange === orderParams.exchange &&
          order.tradingsymbol === orderParams.tradingsymbol &&
          order.transaction_type === orderParams.transaction_type &&
          order.quantity === orderParams.quantity,
      );

      if (!matchingOrder) {
        continue;
      }

      if (["REJECTED", "CANCELLED"].includes(matchingOrder.status)) {
        return "absent";
      }

      return "exists";
    } catch {
      return "unknown";
    }
  }

  return "absent";
}

export async function placeKiteOrderWithRetry(
  kite: Connect,
  orderParams: KiteOrderParams,
  variety: OrderVariety = "regular",
) {
  const orderTag = orderParams.tag?.trim() || createOrderTag();
  const requestParams = { ...orderParams, tag: orderTag };
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt - 1]));
    }

    try {
      const order = await kite.placeOrder(variety, requestParams);
      return { orderId: order.order_id, orderTag };
    } catch (error) {
      lastError = error;
      const submissionState = await verifySubmission(kite, requestParams, orderTag);

      if (submissionState !== "absent") {
        return { orderId: undefined, orderTag };
      }
    }
  }

  throw new Error(kiteErrorMessage(lastError, "Unable to place the order."));
}
