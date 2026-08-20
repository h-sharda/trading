import { dispatchDueScheduledOrders } from "@/lib/scheduled-order-worker";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const dispatched = await dispatchDueScheduledOrders();
  return Response.json({ ok: true, dispatched });
}
