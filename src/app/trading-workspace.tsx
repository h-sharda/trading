"use client";

import { useState } from "react";
import { EdisForm } from "@/app/edis-form";
import { GttList } from "@/app/gtt-list";
import { PlaceOrderForm } from "@/app/place-order-form";
import { ScheduleIpoSell } from "@/app/schedule-ipo-sell";
import type { GttDto } from "@/lib/gtt";
import { holdingNeedsEdis, type HoldingDto } from "@/lib/holding";
import type { ScheduledOrderDto } from "@/lib/scheduled-order";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const percent = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
});

function signedClass(value: number) {
  if (value > 0) {
    return "text-emerald-700 dark:text-emerald-400";
  }

  if (value < 0) {
    return "text-red-600 dark:text-red-400";
  }

  return "text-zinc-600 dark:text-zinc-400";
}

type TradingWorkspaceProps = {
  holdings: HoldingDto[];
  holdingsError?: string;
  gtts: GttDto[];
  gttsError?: string;
  scheduledOrders: ScheduledOrderDto[];
  defaultScheduleDate: string;
  defaultScheduleTime: string;
  kiteIsAuthenticated: boolean;
  kiteExpiresLabel: string | null;
};

export function TradingWorkspace({
  holdings,
  holdingsError,
  gtts,
  gttsError,
  scheduledOrders,
  defaultScheduleDate,
  defaultScheduleTime,
  kiteIsAuthenticated,
  kiteExpiresLabel,
}: TradingWorkspaceProps) {
  const [selected, setSelected] = useState<HoldingDto | null>(null);
  const [scheduleHolding, setScheduleHolding] = useState<HoldingDto | null>(null);
  const invested = holdings.reduce(
    (sum, holding) => sum + holding.averagePrice * holding.quantity,
    0,
  );
  const current = holdings.reduce(
    (sum, holding) => sum + holding.lastPrice * holding.quantity,
    0,
  );
  const pnl = holdings.reduce((sum, holding) => sum + holding.pnl, 0);

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)]">
      <div className="xl:col-span-2">
        <ScheduleIpoSell
          key={
            scheduleHolding
              ? `${scheduleHolding.exchange}:${scheduleHolding.tradingsymbol}:${scheduleHolding.quantity}`
              : "empty-schedule"
          }
          orders={scheduledOrders}
          defaultHolding={scheduleHolding}
          defaultDate={defaultScheduleDate}
          defaultTime={defaultScheduleTime}
          kiteIsAuthenticated={kiteIsAuthenticated}
          kiteExpiresLabel={kiteExpiresLabel}
        />
      </div>

      {kiteIsAuthenticated ? (
      <>
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Portfolio</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Holdings
            </h2>
            {holdings.some(holdingNeedsEdis) ? (
              <div className="mt-3">
                <EdisForm compact label="Authorize all eDIS" />
              </div>
            ) : null}
          </div>
          {holdings.length > 0 ? (
            <dl className="flex flex-wrap gap-6 text-sm">
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Invested</dt>
                <dd className="mt-1 font-medium text-zinc-950 dark:text-zinc-50">
                  {inr.format(invested)}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Current</dt>
                <dd className="mt-1 font-medium text-zinc-950 dark:text-zinc-50">
                  {inr.format(current)}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">P&amp;L</dt>
                <dd className={`mt-1 font-medium ${signedClass(pnl)}`}>{inr.format(pnl)}</dd>
              </div>
            </dl>
          ) : null}
        </div>

        {holdingsError ? (
          <p className="mt-6 text-sm text-red-600 dark:text-red-400">{holdingsError}</p>
        ) : holdings.length === 0 ? (
          <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
            No holdings in this account yet.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  <th className="py-2 pr-4 font-medium">Symbol</th>
                  <th className="py-2 pr-4 font-medium">Qty</th>
                  <th className="py-2 pr-4 font-medium">eDIS</th>
                  <th className="py-2 pr-4 font-medium">Avg</th>
                  <th className="py-2 pr-4 font-medium">LTP</th>
                  <th className="py-2 pr-4 font-medium">P&amp;L</th>
                  <th className="py-2 pr-4 font-medium">Day</th>
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding) => (
                  <tr
                    key={`${holding.exchange}:${holding.tradingsymbol}:${holding.product}`}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                  >
                    <td className="py-3 pr-4">
                      <p className="font-medium text-zinc-950 dark:text-zinc-50">
                        {holding.tradingsymbol}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {holding.exchange} · {holding.product}
                      </p>
                    </td>
                    <td className="py-3 pr-4 text-zinc-950 dark:text-zinc-50">
                      {holding.quantity}
                      {holding.t1Quantity ? (
                        <span className="ml-1 text-xs text-zinc-500">
                          ({holding.t1Quantity} T1)
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4 text-zinc-600 dark:text-zinc-400">
                      {holdingNeedsEdis(holding) ? (
                        <span>
                          {holding.authorisedQuantity}/{holding.realisedQuantity}
                        </span>
                      ) : holding.realisedQuantity > 0 ? (
                        <span className="text-emerald-700 dark:text-emerald-400">
                          {holding.authorisedQuantity} ok
                        </span>
                      ) : (
                        <span className="text-xs">T1 only</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-zinc-950 dark:text-zinc-50">
                      {inr.format(holding.averagePrice)}
                    </td>
                    <td className="py-3 pr-4 text-zinc-950 dark:text-zinc-50">
                      {inr.format(holding.lastPrice)}
                    </td>
                    <td className={`py-3 pr-4 ${signedClass(holding.pnl)}`}>
                      {inr.format(holding.pnl)}
                    </td>
                    <td className={`py-3 pr-4 ${signedClass(holding.dayChange)}`}>
                      {inr.format(holding.dayChange)}{" "}
                      <span className="text-xs">
                        ({percent.format(holding.dayChangePercentage)}%)
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {holdingNeedsEdis(holding) ? (
                          <EdisForm
                            compact
                            isin={holding.isin}
                            quantity={holding.realisedQuantity}
                          />
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setScheduleHolding(holding)}
                          className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-950 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-900"
                        >
                          Schedule
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelected(holding)}
                          className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-950 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-900"
                        >
                          Trade
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <PlaceOrderForm
        key={
          selected
            ? `${selected.exchange}:${selected.tradingsymbol}:${selected.product}`
            : "empty"
        }
        defaultHolding={selected}
      />

      <div className="xl:col-span-2">
        <GttList gtts={gtts} error={gttsError} />
      </div>
      </>
      ) : null}
    </div>
  );
}
