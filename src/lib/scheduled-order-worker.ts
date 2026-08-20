import "server-only";

import { performance } from "node:perf_hooks";
import type { Exchanges, Product, TransactionType } from "kiteconnect";
import { getKiteSessionForUser } from "@/lib/kite";
import { placeKiteOrderWithRetry } from "@/lib/kite-order";
import { prisma } from "@/lib/prisma";

const ARM_AHEAD_MS = 90_000;
const MISS_WINDOW_MS = 2 * 60 * 60 * 1000;
const FINAL_WAIT_WINDOW_MS = 25;
const POLL_INTERVAL_MS = 1_000;

const inFlight = new Set<string>();

const globalForWorker = globalThis as unknown as {
  scheduledOrderWorkerStarted?: boolean;
  scheduledOrderWorkerTimer?: ReturnType<typeof setInterval>;
};

function yieldToEventLoop() {
  return new Promise<void>((resolve) => setImmediate(resolve));
}

async function waitUntil(targetMonotonicTime: number) {
  let remaining = targetMonotonicTime - performance.now();

  while (remaining > FINAL_WAIT_WINDOW_MS) {
    await new Promise((resolve) => {
      setTimeout(resolve, Math.min(remaining - FINAL_WAIT_WINDOW_MS, 50));
    });
    remaining = targetMonotonicTime - performance.now();
  }

  while (performance.now() < targetMonotonicTime) {
    await yieldToEventLoop();
  }
}

async function markFailed(id: string, errorMessage: string) {
  await prisma.scheduledOrder.update({
    where: { id },
    data: { status: "failed", errorMessage },
  });
}

async function executeScheduledOrder(id: string) {
  const claimed = await prisma.scheduledOrder.updateMany({
    where: { id, status: "pending" },
    data: { status: "armed" },
  });

  if (claimed.count !== 1) {
    return;
  }

  const order = await prisma.scheduledOrder.findUnique({ where: { id } });

  if (!order || order.status !== "armed") {
    return;
  }

  const delay = order.executeAt.getTime() - Date.now();

  if (delay > 0) {
    await waitUntil(performance.now() + delay);
  }

  const latest = await prisma.scheduledOrder.findUnique({ where: { id } });

  if (!latest || latest.status !== "armed") {
    return;
  }

  const lateness = Date.now() - latest.executeAt.getTime();

  if (lateness > MISS_WINDOW_MS) {
    await markFailed(id, "Missed the execution window.");
    return;
  }

  try {
    const { kite } = await getKiteSessionForUser(latest.userId);
    const result = await placeKiteOrderWithRetry(kite, {
      exchange: latest.exchange as Exchanges,
      tradingsymbol: latest.tradingsymbol,
      transaction_type: latest.transactionType as TransactionType,
      quantity: latest.quantity,
      product: latest.product as Product,
      order_type: "MARKET",
      validity: "DAY",
    });

    await prisma.scheduledOrder.update({
      where: { id },
      data: {
        status: "placed",
        orderTag: result.orderTag,
        kiteOrderId: result.orderId ?? null,
        placedAt: new Date(),
        errorMessage: null,
      },
    });
  } catch (error) {
    await markFailed(
      id,
      error instanceof Error ? error.message : "Unable to place the scheduled order.",
    );
  }
}

export async function dispatchDueScheduledOrders() {
  const due = await prisma.scheduledOrder.findMany({
    where: {
      status: "pending",
      executeAt: { lte: new Date(Date.now() + ARM_AHEAD_MS) },
    },
    select: { id: true },
    orderBy: { executeAt: "asc" },
  });

  await Promise.all(
    due.map(async ({ id }) => {
      if (inFlight.has(id)) {
        return;
      }

      inFlight.add(id);

      try {
        await executeScheduledOrder(id);
      } finally {
        inFlight.delete(id);
      }
    }),
  );

  return due.length;
}

export function startScheduledOrderWorker() {
  if (globalForWorker.scheduledOrderWorkerStarted) {
    return;
  }

  globalForWorker.scheduledOrderWorkerStarted = true;

  void prisma.scheduledOrder
    .updateMany({
      where: { status: "armed" },
      data: { status: "pending" },
    })
    .then(() => dispatchDueScheduledOrders())
    .catch((error: unknown) => {
      console.error("Scheduled order worker failed to start:", error);
    });

  globalForWorker.scheduledOrderWorkerTimer = setInterval(() => {
    void dispatchDueScheduledOrders().catch((error: unknown) => {
      console.error("Scheduled order dispatch failed:", error);
    });
  }, POLL_INTERVAL_MS);

  globalForWorker.scheduledOrderWorkerTimer.unref?.();
}
