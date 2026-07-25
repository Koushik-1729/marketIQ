import re
from typing import Dict, Any
from ..entities.events import EventCluster
from ..entities.market_data import EarningsEvent

def score_earnings_signal(cluster: EventCluster, event: EarningsEvent) -> Dict[str, Any]:
    summary_text = f"{cluster.summary} {cluster.company}".lower()
    score = 40
    
    if event.actual_eps is not None:
        score += 20 if event.actual_eps >= 0 else -20
        
    if (event.actual_revenue is not None and event.estimated_revenue is not None and event.actual_revenue > event.estimated_revenue) or bool(re.search(r'revenue grew|growth in revenue|revenue growth|grew to', summary_text)):
        score += 15
        
    if 'record profit' in summary_text: score += 20
    if 'decline' in summary_text or 'loss' in summary_text: score -= 20
    
    if cluster.corroboration_count >= 2: score += 15
    score += 20
    
    if event.guidance_tone == "POSITIVE": score += 10
    elif event.guidance_tone == "NEGATIVE": score -= 10
    
    return {
        "score_adjustment": score,
        "confidence_floor": 0.88,
        "summary": f"{event.fiscal_quarter} results announced"
    }
