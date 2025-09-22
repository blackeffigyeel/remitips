-- AlterTable
ALTER TABLE "public"."currency_pairs" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."exchange_rate_history" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."platform_performance" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."system_health" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
