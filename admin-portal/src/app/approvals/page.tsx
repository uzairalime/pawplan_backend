"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, CircleOff, RefreshCw } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { PaginationControls } from "@/components/PaginationControls";
import { RequireAuth } from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { getSession } from "@/lib/session";
import type { Course, PaginatedResponse, PaginationMeta } from "@/types/api";

export default function ApprovalsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  async function load(targetPage = page) {
    const session = getSession();
    if (!session) return;

    const params = new URLSearchParams({
      page: String(targetPage),
      limit: "12"
    });
    if (search.trim()) params.set("search", search.trim());

    const data = await api.get<PaginatedResponse<Course, "courses">>(
      session.token,
      `/api/admin/courses-pending-approval?${params.toString()}`
    );
    setCourses(data.courses);
    setMeta(data.meta);
  }

  useEffect(() => {
    void load().catch((err) => setError(err.message));
  }, [page, search]);

  async function approve(courseId: string) {
    const session = getSession();
    if (!session) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.patch(session.token, `/api/admin/courses/${courseId}/approve`, {});
      setMessage("Course approved.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setBusy(false);
    }
  }

  async function reject(courseId: string) {
    const session = getSession();
    if (!session) return;
    const reason = window.prompt("Reject reason");
    if (!reason) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.patch(session.token, `/api/admin/courses/${courseId}/reject`, { reason });
      setMessage("Course rejected.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reject failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <RequireAuth>
      <AdminShell>
        <div className="topbar">
          <div>
            <h1 className="page-title">Pending Approvals</h1>
            <p className="subtle">Courses waiting for super admin review.</p>
          </div>
          <button className="button secondary" onClick={() => void load()} type="button">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
        <div className="stack">
          {error ? <div className="error">{error}</div> : null}
          {message ? <div className="success">{message}</div> : null}
          <section className="panel">
            <div className="panel-header">
              <strong>Waiting review</strong>
              <span className="badge neutral">{meta?.total ?? courses.length}</span>
            </div>
            <div className="panel-body">
              <div className="field">
                <label>Search</label>
                <input
                  className="input"
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Course title"
                  value={search}
                />
              </div>
            </div>
            <div className="scroll-x">
              <table className="table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Trainer</th>
                    <th>Content</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id}>
                      <td>
                        <Link href={`/courses/${course.id}`}>
                          <strong>{course.title}</strong>
                        </Link>
                        <div className="muted-row">{course.category || "No category"}</div>
                      </td>
                      <td>
                        <strong>{course.trainer?.name || "-"}</strong>
                        <div className="muted-row">{course.trainer?.email || "-"}</div>
                      </td>
                      <td className="muted-row">
                        {course._count?.lectures ?? 0} lectures
                        <br />
                        {course._count?.dailyTasks ?? 0} tasks
                      </td>
                      <td>
                        <div className="actions">
                          <button className="button" disabled={busy} onClick={() => void approve(course.id)} type="button">
                            <CheckCircle2 size={15} />
                          </button>
                          <button
                            className="button danger"
                            disabled={busy}
                            onClick={() => void reject(course.id)}
                            type="button"
                          >
                            <CircleOff size={15} />
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
