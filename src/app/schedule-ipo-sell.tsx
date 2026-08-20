"use client";

import { useActionState } from "react";
import {
  cancelScheduledOrder,
  scheduleIpoSell,
  type CancelScheduledOrderState,
  type ScheduleOrderState,
} from "@/app/actions/scheduled-orders";
import {
  AUTH_ERROR_CLASS_NAME,
  AUTH_INPUT_CLASS_NAME,
  AUTH_LABEL_CLASS_NAME,
  AUTH_SUBMIT_CLASS_NAME,
} from "@/app/auth-form-styles";
import type { HoldingDto } from "@/lib/holding";
import type { ScheduledOrderDto } from "@/lib/scheduled-order";

const initialScheduleState: ScheduleOrderState | undefined = undefined;
const initialCancelState: CancelScheduledOrderState | undefined = undefined;

const istDateTime = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  dateStyle: "medium",
  timeStyle: "short",
});

type ScheduleIpoSellProps = {
  orders: ScheduledOrderDto[];
  defaultHolding?: HoldingDto | null;
  defaultDate: string;
  defaultTime: string;
  kiteIsAuthenticated: boolean;
  kiteExpiresLabel: string | null;
};

function statusClass(status: ScheduledOrderDto["status"]) {
  if (status === "placed") {
    return "text-emerald-700 dark:text-emerald-400";
  }

  if (status === "failed" || status === "cancelled") {
    return "text-red-600 dark:text-red-400";
  }

  if (status === "armed") {
    return "text-amber-700 dark:text-amber-400";
  }

  return "text-zinc-950 dark:text-zinc-50";
}

export function ScheduleIpoSell({
  orders,
  defaultHolding,
  defaultDate,
  defaultTime,
  kiteIsAuthenticated,
  kiteExpiresLabel,
}: ScheduleIpoSellProps) {
  const [scheduleState, scheduleAction, isScheduling] = useActionState(
    scheduleIpoSell,
    initialScheduleState,
  );
  const [cancelState, cancelAction, isCancelling] = useActionState(
    cancelScheduledOrder,
    initialCancelState,
  );
  const pendingCount = orders.filter((order) => order.status === "pending").length;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        Listing day
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        Schedule IPO sell
      </h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Places a CNC market sell the instant listing starts, usually 10:00 AM IST.
        Keep this app running on the VPS and complete Kite login after 6:00 AM IST
        that morning.
      </p>

      {kiteIsAuthenticated ? (
        <p className="mt-4 text-sm text-emerald-700 dark:text-emerald-400">
          Kite is authorized{kiteExpiresLabel ? ` until ${kiteExpiresLabel}` : ""}.
        </p>
      ) : (
        <p className="mt-4 text-sm text-amber-700 dark:text-amber-400">
          Kite is not authorized yet. The scheduled sell will fail unless you
          authorize after 6:00 AM IST and before listing open.
        </p>
      )}

      <form action={scheduleAction} className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="schedule-exchange" className={AUTH_LABEL_CLASS_NAME}>
            Exchange
          </label>
          <select
            id="schedule-exchange"
            name="exchange"
            required
            defaultValue={defaultHolding?.exchange === "BSE" ? "BSE" : "NSE"}
            className={AUTH_INPUT_CLASS_NAME}
          >
            <option value="NSE">NSE</option>
            <option value="BSE">BSE</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="schedule-symbol" className={AUTH_LABEL_CLASS_NAME}>
            Symbol
          </label>
          <input
            id="schedule-symbol"
            name="tradingsymbol"
            type="text"
            required
            defaultValue={defaultHolding?.tradingsymbol ?? ""}
            placeholder="LISTINGSYMBOL"
            autoComplete="off"
            className={`${AUTH_INPUT_CLASS_NAME} uppercase`}
          />
          {scheduleState?.errors?.tradingsymbol?.map((error) => (
            <p key={error} className={AUTH_ERROR_CLASS_NAME}>
              {error}
            </p>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="schedule-quantity" className={AUTH_LABEL_CLASS_NAME}>
            Quantity
          </label>
          <input
            id="schedule-quantity"
            name="quantity"
            type="number"
            required
            min={1}
            step={1}
            defaultValue={defaultHolding?.quantity || 1}
            className={AUTH_INPUT_CLASS_NAME}
          />
          {scheduleState?.errors?.quantity?.map((error) => (
            <p key={error} className={AUTH_ERROR_CLASS_NAME}>
              {error}
            </p>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="schedule-date" className={AUTH_LABEL_CLASS_NAME}>
            Listing date (IST)
          </label>
          <input
            id="schedule-date"
            name="executeDate"
            type="date"
            required
            defaultValue={defaultDate}
            className={AUTH_INPUT_CLASS_NAME}
          />
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <label htmlFor="schedule-time" className={AUTH_LABEL_CLASS_NAME}>
            Sell time (IST)
          </label>
          <input
            id="schedule-time"
            name="executeTime"
            type="time"
            required
            defaultValue={defaultTime}
            className={AUTH_INPUT_CLASS_NAME}
          />
          <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            New IPO allotments start trading at 10:00 AM. Change this only if the
            exchange publishes a different open.
          </p>
          {scheduleState?.errors?.executeAt?.map((error) => (
            <p key={error} className={AUTH_ERROR_CLASS_NAME}>
              {error}
            </p>
          ))}
        </div>

        {scheduleState?.message ? (
          <p
            className={
              scheduleState.ok
                ? "sm:col-span-2 text-sm text-emerald-700 dark:text-emerald-400"
                : `sm:col-span-2 ${AUTH_ERROR_CLASS_NAME}`
            }
          >
            {scheduleState.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isScheduling}
          className={`${AUTH_SUBMIT_CLASS_NAME} sm:col-span-2`}
        >
          {isScheduling ? "Scheduling…" : "Schedule market sell"}
        </button>
      </form>

      <div className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h3 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
          Scheduled sells
          {pendingCount ? ` · ${pendingCount} pending` : ""}
        </h3>

        {cancelState?.message ? (
          <p
            className={
              cancelState.message.includes("cancelled")
                ? "mt-3 text-sm text-emerald-700 dark:text-emerald-400"
                : `mt-3 ${AUTH_ERROR_CLASS_NAME}`
            }
          >
            {cancelState.message}
          </p>
        ) : null}

        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            No scheduled sells yet. Add one before listing morning.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  <th className="py-2 pr-4 font-medium">Symbol</th>
                  <th className="py-2 pr-4 font-medium">When</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                  >
                    <td className="py-3 pr-4">
                      <p className="font-medium text-zinc-950 dark:text-zinc-50">
                        {order.tradingsymbol}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {order.transactionType} {order.quantity} · {order.exchange}{" "}
                        · {order.orderType}
                      </p>
                    </td>
                    <td className="py-3 pr-4 text-zinc-950 dark:text-zinc-50">
                      {istDateTime.format(new Date(order.executeAt))}
                    </td>
                    <td className={`py-3 pr-4 capitalize ${statusClass(order.status)}`}>
                      {order.status}
                      {order.kiteOrderId ? (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {order.kiteOrderId}
                        </p>
                      ) : null}
                      {order.errorMessage ? (
                        <p className="text-xs text-red-600 dark:text-red-400">
                          {order.errorMessage}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-3 text-right">
                      {order.status === "pending" ? (
                        <form action={cancelAction}>
                          <input type="hidden" name="orderId" value={order.id} />
                          <button
                            type="submit"
                            disabled={isCancelling}
                            className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-950 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-900"
                          >
                            Cancel
                          </button>
                        </form>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
