import { AppShell } from "@/ui/components/app-shell";
import { ReportsPage } from "@/ui/sections/reports-page";

export default function Page() {
  return (
    <AppShell activePath="/reports">
      <ReportsPage />
    </AppShell>
  );
}
