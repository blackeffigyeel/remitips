-- CreateTable
CREATE TABLE "public"."exchange_rate_history" (
    "id" TEXT NOT NULL,
    "sender_country" VARCHAR(3) NOT NULL,
    "recipient_country" VARCHAR(3) NOT NULL,
    "sender_currency" VARCHAR(3) NOT NULL,
    "recipient_currency" VARCHAR(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "official_rate" DOUBLE PRECISION NOT NULL,
    "official_amount" DOUBLE PRECISION NOT NULL,
    "platform_data" JSONB NOT NULL,
    "winner_platform" VARCHAR(50),
    "best_receive_amount" DOUBLE PRECISION,
    "best_exchange_rate" DOUBLE PRECISION,
    "average_rate" DOUBLE PRECISION,
    "rate_variance" DOUBLE PRECISION,
    "platform_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rate_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."platform_performance" (
    "id" TEXT NOT NULL,
    "platform_name" VARCHAR(50) NOT NULL,
    "sender_country" VARCHAR(3) NOT NULL,
    "recipient_country" VARCHAR(3) NOT NULL,
    "total_requests" INTEGER NOT NULL DEFAULT 0,
    "successful_requests" INTEGER NOT NULL DEFAULT 0,
    "failed_requests" INTEGER NOT NULL DEFAULT 0,
    "average_response_time" DOUBLE PRECISION,
    "times_winner" INTEGER NOT NULL DEFAULT 0,
    "average_rank" DOUBLE PRECISION,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."currency_pairs" (
    "id" TEXT NOT NULL,
    "from_country" VARCHAR(3) NOT NULL,
    "to_country" VARCHAR(3) NOT NULL,
    "from_currency" VARCHAR(3) NOT NULL,
    "to_currency" VARCHAR(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "supported_platforms" TEXT[],
    "popularity_score" INTEGER NOT NULL DEFAULT 0,
    "last_official_rate" DOUBLE PRECISION,
    "last_updated" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "currency_pairs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_usage_logs" (
    "id" TEXT NOT NULL,
    "endpoint" VARCHAR(100) NOT NULL,
    "method" VARCHAR(10) NOT NULL,
    "sender_country" VARCHAR(3),
    "recipient_country" VARCHAR(3),
    "amount" DOUBLE PRECISION,
    "fetch_historical_data" BOOLEAN NOT NULL DEFAULT false,
    "status_code" INTEGER NOT NULL,
    "response_time" INTEGER NOT NULL,
    "platforms_queried" INTEGER NOT NULL DEFAULT 0,
    "successful_platforms" INTEGER NOT NULL DEFAULT 0,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."system_health" (
    "id" TEXT NOT NULL,
    "platform_name" VARCHAR(50) NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "last_checked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "response_time" INTEGER,
    "error_message" TEXT,
    "uptime_percentage" DOUBLE PRECISION,
    "average_response_time" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_health_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exchange_rate_history_sender_country_recipient_country_create_idx" ON "public"."exchange_rate_history"("sender_country", "recipient_country", "created_at");

-- CreateIndex
CREATE INDEX "exchange_rate_history_created_at_idx" ON "public"."exchange_rate_history"("created_at");

-- CreateIndex
CREATE INDEX "exchange_rate_history_expires_at_idx" ON "public"."exchange_rate_history"("expires_at");

-- CreateIndex
CREATE INDEX "platform_performance_platform_name_date_idx" ON "public"."platform_performance"("platform_name", "date");

-- CreateIndex
CREATE INDEX "platform_performance_sender_country_recipient_country_date_idx" ON "public"."platform_performance"("sender_country", "recipient_country", "date");

-- CreateIndex
CREATE UNIQUE INDEX "platform_performance_platform_name_sender_country_recipientCo_key" ON "public"."platform_performance"("platform_name", "sender_country", "recipient_country", "date");

-- CreateIndex
CREATE INDEX "currency_pairs_from_currency_to_currency_idx" ON "public"."currency_pairs"("from_currency", "to_currency");

-- CreateIndex
CREATE INDEX "currency_pairs_popularity_score_idx" ON "public"."currency_pairs"("popularity_score");

-- CreateIndex
CREATE UNIQUE INDEX "currency_pairs_from_country_to_country_key" ON "public"."currency_pairs"("from_country", "to_country");

-- CreateIndex
CREATE INDEX "api_usage_logs_requested_at_idx" ON "public"."api_usage_logs"("requested_at");

-- CreateIndex
CREATE INDEX "api_usage_logs_endpoint_requested_at_idx" ON "public"."api_usage_logs"("endpoint", "requested_at");

-- CreateIndex
CREATE INDEX "api_usage_logs_sender_country_recipient_country_requested_at_idx" ON "public"."api_usage_logs"("sender_country", "recipient_country", "requested_at");

-- CreateIndex
CREATE INDEX "system_health_is_available_last_checked_idx" ON "public"."system_health"("is_available", "last_checked");

-- CreateIndex
CREATE UNIQUE INDEX "system_health_platform_name_key" ON "public"."system_health"("platform_name");
