import FeedClient from "@/components/FeedClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Feed",
  robots: { index: false, follow: false },
};

export default function FeedPage() {
  return <FeedClient />;
}
