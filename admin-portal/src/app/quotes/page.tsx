"use client";

import { FormEvent, useEffect, useState } from "react";
import { MessageSquareQuote, Plus, RefreshCw, RotateCw, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { PaginationControls } from "@/components/PaginationControls";
import { RequireAuth } from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { getSession } from "@/lib/session";
import type { PaginatedResponse, PaginationMeta, Quote } from "@/types/api";

export default function QuotesPage() {
  const [dailyQuote, setDailyQuote] = useState<Quote | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  async function loadQuotes(targetPage = page) {
    const session = getSession();
    if (!session) return;

    const params = new URLSearchParams({
      page: String(targetPage),
      limit: "10"
    });
    if (search.trim()) params.set("search", search.trim());

    const [dailyData, quoteData] = await Promise.all([
      api.get<{ quote: Quote }>(session.token, "/api/daily-quote"),
      api.get<PaginatedResponse<Quote, "quotes">>(session.token, `/api/admin/quotes?${params.toString()}`)
    ]);
    setDailyQuote(dailyData.quote);
    setQuotes(quoteData.quotes);
    setMeta(quoteData.meta);
  }

  useEffect(() => {
    void loadQuotes().catch((err) => setError(err.message));
  }, [page, search]);

  async function createQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = getSession();
    if (!session) return;

    setBusy(true);
    setMessage("");
    setError("");

    try {
      await api.post(session.token, "/api/admin/quotes", {
        text,
        author: author || undefined
      });
      setText("");
      setAuthor("");
      setMessage("Quote created.");
      await loadQuotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function refreshQuote() {
    const session = getSession();
    if (!session) return;

    setBusy(true);
    setMessage("");
    setError("");

    try {
      const data = await api.post<{ quote: Quote }>(session.token, "/api/admin/quotes/refresh");
      setDailyQuote(data.quote);
      setMessage("Daily quote refreshed.");
      await loadQuotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refresh failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteQuote(quote: Quote) {
    const session = getSession();
    if (!session) return;

    if (!window.confirm("Delete this quote?")) return;

    setBusy(true);
    setMessage("");
    setError("");

    try {
      await api.delete(session.token, `/api/admin/quotes/${quote.id}`);
      setMessage("Quote deleted.");
      await loadQuotes();
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
            <h1 className="page-title">Quotes</h1>
            <p className="subtle">Admin quotes are preferred; public fallback refreshes every 12 hours.</p>
          </div>
          <button className="button secondary" onClick={() => void loadQuotes()} type="button">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="stack">
          {error ? <div className="error">{error}</div> : null}
          {message ? <div className="success">{message}</div> : null}

          <section className="grid cols-2">
            <div className="panel">
              <div className="panel-header">
                <strong>Current daily quote</strong>
                <MessageSquareQuote size={18} />
              </div>
              <div className="panel-body compact">
                {dailyQuote ? (
                  <>
                    <p style={{ fontSize: 20, lineHeight: 1.45, margin: 0 }}>{dailyQuote.text}</p>
                    <span className="subtle">{dailyQuote.author || "Unknown author"}</span>
                    <div className="actions">
                      <span className="badge neutral">{dailyQuote.source}</span>
                      {dailyQuote.expiresAt ? (
                        <span className="muted-row">
                          Expires {new Date(dailyQuote.expiresAt).toLocaleString()}
                        </span>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <p className="subtle">No quote loaded.</p>
                )}
                <button className="button" disabled={busy} onClick={() => void refreshQuote()} type="button">
                  <RotateCw size={16} />
                  Refresh now
                </button>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <strong>Add admin quote</strong>
                <Plus size={18} />
              </div>
              <form className="panel-body form" onSubmit={createQuote}>
                <div className="field">
                  <label>Quote</label>
                  <textarea
                    className="textarea"
                    onChange={(event) => setText(event.target.value)}
                    required
                    value={text}
                  />
                </div>
                <div className="field">
                  <label>Author</label>
                  <input
                    className="input"
                    onChange={(event) => setAuthor(event.target.value)}
                    value={author}
                  />
                </div>
                <button className="button" disabled={busy} type="submit">
                  <Plus size={16} />
                  Add quote
                </button>
              </form>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <strong>Quote library</strong>
              <span className="badge neutral">{meta?.total ?? quotes.length}</span>
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
                  placeholder="Quote text or author"
                  value={search}
                />
              </div>
            </div>
            <div className="scroll-x">
              <table className="table">
                <thead>
                  <tr>
                    <th>Quote</th>
                    <th>Author</th>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((quote) => (
                    <tr key={quote.id}>
                      <td style={{ minWidth: 320 }}>{quote.text}</td>
                      <td>{quote.author || "-"}</td>
                      <td>
                        <span className="badge neutral">{quote.source}</span>
                      </td>
                      <td>
                        <span className={quote.isActive === false ? "badge deleted" : "badge"}>
                          {quote.isActive === false ? "Deleted" : "Active"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="button danger"
                          disabled={busy || quote.isActive === false}
                          onClick={() => void deleteQuote(quote)}
                          type="button"
                        >
                          <Trash2 size={15} />
                        </button>
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
