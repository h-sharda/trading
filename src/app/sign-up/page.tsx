import { redirect } from "next/navigation";
import { SignUpForm } from "@/app/sign-up/sign-up-form";
import { getCurrentUser } from "@/lib/auth";

export default async function SignUpPage() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect("/");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Sign up
        </h1>
        <p className="mt-2 mb-8 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Create an account with your name, email, and password.
        </p>
        <SignUpForm />
      </div>
    </div>
  );
}
