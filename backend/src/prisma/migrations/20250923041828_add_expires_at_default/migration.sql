-- AlterTable
ALTER TABLE "public"."exchange_rate_history" ALTER COLUMN "expires_at" SET DEFAULT now() + interval '60 days';
