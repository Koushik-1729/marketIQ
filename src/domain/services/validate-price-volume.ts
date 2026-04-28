import type { PriceBar } from "@/domain/ports/price-bar-repository";
import type { PriceValidation } from "@/domain/entities/price-validation";
import type { SignalSentiment } from "@prisma/client";

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

export function validatePriceVolume(
  ticker: string,
  bars: PriceBar[],
  signalSentiment?: SignalSentiment | string
): PriceValidation {
  if (!bars || bars.length < 2) {
    return {
      ticker,
      priceChangePercent: 0,
      volumeRatio: 0,
      volumeScore: 0,
      volatility: 0,
      momentumPersistence: false,
      confirmationStatus: "NO_DATA",
      note: "Market closed or no intraday data available"
    };
  }

  // Sort descending by timestamp so bars[0] is latest
  const sortedBars = [...bars].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
  const latestBar = sortedBars[0];
  const previousBar = sortedBars[1];

  const priceChangePercent = ((latestBar.close - previousBar.close) / previousBar.close) * 100;

  // Average volume of last 20 bars (excluding latest maybe? Let's just use last 20 available)
  const volumeBars = sortedBars.slice(0, 20);
  const avgVolume = average(volumeBars.map(b => b.volume)) || latestBar.volume;
  const volumeRatio = latestBar.volume / (avgVolume || 1);
  const volumeScore = Math.log(Math.max(volumeRatio, 1)); // Math.log(1) is 0. Prevent negative log if ratio < 1? Or just raw ratio. The user said "Math.log(volumeRatio)". Let's bound it to avoid -Infinity if 0.
  
  // Volatility: avg(abs(priceChange last 10 bars))
  const volatilityBars = sortedBars.slice(0, 11);
  const priceChanges: number[] = [];
  for (let i = 0; i < volatilityBars.length - 1; i++) {
    const change = ((volatilityBars[i].close - volatilityBars[i + 1].close) / volatilityBars[i + 1].close) * 100;
    priceChanges.push(Math.abs(change));
  }
  const volatility = average(priceChanges);

  let status: PriceValidation["confirmationStatus"] = "NEUTRAL";

  if (Math.abs(priceChangePercent) > 1.5 * volatility && volumeRatio > 1.5) {
    status = "CONFIRMED";
  } else if (Math.abs(priceChangePercent) < 0.5 * volatility && volumeRatio < 1) {
    status = "WEAK";
  }

  // Direction Check
  const isPositiveSignal = signalSentiment === "positive" || signalSentiment === "POSITIVE";
  const isNegativeSignal = signalSentiment === "negative" || signalSentiment === "NEGATIVE";

  if (isPositiveSignal && priceChangePercent < 0) {
    status = "CONTRADICTION";
  } else if (isNegativeSignal && priceChangePercent > 0) {
    status = "CONTRADICTION";
  }

  // Momentum Persistence (last 3 bars trend)
  let momentumPersistence = false;
  if (sortedBars.length >= 4) {
    const b0 = sortedBars[0].close - sortedBars[1].close;
    const b1 = sortedBars[1].close - sortedBars[2].close;
    const b2 = sortedBars[2].close - sortedBars[3].close;
    
    if ((b0 > 0 && b1 > 0 && b2 > 0) || (b0 < 0 && b1 < 0 && b2 < 0)) {
      momentumPersistence = true;
    }
  }

  const sentimentString = isPositiveSignal ? "bullish" : isNegativeSignal ? "bearish" : "mixed";
  let note = "";
  const absPriceMove = Math.abs(priceChangePercent).toFixed(1);
  const volString = volumeRatio.toFixed(1);

  if (status === "CONFIRMED") {
    note = `Price moved ${priceChangePercent > 0 ? '+' : '-'}${absPriceMove}% with ${volString}x volume — confirms ${sentimentString} signal`;
  } else if (status === "WEAK") {
    note = `Price dropped ${priceChangePercent > 0 ? '+' : '-'}${absPriceMove}% despite ${sentimentString} news — weak confirmation`;
  } else if (status === "CONTRADICTION") {
    note = `Price moved ${priceChangePercent > 0 ? '+' : '-'}${absPriceMove}% against ${sentimentString} signal — strict contradiction`;
  } else {
    note = `Price moved ${priceChangePercent > 0 ? '+' : '-'}${absPriceMove}% with ${volString}x volume — neutral validation`;
  }

  return {
    ticker,
    priceChangePercent,
    volumeRatio,
    volumeScore: Math.log(Math.max(volumeRatio, 0.0001)),
    volatility,
    momentumPersistence,
    confirmationStatus: status,
    note
  };
}
