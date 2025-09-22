/*
  Warnings:

  - The primary key for the `api_usage_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `currency_pairs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `exchange_rate_history` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `platform_performance` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `system_health` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `api_usage_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `currency_pairs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `exchange_rate_history` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `platform_performance` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `system_health` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."api_usage_logs" DROP CONSTRAINT "api_usage_logs_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "api_usage_logs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."currency_pairs" DROP CONSTRAINT "currency_pairs_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "currency_pairs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."exchange_rate_history" DROP CONSTRAINT "exchange_rate_history_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "exchange_rate_history_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."platform_performance" DROP CONSTRAINT "platform_performance_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "platform_performance_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."system_health" DROP CONSTRAINT "system_health_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "system_health_pkey" PRIMARY KEY ("id");
