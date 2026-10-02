import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SupabaseAuthProvider } from "@/lib/supabase/auth-provider";
import { AppDataProvider } from "@/lib/app-data-context";
import { NewMemberDraftProvider } from "@/lib/new-member-draft-context";
import { RouteGuard } from "@/components/RouteGuard";
import { BottomNav, TopNav } from "@/components/BottomNav";
import { PasswordReminderBanner } from "@/components/PasswordReminderBanner";

export const metadata: Metadata = {
  title: "조동아리",
  description: "소규모 비공개 탐조 동호회 앱",
};

export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SupabaseAuthProvider>
          <NewMemberDraftProvider>
            <AppDataProvider>
              <RouteGuard>
                <PasswordReminderBanner />
                <TopNav />
                <main className="w-full flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
                  {children}
                </main>
              </RouteGuard>
              <BottomNav />
            </AppDataProvider>
          </NewMemberDraftProvider>
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}
