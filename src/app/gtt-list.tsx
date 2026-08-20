"use client";

import { useActionState } from "react";
import { cancelGtt, type CancelGttState } from "@/app/actions/kite";
import { AUTH_ERROR_CLASS_NAME } from "@/app/auth-form-styles";
import type { GttDto } from "@/lib/gtt";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const initialCancelState: CancelGttState | undefined = undefined;

type GttListProps = {
  gtts: GttDto[];
  error?: string;
};

function gttTypeLabel(type: string) {
  return type === "two-leg" ? "OCO" : "Single";
}

export function GttList({ gtts, error }: GttListProps) {
  const [cancelState, cancelAction, isCancelling] = useActionState(
    cancelGtt,
    initialCancelState,
  );

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Standing orders</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        GTTs
      </h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Triggers stay active until they fire, expire, or you cancel them. Equity GTTs
        last up to one year.
      </p>

      {cancelState?.message ? (
        <p
          className={
            cancelState.message.includes("cancelled")
              ? "mt-4 text-sm text-emerald-700 dark:text-emerald-400"
              : `mt-4 ${AUTH_ERROR_CLASS_NAME}`
          }
        >
          {cancelState.message}
        </p>
      ) : null}

      {error ? (
        <p className={`mt-6 ${AUTH_ERROR_CLASS_NAME}`}>{error}</p>
      ) : gtts.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">No GTTs on this account.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <th className="py-2 pr-4 font-medium">Symbol</th>
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Triggers</th>
                <th className="py-2 pr-4 font-medium">Order</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {gtts.map((gtt) => (
                <tr
                  key={gtt.id}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                >
                  <td className="py-3 pr-4">
                    <p className="font-medium text-zinc-950 dark:text-zinc-50">
                      {gtt.tradingsymbol}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {gtt.exchange} · #{gtt.id}
                    </p>
                  </td>
                  <td className="py-3 pr-4 text-zinc-950 dark:text-zinc-50">
                    {gttTypeLabel(gtt.type)}
                  </td>
                  <td className="py-3 pr-4 capitalize text-zinc-950 dark:text-zinc-50">
                    {gtt.status}
                  </td>
                  <td className="py-3 pr-4 text-zinc-950 dark:text-zinc-50">
                    {gtt.triggerValues.map((value) => inr.format(value)).join(" / ")}
                  </td>
                  <td className="py-3 pr-4 text-zinc-950 dark:text-zinc-50">
                    {gtt.orders.map((order) => (
                      <p key={`${order.transactionType}-${order.price}`}>
                        {order.transactionType} {order.quantity} @ {inr.format(order.price)}
                      </p>
                    ))}
                  </td>
                  <td className="py-3 text-right">
                    {gtt.status === "active" ? (
                      <form action={cancelAction}>
                        <input type="hidden" name="triggerId" value={gtt.id} />
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
    </section>
  );
}
