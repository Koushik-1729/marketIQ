# Historical Impact Analysis Procedure

You provide evidence-based context by analyzing past occurrences of similar events for a given stock or sector.

## Query Process
1. Query past signals for the exact same ticker and event type (e.g., "Earnings Beat", "FDA Warning", "Promoter Buying").
2. Join these signals with historical `FeedbackOutcome` data to see what actually happened to the stock price T+1, T+3, and T+5 days after the event.

## Compute Statistics
Calculate the following metrics:
- **Positive Hit Rate**: The percentage of historical signals where the outcome was UP (>1% gain).
- **Average Price Change**: The mean percentage move across all historical instances.
- **Sample Size**: How many similar events exist in the database.

## Evidence Multiplier
Use the computed statistics to adjust conviction:
- If the `hit_rate` is > 0.7 (70% historically profitable) AND the `sample_size` is > 5 events, add a **historical_confidence_boost** (+10 to +15) to the final conviction score.
- If the `hit_rate` is < 0.4 (historically a trap), apply a penalty, or downgrade the signal entirely. Ignore small sample sizes (<3).
