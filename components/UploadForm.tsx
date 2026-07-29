"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fmtBytes } from "@/lib/format";
import { useToast } from "@/components/ToastProvider";
import TagInput from "@/components/TagInput";
import ExecutorPicker from "@/components/ExecutorPicker";
import { EXECUTORS } from "@/lib/executors";
import {
  CODE_MAX,
  CODE_MIN,
  DESC_MAX,
  DESC_MIN,
  TITLE_MAX,
  TITLE_MIN,
  firstUploadError,
  validateUploadFields,
  type UploadFieldErrors,
} from "@/lib/uploadValidation";

export default function UploadPage({ username }: { username: string }) {
  const router = useRouter();
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [gameLink, setGameLink] = useState("");
  const [executors, setExecutors] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<UploadFieldErrors>({});
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const lines = code ? code.split("\n").length : 0;
  const size = new Blob([code]).size;
  const titleLen = title.trim().length;
  const descLen = description.trim().length;
  const codeLen = code.trim().length;

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

  function runValidation(next?: {
    title?: string;
    description?: string;
    gameLink?: string;
    code?: string;
    executors?: string[];
  }) {
    const errors = validateUploadFields({
      title: next?.title ?? title,
      description: next?.description ?? description,
      gameLink: next?.gameLink ?? gameLink,
      code: next?.code ?? code,
      executors: next?.executors ?? executors,
    });
    setFieldErrors(errors);
    return errors;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);
    setError("");
    const errors = runValidation();
    const first = firstUploadError(errors);
    if (first) {
      setError(first);
      toast(first, true);
      const el = document.querySelector(".field-invalid");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("title", title.trim());
    fd.set("description", description.trim());
    fd.set("gameLink", gameLink.trim());
    fd.set("code", code);
    fd.delete("executors");
    for (const id of executors) fd.append("executors", id);

    setSubmitting(true);
    try {
      const res = await fetch("/api/scripts", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      if (data.warnings?.length) {
        toast(`Published with warnings: ${data.warnings.join("; ")}`);
      } else {
        toast("Published! 🌊");
      }
      router.push(`/script/${data.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  function onClear() {
    formRef.current?.reset();
    setTitle("");
    setDescription("");
    setGameLink("");
    setExecutors([]);
    setCode("");
    setError("");
    setFieldErrors({});
    setTouched(false);
    setFormKey((k) => k + 1);
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
            <ul className="upload-tips">
              <li>Add a clear title and Roblox game link for SEO + Play Game.</li>
              <li>Pick executor tags so people can filter what works.</li>
              <li>Never upload stealers, webhooks, or account grabbers.</li>
              <li>
                Description must be at least <b>{DESC_MIN} characters</b> so people know what it does.
              </li>
              <li>
                Discord perk: members of{" "}
                <a href="https://discord.gg/TaX9wg9seD" target="_blank" rel="noopener noreferrer">
                  our server
                </a>{" "}
                get faster staff review when requested.
              </li>
            </ul>
          </div>
        </div>

        <form key={formKey} ref={formRef} className="form-grid" onSubmit={onSubmit} noValidate>
          <div className={touched && fieldErrors.title ? "field-invalid" : undefined}>
            <label>
              Title <span className="req">*</span>
            </label>
            <input
              type="text"
              name="title"
              placeholder="e.g. Blade Ball Auto Parry"
              maxLength={TITLE_MAX}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (touched) runValidation({ title: e.target.value });
              }}
              aria-invalid={Boolean(touched && fieldErrors.title)}
            />
            <div className={`field-meta${titleLen < TITLE_MIN ? " is-short" : ""}`}>
              {titleLen}/{TITLE_MAX} · minimum {TITLE_MIN} characters
            </div>
            {touched && fieldErrors.title ? (
              <p className="field-error" role="alert">
                {fieldErrors.title}
              </p>
            ) : null}
          </div>

          <div className={touched && fieldErrors.gameLink ? "field-invalid" : undefined}>
            <label>Roblox game link</label>
            <input
              type="text"
              name="gameLink"
              placeholder="https://www.roblox.com/games/123456789/Your-Game"
              inputMode="url"
              value={gameLink}
              onChange={(e) => {
                setGameLink(e.target.value);
                if (touched) runValidation({ gameLink: e.target.value });
              }}
              aria-invalid={Boolean(touched && fieldErrors.gameLink)}
            />
            <div className="hint">
              Optional — we’ll pull the game name and thumbnail from this link for Play Game.
            </div>
            {touched && fieldErrors.gameLink ? (
              <p className="field-error" role="alert">
                {fieldErrors.gameLink}
              </p>
            ) : null}
          </div>

          <TagInput name="tags" />

          <div className={touched && fieldErrors.executors ? "field-invalid" : undefined}>
            <ExecutorPicker
              value={executors}
              onChange={(ids) => {
                setExecutors(ids);
                if (touched) runValidation({ executors: ids });
              }}
            />
            <div className="field-meta">
              {executors.length
                ? `${executors.length} selected · ${EXECUTORS.length} available`
                : "Select at least 1 executor"}
            </div>
            {touched && fieldErrors.executors ? (
              <p className="field-error" role="alert">
                {fieldErrors.executors}
              </p>
            ) : null}
          </div>

          <label className="filter-check">
            <input type="checkbox" name="keySystem" value="1" />
            This script uses a key system
          </label>
          <div className="hint" style={{ marginTop: -8 }}>
            Author is set from your profile (@{username}).
          </div>

          <div className={touched && fieldErrors.description ? "field-invalid" : undefined}>
            <label>
              Description <span className="req">*</span>
            </label>
            <textarea
              name="description"
              placeholder="What does this script do? Any keybinds or setup?"
              maxLength={DESC_MAX}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (touched) runValidation({ description: e.target.value });
              }}
              aria-invalid={Boolean(touched && fieldErrors.description)}
              rows={4}
            />
            <div className={`field-meta${descLen < DESC_MIN ? " is-short" : ""}`}>
              {descLen}/{DESC_MAX} ·{" "}
              {descLen < DESC_MIN
                ? `${DESC_MIN - descLen} more character${DESC_MIN - descLen === 1 ? "" : "s"} needed`
                : "minimum met"}
            </div>
            {touched && fieldErrors.description ? (
              <p className="field-error" role="alert">
                {fieldErrors.description}
              </p>
            ) : null}
          </div>

          <div className={touched && fieldErrors.code ? "field-invalid" : undefined}>
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
              onChange={(e) => {
                setCode(e.target.value);
                if (touched) runValidation({ code: e.target.value });
              }}
              aria-invalid={Boolean(touched && fieldErrors.code)}
            />
            <div className={`field-meta${codeLen < CODE_MIN ? " is-short" : ""}`}>
              {lines} lines · {fmtBytes(size)} ·{" "}
              {codeLen < CODE_MIN
                ? `${CODE_MIN - codeLen} more character${CODE_MIN - codeLen === 1 ? "" : "s"} needed (min ${CODE_MIN})`
                : `ready (max ${Math.floor(CODE_MAX / 1024)} KB)`}
            </div>
            {touched && fieldErrors.code ? (
              <p className="field-error" role="alert">
                {fieldErrors.code}
              </p>
            ) : null}
          </div>

          <div className="form-actions">
            {error ? (
              <span className="form-error" role="alert">
                {error}
              </span>
            ) : null}
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
