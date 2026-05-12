"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Ban, RefreshCw, ShieldOff, ShieldCheck, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { PaginationControls } from "@/components/PaginationControls";
import { RequireAuth } from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { getSession } from "@/lib/session";
import type { PaginatedResponse, PaginationMeta, UserApp } from "@/types/api";

export default function UsersPage() {
  const [users, setUsers] = useState<UserApp[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  async function loadUsers(targetPage = page) {
    const session = getSession();
    if (!session) return;

    const params = new URLSearchParams({
      page: String(targetPage),
      limit: "12"
    });
    if (search.trim()) params.set("search", search.trim());
    if (status !== "ALL") params.set("status", status);

    const data = await api.get<PaginatedResponse<UserApp, "users">>(
      session.token,
      `/api/admin/users?${params.toString()}`
    );
    setUsers(data.users);
    setMeta(data.meta);
  }

  useEffect(() => {
    void loadUsers().catch((err) => setError(err.message));
  }, [page, search, status]);

  async function moderate(userId: string, path: string, reasonPrompt?: string, success = "Updated.") {
    const session = getSession();
    if (!session) return;

    const reason = reasonPrompt ? window.prompt(reasonPrompt)?.trim() : "";
    if (reasonPrompt && !reason) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.patch(session.token, `/api/admin/users/${userId}/${path}`, reason ? { reason } : {});
      setMessage(success);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteUser(userId: string, email: string) {
    const session = getSession();
    if (!session) return;
    if (!window.confirm(`Delete user ${email}?`)) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.delete(session.token, `/api/admin/users/${userId}`);
      setMessage("User deleted.");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <RequireAuth>
      <AdminShell>
        <div className="topbar">
          <div>
            <h1 className="page-title">Users</h1>
            <p className="subtle">View, edit, freeze, block, unblock, and delete app users.</p>
          </div>
          <button className="button secondary" onClick={() => void loadUsers()} type="button">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="stack">
          {error ? <div className="error">{error}</div> : null}
          {message ? <div className="success">{message}</div> : null}

          <section className="panel">
            <div className="panel-header">
              <strong>User list</strong>
              <span className="badge neutral">{meta?.total ?? users.length}</span>
            </div>
            <div className="panel-body">
              <div className="grid cols-2">
                <div className="field">
                  <label>Search</label>
                  <input
                    className="input"
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Email or dog name"
                    value={search}
                  />
                </div>
                <div className="field">
                  <label>Status</label>
                  <select
                    className="select"
                    onChange={(event) => {
                      setStatus(event.target.value);
                      setPage(1);
                    }}
                    value={status}
                  >
                    <option value="ALL">All statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="FROZEN">Frozen</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="scroll-x">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Dog profile</th>
                    <th>Course data</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <Link href={`/users/${user.id}`}>
                          <strong>{user.email}</strong>
                        </Link>
                        <div className="muted-row">{new Date(user.createdAt).toLocaleString()}</div>
                      </td>
                      <td>
                        <strong>{user.dogName || "-"}</strong>
                        <div className="muted-row">{user.breed?.title || "-"}</div>
                      </td>
                      <td className="muted-row">
                        {user._count?.courseEnrollments ?? 0} joined
                        <br />
                        {user._count?.courseReports ?? 0} reports
                      </td>
                      <td>
                        <div className="actions">
                          {user.isBlocked ? <span className="badge deleted">Blocked</span> : null}
                          {user.isFrozen ? <span className="badge offline">Frozen</span> : null}
                          {!user.isBlocked && !user.isFrozen ? (
                            <span className="badge">{user.isProfileCompleted ? "Active" : "Onboarding"}</span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <div className="actions">
                          {user.isFrozen ? (
                            <button className="button" disabled={busy} onClick={() => void moderate(user.id, "unfreeze", undefined, "User unfrozen.")} type="button">
                              <ShieldCheck size={15} />
                            </button>
                          ) : (
                            <button className="button warning" disabled={busy} onClick={() => void moderate(user.id, "freeze", "Freeze reason", "User frozen.")} type="button">
                              <ShieldOff size={15} />
                            </button>
                          )}
                          {user.isBlocked ? (
                            <button className="button" disabled={busy} onClick={() => void moderate(user.id, "unblock", undefined, "User unblocked.")} type="button">
                              <ShieldCheck size={15} />
                            </button>
                          ) : (
                            <button className="button danger" disabled={busy} onClick={() => void moderate(user.id, "block", "Block reason", "User blocked.")} type="button">
                              <Ban size={15} />
                            </button>
                          )}
                          <button className="button danger" disabled={busy} onClick={() => void deleteUser(user.id, user.email)} type="button">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="panel-body">
              <PaginationControls meta={meta} onPageChange={setPage} />
            </div>
          </section>
        </div>
      </AdminShell>
    </RequireAuth>
  );
}
