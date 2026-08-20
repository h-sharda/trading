"use client";

import { useState, useTransition } from "react";
import { getStoredCdslTpin } from "@/app/actions/kite";
import { AUTH_ERROR_CLASS_NAME } from "@/app/auth-form-styles";

const BUTTON_CLASS_NAME =
  "inline-flex h-11 items-center rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-900";

export function CopyTpinButton() {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const [message, setMessage] = useState<string>();

  function copy() {
    startTransition(async () => {
      setMessage(undefined);

      try {
        const result = await getStoredCdslTpin();

        if (!result.tpin) {
          setStatus("error");
          setMessage(result.message ?? "Unable to copy TPIN.");
          return;
        }

        await navigator.clipboard.writeText(result.tpin);
        setStatus("copied");
      } catch {
        setStatus("error");
        setMessage("Unable to copy TPIN. Check clipboard permission.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button type="button" disabled={isPending} onClick={copy} className={BUTTON_CLASS_NAME}>
        {isPending ? "Copying…" : status === "copied" ? "Copied" : "Copy saved TPIN"}
      </button>
      {message ? <p className={AUTH_ERROR_CLASS_NAME}>{message}</p> : null}
    </div>
  );
}
