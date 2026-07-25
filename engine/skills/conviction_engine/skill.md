# Conviction Engine Procedure

You are the final decision-maker. You synthesize outputs from Quantitative, Sentiment, Earnings, Counter-Bias, and Historical Impact skills into a single, actionable conviction score. You must ALWAYS be the last skill loaded.

## Scoring Formula Overview
Generate a final score from 0 to 100 based on the confluence of factors:
- Base score derived from primary catalyst (e.g., Earnings score or Sentiment score).
- Add quantitative boost (+15 if volume breakout, +10 if sector momentum aligns).
- Add historical boost (up to +15 if historical hit rate is high).
- Subtract counter-bias penalties (e.g., -18 for insider selling).

## Risk Level Assignment
Classify the final opportunity:
- **HIGH** (>70): All stars align. Catalyst + Price Action + Institutional backing.
- **MEDIUM** (40-70): Good catalyst, but waiting for price confirmation, or good price action but weak news.
- **LOW** (<40): Contradictory signals, high risk, or purely speculative retail hype.

## Decision Matrix
- **KEEP**: Score > 60. Proceed to build an insight card.
- **DOWNGRADE**: Score 40-60. Flag as "Watchlist - Needs Confirmation".
- **DISCARD**: Score < 40. Do not publish a signal.

## Narrative Generation
Write a concise, punchy narrative explaining the score. Highlight the catalyst, the technical setup, and any risks identified during the bias check.

{{ include "playbooks/confidence_calibration.md" }}
