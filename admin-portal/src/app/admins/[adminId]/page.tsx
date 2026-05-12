"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, RefreshCw, Save, ShieldCheck, ShieldOff } from "lucide-react";
import { useParams } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { RequireAuth } from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { getSession } from "@/lib/session";
import type { TrainerDetail } from "@/types/api";

export default function TrainerDetailPage() {
  const params = useParams<{ adminId: string }>();
  const [detail, setDetail] = useState<TrainerDetail | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [bio, setBio] = useState("");
  const [expertise, setExpertise] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [courseFilter, setCourseFilter] = useState<"ALL" | "OPEN_REPORTS" | "FROZEN">("ALL");

  async function load() {
    const session = getSession();
    if (!session) return;

    const data = await api.get<TrainerDetail>(session.token, `/api/admin/trainers/${params.adminId}`);
    setDetail(data);
    setEmail(data.trainer.email);
    setName(data.trainer.name || "");
    setProfilePicture(data.trainer.profilePicture || "");
    setBio(data.trainer.bio || "");
    setExpertise(data.trainer.expertise || "");
    setExperienceYears(
      data.trainer.experienceYears === null ? "" : String(data.trainer.experienceYears)
    );
  }

  useEffect(() => {
    void load().catch((err) => setError(err.message));
  }, [params.adminId]);

  const filteredCourses = useMemo(() => {
    if (!detail) return [];

    if (courseFilter === "OPEN_REPORTS") {
      return detail.trainer.courses.filter((course) => (course.openReportCount ?? 0) > 0);
    }

    if (courseFilter === "FROZEN") {
      return detail.trainer.courses.filter((course) => course.isFrozen);
    }

    return detail.trainer.courses;
  }, [courseFilter, detail]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = getSession();
    if (!session) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.patch(session.token, `/api/admin/trainers/${params.adminId}/profile`, {
        name: name || null,
        profilePicture: profilePicture || null,
        bio: bio || null,
        expertise: expertise || null,
        experienceYears: experienceYears ? Number(experienceYears) : null
      });
      await api.patch(session.token, `/api/admin/trainers/${params.adminId}/credentials`, {
        email,
        password: password || undefined
      });
      setPassword("");
      setMessage("Trainer updated.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(active: boolean) {
    const session = getSession();
    if (!session || !detail) return;
    const reason =
      !active ? window.prompt("Freeze reason for trainer")?.trim() : "";
    if (!active && !reason) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.patch(
        session.token,
        `/api/admin/trainers/${params.adminId}/${active ? "activate" : "deactivate"}`,
        active ? {} : { reason }
      );
      setMessage(active ? "Trainer activated." : "Trainer frozen. Public courses hidden.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed");
    } finally {
      setBusy(false);
    }
  }

  async function setCourseFrozen(courseId: string, nextFrozen: boolean) {
    const session = getSession();
    if (!session) return;
    const reason = nextFrozen ? window.prompt("Freeze reason for course")?.trim() : "";
    if (nextFrozen && !reason) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.patch(
        session.token,
        `/api/admin/courses/${courseId}/${nextFrozen ? "freeze" : "unfreeze"}`,
        nextFrozen ? { reason } : {}
      );
      setMessage(nextFrozen ? "Course frozen." : "Course unfrozen.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Course update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <RequireAuth>
      <AdminShell>
        <div className="topbar">
          <div>
            <Link className="actions subtle" href="/admins">
              <ArrowLeft size={16} />
              Trainers
            </Link>
            <h1 className="page-title">{detail?.trainer.name || "Trainer detail"}</h1>
            <p className="subtle">Manage trainer profile, credentials, and courses.</p>
          </div>
          <button className="button secondary" onClick={() => void load()} type="button">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
        <div className="stack">
          {error ? <div className="error">{error}</div> : null}
          {message ? <div className="success">{message}</div> : null}
          {detail ? (
            <>
              <section className="grid cols-4">
                <div className="panel stat">
                  <strong>{detail.stats.courseCount}</strong>
                  <span className="subtle">Courses</span>
                </div>
                <div className="panel stat">
                  <strong>{detail.stats.totalEnrollments}</strong>
                  <span className="subtle">Joined</span>
                </div>
                <div className="panel stat">
                  <strong>{detail.stats.totalCompletions}</strong>
                  <span className="subtle">Completed</span>
                </div>
                <div className="panel stat">
                  <strong>{detail.stats.totalViews}</strong>
                  <span className="subtle">Views</span>
                </div>
              </section>
              <section className="grid cols-3">
                <div className="panel stat">
                  <strong>{detail.stats.frozenCourseCount}</strong>
                  <span className="subtle">Frozen courses</span>
                </div>
                <div className="panel stat">
                  <strong>{detail.stats.totalReports}</strong>
                  <span className="subtle">Reports</span>
                </div>
                <div className="panel stat">
                  <strong>{detail.stats.openReportCount}</strong>
                  <span className="subtle">Open reports</span>
                </div>
              </section>

              <section className="split">
                <section className="panel">
                  <div className="panel-header">
                    <strong>Trainer profile</strong>
                    <div className="actions">
                      {detail.trainer.isActive ? (
                        <button className="button warning" disabled={busy} onClick={() => void changeStatus(false)} type="button">
                          <ShieldOff size={15} />
                          Freeze
                        </button>
                      ) : (
                        <button className="button" disabled={busy} onClick={() => void changeStatus(true)} type="button">
                          <ShieldCheck size={15} />
                          Activate
                        </button>
                      )}
                    </div>
                  </div>
                  {detail.trainer.isFrozen && detail.trainer.freezeReason ? (
                    <div className="error" style={{ margin: 16 }}>{detail.trainer.freezeReason}</div>
                  ) : null}
                  <form className="panel-body form" onSubmit={saveProfile}>
                    <div className="field">
                      <label>Name</label>
                      <input className="input" onChange={(event) => setName(event.target.value)} value={name} />
                    </div>
                    <div className="field">
                      <label>Email</label>
                      <input className="input" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
                    </div>
                    <div className="field">
                      <label>New password</label>
                      <input
                        className="input"
                        minLength={8}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Leave blank to keep current"
                        type="password"
                        value={password}
                      />
                    </div>
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
                      <input className="input" onChange={(event) => setExpertise(event.target.value)} value={expertise} />
                    </div>
                    <div className="field">
                      <label>Experience years</label>
                      <input
                        className="input"
                        onChange={(event) => setExperienceYears(event.target.value)}
                        type="number"
                        value={experienceYears}
                      />
                    </div>
                    <div className="field">
                      <label>Bio</label>
                      <textarea className="textarea" onChange={(event) => setBio(event.target.value)} value={bio} />
                    </div>
                    <button className="button" disabled={busy} type="submit">
                      <Save size={16} />
                      Save trainer
                    </button>
                  </form>
                </section>

                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <strong>Trainer courses</strong>
                      <div className="actions" style={{ marginTop: 10 }}>
                        <button
                          className={courseFilter === "ALL" ? "button" : "button secondary"}
                          onClick={() => setCourseFilter("ALL")}
                          type="button"
                        >
                          All
                          <span className="badge neutral">{detail.stats.courseCount}</span>
                        </button>
                        <button
                          className={courseFilter === "OPEN_REPORTS" ? "button warning" : "button secondary"}
                          onClick={() => setCourseFilter("OPEN_REPORTS")}
                          type="button"
                        >
                          Open reports
                          <span className="badge neutral">{detail.stats.openReportCount}</span>
                        </button>
                        <button
                          className={courseFilter === "FROZEN" ? "button warning" : "button secondary"}
                          onClick={() => setCourseFilter("FROZEN")}
                          type="button"
                        >
                          Frozen
                          <span className="badge neutral">{detail.stats.frozenCourseCount}</span>
                        </button>
                      </div>
                    </div>
                    <span className="badge neutral">{filteredCourses.length}</span>
                  </div>
                  <div className="scroll-x">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Course</th>
                          <th>Status</th>
                          <th>Review</th>
                          <th>Joined</th>
                          <th>Reports</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCourses.map((course) => (
                          <tr key={course.id}>
                            <td>
                              <Link href={`/courses/${course.id}`}>
                                <strong>{course.title}</strong>
                              </Link>
                              <div className="muted-row">{course.category || "No category"}</div>
                            </td>
                            <td>
                              {course.isFrozen ? "Frozen" : course.isPublished ? "Online" : "Offline"}
                            </td>
                            <td>{course.approvalStatus}</td>
                            <td>{course._count?.enrollments ?? 0}</td>
                            <td>
                              {course._count?.reports ?? 0}
                              <div className="muted-row">
                                Open: {course.openReportCount ?? 0}
                              </div>
                            </td>
                            <td>
                              {course.isFrozen ? (
                                <button className="button" disabled={busy} onClick={() => void setCourseFrozen(course.id, false)} type="button">
                                  <ShieldCheck size={15} />
                                </button>
                              ) : (
                                <button className="button warning" disabled={busy} onClick={() => void setCourseFrozen(course.id, true)} type="button">
                                  <ShieldOff size={15} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {filteredCourses.length === 0 ? (
                          <tr>
                            <td className="muted-row" colSpan={6}>
                              No courses match this moderation filter yet.
                            </td>
                          </tr>
                        ) : null}
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
