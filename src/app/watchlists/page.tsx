import { AppShell } from "@/ui/components/app-shell";
import { WatchlistsPage } from "@/ui/sections/watchlists-page";

export default async function Page() {
  return (
    <AppShell activePath="/watchlists">
      <WatchlistsPage />
    </AppShell>
  );
}
