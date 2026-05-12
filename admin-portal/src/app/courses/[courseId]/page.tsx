"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CircleOff,
  Film,
  Plus,
  Send,
  Save,
  Trash2,
  Upload
} from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { RequireAuth } from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { getSession } from "@/lib/session";
import type { Course, CourseAnalytics, DailyTask, Lecture, Step } from "@/types/api";

type CourseEdit = {
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
  isPublished: boolean;
};

type LectureEdit = {
  title: string;
  description: string;
  videoUrl: string;
  videoKey: string;
  sortOrder: string;
};

type StepEdit = {
  title: string;
  description: string;
  sortOrder: string;
};

type TaskEdit = {
  title: string;
  description: string;
  dayNumber: string;
};

function courseToEdit(course: Course): CourseEdit {
  return {
    trainerId: course.trainerId ?? "",
    title: course.title,
    description: course.description ?? "",
    category: course.category ?? "",
    level: course.level,
    estimatedDays: course.estimatedDays ? String(course.estimatedDays) : "",
    estimatedMinutes: course.estimatedMinutes ? String(course.estimatedMinutes) : "",
    isPremium: course.isPremium ?? false,
    priceAmount: course.priceAmount ? String(course.priceAmount) : "",
    currencyCode: course.currencyCode ?? "USD",
    thumbnailUrl: course.thumbnailUrl ?? "",
    thumbnailKey: course.thumbnailKey ?? "",
    isPublished: course.isPublished
  };
}

function lectureToEdit(lecture: Lecture): LectureEdit {
  return {
    title: lecture.title,
    description: lecture.description ?? "",
    videoUrl: lecture.videoUrl ?? "",
    videoKey: lecture.videoKey ?? "",
    sortOrder: String(lecture.sortOrder)
  };
}

function stepToEdit(step: Step): StepEdit {
  return {
    title: step.title,
    description: step.description ?? "",
    sortOrder: String(step.sortOrder)
  };
}

function taskToEdit(task: DailyTask): TaskEdit {
  return {
    title: task.title,
    description: task.description ?? "",
    dayNumber: String(task.dayNumber)
  };
}

function optionalNumber(value: string) {
  return value ? Number(value) : null;
}

