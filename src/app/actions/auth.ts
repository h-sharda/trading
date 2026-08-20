"use server";

import { hash, verify } from "argon2";
import { redirect } from "next/navigation";
import { createSession, deleteSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SignInFormState = {
  errors?: {
    email?: string[];
    password?: string[];
  };
  message?: string;
};

export type SignUpFormState = {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
  };
  message?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readEmail(formData: FormData) {
  return String(formData.get("email") ?? "").trim().toLowerCase();
}

function readPassword(formData: FormData) {
  return String(formData.get("password") ?? "");
}

function readName(formData: FormData) {
  return String(formData.get("name") ?? "").trim();
}

export async function signIn(
  _state: SignInFormState | undefined,
  formData: FormData,
): Promise<SignInFormState> {
  const email = readEmail(formData);
  const password = readPassword(formData);
  const errors: SignInFormState["errors"] = {};

  if (!EMAIL_PATTERN.test(email)) {
    errors.email = ["Enter a valid email address."];
  }

  if (password.length < 8) {
    errors.password = ["Password must be at least 8 characters."];
  }

  if (errors.email || errors.password) {
    return { errors };
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await verify(user.passwordHash, password))) {
      return { message: "Incorrect email or password." };
    }

    await createSession(user.id);
  } catch {
    return { message: "Unable to sign in. Try again." };
  }

  redirect("/");
}

export async function signUp(
  _state: SignUpFormState | undefined,
  formData: FormData,
): Promise<SignUpFormState> {
  const name = readName(formData);
  const email = readEmail(formData);
  const password = readPassword(formData);
  const errors: SignUpFormState["errors"] = {};

  console.log(name);
  console.log(errors);
  console.log(password);
  console.log(email);

  if (name.length < 2) {
    errors.name = ["Name must be at least 2 characters."];
  }

  if (!EMAIL_PATTERN.test(email)) {
    errors.email = ["Enter a valid email address."];
  }

  if (password.length < 8) {
    errors.password = ["Password must be at least 8 characters."];
  }

  if (errors.name || errors.email || errors.password) {
    return { errors };
  }

  try {
    console.log("REACHED HERE");
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await hash(password),
      },
    });
    console.log("REACHED HERE AFTER CREATION");

    await createSession(user.id);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return { message: "An account with this email already exists." };
    }

    return { message: "Unable to sign up. Try again." };
  }

  redirect("/");
}

export async function signOut() {
  await deleteSession();
  redirect("/sign-in");
}
