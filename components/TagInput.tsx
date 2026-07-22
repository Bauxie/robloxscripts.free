"use client";

import { KeyboardEvent, useId, useRef, useState } from "react";

const MAX_TAGS = 8;
const MAX_TAG_LEN = 40;

function normalizeTag(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, MAX_TAG_LEN);
}

export default function TagInput({
  name = "tags",
  max = MAX_TAGS,
}: {
  name?: string;
  max?: number;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [draft, setDraft] = useState("");

  function addTag(raw: string) {
    const tag = normalizeTag(raw);
    if (!tag) return;
    setTags((prev) => {
      const key = tag.toLowerCase();
      if (prev.some((t) => t.toLowerCase() === key)) return prev;
      if (prev.length >= max) return prev;
      return [...prev, tag];
    });
    setDraft("");
  }

  function removeTag(index: number) {
    setTags((prev) => prev.filter((_, i) => i !== index));
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft);
      return;
    }
    if (e.key === "Backspace" && !draft && tags.length) {
      e.preventDefault();
      removeTag(tags.length - 1);
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    if (!text.includes(",")) return;
    e.preventDefault();
    const parts = text.split(",");
    parts.forEach((p) => addTag(p));
  }

  return (
    <div>
      <label htmlFor={inputId}>Tags</label>
      <div
        className="tag-input"
        onClick={() => inputRef.current?.focus()}
        role="group"
        aria-label="Tags"
      >
        {tags.map((tag, i) => (
          <span className="tag-chip" key={`${tag}-${i}`}>
            {tag}
            <button
              type="button"
              className="tag-chip-remove"
              aria-label={`Remove ${tag}`}
              onClick={(e) => {
                e.stopPropagation();
                removeTag(i);
              }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={inputId}
          ref={inputRef}
          className="tag-input-field"
          type="text"
          value={draft}
          maxLength={MAX_TAG_LEN}
          disabled={tags.length >= max}
          placeholder={tags.length ? "Add another…" : "e.g. op, autofarm, esp"}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onBlur={() => {
            if (draft.trim()) addTag(draft);
          }}
          autoComplete="off"
        />
      </div>
      <input type="hidden" name={name} value={tags.join(",")} />
      <div className="hint">
        Type a tag and press <b>Enter</b> · game name comes from the Roblox link · {tags.length}/{max}
      </div>
    </div>
  );
}
