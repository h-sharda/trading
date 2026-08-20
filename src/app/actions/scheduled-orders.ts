"use server";

import type { Exchanges } from "kiteconnect";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { istDateTimeToUtc } from "@/lib/ist";
import { prisma } from "@/lib/prisma";
import { toScheduledOrderDto } from "@/lib/scheduled-order";

export type ScheduleOrderState = {
  errors?: {
    tradingsymbol?: string[];
    quantity?: string[];
    executeAt?: string[];
  };
  message?: string;
  ok?: boolean;
};

const EXCHANGES = new Set<Exchanges>(["NSE", "BSE"]);

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function scheduleIpoSell(
  _state: ScheduleOrderState | undefined,
  formData: FormData,
): Promise<ScheduleOrderState> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/sign-in");
  }

  const exchange = readString(formData, "exchange").toUpperCase() as Exchanges;
  const tradingsymbol = readString(formData, "tradingsymbol").toUpperCase();
  const quantity = Number(readString(formData, "quantity"));
  const date = readString(formData, "executeDate");
  const time = readString(formData, "executeTime") || "10:00";
  const executeAt = istDateTimeToUtc(date, time);
  const errors: ScheduleOrderState["errors"] = {};

  if (!EXCHANGES.has(exchange)) {
    return { message: "Choose NSE or BSE." };
  }

  if (!tradingsymbol) {
    errors.tradingsymbol = ["Enter the listing symbol."];
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    errors.quantity = ["Quantity must be a whole number greater than 0."];
  }

  if (!executeAt) {
    errors.executeAt = ["Enter a valid listing date and time."];
  } else if (executeAt.getTime() <= Date.now() + 5_000) {
    errors.executeAt = ["Choose a time at least a few seconds in the future."];
  }

  if (errors.tradingsymbol || errors.quantity || errors.executeAt) {
    return { errors };
  }

  try {
    await prisma.scheduledOrder.create({
      data: {
        userId: currentUser.id,
        exchange,
        tradingsymbol,
        quantity,
        product: "CNC",
        transactionType: "SELL",
        orderType: "MARKET",
        executeAt: executeAt as Date,
      },
    });
  } catch {
    return { message: "Unable to save the scheduled sell. Try again." };
  }

  revalidatePath("/");
  return {
    ok: true,
    message: `Scheduled MARKET sell for ${tradingsymbol} at listing open.`,
  };
}

export type CancelScheduledOrderState = {
  message?: string;
};

export async function cancelScheduledOrder(
  _state: CancelScheduledOrderState | undefined,
  formData: FormData,
): Promise<CancelScheduledOrderState> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/sign-in");
  }

  const id = readString(formData, "orderId");

  if (!id) {
    return { message: "Invalid scheduled order." };
  }

  const result = await prisma.scheduledOrder.updateMany({
    where: { id, userId: currentUser.id, status: "pending" },
    data: { status: "cancelled" },
  });

  if (result.count !== 1) {
    return { message: "That order is already firing or no longer pending." };
  }

  revalidatePath("/");
  return { message: "Scheduled sell cancelled." };
}

export async function getScheduledOrdersForCurrentUser() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return [];
  }

  const orders = await prisma.scheduledOrder.findMany({
    where: { userId: currentUser.id },
    orderBy: { executeAt: "desc" },
    take: 30,
  });

  return orders.map(toScheduledOrderDto);
}
