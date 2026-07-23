import FavoritesClient from "@/components/FavoritesClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Favorites",
  robots: { index: false, follow: false },
};

export default function FavoritesPage() {
  return <FavoritesClient />;
}
