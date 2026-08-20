import { redirect } from "next/navigation";
import { SignInForm } from "@/app/sign-in/sign-in-form";
import { getCurrentUser } from "@/lib/auth";

export default async function SignInPage() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect("/");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Sign in
        </h1>
        <p className="mt-2 mb-8 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Use your email and password. You stay signed in indefinitely until you
          sign out.
        </p>
        <SignInForm />
      </div>
    </div>
  );
}
