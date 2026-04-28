import { AppShell } from "@/ui/components/app-shell";
import { SignalsPage } from "@/ui/sections/signals-page";

export default async function Page() {
  return (
    <AppShell activePath="/signals">
      <SignalsPage />
    </AppShell>
  );
}
