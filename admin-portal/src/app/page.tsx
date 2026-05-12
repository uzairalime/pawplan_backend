"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  CircleOff,
  Dog,
  MessageSquareQuote,
  ShieldOff,
  TrendingUp,
  Users
} from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { RequireAuth } from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { getSession } from "@/lib/session";
import type { CatalogItem, Course, DashboardStats, PaginatedResponse, Quote } from "@/types/api";

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [catalogCounts, setCatalogCounts] = useState({ breeds: 0, goals: 0, quotes: 0 });
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [role, setRole] = useState<"SUPER_ADMIN" | "ADMIN" | null>(null);

  async function load() {
    const session = getSession();
    if (!session) return;

    setRole(session.admin.role);

    const courseData = await api.get<PaginatedResponse<Course, "courses">>(
      session.token,
      "/api/admin/courses?page=1&limit=12"
    );
    setCourses(courseData.courses);

    if (session.admin.role === "SUPER_ADMIN") {
      const [breedData, goalData, quoteData] = await Promise.all([
        api.get<PaginatedResponse<CatalogItem, "breeds">>(session.token, "/api/breeds?page=1&limit=1"),
        api.get<PaginatedResponse<CatalogItem, "trainingGoals">>(
          session.token,
          "/api/training-goals?page=1&limit=1"
        ),
        api.get<PaginatedResponse<Quote, "quotes">>(session.token, "/api/admin/quotes?page=1&limit=1")
      ]);
      const dashboardData = await api.get<{ stats: DashboardStats }>(
        session.token,
        "/api/admin/dashboard-stats"
      );

      setCatalogCounts({
        breeds: breedData.meta.total,
        goals: goalData.meta.total,
        quotes: quoteData.meta.total
      });
      setStats(dashboardData.stats);
      return;
    }

    setCatalogCounts({ breeds: 0, goals: 0, quotes: 0 });
  }

  useEffect(() => {
    void load();
  }, []);

  const offlineCount = useMemo(
    () => courses.filter((course) => !course.isPublished && !course.deletedAt).length,
    [courses]
  );

  const pendingReviewCount = useMemo(
    () => courses.filter((course) => course.approvalStatus === "PENDING_REVIEW").length,
    [courses]
  );

  const rejectedCount = useMemo(
    () => courses.filter((course) => course.approvalStatus === "REJECTED").length,
    [courses]
  );

  return (
    <RequireAuth>
      <AdminShell>
        <div className="topbar">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="subtle">Operational overview for PawPlan content.</p>
          </div>
        </div>
        <section className="grid cols-4">
          <div className="panel stat">
            <BookOpen color="var(--brand)" />
            <strong>{courses.length}</strong>
            <span className="subtle">{role === "SUPER_ADMIN" ? "Courses" : "My courses"}</span>
          </div>
          <div className="panel stat">
            <CircleOff color="var(--warning)" />
            <strong>{role === "SUPER_ADMIN" ? offlineCount : pendingReviewCount}</strong>
            <span className="subtle">{role === "SUPER_ADMIN" ? "Offline" : "Pending review"}</span>
          </div>
          <div className="panel stat">
            <Dog color="var(--brand)" />
            <strong>{role === "SUPER_ADMIN" ? catalogCounts.breeds + catalogCounts.goals : rejectedCount}</strong>
            <span className="subtle">{role === "SUPER_ADMIN" ? "Catalog items" : "Rejected"}</span>
          </div>
          <div className="panel stat">
            <MessageSquareQuote color="var(--brand)" />
            <strong>{role === "SUPER_ADMIN" ? catalogCounts.quotes : offlineCount}</strong>
            <span className="subtle">{role === "SUPER_ADMIN" ? "Quotes" : "Draft or offline"}</span>
          </div>
        </section>
        {role === "SUPER_ADMIN" && stats ? (
          <>
          <section className="grid cols-3" style={{ marginTop: 16 }}>
            <div className="panel stat">
              <Users color="var(--brand)" />
              <strong>{stats.userCount}</strong>
              <span className="subtle">Users</span>
            </div>
            <div className="panel stat">
              <strong>{stats.enrollmentCount}</strong>
              <span className="subtle">Joined courses</span>
            </div>
            <div className="panel stat">
              <strong>{stats.completionCount}</strong>
              <span className="subtle">Completed courses</span>
            </div>
          </section>
          <section className="grid cols-4" style={{ marginTop: 16 }}>
            <div className="panel stat">
              <ShieldOff color="var(--warning)" />
              <strong>{stats.frozenTrainerCount}</strong>
              <span className="subtle">Frozen trainers</span>
            </div>
            <div className="panel stat">
              <CircleOff color="var(--warning)" />
              <strong>{stats.frozenCourseCount}</strong>
              <span className="subtle">Frozen courses</span>
            </div>
            <div className="panel stat">
              <AlertTriangle color="var(--secondary)" />
              <strong>{stats.openReportCount}</strong>
              <span className="subtle">Open reports</span>
            </div>
            <div className="panel stat">
              <BookOpen color="var(--brand)" />
              <strong>{stats.premiumCourseCount}</strong>
              <span className="subtle">Premium-ready courses</span>
            </div>
          </section>
          <section className="grid cols-4" style={{ marginTop: 16 }}>
            <div className="panel stat">
              <TrendingUp color="var(--brand)" />
              <strong>{stats.newUsersLast7Days}</strong>
              <span className="subtle">New users in 7 days</span>
            </div>
            <div className="panel stat">
              <BookOpen color="var(--brand)" />
              <strong>{stats.newEnrollmentsLast7Days}</strong>
              <span className="subtle">Enrollments in 7 days</span>
            </div>
            <div className="panel stat">
              <AlertTriangle color="var(--secondary)" />
              <strong>{stats.newReportsLast7Days}</strong>
              <span className="subtle">Reports in 7 days</span>
            </div>
            <div className="panel stat">
              <CircleOff color="var(--warning)" />
              <strong>{stats.newCoursesLast7Days}</strong>
              <span className="subtle">Courses created in 7 days</span>
            </div>
          </section>
          <section className="panel" style={{ marginTop: 16 }}>
            <div className="panel-header">
              <strong>Top trainers</strong>
              <span className="badge neutral">{stats.topTrainers.length}</span>
            </div>
            <div className="scroll-x">
              <table className="table">
                <thead>
                  <tr>
                    <th>Trainer</th>
                    <th>Courses</th>
                    <th>Joined</th>
                    <th>Views</th>
                    <th>Reports</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topTrainers.map((trainer) => (
                    <tr key={trainer.id}>
                      <td>
                        <strong>{trainer.name || trainer.email}</strong>
                        <div className="muted-row">{trainer.expertise || "-"}</div>
                      </td>
                      <td>{trainer.courseCount}</td>
                      <td>{trainer.enrollmentCount}</td>
                      <td>{trainer.totalViews}</td>
                      <td>{trainer.reportCount}</td>
                      <td>
                        <span className={trainer.isFrozen ? "badge deleted" : trainer.isActive ? "badge" : "badge offline"}>
                          {trainer.isFrozen ? "Frozen" : trainer.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="panel" style={{ marginTop: 16 }}>
            <div className="panel-header">
              <strong>Top courses in 7 days</strong>
              <span className="badge neutral">{stats.topCoursesLast7Days.length}</span>
            </div>
            <div className="scroll-x">
              <table className="table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Trainer</th>
                    <th>Enrollments</th>
                    <th>Views</th>
                    <th>Reports</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topCoursesLast7Days.map((course) => (
                    <tr key={course.id}>
                      <td>
                        <strong>{course.title}</strong>
                        <div className="muted-row">{course.category || "-"}</div>
                      </td>
                      <td>{course.trainerName}</td>
                      <td>{course.enrollmentCount}</td>
                      <td>{course.viewCount}</td>
                      <td>{course.reportCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          </>
        ) : null}
      </AdminShell>
    </RequireAuth>
  );
}