export default function CourseDetailPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;
  const [course, setCourse] = useState<Course | null>(null);
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  const [courseEdit, setCourseEdit] = useState<CourseEdit | null>(null);
  const [lectureEdits, setLectureEdits] = useState<Record<string, LectureEdit>>({});
  const [stepEdits, setStepEdits] = useState<Record<string, StepEdit>>({});
  const [taskEdits, setTaskEdits] = useState<Record<string, TaskEdit>>({});
  const [newStepByLecture, setNewStepByLecture] = useState<Record<string, StepEdit>>({});
  const [newTask, setNewTask] = useState<TaskEdit>({ title: "", description: "", dayNumber: "" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const session = getSession();
  const isSuperAdmin = session?.admin.role === "SUPER_ADMIN";

  async function loadCourse() {
    const session = getSession();
    if (!session || !courseId) return;

    const [data, analyticsData] = await Promise.all([
      api.get<{ course: Course }>(session.token, `/api/admin/courses/${courseId}`),
      api.get<{ analytics: CourseAnalytics }>(session.token, `/api/admin/courses/${courseId}/analytics`)
    ]);
    const loadedCourse = data.course;
    const nextLectureEdits: Record<string, LectureEdit> = {};
    const nextStepEdits: Record<string, StepEdit> = {};
    const nextTaskEdits: Record<string, TaskEdit> = {};

    loadedCourse.lectures?.forEach((lecture) => {
      nextLectureEdits[lecture.id] = lectureToEdit(lecture);
      lecture.steps?.forEach((step) => {
        nextStepEdits[step.id] = stepToEdit(step);
      });
    });
    loadedCourse.dailyTasks?.forEach((task) => {
      nextTaskEdits[task.id] = taskToEdit(task);
    });

    setCourse(loadedCourse);
    setAnalytics(analyticsData.analytics);
    setCourseEdit(courseToEdit(loadedCourse));
    setLectureEdits(nextLectureEdits);
    setStepEdits(nextStepEdits);
    setTaskEdits(nextTaskEdits);
  }

  useEffect(() => {
    void loadCourse().catch((err) => setError(err.message));
  }, [courseId]);

  async function uploadCourseThumbnail(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const session = getSession();
    if (!file || !session || !courseEdit) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      const uploaded = await api.upload(session.token, "/api/uploads/course-thumbnail", "image", file);
      setCourseEdit({ ...courseEdit, thumbnailUrl: uploaded.url, thumbnailKey: uploaded.key });
      setMessage("Thumbnail uploaded. Save course to keep it.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  async function uploadLectureVideo(event: ChangeEvent<HTMLInputElement>, lectureId: string) {
    const file = event.target.files?.[0];
    const session = getSession();
    const edit = lectureEdits[lectureId];
    if (!file || !session || !edit) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      const uploaded = await api.upload(session.token, "/api/uploads/course-video", "video", file);
      setLectureEdits({
        ...lectureEdits,
        [lectureId]: { ...edit, videoUrl: uploaded.url, videoKey: uploaded.key }
      });
      setMessage("Video uploaded. Save lecture to keep it.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  async function saveCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = getSession();
    if (!session || !courseEdit) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (courseEdit.isPublished && !courseEdit.thumbnailUrl) {
        throw new Error("Upload a thumbnail or keep the course as draft.");
      }

      await api.patch(session.token, `/api/admin/courses/${courseId}`, {
        title: courseEdit.title,
        description: courseEdit.description || null,
        category: courseEdit.category || null,
        trainerId: courseEdit.trainerId || null,
        level: courseEdit.level,
        estimatedDays: optionalNumber(courseEdit.estimatedDays),
        estimatedMinutes: optionalNumber(courseEdit.estimatedMinutes),
        isPremium: courseEdit.isPremium,
        priceAmount: courseEdit.priceAmount ? Number(courseEdit.priceAmount) : null,
        currencyCode: courseEdit.isPremium ? courseEdit.currencyCode : null,
        thumbnailUrl: courseEdit.thumbnailUrl || null,
        thumbnailKey: courseEdit.thumbnailKey || null,
        isPublished: courseEdit.isPublished
      });
      setMessage("Course saved.");
      await loadCourse();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Course save failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveLecture(lectureId: string) {
    const session = getSession();
    const edit = lectureEdits[lectureId];
    if (!session || !edit) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.patch(session.token, `/api/admin/lectures/${lectureId}`, {
        title: edit.title,
        description: edit.description || null,
        videoUrl: edit.videoUrl || null,
        videoKey: edit.videoKey || null,
        sortOrder: Number(edit.sortOrder || 0)
      });
      setMessage("Lecture saved.");
      await loadCourse();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lecture save failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteLecture(lectureId: string) {
    const session = getSession();
    if (!session) return;

    if (!window.confirm("Delete this lecture and hide it from the course?")) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.delete(session.token, `/api/admin/lectures/${lectureId}`);
      setMessage("Lecture deleted.");
      await loadCourse();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lecture delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function addStep(event: FormEvent<HTMLFormElement>, lectureId: string) {
    event.preventDefault();
    const session = getSession();
    const edit = newStepByLecture[lectureId];
    if (!session || !edit?.title) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.post(session.token, `/api/admin/lectures/${lectureId}/steps`, {
        title: edit.title,
        description: edit.description || undefined,
        sortOrder: Number(edit.sortOrder || 0)
      });
      setNewStepByLecture({ ...newStepByLecture, [lectureId]: { title: "", description: "", sortOrder: "" } });
      setMessage("Step added.");
      await loadCourse();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Step add failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveStep(stepId: string) {
    const session = getSession();
    const edit = stepEdits[stepId];
    if (!session || !edit) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.patch(session.token, `/api/admin/steps/${stepId}`, {
        title: edit.title,
        description: edit.description || null,
        sortOrder: Number(edit.sortOrder || 0)
      });
      setMessage("Step saved.");
      await loadCourse();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Step save failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteStep(stepId: string) {
    const session = getSession();
    if (!session) return;

    if (!window.confirm("Delete this training step?")) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.delete(session.token, `/api/admin/steps/${stepId}`);
      setMessage("Step deleted.");
      await loadCourse();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Step delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = getSession();
    if (!session || !newTask.title || !newTask.dayNumber) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.post(session.token, `/api/admin/courses/${courseId}/daily-tasks`, {
        title: newTask.title,
        description: newTask.description || undefined,
        dayNumber: Number(newTask.dayNumber)
      });
      setNewTask({ title: "", description: "", dayNumber: "" });
      setMessage("Daily task added.");
      await loadCourse();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Daily task add failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveTask(taskId: string) {
    const session = getSession();
    const edit = taskEdits[taskId];
    if (!session || !edit) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.patch(session.token, `/api/admin/daily-tasks/${taskId}`, {
        title: edit.title,
        description: edit.description || null,
        dayNumber: Number(edit.dayNumber)
      });
      setMessage("Daily task saved.");
      await loadCourse();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Daily task save failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteTask(taskId: string) {
    const session = getSession();
    if (!session) return;

    if (!window.confirm("Delete this daily task?")) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.delete(session.token, `/api/admin/daily-tasks/${taskId}`);
      setMessage("Daily task deleted.");
      await loadCourse();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Daily task delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(online: boolean) {
    const session = getSession();
    if (!session) return;

    if (!window.confirm(`Are you sure you want to put this course ${online ? "online" : "offline"}?`)) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.patch(session.token, `/api/admin/courses/${courseId}/${online ? "online" : "offline"}`, {});
      setMessage(online ? "Course is online." : "Course is offline.");
      await loadCourse();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed");
    } finally {
      setBusy(false);
    }
  }

  async function setFrozen(nextFrozen: boolean) {
    const currentSession = getSession();
    if (!currentSession) return;

    const reason = nextFrozen ? window.prompt("Freeze reason")?.trim() : "";
    if (nextFrozen && !reason) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.patch(
        currentSession.token,
        `/api/admin/courses/${courseId}/${nextFrozen ? "freeze" : "unfreeze"}`,
        nextFrozen ? { reason } : {}
      );
      setMessage(nextFrozen ? "Course frozen." : "Course unfrozen.");
      await loadCourse();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Freeze update failed");
    } finally {
      setBusy(false);
    }
  }

  async function submitReview() {
    const currentSession = getSession();
    if (!currentSession) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.patch(currentSession.token, `/api/admin/courses/${courseId}/submit-review`, {});
      setMessage("Course submitted for super admin review.");
      await loadCourse();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  }

  async function approveCourse() {
    const currentSession = getSession();
    if (!currentSession) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.patch(currentSession.token, `/api/admin/courses/${courseId}/approve`, {});
      setMessage("Course approved and published.");
      await loadCourse();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setBusy(false);
    }
  }

  async function rejectCourse() {
    const currentSession = getSession();
    if (!currentSession) return;

    const reason = window.prompt("Reject reason");
    if (!reason) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.patch(currentSession.token, `/api/admin/courses/${courseId}/reject`, { reason });
      setMessage("Course rejected.");
      await loadCourse();
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
            <Link className="actions subtle" href="/courses">
              <ArrowLeft size={16} />
              Courses
            </Link>
            <h1 className="page-title">{course?.title ?? "Course details"}</h1>
            <p className="subtle">View course content and edit admin-managed training data.</p>
          </div>
          <div className="actions">
            {course?.approvalStatus !== "PENDING_REVIEW" && course?.approvalStatus !== "APPROVED" ? (
              <button className="button secondary" disabled={busy || !course} onClick={() => void submitReview()} type="button">
                <Send size={16} />
                Submit review
              </button>
            ) : null}
            {isSuperAdmin && course?.approvalStatus === "PENDING_REVIEW" ? (
              <>
                <button className="button" disabled={busy || !course} onClick={() => void approveCourse()} type="button">
                  <CheckCircle2 size={16} />
                  Approve
                </button>
                <button className="button danger" disabled={busy || !course} onClick={() => void rejectCourse()} type="button">
                  <CircleOff size={16} />
                  Reject
                </button>
              </>
            ) : null}
            {isSuperAdmin ? (
              <>
                <button
                  className={course?.isPublished ? "button warning" : "button"}
                  disabled={busy || !course || course?.isFrozen}
                  onClick={() => void changeStatus(!course?.isPublished)}
                  type="button"
                >
                  {course?.isPublished ? <CircleOff size={16} /> : <CheckCircle2 size={16} />}
                  {course?.isPublished ? "Offline" : "Online"}
                </button>
                <button
                  className={course?.isFrozen ? "button" : "button warning"}
                  disabled={busy || !course}
                  onClick={() => void setFrozen(!course?.isFrozen)}
                  type="button"
                >
                  <CircleOff size={16} />
                  {course?.isFrozen ? "Unfreeze" : "Freeze"}
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="stack">
          {error ? <div className="error">{error}</div> : null}
          {message ? <div className="success">{message}</div> : null}

          {courseEdit ? (
            <section className="panel">
              <div className="panel-header">
                <strong>Course info</strong>
                <div className="actions">
                  <span className={course?.isFrozen ? "badge deleted" : course?.isPublished ? "badge" : "badge offline"}>
                    {course?.isFrozen ? "Frozen" : course?.isPublished ? "Online" : "Offline"}
                  </span>
                  <span
                    className={
                      course?.approvalStatus === "REJECTED"
                        ? "badge deleted"
                        : course?.approvalStatus === "PENDING_REVIEW"
                          ? "badge offline"
                          : "badge"
                    }
                  >
                    {course?.approvalStatus?.replace("_", " ")}
                  </span>
                </div>
              </div>
              {course?.rejectionReason ? (
                <div className="error" style={{ margin: 16 }}>{course.rejectionReason}</div>
              ) : null}
              {course?.isFrozen && course.freezeReason ? (
                <div className="error" style={{ margin: 16 }}>{course.freezeReason}</div>
              ) : null}
              <form className="panel-body form" onSubmit={saveCourse}>
                <div className="grid cols-3">
                  {isSuperAdmin ? (
                    <div className="field">
                      <label>Trainer ID</label>
                      <input
                        className="input"
                        onChange={(event) => setCourseEdit({ ...courseEdit, trainerId: event.target.value })}
                        placeholder="Trainer id"
                        value={courseEdit.trainerId}
                      />
                    </div>
                  ) : null}
                  <div className="field">
                    <label>Title</label>
                    <input
                      className="input"
                      onChange={(event) => setCourseEdit({ ...courseEdit, title: event.target.value })}
                      required
                      value={courseEdit.title}
                    />
                  </div>
                  <div className="field">
                    <label>Category</label>
                    <input
                      className="input"
                      onChange={(event) => setCourseEdit({ ...courseEdit, category: event.target.value })}
                      value={courseEdit.category}
                    />
                  </div>
                  <div className="field">
                    <label>Level</label>
                    <select
                      className="select"
                      onChange={(event) =>
                        setCourseEdit({
                          ...courseEdit,
                          level: event.target.value as CourseEdit["level"]
                        })
                      }
                      value={courseEdit.level}
                    >
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                    </select>
                  </div>
                </div>
                {course?.trainer ? (
                  <div className="item-row">
                    <div className="actions" style={{ flexWrap: "nowrap" }}>
                      {course.trainer.profilePicture ? (
                        <img alt="" className="thumbnail" src={course.trainer.profilePicture} />
                      ) : null}
                      <div>
                        <strong>{course.trainer.name || course.trainer.email}</strong>
                        <div className="muted-row">{course.trainer.expertise || "Trainer"}</div>
                        <div className="muted-row">{course.trainer.bio || ""}</div>
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="field">
                  <label>Description</label>
                  <textarea
                    className="textarea"
                    onChange={(event) => setCourseEdit({ ...courseEdit, description: event.target.value })}
                    value={courseEdit.description}
                  />
                </div>
                <div className="grid cols-3">
                  <div className="field">
                    <label>Estimated days</label>
                    <input
                      className="input"
                      min="1"
                      onChange={(event) =>
                        setCourseEdit({ ...courseEdit, estimatedDays: event.target.value })
                      }
                      type="number"
                      value={courseEdit.estimatedDays}
                    />
                  </div>
                  <div className="field">
                    <label>Minutes per day</label>
                    <input
                      className="input"
                      min="1"
                      onChange={(event) =>
                        setCourseEdit({ ...courseEdit, estimatedMinutes: event.target.value })
                      }
                      type="number"
                      value={courseEdit.estimatedMinutes}
                    />
                  </div>
                  <div className="field">
                    <label>Currency</label>
                    <input
                      className="input"
                      maxLength={3}
                      onChange={(event) =>
                        setCourseEdit({ ...courseEdit, currencyCode: event.target.value.toUpperCase() })
                      }
                      value={courseEdit.currencyCode}
                    />
                  </div>
                  <label className="actions" style={{ alignSelf: "end" }}>
                    <span className="button secondary">
                      <Upload size={16} />
                      Thumbnail
                    </span>
                    <input hidden onChange={(event) => void uploadCourseThumbnail(event)} type="file" accept="image/*" />
                  </label>
                </div>
                <label className="actions muted-row">
                  <input
                    checked={courseEdit.isPremium}
                    onChange={(event) => setCourseEdit({ ...courseEdit, isPremium: event.target.checked })}
                    type="checkbox"
                  />
                  Premium course
                </label>
                {courseEdit.isPremium ? (
                  <div className="field">
                    <label>Price amount</label>
                    <input
                      className="input"
                      min="1"
                      onChange={(event) => setCourseEdit({ ...courseEdit, priceAmount: event.target.value })}
                      type="number"
                      value={courseEdit.priceAmount}
                    />
                  </div>
                ) : null}
                {isSuperAdmin ? <label className="actions muted-row">
                  <input
                    checked={courseEdit.isPublished}
                    onChange={(event) => setCourseEdit({ ...courseEdit, isPublished: event.target.checked })}
                    type="checkbox"
                  />
                  Published
                </label> : null}
                {courseEdit.thumbnailUrl ? (
                  <img alt="" className="thumbnail" src={courseEdit.thumbnailUrl} style={{ width: 180 }} />
                ) : null}
                <button className="button" disabled={busy} type="submit">
                  <Save size={16} />
                  Save course
                </button>
              </form>
            </section>
          ) : null}

          {analytics ? (
            <section className="grid cols-4">
              <div className="panel stat">
                <strong>{analytics.enrollmentCount}</strong>
                <span className="subtle">Enrollments</span>
              </div>
              <div className="panel stat">
                <strong>{analytics.averageProgress}%</strong>
                <span className="subtle">Average progress</span>
              </div>
              <div className="panel stat">
                <strong>{analytics.completionRate}%</strong>
                <span className="subtle">Completion rate</span>
              </div>
              <div className="panel stat">
                <strong>{analytics.activeStreakUsers}</strong>
                <span className="subtle">Active streaks</span>
              </div>
            </section>
          ) : null}
          {analytics ? (
            <section className="grid cols-4">
              <div className="panel stat">
                <strong>{analytics.viewCount}</strong>
                <span className="subtle">Views</span>
              </div>
              <div className="panel stat">
                <strong>{analytics.stepCount}</strong>
                <span className="subtle">Steps</span>
              </div>
              <div className="panel stat">
                <strong>{analytics.taskCount}</strong>
                <span className="subtle">Daily tasks</span>
              </div>
              <div className="panel stat">
                <strong>{analytics.openReportCount}</strong>
                <span className="subtle">Open reports</span>
              </div>
            </section>
          ) : null}

          <section className="grid cols-2">
            <div className="panel">
              <div className="panel-header">
                <strong>Lectures and steps</strong>
                <span className="badge neutral">{course?.lectures?.length ?? 0}</span>
              </div>
              <div className="panel-body">
                {course?.lectures?.map((lecture) => {
                  const edit = lectureEdits[lecture.id];
                  return (
                    <div className="item-row" key={lecture.id}>
                      <div className="inline-form">
                        <div className="grid cols-3">
                          <div className="field">
                            <label>Lecture title</label>
                            <input
                              className="input"
                              onChange={(event) =>
                                setLectureEdits({
                                  ...lectureEdits,
                                  [lecture.id]: { ...edit, title: event.target.value }
                                })
                              }
                              value={edit?.title ?? ""}
                            />
                          </div>
                          <div className="field">
                            <label>Sort</label>
                            <input
                              className="input"
                              onChange={(event) =>
                                setLectureEdits({
                                  ...lectureEdits,
                                  [lecture.id]: { ...edit, sortOrder: event.target.value }
                                })
                              }
                              type="number"
                              value={edit?.sortOrder ?? ""}
                            />
                          </div>
                          <label className="actions" style={{ alignSelf: "end" }}>
                            <span className="button secondary">
                              <Film size={16} />
                              Video
                            </span>
                            <input
                              hidden
                              onChange={(event) => void uploadLectureVideo(event, lecture.id)}
                              type="file"
                              accept="video/*"
                            />
                          </label>
                        </div>
                        <div className="field">
                          <label>Description</label>
                          <textarea
                            className="textarea"
                            onChange={(event) =>
                              setLectureEdits({
                                ...lectureEdits,
                                [lecture.id]: { ...edit, description: event.target.value }
                              })
                            }
                            value={edit?.description ?? ""}
                          />
                        </div>
                        <div className="field">
                          <label>Video URL</label>
                          <input
                            className="input"
                            onChange={(event) =>
                              setLectureEdits({
                                ...lectureEdits,
                                [lecture.id]: { ...edit, videoUrl: event.target.value }
                              })
                            }
                            value={edit?.videoUrl ?? ""}
                          />
                        </div>
                        {edit?.videoUrl ? (
                          <video className="thumbnail" controls src={edit.videoUrl} style={{ width: 260 }} />
                        ) : null}
                        <div className="actions">
                          <button className="button" disabled={busy} onClick={() => void saveLecture(lecture.id)} type="button">
                            <Save size={15} />
                            Save
                          </button>
                          <button
                            className="button danger"
                            disabled={busy}
                            onClick={() => void deleteLecture(lecture.id)}
                            type="button"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <div className="divider" />
                        <strong>Steps</strong>
                        {lecture.steps?.map((step) => {
                          const stepEdit = stepEdits[step.id];
                          return (
                            <div className="item-row" key={step.id}>
                              <div className="grid cols-3">
                                <input
                                  className="input"
                                  onChange={(event) =>
                                    setStepEdits({
                                      ...stepEdits,
                                      [step.id]: { ...stepEdit, title: event.target.value }
                                    })
                                  }
                                  value={stepEdit?.title ?? ""}
                                />
                                <input
                                  className="input"
                                  onChange={(event) =>
                                    setStepEdits({
                                      ...stepEdits,
                                      [step.id]: { ...stepEdit, sortOrder: event.target.value }
                                    })
                                  }
                                  type="number"
                                  value={stepEdit?.sortOrder ?? ""}
                                />
                                <div className="actions">
                                  <button className="button" disabled={busy} onClick={() => void saveStep(step.id)} type="button">
                                    <Save size={15} />
                                  </button>
                                  <button
                                    className="button danger"
                                    disabled={busy}
                                    onClick={() => void deleteStep(step.id)}
                                    type="button"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </div>
                              <textarea
                                className="textarea"
                                onChange={(event) =>
                                  setStepEdits({
                                    ...stepEdits,
                                    [step.id]: { ...stepEdit, description: event.target.value }
                                  })
                                }
                                value={stepEdit?.description ?? ""}
                              />
                            </div>
                          );
                        })}
                        <form className="grid cols-3" onSubmit={(event) => void addStep(event, lecture.id)}>
                          <input
                            className="input"
                            onChange={(event) =>
                              setNewStepByLecture({
                                ...newStepByLecture,
                                [lecture.id]: {
                                  ...(newStepByLecture[lecture.id] ?? {
                                    description: "",
                                    sortOrder: ""
                                  }),
                                  title: event.target.value
                                }
                              })
                            }
                            placeholder="New step"
                            value={newStepByLecture[lecture.id]?.title ?? ""}
                          />
                          <input
                            className="input"
                            onChange={(event) =>
                              setNewStepByLecture({
                                ...newStepByLecture,
                                [lecture.id]: {
                                  ...(newStepByLecture[lecture.id] ?? {
                                    title: "",
                                    description: ""
                                  }),
                                  sortOrder: event.target.value
                                }
                              })
                            }
                            placeholder="Sort"
                            type="number"
                            value={newStepByLecture[lecture.id]?.sortOrder ?? ""}
                          />
                          <button className="button" disabled={busy} type="submit">
                            <Plus size={15} />
                            Add step
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <strong>Daily tasks</strong>
                <span className="badge neutral">{course?.dailyTasks?.length ?? 0}</span>
              </div>
              <div className="panel-body compact">
                {course?.dailyTasks?.map((task) => {
                  const edit = taskEdits[task.id];
                  return (
                    <div className="item-row" key={task.id}>
                      <div className="grid cols-3">
                        <input
                          className="input"
                          onChange={(event) =>
                            setTaskEdits({
                              ...taskEdits,
                              [task.id]: { ...edit, title: event.target.value }
                            })
                          }
                          value={edit?.title ?? ""}
                        />
                        <input
                          className="input"
                          min="1"
                          onChange={(event) =>
                            setTaskEdits({
                              ...taskEdits,
                              [task.id]: { ...edit, dayNumber: event.target.value }
                            })
                          }
                          type="number"
                          value={edit?.dayNumber ?? ""}
                        />
                        <div className="actions">
                          <button className="button" disabled={busy} onClick={() => void saveTask(task.id)} type="button">
                            <Save size={15} />
                          </button>
                          <button
                            className="button danger"
                            disabled={busy}
                            onClick={() => void deleteTask(task.id)}
                            type="button"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                      <textarea
                        className="textarea"
                        onChange={(event) =>
                          setTaskEdits({
                            ...taskEdits,
                            [task.id]: { ...edit, description: event.target.value }
                          })
                        }
                        value={edit?.description ?? ""}
                      />
                    </div>
                  );
                })}
                <form className="form" onSubmit={addTask}>
                  <div className="grid cols-2">
                    <div className="field">
                      <label>Task title</label>
                      <input
                        className="input"
                        onChange={(event) => setNewTask({ ...newTask, title: event.target.value })}
                        required
                        value={newTask.title}
                      />
                    </div>
                    <div className="field">
                      <label>Day number</label>
                      <input
                        className="input"
                        min="1"
                        onChange={(event) => setNewTask({ ...newTask, dayNumber: event.target.value })}
                        required
                        type="number"
                        value={newTask.dayNumber}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label>Description</label>
                    <textarea
                      className="textarea"
                      onChange={(event) => setNewTask({ ...newTask, description: event.target.value })}
                      value={newTask.description}
                    />
                  </div>
                  <button className="button" disabled={busy} type="submit">
                    <Plus size={16} />
                    Add task
                  </button>
                </form>
              </div>
            </div>
          </section>
        </div>
      </AdminShell>
    </RequireAuth>
  );
}
