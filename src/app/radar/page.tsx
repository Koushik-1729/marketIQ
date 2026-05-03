import { AppShell } from "@/ui/components/app-shell";
import { RadarPage } from "@/ui/sections/radar-page";

export default function Page() {
  return (
    <AppShell activePath="/radar">
      <RadarPage />
    </AppShell>
  );
}
