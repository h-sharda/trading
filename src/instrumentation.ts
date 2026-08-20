export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const isBuild =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.argv.includes("build");

  if (isBuild || !process.env.DATABASE_URL) {
    return;
  }

  const { startScheduledOrderWorker } = await import(
    "./lib/scheduled-order-worker"
  );
  startScheduledOrderWorker();
}
