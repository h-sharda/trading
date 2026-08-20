"use server";

import { KiteConnect } from "kiteconnect";
import type {
  Exchanges,
  OrderType,
  Product,
  TransactionType,
  TriggerType,
  Validity,
  Variety,
} from "kiteconnect";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getAuthenticatedKiteClient,
  initiateHoldingsAuth,
  kiteErrorMessage,
} from "@/lib/kite";
import { prisma } from "@/lib/prisma";
import { getYahooLastPrice } from "@/lib/yahoo-ltp";

export type SaveKiteCredentialsState = {
  errors?: {
    apiKey?: string[];
    apiSecret?: string[];
    tpin?: string[];
  };
  message?: string;
};

const TPIN_PATTERN = /^\d{6}$/;

function readApiKey(formData: FormData) {
  return String(formData.get("apiKey") ?? "").trim();
}

function readApiSecret(formData: FormData) {
  return String(formData.get("apiSecret") ?? "").trim();
}

export async function saveKiteCredentials(
  _state: SaveKiteCredentialsState | undefined,
  formData: FormData,
): Promise<SaveKiteCredentialsState> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/sign-in");
  }

  const apiKey = readApiKey(formData);
  const apiSecret = readApiSecret(formData);
  const tpin = String(formData.get("tpin") ?? "").trim();
  const errors: SaveKiteCredentialsState["errors"] = {};

  if (apiKey.length < 4) {
    errors.apiKey = ["Enter your Kite API key."];
  }

  if (tpin && !TPIN_PATTERN.test(tpin)) {
    errors.tpin = ["CDSL TPIN must be 6 digits."];
  }

  if (errors.apiKey || errors.tpin) {
    return { errors };
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { kiteApiKey: true, kiteApiSecret: true },
    });

    const nextSecret = apiSecret || existing?.kiteApiSecret || "";

    if (nextSecret.length < 4) {
      return { errors: { apiSecret: ["Enter your Kite API secret."] } };
    }

    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        kiteApiKey: apiKey,
        kiteApiSecret: nextSecret,
        ...(tpin ? { cdslTpin: tpin } : {}),
        ...(existing?.kiteApiKey !== apiKey
          ? { kiteAccessToken: null, kiteAccessTokenExpiresAt: null }
          : {}),
      },
    });
  } catch {
    return { message: "Unable to save Kite credentials. Try again." };
  }

  redirect("/");
}

export type ExternalAuthResult = {
  url?: string;
  error?: "failed" | "invalid";
};

export async function startKiteLogin(): Promise<ExternalAuthResult> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { kiteApiKey: true, kiteApiSecret: true },
  });

  if (!user?.kiteApiKey || !user.kiteApiSecret) {
    return { error: "failed" };
  }

  const kite = new KiteConnect({ api_key: user.kiteApiKey });
  return { url: kite.getLoginURL() };
}

const ISIN_PATTERN = /^[A-Z0-9]{12}$/;

export async function startEdis(formData: FormData): Promise<ExternalAuthResult> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/sign-in");
  }

  const isin = readString(formData, "isin").toUpperCase();
  const rawQuantity = readString(formData, "quantity");
  const quantity = Number(rawQuantity);
  let instruments: { isin: string; quantity: number }[] | undefined;

  if (isin || rawQuantity) {
    if (!ISIN_PATTERN.test(isin) || !Number.isInteger(quantity) || quantity < 1) {
      return { error: "invalid" };
    }

    instruments = [{ isin, quantity }];
  }

  try {
    const { redirectUrl } = await initiateHoldingsAuth(instruments);
    return { url: redirectUrl };
  } catch {
    return { error: "failed" };
  }
}

export type StoredTpinResult = {
  tpin?: string;
  message?: string;
};

export async function getStoredCdslTpin(): Promise<StoredTpinResult> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { cdslTpin: true },
  });

  if (!user?.cdslTpin) {
    return { message: "No CDSL TPIN is saved." };
  }

  return { tpin: user.cdslTpin };
}

export type PlaceOrderState = {
  errors?: {
    tradingsymbol?: string[];
    quantity?: string[];
    lastPrice?: string[];
    price?: string[];
    triggerPrice?: string[];
    targetPrice?: string[];
    slPrice?: string[];
  };
  message?: string;
  orderId?: string;
  triggerId?: number;
};

