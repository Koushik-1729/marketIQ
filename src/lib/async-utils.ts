const DEFAULT_TIMEOUT_MS = 1500;

export async function withTimeout<T>(
  loader: () => Promise<T>,
  fallback: T,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<{ ok: boolean; data: T }> {
  try {
    const data = await Promise.race<T>([
      loader(),
      new Promise<T>((resolve) => {
        setTimeout(() => resolve(fallback), timeoutMs);
      })
    ]);

    return {
      ok: data !== fallback,
      data
    };
  } catch {
    return {
      ok: false,
      data: fallback
    };
  }
}

export async function withTimeoutValue<T>(
  loader: () => Promise<T>,
  fallback: T,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const result = await withTimeout(loader, fallback, timeoutMs);
  return result.data;
}
