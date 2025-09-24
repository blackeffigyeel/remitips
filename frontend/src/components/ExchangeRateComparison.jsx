"use client";

import { useState } from "react";
import CountrySelector from "./CountrySelector";
import AmountInput from "./AmountInput";
import ComparisonResults from "./ComparisonResults";
import LoadingSpinner from "./LoadingSpinner";
import { compareExchangeRates } from "../lib/api";

export default function ExchangeRateComparison() {
  const [senderCountry, setSenderCountry] = useState("US");
  const [recipientCountry, setRecipientCountry] = useState("NG");
  const [amount, setAmount] = useState(100);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCompare = async () => {
    if (!senderCountry || !recipientCountry || !amount) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await compareExchangeRates({
        senderCountry: senderCountry,
        recipientCountry: recipientCountry,
        amount: amount,
        fetchHistoricalData: true,
      });

      setResults(data);
    } catch (err) {
      setError("Failed to fetch exchange rates. Please try again.");
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <h1 className="font-display text-4xl md:text-6xl font-bold text-primary animate-bounce-gentle">
          Find the Best Money Transfer Rates
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Compare exchange rates and fees across multiple platforms to save money on your
          international transfers
        </p>
      </div>

      {/* Comparison Form */}
      <div className="bg-white rounded-2xl shadow-lg border border-border p-6 md:p-8 animate-pulse-glow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {/* From Country */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">From</label>
            <CountrySelector
              value={senderCountry}
              onChange={setSenderCountry}
              placeholder="Select sending country"
            />
          </div>

          {/* To Country */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">To</label>
            <CountrySelector
              value={recipientCountry}
              onChange={setRecipientCountry}
              placeholder="Select receiving country"
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Amount</label>
            <AmountInput
              value={amount}
              onChange={setAmount}
              currency={senderCountry === "US" ? "USD" : "USD"} // Simplified for demo
            />
          </div>
        </div>

        {/* Compare Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleCompare}
            disabled={loading}
            className="bg-primary hover:bg-dark-gray text-white font-display font-semibold px-8 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? "Comparing..." : "Compare Rates"}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
            {error}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && <LoadingSpinner />}

      {/* Results */}
      {results && !loading && <ComparisonResults data={results} />}
    </div>
  );
}
