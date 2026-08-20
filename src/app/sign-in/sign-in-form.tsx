"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, type SignInFormState } from "@/app/actions/auth";
import {
  AUTH_ERROR_CLASS_NAME,
  AUTH_INPUT_CLASS_NAME,
  AUTH_LABEL_CLASS_NAME,
  AUTH_SUBMIT_CLASS_NAME,
} from "@/app/auth-form-styles";

const initialSignInState: SignInFormState | undefined = undefined;

export function SignInForm() {
  const [signInState, signInAction, isSigningIn] = useActionState(
    signIn,
    initialSignInState,
  );

  return (
    <form action={signInAction} className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className={AUTH_LABEL_CLASS_NAME}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className={AUTH_INPUT_CLASS_NAME}
        />
        {signInState?.errors?.email?.map((error) => (
          <p key={error} className={AUTH_ERROR_CLASS_NAME}>
            {error}
          </p>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className={AUTH_LABEL_CLASS_NAME}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          placeholder="At least 8 characters"
          className={AUTH_INPUT_CLASS_NAME}
        />
        {signInState?.errors?.password?.map((error) => (
          <p key={error} className={AUTH_ERROR_CLASS_NAME}>
            {error}
          </p>
        ))}
      </div>

      {signInState?.message ? (
        <p className={AUTH_ERROR_CLASS_NAME}>{signInState.message}</p>
      ) : null}

      <button type="submit" disabled={isSigningIn} className={AUTH_SUBMIT_CLASS_NAME}>
        {isSigningIn ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Need an account?{" "}
        <Link href="/sign-up" className="font-medium text-zinc-950 dark:text-zinc-50">
          Sign up
        </Link>
      </p>
    </form>
  );
}
