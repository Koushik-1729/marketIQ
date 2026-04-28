import { engineRuntime } from "@/application/runtime/engine-runtime";

export async function getSignalById(id: string) {
  return engineRuntime.signalRepository.findById(id);
}
