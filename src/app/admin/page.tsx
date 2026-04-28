import { AppShell } from "@/ui/components/app-shell";
import { AdminPage } from "@/ui/sections/admin-page";

export default function Page() {
  return (
    <AppShell activePath="/admin">
      <AdminPage />
    </AppShell>
  );
}
