"use client";

import { useActionState, useState, useTransition } from "react";
import { CopyTpinButton } from "@/app/copy-tpin-button";
import { EdisForm } from "@/app/edis-form";
import {
  saveKiteCredentials,
  startKiteLogin,
  type SaveKiteCredentialsState,
} from "@/app/actions/kite";
import { assignTabUrl, openBlankTab, openKnownUrl } from "@/lib/open-external";
import {
  AUTH_ERROR_CLASS_NAME,
  AUTH_INPUT_CLASS_NAME,
  AUTH_LABEL_CLASS_NAME,
  AUTH_SUBMIT_CLASS_NAME,
} from "@/app/auth-form-styles";

const initialSaveState: SaveKiteCredentialsState | undefined = undefined;

type KiteSetupProps = {
  hasCredentials: boolean;
  hasTpin: boolean;
  apiKey: string | null;
  isAuthenticated: boolean;
  accessTokenExpiresLabel: string | null;
  kiteStatus?: string;
  edisStatus?: string;
};

const kiteStatusMessages: Record<string, string> = {
  connected: "Kite access token saved.",
  denied: "Kite authorization was cancelled or did not return a request token.",
  failed: "Kite session creation failed. Try authenticating again.",
  "missing-credentials": "Save your Kite API key and secret before authenticating.",
};

const edisStatusMessages: Record<string, string> = {
  failed: "Could not start eDIS. Check that Kite is authenticated and try again.",
  invalid: "Choose a valid holding quantity to authorise.",
};

export function KiteSetup({
  hasCredentials,
  hasTpin,
  apiKey,
  isAuthenticated,
  accessTokenExpiresLabel,
  kiteStatus,
  edisStatus,
}: KiteSetupProps) {
  const [saveState, saveAction, isSaving] = useActionState(
    saveKiteCredentials,
    initialSaveState,
  );
  const [isOpeningLogin, startLoginTransition] = useTransition();
  const [loginError, setLoginError] = useState<string>();
  const statusMessage = kiteStatus ? kiteStatusMessages[kiteStatus] : undefined;
  const isErrorStatus = kiteStatus && kiteStatus !== "connected";
  const edisMessage = edisStatus ? edisStatusMessages[edisStatus] : undefined;

  function openKiteLogin() {
    if (apiKey) {
      const opened = openKnownUrl(
        `https://kite.zerodha.com/connect/login?api_key=${encodeURIComponent(apiKey)}&v=3`,
      );

      if (!opened) {
        setLoginError("Allow pop-ups to open Kite login in a new tab.");
      }

      return;
    }

    const tab = openBlankTab();

    startLoginTransition(async () => {
      setLoginError(undefined);
      let actionError: string | undefined;
      const opened = await assignTabUrl(tab, async () => {
        const result = await startKiteLogin();

        if (result.error || !result.url) {
          actionError = "Unable to open Kite login. Save credentials and try again.";
          return undefined;
        }

        return result.url;
      });

      if (actionError) {
        setLoginError(actionError);
        return;
      }

      if (!opened) {
        setLoginError("Allow pop-ups to open Kite login in a new tab.");
      }
    });
  }

  return (
    <section>
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

      {edisMessage ? <p className={`mt-4 ${AUTH_ERROR_CLASS_NAME}`}>{edisMessage}</p> : null}

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
            required={!hasCredentials}
            autoComplete="off"
            placeholder={hasCredentials ? "Leave blank to keep the saved secret" : "Kite API secret"}
            className={AUTH_INPUT_CLASS_NAME}
          />
          {saveState?.errors?.apiSecret?.map((error) => (
            <p key={error} className={AUTH_ERROR_CLASS_NAME}>
              {error}
            </p>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="tpin" className={AUTH_LABEL_CLASS_NAME}>
            CDSL TPIN
          </label>
          <input
            id="tpin"
            name="tpin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            placeholder={hasTpin ? "Saved. Enter 6 digits to replace" : "6-digit CDSL TPIN"}
            className={AUTH_INPUT_CLASS_NAME}
          />
          <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            Optional. Stored on your account only. CDSL still asks for it on their
            page during eDIS — Kite cannot submit TPIN for you.
          </p>
          {hasTpin ? <CopyTpinButton /> : null}
          {saveState?.errors?.tpin?.map((error) => (
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
              <div className="mt-4">
                <EdisForm />
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  Opens Zerodha / CDSL in a new tab. Copy your saved TPIN first if
                  you need it on the CDSL page. Skip this if DDPI is already
                  active. Authorisation lasts until 5:30 PM IST.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <button
                type="button"
                disabled={isOpeningLogin}
                onClick={openKiteLogin}
                className={AUTH_SUBMIT_CLASS_NAME}
              >
                {isOpeningLogin ? "Opening…" : "Authenticate"}
              </button>
              {loginError ? <p className={`mt-2 ${AUTH_ERROR_CLASS_NAME}`}>{loginError}</p> : null}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
