"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Plus, RefreshCw, ShieldCheck, ShieldOff } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { PaginationControls } from "@/components/PaginationControls";
import { RequireAuth } from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { getSession } from "@/lib/session";
import type { AdminUser, PaginatedResponse, PaginationMeta } from "@/types/api";

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminUser["role"]>("ADMIN");
  const [name, setName] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [bio, setBio] = useState("");
  const [expertise, setExpertise] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const session = getSession();

  async function loadAdmins(targetPage = page) {
    const currentSession = getSession();
    if (!currentSession) return;

    const params = new URLSearchParams({
      page: String(targetPage),
      limit: "10"
    });
    if (search.trim()) params.set("search", search.trim());
    if (status !== "ALL") params.set("status", status);

    const data = await api.get<PaginatedResponse<AdminUser, "admins">>(
      currentSession.token,
      `/api/admin/trainers?${params.toString()}`
    );
    setAdmins(data.admins);
    setMeta(data.meta);
  }

  useEffect(() => {
    if (session?.admin.role !== "SUPER_ADMIN") {
      setError("Super admin access required");
      return;
    }

    void loadAdmins().catch((err) => setError(err.message));
  }, [session?.admin.role, page, search, status]);

  async function createAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentSession = getSession();
    if (!currentSession) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await api.post(currentSession.token, "/api/admin/trainers", {
        email,
        password,
        role,
        name: name || undefined,
        profilePicture: profilePicture || undefined,
        bio: bio || undefined,
        expertise: expertise || undefined,
        experienceYears: experienceYears ? Number(experienceYears) : undefined
      });
      setEmail("");
      setPassword("");
      setRole("ADMIN");
      setName("");
      setProfilePicture("");
      setBio("");
      setExpertise("");
      setExperienceYears("");
      setMessage("Trainer created.");
      await loadAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Admin create failed");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(admin: AdminUser, active: boolean) {
    const currentSession = getSession();
    if (!currentSession) return;

    const label = active ? "activate" : "deactivate";
    if (!window.confirm(`Are you sure you want to ${label} ${admin.email}?`)) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await api.patch(
        currentSession.token,
        `/api/admin/trainers/${admin.id}/${active ? "activate" : "deactivate"}`,
        {}
      );
      setMessage(active ? "Trainer activated." : "Trainer deactivated.");
      await loadAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Admin update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <RequireAuth>
      <AdminShell>
        <div className="topbar">
          <div>
            <h1 className="page-title">Trainers</h1>
            <p className="subtle">Create trainer profiles and manage instructor access.</p>
          </div>
          <button className="button secondary" onClick={() => void loadAdmins()} type="button">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="stack">
          {error ? <div className="error">{error}</div> : null}
          {message ? <div className="success">{message}</div> : null}

          {session?.admin.role === "SUPER_ADMIN" ? (
            <>
              <section className="panel">
                <div className="panel-header">
                  <strong>Create trainer</strong>
                  <Plus size={18} />
                </div>
                <form className="panel-body form" onSubmit={createAdmin}>
                  <div className="grid cols-3">
                    <div className="field">
                      <label>Name</label>
                      <input
                        className="input"
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Trainer name"
                        value={name}
                      />
                    </div>
                    <div className="field">
                      <label>Email</label>
                      <input
                        className="input"
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        type="email"
                        value={email}
                      />
                    </div>
                    <div className="field">
                      <label>Password</label>
                      <input
                        className="input"
                        minLength={8}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        type="password"
                        value={password}
                      />
                    </div>
                    <div className="field">
                      <label>Role</label>
                      <select className="select" onChange={() => setRole("ADMIN")} value={role}>
                        <option value="ADMIN">Trainer</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid cols-3">
                    <div className="field">
                      <label>Profile image URL</label>
                      <input
                        className="input"
                        onChange={(event) => setProfilePicture(event.target.value)}
                        value={profilePicture}
                      />
                    </div>
                    <div className="field">
                      <label>Expertise</label>
                      <input
                        className="input"
                        onChange={(event) => setExpertise(event.target.value)}
                        placeholder="Puppy training, leash manners"
                        value={expertise}
                      />
                    </div>
                    <div className="field">
                      <label>Years</label>
                      <input
                        className="input"
                        min="0"
                        onChange={(event) => setExperienceYears(event.target.value)}
                        type="number"
                        value={experienceYears}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label>Bio</label>
                    <textarea
                      className="textarea"
                      onChange={(event) => setBio(event.target.value)}
                      value={bio}
                    />
                  </div>
                  {profilePicture ? (
                    <img alt="" className="thumbnail" src={profilePicture} style={{ width: 120 }} />
                  ) : null}
                  <button className="button" disabled={busy} type="submit">
                    <Plus size={16} />
                    Create trainer
                  </button>
                </form>
              </section>

              <section className="panel">
                <div className="panel-header">
                  <strong>Trainers</strong>
                  <span className="badge neutral">{meta?.total ?? admins.length}</span>
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
                        placeholder="Name, email, expertise"
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
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="scroll-x">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Trainer profile</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Last login</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((admin) => (
                        <tr key={admin.id}>
                          <td>
                            <Link href={`/admins/${admin.id}`}>
                              <strong>{admin.email}</strong>
                            </Link>
                          </td>
                          <td>
                            <div className="actions" style={{ flexWrap: "nowrap" }}>
                              {admin.profilePicture ? (
                                <img alt="" className="thumbnail" src={admin.profilePicture} />
                              ) : (
                                <div className="avatar">
                                  {(admin.name || admin.email).slice(0, 1).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <strong>{admin.name || "-"}</strong>
                                <div className="muted-row">{admin.expertise || "-"}</div>
                                <div className="muted-row">
                                  {admin.experienceYears ?? 0} years experience
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>{admin.role}</td>
                          <td>
                            <span className={admin.isFrozen ? "badge deleted" : admin.isActive ? "badge" : "badge offline"}>
                              {admin.isFrozen ? "Frozen" : admin.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="muted-row">
                            {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : "-"}
                          </td>
                          <td>
                            {admin.isActive ? (
                              <button
                                className="button warning"
                                disabled={busy || admin.id === session.admin.id}
                                onClick={() => void changeStatus(admin, false)}
                                type="button"
                              >
                                <ShieldOff size={15} />
                              </button>
                            ) : (
                              <button
                                className="button"
                                disabled={busy}
                                onClick={() => void changeStatus(admin, true)}
                                type="button"
                              >
                                <ShieldCheck size={15} />
                              </button>
                            )}
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
            </>
          ) : null}
        </div>
      </AdminShell>
    </RequireAuth>
  );
}
