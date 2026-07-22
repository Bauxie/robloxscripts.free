import Link from "next/link";
import { readScripts, writeScripts, publicView } from "@/lib/store";
import ScriptView from "@/components/ScriptView";

export const dynamic = "force-dynamic";

export default function ScriptPage({ params }: { params: { id: string } }) {
  const scripts = readScripts();
  const record = scripts.find((x) => x.id === params.id);

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

  // increment view count
  record.views = (record.views || 0) + 1;
  writeScripts(scripts);

  return <ScriptView s={publicView(record, true)} />;
}
