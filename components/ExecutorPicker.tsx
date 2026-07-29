"use client";

import { EXECUTORS } from "@/lib/executors";
import ExecutorLogo from "@/components/ExecutorLogo";

export default function ExecutorPicker({
  name = "executors",
  value,
  onChange,
  required = false,
}: {
  name?: string;
  value?: string[];
  onChange?: (ids: string[]) => void;
  required?: boolean;
}) {
  const selected = new Set(value || []);
  const hint = required
    ? `Pick at least one — ${selected.size} of ${EXECUTORS.length} selected.`
    : "Optional — help people know what to run it with.";

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
        <label>
          Works with executors {required ? <span className="req">*</span> : null}
        </label>
        <div className="executor-picker">
          {EXECUTORS.map((ex) => (
            <label key={ex.id} className="executor-chip">
              <input type="checkbox" name={name} value={ex.id} />
              <span className="executor-chip-label">
                <ExecutorLogo executor={ex} size={18} /> {ex.name}
              </span>
            </label>
          ))}
        </div>
        <div className="hint">{hint}</div>
      </div>
    );
  }

  return (
    <div>
      <label>
        Works with executors {required ? <span className="req">*</span> : null}
      </label>
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
            <span className="executor-chip-label">
              <ExecutorLogo executor={ex} size={18} /> {ex.name}
            </span>
          </label>
        ))}
      </div>
      <input type="hidden" name={name} value={(value || []).join(",")} />
      <div className="hint">{hint}</div>
    </div>
  );
}
