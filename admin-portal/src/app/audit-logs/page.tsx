"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { PaginationControls } from "@/components/PaginationControls";
import { RequireAuth } from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { getSession } from "@/lib/session";
import type { AuditLog, PaginatedResponse, PaginationMeta } from "@/types/api";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [targetType, setTargetType] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  async function load(targetPage = page) {
    const session = getSession();
    if (!session) return;

    const params = new URLSearchParams({
      page: String(targetPage),
      limit: "20"
    });
    if (search.trim()) params.set("search", search.trim());
    if (action.trim()) params.set("action", action.trim());
    if (targetType.trim()) params.set("targetType", targetType.trim());

    const data = await api.get<PaginatedResponse<AuditLog, "logs">>(
      session.token,
      `/api/admin/audit-logs?${params.toString()}`
    );
    setLogs(data.logs);
    setMeta(data.meta);
  }

  useEffect(() => {
    void load().catch((err) => setError(err.message));
  }, [page, search, action, targetType]);

  return (
    <RequireAuth>
      <AdminShell>
        <div className="topbar">
          <div>
            <h1 className="page-title">Audit Logs</h1>
            <p className="subtle">Track trainer, user, course, quote, and moderation actions.</p>
          </div>
          <button className="button secondary" onClick={() => void load()} type="button">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="stack">
          {error ? <div className="error">{error}</div> : null}

          <section className="panel">
            <div className="panel-header">
              <strong>Activity</strong>
              <span className="badge neutral">{meta?.total ?? logs.length}</span>
            </div>
            <div className="panel-body">
              <div className="grid cols-3">
                <div className="field">
                  <label>Search</label>
                  <input
                    className="input"
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Actor, action, target"
                    value={search}
                  />
                </div>
                <div className="field">
                  <label>Action</label>
                  <input
                    className="input"
                    onChange={(event) => {
                      setAction(event.target.value);
                      setPage(1);
                    }}
                    placeholder="COURSE_APPROVE"
                    value={action}
                  />
                </div>
                <div className="field">
                  <label>Target type</label>
                  <input
                    className="input"
                    onChange={(event) => {
                      setTargetType(event.target.value);
                      setPage(1);
                    }}
                    placeholder="COURSE, USER, TRAINER"
                    value={targetType}
                  />
                </div>
              </div>
            </div>
            <div className="scroll-x">
              <table className="table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Target</th>
                    <th>Metadata</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="muted-row">{new Date(log.createdAt).toLocaleString()}</td>
                      <td>
                        <strong>{log.actorEmail || log.actorType}</strong>
                        <div className="muted-row">{log.actorId || "-"}</div>
                      </td>
                      <td>
                        <span className="badge neutral">{log.action}</span>
                      </td>
                      <td>
                        <strong>{log.targetType}</strong>
                        <div className="muted-row">{log.targetId || "-"}</div>
                      </td>
                      <td className="muted-row" style={{ maxWidth: 360 }}>
                        {log.metadata || "-"}
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
