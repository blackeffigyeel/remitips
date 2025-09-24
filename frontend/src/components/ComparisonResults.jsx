"use client";

import { Trophy, Clock, DollarSign, TrendingUp, TrendingDown } from "lucide-react";

export default function ComparisonResults({ data }) {
  if (!data || !data.data) return null;

  const {
    platforms,
    winner,
    metrics,
    sendingAmount,
    sendingCurrencyCode,
    recipientCurrencyCode,
    officialExchangeRate,
  } = data.data;

  // console.log("Comparison Results:", data)

  // Sort platforms by receive amount (highest first)
  const sortedPlatforms = [...platforms].sort((a, b) => b.receiveAmount - a.receiveAmount);

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const getPlatformLogo = (platform) => {
    const logoMap = {
      Wise: "/assets/images/wise-black-logo.svg",
      Remitly: "/assets/images/remitly-black-logo.svg",
      MoneyGram: "/assets/images/moneygram-black-and-red-logo.svg",
      WorldRemit: "/assets/images/worldremit-purple-logo.svg",
      Airwallex: "/assets/images/airwallex-orange-and-black-logo.svg",
      Revolut: "/assets/images/revolut-black-logo.svg",
      XE: "/assets/images/xe-dark-blue-logo.svg",
      Ria: "/assets/images/ria-orange-logo.png",
      Xoom: "/assets/images/xoom-blue-logo.svg",
    };
    return logoMap[platform] || "/abstract-logo.png";
  };

  const getPlatformUrl = (platform, sendAmount, sendCurrency, recipientCurrency) => {
    const urlMap = {
      Wise: `https://wise.com/`,
      Remitly: `https://www.remitly.com/`,
      XE: `https://www.xe.com/`,
      Airwallex: `https://www.airwallex.com/`,
      MoneyGram: `https://www.moneygram.com/`,
      WorldRemit: `https://www.worldremit.com/`,
      Ria: `https://www.riamoneytransfer.com/`,
      Revolut: `https://www.revolut.com/`,
      Xoom: `https://www.xoom.com/`,
    };

    return urlMap[platform] || "#";
  };

  return (
    <div className="space-y-8">
      {/* Winner Card */}
      <div className="bg-gradient-to-r from-light-cream to-cream rounded-2xl p-6 border-2 border-primary/20 relative overflow-hidden">
        <div className="absolute top-4 right-4">
          <Trophy className="h-8 w-8 text-primary animate-bounce-gentle" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <img
              src={getPlatformLogo(winner.platform) || "/placeholder.svg"}
              alt={winner.platform}
              className="h-8 w-auto"
              onError={(e) => {
                e.target.src = "/abstract-logo.png";
              }}
            />
            <div>
              <h3 className="font-display text-2xl font-bold text-primary">Best Deal</h3>
              <p className="text-muted-foreground">Highest amount received</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="font-display text-2xl font-bold text-primary">
                {formatCurrency(winner.receiveAmount, recipientCurrencyCode)}
              </div>
              <div className="text-sm text-muted-foreground">You receive</div>
            </div>
            <div className="text-center">
              <div className="font-display text-xl font-semibold text-primary">
                {formatNumber(winner.exchangeRate)}
              </div>
              <div className="text-sm text-muted-foreground">Exchange rate</div>
            </div>
            <div className="text-center">
              <div className="font-display text-xl font-semibold text-primary">
                {formatCurrency(winner.fees, sendingCurrencyCode)}
              </div>
              <div className="text-sm text-muted-foreground">Fees</div>
            </div>
            <div className="text-center">
              <div className="font-display text-xl font-semibold text-primary">
                {formatCurrency(winner.totalCost, sendingCurrencyCode)}
              </div>
              <div className="text-sm text-muted-foreground">Total cost</div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-border">
          <div className="flex items-center space-x-3 mb-4">
            <DollarSign className="h-6 w-6 text-primary" />
            <h4 className="font-display font-semibold text-primary">Market Average</h4>
          </div>
          <div className="space-y-2">
            <div className="font-display text-xl font-bold text-primary">
              {formatCurrency(metrics.averageReceiveAmount, recipientCurrencyCode)}
            </div>
            <div className="text-sm text-muted-foreground">
              Rate: {formatNumber(metrics.averageExchangeRate)}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-border">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="h-6 w-6 text-green-600" />
            <h4 className="font-display font-semibold text-primary">Best Rate</h4>
          </div>
          <div className="space-y-2">
            <div className="font-display text-xl font-bold text-green-600">
              {formatCurrency(metrics.bestReceiveAmount, recipientCurrencyCode)}
            </div>
            {/* <div className="text-sm text-muted-foreground">
              vs Official: {metrics.officialRateComparison > 0 ? "+" : ""}
              {metrics.officialRateComparison.toFixed(2)}%
            </div> */}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-border">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingDown className="h-6 w-6 text-red-600" />
            <h4 className="font-display font-semibold text-primary">Worst Rate</h4>
          </div>
          <div className="space-y-2">
            <div className="font-display text-xl font-bold text-red-600">
              {formatCurrency(metrics.worstReceiveAmount, recipientCurrencyCode)}
            </div>
            {/* <div className="text-sm text-muted-foreground">Spread: {metrics.spreadPercentage.toFixed(2)}%</div> */}
          </div>
        </div>
      </div>

      {/* All Platforms Comparison */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-border">
          <h3 className="font-display text-xl sm:text-2xl font-bold text-primary">All Platforms</h3>
          <p className="text-sm text-muted-foreground">Compare all available options</p>
        </div>

        <div className="divide-y divide-border">
          {sortedPlatforms.map((platform, index) => (
            <div
              key={platform.platform}
              className="p-4 sm:p-6 hover:bg-muted/50 transition-colors duration-200"
            >
              {/* Mobile Layout */}
              <div className="sm:hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                    <a
                      href={getPlatformUrl(
                        platform.platform,
                        sendingAmount,
                        sendingCurrencyCode,
                        recipientCurrencyCode,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={getPlatformLogo(platform.platform) || "/placeholder.svg"}
                        alt={platform.platform}
                        className={platform.platform === "Remitly" ? "h-8 w-auto" : "h-5 w-auto"}
                        onError={(e) => {
                          e.target.src = "/abstract-logo.png";
                        }}
                      />
                    </a>
                  </div>
                  <a
                    href={getPlatformUrl(
                      platform.platform,
                      sendingAmount,
                      sendingCurrencyCode,
                      recipientCurrencyCode,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition"
                  >
                    Go
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="font-display font-bold text-primary">
                      {formatCurrency(platform.receiveAmount, recipientCurrencyCode)}
                    </div>
                    <div className="text-xs text-muted-foreground">Receive</div>
                  </div>
                  <div>
                    <div className="font-semibold text-primary">
                      {formatNumber(platform.exchangeRate)}
                    </div>
                    <div className="text-xs text-muted-foreground">Rate</div>
                  </div>
                  <div>
                    <div className="font-semibold text-primary">
                      {formatCurrency(platform.fees, sendingCurrencyCode)}
                    </div>
                    <div className="text-xs text-muted-foreground">Fees</div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {platform.responseTime}ms
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">Response</div>
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden sm:flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    {index === 0 && <Trophy className="h-5 w-5 text-yellow-500" />}
                    <a
                      href={getPlatformUrl(
                        platform.platform,
                        sendingAmount,
                        sendingCurrencyCode,
                        recipientCurrencyCode,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={getPlatformLogo(platform.platform) || "/placeholder.svg"}
                        alt={platform.platform}
                        className={platform.platform === "Remitly" ? "h-12 w-auto" : "h-6 w-auto"}
                        onError={(e) => {
                          e.target.src = "/abstract-logo.png";
                        }}
                      />
                    </a>
                    {/* <span className="font-semibold text-primary">{platform.platform}</span> */}
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="grid grid-cols-4 gap-8 text-right">
                    <div>
                      <div className="font-display font-bold text-primary">
                        {formatCurrency(platform.receiveAmount, recipientCurrencyCode)}
                      </div>
                      <div className="text-xs text-muted-foreground">Receive</div>
                    </div>
                    <div>
                      <div className="font-semibold text-primary">
                        {formatNumber(platform.exchangeRate)}
                      </div>
                      <div className="text-xs text-muted-foreground">Rate</div>
                    </div>
                    <div>
                      <div className="font-semibold text-primary">
                        {formatCurrency(platform.fees, sendingCurrencyCode)}
                      </div>
                      <div className="text-xs text-muted-foreground">Fees</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-end space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {platform.responseTime}ms
                        </span>
                      </div>
                    </div>
                  </div>
                  <a
                    href={getPlatformUrl(
                      platform.platform,
                      sendingAmount,
                      sendingCurrencyCode,
                      recipientCurrencyCode,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 inline-block px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition"
                  >
                    Go
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {data.data.historicalData && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="font-display text-2xl font-bold text-primary">Historical Trends</h3>
            <p className="text-muted-foreground">Platform performance over time</p>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(data.data.historicalData.periods).map(([period, stats]) => (
              <div key={period} className="border rounded-xl p-4">
                <h4 className="font-semibold capitalize text-primary mb-2">
                  {`Last ${stats.periodDays} Day(s)`}
                </h4>

                <ul className="space-y-2 text-sm">
                  {stats.bestPerformers.map((p) => (
                    <li key={p.platform} className="flex justify-between">
                      <span>{p.platform}</span>
                      <span className="font-semibold">
                        {formatCurrency(p.avgReceiveAmount, recipientCurrencyCode)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 text-xs text-muted-foreground">
                  Total comparisons: {stats.totalComparisons} | Improving:{" "}
                  {stats.trends.improving.join(", ") || "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
