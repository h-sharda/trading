import "server-only";

import { KiteConnect } from "kiteconnect";
import type { Connect } from "kiteconnect";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { GttDto } from "@/lib/gtt";
import type { HoldingDto } from "@/lib/holding";

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const SIX_AM_IST_MS = 6 * 60 * 60 * 1000;

export function kiteAccessTokenExpiresAt(now = new Date()) {
  const istMs = now.getTime() + IST_OFFSET_MS;
  const istMidnightUtcMs = Math.floor(istMs / 86_400_000) * 86_400_000;
  let expiryUtcMs = istMidnightUtcMs + SIX_AM_IST_MS - IST_OFFSET_MS;

  if (now.getTime() >= expiryUtcMs) {
    expiryUtcMs += 86_400_000;
  }

  return new Date(expiryUtcMs);
}

export function kiteErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
}

export function isKiteAccessTokenValid(
  accessToken: string | null | undefined,
  expiresAt: Date | null | undefined,
  now = new Date(),
) {
  return Boolean(accessToken && expiresAt && expiresAt.getTime() > now.getTime());
}

export async function getKiteConnectionStatus() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: {
      kiteApiKey: true,
      kiteApiSecret: true,
      kiteAccessToken: true,
      kiteAccessTokenExpiresAt: true,
      cdslTpin: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    hasCredentials: Boolean(user.kiteApiKey && user.kiteApiSecret),
    hasTpin: Boolean(user.cdslTpin),
    apiKey: user.kiteApiKey,
    isAuthenticated: isKiteAccessTokenValid(
      user.kiteAccessToken,
      user.kiteAccessTokenExpiresAt,
    ),
    accessTokenExpiresAt: user.kiteAccessTokenExpiresAt,
  };
}

type KiteSession = {
  kite: Connect;
  apiKey: string;
  accessToken: string;
};

export async function getKiteSession(): Promise<KiteSession> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("Sign in before using Kite.");
  }

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: {
      kiteApiKey: true,
      kiteAccessToken: true,
      kiteAccessTokenExpiresAt: true,
    },
  });

  if (!user?.kiteApiKey) {
    throw new Error("Save a Kite API key before trading.");
  }

  if (!isKiteAccessTokenValid(user.kiteAccessToken, user.kiteAccessTokenExpiresAt)) {
    throw new Error("Kite is not authenticated. Authorize again.");
  }

  const kite = new KiteConnect({ api_key: user.kiteApiKey });
  kite.setAccessToken(user.kiteAccessToken as string);
  return {
    kite,
    apiKey: user.kiteApiKey,
    accessToken: user.kiteAccessToken as string,
  };
}

export async function getAuthenticatedKiteClient() {
  const { kite } = await getKiteSession();
  return kite;
}

export async function initiateHoldingsAuth(
  instruments?: { isin: string; quantity: number }[],
) {
  const { apiKey, accessToken } = await getKiteSession();
  const body = new URLSearchParams();

  for (const instrument of instruments ?? []) {
    body.append("isin", instrument.isin);
    body.append("quantity", String(instrument.quantity));
  }

  const response = await fetch("https://api.kite.trade/portfolio/holdings/authorise", {
    method: "POST",
    headers: {
      "X-Kite-Version": "3",
      Authorization: `token ${apiKey}:${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  let payload: {
    status?: string;
    message?: string;
    data?: { request_id?: string };
  };

  try {
    payload = (await response.json()) as typeof payload;
  } catch {
    throw new Error("Unable to start eDIS authorisation.");
  }

  if (payload.status !== "success" || !payload.data?.request_id) {
    throw new Error(payload.message || "Unable to start eDIS authorisation.");
  }

  return {
    requestId: payload.data.request_id,
    redirectUrl: `https://kite.zerodha.com/connect/portfolio/authorise/holdings/${apiKey}/${payload.data.request_id}`,
  };
}

export type HoldingsResult =
  | { holdings: HoldingDto[]; error?: undefined }
  | { holdings: HoldingDto[]; error: string };

export async function getHoldings(): Promise<HoldingsResult> {
  try {
    const kite = await getAuthenticatedKiteClient();
    const holdings = await kite.getHoldings();

    return {
      holdings: holdings.map((holding) => ({
        tradingsymbol: holding.tradingsymbol,
        exchange: holding.exchange,
        product: holding.product,
        isin: holding.isin,
        quantity: holding.quantity,
        t1Quantity: holding.t1_quantity,
        usedQuantity: holding.used_quantity,
        realisedQuantity: holding.realised_quantity,
        authorisedQuantity: holding.authorised_quantity,
        authorisedDate: holding.authorised_date,
        averagePrice: holding.average_price,
        lastPrice: holding.last_price,
        pnl: holding.pnl,
        dayChange: holding.day_change,
        dayChangePercentage: holding.day_change_percentage,
      })),
    };
  } catch (error) {
    return {
      holdings: [],
      error: kiteErrorMessage(error, "Unable to load holdings."),
    };
  }
}

export type GttsResult =
  | { gtts: GttDto[]; error?: undefined }
  | { gtts: GttDto[]; error: string };

export async function getGtts(): Promise<GttsResult> {
  try {
    const kite = await getAuthenticatedKiteClient();
    const triggers = await kite.getGTTs();

    return {
      gtts: triggers.map((trigger) => ({
        id: trigger.id,
        type: trigger.type,
        status: trigger.status,
        tradingsymbol: trigger.condition.tradingsymbol,
        exchange: trigger.condition.exchange,
        lastPrice: trigger.condition.last_price,
        triggerValues: trigger.condition.trigger_values,
        expiresAt: trigger.expires_at,
        orders: trigger.orders.map((order) => ({
          transactionType: order.transaction_type,
          quantity: order.quantity,
          product: order.product,
          orderType: order.order_type,
          price: order.price,
        })),
      })),
    };
  } catch (error) {
    return {
      gtts: [],
      error: kiteErrorMessage(error, "Unable to load GTTs."),
    };
  }
}
