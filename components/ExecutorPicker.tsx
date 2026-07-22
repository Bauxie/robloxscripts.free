"use client";

import { EXECUTORS } from "@/lib/executors";

export default function ExecutorPicker({
  name = "executors",
  value,
  onChange,
}: {
  name?: string;
  value?: string[];
  onChange?: (ids: string[]) => void;
}) {
  const selected = new Set(value || []);

  function toggle(id: string) {
    if (!onChange) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  }

  // uncontrolled for form posts
  if (!onChange) {
    return (
      <div>
        <label>Works with executors</label>
        <div className="executor-picker">
          {EXECUTORS.map((ex) => (
            <label key={ex.id} className="executor-chip">
              <input type="checkbox" name={name} value={ex.id} />
              <span>
                {ex.emoji} {ex.name}
              </span>
            </label>
          ))}
        </div>
        <div className="hint">Optional — help people know what to run it with.</div>
      </div>
    );
  }

  return (
    <div>
      <label>Works with executors</label>
      <div className="executor-picker">
        {EXECUTORS.map((ex) => (
          <label
            key={ex.id}
            className={`executor-chip${selected.has(ex.id) ? " is-on" : ""}`}
          >
            <input
              type="checkbox"
              checked={selected.has(ex.id)}
              onChange={() => toggle(ex.id)}
            />
            <span>
              {ex.emoji} {ex.name}
            </span>
          </label>
        ))}
      </div>
      <input type="hidden" name={name} value={(value || []).join(",")} />
      <div className="hint">Optional — help people know what to run it with.</div>
    </div>
  );
}
