"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function subscribe() {
  return () => {};
}

function getStandaloneSnapshot() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean((navigator as { standalone?: boolean }).standalone))
  );
}

function getIosSnapshot() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function getServerSnapshot() {
  return false;
}

export function InstallApp() {
  const standalone = useSyncExternalStore(subscribe, getStandaloneSnapshot, getServerSnapshot);
  const iosDevice = useSyncExternalStore(subscribe, getIosSnapshot, getServerSnapshot);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (standalone) {
      return;
    }

    function onPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, [standalone]);

  if (standalone || (!installEvent && !iosDevice)) {
    return null;
  }

  return (
    <div className="mx-auto mb-6 w-full max-w-6xl rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
      {installEvent ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p>Install Trading on this phone to open it from the home screen.</p>
          <button
            type="button"
            className="inline-flex h-10 items-center rounded-lg bg-zinc-950 px-3 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-950"
            onClick={async () => {
              await installEvent.prompt();
              setInstallEvent(null);
            }}
          >
            Install
          </button>
        </div>
      ) : (
        <p>
          Add this to your home screen: tap Share, then{" "}
          <span className="font-medium text-zinc-950 dark:text-zinc-50">Add to Home Screen</span>.
        </p>
      )}
    </div>
  );
}
