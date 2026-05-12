"use client";

import { FormEvent, useEffect, useState } from "react";
import { Dog, Goal, Plus, RefreshCw, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { PaginationControls } from "@/components/PaginationControls";
import { RequireAuth } from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { getSession } from "@/lib/session";
import type { CatalogItem, PaginatedResponse, PaginationMeta } from "@/types/api";

type CatalogType = "breeds" | "training-goals";

const emptyForm = {
  title: "",
  icon: "",
  shortDescription: ""
};

export default function CatalogPage() {
  const [breeds, setBreeds] = useState<CatalogItem[]>([]);
  const [goals, setGoals] = useState<CatalogItem[]>([]);
  const [breedMeta, setBreedMeta] = useState<PaginationMeta | null>(null);
  const [goalMeta, setGoalMeta] = useState<PaginationMeta | null>(null);
  const [breedForm, setBreedForm] = useState(emptyForm);
  const [goalForm, setGoalForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [breedPage, setBreedPage] = useState(1);
  const [goalPage, setGoalPage] = useState(1);

  async function loadCatalog(nextBreedPage = breedPage, nextGoalPage = goalPage) {
    const session = getSession();
    if (!session) return;

    const breedParams = new URLSearchParams({
      page: String(nextBreedPage),
      limit: "10"
    });
    const goalParams = new URLSearchParams({
      page: String(nextGoalPage),
      limit: "10"
    });

    if (search.trim()) {
      breedParams.set("search", search.trim());
      goalParams.set("search", search.trim());
    }

    const [breedData, goalData] = await Promise.all([
      api.get<PaginatedResponse<CatalogItem, "breeds">>(session.token, `/api/breeds?${breedParams.toString()}`),
      api.get<PaginatedResponse<CatalogItem, "trainingGoals">>(
        session.token,
        `/api/training-goals?${goalParams.toString()}`
      )
    ]);
    setBreeds(breedData.breeds);
    setGoals(goalData.trainingGoals);
    setBreedMeta(breedData.meta);
    setGoalMeta(goalData.meta);
  }

  useEffect(() => {
    void loadCatalog().catch((err) => setError(err.message));
  }, [search, breedPage, goalPage]);

  async function createItem(event: FormEvent<HTMLFormElement>, type: CatalogType) {
    event.preventDefault();
    const session = getSession();
    if (!session) return;

    const form = type === "breeds" ? breedForm : goalForm;
    setBusy(true);
    setMessage("");
    setError("");

    try {
      await api.post(session.token, `/api/admin/${type}`, {
        title: form.title,
        icon: form.icon || undefined,
        shortDescription: form.shortDescription || undefined
      });
      if (type === "breeds") {
        setBreedForm(emptyForm);
      } else {
        setGoalForm(emptyForm);
      }
      setMessage(type === "breeds" ? "Breed created." : "Training goal created.");
      await loadCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteItem(type: CatalogType, item: CatalogItem) {
    const session = getSession();
    if (!session) return;

    if (!window.confirm(`Delete "${item.title}"?`)) return;

    setBusy(true);
    setMessage("");
    setError("");
    try {
      await api.delete(session.token, `/api/admin/${type}/${item.id}`);
      setMessage("Item deleted.");
      await loadCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  function renderItems(type: CatalogType, items: CatalogItem[]) {
    return (
      <div className="scroll-x">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Icon</th>
              <th>Description</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.title}</strong>
                </td>
                <td>{item.icon || "-"}</td>
                <td className="muted-row">{item.shortDescription || "-"}</td>
                <td>
                  <span className={item.isActive ? "badge" : "badge deleted"}>
                    {item.isActive ? "Active" : "Deleted"}
                  </span>
                </td>
                <td>
                  <button
                    className="button danger"
                    disabled={busy || !item.isActive}
                    onClick={() => void deleteItem(type, item)}
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
    );
  }

  return (
    <RequireAuth>
      <AdminShell>
        <div className="topbar">
          <div>
            <h1 className="page-title">Catalog</h1>
            <p className="subtle">Manage dog breeds and selectable training goals.</p>
          </div>
          <button className="button secondary" onClick={() => void loadCatalog()} type="button">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="stack">
          {error ? <div className="error">{error}</div> : null}
          {message ? <div className="success">{message}</div> : null}

          <section className="panel">
            <div className="panel-body">
              <div className="field">
                <label>Search catalog</label>
                <input
                  className="input"
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setBreedPage(1);
                    setGoalPage(1);
                  }}
                  placeholder="Breed or goal title"
                  value={search}
                />
              </div>
            </div>
          </section>

          <section className="grid cols-2">
            <div className="panel">
              <div className="panel-header">
                <strong>Add breed</strong>
                <Dog size={18} />
              </div>
              <form className="panel-body form" onSubmit={(event) => void createItem(event, "breeds")}>
                <div className="field">
                  <label>Title</label>
                  <input
                    className="input"
                    onChange={(event) => setBreedForm({ ...breedForm, title: event.target.value })}
                    required
                    value={breedForm.title}
                  />
                </div>
                <div className="field">
                  <label>Icon</label>
                  <input
                    className="input"
                    onChange={(event) => setBreedForm({ ...breedForm, icon: event.target.value })}
                    placeholder="paw"
                    value={breedForm.icon}
                  />
                </div>
                <div className="field">
                  <label>Short description</label>
                  <textarea
                    className="textarea"
                    onChange={(event) =>
                      setBreedForm({ ...breedForm, shortDescription: event.target.value })
                    }
                    value={breedForm.shortDescription}
                  />
                </div>
                <button className="button" disabled={busy} type="submit">
                  <Plus size={16} />
                  Add breed
                </button>
              </form>
            </div>

            <div className="panel">
              <div className="panel-header">
                <strong>Add training goal</strong>
                <Goal size={18} />
              </div>
              <form
                className="panel-body form"
                onSubmit={(event) => void createItem(event, "training-goals")}
              >
                <div className="field">
                  <label>Title</label>
                  <input
                    className="input"
                    onChange={(event) => setGoalForm({ ...goalForm, title: event.target.value })}
                    required
                    value={goalForm.title}
                  />
                </div>
                <div className="field">
                  <label>Icon</label>
                  <input
                    className="input"
                    onChange={(event) => setGoalForm({ ...goalForm, icon: event.target.value })}
                    placeholder="target"
                    value={goalForm.icon}
                  />
                </div>
                <div className="field">
                  <label>Short description</label>
                  <textarea
                    className="textarea"
                    onChange={(event) =>
                      setGoalForm({ ...goalForm, shortDescription: event.target.value })
                    }
                    value={goalForm.shortDescription}
                  />
                </div>
                <button className="button" disabled={busy} type="submit">
                  <Plus size={16} />
                  Add goal
                </button>
              </form>
            </div>
          </section>

          <section className="grid cols-2">
            <div className="panel">
              <div className="panel-header">
                <strong>Breeds</strong>
                <span className="badge neutral">{breedMeta?.total ?? breeds.length}</span>
              </div>
              {renderItems("breeds", breeds)}
              <div className="panel-body">
                <PaginationControls meta={breedMeta} onPageChange={setBreedPage} />
              </div>
            </div>
            <div className="panel">
              <div className="panel-header">
                <strong>Training goals</strong>
                <span className="badge neutral">{goalMeta?.total ?? goals.length}</span>
              </div>
              {renderItems("training-goals", goals)}
              <div className="panel-body">
                <PaginationControls meta={goalMeta} onPageChange={setGoalPage} />
              </div>
            </div>
          </section>
        </div>
      </AdminShell>
    </RequireAuth>
  );
}
