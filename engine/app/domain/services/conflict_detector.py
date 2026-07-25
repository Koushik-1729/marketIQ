from typing import Tuple, Optional
from ..entities.events import EventCluster
from ..entities.market_data import PriceValidation

def detect_conflicts(cluster: EventCluster, price_validation: Optional[PriceValidation]) -> Tuple[bool, float, Optional[str]]:
    if not price_validation:
        return False, 0.0, None
        
    if cluster.sentiment == "positive" and price_validation.confirmation_status == "CONTRADICTION":
        return True, 14.0, "Positive narrative but weak price confirmation"
        
    if cluster.event_type == "insider_activity" and cluster.sentiment != "positive" and price_validation.volume_ratio > 2:
        return True, 18.0, "Insider or promoter-related risk reinforced by delivery spike"
        
    return False, 0.0, None
