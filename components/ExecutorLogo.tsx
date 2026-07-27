"use client";

import type { Executor } from "@/lib/executors";

/** Small branded logo for an executor (img with letter fallback). */
export default function ExecutorLogo({
  executor,
  size = 20,
  className = "",
}: {
  executor: Pick<Executor, "id" | "name" | "logo" | "color">;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`exec-logo ${className}`.trim()}
      style={{
        width: size,
        height: size,
        background: "#fff",
      }}
      title={executor.name}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={executor.logo}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        onError={(e) => {
          const img = e.currentTarget;
          img.style.display = "none";
          const parent = img.parentElement;
          if (parent && !parent.querySelector(".exec-logo-fallback")) {
            const span = document.createElement("span");
            span.className = "exec-logo-fallback";
            span.textContent = executor.name.slice(0, 1).toUpperCase();
            parent.appendChild(span);
          }
        }}
      />
    </span>
  );
}
