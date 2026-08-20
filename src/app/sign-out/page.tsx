import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";

export default async function SignOutPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/sign-in");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Sign out
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Sign out of {currentUser.email}? You will need your password to sign
          back in.
        </p>
        <form action={signOut} className="mt-8 flex flex-col gap-3">
          <button
            type="submit"
            className="h-11 rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:bg-zinc-50 dark:text-zinc-950"
          >
            Sign out
          </button>
          <Link
            href="/"
            className="flex h-11 items-center justify-center rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-950 dark:border-zinc-800 dark:text-zinc-50"
          >
            Cancel
          </Link>
        </form>
      </div>
    </div>
  );
}
