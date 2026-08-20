import { KiteConnect } from "kiteconnect";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { kiteAccessTokenExpiresAt } from "@/lib/kite";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/sign-in");
  }

  const status = request.nextUrl.searchParams.get("status");
  const requestToken = request.nextUrl.searchParams.get("request_token");

  if (status !== "success" || !requestToken) {
    redirect("/?kite=denied");
  }

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: {
      kiteApiKey: true,
      kiteApiSecret: true,
    },
  });

  if (!user?.kiteApiKey || !user.kiteApiSecret) {
    redirect("/?kite=missing-credentials");
  }

  try {
    const kite = new KiteConnect({ api_key: user.kiteApiKey });
    const session = await kite.generateSession(requestToken, user.kiteApiSecret);

    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        kiteAccessToken: session.access_token,
        kiteAccessTokenExpiresAt: kiteAccessTokenExpiresAt(),
      },
    });
  } catch {
    redirect("/?kite=failed");
  }

  redirect("/?kite=connected");
}
