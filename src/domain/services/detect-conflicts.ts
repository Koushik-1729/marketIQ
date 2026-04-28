import type { EventCluster } from "@/domain/entities/event-cluster";
import type { PriceValidation } from "@/domain/entities/price-validation";

export function detectConflict(
  cluster: EventCluster,
  priceValidation: PriceValidation | undefined
) {
  if (!priceValidation) {
    return {
      conflictFlag: false,
      conflictReason: null,
      penalty: 0
    };
  }

  if (
    cluster.sentiment === "positive" &&
    priceValidation.confirmationStatus === "CONTRADICTION"
  ) {
    return {
      conflictFlag: true,
      conflictReason: "Positive narrative but weak price confirmation",
      penalty: 14
    };
  }

  if (
    cluster.eventType === "insider_activity" &&
    cluster.sentiment !== "positive" &&
    priceValidation.volumeRatio > 2
  ) {
    return {
      conflictFlag: true,
      conflictReason: "Insider or promoter-related risk reinforced by delivery spike",
      penalty: 18
    };
  }

  return {
    conflictFlag: false,
    conflictReason: null,
    penalty: 0
  };
}
