import {
  RedirectToSignIn,
  SignedIn,
  UserButton,
} from "@daveyplate/better-auth-ui";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SettingsModal } from "@/components/settings-modal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <RedirectToSignIn />

      <SignedIn>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <main className="max-h-screen flex flex-col p-4 w-full min-w-0 overflow-hidden">
              <SidebarTrigger />
              {children}
            </main>
          </SidebarInset>
          <SettingsModal />
        </SidebarProvider>
      </SignedIn>
    </>
  );
}
