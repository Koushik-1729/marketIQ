import { engineRuntime } from "@/application/runtime/engine-runtime";
import type { SignalQuery } from "@/domain/ports/signal-repository";

export async function getSignals(query: SignalQuery) {
  return engineRuntime.signalRepository.findMany(query);
}
