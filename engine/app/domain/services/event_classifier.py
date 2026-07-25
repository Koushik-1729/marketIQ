from typing import List
from ..entities.events import ExtractedEvent, EnrichedEvent
from ..data.event_weights import EVENT_WEIGHTS, SOURCE_CREDIBILITY

def classify_events(extracted_events: List[ExtractedEvent]) -> List[EnrichedEvent]:
    enriched = []
    
    for event in extracted_events:
        if event.source_kind == "filing":
            label = "verified_corporate"
        elif event.event_type == "unusual_volume":
            label = "market_structure"
        elif event.event_type == "sentiment_spike":
            label = "sentiment_only"
        elif event.event_type == "management_change":
            label = "leadership_change"
        elif event.source_kind == "social" and event.sentiment != "neutral":
            label = "rumor_like"
        else:
            label = "general_update"
            
        weight = EVENT_WEIGHTS.get(event.event_type, 5.0)
        cred = SOURCE_CREDIBILITY.get(event.source_name, 1.0)
        is_rumor = label in ("rumor_like", "sentiment_only")
        
        enriched.append(EnrichedEvent(
            **event.model_dump(),
            classification_label=label,
            event_weight=weight,
            source_credibility_score=cred,
            is_rumor_like=is_rumor
        ))
        
    return enriched
