"use client";

import { useState } from "react";
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
  const [failed, setFailed] = useState(false);

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
      {failed ? (
        <span className="exec-logo-fallback" aria-hidden>
          {executor.name.slice(0, 1).toUpperCase()}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={executor.logo}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
