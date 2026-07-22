"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

export default function ScriptManageButtons({ scriptId }: { scriptId: string }) {
  const toast = useToast();
  const router = useRouter();

  async function remove() {
    if (!confirm("Delete this script?")) return;
    try {
      const res = await fetch(`/api/scripts/${scriptId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      toast("Script deleted");
      router.refresh();
    } catch (e) {
      toast((e as Error).message, true);
    }
  }

  return (
    <div className="card-manage">
      <Link href={`/script/${scriptId}/edit`} className="btn btn-ghost btn-sm">
        Edit
      </Link>
      <button type="button" className="btn btn-ghost btn-sm" onClick={remove}>
        Delete
      </button>
    </div>
  );
}
