import { engineRuntime } from "@/application/runtime/engine-runtime";

export async function getPrimaryWatchlist() {
  return engineRuntime.watchlistRepository.getPrimaryWatchlist();
}
