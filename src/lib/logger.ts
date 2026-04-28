export function logRouteError(route: string, error: unknown) {
  console.error(`[api] ${route}`, error);
}
