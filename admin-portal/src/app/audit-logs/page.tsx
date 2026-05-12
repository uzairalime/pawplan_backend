"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { PaginationControls } from "@/components/PaginationControls";
import { RequireAuth } from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { getSession } from "@/lib/session";
import type { AuditLog, PaginatedResponse, PaginationMeta } from "@/types/api";

type AuditMetadata = Record<string, unknown>;

function parseMetadata(metadata: string | null): AuditMetadata | null {
  if (!metadata) return null;

  try {
    const parsed = JSON.parse(metadata) as AuditMetadata;
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

function prettifyToken(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getActionTone(action: string) {
  if (/(FREEZE|BLOCK|REJECT|DELETE|DISMISS)/.test(action)) return "deleted";
  if (/(CREATE|APPROVE|ACTIVATE|RESOLVE|UNFREEZE|UNBLOCK)/.test(action)) return "";
  if (/(UPDATE|SUBMIT|REFRESH|EXPORT)/.test(action)) return "offline";
  return "neutral";
}

function getActionGroup(action: string) {
  if (/(FREEZE|UNFREEZE|BLOCK|UNBLOCK|ACTIVATE|DEACTIVATE)/.test(action)) return "Access";
  if (/(APPROVE|REJECT|RESOLVE|DISMISS|REPORT)/.test(action)) return "Moderation";
  if (/(CREATE|UPDATE|DELETE|SUBMIT)/.test(action)) return "Content";
  if (/EXPORT/.test(action)) return "Operations";
  return "General";
}

function getTargetHref(log: AuditLog, metadata: AuditMetadata | null) {
  const targetType = log.targetType.toUpperCase();

  if (targetType === "TRAINER" && log.targetId) return `/admins/${log.targetId}`;
  if (targetType === "USER" && log.targetId) return `/users/${log.targetId}`;
  if (targetType === "COURSE" && log.targetId) return `/courses/${log.targetId}`;
  if (targetType === "COURSE_REPORT") return "/reports";
  if (targetType === "QUOTE") return "/quotes";
  if (targetType === "BREED" || targetType === "TRAINING_GOAL") return "/catalog";

  const metadataCourseId = typeof metadata?.courseId === "string" ? metadata.courseId : null;
  const metadataTrainerId = typeof metadata?.trainerId === "string" ? metadata.trainerId : null;
  const metadataUserId = typeof metadata?.userId === "string" ? metadata.userId : null;

  if (metadataCourseId) return `/courses/${metadataCourseId}`;
  if (metadataTrainerId) return `/admins/${metadataTrainerId}`;
  if (metadataUserId) return `/users/${metadataUserId}`;

  return null;
}

function MetadataList({ metadata }: { metadata: AuditMetadata | null }) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return <span className="muted-row">-</span>;
  }

  return (
    <div className="metadata-list">
      {Object.entries(metadata).map(([key, value]) => (
        <div className="metadata-row" key={key}>
          <span className="metadata-key">{prettifyToken(key)}</span>
          <span className="metadata-value">
            {typeof value === "boolean"
              ? value
                ? "Yes"
                : "No"
              : value === null || value === undefined || value === ""
                ? "-"
                : typeof value === "object"
                  ? JSON.stringify(value)
                  : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

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

  const decoratedLogs = useMemo(
    () =>
      logs.map((log) => {
        const metadata = parseMetadata(log.metadata);
        return {
          ...log,
          metadataObject: metadata,
          actionTone: getActionTone(log.action),
          actionGroup: getActionGroup(log.action),
          targetHref: getTargetHref(log, metadata)
        };
      }),
    [logs]
  );

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
                  {decoratedLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="muted-row">{new Date(log.createdAt).toLocaleString()}</td>
                      <td>
                        <strong>{log.actorEmail || log.actorType}</strong>
                        <div className="muted-row">{log.actorId || "-"}</div>
                      </td>
                      <td>
                        <div className="compact">
                          <span className={`badge ${log.actionTone}`.trim()}>{prettifyToken(log.action)}</span>
                          <span className="badge neutral">{log.actionGroup}</span>
                        </div>
                      </td>
                      <td>
                        <strong>{prettifyToken(log.targetType)}</strong>
                        <div className="muted-row">{log.targetId || "-"}</div>
                        {log.targetHref ? (
                          <Link className="inline-link" href={log.targetHref}>
                            Open target
                            <ExternalLink size={13} />
                          </Link>
                        ) : null}
                      </td>
                      <td style={{ maxWidth: 360 }}>
                        <MetadataList metadata={log.metadataObject} />
                      </td>
                    </tr>
                  ))}
                  {decoratedLogs.length === 0 ? (
                    <tr>
                      <td className="muted-row" colSpan={5}>
                        No audit events match the current filters.
                      </td>
                    </tr>
                  ) : null}
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
