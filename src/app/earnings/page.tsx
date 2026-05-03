import { AppShell } from "@/ui/components/app-shell";
import { EarningsPage } from "@/ui/sections/earnings-page";

export default function Page() {
  return (
    <AppShell activePath="/earnings">
      <EarningsPage />
    </AppShell>
  );
}
