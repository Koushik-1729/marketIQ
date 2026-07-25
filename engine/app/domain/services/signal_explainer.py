from ..entities.signal import EngineSignal, SignalExplanation

def explain_signal(signal: EngineSignal) -> SignalExplanation:
    reasons = [
        signal.event_summary,
        f"{signal.source_count} source{'s' if signal.source_count > 1 else ''} confirmed the event"
    ]
    if signal.price_validation:
        reasons.append(signal.price_validation)
    if signal.conflict_flag and signal.conflict_reason:
        reasons.append(f"Risk note: {signal.conflict_reason}")
        
    reasons.append(f"Narrative state: {signal.narrative_state}")
    
    watch_items = ["Track intraday weakness", "Watch fresh filings", "Check sector confirmation"] if signal.risk_level == "high" else ["Watch volume continuation", "Track sector strength", "Monitor follow-up coverage"]
    
    return SignalExplanation(
        stock=signal.ticker,
        score=signal.final_score,
        reasons=reasons,
        risk=signal.risk_level,
        watch_items=watch_items
    )
