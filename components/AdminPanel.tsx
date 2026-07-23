"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ROLE_DEFS,
  ROLE_IDS,
  canAssignRole,
  canManageRoles,
  type RoleId,
} from "@/lib/roles";
import RoleBadges from "@/components/RoleBadges";
import RoleIcon from "@/components/RoleIcon";
import { useToast } from "@/components/ToastProvider";
import { timeAgo } from "@/lib/format";

type AdminUser = {
  id: string;
  username: string;
  avatar_url: string | null;
  roles: RoleId[];
  scriptCount: number;
  created_at: string;
};

type Report = {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  target_label?: string;
  target_href?: string | null;
  reason: string;
  details: string;
  staff_notes?: string;
  status: string;
  created_at: string;
};

type Tab = "reports" | "roles";

export default function AdminPanel({
  actorRoles,
}: {
  actorRoles: RoleId[];
}) {
  const toast = useToast();
  const canRoles = canManageRoles(actorRoles);
  const [tab, setTab] = useState<Tab>("reports");

  const [q, setQ] = useState("");
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [usersError, setUsersError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [reports, setReports] = useState<Report[] | null>(null);
  const [reportStatus, setReportStatus] = useState("open");
  const [reportsError, setReportsError] = useState("");
  const [busyReport, setBusyReport] = useState<string | null>(null);

  async function loadUsers(query: string) {
    setUsersError("");
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load users");
      setUsers(data.users);
    } catch (e) {
      setUsersError((e as Error).message);
      setUsers([]);
    }
  }

  async function loadReports(status: string) {
    setReportsError("");
    try {
      const res = await fetch(`/api/reports?status=${encodeURIComponent(status)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load reports");
      setReports(data.reports);
    } catch (e) {
      setReportsError((e as Error).message);
      setReports([]);
    }
  }

  useEffect(() => {
    loadReports(reportStatus);
  }, [reportStatus]);

  useEffect(() => {
    if (tab === "roles" && canRoles) loadUsers("");
  }, [tab, canRoles]);

  const debounced = useMemo(() => {
    let t: ReturnType<typeof setTimeout>;
    return (value: string) => {
      clearTimeout(t);
      t = setTimeout(() => loadUsers(value), 220);
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
      loadUsers(q);
    } finally {
      setBusyId(null);
    }
  }

  async function resolveReport(id: string, status: "resolved" | "dismissed") {
    setBusyReport(id);
    try {
      const res = await fetch("/api/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setReports((list) => (list || []).filter((r) => r.id !== id));
      toast(`Report ${status}`);
    } catch (e) {
      toast((e as Error).message, true);
    } finally {
      setBusyReport(null);
    }
  }

  async function removeReportedScript(r: Report) {
    if (r.target_type !== "script") return;
    if (!confirm("Delete this script and resolve the report?")) return;
    setBusyReport(r.id);
    try {
      const del = await fetch(`/api/scripts/${r.target_id}`, { method: "DELETE" });
      const delData = await del.json();
      if (!del.ok) throw new Error(delData.error || "Delete failed");
      await fetch("/api/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id, status: "resolved" }),
      });
      setReports((list) => (list || []).filter((x) => x.id !== r.id));
      toast("Script removed");
    } catch (e) {
      toast((e as Error).message, true);
    } finally {
      setBusyReport(null);
    }
  }

  function targetHref(r: Report) {
    return r.target_href || null;
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
            <p>Mod queue for reports{canRoles ? ", plus role badges" : ""}.</p>
          </div>
        </div>

        <div className="admin-tabs">
          <button
            type="button"
            className={`btn btn-sm${tab === "reports" ? " btn-primary" : " btn-ghost"}`}
            onClick={() => setTab("reports")}
          >
            Reports
          </button>
          {canRoles ? (
            <button
              type="button"
              className={`btn btn-sm${tab === "roles" ? " btn-primary" : " btn-ghost"}`}
              onClick={() => setTab("roles")}
            >
              Roles
            </button>
          ) : null}
        </div>
      </div>

      {tab === "reports" ? (
        <>
          <div className="toolbar" style={{ marginBottom: 16 }}>
            <select
              className="select"
              value={reportStatus}
              onChange={(e) => setReportStatus(e.target.value)}
            >
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>

          {reportsError ? <p className="form-error">{reportsError}</p> : null}

          {reports === null ? (
            <div className="loading">
              <div className="spinner" />
              Loading reports…
            </div>
          ) : reports.length === 0 ? (
            <div className="empty">
              <div className="big">🏝️</div>
              <h3>No {reportStatus} reports</h3>
            </div>
          ) : (
            <div className="mod-queue">
              {reports.map((r) => {
                const href = targetHref(r);
                return (
                  <div className="panel mod-report" key={r.id}>
                    <div className="mod-report-head">
                      <div>
                        <strong>
                          {r.target_type}: {r.target_label || r.target_id}
                        </strong>
                        <div className="hint">
                          {r.reason} · {timeAgo(r.created_at)}
                        </div>
                      </div>
                      <div className="detail-cta">
                        {href ? (
                          <Link href={href} className="btn btn-ghost btn-sm">
                            Open
                          </Link>
                        ) : null}
                        {r.status === "open" ? (
                          <>
                            {r.target_type === "script" ? (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                disabled={busyReport === r.id}
                                onClick={() => removeReportedScript(r)}
                              >
                                Delete script
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              disabled={busyReport === r.id}
                              onClick={() => resolveReport(r.id, "resolved")}
                            >
                              Resolve
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              disabled={busyReport === r.id}
                              onClick={() => resolveReport(r.id, "dismissed")}
                            >
                              Dismiss
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                    {r.details ? <p className="mod-report-details">{r.details}</p> : null}
                    <div className="mod-staff-notes">
                      <label className="hint">Staff notes</label>
                      <textarea
                        defaultValue={r.staff_notes || ""}
                        rows={2}
                        placeholder="Internal notes…"
                        onBlur={async (e) => {
                          const staffNotes = e.target.value;
                          await fetch("/api/reports", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: r.id, staffNotes }),
                          });
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
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

          {usersError ? <p className="form-error">{usersError}</p> : null}

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
                          <Link href={`/u/${encodeURIComponent(user.username)}`}>
                            <strong>@{user.username}</strong>
                          </Link>
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
                            <RoleIcon role={role} />
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
        </>
      )}
    </main>
  );
}

function normalizeUnique(roles: RoleId[]): RoleId[] {
  return Array.from(new Set(roles));
}
