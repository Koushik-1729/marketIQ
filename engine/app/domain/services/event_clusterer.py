from typing import List
from collections import defaultdict
from ..entities.events import EnrichedEvent, EventCluster

def cluster_events(enriched_events: List[EnrichedEvent]) -> List[EventCluster]:
    buckets = defaultdict(list)
    
    for event in enriched_events:
        key = f"{event.ticker}:{event.event_type}:{event.sentiment}"
        buckets[key].append(event)
        
    clusters = []
    
    for key, grouped in buckets.items():
        ticker, event_type, sentiment = key.split(":")
        first = grouped[0]
        
        unique_sources = list({g.source_name for g in grouped})
        
        first_seen = min(g.event_at for g in grouped)
        last_seen = max(g.event_at for g in grouped)
        
        clusters.append(EventCluster(
            id=f"cluster_{ticker}_{event_type}_{len(grouped)}",
            ticker=ticker,
            company=first.company,
            sector=first.sector,
            event_type=event_type,
            sentiment=sentiment,
            event_ids=[g.id for g in grouped],
            source_names=unique_sources,
            source_kinds=list({g.source_kind for g in grouped}),
            source_urls=list({g.source_url for g in grouped if g.source_url}),
            pdf_urls=list({g.pdf_url for g in grouped if g.pdf_url}),
            summary=first.evidence[0],
            first_seen_at=first_seen,
            last_seen_at=last_seen,
            confidence=sum(g.confidence for g in grouped) / len(grouped),
            corroboration_count=len(unique_sources),
            event_weight=sum(g.event_weight for g in grouped) / len(grouped),
            average_source_credibility=sum(g.source_credibility_score for g in grouped) / len(grouped),
            rumor_like_count=sum(1 for g in grouped if g.is_rumor_like)
        ))
        
    return clusters
