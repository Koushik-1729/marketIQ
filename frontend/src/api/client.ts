const API_BASE_URL = "http://127.0.0.1:8001/api/v1";

export async function fetchSignals(query: string = "", limit: number = 10, offset: number = 0) {
  try {
    const endpoint = query
      ? `${API_BASE_URL}/signals/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`
      : `${API_BASE_URL}/signals?limit=${limit}&offset=${offset}`;

    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`API error: ${res.statusText}`);
    const data = await res.json();
    return {
      items: data.items || data.signals || data.results?.map((r: any) => r.signal) || [],
      totalCount: data.totalCount || data.count || 0,
      page: data.page || 1,
      totalPages: data.totalPages || 1,
      limit: data.limit || limit,
      offset: data.offset || offset
    };
  } catch (err) {
    console.warn("Python backend connection fallback:", err);
    return {
      items: [],
      totalCount: 0,
      page: 1,
      totalPages: 1,
      limit,
      offset
    };
  }
}

export async function triggerSignalScan() {
  const res = await fetch(`${API_BASE_URL}/signals/run`, {
    method: "POST"
  });
  if (!res.ok) throw new Error(`API error: ${res.statusText}`);
  return res.json();
}

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
