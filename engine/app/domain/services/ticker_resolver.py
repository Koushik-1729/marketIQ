import re
from typing import List, Optional, Dict, Any
from ..data.stock_universe import STOCK_UNIVERSE, ALIAS_TO_TICKER

BLACKLIST = {
    "AM", "PM", "Q1", "Q2", "Q3", "Q4",
    "FY20", "FY21", "FY22", "FY23", "FY24", "FY25", "FY26", "FY27",
    "EBITDA", "EBIT", "PAT", "EPS", "YOY", "QOQ",
    "MTM", "CDMO", "R32", "NOW", "LIVE", "VIEW",
    "CNBCTV18", "USD", "INR", "US", "CEO", "CFO", "MD",
    "NSE", "BSE", "SEBI", "RBI"
}

def normalize_text(text: str) -> str:
    text = text.upper().strip()
    text = re.sub(r'[^A-Z0-9-]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text

def resolve_tickers_from_text(text: str) -> List[str]:
    normalized = normalize_text(text)
    resolved = []
    seen = set()
    
    sorted_universe = sorted(
        STOCK_UNIVERSE,
        key=lambda x: max([len(x.ticker)] + [len(a) for a in x.aliases]),
        reverse=True
    )
    
    for entry in sorted_universe:
        aliases = [entry.ticker] + entry.aliases
        for alias in aliases:
            norm_alias = normalize_text(alias)
            if len(norm_alias) < 2 or norm_alias in BLACKLIST:
                continue
                
            escaped = re.escape(norm_alias)
            pattern = re.compile(rf'(?:^|\s){escaped}(?:\s|$)', re.IGNORECASE)
            
            if pattern.search(normalized):
                if entry.ticker not in seen:
                    resolved.append(entry.ticker)
                    seen.add(entry.ticker)
                    break
                    
    return resolved
