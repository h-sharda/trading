"use server";

import { KiteConnect } from "kiteconnect";
import type {
  Exchanges,
  OrderType,
  Product,
  TransactionType,
  Validity,
  Variety,
} from "kiteconnect";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAuthenticatedKiteClient, kiteErrorMessage } from "@/lib/kite";
import { prisma } from "@/lib/prisma";

export type SaveKiteCredentialsState = {
  errors?: {
    apiKey?: string[];
    apiSecret?: string[];
  };
  message?: string;
};

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
  const errors: SaveKiteCredentialsState["errors"] = {};

  if (apiKey.length < 4) {
    errors.apiKey = ["Enter your Kite API key."];
  }

  if (apiSecret.length < 4) {
    errors.apiSecret = ["Enter your Kite API secret."];
  }

  if (errors.apiKey || errors.apiSecret) {
    return { errors };
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { kiteApiKey: true },
    });

    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        kiteApiKey: apiKey,
        kiteApiSecret: apiSecret,
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

export async function startKiteLogin() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { kiteApiKey: true, kiteApiSecret: true },
  });

  if (!user?.kiteApiKey || !user.kiteApiSecret) {
    redirect("/");
  }

  const kite = new KiteConnect({ api_key: user.kiteApiKey });
  redirect(kite.getLoginURL());
}

export type PlaceOrderState = {
  errors?: {
    tradingsymbol?: string[];
    quantity?: string[];
    price?: string[];
    triggerPrice?: string[];
  };
  message?: string;
  orderId?: string;
};

const VARIETIES = new Set<Variety>(["regular", "amo"]);
const EXCHANGES = new Set<Exchanges>(["NSE", "BSE", "NFO", "BFO", "CDS", "MCX"]);
const TRANSACTION_TYPES = new Set<TransactionType>(["BUY", "SELL"]);
const PRODUCTS = new Set<Product>(["CNC", "MIS", "NRML"]);
const ORDER_TYPES = new Set<OrderType>(["MARKET", "LIMIT", "SL", "SL-M"]);
const VALIDITIES = new Set<Validity>(["DAY", "IOC"]);

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
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
