import Link from "next/link";
import { redirect } from "next/navigation";
import { KiteSetup } from "@/app/kite-setup";
import { TradingWorkspace } from "@/app/trading-workspace";
import { getCurrentUser } from "@/lib/auth";
import { getGtts, getHoldings, getKiteConnectionStatus } from "@/lib/kite";

export default async function Home({
  searchParams,
}: PageProps<"/">) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/sign-in");
  }

  const kiteStatus = await getKiteConnectionStatus();
  const params = await searchParams;
  const kiteFlash = typeof params.kite === "string" ? params.kite : undefined;
  const [holdingsResult, gttsResult] = kiteStatus?.isAuthenticated
    ? await Promise.all([getHoldings(), getGtts()])
    : [null, null];

  return (
    <div className="flex flex-1 flex-col px-6 py-10">
      <main className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Signed in</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Welcome, {currentUser.name}
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{currentUser.email}</p>
          </div>
          <Link
            href="/sign-out"
            className="inline-flex h-11 items-center rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            Sign out
          </Link>
        </div>

        {kiteStatus?.isAuthenticated && holdingsResult && gttsResult ? (
          <TradingWorkspace
            holdings={holdingsResult.holdings}
            holdingsError={holdingsResult.error}
            gtts={gttsResult.gtts}
            gttsError={gttsResult.error}
          />
        ) : null}

        {kiteStatus ? (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <KiteSetup
              hasCredentials={kiteStatus.hasCredentials}
              apiKey={kiteStatus.apiKey}
              isAuthenticated={kiteStatus.isAuthenticated}
              accessTokenExpiresLabel={
                kiteStatus.accessTokenExpiresAt
                  ? kiteStatus.accessTokenExpiresAt.toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : null
              }
              kiteStatus={kiteFlash}
            />
          </div>
        ) : null}
      </main>
    </div>
  );
}
