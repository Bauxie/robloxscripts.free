import NotificationsPageClient from "@/components/NotificationsPageClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Notifications — robloxscripts.free",
  robots: { index: false, follow: false },
};

export default function NotificationsPage() {
  return <NotificationsPageClient />;
}
