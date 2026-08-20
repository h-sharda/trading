"use client";

import { useActionState } from "react";
import {
  saveKiteCredentials,
  startKiteLogin,
  type SaveKiteCredentialsState,
} from "@/app/actions/kite";
import {
  AUTH_ERROR_CLASS_NAME,
  AUTH_INPUT_CLASS_NAME,
  AUTH_LABEL_CLASS_NAME,
  AUTH_SUBMIT_CLASS_NAME,
} from "@/app/auth-form-styles";

const initialSaveState: SaveKiteCredentialsState | undefined = undefined;

type KiteSetupProps = {
  hasCredentials: boolean;
  apiKey: string | null;
  isAuthenticated: boolean;
  accessTokenExpiresLabel: string | null;
  kiteStatus?: string;
};

const kiteStatusMessages: Record<string, string> = {
  connected: "Kite access token saved.",
  denied: "Kite authorization was cancelled or did not return a request token.",
  failed: "Kite session creation failed. Try authenticating again.",
  "missing-credentials": "Save your Kite API key and secret before authenticating.",
};

export function KiteSetup({
  hasCredentials,
  apiKey,
  isAuthenticated,
  accessTokenExpiresLabel,
  kiteStatus,
}: KiteSetupProps) {
  const [saveState, saveAction, isSaving] = useActionState(
    saveKiteCredentials,
    initialSaveState,
  );
  const statusMessage = kiteStatus ? kiteStatusMessages[kiteStatus] : undefined;
  const isErrorStatus = kiteStatus && kiteStatus !== "connected";

  return (
    <section className="mt-8 border-t border-zinc-200 pt-8 dark:border-zinc-800">
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Kite</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        Broker connection
      </h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Save your Kite API key and secret, then authorize with Zerodha. The access
        token expires at 6:00 AM IST the next trading day.
      </p>

      {statusMessage ? (
        <p
          className={
            isErrorStatus
              ? `mt-4 ${AUTH_ERROR_CLASS_NAME}`
              : "mt-4 text-sm text-emerald-700 dark:text-emerald-400"
          }
        >
          {statusMessage}
        </p>
      ) : null}

      <form action={saveAction} className="mt-6 flex w-full flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="apiKey" className={AUTH_LABEL_CLASS_NAME}>
            API key
          </label>
          <input
            id="apiKey"
            name="apiKey"
            type="text"
            required
            defaultValue={apiKey ?? ""}
            autoComplete="off"
            placeholder="Kite API key"
            className={AUTH_INPUT_CLASS_NAME}
          />
          {saveState?.errors?.apiKey?.map((error) => (
            <p key={error} className={AUTH_ERROR_CLASS_NAME}>
              {error}
            </p>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="apiSecret" className={AUTH_LABEL_CLASS_NAME}>
            API secret
          </label>
          <input
            id="apiSecret"
            name="apiSecret"
            type="password"
            required
            autoComplete="off"
            placeholder={hasCredentials ? "Enter to update the saved secret" : "Kite API secret"}
            className={AUTH_INPUT_CLASS_NAME}
          />
          {saveState?.errors?.apiSecret?.map((error) => (
            <p key={error} className={AUTH_ERROR_CLASS_NAME}>
              {error}
            </p>
          ))}
        </div>

        {saveState?.message ? (
          <p className={AUTH_ERROR_CLASS_NAME}>{saveState.message}</p>
        ) : null}

        <button type="submit" disabled={isSaving} className={AUTH_SUBMIT_CLASS_NAME}>
          {isSaving ? "Saving…" : hasCredentials ? "Update credentials" : "Save credentials"}
        </button>
      </form>

      {hasCredentials ? (
        <div className="mt-8">
          {isAuthenticated ? (
            <div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Authenticated
              </p>
              {accessTokenExpiresLabel ? (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Access token valid until {accessTokenExpiresLabel} IST
                </p>
              ) : null}
            </div>
          ) : (
            <form action={startKiteLogin}>
              <button type="submit" className={AUTH_SUBMIT_CLASS_NAME}>
                Authenticate
              </button>
            </form>
          )}
        </div>
      ) : null}
    </section>
  );
}
