export type MarketEventType = 
  | "EARNINGS"
  | "ORDER"
  | "DEAL"
  | "CORPORATE_ACTION"
  | "REGULATORY"
  | "MANAGEMENT"
  | "OTHER";

const EVENT_RULES: { type: MarketEventType; keywords: string[] }[] = [
  {
    type: "EARNINGS",
    keywords: ["results", "revenue", "profit", "ebitda", "margin", "pat", "eps", "guidance"]
  },
  {
    type: "ORDER",
    keywords: ["order", "contract", "work order", "loa"]
  },
  {
    type: "DEAL",
    keywords: ["bulk deal", "block deal", "stake sale", "acquisition", "merger"]
  },
  {
    type: "CORPORATE_ACTION",
    keywords: ["dividend", "bonus", "split", "buyback", "rights", "record date"]
  },
  {
    type: "REGULATORY",
    keywords: ["approval", "penalty", "investigation", "sebi", "rbi"]
  },
  {
    type: "MANAGEMENT",
    keywords: ["resignation", "appointment", "ceo", "cfo", "md"]
  }
];

export function detectEvent(text: string): MarketEventType | null {
  const lowerText = text.toLowerCase();
  
  for (const rule of EVENT_RULES) {
    if (rule.keywords.some(kw => lowerText.includes(kw))) {
      return rule.type;
    }
  }

  return null;
}
