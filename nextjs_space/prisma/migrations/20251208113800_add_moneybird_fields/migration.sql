-- AlterTable Client: Add Moneybird fields
ALTER TABLE "Client" ADD COLUMN "moneybirdContactId" TEXT;
ALTER TABLE "Client" ADD COLUMN "moneybirdSubscriptionId" TEXT;

-- AlterTable Invoice: Add Moneybird fields
ALTER TABLE "Invoice" ADD COLUMN "moneybirdInvoiceId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "moneybirdState" TEXT;

-- AlterTable CreditPurchase: Add Moneybird fields
ALTER TABLE "CreditPurchase" ADD COLUMN "moneybirdInvoiceId" TEXT;

-- AlterTable SubscriptionPlan: Add Moneybird fields
ALTER TABLE "SubscriptionPlan" ADD COLUMN "moneybirdProductId" TEXT;
