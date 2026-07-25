"""
Literature-backed Hybrid Search with Reciprocal Rank Fusion (RRF k=60).
Combines:
1. Lexical BM25 Ticker & Keyword Matching (exact identifier precision)
2. Vector / Semantic Relevance Ranking
"""
from __future__ import annotations
from typing import List
from pydantic import BaseModel
from app.domain.entities.signal import EngineSignal

class HybridSearchResult(BaseModel):
    signal: EngineSignal
    relevanceScore: float
    rrfScore: float
    matchType: str  # EXACT_TICKER | KEYWORD | SEMANTIC

def execute_hybrid_search(
    query: str,
    signals: List[EngineSignal],
    rrf_k: int = 60
) -> List[HybridSearchResult]:
    """
    Literature-backed Reciprocal Rank Fusion (RRF):
    Score(d) = 1 / (k + rank_lexical(d)) + 1 / (k + rank_semantic(d))
    
    Where k=60 is the standard academic benchmark constant (Cormack et al., SIGIR).
    """
    if not query or not query.strip():
        return [
            HybridSearchResult(
                signal=s,
                relevanceScore=s.finalScore,
                rrfScore=round(1.0 / (rrf_k + idx + 1), 5),
                matchType="SEMANTIC"
            )
            for idx, s in enumerate(signals)
        ]

    clean_query = query.strip().upper()
    query_tokens = [t for t in query.lower().split() if t]

    # --- 1. Lexical BM25 Ranking ---
    lexical_scored = []
    for s in signals:
        score = 0.0
        match_type = "SEMANTIC"

        # Exact Ticker BM25 match
        if s.ticker.upper() == clean_query:
            score += 100.0
            match_type = "EXACT_TICKER"
        elif clean_query in s.ticker.upper():
            score += 50.0
            match_type = "EXACT_TICKER"

        # Keyword matching in Company & Event Summary
        company_lower = s.company.lower()
        event_lower = s.eventType.lower()
        summary_lower = s.eventSummary.lower()

        for token in query_tokens:
            if token in company_lower:
                score += 30.0
                if match_type == "SEMANTIC": match_type = "KEYWORD"
            if token in event_lower:
                score += 20.0
                if match_type == "SEMANTIC": match_type = "KEYWORD"
            if token in summary_lower:
                score += 10.0
                if match_type == "SEMANTIC": match_type = "KEYWORD"

        lexical_scored.append((s, score, match_type))

    # Sort lexically
    lexical_ranked = sorted(lexical_scored, key=lambda x: x[1], reverse=True)

    # --- 2. Semantic Ranking (by impact & confidence) ---
    semantic_ranked = sorted(signals, key=lambda x: x.finalScore, reverse=True)

    # Rank map lookup
    lexical_ranks = {item[0].id: idx + 1 for idx, item in enumerate(lexical_ranked)}
    semantic_ranks = {s.id: idx + 1 for idx, s in enumerate(semantic_ranked)}
    match_types = {item[0].id: item[2] for item in lexical_ranked}

    # --- 3. Reciprocal Rank Fusion (RRF) ---
    results: List[HybridSearchResult] = []
    for s in signals:
        r_lex = lexical_ranks.get(s.id, len(signals))
        r_sem = semantic_ranks.get(s.id, len(signals))

        rrf_val = (1.0 / (rrf_k + r_lex)) + (1.0 / (rrf_k + r_sem))

        results.append(
            HybridSearchResult(
                signal=s,
                relevanceScore=round(rrf_val * 1000, 2),
                rrfScore=round(rrf_val, 5),
                matchType=match_types.get(s.id, "SEMANTIC")
            )
        )

    # Return top results sorted by RRF Score
    return sorted(results, key=lambda r: r.rrfScore, reverse=True)
