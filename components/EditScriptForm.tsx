"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { ScriptView } from "@/lib/store";
import ExecutorPicker from "@/components/ExecutorPicker";
import { useToast } from "@/components/ToastProvider";

export default function EditScriptForm({ script }: { script: ScriptView }) {
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState(script.title);
  const [description, setDescription] = useState(script.description);
  const [gameLink, setGameLink] = useState(
    script.gamePlaceId ? `https://www.roblox.com/games/${script.gamePlaceId}` : ""
  );
  const [code, setCode] = useState(script.code || "");
  const [tags, setTags] = useState((script.tags || []).join(","));
  const [executors, setExecutors] = useState(script.executors || []);
  const [changelog, setChangelog] = useState("");
  const [newVersion, setNewVersion] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/scripts/${script.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          gameLink,
          code,
          tags,
          executors,
          changelog,
          newVersion,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      if (data.warnings?.length) {
        toast(`Saved with warnings: ${data.warnings.join("; ")}`);
      } else {
        toast(newVersion ? `Published v${data.version}` : "Script updated");
      }
      router.push(`/script/${script.id}`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!confirm("Delete this script permanently?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/scripts/${script.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      toast("Script deleted");
      router.push("/profile");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="panel panel-narrow">
      <div className="section-head" style={{ marginTop: 0 }}>
        <div>
          <h2>✏️ Edit script</h2>
          <p>
            Current version <b>v{script.version || 1}</b> — publish a new version to bump it.
          </p>
        </div>
      </div>
      <form className="form-grid" onSubmit={onSave}>
        <div>
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
        </div>
        <div>
          <label>Roblox game link</label>
          <input
            value={gameLink}
            onChange={(e) => setGameLink(e.target.value)}
            placeholder="https://www.roblox.com/games/..."
          />
        </div>
        <div>
          <label>Tags (comma-separated)</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="op, autofarm" />
        </div>
        <ExecutorPicker value={executors} onChange={setExecutors} />
        <div>
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={4}
          />
        </div>
        <div>
          <label>Changelog</label>
          <textarea
            value={changelog}
            onChange={(e) => setChangelog(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="What changed in this update?"
          />
        </div>
        <label className="filter-check">
          <input
            type="checkbox"
            checked={newVersion}
            onChange={(e) => setNewVersion(e.target.checked)}
          />
          Publish as new version (v{(script.version || 1) + 1})
        </label>
        <div>
          <label>Code</label>
          <textarea
            className="code-input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            required
          />
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onDelete} disabled={busy}>
            Delete
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Saving…" : newVersion ? "Publish new version" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
