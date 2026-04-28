const baseUrl = process.env.API_BASE_URL ?? "http://127.0.0.1:3000";

type StepResult = {
  name: string;
  ok: boolean;
  status?: number;
  detail?: string;
};

async function requestJson(path: string, init?: RequestInit) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const text = await response.text();
  let json: unknown = null;

  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  return {
    ok: response.ok,
    status: response.status,
    json
  };
}

function print(result: StepResult) {
  const status = result.ok ? "PASS" : "FAIL";
  const suffix = result.status ? ` (${result.status})` : "";
  const detail = result.detail ? ` - ${result.detail}` : "";

  console.log(`${status}${suffix} ${result.name}${detail}`);
}

async function main() {
  const results: StepResult[] = [];

  const watchlists = await requestJson("/api/watchlists");
  results.push({
    name: "GET /api/watchlists",
    ok: watchlists.ok,
    status: watchlists.status
  });

  const run = await requestJson("/api/signals/run", {
    method: "POST"
  });
  results.push({
    name: "POST /api/signals/run",
    ok: run.ok,
    status: run.status
  });

  const signals = await requestJson("/api/signals?limit=10&sort=score_desc");
  const signalItems =
    typeof signals.json === "object" &&
    signals.json !== null &&
    "data" in signals.json &&
    typeof (signals.json as { data?: unknown }).data === "object" &&
    (signals.json as { data?: { items?: unknown[] } }).data?.items
      ? (signals.json as { data: { items: unknown[] } }).data.items
      : [];

  results.push({
    name: "GET /api/signals",
    ok: signals.ok && Array.isArray(signalItems),
    status: signals.status,
    detail: `items=${Array.isArray(signalItems) ? signalItems.length : 0}`
  });

  const firstSignalId =
    Array.isArray(signalItems) &&
    signalItems.length > 0 &&
    typeof signalItems[0] === "object" &&
    signalItems[0] !== null &&
    "id" in signalItems[0]
      ? String((signalItems[0] as { id: string }).id)
      : null;

  if (firstSignalId) {
    const signalDetail = await requestJson(`/api/signals/${firstSignalId}`);
    results.push({
      name: "GET /api/signals/:id",
      ok: signalDetail.ok,
      status: signalDetail.status,
      detail: firstSignalId
    });

    const feedback = await requestJson("/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        signalId: firstSignalId,
        outcome: "DOWN",
        priceChange: -2.4,
        horizon: "1d"
      })
    });

    results.push({
      name: "POST /api/feedback",
      ok: feedback.ok,
      status: feedback.status
    });
  } else {
    results.push({
      name: "GET /api/signals/:id",
      ok: false,
      detail: "no signal id available from listing response"
    });
    results.push({
      name: "POST /api/feedback",
      ok: false,
      detail: "no signal id available from listing response"
    });
  }

  const report = await requestJson("/api/reports/latest");
  results.push({
    name: "GET /api/reports/latest",
    ok: report.ok,
    status: report.status
  });

  results.forEach(print);

  const failed = results.some((result) => !result.ok);
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  console.error("FAIL api smoke test", error);
  process.exit(1);
});
