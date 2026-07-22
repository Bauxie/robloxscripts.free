import Link from "next/link";
import { incrementViews, publicView } from "@/lib/store";
import ScriptView from "@/components/ScriptView";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ScriptPage({ params }: { params: { id: string } }) {
  let record = null;
  try {
    record = await incrementViews(params.id);
  } catch {
    record = null;
  }

  if (!record) {
    return (
      <main className="app">
        <div className="empty">
          <div className="big">🌊</div>
          <h3>Script not found</h3>
          <p>It may have drifted away.</p>
          <Link href="/scripts" className="btn btn-primary" style={{ marginTop: 16 }}>
            Browse scripts
          </Link>
        </div>
      </main>
    );
  }

  return <ScriptView s={publicView(record, true)} />;
}
