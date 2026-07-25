from typing import Dict

SECTOR_MAP: Dict[str, str] = {
    "RELIANCE": "Energy",
    "ONGC": "Energy",
    "POWERGRID": "Energy",
    "NTPC": "Energy",

    "TCS": "IT",
    "INFY": "IT",
    "HCLTECH": "IT",
    "WIPRO": "IT",
    "TECHM": "IT",

    "HDFCBANK": "Banking",
    "ICICIBANK": "Banking",
    "SBIN": "Banking",
    "AXISBANK": "Banking",
    "KOTAKBANK": "Banking",

    "TATAMOTORS": "Auto",
    "MARUTI": "Auto",
    "M&M": "Auto",
    "BAJAJ-AUTO": "Auto",

    "SUNPHARMA": "Pharma",
    "DRREDDY": "Pharma",
    "DIVISLAB": "Pharma",
    "CIPLA": "Pharma",

    "ITC": "FMCG",
    "HINDUNILVR": "FMCG",
    "NESTLEIND": "FMCG",

    "TATASTEEL": "Metal",
    "HINDALCO": "Metal",
    "JSWSTEEL": "Metal",

    "DLF": "Realty",
    "GODREJPROP": "Realty"
}

TICKER_TO_SECTOR: Dict[str, str] = SECTOR_MAP
