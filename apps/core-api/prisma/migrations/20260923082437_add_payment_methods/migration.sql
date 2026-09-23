-- CreateEnum
CREATE TYPE "PaymentMethodFamily" AS ENUM ('MOBILE_MONEY', 'CARD', 'BANK_TRANSFER', 'INVOICE');

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "family" "PaymentMethodFamily" NOT NULL,
    "countries" TEXT[],
    "minAmount" DECIMAL(18,6),
    "maxAmount" DECIMAL(18,6),
    "feePercent" DECIMAL(9,4) NOT NULL DEFAULT 0,
    "instant" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);
