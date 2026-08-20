const MOBILE_TAB_NAME = "kite-connect";

export function isMobileBrowser() {
  return (
    window.matchMedia("(max-width: 767px), (pointer: coarse)").matches ||
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  );
}

function openWindow(url: string) {
  if (isMobileBrowser()) {
    return window.open(url, MOBILE_TAB_NAME);
  }

  return window.open(url, "_blank", "noopener,noreferrer");
}

export function openBlankTab() {
  return openWindow("about:blank");
}

export function openKnownUrl(url: string) {
  return openWindow(url);
}

export async function assignTabUrl(
  tab: Window | null,
  resolveUrl: () => Promise<string | undefined>,
) {
  try {
    const url = await resolveUrl();

    if (!url) {
      tab?.close();
      return false;
    }

    if (tab) {
      tab.location.replace(url);
      return true;
    }

    return Boolean(openWindow(url));
  } catch {
    tab?.close();
    return false;
  }
}
