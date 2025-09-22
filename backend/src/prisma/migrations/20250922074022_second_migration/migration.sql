-- RenameIndex
ALTER INDEX "public"."api_usage_logs_sender_country_recipient_country_requested_at_id" RENAME TO "api_usage_logs_sender_country_recipient_country_requested_a_idx";

-- RenameIndex
ALTER INDEX "public"."exchange_rate_history_sender_country_recipient_country_create_i" RENAME TO "exchange_rate_history_sender_country_recipient_country_crea_idx";

-- RenameIndex
ALTER INDEX "public"."platform_performance_platform_name_sender_country_recipientCo_k" RENAME TO "platform_performance_platform_name_sender_country_recipient_key";
