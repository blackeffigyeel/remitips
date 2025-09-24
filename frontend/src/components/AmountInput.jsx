"use client";

import { useState, useEffect } from "react";

export default function AmountInput({ value, onChange, currency = "USD" }) {
  const [displayValue, setDisplayValue] = useState(value.toString());

  useEffect(() => {
    setDisplayValue(value.toString());
  }, [value]);

  const handleChange = (e) => {
    const inputValue = e.target.value;

    // Remove any non-numeric characters except decimal point
    const numericValue = inputValue.replace(/[^0-9.]/g, "");

    // Ensure only one decimal point
    const parts = numericValue.split(".");
    const formattedValue =
      parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : numericValue;

    setDisplayValue(formattedValue);

    // Convert to number and update parent
    const numberValue = Number.parseFloat(formattedValue) || 0;
    if (numberValue >= 0 && numberValue <= 1000000) {
      onChange(numberValue);
    }
  };

  const formatDisplayValue = (val) => {
    if (!val) return "";
    const num = Number.parseFloat(val);
    return isNaN(num)
      ? val
      : num.toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        });
  };

  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground font-display font-semibold text-xl">
        {currency === "USD" ? "$" : currency}
      </div>
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder="0"
        className="w-full pl-12 pr-4 py-3 amount-input bg-cream/50 border-2 border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-primary placeholder-muted-foreground"
      />
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
        {currency}
      </div>
    </div>
  );
}
