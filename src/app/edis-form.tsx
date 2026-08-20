import { startEdis } from "@/app/actions/kite";

const BUTTON_CLASS_NAME =
  "inline-flex h-11 items-center rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-900";

const COMPACT_BUTTON_CLASS_NAME =
  "rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-950 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-900";

type EdisFormProps = {
  isin?: string;
  quantity?: number;
  compact?: boolean;
  label?: string;
};

export function EdisForm({ isin, quantity, compact, label }: EdisFormProps) {
  return (
    <form action={startEdis}>
      {isin ? <input type="hidden" name="isin" value={isin} /> : null}
      {quantity != null ? (
        <input type="hidden" name="quantity" value={quantity} />
      ) : null}
      <button type="submit" className={compact ? COMPACT_BUTTON_CLASS_NAME : BUTTON_CLASS_NAME}>
        {label ?? (isin ? "eDIS" : "Authorize eDIS")}
      </button>
    </form>
  );
}
