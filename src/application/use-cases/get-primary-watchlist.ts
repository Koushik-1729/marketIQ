import { cache } from "react";
import { engineRuntime } from "@/application/runtime/engine-runtime";
import { withTimeoutValue } from "@/lib/async-utils";

export const getPrimaryWatchlist = cache(async function getPrimaryWatchlist() {
  return withTimeoutValue(
    () => engineRuntime.watchlistRepository.getPrimaryWatchlist(),
    {
      userId: "offline-user",
      tickers: [],
      sectors: [],
      themes: [],
      riskTolerance: "medium" as const
    }
  );
});
