"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fmtBytes } from "@/lib/format";
import { useToast } from "@/components/ToastProvider";

export default function UploadPage({ username }: { username: string }) {
  const router = useRouter();
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const lines = code ? code.split("\n").length : 0;
  const size = new Blob([code]).size;

  function readFile(file?: File | null) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast("File too large (max 2 MB)", true);
    const reader = new FileReader();
    reader.onload = () => {
      setCode(String(reader.result));
      toast(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("code", code);
    if ((fd.get("title") as string)?.trim() === "") return setError("Please add a title.");
    if (!code.trim()) return setError("Please paste or upload some code.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/scripts", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      toast("Published! 🌊");
      router.push(`/script/${data.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  function onClear() {
    formRef.current?.reset();
    setCode("");
    setError("");
  }

  return (
    <main className="app">
      <Link href="/" className="back-link">
        ← Home
      </Link>
      <div className="panel panel-narrow">
        <div className="section-head" style={{ marginTop: 0 }}>
          <div>
            <h2>📤 Upload a script</h2>
            <p>
              Publishing as <b>@{username}</b> · paste code or drop a <b>.lua</b> / <b>.txt</b> file.
            </p>
          </div>
        </div>

        <form ref={formRef} className="form-grid" onSubmit={onSubmit}>
          <div className="row2">
            <div>
              <label>
                Title <span className="req">*</span>
              </label>
              <input
                type="text"
                name="title"
                placeholder="e.g. Blade Ball Auto Parry"
                maxLength={120}
                required
              />
            </div>
            <div>
              <label>Game</label>
              <input type="text" name="game" placeholder="e.g. Blade Ball" maxLength={80} />
            </div>
          </div>
          <div>
            <label>Tags</label>
            <input type="text" name="tags" placeholder="comma,separated,tags" />
            <div className="hint">Author is set from your profile (@{username}).</div>
          </div>
          <div>
            <label>Description</label>
            <textarea
              name="description"
              placeholder="What does this script do? Any keybinds or setup?"
              maxLength={2000}
            />
          </div>

          <div>
            <label>
              Script code <span className="req">*</span>
            </label>
            <div
              className={`dropzone${drag ? " drag" : ""}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDrag(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                readFile(e.dataTransfer.files?.[0]);
              }}
            >
              📄 <b>Drag &amp; drop</b> a .lua / .txt file here, or click to browse
              <input
                ref={fileRef}
                type="file"
                accept=".lua,.txt,text/plain"
                hidden
                onChange={(e) => readFile(e.target.files?.[0])}
              />
            </div>
            <div className="divider" style={{ margin: "14px 0" }}>
              or paste below
            </div>
            <textarea
              className="code-input"
              placeholder={"-- Paste your Lua script here\nprint('Hello from robloxscripts.free')"}
              spellCheck={false}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <div className="hint">
              {lines} lines · {fmtBytes(size)}
            </div>
          </div>

          <div className="form-actions">
            {error ? <span className="form-error">{error}</span> : null}
            <button type="button" className="btn btn-ghost" onClick={onClear}>
              Clear
            </button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
              {submitting ? "Publishing…" : "🌊 Publish script"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
