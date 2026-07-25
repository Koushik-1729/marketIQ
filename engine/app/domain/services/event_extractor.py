import re
from typing import List
from ..entities.raw_document import RawDocument, NormalizedDocument
from ..entities.events import ExtractedEvent
from .ticker_resolver import resolve_tickers_from_text
from .event_detector import detect_event_type
from ..data.stock_universe import STOCK_UNIVERSE

def extract_events(raw_docs: List[RawDocument], normalized_docs: List[NormalizedDocument]) -> List[ExtractedEvent]:
    events = []
    
    for norm_doc in normalized_docs:
        if norm_doc.is_duplicate:
            continue
            
        raw = next((r for r in raw_docs if r.id == norm_doc.raw_document_id), None)
        if not raw:
            continue
            
        full_text = f"{raw.title} {raw.content}"
        tickers = resolve_tickers_from_text(full_text)
        
        # Single token check
        tokens = re.findall(r'\b[A-Z][A-Z0-9&.-]{1,14}\b', full_text)
        for t in tokens:
            t_res = resolve_tickers_from_text(t)
            for tr in t_res:
                if tr not in tickers:
                    tickers.append(tr)
                    
        if not tickers:
            continue
            
        for ticker in tickers:
            event_type = detect_event_type(full_text)
            if not event_type:
                continue
                
            has_numbers = bool(re.search(r'[₹$]|\d+\.?\d*\s*(cr|crore|%|bps|lakh|bn|mn)', full_text, re.IGNORECASE))
            is_official = raw.source_kind == "filing"
            
            company = next((s.company_name for s in STOCK_UNIVERSE if s.ticker == ticker), ticker)
            strong_match = company.lower() in full_text.lower()
            
            if not is_official and not has_numbers and not strong_match:
                continue
                
            confidence = 0.5
            if is_official: confidence += 0.2
            if has_numbers: confidence += 0.15
            if strong_match: confidence += 0.15
            confidence = min(confidence, 1.0)
            
            if confidence < 0.6:
                continue
                
            # Detect sentiment
            pos = bool(re.search(r'growth|strong|upbeat|win|expansion|buying|breakout|beats?|exceed|upgrade|record|robust|positive|surge', full_text, re.IGNORECASE))
            neg = bool(re.search(r'selling|cut|probe|risk|weak|breakdown|concern|miss|disappoint|downgrade|penalty|loss|decline|fall', full_text, re.IGNORECASE))
            
            if pos and neg:
                sentiment = "mixed"
            elif pos:
                sentiment = "positive"
            elif neg:
                sentiment = "negative"
            else:
                sentiment = "neutral"
                
            events.append(ExtractedEvent(
                id=f"evt_{raw.id}_{ticker}",
                document_id=raw.id,
                ticker=ticker,
                company=company,
                sector="Other",
                event_type=event_type,
                sentiment=sentiment,
                confidence=confidence,
                event_at=raw.published_at,
                keywords=[event_type] + ticker.split("-"),
                evidence=[raw.title, full_text[:200]],
                source_name=raw.source_name,
                source_kind=raw.source_kind,
                source_url=raw.pdf_url or raw.url,
                pdf_url=raw.pdf_url
            ))
            
    return events
