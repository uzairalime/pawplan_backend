"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  CircleOff,
  Film,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Upload,
  X
} from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { PaginationControls } from "@/components/PaginationControls";
import { RequireAuth } from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { getSession } from "@/lib/session";
import type { Course, PaginatedResponse, PaginationMeta } from "@/types/api";

type StepDraft = {
  title: string;
  description: string;
};

type LectureDraft = {
  title: string;
  description: string;
  videoUrl: string;
  videoKey: string;
  steps: StepDraft[];
};

type DailyTaskDraft = {
  title: string;
  description: string;
  dayNumber: string;
};

type CourseForm = {
  trainerId: string;
  title: string;
  description: string;
  category: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  estimatedDays: string;
  estimatedMinutes: string;
  isPremium: boolean;
  priceAmount: string;
  currencyCode: string;
  thumbnailUrl: string;
  thumbnailKey: string;
  lectures: LectureDraft[];
  dailyTasks: DailyTaskDraft[];
};

const emptyStep = (): StepDraft => ({
  title: "",
  description: ""
});

const emptyLecture = (): LectureDraft => ({
  title: "",
  description: "",
  videoUrl: "",
  videoKey: "",
  steps: [emptyStep()]
});

const emptyDailyTask = (dayNumber: number): DailyTaskDraft => ({
  title: "",
  description: "",
  dayNumber: String(dayNumber)
});

const initialForm = (): CourseForm => ({
  trainerId: "",
  title: "",
  description: "",
  category: "",
  level: "BEGINNER",
  estimatedDays: "7",
  estimatedMinutes: "20",
  isPremium: false,
  priceAmount: "",
  currencyCode: "USD",
  thumbnailUrl: "",
  thumbnailKey: "",
  lectures: [emptyLecture()],
  dailyTasks: [emptyDailyTask(1)]
});

