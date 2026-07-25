from typing import Optional

EVENT_RULES = [
    {"type": "earnings", "keywords": ["results", "revenue", "profit", "ebitda", "margin", "pat", "eps", "guidance"]},
    {"type": "order_win", "keywords": ["order", "contract", "work order", "loa"]},
    {"type": "merger_acquisition", "keywords": ["bulk deal", "block deal", "stake sale", "acquisition", "merger"]},
    {"type": "dividend", "keywords": ["dividend", "bonus", "split", "buyback", "rights", "record date"]},
    {"type": "regulation", "keywords": ["approval", "penalty", "investigation", "sebi", "rbi"]},
    {"type": "management_change", "keywords": ["resignation", "appointment", "ceo", "cfo", "md"]}
]

def detect_event_type(text: str) -> Optional[str]:
    lower_text = text.lower()
    for rule in EVENT_RULES:
        for kw in rule["keywords"]:
            if kw in lower_text:
                return rule["type"]
    return None
