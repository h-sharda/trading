-- CreateEnum
CREATE TYPE "ScheduledOrderStatus" AS ENUM ('pending', 'armed', 'placed', 'failed', 'cancelled');

-- CreateTable
CREATE TABLE "ScheduledOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "tradingsymbol" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "product" TEXT NOT NULL DEFAULT 'CNC',
    "transactionType" TEXT NOT NULL DEFAULT 'SELL',
    "orderType" TEXT NOT NULL DEFAULT 'MARKET',
    "executeAt" TIMESTAMP(3) NOT NULL,
    "status" "ScheduledOrderStatus" NOT NULL DEFAULT 'pending',
    "orderTag" TEXT,
    "kiteOrderId" TEXT,
    "errorMessage" TEXT,
    "placedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduledOrder_status_executeAt_idx" ON "ScheduledOrder"("status", "executeAt");

-- CreateIndex
CREATE INDEX "ScheduledOrder_userId_status_idx" ON "ScheduledOrder"("userId", "status");

-- AddForeignKey
ALTER TABLE "ScheduledOrder" ADD CONSTRAINT "ScheduledOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
