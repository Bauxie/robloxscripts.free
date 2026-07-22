"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ROLE_DEFS,
  ROLE_IDS,
  canAssignRole,
  type RoleId,
} from "@/lib/roles";
import RoleBadges from "@/components/RoleBadges";
import { useToast } from "@/components/ToastProvider";

type AdminUser = {
  id: string;
  username: string;
  avatar_url: string | null;
  roles: RoleId[];
  scriptCount: number;
  created_at: string;
};

export default function AdminPanel({
  actorRoles,
}: {
  actorRoles: RoleId[];
}) {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load(query: string) {
    setError("");
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load users");
      setUsers(data.users);
    } catch (e) {
      setError((e as Error).message);
      setUsers([]);
    }
  }

  useEffect(() => {
    load("");
  }, []);

  const debounced = useMemo(() => {
    let t: ReturnType<typeof setTimeout>;
    return (value: string) => {
      clearTimeout(t);
      t = setTimeout(() => load(value), 220);
    };
  }, []);

  async function toggleRole(user: AdminUser, role: RoleId, on: boolean) {
    if (!canAssignRole(actorRoles, role)) {
      toast("You can’t change that role", true);
      return;
    }
    if (role === "verified" && on && user.scriptCount < 1) {
      toast("Verified requires at least one uploaded script", true);
      return;
    }

    const next = on
      ? normalizeUnique([...user.roles, role])
      : user.roles.filter((r) => r !== role);

    setBusyId(user.id);
    setUsers((list) =>
      (list || []).map((u) => (u.id === user.id ? { ...u, roles: next } : u))
    );

    try {
      const res = await fetch(`/api/admin/users/${user.id}/roles`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setUsers((list) =>
        (list || []).map((u) =>
          u.id === user.id ? { ...u, roles: data.user.roles } : u
        )
      );
      toast(`Updated @${user.username}`);
    } catch (e) {
      toast((e as Error).message, true);
      load(q);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="app">
      <Link href="/" className="back-link">
        ← Home
      </Link>

      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="section-head" style={{ marginTop: 0 }}>
          <div>
            <span className="eyebrow">Staff tools</span>
            <h2>Admin panel</h2>
            <p>Assign Owner, Admin, Moderator, Content Creator, and Verified badges.</p>
          </div>
        </div>

        <div className="admin-search">
          <input
            type="search"
            placeholder="Search usernames…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              debounced(e.target.value);
            }}
          />
        </div>

        {error ? <p className="form-error">{error}</p> : null}
      </div>

      <div className="admin-user-list">
        {users === null ? (
          <div className="loading">
            <div className="spinner" />
            Loading users…
          </div>
        ) : users.length === 0 ? (
          <div className="empty">
            <div className="big">🏝️</div>
            <h3>No users found</h3>
          </div>
        ) : (
          users.map((user) => (
            <div className="admin-user-card panel" key={user.id}>
              <div className="admin-user-head">
                <div className="admin-user-identity">
                  <span className="nav-avatar">
                    {user.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.avatar_url} alt="" width={28} height={28} />
                    ) : (
                      <span aria-hidden>{(user.username[0] || "?").toUpperCase()}</span>
                    )}
                  </span>
                  <div>
                    <div className="admin-user-name">
                      <strong>@{user.username}</strong>
                      <RoleBadges roles={user.roles} size="sm" />
                    </div>
                    <div className="hint" style={{ marginTop: 2 }}>
                      {user.scriptCount} script{user.scriptCount === 1 ? "" : "s"} uploaded
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-role-grid">
                {ROLE_IDS.map((role) => {
                  const def = ROLE_DEFS[role];
                  const checked = user.roles.includes(role);
                  const locked = !canAssignRole(actorRoles, role);
                  const verifiedBlocked =
                    role === "verified" && !checked && user.scriptCount < 1;
                  return (
                    <label
                      key={role}
                      className={`admin-role-toggle${checked ? " is-on" : ""}${
                        locked || verifiedBlocked ? " is-disabled" : ""
                      }`}
                      title={
                        verifiedBlocked
                          ? "User must upload a script first"
                          : locked
                            ? "Only an Owner can manage this role"
                            : def.description
                      }
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={busyId === user.id || locked || verifiedBlocked}
                        onChange={(e) => toggleRole(user, role, e.target.checked)}
                      />
                      <span
                        className="role-badge role-badge-static"
                        style={{ background: def.bg, color: def.color }}
                      >
                        <span aria-hidden>{def.icon}</span>
                      </span>
                      <span>
                        <b>{def.label}</b>
                        <small>{def.description}</small>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

function normalizeUnique(roles: RoleId[]): RoleId[] {
  return Array.from(new Set(roles));
}
