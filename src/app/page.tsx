import Link from "next/link";
import { redirect } from "next/navigation";
import { KiteSetup } from "@/app/kite-setup";
import { getCurrentUser } from "@/lib/auth";
import { getKiteConnectionStatus } from "@/lib/kite";

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

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <main className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Signed in</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Welcome, {currentUser.name}
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{currentUser.email}</p>
        {kiteStatus ? (
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
        ) : null}
        <Link
          href="/sign-out"
          className="mt-8 inline-flex h-11 items-center rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          Sign out
        </Link>
      </main>
    </div>
  );
}
