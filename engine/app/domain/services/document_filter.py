import re
from datetime import datetime, timezone
from typing import List, Dict, Any
from ..entities.raw_document import RawDocument
from ..data.stock_universe import STOCK_UNIVERSE

FINANCIAL_KEYWORDS = [
    "results", "earnings", "revenue", "profit", "margin", "dividend",
    "bonus", "split", "rights issue", "merger", "acquisition", "demerger",
    "board meeting", "promoter", "stake", "insider", "bulk deal", "block deal",
    "order win", "contract", "capex", "guidance", "rating", "upgrade",
    "downgrade", "buyback", "ipo", "listing", "gmp", "sebi", "rbi",
    "penalty", "investigation", "management change", "ceo", "cfo",
    "resignation", "policy", "regulation", "volume", "breakout",
    "breakdown", "announcement", "filing", "sector"
]

HIGH_IMPACT_CATEGORIES = {
    "results", "dividend", "acquisition", "buyback", "promoter_activity",
    "board", "board_meeting", "board_outcome", "shareholding", "allotment",
    "m&a", "general_announcement"
}

def contains_token(text: str, token: str) -> bool:
    token = token.strip().lower()
    if not token:
        return False
    if " " in token:
        return token in text
    escaped = re.escape(token)
    return bool(re.search(rf"(^|[^a-z0-9]){escaped}([^a-z0-9]|$)", text))

def is_fresh(doc: RawDocument) -> bool:
    age = (datetime.now(timezone.utc) - doc.published_at.replace(tzinfo=timezone.utc)).total_seconds() / 3600
    return age <= 72

def has_structured_impact(doc: RawDocument) -> bool:
    cat = str(doc.metadata.get("category", "")).lower()
    ann = str(doc.metadata.get("announcementType", "")).lower()
    return cat in HIGH_IMPACT_CATEGORIES or ann in HIGH_IMPACT_CATEGORIES

def has_social_momentum(doc: RawDocument) -> bool:
    if doc.source_kind != "social": return False
    spike = float(doc.metadata.get("mentionCountSpike", 0))
    trend = float(doc.metadata.get("trendingScore", 0))
    sent = str(doc.metadata.get("sentiment", "")).lower()
    return spike >= 1.5 and trend >= 50 and sent != "negative"

def filter_stock_relevant_documents(docs: List[RawDocument]) -> List[RawDocument]:
    kept = []
    
    for doc in docs:
        text = f"{doc.title} {doc.content}".lower()
        
        twits_momentum = doc.source_name == "Stocktwits" and len(doc.tickers_hint) > 0 and is_fresh(doc) and (has_social_momentum(doc) or doc.metadata.get("sourceType") == "social_momentum")
        
        matched_univ = None
        for entry in STOCK_UNIVERSE:
            if entry.ticker in doc.tickers_hint:
                matched_univ = entry
                break
            for token in [entry.ticker, entry.company_name] + entry.aliases:
                if contains_token(text, token):
                    matched_univ = entry
                    break
            if matched_univ:
                break
                
        has_fin = any(kw in text for kw in FINANCIAL_KEYWORDS)
        allowed_event = has_fin or has_structured_impact(doc) or has_social_momentum(doc)
        
        if not is_fresh(doc):
            continue
        if not matched_univ and not twits_momentum:
            continue
        if not allowed_event and not twits_momentum:
            continue
            
        # Add canonical ticker logic...
        kept.append(doc)
        
    return kept
