import { addWatchlistTickers } from "@/application/use-cases/add-watchlist-tickers";
import { getPrimaryWatchlist } from "@/application/use-cases/get-primary-watchlist";
import { addWatchlistTickersSchema } from "@/lib/api-schemas";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logRouteError } from "@/lib/logger";

export async function GET() {
  try {
    const watchlist = await getPrimaryWatchlist();
    return apiSuccess(watchlist, 200);
  } catch (error) {
    logRouteError("GET /api/watchlists", error);
    return apiError("Failed to fetch watchlist", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = addWatchlistTickersSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid watchlist payload", 400, parsed.error.flatten());
    }

    const watchlist = await addWatchlistTickers(parsed.data.tickers);
    return apiSuccess(watchlist, 201);
  } catch (error) {
    logRouteError("POST /api/watchlists", error);
    return apiError("Failed to update watchlist", 500);
  }
}
