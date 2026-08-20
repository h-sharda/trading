-- AlterTable
ALTER TABLE "User" ADD COLUMN     "kiteAccessToken" TEXT,
ADD COLUMN     "kiteAccessTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "kiteApiKey" TEXT,
ADD COLUMN     "kiteApiSecret" TEXT;
