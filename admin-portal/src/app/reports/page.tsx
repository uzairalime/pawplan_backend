"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, CircleOff, RefreshCw } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { PaginationControls } from "@/components/PaginationControls";
import { RequireAuth } from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { getSession } from "@/lib/session";
import type { CourseReport, PaginatedResponse, PaginationMeta } from "@/types/api";

export default function ReportsPage() {
  const [reports, setReports] = useState<CourseReport[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  async function load(targetPage = page) {
    const session = getSession();
    if (!session) return;

    const params = new URLSearchParams({
      page: String(targetPage),
      limit: "12"
    });
    if (search.trim()) params.set("search", search.trim());
    if (status !== "ALL") params.set("status", status);

    const data = await api.get<PaginatedResponse<CourseReport, "reports">>(
      session.token,
      `/api/admin/course-reports?${params.toString()}`
    );
    setReports(data.reports);
    setMeta(data.meta);
  }

  useEffect(() => {
    void load().catch((err) => setError(err.message));
  }, [page, search, status]);

  async function resolveReport(reportId: string) {
    const session = getSession();
    if (!session) return;
    const reviewNote = window.prompt("Resolution note")?.trim();
    const freezeCourse = window.confirm("Freeze this course too?");
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.patch(session.token, `/api/admin/course-reports/${reportId}/resolve`, {
        reviewNote: reviewNote || undefined,
        freezeCourse
      });
      setMessage("Report resolved.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Resolve failed");
    } finally {
      setBusy(false);
    }
  }

  async function dismissReport(reportId: string) {
    const session = getSession();
    if (!session) return;
    const reviewNote = window.prompt("Dismiss note")?.trim();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.patch(session.token, `/api/admin/course-reports/${reportId}/dismiss`, {
        reviewNote: reviewNote || undefined
      });
      setMessage("Report dismissed.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dismiss failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <RequireAuth>
      <AdminShell>
        <div className="topbar">
          <div>
            <h1 className="page-title">Reports</h1>
            <p className="subtle">Review user-reported courses and moderate unsafe or low-quality content.</p>
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
              <strong>Course reports</strong>
              <span className="badge neutral">{meta?.total ?? reports.length}</span>
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
                    placeholder="Course, user, details"
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
                    <option value="OPEN">Open</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="DISMISSED">Dismissed</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="scroll-x">
              <table className="table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Reason</th>
                    <th>Reported by</th>
                    <th>Status</th>
                    <th>Trainer</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td>
                        <Link href={`/courses/${report.course.id}`}>
                          <strong>{report.course.title}</strong>
                        </Link>
                        <div className="muted-row">{report.details || "-"}</div>
                      </td>
                      <td>{report.reason.replaceAll("_", " ")}</td>
                      <td>
                        <strong>{report.user.dogName || report.user.email}</strong>
                        <div className="muted-row">{report.user.email}</div>
                      </td>
                      <td>
                        <span
                          className={
                            report.status === "OPEN"
                              ? "badge offline"
                              : report.status === "RESOLVED"
                                ? "badge"
                                : "badge deleted"
                          }
                        >
                          {report.status}
                        </span>
                        {report.reviewNote ? (
                          <div className="muted-row">{report.reviewNote}</div>
                        ) : null}
                      </td>
                      <td>
                        <strong>{report.course.trainer?.name || report.course.trainer?.email || "Unassigned"}</strong>
                        <div className="muted-row">
                          {report.course.isFrozen ? `Frozen: ${report.course.freezeReason || "Yes"}` : "Active"}
                        </div>
                      </td>
                      <td>
                        {report.status === "OPEN" ? (
                          <div className="actions">
                            <button className="button" disabled={busy} onClick={() => void resolveReport(report.id)} type="button">
                              <CheckCircle2 size={15} />
                            </button>
                            <button className="button danger" disabled={busy} onClick={() => void dismissReport(report.id)} type="button">
                              <CircleOff size={15} />
                            </button>
                          </div>
                        ) : (
                          <span className="muted-row">Reviewed</span>
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
        </div>
      </AdminShell>
    </RequireAuth>
  );
}
