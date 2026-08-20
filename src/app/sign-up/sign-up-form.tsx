"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type SignUpFormState } from "@/app/actions/auth";
import {
  AUTH_ERROR_CLASS_NAME,
  AUTH_INPUT_CLASS_NAME,
  AUTH_LABEL_CLASS_NAME,
  AUTH_SUBMIT_CLASS_NAME,
} from "@/app/auth-form-styles";

const initialSignUpState: SignUpFormState | undefined = undefined;

export function SignUpForm() {
  const [signUpState, signUpAction, isSigningUp] = useActionState(
    signUp,
    initialSignUpState,
  );

  return (
    <form action={signUpAction} className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className={AUTH_LABEL_CLASS_NAME}>
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          placeholder="Ada Lovelace"
          className={AUTH_INPUT_CLASS_NAME}
        />
        {signUpState?.errors?.name?.map((error) => (
          <p key={error} className={AUTH_ERROR_CLASS_NAME}>
            {error}
          </p>
        ))}
      </div>

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
        {signUpState?.errors?.email?.map((error) => (
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
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="At least 8 characters"
          className={AUTH_INPUT_CLASS_NAME}
        />
        {signUpState?.errors?.password?.map((error) => (
          <p key={error} className={AUTH_ERROR_CLASS_NAME}>
            {error}
          </p>
        ))}
      </div>

      {signUpState?.message ? (
        <p className={AUTH_ERROR_CLASS_NAME}>{signUpState.message}</p>
      ) : null}

      <button type="submit" disabled={isSigningUp} className={AUTH_SUBMIT_CLASS_NAME}>
        {isSigningUp ? "Creating account…" : "Sign up"}
      </button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-zinc-950 dark:text-zinc-50">
          Sign in
        </Link>
      </p>
    </form>
  );
}
