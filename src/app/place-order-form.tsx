"use client";

import { useActionState, useState } from "react";
import { submitTrade, type PlaceOrderState } from "@/app/actions/kite";
import {
  AUTH_ERROR_CLASS_NAME,
  AUTH_INPUT_CLASS_NAME,
  AUTH_LABEL_CLASS_NAME,
  AUTH_SUBMIT_CLASS_NAME,
} from "@/app/auth-form-styles";
import type { HoldingDto } from "@/lib/holding";

const initialPlaceState: PlaceOrderState | undefined = undefined;
const SELECT_CLASS_NAME = AUTH_INPUT_CLASS_NAME;
const VARIETY_OPTION_CLASS_NAME =
  "flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 px-3 py-2 text-sm has-[:checked]:border-zinc-950 has-[:checked]:bg-zinc-950 has-[:checked]:text-white dark:border-zinc-800 dark:has-[:checked]:border-zinc-50 dark:has-[:checked]:bg-zinc-50 dark:has-[:checked]:text-zinc-950";

type PlaceOrderFormProps = {
  defaultHolding?: HoldingDto | null;
};

export function PlaceOrderForm({ defaultHolding }: PlaceOrderFormProps) {
  const [placeState, placeAction, isPlacing] = useActionState(
    submitTrade,
    initialPlaceState,
  );
  const [variety, setVariety] = useState("regular");
  const [gttType, setGttType] = useState("single");
  const [orderType, setOrderType] = useState("MARKET");
  const isGtt = variety === "gtt";
  const isOco = isGtt && gttType === "two-leg";
  const needsPrice = !isGtt && (orderType === "LIMIT" || orderType === "SL");
  const needsStopTrigger = !isGtt && (orderType === "SL" || orderType === "SL-M");

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Orders</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        Place order
      </h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Regular goes to the exchange during market hours. AMO is only accepted after
        5:30 AM IST. Use GTT for standing buy/sell triggers that last up to a year.
      </p>

      <form action={placeAction} className="mt-6 grid gap-5 sm:grid-cols-2">
        <fieldset className="sm:col-span-2">
          <legend className={AUTH_LABEL_CLASS_NAME}>Variety</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              ["regular", "Regular"],
              ["amo", "AMO"],
              ["gtt", "GTT"],
            ].map(([value, label]) => (
              <label key={value} className={VARIETY_OPTION_CLASS_NAME}>
                <input
                  type="radio"
                  name="variety"
                  value={value}
                  checked={variety === value}
                  onChange={() => setVariety(value)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        {isGtt ? (
          <fieldset className="sm:col-span-2">
            <legend className={AUTH_LABEL_CLASS_NAME}>GTT type</legend>
            <div className="mt-2 flex gap-2">
              <label className={VARIETY_OPTION_CLASS_NAME}>
                <input
                  type="radio"
                  name="gttType"
                  value="single"
                  checked={gttType === "single"}
                  onChange={() => setGttType("single")}
                  className="sr-only"
                />
                Single
              </label>
              <label className={VARIETY_OPTION_CLASS_NAME}>
                <input
                  type="radio"
                  name="gttType"
                  value="two-leg"
                  checked={gttType === "two-leg"}
                  onChange={() => setGttType("two-leg")}
                  className="sr-only"
                />
                OCO
              </label>
            </div>
            <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              Single places one limit order when LTP crosses the trigger. OCO places
              both a stop-loss and a target; triggering one cancels the other.
            </p>
          </fieldset>
        ) : null}

        <fieldset className="sm:col-span-2">
          <legend className={AUTH_LABEL_CLASS_NAME}>Side</legend>
          <div className="mt-2 flex gap-2">
            <label className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 px-3 py-2 text-sm has-[:checked]:border-emerald-700 has-[:checked]:bg-emerald-700 has-[:checked]:text-white dark:border-zinc-800">
              <input
                type="radio"
                name="transactionType"
                value="BUY"
                defaultChecked
                className="sr-only"
              />
              Buy
            </label>
            <label className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 px-3 py-2 text-sm has-[:checked]:border-red-700 has-[:checked]:bg-red-700 has-[:checked]:text-white dark:border-zinc-800">
              <input
                type="radio"
                name="transactionType"
                value="SELL"
                className="sr-only"
              />
              Sell
            </label>
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <label htmlFor="exchange" className={AUTH_LABEL_CLASS_NAME}>
            Exchange
          </label>
          <select
            id="exchange"
            name="exchange"
            required
            defaultValue={defaultHolding?.exchange ?? "NSE"}
            className={SELECT_CLASS_NAME}
          >
            <option value="NSE">NSE</option>
            <option value="BSE">BSE</option>
            <option value="NFO">NFO</option>
            <option value="BFO">BFO</option>
            <option value="CDS">CDS</option>
            <option value="MCX">MCX</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="tradingsymbol" className={AUTH_LABEL_CLASS_NAME}>
            Symbol
          </label>
          <input
            id="tradingsymbol"
            name="tradingsymbol"
            type="text"
            required
            defaultValue={defaultHolding?.tradingsymbol ?? ""}
            placeholder="RELIANCE"
            autoComplete="off"
            className={`${AUTH_INPUT_CLASS_NAME} uppercase`}
          />
          {placeState?.errors?.tradingsymbol?.map((error) => (
            <p key={error} className={AUTH_ERROR_CLASS_NAME}>
              {error}
            </p>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="quantity" className={AUTH_LABEL_CLASS_NAME}>
            Quantity
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            required
            min={1}
            step={1}
            defaultValue={1}
            className={AUTH_INPUT_CLASS_NAME}
          />
          {placeState?.errors?.quantity?.map((error) => (
            <p key={error} className={AUTH_ERROR_CLASS_NAME}>
              {error}
            </p>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="product" className={AUTH_LABEL_CLASS_NAME}>
            Product
          </label>
          <select
            id="product"
            name="product"
            required
            defaultValue={
              isGtt ? "CNC" : (defaultHolding?.product ?? "CNC")
            }
            className={SELECT_CLASS_NAME}
          >
            <option value="CNC">CNC (delivery)</option>
            {isGtt ? null : <option value="MIS">MIS (intraday)</option>}
            <option value="NRML">NRML (carry forward)</option>
          </select>
        </div>

        {isGtt ? null : (
          <>
            <div className="flex flex-col gap-2">
              <label htmlFor="orderType" className={AUTH_LABEL_CLASS_NAME}>
                Order type
              </label>
              <select
                id="orderType"
                name="orderType"
                required
                value={orderType}
                onChange={(event) => setOrderType(event.target.value)}
                className={SELECT_CLASS_NAME}
              >
                <option value="MARKET">Market</option>
                <option value="LIMIT">Limit</option>
                <option value="SL">Stop-loss (limit)</option>
                <option value="SL-M">Stop-loss (market)</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="validity" className={AUTH_LABEL_CLASS_NAME}>
                Validity
              </label>
              <select
                id="validity"
                name="validity"
                required
                defaultValue="DAY"
                className={SELECT_CLASS_NAME}
              >
                <option value="DAY">DAY</option>
                <option value="IOC">IOC</option>
              </select>
            </div>
          </>
        )}

        {needsPrice || (isGtt && !isOco) ? (
          <div className="flex flex-col gap-2">
            <label htmlFor="price" className={AUTH_LABEL_CLASS_NAME}>
              {isGtt ? "Limit price" : "Price"}
            </label>
            <input
              id="price"
              name="price"
              type="number"
              required
              min={0.05}
              step="0.05"
              defaultValue={defaultHolding?.lastPrice || ""}
              className={AUTH_INPUT_CLASS_NAME}
            />
            {placeState?.errors?.price?.map((error) => (
              <p key={error} className={AUTH_ERROR_CLASS_NAME}>
                {error}
              </p>
            ))}
          </div>
        ) : null}

        {needsStopTrigger || (isGtt && !isOco) ? (
          <div className="flex flex-col gap-2">
            <label htmlFor="triggerPrice" className={AUTH_LABEL_CLASS_NAME}>
              Trigger price
            </label>
            <input
              id="triggerPrice"
              name="triggerPrice"
              type="number"
              required
              min={0.05}
              step="0.05"
              defaultValue={isGtt ? defaultHolding?.lastPrice || "" : ""}
              className={AUTH_INPUT_CLASS_NAME}
            />
            {placeState?.errors?.triggerPrice?.map((error) => (
              <p key={error} className={AUTH_ERROR_CLASS_NAME}>
                {error}
              </p>
            ))}
          </div>
        ) : null}

        {isOco ? (
          <>
            <div className="flex flex-col gap-2">
              <label htmlFor="slTrigger" className={AUTH_LABEL_CLASS_NAME}>
                Stop-loss trigger
              </label>
              <input
                id="slTrigger"
                name="slTrigger"
                type="number"
                required
                min={0.05}
                step="0.05"
                className={AUTH_INPUT_CLASS_NAME}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="slPrice" className={AUTH_LABEL_CLASS_NAME}>
                Stop-loss price
              </label>
              <input
                id="slPrice"
                name="slPrice"
                type="number"
                required
                min={0.05}
                step="0.05"
                className={AUTH_INPUT_CLASS_NAME}
              />
              {placeState?.errors?.slPrice?.map((error) => (
                <p key={error} className={AUTH_ERROR_CLASS_NAME}>
                  {error}
                </p>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="targetTrigger" className={AUTH_LABEL_CLASS_NAME}>
                Target trigger
              </label>
              <input
                id="targetTrigger"
                name="targetTrigger"
                type="number"
                required
                min={0.05}
                step="0.05"
                className={AUTH_INPUT_CLASS_NAME}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="targetPrice" className={AUTH_LABEL_CLASS_NAME}>
                Target price
              </label>
              <input
                id="targetPrice"
                name="targetPrice"
                type="number"
                required
                min={0.05}
                step="0.05"
                className={AUTH_INPUT_CLASS_NAME}
              />
              {placeState?.errors?.targetPrice?.map((error) => (
                <p key={error} className={AUTH_ERROR_CLASS_NAME}>
                  {error}
                </p>
              ))}
            </div>
          </>
        ) : null}

        {placeState?.orderId || placeState?.triggerId ? (
          <p className="sm:col-span-2 text-sm text-emerald-700 dark:text-emerald-400">
            {placeState.message}
          </p>
        ) : placeState?.message ? (
          <p className={`sm:col-span-2 ${AUTH_ERROR_CLASS_NAME}`}>{placeState.message}</p>
        ) : null}

        <button
          type="submit"
          disabled={isPlacing}
          className={`${AUTH_SUBMIT_CLASS_NAME} sm:col-span-2`}
        >
          {isPlacing ? "Placing…" : isGtt ? "Place GTT" : "Place order"}
        </button>
      </form>
    </section>
  );
}
