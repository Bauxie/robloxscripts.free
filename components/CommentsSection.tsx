"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { timeAgo } from "@/lib/format";
import { useToast } from "@/components/ToastProvider";

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  author: string;
  avatarUrl: string | null;
  userId: string;
};

export default function CommentsSection({
  scriptId,
  canComment,
}: {
  scriptId: string;
  canComment: boolean;
}) {
  const toast = useToast();
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const res = await fetch(`/api/scripts/${scriptId}/comments`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load comments");
      setComments(data.comments);
    } catch {
      setComments([]);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/scripts/${scriptId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not comment");
      setBody("");
      toast("Comment posted");
      await load();
    } catch (err) {
      toast((err as Error).message, true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="comments-section">
      <div className="section-head" style={{ marginTop: 28 }}>
        <div>
          <h2>💬 Comments</h2>
          <p>Be kind — staff can remove abusive posts.</p>
        </div>
      </div>

      {canComment ? (
        <form className="form-grid comment-form" onSubmit={onSubmit}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Say something helpful…"
            disabled={busy}
          />
          <div className="form-actions">
            <span className="hint">{body.length}/1000</span>
            <button type="submit" className="btn btn-primary" disabled={busy || !body.trim()}>
              Post comment
            </button>
          </div>
        </form>
      ) : (
        <p className="hint">
          <Link href={`/login?next=/script/${scriptId}`}>Log in</Link> to comment.
        </p>
      )}

      {comments === null ? (
        <div className="loading" style={{ padding: 24 }}>
          <div className="spinner" />
        </div>
      ) : comments.length === 0 ? (
        <p className="hint">No comments yet — be the first.</p>
      ) : (
        <div className="comment-list">
          {comments.map((c) => (
            <article className="comment-card" key={c.id}>
              <div className="comment-meta">
                <span className="author-avatar">
                  {c.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.avatarUrl} alt="" width={22} height={22} />
                  ) : (
                    <span aria-hidden>{(c.author[0] || "?").toUpperCase()}</span>
                  )}
                </span>
                <Link href={`/u/${encodeURIComponent(c.author)}`}>@{c.author}</Link>
                <span className="muted">· {timeAgo(c.createdAt)}</span>
              </div>
              <p>{c.body}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
