"use server";

import { KiteConnect } from "kiteconnect";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
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