const VARIETIES = new Set<Variety>(["regular", "amo"]);
const EXCHANGES = new Set<Exchanges>(["NSE", "BSE", "NFO", "BFO", "CDS", "MCX"]);
const TRANSACTION_TYPES = new Set<TransactionType>(["BUY", "SELL"]);
const PRODUCTS = new Set<Product>(["CNC", "MIS", "NRML"]);
const ORDER_TYPES = new Set<OrderType>(["MARKET", "LIMIT", "SL", "SL-M"]);
const VALIDITIES = new Set<Validity>(["DAY", "IOC"]);
const GTT_TYPES = new Set<TriggerType>(["single", "two-leg"]);

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function positivePrice(value: number) {
  return Number.isFinite(value) && value > 0;
}

async function resolveGttLastPrice(
  kite: Awaited<ReturnType<typeof getAuthenticatedKiteClient>>,
  exchange: Exchanges,
  tradingsymbol: string,
  submittedLastPrice: number,
) {
  if (positivePrice(submittedLastPrice)) {
    return submittedLastPrice;
  }

  const yahooLastPrice = await getYahooLastPrice(exchange, tradingsymbol);

  if (yahooLastPrice) {
    return yahooLastPrice;
  }

  const holdings = await kite.getHoldings();
  const holding = holdings.find(
    (item: { exchange: string; tradingsymbol: string; last_price: number }) =>
      item.exchange === exchange && item.tradingsymbol === tradingsymbol,
  );

  if (holding && positivePrice(holding.last_price)) {
    return holding.last_price;
  }

  throw new Error(
    "Could not fetch last price from Yahoo Finance. Enter it manually.",
  );
}

export async function submitTrade(
  state: PlaceOrderState | undefined,
  formData: FormData,
): Promise<PlaceOrderState> {
  if (readString(formData, "variety") === "gtt") {
    return placeGtt(state, formData);
  }

  return placeOrder(state, formData);
}

export async function placeOrder(
  _state: PlaceOrderState | undefined,
  formData: FormData,
): Promise<PlaceOrderState> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/sign-in");
  }

  const variety = readString(formData, "variety") as Variety;
  const exchange = readString(formData, "exchange").toUpperCase() as Exchanges;
  const tradingsymbol = readString(formData, "tradingsymbol").toUpperCase();
  const transactionType = readString(formData, "transactionType") as TransactionType;
  const product = readString(formData, "product") as Product;
  const orderType = readString(formData, "orderType") as OrderType;
  const validity = (readString(formData, "validity") || "DAY") as Validity;
  const quantity = Number(readString(formData, "quantity"));
  const price = Number(readString(formData, "price"));
  const triggerPrice = Number(readString(formData, "triggerPrice"));
  const errors: PlaceOrderState["errors"] = {};

  if (!VARIETIES.has(variety)) {
    return { message: "Choose Regular or AMO." };
  }

  if (!EXCHANGES.has(exchange)) {
    return { message: "Choose a valid exchange." };
  }

  if (!TRANSACTION_TYPES.has(transactionType)) {
    return { message: "Choose Buy or Sell." };
  }

  if (!PRODUCTS.has(product)) {
    return { message: "Choose a valid product." };
  }

  if (!ORDER_TYPES.has(orderType)) {
    return { message: "Choose a valid order type." };
  }

  if (!VALIDITIES.has(validity)) {
    return { message: "Choose a valid validity." };
  }

  if (!tradingsymbol) {
    errors.tradingsymbol = ["Enter a trading symbol."];
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    errors.quantity = ["Quantity must be a whole number greater than 0."];
  }

  const needsPrice = orderType === "LIMIT" || orderType === "SL";
  const needsTrigger = orderType === "SL" || orderType === "SL-M";

  if (needsPrice && (!Number.isFinite(price) || price <= 0)) {
    errors.price = ["Enter a price for limit and stop-loss orders."];
  }

  if (needsTrigger && (!Number.isFinite(triggerPrice) || triggerPrice <= 0)) {
    errors.triggerPrice = ["Enter a trigger price for stop-loss orders."];
  }

  if (errors.tradingsymbol || errors.quantity || errors.price || errors.triggerPrice) {
    return { errors };
  }

  try {
    const kite = await getAuthenticatedKiteClient();
    const result = await kite.placeOrder(variety, {
      exchange,
      tradingsymbol,
      transaction_type: transactionType,
      quantity,
      product,
      order_type: orderType,
      validity,
      ...(needsPrice ? { price } : {}),
      ...(needsTrigger ? { trigger_price: triggerPrice } : {}),
    });

    revalidatePath("/");
    return { orderId: result.order_id, message: `Order placed: ${result.order_id}` };
  } catch (error) {
    return { message: kiteErrorMessage(error, "Unable to place the order. Try again.") };
  }
}