function toOptionalNumber(value: string) {
  return value ? Number(value) : undefined;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [form, setForm] = useState<CourseForm>(initialForm);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const session = getSession();
  const isSuperAdmin = session?.admin.role === "SUPER_ADMIN";

  async function loadCourses(targetPage = page) {
    const currentSession = getSession();
    if (!currentSession) return;

    const params = new URLSearchParams({
      page: String(targetPage),
      limit: "12"
    });

    if (search.trim()) params.set("search", search.trim());
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (levelFilter !== "ALL") params.set("level", levelFilter);

    const data = await api.get<PaginatedResponse<Course, "courses">>(
      currentSession.token,
      `/api/admin/courses?${params.toString()}`
    );
    setCourses(data.courses);
    setMeta(data.meta);
  }

  useEffect(() => {
    void loadCourses().catch((err) => setError(err.message));
  }, [page, search, statusFilter, levelFilter]);

  function updateForm<K extends keyof CourseForm>(field: K, value: CourseForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateLecture(index: number, patch: Partial<LectureDraft>) {
    setForm((current) => ({
      ...current,
      lectures: current.lectures.map((lecture, lectureIndex) =>
        lectureIndex === index ? { ...lecture, ...patch } : lecture
      )
    }));
  }

  function updateStep(lectureIndex: number, stepIndex: number, patch: Partial<StepDraft>) {
    setForm((current) => ({
      ...current,
      lectures: current.lectures.map((lecture, currentLectureIndex) =>
        currentLectureIndex === lectureIndex
          ? {
              ...lecture,
              steps: lecture.steps.map((step, currentStepIndex) =>
                currentStepIndex === stepIndex ? { ...step, ...patch } : step
              )
            }
          : lecture
      )
    }));
  }

  function addLecture() {
    setForm((current) => ({
      ...current,
      lectures: [...current.lectures, emptyLecture()]
    }));
  }

  function removeLecture(lectureIndex: number) {
    setForm((current) => ({
      ...current,
      lectures:
        current.lectures.length === 1
          ? [emptyLecture()]
          : current.lectures.filter((_, index) => index !== lectureIndex)
    }));
  }

  function addStep(lectureIndex: number) {
    setForm((current) => ({
      ...current,
      lectures: current.lectures.map((lecture, index) =>
        index === lectureIndex ? { ...lecture, steps: [...lecture.steps, emptyStep()] } : lecture
      )
    }));
  }

  function removeStep(lectureIndex: number, stepIndex: number) {
    setForm((current) => ({
      ...current,
      lectures: current.lectures.map((lecture, index) =>
        index === lectureIndex
          ? {
              ...lecture,
              steps:
                lecture.steps.length === 1
                  ? [emptyStep()]
                  : lecture.steps.filter((_, currentStepIndex) => currentStepIndex !== stepIndex)
            }
          : lecture
      )
    }));
  }

  function updateDailyTask(index: number, patch: Partial<DailyTaskDraft>) {
    setForm((current) => ({
      ...current,
      dailyTasks: current.dailyTasks.map((task, taskIndex) =>
        taskIndex === index ? { ...task, ...patch } : task
      )
    }));
  }

  function addDailyTask() {
    setForm((current) => ({
      ...current,
      dailyTasks: [...current.dailyTasks, emptyDailyTask(current.dailyTasks.length + 1)]
    }));
  }

  function removeDailyTask(index: number) {
    setForm((current) => ({
      ...current,
      dailyTasks:
        current.dailyTasks.length === 1
          ? [emptyDailyTask(1)]
          : current.dailyTasks.filter((_, taskIndex) => taskIndex !== index)
    }));
  }

  async function uploadCourseThumbnail(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const currentSession = getSession();
    if (!file || !currentSession) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      const uploaded = await api.upload(
        currentSession.token,
        "/api/uploads/course-thumbnail",
        "image",
        file
      );
      setForm((current) => ({
        ...current,
        thumbnailUrl: uploaded.url,
        thumbnailKey: uploaded.key
      }));
      setMessage("Thumbnail uploaded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  async function uploadLectureVideo(event: ChangeEvent<HTMLInputElement>, lectureIndex: number) {
    const file = event.target.files?.[0];
    const currentSession = getSession();
    if (!file || !currentSession) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      const uploaded = await api.upload(
        currentSession.token,
        "/api/uploads/course-video",
        "video",
        file
      );
      updateLecture(lectureIndex, { videoUrl: uploaded.url, videoKey: uploaded.key });
      setMessage("Lecture video uploaded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  async function createCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentSession = getSession();
    if (!currentSession) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const lectures = form.lectures
        .map((lecture, lectureIndex) => ({
          title: lecture.title.trim(),
          description: lecture.description.trim() || undefined,
          videoUrl: lecture.videoUrl || undefined,
          videoKey: lecture.videoKey || undefined,
          sortOrder: lectureIndex,
          steps: lecture.steps
            .map((step, stepIndex) => ({
              title: step.title.trim(),
              description: step.description.trim() || undefined,
              sortOrder: stepIndex
            }))
            .filter((step) => step.title)
        }))
        .filter((lecture) => lecture.title);

      const dailyTasks = form.dailyTasks
        .map((task, taskIndex) => ({
          title: task.title.trim(),
          description: task.description.trim() || undefined,
          dayNumber: Number(task.dayNumber || taskIndex + 1)
        }))
        .filter((task) => task.title);

      if (!form.title.trim()) {
        throw new Error("Course title is required");
      }

      if (lectures.length === 0) {
        throw new Error("Add at least one lecture before creating the course");
      }

      await api.createCourse(currentSession.token, {
        trainerId: isSuperAdmin && form.trainerId ? form.trainerId : undefined,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        category: form.category.trim() || undefined,
        level: form.level,
        estimatedDays: toOptionalNumber(form.estimatedDays),
        estimatedMinutes: toOptionalNumber(form.estimatedMinutes),
        isPremium: form.isPremium,
        priceAmount: form.isPremium ? toOptionalNumber(form.priceAmount) : undefined,
        currencyCode: form.isPremium ? form.currencyCode : undefined,
        thumbnailUrl: form.thumbnailUrl || undefined,
        thumbnailKey: form.thumbnailKey || undefined,
        lectures,
        dailyTasks: dailyTasks.length ? dailyTasks : undefined
      });

      setForm(initialForm());
      setMessage("Course draft created. Open it to submit for approval.");
      await loadCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Course create failed");
    } finally {
      setBusy(false);
    }
  }

  async function submitReview(course: Course) {
    const currentSession = getSession();
    if (!currentSession) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.patch(currentSession.token, `/api/admin/courses/${course.id}/submit-review`, {});
      setMessage("Course submitted for super admin review.");
      await loadCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  }

  async function changeCourseStatus(course: Course, online: boolean) {
    const currentSession = getSession();
    if (!currentSession) return;

    if (!window.confirm(`Are you sure you want to put "${course.title}" ${online ? "online" : "offline"}?`)) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.patch(
        currentSession.token,
        `/api/admin/courses/${course.id}/${online ? "online" : "offline"}`,
        {}
      );
      setMessage(online ? "Course is online." : "Course is offline.");
      await loadCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteCourse(course: Course) {
    const currentSession = getSession();
    if (!currentSession) return;

    if (!window.confirm(`Delete "${course.title}"? Users will no longer see it.`)) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.delete(currentSession.token, `/api/admin/courses/${course.id}`);
      setMessage("Course deleted.");
      await loadCourses();
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
            <h1 className="page-title">Courses</h1>
            <p className="subtle">Create training drafts, add multiple lectures, and track review status.</p>
          </div>
          <button className="button secondary" onClick={() => void loadCourses()} type="button">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="stack">
          {error ? <div className="error">{error}</div> : null}
          {message ? <div className="success">{message}</div> : null}

          <div className="split">
            <section className="panel">
              <div className="panel-header">
                <strong>Create course draft</strong>
                <BookOpen size={18} />
              </div>
              <form className="panel-body form" onSubmit={createCourse}>
                <div className="grid cols-2">
                  <div className="field">
                    <label>Course title</label>
                    <input
                      className="input"
                      onChange={(event) => updateForm("title", event.target.value)}
                      required
                      value={form.title}
                    />
                  </div>
                  <div className="field">
                    <label>Category</label>
                    <input
                      className="input"
                      onChange={(event) => updateForm("category", event.target.value)}
                      placeholder="Puppy basics"
                      value={form.category}
                    />
                  </div>
                </div>

                {isSuperAdmin ? (
                  <div className="field">
                    <label>Assign trainer ID</label>
                    <input
                      className="input"
                      onChange={(event) => updateForm("trainerId", event.target.value)}
                      placeholder="Optional trainer id"
                      value={form.trainerId}
                    />
                  </div>
                ) : null}

                <div className="field">
                  <label>Description</label>
                  <textarea
                    className="textarea"
                    onChange={(event) => updateForm("description", event.target.value)}
                    value={form.description}
                  />
                </div>

                <div className="grid cols-3">
                  <div className="field">
                    <label>Level</label>
                    <select
                      className="select"
                      onChange={(event) =>
                        updateForm("level", event.target.value as CourseForm["level"])
                      }
                      value={form.level}
                    >
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Estimated days</label>
                    <input
                      className="input"
                      min="1"
                      onChange={(event) => updateForm("estimatedDays", event.target.value)}
                      type="number"
                      value={form.estimatedDays}
                    />
                  </div>
                  <div className="field">
                    <label>Minutes per day</label>
                    <input
                      className="input"
                      min="1"
                      onChange={(event) => updateForm("estimatedMinutes", event.target.value)}
                      type="number"
                      value={form.estimatedMinutes}
                    />
                  </div>
                  <div className="field">
                    <label>Currency</label>
                    <input
                      className="input"
                      maxLength={3}
                      onChange={(event) => updateForm("currencyCode", event.target.value.toUpperCase())}
                      value={form.currencyCode}
                    />
                  </div>
                </div>
                <label className="actions muted-row">
                  <input
                    checked={form.isPremium}
                    onChange={(event) => updateForm("isPremium", event.target.checked)}
                    type="checkbox"
                  />
                  Premium course
                </label>
                {form.isPremium ? (
                  <div className="field">
                    <label>Price amount</label>
                    <input
                      className="input"
                      min="1"
                      onChange={(event) => updateForm("priceAmount", event.target.value)}
                      type="number"
                      value={form.priceAmount}
                    />
                  </div>
                ) : null}

                <label className="actions">
                  <span className="button secondary">
                    <Upload size={16} />
                    Thumbnail
                  </span>
                  <input hidden accept="image/*" onChange={(event) => void uploadCourseThumbnail(event)} type="file" />
                  {form.thumbnailUrl ? <span className="muted-row">Ready</span> : null}
                </label>
                {form.thumbnailUrl ? (
                  <img alt="" className="thumbnail" src={form.thumbnailUrl} style={{ width: 180 }} />
                ) : null}

                <div className="divider" />

                <div className="panel-header" style={{ padding: 0, borderBottom: 0 }}>
                  <strong>Lectures</strong>
                  <button className="button secondary" onClick={addLecture} type="button">
                    <Plus size={16} />
                    Add lecture
                  </button>
                </div>

                {form.lectures.map((lecture, lectureIndex) => (
                  <div className="panel" key={`lecture-${lectureIndex}`}>
                    <div className="panel-header">
                      <strong>Lecture {lectureIndex + 1}</strong>
                      <button
                        className="button secondary"
                        onClick={() => removeLecture(lectureIndex)}
                        type="button"
                      >
                        <X size={15} />
                      </button>
                    </div>
                    <div className="panel-body form">
                      <div className="field">
                        <label>Title</label>
                        <input
                          className="input"
                          onChange={(event) =>
                            updateLecture(lectureIndex, { title: event.target.value })
                          }
                          value={lecture.title}
                        />
                      </div>
                      <div className="field">
                        <label>Description</label>
                        <textarea
                          className="textarea"
                          onChange={(event) =>
                            updateLecture(lectureIndex, { description: event.target.value })
                          }
                          value={lecture.description}
                        />
                      </div>
                      <label className="actions">
                        <span className="button secondary">
                          <Film size={16} />
                          Upload video
                        </span>
                        <input
                          hidden
                          accept="video/*"
                          onChange={(event) => void uploadLectureVideo(event, lectureIndex)}
                          type="file"
                        />
                        {lecture.videoUrl ? <span className="muted-row">Ready</span> : null}
                      </label>
                      {lecture.videoUrl ? (
                        <video className="thumbnail" controls src={lecture.videoUrl} style={{ width: 220 }} />
                      ) : null}

                      <div className="panel-header" style={{ padding: 0, borderBottom: 0 }}>
                        <strong>Learning steps</strong>
                        <button
                          className="button secondary"
                          onClick={() => addStep(lectureIndex)}
                          type="button"
                        >
                          <Plus size={16} />
                          Add step
                        </button>
                      </div>

                      {lecture.steps.map((step, stepIndex) => (
                        <div className="item-row" key={`lecture-${lectureIndex}-step-${stepIndex}`}>
                          <div className="field" style={{ flex: 1 }}>
                            <label>Step title</label>
                            <input
                              className="input"
                              onChange={(event) =>
                                updateStep(lectureIndex, stepIndex, { title: event.target.value })
                              }
                              value={step.title}
                            />
                          </div>
                          <div className="field" style={{ flex: 1 }}>
                            <label>Step description</label>
                            <input
                              className="input"
                              onChange={(event) =>
                                updateStep(lectureIndex, stepIndex, {
                                  description: event.target.value
                                })
                              }
                              value={step.description}
                            />
                          </div>
                          <button
                            className="button secondary"
                            onClick={() => removeStep(lectureIndex, stepIndex)}
                            style={{ alignSelf: "end" }}
                            type="button"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="divider" />

                <div className="panel-header" style={{ padding: 0, borderBottom: 0 }}>
                  <strong>Daily tasks</strong>
                  <button className="button secondary" onClick={addDailyTask} type="button">
                    <Plus size={16} />
                    Add task
                  </button>
                </div>

                {form.dailyTasks.map((task, taskIndex) => (
                  <div className="item-row" key={`task-${taskIndex}`}>
                    <div className="field" style={{ flex: 1 }}>
                      <label>Task title</label>
                      <input
                        className="input"
                        onChange={(event) =>
                          updateDailyTask(taskIndex, { title: event.target.value })
                        }
                        value={task.title}
                      />
                    </div>
                    <div className="field" style={{ flex: 1 }}>
                      <label>Description</label>
                      <input
                        className="input"
                        onChange={(event) =>
                          updateDailyTask(taskIndex, { description: event.target.value })
                        }
                        value={task.description}
                      />
                    </div>
                    <div className="field" style={{ width: 120 }}>
                      <label>Day</label>
                      <input
                        className="input"
                        min="1"
                        onChange={(event) =>
                          updateDailyTask(taskIndex, { dayNumber: event.target.value })
                        }
                        type="number"
                        value={task.dayNumber}
                      />
                    </div>
                    <button
                      className="button secondary"
                      onClick={() => removeDailyTask(taskIndex)}
                      style={{ alignSelf: "end" }}
                      type="button"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}

                <button className="button" disabled={busy} type="submit">
                  <Plus size={16} />
                  Create draft
                </button>
              </form>
            </section>

            <section className="panel">
              <div className="panel-header">
                <strong>Course library</strong>
                <span className="badge neutral">{meta?.total ?? courses.length}</span>
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
                      placeholder="Title, category, trainer"
                      value={search}
                    />
                  </div>
                  <div className="field">
                    <label>Level</label>
                    <select
                      className="select"
                      onChange={(event) => {
                        setLevelFilter(event.target.value);
                        setPage(1);
                      }}
                      value={levelFilter}
                    >
                      <option value="ALL">All levels</option>
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Status</label>
                    <select
                      className="select"
                      onChange={(event) => {
                        setStatusFilter(event.target.value);
                        setPage(1);
                      }}
                      value={statusFilter}
                    >
                      <option value="ALL">All statuses</option>
                      <option value="ONLINE">Online</option>
                      <option value="OFFLINE">Offline</option>
                      <option value="DRAFT">Draft</option>
                      <option value="PENDING_REVIEW">Pending review</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="APPROVED">Approved</option>
                      <option value="FROZEN">Frozen</option>
                      <option value="DELETED">Deleted</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="scroll-x">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Trainer</th>
                      <th>Level</th>
                      <th>Joined</th>
                      <th>Views</th>
                      <th>Reports</th>
                      <th>Status</th>
                      <th>Review</th>
                      <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                    {courses.map((course) => (
                      <tr key={course.id}>
                        <td>
                          <div className="actions" style={{ flexWrap: "nowrap" }}>
                            {course.thumbnailUrl ? (
                              <img alt="" className="thumbnail" src={course.thumbnailUrl} />
                            ) : null}
                            <div>
                              <Link href={`/courses/${course.id}`}>
                                <strong>{course.title}</strong>
                              </Link>
                              <div className="muted-row">{course.category || "No category"}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <strong>{course.trainer?.name || "Unassigned"}</strong>
                          <div className="muted-row">{course.trainer?.expertise || "-"}</div>
                        </td>
                        <td>{course.level}</td>
                        <td>{course._count?.enrollments ?? 0}</td>
                        <td>{course.viewCount ?? 0}</td>
                        <td>{course._count?.reports ?? 0}</td>
                        <td>
                          {course.deletedAt ? (
                            <span className="badge deleted">Deleted</span>
                          ) : course.isFrozen ? (
                            <span className="badge deleted">Frozen</span>
                          ) : course.isPublished ? (
                            <span className="badge">Online</span>
                          ) : (
                            <span className="badge offline">Offline</span>
                          )}
                        </td>
                        <td>
                          <span
                            className={
                              course.approvalStatus === "REJECTED"
                                ? "badge deleted"
                                : course.approvalStatus === "PENDING_REVIEW"
                                  ? "badge offline"
                                  : "badge"
                            }
                          >
                            {course.approvalStatus.replace("_", " ")}
                          </span>
                          {course.rejectionReason ? (
                            <div className="muted-row">{course.rejectionReason}</div>
                          ) : null}
                        </td>
                        <td>
                          <div className="actions">
                            {course.approvalStatus !== "PENDING_REVIEW" &&
                            course.approvalStatus !== "APPROVED" ? (
                              <button
                                className="button secondary"
                                disabled={busy || Boolean(course.deletedAt)}
                                onClick={() => void submitReview(course)}
                                type="button"
                              >
                                <Send size={15} />
                              </button>
                            ) : null}
                            {isSuperAdmin ? (
                              course.isPublished ? (
                                <button
                                  className="button warning"
                                  disabled={busy || Boolean(course.deletedAt)}
                                  onClick={() => void changeCourseStatus(course, false)}
                                  type="button"
                                >
                                  <CircleOff size={15} />
                                </button>
                              ) : (
                                <button
                                  className="button"
                                  disabled={busy || Boolean(course.deletedAt)}
                                  onClick={() => void changeCourseStatus(course, true)}
                                  type="button"
                                >
                                  <CheckCircle2 size={15} />
                                </button>
                              )
                            ) : null}
                            <button
                              className="button danger"
                              disabled={busy || Boolean(course.deletedAt)}
                              onClick={() => void deleteCourse(course)}
                              type="button"
                            >
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
        </div>
      </AdminShell>
    </RequireAuth>
  );
}
