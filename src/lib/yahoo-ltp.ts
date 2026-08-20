import "server-only";

const YAHOO_SUFFIX: Record<string, string> = {
  NSE: ".NS",
  BSE: ".BO",
};

function yahooSymbol(exchange: string, tradingsymbol: string) {
  const symbol = tradingsymbol.trim().toUpperCase();
  const suffix = YAHOO_SUFFIX[exchange.toUpperCase()];

  if (!symbol || !suffix) {
    return null;
  }

  return `${symbol}${suffix}`;
}

export async function getYahooLastPrice(exchange: string, tradingsymbol: string) {
  const symbol = yahooSymbol(exchange, tradingsymbol);

  if (!symbol) {
    return null;
  }

  try {
    const url = new URL(
      `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
    );
    url.searchParams.set("interval", "1m");
    url.searchParams.set("range", "1d");

    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      chart?: {
        result?: Array<{
          meta?: { regularMarketPrice?: number };
        }>;
      };
    };
    const lastPrice = payload.chart?.result?.[0]?.meta?.regularMarketPrice;

    return Number.isFinite(lastPrice) && lastPrice && lastPrice > 0 ? lastPrice : null;
  } catch {
    return null;
  }
}