export async function placeGtt(
  _state: PlaceOrderState | undefined,
  formData: FormData,
): Promise<PlaceOrderState> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/sign-in");
  }

  const triggerType = readString(formData, "gttType") as TriggerType;
  const exchange = readString(formData, "exchange").toUpperCase() as Exchanges;
  const tradingsymbol = readString(formData, "tradingsymbol").toUpperCase();
  const transactionType = readString(formData, "transactionType") as TransactionType;
  const product = readString(formData, "product") as Product;
  const quantity = Number(readString(formData, "quantity"));
  const price = Number(readString(formData, "price"));
  const triggerPrice = Number(readString(formData, "triggerPrice"));
  const lastPrice = Number(readString(formData, "lastPrice"));
  const slTrigger = Number(readString(formData, "slTrigger"));
  const slPrice = Number(readString(formData, "slPrice"));
  const targetTrigger = Number(readString(formData, "targetTrigger"));
  const targetPrice = Number(readString(formData, "targetPrice"));
  const errors: PlaceOrderState["errors"] = {};

  if (!GTT_TYPES.has(triggerType)) {
    return { message: "Choose Single or OCO GTT." };
  }

  if (!EXCHANGES.has(exchange)) {
    return { message: "Choose a valid exchange." };
  }

  if (!TRANSACTION_TYPES.has(transactionType)) {
    return { message: "Choose Buy or Sell." };
  }

  if (product !== "CNC" && product !== "NRML") {
    return { message: "GTT only supports CNC or NRML." };
  }

  if (!tradingsymbol) {
    errors.tradingsymbol = ["Enter a trading symbol."];
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    errors.quantity = ["Quantity must be a whole number greater than 0."];
  }

  if (triggerType === "single") {
    if (!positivePrice(triggerPrice)) {
      errors.triggerPrice = ["Enter a GTT trigger price."];
    }

    if (!positivePrice(price)) {
      errors.price = ["Enter a limit price for the GTT order."];
    }
  } else {
    if (!positivePrice(slTrigger) || !positivePrice(slPrice)) {
      errors.slPrice = ["Enter stop-loss trigger and limit prices."];
    }

    if (!positivePrice(targetTrigger) || !positivePrice(targetPrice)) {
      errors.targetPrice = ["Enter target trigger and limit prices."];
    }
  }

  if (
    errors.tradingsymbol ||
    errors.quantity ||
    errors.price ||
    errors.triggerPrice ||
    errors.slPrice ||
    errors.targetPrice
  ) {
    return { errors };
  }

  try {
    const kite = await getAuthenticatedKiteClient();
    const resolvedLastPrice = await resolveGttLastPrice(
      kite,
      exchange,
      tradingsymbol,
      lastPrice,
    );
    const result = await kite.placeGTT({
      trigger_type: triggerType,
      exchange,
      tradingsymbol,
      last_price: resolvedLastPrice,
      trigger_values:
        triggerType === "single" ? [triggerPrice] : [slTrigger, targetTrigger],
      orders:
        triggerType === "single"
          ? [
              {
                transaction_type: transactionType,
                quantity,
                product,
                order_type: "LIMIT",
                price,
              },
            ]
          : [
              {
                transaction_type: transactionType,
                quantity,
                product,
                order_type: "LIMIT",
                price: slPrice,
              },
              {
                transaction_type: transactionType,
                quantity,
                product,
                order_type: "LIMIT",
                price: targetPrice,
              },
            ],
    });

    revalidatePath("/");
    return {
      triggerId: result.trigger_id,
      message: `GTT placed: ${result.trigger_id}`,
    };
  } catch (error) {
    return { message: kiteErrorMessage(error, "Unable to place the GTT. Try again.") };
  }
}

export type CancelGttState = {
  message?: string;
};

export async function cancelGtt(
  _state: CancelGttState | undefined,
  formData: FormData,
): Promise<CancelGttState> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/sign-in");
  }

  const triggerId = Number(readString(formData, "triggerId"));

  if (!Number.isInteger(triggerId) || triggerId < 1) {
    return { message: "Invalid GTT id." };
  }

  try {
    const kite = await getAuthenticatedKiteClient();
    await kite.deleteGTT(triggerId);
    revalidatePath("/");
    return { message: `GTT ${triggerId} cancelled.` };
  } catch (error) {
    return { message: kiteErrorMessage(error, "Unable to cancel the GTT.") };
  }
}
