"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, RefreshCw, Save, ShieldCheck, ShieldOff, Ban } from "lucide-react";
import { useParams } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { RequireAuth } from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { getSession } from "@/lib/session";
import type { UserApp } from "@/types/api";

export default function UserDetailPage() {
  const params = useParams<{ userId: string }>();
  const [user, setUser] = useState<UserApp | null>(null);
  const [email, setEmail] = useState("");
  const [dogName, setDogName] = useState("");
  const [dogAge, setDogAge] = useState("");
  const [bio, setBio] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const session = getSession();
    if (!session) return;

    const data = await api.get<{ user: UserApp }>(session.token, `/api/admin/users/${params.userId}`);
    setUser(data.user);
    setEmail(data.user.email);
    setDogName(data.user.dogName || "");
    setDogAge(data.user.dogAge === null ? "" : String(data.user.dogAge));
    setBio(data.user.bio || "");
  }

  useEffect(() => {
    void load().catch((err) => setError(err.message));
  }, [params.userId]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = getSession();
    if (!session) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.patch(session.token, `/api/admin/users/${params.userId}`, {
        email,
        dogName: dogName || null,
        dogAge: dogAge ? Number(dogAge) : null,
        bio: bio || null
      });
      setMessage("User updated.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function moderate(path: string, reasonPrompt?: string, success = "Updated.") {
    const session = getSession();
    if (!session) return;
    const reason = reasonPrompt ? window.prompt(reasonPrompt)?.trim() : "";
    if (reasonPrompt && !reason) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.patch(session.token, `/api/admin/users/${params.userId}/${path}`, reason ? { reason } : {});
      setMessage(success);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Moderation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <RequireAuth>
      <AdminShell>
        <div className="topbar">
          <div>
            <Link className="actions subtle" href="/users">
              <ArrowLeft size={16} />
              Users
            </Link>
            <h1 className="page-title">{user?.email || "User detail"}</h1>
            <p className="subtle">Edit user information and apply account moderation.</p>
          </div>
          <button className="button secondary" onClick={() => void load()} type="button">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="stack">
          {error ? <div className="error">{error}</div> : null}
          {message ? <div className="success">{message}</div> : null}
          {user ? (
            <>
              <section className="grid cols-4">
                <div className="panel stat">
                  <strong>{user._count?.courseEnrollments ?? 0}</strong>
                  <span className="subtle">Joined courses</span>
                </div>
                <div className="panel stat">
                  <strong>{user._count?.courseReports ?? 0}</strong>
                  <span className="subtle">Reports</span>
                </div>
                <div className="panel stat">
                  <strong>{user.isProfileCompleted ? "Yes" : "No"}</strong>
                  <span className="subtle">Profile complete</span>
                </div>
                <div className="panel stat">
                  <strong>{user.deletedAt ? "Deleted" : user.isBlocked ? "Blocked" : user.isFrozen ? "Frozen" : "Active"}</strong>
                  <span className="subtle">Account status</span>
                </div>
              </section>

              <section className="split">
                <section className="panel">
                  <div className="panel-header">
                    <strong>User profile</strong>
                    <div className="actions">
                      {user.isFrozen ? (
                        <button className="button" disabled={busy} onClick={() => void moderate("unfreeze", undefined, "User unfrozen.")} type="button">
                          <ShieldCheck size={15} />
                          Unfreeze
                        </button>
                      ) : (
                        <button className="button warning" disabled={busy} onClick={() => void moderate("freeze", "Freeze reason", "User frozen.")} type="button">
                          <ShieldOff size={15} />
                          Freeze
                        </button>
                      )}
                      {user.isBlocked ? (
                        <button className="button" disabled={busy} onClick={() => void moderate("unblock", undefined, "User unblocked.")} type="button">
                          <ShieldCheck size={15} />
                          Unblock
                        </button>
                      ) : (
                        <button className="button danger" disabled={busy} onClick={() => void moderate("block", "Block reason", "User blocked.")} type="button">
                          <Ban size={15} />
                          Block
                        </button>
                      )}
                    </div>
                  </div>
                  <form className="panel-body form" onSubmit={save}>
                    <div className="field">
                      <label>Email</label>
                      <input className="input" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
                    </div>
                    <div className="field">
                      <label>Dog name</label>
                      <input className="input" onChange={(event) => setDogName(event.target.value)} value={dogName} />
                    </div>
                    <div className="field">
                      <label>Dog age</label>
                      <input className="input" onChange={(event) => setDogAge(event.target.value)} type="number" value={dogAge} />
                    </div>
                    <div className="field">
                      <label>Bio</label>
                      <textarea className="textarea" onChange={(event) => setBio(event.target.value)} value={bio} />
                    </div>
                    <button className="button" disabled={busy} type="submit">
                      <Save size={16} />
                      Save user
                    </button>
                  </form>
                </section>

                <section className="panel">
                  <div className="panel-header">
                    <strong>Activity</strong>
                    <span className="badge neutral">{user.courseEnrollments?.length ?? 0}</span>
                  </div>
                  <div className="scroll-x">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Course</th>
                          <th>Progress</th>
                          <th>Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {user.courseEnrollments?.map((enrollment) => (
                          <tr key={enrollment.id}>
                            <td>
                              <Link href={`/courses/${enrollment.course.id}`}>
                                <strong>{enrollment.course.title}</strong>
                              </Link>
                            </td>
                            <td>{enrollment.progressPercent}%</td>
                            <td>{new Date(enrollment.joinedAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </section>
            </>
          ) : null}
        </div>
      </AdminShell>
    </RequireAuth>
  );
}
