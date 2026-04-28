import { AppShell } from "@/ui/components/app-shell";
import { OverviewPage } from "@/ui/sections/overview-page";

export default async function Page() {
  return (
    <AppShell activePath="/">
      <OverviewPage />
    </AppShell>
  );
}
