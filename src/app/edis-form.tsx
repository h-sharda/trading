"use client";

import { useState, useTransition } from "react";
import { startEdis } from "@/app/actions/kite";
import { AUTH_ERROR_CLASS_NAME } from "@/app/auth-form-styles";
import { assignTabUrl, openBlankTab } from "@/lib/open-external";

const BUTTON_CLASS_NAME =
  "inline-flex h-11 items-center rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-900";

const COMPACT_BUTTON_CLASS_NAME =
  "rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-950 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-900";

const errorMessages = {
  failed: "Could not start eDIS. Check that Kite is authenticated and try again.",
  invalid: "Choose a valid holding quantity to authorise.",
};

type EdisFormProps = {
  isin?: string;
  quantity?: number;
  compact?: boolean;
  label?: string;
};

export function EdisForm({ isin, quantity, compact, label }: EdisFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function submit() {
    const formData = new FormData();

    if (isin) {
      formData.set("isin", isin);
    }

    if (quantity != null) {
      formData.set("quantity", String(quantity));
    }

    const tab = openBlankTab();

    startTransition(async () => {
      setError(undefined);
      let actionError: string | undefined;
      const opened = await assignTabUrl(tab, async () => {
        const result = await startEdis(formData);

        if (result.error) {
          actionError = errorMessages[result.error];
          return undefined;
        }

        return result.url;
      });

      if (actionError) {
        setError(actionError);
        return;
      }

      if (!opened) {
        setError("Allow pop-ups to open the eDIS page in a new tab.");
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={submit}
        title={error}
        className={compact ? COMPACT_BUTTON_CLASS_NAME : BUTTON_CLASS_NAME}
      >
        {isPending ? "Opening…" : (label ?? (isin ? "eDIS" : "Authorize eDIS"))}
      </button>
      {error && !compact ? <p className={`mt-2 ${AUTH_ERROR_CLASS_NAME}`}>{error}</p> : null}
    </div>
  );
}
