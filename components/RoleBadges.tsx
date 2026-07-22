"use client";

import type { RoleDef, RoleId } from "@/lib/roles";
import { roleDefsFor } from "@/lib/roles";
import RoleIcon from "@/components/RoleIcon";

export default function RoleBadges({
  roles,
  size = "md",
}: {
  roles: RoleId[] | null | undefined;
  size?: "sm" | "md" | "lg";
}) {
  const defs = roleDefsFor(roles || []);
  if (!defs.length) return null;

  return (
    <span className={`role-badges role-badges-${size}`} aria-label="Roles">
      {defs.map((role) => (
        <RoleBadge key={role.id} role={role} />
      ))}
    </span>
  );
}

function RoleBadge({ role }: { role: RoleDef }) {
  return (
    <span
      className={`role-badge role-badge-${role.id}`}
      style={{ background: role.bg, color: role.color }}
      tabIndex={0}
      aria-label={role.label}
    >
      <span className="role-badge-icon" aria-hidden>
        <RoleIcon role={role.id} />
      </span>
      <span className="role-tooltip" role="tooltip">
        {role.description}
      </span>
    </span>
  );
}
