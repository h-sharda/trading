import "server-only";

import { KiteConnect } from "kiteconnect";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
    },
  });

  if (!user) {
    return null;
  }

  return {
    hasCredentials: Boolean(user.kiteApiKey && user.kiteApiSecret),
    apiKey: user.kiteApiKey,
    isAuthenticated: isKiteAccessTokenValid(
      user.kiteAccessToken,
      user.kiteAccessTokenExpiresAt,
    ),
    accessTokenExpiresAt: user.kiteAccessTokenExpiresAt,
  };
}

export async function getAuthenticatedKiteClient() {
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
  return kite;
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
        quantity: holding.quantity,
        t1Quantity: holding.t1_quantity,
        usedQuantity: holding.used_quantity,
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
